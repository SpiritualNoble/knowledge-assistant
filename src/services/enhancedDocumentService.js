// 增强的文档服务 - 集成存储抽象层和嵌入模型
import storageManager from './storageAdapter';
import embeddingService from './embeddingService';

class EnhancedDocumentService {
  constructor() {
    this.initialized = false;
  }

  // 初始化服务
  async init() {
    if (this.initialized) return;
    
    try {
      console.log('Initializing enhanced document service...');
      
      // 并行初始化存储和嵌入服务
      await Promise.all([
        storageManager.init(),
        embeddingService.init().catch(error => {
          console.warn('Embedding service init failed, will use fallback:', error);
        })
      ]);
      
      this.initialized = true;
      console.log('Enhanced document service initialized');
    } catch (error) {
      console.error('Failed to initialize enhanced document service:', error);
      throw error;
    }
  }

  // 保存文档（增强版）
  async saveDocument(file, metadata, userId) {
    if (!this.initialized) await this.init();
    
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
      contentType: file.type,
      processed: false
    };

    // 提取文档内容
    let content = '';
    try {
      content = await this.extractContent(file);
    } catch (error) {
      console.warn('Content extraction failed:', error);
      content = `${document.title} ${document.filename} ${document.tags.join(' ')}`;
    }

    // 异步处理嵌入向量（不阻塞保存）
    this.processDocumentEmbedding(docId, content, userId).catch(error => {
      console.warn('Embedding processing failed:', error);
    });

    // 保存到存储
    await storageManager.saveDocument(document, content, userId);
    
