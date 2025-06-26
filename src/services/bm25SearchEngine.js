// BM25搜索引擎 - 高性能关键词检索
class BM25SearchEngine {
  constructor() {
    this.documents = new Map(); // 文档存储
    this.invertedIndex = new Map(); // 倒排索引
    this.documentFreq = new Map(); // 文档频率
    this.avgDocLength = 0; // 平均文档长度
    this.totalDocs = 0;
    
    // BM25参数
    this.k1 = 1.5; // 词频饱和参数
    this.b = 0.75; // 长度归一化参数
    
    // 字段权重
    this.fieldWeights = {
      title: 3.0,
      tags: 2.0,
      filename: 1.5,
      content: 1.0
    };
    
    // 停用词
    this.stopWords = new Set([
      '的', '了', '在', '是', '我', '有', '和', '就', '不', '人', '都', '一', '个', '上', '也', '很', '到', '说', '要', '去', '你', '会', '着', '没有', '看', '好', '自己', '这样'
    ]);
  }

  // 添加文档到索引
  addDocument(docId, document) {
    const processedDoc = this.preprocessDocument(document);
    this.documents.set(docId, processedDoc);
    
    // 更新倒排索引
    this.updateInvertedIndex(docId, processedDoc);
    
    // 更新统计信息
    this.updateStats();
    
    console.log(`文档 ${docId} 已添加到BM25索引`);
  }

  // 预处理文档
  preprocessDocument(document) {
    const processed = {
      id: document.id,
      title: this.tokenize(document.title || ''),
      content: this.tokenize(document.content || ''),
      tags: document.tags ? document.tags.flatMap(tag => this.tokenize(tag)) : [],
      filename: this.tokenize(document.filename || ''),
      metadata: document.metadata || {}
    };

    // 计算文档长度（加权）
    processed.length = 
      processed.title.length * this.fieldWeights.title +
      processed.content.length * this.fieldWeights.content +
      processed.tags.length * this.fieldWeights.tags +
      processed.filename.length * this.fieldWeights.filename;

    return processed;
  }

  // 分词处理
  tokenize(text) {
    if (!text) return [];
    
    return text
      .toLowerCase()
      .replace(/[^\u4e00-\u9fa5a-zA-Z0-9\s]/g, ' ') // 保留中英文和数字
      .split(/\s+/)
      .filter(token => 
        token.length > 1 && 
        !this.stopWords.has(token) &&
        !/^\d+$/.test(token) // 过滤纯数字
      );
  }

  // 更新倒排索引
  updateInvertedIndex(docId, processedDoc) {
    const termFreqs = new Map();

    // 统计各字段的词频
    const fields = ['title', 'content', 'tags', 'filename'];
    
    for (const field of fields) {
      const tokens = processedDoc[field] || [];
      const weight = this.fieldWeights[field];
      
      for (const token of tokens) {
        if (!termFreqs.has(token)) {
          termFreqs.set(token, { total: 0, fields: {} });
        }
        
        const termData = termFreqs.get(token);
        termData.total += weight;
        termData.fields[field] = (termData.fields[field] || 0) + 1;
      }
    }

    // 更新倒排索引
    for (const [term, data] of termFreqs) {
      if (!this.invertedIndex.has(term)) {
        this.invertedIndex.set(term, new Map());
      }
      
      this.invertedIndex.get(term).set(docId, {
        tf: data.total,
        fields: data.fields,
        docLength: processedDoc.length
      });
    }

    // 更新文档频率
    for (const term of termFreqs.keys()) {
      this.documentFreq.set(term, (this.documentFreq.get(term) || 0) + 1);
    }
  }

  // 更新统计信息
  updateStats() {
    this.totalDocs = this.documents.size;
    
    if (this.totalDocs > 0) {
      const totalLength = Array.from(this.documents.values())
        .reduce((sum, doc) => sum + doc.length, 0);
      this.avgDocLength = totalLength / this.totalDocs;
    }
  }

  // BM25搜索
  search(query, options = {}) {
    const {
      topK = 10,
      filters = {},
      boost = {},
      minScore = 0.1
    } = options;

    const queryTerms = this.tokenize(query);
    if (queryTerms.length === 0) {
      return [];
    }

    const scores = new Map();

    // 计算每个查询词的BM25分数
    for (const term of queryTerms) {
      const termIndex = this.invertedIndex.get(term);
      if (!termIndex) continue;

      const df = this.documentFreq.get(term) || 0;
      const idf = Math.log((this.totalDocs - df + 0.5) / (df + 0.5));

      for (const [docId, termData] of termIndex) {
        const doc = this.documents.get(docId);
        if (!doc || !this.passesFilters(doc, filters)) continue;

        // BM25公式
        const tf = termData.tf;
        const docLength = termData.docLength;
        const normalizedTF = (tf * (this.k1 + 1)) / 
          (tf + this.k1 * (1 - this.b + this.b * (docLength / this.avgDocLength)));
        
        const score = idf * normalizedTF;
        
        // 应用字段权重提升
        let boostedScore = score;
        for (const [field, count] of Object.entries(termData.fields)) {
          if (boost[field]) {
            boostedScore += score * boost[field] * count;
          }
        }

        scores.set(docId, (scores.get(docId) || 0) + boostedScore);
      }
    }

    // 排序并返回结果
    const results = Array.from(scores.entries())
      .filter(([, score]) => score >= minScore)
      .sort(([, a], [, b]) => b - a)
      .slice(0, topK)
      .map(([docId, score]) => ({
        id: docId,
        score: Math.min(score / queryTerms.length, 1), // 归一化分数
        document: this.documents.get(docId),
        matchedTerms: this.getMatchedTerms(docId, queryTerms)
      }));

    return results;
  }

