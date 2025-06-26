// RAG文档服务 - LLM驱动的智能搜索系统
import queryAnalyzer from './queryAnalyzer';
import bm25SearchEngine from './bm25SearchEngine';
import intelligentResponseGenerator from './intelligentResponseGenerator';
import embeddingService from './embeddingService';
import storageManager from './storageAdapter';
import documentSpecificSearch from './documentSpecificSearch';

class RAGDocumentService {
  constructor() {
    this.initialized = false;
    this.searchCache = new Map();
    this.performanceMetrics = {
      totalQueries: 0,
      avgResponseTime: 0,
      cacheHitRate: 0
    };
  }

  // 初始化RAG系统
  async init() {
    if (this.initialized) return;
    
    try {
      console.log('🚀 初始化LLM-RAG系统...');
      
      // 并行初始化各个组件
      await Promise.all([
        storageManager.init(),
        embeddingService.init().catch(error => {
          console.warn('嵌入服务初始化失败，将使用备用方案:', error);
        })
      ]);
      
      // 加载现有文档到BM25索引
      await this.loadExistingDocuments();
      
      this.initialized = true;
      console.log('✅ LLM-RAG系统初始化完成');
    } catch (error) {
      console.error('❌ RAG系统初始化失败:', error);
      throw error;
    }
  }

  // 加载现有文档到搜索引擎
  async loadExistingDocuments() {
    try {
      // 这里需要获取所有用户的文档，暂时跳过
      console.log('📚 BM25索引准备就绪');
    } catch (error) {
      console.warn('文档加载失败:', error);
    }
  }

  // 智能搜索主入口
  async intelligentSearch(query, userId, options = {}) {
    const startTime = Date.now();
    
    if (!this.initialized) await this.init();
    
    const {
      responseType = 'comprehensive',
      includeReferences = true,
      maxResults = 10,
      useCache = true
    } = options;

    try {
      // 检查缓存
      const cacheKey = this.generateSearchCacheKey(query, userId, options);
      if (useCache && this.searchCache.has(cacheKey)) {
        const cached = this.searchCache.get(cacheKey);
        if (Date.now() - cached.timestamp < 300000) { // 5分钟缓存
          this.updateMetrics(startTime, true);
          return cached.result;
        }
      }

      // 🎯 特殊处理：针对特定查询的优化搜索
      if (this.isSpecificQuery(query)) {
        console.log('🎯 使用专门优化的搜索逻辑');
        const specificResult = await this.performSpecificSearch(query, userId);
        if (specificResult && specificResult.results.length > 0) {
          const finalResult = {
            query,
            analysisResult: { intent: 'how_to', confidence: 0.95, searchType: 'specific' },
            answer: documentSpecificSearch.generateSpecificAnswer(query, specificResult.results),
            searchResults: specificResult.results,
            metadata: {
              totalResults: specificResult.results.length,
              responseTime: Date.now() - startTime,
              searchType: 'document_specific',
              confidence: 0.95
            }
          };

          // 缓存结果
          if (useCache) {
            this.searchCache.set(cacheKey, {
              result: finalResult,
              timestamp: Date.now()
            });
          }

          this.updateMetrics(startTime, false);
          return finalResult;
        }
      }

      // 1. 查询理解
      console.log('🧠 分析查询意图...');
      const analysisResult = await queryAnalyzer.analyzeQuery(query, {
        userId,
        userHistory: await this.getUserSearchHistory(userId),
        documentTypes: await this.getUserDocumentTypes(userId)
      });

      console.log('📋 查询分析结果:', analysisResult);

      // 2. 混合检索
      console.log('🔍 执行混合检索...');
      const searchResults = await this.performHybridSearch(
        analysisResult, 
        userId, 
        maxResults
      );

      // 3. 结果重排序
      const rerankedResults = this.reRankResults(searchResults, analysisResult);

      // 4. 生成智能回答
      console.log('💡 生成智能回答...');
      const intelligentResponse = await intelligentResponseGenerator.generateResponse(
        query,
        rerankedResults,
        analysisResult,
        { responseType, includeReferences }
      );

      // 5. 构建最终结果
      const finalResult = {
        query,
        analysisResult,
        answer: intelligentResponse,
        searchResults: rerankedResults.slice(0, 5), // 只返回前5个结果
        metadata: {
          totalResults: searchResults.length,
          responseTime: Date.now() - startTime,
          searchType: analysisResult.searchType,
          confidence: analysisResult.confidence
        }
      };

      // 缓存结果
      if (useCache) {
        this.searchCache.set(cacheKey, {
          result: finalResult,
          timestamp: Date.now()
        });
      }

      // 记录搜索历史
      await this.recordSearchHistory(userId, query, analysisResult);

      this.updateMetrics(startTime, false);
      return finalResult;

    } catch (error) {
      console.error('❌ 智能搜索失败:', error);
      
      // 降级到基础搜索
      const fallbackResults = await this.performBasicSearch(query, userId, maxResults);
      
      return {
        query,
        answer: '搜索过程中遇到问题，以下是基础搜索结果：',
        searchResults: fallbackResults,
        metadata: {
          totalResults: fallbackResults.length,
          responseTime: Date.now() - startTime,
          searchType: 'fallback',
          confidence: 0.5
        }
      };
    }
  }