    return document;
  }

  // 异步处理文档嵌入
  async processDocumentEmbedding(docId, content, userId) {
    try {
      // 分块处理长文档
      const chunks = this.splitIntoChunks(content, 500);
      const embeddings = await embeddingService.embedBatch(chunks);
      
      // 保存嵌入向量
      const embeddingData = {
        docId,
        chunks,
        embeddings,
        processedAt: new Date().toISOString()
      };
      
      await this.saveEmbeddings(docId, embeddingData, userId);
      
      // 更新文档处理状态
      await this.updateDocumentStatus(docId, { processed: true }, userId);
      
      console.log(`Document ${docId} embedding processed successfully`);
    } catch (error) {
      console.error('Embedding processing failed:', error);
    }
  }

  // 内容提取
  async extractContent(file) {
    const fileType = file.type;
    const fileName = file.name.toLowerCase();
    
    if (fileType.startsWith('text/') || fileName.endsWith('.md') || fileName.endsWith('.txt')) {
      return await file.text();
    } else if (fileName.endsWith('.json')) {
      const jsonContent = await file.text();
      try {
        const parsed = JSON.parse(jsonContent);
        return JSON.stringify(parsed, null, 2);
      } catch {
        return jsonContent;
      }
    } else if (fileName.endsWith('.csv')) {
      return await file.text();
    } else {
      // 对于其他文件类型，返回元数据
      return `文件名: ${file.name}\n大小: ${file.size} 字节\n类型: ${file.type}`;
    }
  }

  // 文本分块
  splitIntoChunks(text, chunkSize = 500, overlap = 50) {
    const chunks = [];
    const sentences = text.split(/[.!?。！？]\s+/);
    let currentChunk = '';
    
    for (const sentence of sentences) {
      if (currentChunk.length + sentence.length > chunkSize && currentChunk.length > 0) {
        chunks.push(currentChunk.trim());
        
        // 保留重叠部分
        const words = currentChunk.split(' ');
        currentChunk = words.slice(-overlap).join(' ') + ' ' + sentence;
      } else {
        currentChunk += (currentChunk ? ' ' : '') + sentence;
      }
    }
    
    if (currentChunk.trim()) {
      chunks.push(currentChunk.trim());
    }
    
    return chunks.length > 0 ? chunks : [text];
  }

  // 保存嵌入向量
  async saveEmbeddings(docId, embeddingData, userId) {
    // 这里可以扩展到不同的存储后端
    const key = `embeddings_${docId}`;
    localStorage.setItem(key, JSON.stringify(embeddingData));
  }

  // 获取嵌入向量
  async getEmbeddings(docId) {
    const key = `embeddings_${docId}`;
    const data = localStorage.getItem(key);
    return data ? JSON.parse(data) : null;
  }

  // 更新文档状态
  async updateDocumentStatus(docId, updates, userId) {
    // 这里需要实现状态更新逻辑
    console.log(`Updating document ${docId} status:`, updates);
  }

  // 获取用户文档
  async getUserDocuments(userId) {
    if (!this.initialized) await this.init();
    return await storageManager.getDocuments(userId);
  }

  // 删除文档
  async deleteDocument(docId, userId) {
    if (!this.initialized) await this.init();
    
    // 删除嵌入向量
    const embeddingKey = `embeddings_${docId}`;
    localStorage.removeItem(embeddingKey);
    
    // 删除文档
    await storageManager.deleteDocument(docId, userId);
  }

  // 增强搜索（语义搜索 + 关键词搜索）
  async searchDocuments(query, userId, options = {}) {
    if (!this.initialized) await this.init();
    
    const {
      useSemanticSearch = true,
      useKeywordSearch = true,
      maxResults = 10,
      minScore = 0.1
    } = options;
    
    let results = [];
    
    // 语义搜索
    if (useSemanticSearch) {
      try {
        const semanticResults = await this.semanticSearch(query, userId);
        results.push(...semanticResults.map(r => ({ ...r, type: 'semantic' })));
      } catch (error) {
        console.warn('Semantic search failed:', error);
      }
    }
    
    // 关键词搜索
    if (useKeywordSearch) {
      try {
        const keywordResults = await storageManager.searchDocuments(query, userId);
        results.push(...keywordResults.map(r => ({ ...r, type: 'keyword' })));
      } catch (error) {
        console.warn('Keyword search failed:', error);
      }
    }
    
    // 合并和去重结果
    const mergedResults = this.mergeSearchResults(results);
    
    // 过滤和排序
    return mergedResults
      .filter(result => result.score >= minScore)
      .sort((a, b) => b.score - a.score)
      .slice(0, maxResults);
  }

  // 语义搜索
  async semanticSearch(query, userId) {
    const documents = await this.getUserDocuments(userId);
    const results = [];
    
    for (const doc of documents) {
      const embeddingData = await this.getEmbeddings(doc.id);
      if (!embeddingData) continue;
      
      // 对每个文档块进行语义搜索
      const queryEmbedding = await embeddingService.embed(query);
      let bestScore = 0;
      let bestChunk = '';
      
      for (let i = 0; i < embeddingData.chunks.length; i++) {
        const chunkEmbedding = embeddingData.embeddings[i];
        const similarity = embeddingService.cosineSimilarity(queryEmbedding, chunkEmbedding);
        
        if (similarity > bestScore) {
          bestScore = similarity;
          bestChunk = embeddingData.chunks[i];
        }
      }
      
      if (bestScore > 0.3) { // 语义相似度阈值
        results.push({
          id: doc.id,
          content: bestChunk,
          metadata: {
            source: doc.filename,
            title: doc.title,
            category: doc.category,
            tags: doc.tags,
            uploadedAt: doc.uploadedAt
          },
          score: bestScore
        });
      }
    }
    
    return results;
  }

  // 合并搜索结果
  mergeSearchResults(results) {
    const merged = new Map();
    
    for (const result of results) {
      const existing = merged.get(result.id);
      
      if (existing) {
        // 合并分数（语义搜索权重更高）
        const semanticWeight = result.type === 'semantic' ? 0.7 : 0.3;
        const keywordWeight = result.type === 'keyword' ? 0.7 : 0.3;
        
        existing.score = Math.max(
          existing.score,
          result.score * (result.type === 'semantic' ? semanticWeight : keywordWeight)
        );
        
        // 合并内容（选择更相关的）
        if (result.score > existing.originalScore) {
          existing.content = result.content;
          existing.originalScore = result.score;
        }
      } else {
        merged.set(result.id, {
          ...result,
          originalScore: result.score
        });
      }
    }
    
    return Array.from(merged.values());
  }

  // 文档聚类分析
  async clusterDocuments(userId, numClusters = 5) {
    if (!this.initialized) await this.init();
    
    const documents = await this.getUserDocuments(userId);
    const documentsWithEmbeddings = [];
    
    // 收集有嵌入向量的文档
    for (const doc of documents) {
      const embeddingData = await this.getEmbeddings(doc.id);
      if (embeddingData && embeddingData.embeddings.length > 0) {
        // 使用第一个块的嵌入作为文档代表
        documentsWithEmbeddings.push({
          ...doc,
          embedding: embeddingData.embeddings[0],
          content: embeddingData.chunks[0]
        });
      }
    }
    
    if (documentsWithEmbeddings.length < 2) {
      return [documentsWithEmbeddings];
    }
    
    return await embeddingService.clusterDocuments(documentsWithEmbeddings, numClusters);
  }

  // 获取文档统计信息
  async getDocumentStats(userId) {
    if (!this.initialized) await this.init();
    
    const documents = await this.getUserDocuments(userId);
    const totalSize = documents.reduce((sum, doc) => sum + doc.size, 0);
    
    // 分类统计
    const categories = {};
    documents.forEach(doc => {
      categories[doc.category] = (categories[doc.category] || 0) + 1;
    });
    
    // 处理状态统计
    const processedCount = documents.filter(doc => doc.processed).length;
    
    // 最近上传
    const recentUploads = documents
      .sort((a, b) => new Date(b.uploadedAt) - new Date(a.uploadedAt))
      .slice(0, 5);
    
    return {
      totalDocuments: documents.length,
      totalSize,
      categories,
      processedDocuments: processedCount,
      processingProgress: documents.length > 0 ? processedCount / documents.length : 0,
      recentUploads
    };
  }

  // 导出数据
  async exportUserData(userId, format = 'json') {
    if (!this.initialized) await this.init();
    
    const documents = await this.getUserDocuments(userId);
    const exportData = {
      exportedAt: new Date().toISOString(),
      userId,
      documents: documents.map(doc => ({
        ...doc,
        // 不包含敏感信息
        userId: undefined
      }))
    };
    
    if (format === 'json') {
      return JSON.stringify(exportData, null, 2);
    } else if (format === 'csv') {
      return this.convertToCSV(exportData.documents);
    }
    
    throw new Error(`Unsupported export format: ${format}`);
  }

  // 转换为CSV格式
  convertToCSV(documents) {
    if (documents.length === 0) return '';
    
    const headers = ['id', 'filename', 'title', 'size', 'category', 'tags', 'uploadedAt', 'contentType'];
    const csvRows = [headers.join(',')];
    
    for (const doc of documents) {
      const row = headers.map(header => {
        let value = doc[header];
        if (Array.isArray(value)) value = value.join(';');
        if (typeof value === 'string') value = `"${value.replace(/"/g, '""')}"`;
        return value || '';
      });
      csvRows.push(row.join(','));
    }
    
    return csvRows.join('\n');
  }
}

// 导出单例
const enhancedDocumentService = new EnhancedDocumentService();
export default enhancedDocumentService;
