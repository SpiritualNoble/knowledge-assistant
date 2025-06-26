/**
 * OpenAI API服务
 * 为GitHub Pages提供真正的AI智能搜索和问答能力
 */

class OpenAIService {
  constructor() {
    // 从环境变量或localStorage获取API密钥
    this.apiKey = process.env.REACT_APP_OPENAI_API_KEY || localStorage.getItem('openai_api_key');
    this.baseURL = 'https://api.openai.com/v1';
    this.documents = this.loadDocuments();
  }

  // 设置API密钥
  setApiKey(apiKey) {
    this.apiKey = apiKey;
    localStorage.setItem('openai_api_key', apiKey);
  }

  // 检查API密钥是否已设置
  hasApiKey() {
    return !!this.apiKey;
  }

  // 从localStorage加载文档
  loadDocuments() {
    try {
      const stored = localStorage.getItem('knowledge_documents');
      return stored ? JSON.parse(stored) : [];
    } catch (error) {
      console.error('加载文档失败:', error);
      return [];
    }
  }

  // 保存文档到localStorage
  saveDocuments() {
    try {
      localStorage.setItem('knowledge_documents', JSON.stringify(this.documents));
    } catch (error) {
      console.error('保存文档失败:', error);
    }
  }

  // 添加文档
  async addDocument(document) {
    try {
      const newDoc = {
        id: Date.now().toString(),
        title: document.title,
        content: document.content,
        userId: document.userId,
        createdAt: new Date().toISOString(),
        source: document.source || 'manual'
      };

      this.documents.push(newDoc);
      this.saveDocuments();

      console.log('✅ 文档添加成功:', newDoc.title);
      return { success: true, document: newDoc };
    } catch (error) {
      console.error('❌ 添加文档失败:', error);
      return { success: false, error: error.message };
    }
  }

  // 获取用户文档
  async getDocuments(userId) {
    return this.documents.filter(doc => doc.userId === userId);
  }

  // 删除文档
  async deleteDocument(docId) {
    const index = this.documents.findIndex(doc => doc.id === docId);
    if (index !== -1) {
      this.documents.splice(index, 1);
      this.saveDocuments();
      return { success: true };
    }
    return { success: false, error: '文档不存在' };
  }

  // 使用OpenAI进行智能搜索和问答
  async searchDocuments(query, options = {}) {
    try {
      const { userId, topK = 5 } = options;
      
      // 检查API密钥
      if (!this.apiKey) {
        throw new Error('OpenAI API密钥未设置');
      }
      
      // 获取用户文档
      const userDocs = await this.getDocuments(userId);
      
      if (userDocs.length === 0) {
        return {
          results: [],
          intelligentAnswer: '您还没有上传任何文档。请先上传一些文档，然后再进行搜索。',
          total: 0,
          searchType: 'no_documents'
        };
      }

      // 构建上下文
      const context = userDocs.map(doc => 
        `标题: ${doc.title}\n内容: ${doc.content}`
      ).join('\n\n---\n\n');

      // 调用OpenAI API进行智能问答
      const response = await fetch(`${this.baseURL}/chat/completions`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: 'gpt-3.5-turbo',
          messages: [
            {
              role: 'system',
              content: `你是一个智能知识助手。基于用户提供的文档内容，回答用户的问题。请提供准确、有用的回答，并在可能的情况下引用相关的文档内容。

用户的文档内容如下：
${context}

请根据这些文档内容回答用户的问题。如果文档中没有相关信息，请诚实地说明。`
            },
            {
              role: 'user',
              content: query
            }
          ],
          max_tokens: 1000,
          temperature: 0.7
        })
      });

      if (!response.ok) {
        throw new Error(`OpenAI API错误: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      const intelligentAnswer = data.choices[0]?.message?.content || '抱歉，无法生成回答。';

      // 简单的关键词匹配来找到相关文档
      const relevantDocs = this.findRelevantDocuments(query, userDocs, topK);

      return {
        results: relevantDocs,
        intelligentAnswer,
        total: relevantDocs.length,
        searchType: 'openai_powered',
        metadata: {
          model: 'gpt-3.5-turbo',
          tokensUsed: data.usage?.total_tokens || 0
        }
      };

    } catch (error) {
      console.error('❌ OpenAI搜索失败:', error);
      
      // 降级到简单搜索
      const fallbackResults = this.simpleFallbackSearch(query, options);
      return {
        ...fallbackResults,
        intelligentAnswer: `搜索遇到问题，已切换到基础搜索模式。错误信息: ${error.message}`,
        searchType: 'fallback'
      };
    }
  }

  // 简单的关键词匹配
  findRelevantDocuments(query, documents, topK) {
    const queryWords = query.toLowerCase().split(/\s+/);
    
    const scoredDocs = documents.map(doc => {
      const titleWords = doc.title.toLowerCase();
      const contentWords = doc.content.toLowerCase();
      
      let score = 0;
      queryWords.forEach(word => {
        if (titleWords.includes(word)) score += 2;
        if (contentWords.includes(word)) score += 1;
      });
      
      return {
        ...doc,
        score: score / queryWords.length,
        matchedContent: this.extractRelevantContent(doc.content, queryWords)
      };
    });

    return scoredDocs
      .filter(doc => doc.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, topK)
      .map(doc => ({
        doc_id: doc.id,
        title: doc.title,
        content: doc.matchedContent,
        score: doc.score,
        createdAt: doc.createdAt
      }));
  }

  // 提取相关内容片段
  extractRelevantContent(content, queryWords) {
    const sentences = content.split(/[。！？.!?]/);
    const relevantSentences = sentences.filter(sentence => 
      queryWords.some(word => sentence.toLowerCase().includes(word))
    );
    
    if (relevantSentences.length > 0) {
      return relevantSentences.slice(0, 3).join('。') + '。';
    }
    
    return content.substring(0, 200) + (content.length > 200 ? '...' : '');
  }

  // 降级搜索
  simpleFallbackSearch(query, options) {
    const { userId, topK = 5 } = options;
    const userDocs = this.documents.filter(doc => doc.userId === userId);
    const results = this.findRelevantDocuments(query, userDocs, topK);
    
    return {
      results,
      total: results.length,
      searchType: 'simple_fallback'
    };
  }

  // 获取服务信息
  getServiceInfo() {
    return {
      name: 'OpenAI GPT-3.5 Turbo',
      type: 'cloud_ai',
      status: 'ready',
      capabilities: ['智能问答', '语义搜索', '内容理解', '多语言支持']
    };
  }
}

export default new OpenAIService();