  // 检查是否为特定查询
  isSpecificQuery(query) {
    const specificPatterns = [
      /怎么.*创建.*人设/,
      /如何.*创建.*角色/,
      /人设.*创建.*方法/,
      /角色.*设定.*步骤/,
      /短剧.*人物.*创建/
    ];

    return specificPatterns.some(pattern => pattern.test(query));
  }

  // 执行特定搜索
  async performSpecificSearch(query, userId) {
    try {
      // 使用文档特定搜索
      const specificResult = documentSpecificSearch.searchPersonaCreation(query);
      
      // 同时尝试从用户文档中搜索
      const userResults = await this.performBasicSearch(query, userId, 5);
      
      // 合并结果
      const combinedResults = [
        ...specificResult.results,
        ...userResults.map(r => ({ ...r, type: 'user_document' }))
      ];

      return {
        ...specificResult,
        results: combinedResults.slice(0, 10)
      };
    } catch (error) {
      console.warn('特定搜索失败:', error);
      return null;
    }
  }

  // 混合检索实现
  async performHybridSearch(analysisResult, userId, maxResults) {
    const { searchType, entities, filters } = analysisResult;
    let results = [];

    try {
      // 根据分析结果选择搜索策略
      switch (searchType) {
        case 'semantic':
          results = await this.performSemanticSearch(entities, userId, filters, maxResults);
          break;
        case 'keyword':
          results = await this.performKeywordSearch(entities, userId, filters, maxResults);
          break;
        case 'hybrid':
        default:
          // 并行执行语义搜索和关键词搜索
          const [semanticResults, keywordResults] = await Promise.all([
            this.performSemanticSearch(entities, userId, filters, Math.ceil(maxResults / 2)),
            this.performKeywordSearch(entities, userId, filters, Math.ceil(maxResults / 2))
          ]);
          
          results = this.mergeSearchResults(semanticResults, keywordResults, maxResults);
          break;
      }

      return results;
    } catch (error) {
      console.warn('混合检索失败，使用基础搜索:', error);
      return await this.performBasicSearch(entities.join(' '), userId, maxResults);
    }
  }