  // 过滤器检查
  passesFilters(doc, filters) {
    // 时间过滤
    if (filters.timeRange && filters.timeRange !== 'all') {
      const docDate = new Date(doc.metadata.uploadedAt || 0);
      const now = new Date();
      const diffDays = (now - docDate) / (1000 * 60 * 60 * 24);

      switch (filters.timeRange) {
        case 'recent':
          if (diffDays > 7) return false;
          break;
        case 'week':
          if (diffDays > 7) return false;
          break;
        case 'month':
          if (diffDays > 30) return false;
          break;
      }
    }

    // 文档类型过滤
    if (filters.docTypes && filters.docTypes.length > 0) {
      const docType = doc.metadata.category || 'general';
      if (!filters.docTypes.includes(docType)) return false;
    }

    // 标签过滤
    if (filters.tags && filters.tags.length > 0) {
      const docTags = doc.metadata.tags || [];
      const hasMatchingTag = filters.tags.some(tag => 
        docTags.some(docTag => docTag.toLowerCase().includes(tag.toLowerCase()))
      );
      if (!hasMatchingTag) return false;
    }

    return true;
  }

  // 获取匹配的词汇
  getMatchedTerms(docId, queryTerms) {
    const matched = [];
    const doc = this.documents.get(docId);
    
    for (const term of queryTerms) {
      const termIndex = this.invertedIndex.get(term);
      if (termIndex && termIndex.has(docId)) {
        const termData = termIndex.get(docId);
        matched.push({
          term,
          frequency: termData.tf,
          fields: Object.keys(termData.fields)
        });
      }
    }
    
    return matched;
  }

  // 删除文档
  removeDocument(docId) {
    const doc = this.documents.get(docId);
    if (!doc) return;

    // 从倒排索引中移除
    const allTerms = [
      ...doc.title,
      ...doc.content,
      ...doc.tags,
      ...doc.filename
    ];

    for (const term of new Set(allTerms)) {
      const termIndex = this.invertedIndex.get(term);
      if (termIndex) {
        termIndex.delete(docId);
        
        // 更新文档频率
        if (termIndex.size === 0) {
          this.invertedIndex.delete(term);
          this.documentFreq.delete(term);
        } else {
          this.documentFreq.set(term, termIndex.size);
        }
      }
    }

    // 删除文档
    this.documents.delete(docId);
    
    // 更新统计信息
    this.updateStats();
    
    console.log(`文档 ${docId} 已从BM25索引中删除`);
  }

  // 更新文档
  updateDocument(docId, document) {
    this.removeDocument(docId);
    this.addDocument(docId, document);
  }

  // 获取搜索建议
  getSuggestions(partialQuery, limit = 5) {
    const tokens = this.tokenize(partialQuery);
    if (tokens.length === 0) return [];

    const lastToken = tokens[tokens.length - 1];
    const suggestions = [];

    // 查找以最后一个token开头的词汇
    for (const term of this.invertedIndex.keys()) {
      if (term.startsWith(lastToken) && term !== lastToken) {
        const df = this.documentFreq.get(term) || 0;
        suggestions.push({ term, frequency: df });
      }
    }

    return suggestions
      .sort((a, b) => b.frequency - a.frequency)
      .slice(0, limit)
      .map(s => s.term);
  }

  // 获取热门词汇
  getPopularTerms(limit = 20) {
    return Array.from(this.documentFreq.entries())
      .sort(([, a], [, b]) => b - a)
      .slice(0, limit)
      .map(([term, freq]) => ({ term, frequency: freq }));
  }

  // 获取索引统计
  getIndexStats() {
    return {
      totalDocuments: this.totalDocs,
      totalTerms: this.invertedIndex.size,
      avgDocLength: this.avgDocLength,
      indexSize: this.calculateIndexSize()
    };
  }

  // 计算索引大小
  calculateIndexSize() {
    let size = 0;
    for (const termIndex of this.invertedIndex.values()) {
      size += termIndex.size;
    }
    return size;
  }

  // 导出索引（用于持久化）
  exportIndex() {
    return {
      documents: Array.from(this.documents.entries()),
      invertedIndex: Array.from(this.invertedIndex.entries()).map(([term, docMap]) => [
        term,
        Array.from(docMap.entries())
      ]),
      documentFreq: Array.from(this.documentFreq.entries()),
      stats: {
        avgDocLength: this.avgDocLength,
        totalDocs: this.totalDocs
      }
    };
  }

  // 导入索引
  importIndex(indexData) {
    this.documents = new Map(indexData.documents);
    
    this.invertedIndex = new Map(
      indexData.invertedIndex.map(([term, docArray]) => [
        term,
        new Map(docArray)
      ])
    );
    
    this.documentFreq = new Map(indexData.documentFreq);
    this.avgDocLength = indexData.stats.avgDocLength;
    this.totalDocs = indexData.stats.totalDocs;
    
    console.log('BM25索引导入完成');
  }

  // 清空索引
  clear() {
    this.documents.clear();
    this.invertedIndex.clear();
    this.documentFreq.clear();
    this.avgDocLength = 0;
    this.totalDocs = 0;
  }
}

// 导出单例
const bm25SearchEngine = new BM25SearchEngine();
export default bm25SearchEngine;
