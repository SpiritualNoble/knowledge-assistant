// 本地文档存储和搜索服务
// 使用IndexedDB存储文档，实现基本的文本搜索功能

class LocalDocumentService {
  constructor() {
    this.dbName = 'KnowledgeAssistantDB';
    this.version = 1;
    this.db = null;
  }

  // 初始化数据库
  async init() {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, this.version);
      
      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        this.db = request.result;
        resolve();
      };
      
      request.onupgradeneeded = (event) => {
        const db = event.target.result;
        
        // 创建文档存储
        if (!db.objectStoreNames.contains('documents')) {
          const documentStore = db.createObjectStore('documents', { keyPath: 'id' });
          documentStore.createIndex('userId', 'userId', { unique: false });
          documentStore.createIndex('title', 'title', { unique: false });
          documentStore.createIndex('category', 'category', { unique: false });
          documentStore.createIndex('uploadedAt', 'uploadedAt', { unique: false });
        }
        
        // 创建文档内容存储（用于搜索）
        if (!db.objectStoreNames.contains('documentContent')) {
          const contentStore = db.createObjectStore('documentContent', { keyPath: 'docId' });
          contentStore.createIndex('content', 'content', { unique: false });
        }
      };
    });
  }

  // 保存文档
  async saveDocument(file, metadata, userId) {
    if (!this.db) await this.init();
    
    const docId = crypto.randomUUID();
    const document = {
      id: docId,
      userId: userId,
      filename: file.name,
      title: metadata.title || file.name,
      size: file.size,
      category: metadata.category || 'general',
      tags: metadata.tags || [],
      uploadedAt: new Date().toISOString(),
      contentType: file.type
    };

    // 读取文件内容
    let content = '';
    try {
      if (file.type.startsWith('text/') || file.type === 'application/json') {
        content = await file.text();
      } else if (file.name.endsWith('.md')) {
        content = await file.text();
      } else {
        // 对于其他文件类型，使用文件名和元数据作为可搜索内容
        content = `${document.title} ${document.filename} ${document.tags.join(' ')}`;
      }
    } catch (error) {
      console.warn('无法读取文件内容:', error);
      content = `${document.title} ${document.filename} ${document.tags.join(' ')}`;
    }

    const transaction = this.db.transaction(['documents', 'documentContent'], 'readwrite');
    
    // 保存文档元数据
    await new Promise((resolve, reject) => {
      const request = transaction.objectStore('documents').add(document);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });

    // 保存文档内容
    await new Promise((resolve, reject) => {
      const request = transaction.objectStore('documentContent').add({
        docId: docId,
        content: content.toLowerCase(), // 转换为小写便于搜索
        originalContent: content
      });
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });

    return document;
  }

  // 获取用户的所有文档
  async getUserDocuments(userId) {
    if (!this.db) await this.init();
    
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction(['documents'], 'readonly');
      const store = transaction.objectStore('documents');
      const index = store.index('userId');
      const request = index.getAll(userId);
      
      request.onsuccess = () => {
        const documents = request.result.sort((a, b) => 
          new Date(b.uploadedAt) - new Date(a.uploadedAt)
        );
        resolve(documents);
      };
      request.onerror = () => reject(request.error);
    });
  }

  // 删除文档
  async deleteDocument(docId) {
    if (!this.db) await this.init();
    
    const transaction = this.db.transaction(['documents', 'documentContent'], 'readwrite');
    
    await Promise.all([
      new Promise((resolve, reject) => {
        const request = transaction.objectStore('documents').delete(docId);
        request.onsuccess = () => resolve();
        request.onerror = () => reject(request.error);
      }),
      new Promise((resolve, reject) => {
        const request = transaction.objectStore('documentContent').delete(docId);
        request.onsuccess = () => resolve();
        request.onerror = () => reject(request.error);
      })
    ]);
  }

  // 搜索文档
  async searchDocuments(query, userId) {
    if (!this.db) await this.init();
    if (!query.trim()) return [];

    const searchTerms = query.toLowerCase().split(' ').filter(term => term.length > 0);
    
    // 获取用户的所有文档
    const userDocuments = await this.getUserDocuments(userId);
    const docIds = userDocuments.map(doc => doc.id);
    
    // 搜索文档内容
    const contentResults = await new Promise((resolve, reject) => {
      const transaction = this.db.transaction(['documentContent'], 'readonly');
      const store = transaction.objectStore('documentContent');
      const request = store.getAll();
      
      request.onsuccess = () => {
        const allContent = request.result;
        const matchingContent = allContent.filter(item => {
          // 只搜索当前用户的文档
          if (!docIds.includes(item.docId)) return false;
          
          // 检查是否包含搜索词
          return searchTerms.some(term => 
            item.content.includes(term)
          );
        });
        resolve(matchingContent);
      };
      request.onerror = () => reject(request.error);
    });

    // 计算相关性分数并组合结果
    const results = [];
    for (const contentItem of contentResults) {
      const document = userDocuments.find(doc => doc.id === contentItem.docId);
      if (!document) continue;

      // 计算相关性分数
      let score = 0;
      const content = contentItem.content;
      
      searchTerms.forEach(term => {
        // 标题匹配权重更高
        if (document.title.toLowerCase().includes(term)) {
          score += 0.5;
        }
        // 内容匹配
        const matches = (content.match(new RegExp(term, 'g')) || []).length;
        score += matches * 0.1;
        // 标签匹配
        if (document.tags.some(tag => tag.toLowerCase().includes(term))) {
          score += 0.3;
        }
      });

      if (score > 0) {
        // 提取相关内容片段
        const snippet = this.extractSnippet(contentItem.originalContent, searchTerms);
        
        results.push({
          id: document.id,
          content: snippet,
          metadata: {
            source: document.filename,
            title: document.title,
            category: document.category,
            tags: document.tags,
            uploadedAt: document.uploadedAt
          },
          score: Math.min(score, 1) // 限制分数在0-1之间
        });
      }
    }

    // 按相关性分数排序
    return results.sort((a, b) => b.score - a.score).slice(0, 10); // 返回前10个结果
  }

  // 提取包含搜索词的内容片段
  extractSnippet(content, searchTerms, maxLength = 200) {
    if (!content) return '暂无内容预览';
    
    const lowerContent = content.toLowerCase();
    let bestPosition = 0;
    let maxMatches = 0;
    
    // 找到包含最多搜索词的位置
    for (let i = 0; i < content.length - maxLength; i += 50) {
      const snippet = lowerContent.substring(i, i + maxLength);
      const matches = searchTerms.reduce((count, term) => {
        return count + (snippet.includes(term) ? 1 : 0);
      }, 0);
      
      if (matches > maxMatches) {
        maxMatches = matches;
        bestPosition = i;
      }
    }
    
    let snippet = content.substring(bestPosition, bestPosition + maxLength);
    
    // 确保不在单词中间截断
    if (bestPosition > 0) {
      const spaceIndex = snippet.indexOf(' ');
      if (spaceIndex > 0) {
        snippet = snippet.substring(spaceIndex + 1);
      }
    }
    
    if (snippet.length >= maxLength) {
      const lastSpaceIndex = snippet.lastIndexOf(' ');
      if (lastSpaceIndex > maxLength * 0.8) {
        snippet = snippet.substring(0, lastSpaceIndex) + '...';
      }
    }
    
    return snippet || content.substring(0, maxLength) + '...';
  }

  // 获取搜索建议
  async getSearchSuggestions(query, userId, limit = 5) {
    if (!query.trim()) return [];
    
    const userDocuments = await this.getUserDocuments(userId);
    const suggestions = new Set();
    
    // 从文档标题中提取建议
    userDocuments.forEach(doc => {
      const title = doc.title.toLowerCase();
      if (title.includes(query.toLowerCase())) {
        suggestions.add(doc.title);
      }
      
      // 从标签中提取建议
      doc.tags.forEach(tag => {
        if (tag.toLowerCase().includes(query.toLowerCase())) {
          suggestions.add(tag);
        }
      });
    });
    
    return Array.from(suggestions).slice(0, limit);
  }

  // 获取统计信息
  async getStats(userId) {
    const documents = await this.getUserDocuments(userId);
    const totalSize = documents.reduce((sum, doc) => sum + doc.size, 0);
    const categories = {};
    
    documents.forEach(doc => {
      categories[doc.category] = (categories[doc.category] || 0) + 1;
    });
    
    return {
      totalDocuments: documents.length,
      totalSize: totalSize,
      categories: categories,
      recentUploads: documents.slice(0, 5)
    };
  }
}

// 创建全局实例
const localDocumentService = new LocalDocumentService();

export default localDocumentService;