  // 语义搜索
  async performSemanticSearch(entities, userId, filters, maxResults) {
    try {
      const documents = await storageManager.getDocuments(userId);
      const results = [];
      
      if (entities.length === 0) return results;
      
      const queryText = entities.join(' ');
      const queryEmbedding = await embeddingService.embed(queryText);
      
      for (const doc of documents) {
        // 获取文档嵌入
        const embeddingData = await this.getDocumentEmbeddings(doc.id);
        if (!embeddingData) continue;
        
        // 应用过滤器
        if (!this.passesFilters(doc, filters)) continue;
        
        // 计算最佳匹配块
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
            score: bestScore,
            type: 'semantic',
            metadata: {
              source: doc.filename,
              title: doc.title,
              category: doc.category,
              tags: doc.tags,
              uploadedAt: doc.uploadedAt
            }
          });
        }
      }
      
      return results
        .sort((a, b) => b.score - a.score)
        .slice(0, maxResults);
        
    } catch (error) {
      console.warn('语义搜索失败:', error);
      return [];
    }
  }

  // 关键词搜索（使用BM25）
  async performKeywordSearch(entities, userId, filters, maxResults) {
    try {
      // 确保用户文档已加载到BM25索引
      await this.ensureUserDocumentsInBM25(userId);
      
      const query = entities.join(' ');
      const bm25Results = bm25SearchEngine.search(query, {
        topK: maxResults,
        filters,
        boost: {
          title: 2.0,
          tags: 1.5,
          filename: 1.2,
          content: 1.0
        }
      });
      
      return bm25Results.map(result => ({
        id: result.id,
        content: this.extractRelevantSnippet(result.document, entities),
        score: result.score,
        type: 'keyword',
        metadata: {
          source: result.document.metadata?.filename || result.document.filename,
          title: result.document.metadata?.title || result.document.title,
          category: result.document.metadata?.category || result.document.category,
          tags: result.document.metadata?.tags || result.document.tags,
          uploadedAt: result.document.metadata?.uploadedAt || result.document.uploadedAt
        },
        matchedTerms: result.matchedTerms
      }));
      
    } catch (error) {
      console.warn('BM25搜索失败:', error);
      return [];
    }
  }

  // 确保用户文档在BM25索引中
  async ensureUserDocumentsInBM25(userId) {
    try {
      const documents = await storageManager.getDocuments(userId);
      
      for (const doc of documents) {
        // 检查文档是否已在索引中
        if (!bm25SearchEngine.documents.has(doc.id)) {
          // 获取文档内容
          const content = await this.getDocumentContent(doc.id, userId);
          
          // 添加到BM25索引
          bm25SearchEngine.addDocument(doc.id, {
            id: doc.id,
            title: doc.title,
            content: content,
            tags: doc.tags,
            filename: doc.filename,
            metadata: doc
          });
        }
      }
    } catch (error) {
      console.warn('BM25索引更新失败:', error);
    }
  }

  // 获取文档内容
  async getDocumentContent(docId, userId) {
    try {
      const embeddingData = await this.getDocumentEmbeddings(docId);
      if (embeddingData && embeddingData.chunks) {
        return embeddingData.chunks.join(' ');
      }
      return '';
    } catch (error) {
      console.warn(`获取文档${docId}内容失败:`, error);
      return '';
    }
  }

  // 获取文档嵌入数据
  async getDocumentEmbeddings(docId) {
    try {
      const key = `embeddings_${docId}`;
      const data = localStorage.getItem(key);
      return data ? JSON.parse(data) : null;
    } catch (error) {
      return null;
    }
  }

  // 合并搜索结果
  mergeSearchResults(semanticResults, keywordResults, maxResults) {
    const merged = new Map();
    
    // 添加语义搜索结果（权重0.6）
    for (const result of semanticResults) {
      merged.set(result.id, {
        ...result,
        finalScore: result.score * 0.6,
        sources: ['semantic']
      });
    }
    
    // 添加关键词搜索结果（权重0.4）
    for (const result of keywordResults) {
      const existing = merged.get(result.id);
      if (existing) {
        // 合并分数
        existing.finalScore = Math.max(existing.finalScore, existing.score * 0.6 + result.score * 0.4);
        existing.sources.push('keyword');
        // 选择更好的内容片段
        if (result.score > existing.score) {
          existing.content = result.content;
        }
      } else {
        merged.set(result.id, {
          ...result,
          finalScore: result.score * 0.4,
          sources: ['keyword']
        });
      }
    }
    
    return Array.from(merged.values())
      .sort((a, b) => b.finalScore - a.finalScore)
      .slice(0, maxResults);
  }

  // 结果重排序
  reRankResults(results, analysisResult) {
    // 基于查询意图调整权重
    const intentWeights = {
      problem_solving: { recentDocs: 1.2, highScore: 1.1 },
      how_to: { stepByStep: 1.3, detailed: 1.1 },
      concept_explanation: { comprehensive: 1.2, authoritative: 1.1 },
      information_seeking: { relevant: 1.1, diverse: 1.0 }
    };
    
    const weights = intentWeights[analysisResult.intent] || intentWeights.information_seeking;
    
    return results.map(result => {
      let adjustedScore = result.finalScore || result.score;
      
      // 时间权重调整
      if (weights.recentDocs && result.metadata?.uploadedAt) {
        const daysSinceUpload = (Date.now() - new Date(result.metadata.uploadedAt)) / (1000 * 60 * 60 * 24);
        if (daysSinceUpload < 7) {
          adjustedScore *= weights.recentDocs;
        }
      }
      
      // 内容长度权重调整
      if (weights.detailed && result.content && result.content.length > 300) {
        adjustedScore *= weights.detailed;
      }
      
      return {
        ...result,
        adjustedScore
      };
    }).sort((a, b) => b.adjustedScore - a.adjustedScore);
  }

  // 基础搜索（备用方案）
  async performBasicSearch(query, userId, maxResults) {
    try {
      return await storageManager.searchDocuments(query, userId);
    } catch (error) {
      console.error('基础搜索也失败了:', error);
      return [];
    }
  }

  // 其他辅助方法...
  passesFilters(doc, filters) {
    // 实现过滤逻辑
    return true; // 简化实现
  }

  extractRelevantSnippet(document, entities) {
    // 提取相关片段
    const content = document.content || document.title || '';
    return content.substring(0, 200) + (content.length > 200 ? '...' : '');
  }

  generateSearchCacheKey(query, userId, options) {
    return btoa(query + userId + JSON.stringify(options)).substring(0, 32);
  }

  async getUserSearchHistory(userId) {
    // 获取用户搜索历史
    return [];
  }

  async getUserDocumentTypes(userId) {
    // 获取用户文档类型
    return ['general', 'technical', 'manual'];
  }

  async recordSearchHistory(userId, query, analysisResult) {
    // 记录搜索历史
    console.log(`记录搜索历史: ${userId} - ${query}`);
  }

  updateMetrics(startTime, cacheHit) {
    const responseTime = Date.now() - startTime;
    this.performanceMetrics.totalQueries++;
    this.performanceMetrics.avgResponseTime = 
      (this.performanceMetrics.avgResponseTime + responseTime) / 2;
    
    if (cacheHit) {
      this.performanceMetrics.cacheHitRate = 
        (this.performanceMetrics.cacheHitRate + 1) / 2;
    }
  }

  // 获取性能指标
  getPerformanceMetrics() {
    return this.performanceMetrics;
  }
}

// 导出单例
const ragDocumentService = new RAGDocumentService();
export default ragDocumentService;
