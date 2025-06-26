// 简单文档服务 - 确保基本功能可用
class SimpleDocumentService {
  constructor() {
    this.storageKey = 'knowledge_documents'; // 使用与openaiService相同的存储键
  }

  // 添加文档 (兼容aiServiceSelector接口)
  async addDocumentFromData(document) {
    try {
      const newDoc = {
        id: Date.now().toString(),
        userId: document.userId,
        filename: document.title,
        title: document.title,
        content: document.content,
        category: document.category || 'general',
        tags: document.tags || [],
        uploadedAt: new Date().toISOString(),
        source: document.source || 'manual'
      };

      // 保存到localStorage
      const existing = this.getStoredDocuments();
      existing.push(newDoc);
      localStorage.setItem(this.storageKey, JSON.stringify(existing));

      console.log('✅ 文档添加成功:', newDoc.title);
      return { success: true, document: newDoc };
    } catch (error) {
      console.error('❌ 添加文档失败:', error);
      return { success: false, error: error.message };
    }
  }

  // 添加文档 (从文件)
  async addDocument(file, metadata, userId) {
    console.log('📄 添加文档:', file.name);
    
    try {
      const content = await file.text();
      const docId = Date.now().toString();
      
      const document = {
        id: docId,
        userId,
        filename: file.name,
        title: metadata.title || file.name,
        content,
        category: metadata.category || 'general',
        tags: metadata.tags || [],
        uploadedAt: new Date().toISOString(),
        size: file.size
      };
      
      // 保存到localStorage
      const existing = this.getStoredDocuments();
      existing.push(document);
      localStorage.setItem(this.storageKey, JSON.stringify(existing));
      
      console.log('✅ 文档保存成功');
      return document;
      
    } catch (error) {
      console.error('❌ 文档保存失败:', error);
      throw error;
    }
  }

  // 获取用户文档 (兼容aiServiceSelector接口)
  async getDocuments(userId) {
    return await this.getUserDocuments(userId);
  }

  // 获取用户文档
  async getUserDocuments(userId) {
    const allDocs = this.getStoredDocuments();
    return allDocs.filter(doc => doc.userId === userId);
  }

  // 搜索文档 (兼容aiServiceSelector接口)
  async searchDocuments(query, options = {}) {
    const { userId } = options;
    return await this.search(query, userId);
  }

  // 搜索文档
  async search(query, userId) {
    console.log('🔍 搜索:', query);
    
    const userDocs = await this.getUserDocuments(userId);
    if (userDocs.length === 0) {
      return {
        results: [],
        answer: '请先上传文档到知识库',
        confidence: 0
      };
    }

    const results = [];
    const queryLower = query.toLowerCase();
    
    for (const doc of userDocs) {
      let score = 0;
      let matchedContent = '';
      
      // 标题匹配
      if (doc.title.toLowerCase().includes(queryLower)) {
        score += 0.8;
        matchedContent = `标题匹配: ${doc.title}`;
      }
      
      // 内容匹配
      const contentLower = doc.content.toLowerCase();
      if (contentLower.includes(queryLower)) {
        score += 0.6;
        
        // 提取相关片段
        const sentences = doc.content.split(/[。！？.!?]/).filter(s => s.trim().length > 5);
        const matchingSentences = sentences.filter(s => 
          s.toLowerCase().includes(queryLower)
        );
        
        if (matchingSentences.length > 0) {
          matchedContent = matchingSentences.slice(0, 2).join('。') + '。';
        } else {
          // 如果没有完整句子匹配，提取包含关键词的段落
          const index = contentLower.indexOf(queryLower);
          const start = Math.max(0, index - 50);
          const end = Math.min(doc.content.length, index + 150);
          matchedContent = doc.content.substring(start, end) + '...';
        }
      }
      
      // 特殊处理"怎么创建人设"
      if (queryLower.includes('怎么') && queryLower.includes('创建') && queryLower.includes('人设')) {
        if (doc.content.includes('创建人设') || doc.content.includes('人设创建') || doc.content.includes('角色设定')) {
          score = Math.max(score, 0.9);
          
          // 查找相关步骤
          const lines = doc.content.split('\n');
          const relevantLines = [];
          
          for (let i = 0; i < lines.length; i++) {
            const line = lines[i];
            if (line.includes('创建人设') || line.includes('人设创建') || 
                line.includes('步骤') || line.includes('流程') ||
                line.match(/\d+[\.\、]/) || line.includes('点击') || line.includes('填写')) {
              relevantLines.push(line.trim());
              
              // 添加后续几行作为上下文
              for (let j = i + 1; j < Math.min(i + 3, lines.length); j++) {
                if (lines[j].trim()) {
                  relevantLines.push(lines[j].trim());
                }
              }
              break;
            }
          }
          
          if (relevantLines.length > 0) {
            matchedContent = relevantLines.join('\n');
          }
        }
      }
      
      if (score > 0.1) {
        results.push({
          id: doc.id,
          title: doc.title,
          content: matchedContent,
          score,
          docId: doc.id,
          docTitle: doc.title
        });
      }
    }
    
    // 排序
    results.sort((a, b) => b.score - a.score);
    
    // 生成答案
    let answer = '';
    if (results.length > 0) {
      const bestResult = results[0];
      if (queryLower.includes('怎么') || queryLower.includes('如何')) {
        answer = `根据文档《${bestResult.docTitle}》的内容：\n\n${bestResult.content}`;
      } else {
        answer = bestResult.content;
      }
    } else {
      answer = '在您的文档中没有找到相关信息。请尝试使用不同的关键词搜索。';
    }
    
    return {
      results: results.slice(0, 5),
      answer,
      confidence: results.length > 0 ? results[0].score : 0,
      totalFound: results.length
    };
  }

  // 删除文档
  async deleteDocument(docId, userId) {
    const allDocs = this.getStoredDocuments();
    const filteredDocs = allDocs.filter(doc => !(doc.id === docId && doc.userId === userId));
    localStorage.setItem(this.storageKey, JSON.stringify(filteredDocs));
  }

  // 获取存储的文档
  getStoredDocuments() {
    try {
      const stored = localStorage.getItem(this.storageKey);
      return stored ? JSON.parse(stored) : [];
    } catch (error) {
      console.error('读取存储文档失败:', error);
      return [];
    }
  }

  // 清空所有文档
  clearAllDocuments() {
    localStorage.removeItem(this.storageKey);
  }
}

// 导出单例
const simpleDocumentService = new SimpleDocumentService();
export default simpleDocumentService;
