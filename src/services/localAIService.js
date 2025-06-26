// 本地AI服务 - 连接本地Qwen3-Embedding-8B模型
class LocalAIService {
  constructor() {
    this.baseURL = 'http://localhost:5001';
    this.isAvailable = false;
    this.checkAvailability();
  }

  // 检查本地AI服务是否可用
  async checkAvailability() {
    try {
      const response = await fetch(`${this.baseURL}/health`, {
        method: 'GET',
        timeout: 3000
      });
      
      if (response.ok) {
        const data = await response.json();
        this.isAvailable = data.model_loaded;
        console.log('🤖 本地AI服务状态:', data);
      }
    } catch (error) {
      this.isAvailable = false;
      console.log('⚠️ 本地AI服务不可用:', error.message);
    }
    
    return this.isAvailable;
  }

  // 添加文档到本地AI服务
  async addDocument(docId, title, content, userId) {
    if (!this.isAvailable) {
      throw new Error('本地AI服务不可用');
    }

    try {
      console.log('📄 向本地AI服务添加文档:', title);
      
      const response = await fetch(`${this.baseURL}/add_document`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          doc_id: docId,
          title,
          content,
          user_id: userId
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const result = await response.json();
      console.log('✅ 文档添加到本地AI服务成功');
      return result;

    } catch (error) {
      console.error('❌ 添加文档到本地AI服务失败:', error);
      throw error;
    }
  }

  // 使用本地AI进行语义搜索
  async search(query, userId, topK = 5) {
    if (!this.isAvailable) {
      throw new Error('本地AI服务不可用');
    }

    try {
      console.log('🔍 本地AI语义搜索:', query);
      
      const response = await fetch(`${this.baseURL}/search`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          query,
          user_id: userId,
          top_k: topK
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const result = await response.json();
      console.log('✅ 本地AI搜索完成，找到', result.total, '个结果');
      
      return {
        results: result.results.map(item => ({
          id: item.doc_id,
          title: item.title,
          content: item.content,
          score: item.score,
          titleSimilarity: item.title_similarity,
          contentSimilarity: item.content_similarity,
          type: 'ai_semantic'
        })),
        total: result.total,
        searchType: 'local_ai_semantic'
      };

    } catch (error) {
      console.error('❌ 本地AI搜索失败:', error);
      throw error;
    }
  }

  // 获取用户文档列表
  async getUserDocuments(userId) {
    if (!this.isAvailable) {
      return [];
    }

    try {
      const response = await fetch(`${this.baseURL}/documents/${userId}`);
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const result = await response.json();
      return result.documents || [];

    } catch (error) {
      console.error('❌ 获取用户文档失败:', error);
      return [];
    }
  }

  // 生成智能回答
  generateIntelligentAnswer(query, searchResults) {
    if (searchResults.length === 0) {
      return '在您的文档中没有找到相关信息。';
    }

    const bestResult = searchResults[0];
    const similarity = (bestResult.score * 100).toFixed(1);
    
    let answer = `根据文档《${bestResult.title}》的内容（相似度: ${similarity}%）：\n\n`;
    answer += bestResult.content;
    
    // 如果有多个相关结果，提及其他来源
    if (searchResults.length > 1) {
      const otherSources = searchResults.slice(1, 3).map(r => r.title);
      answer += `\n\n相关文档还包括：${otherSources.join('、')}`;
    }
    
    return answer;
  }

  // 获取服务状态
  getStatus() {
    return {
      available: this.isAvailable,
      baseURL: this.baseURL,
      description: this.isAvailable 
        ? '本地Qwen3-Embedding-8B模型运行中' 
        : '本地AI服务未启动'
    };
  }
}

// 导出单例
const localAIService = new LocalAIService();
export default localAIService;
