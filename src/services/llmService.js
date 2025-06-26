// LLM服务抽象层 - 支持多种模型
// 优先使用通义千问，备用OpenAI和本地模型

class LLMService {
  constructor() {
    this.providers = {
      qwen: {
        name: '通义千问',
        endpoint: 'https://dashscope.aliyuncs.com/api/v1/services/aigc/text-generation/generation',
        models: {
          'qwen-turbo': { maxTokens: 8192, cost: 0.008 },
          'qwen-plus': { maxTokens: 32768, cost: 0.02 },
          'qwen-max': { maxTokens: 8192, cost: 0.12 }
        }
      },
      openai: {
        name: 'OpenAI',
        endpoint: 'https://api.openai.com/v1/chat/completions',
        models: {
          'gpt-3.5-turbo': { maxTokens: 4096, cost: 0.002 },
          'gpt-4-turbo': { maxTokens: 128000, cost: 0.03 }
        }
      },
      local: {
        name: '本地模型',
        endpoint: null,
        models: {
          'fallback': { maxTokens: 2048, cost: 0 }
        }
      }
    };
    
    this.currentProvider = this.detectBestProvider();
    this.requestCache = new Map();
    this.rateLimiter = new Map();
  }

  // 检测最佳可用模型
  detectBestProvider() {
    if (process.env.REACT_APP_QWEN_API_KEY) {
      return 'qwen';
    } else if (process.env.REACT_APP_OPENAI_API_KEY) {
      return 'openai';
    } else {
      return 'local';
    }
  }

  // 智能聊天补全
  async chatCompletion(prompt, options = {}) {
    const {
      model = this.getDefaultModel(),
      temperature = 0.7,
      maxTokens = 1000,
      useCache = true,
      timeout = 30000
    } = options;

    // 缓存检查
    const cacheKey = this.generateCacheKey(prompt, model, temperature);
    if (useCache && this.requestCache.has(cacheKey)) {
      const cached = this.requestCache.get(cacheKey);
      if (Date.now() - cached.timestamp < 300000) { // 5分钟缓存
        return cached.response;
      }
    }

    // 速率限制检查
    if (!this.checkRateLimit()) {
      throw new Error('请求过于频繁，请稍后再试');
    }

    try {
      let response;
      
      switch (this.currentProvider) {
        case 'qwen':
          response = await this.callQwenAPI(prompt, model, temperature, maxTokens, timeout);
          break;
        case 'openai':
          response = await this.callOpenAIAPI(prompt, model, temperature, maxTokens, timeout);
          break;
        default:
          response = await this.callLocalModel(prompt, maxTokens);
      }

      // 缓存响应
      if (useCache) {
        this.requestCache.set(cacheKey, {
          response,
          timestamp: Date.now()
        });
      }

      return response;
    } catch (error) {
      console.warn(`${this.currentProvider} API调用失败:`, error);
      
      // 自动降级到备用模型
      if (this.currentProvider !== 'local') {
        console.log('尝试备用模型...');
        return await this.callLocalModel(prompt, maxTokens);
      }
      
      throw error;
    }
  }

  // 通义千问API调用
  async callQwenAPI(prompt, model, temperature, maxTokens, timeout) {
    const response = await fetch(this.providers.qwen.endpoint, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.REACT_APP_QWEN_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: model || 'qwen-turbo',
        input: {
          messages: [
            {
              role: 'user',
              content: prompt
            }
          ]
        },
        parameters: {
          temperature,
          max_tokens: maxTokens,
          top_p: 0.8
        }
      }),
      signal: AbortSignal.timeout(timeout)
    });

    if (!response.ok) {
      throw new Error(`通义千问API错误: ${response.status}`);
    }

    const data = await response.json();
    return data.output.text;
  }

  // OpenAI API调用
  async callOpenAIAPI(prompt, model, temperature, maxTokens, timeout) {
    const response = await fetch(this.providers.openai.endpoint, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.REACT_APP_OPENAI_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: model || 'gpt-3.5-turbo',
        messages: [
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature,
        max_tokens: maxTokens
      }),
      signal: AbortSignal.timeout(timeout)
    });

    if (!response.ok) {
      throw new Error(`OpenAI API错误: ${response.status}`);
    }

    const data = await response.json();
    return data.choices[0].message.content;
  }

  // 本地模型调用（备用方案）
  async callLocalModel(prompt, maxTokens) {
    // 简单的规则基础回复系统
    const rules = [
      {
        pattern: /查询.*类型.*判断/i,
        response: () => JSON.stringify({
          type: "semantic",
          entities: this.extractEntities(prompt),
          filters: {}
        })
      },
      {
        pattern: /基于.*知识库.*回答/i,
        response: () => this.generateSimpleAnswer(prompt)
      },
      {
        pattern: /提取.*片段/i,
        response: () => this.extractSimpleSnippet(prompt)
      }
    ];

    for (const rule of rules) {
      if (rule.pattern.test(prompt)) {
        return rule.response();
      }
    }

    return "抱歉，当前无法处理该请求。请检查网络连接或API配置。";
  }

  // 简单实体提取
  extractEntities(prompt) {
    const entities = [];
    const keywords = prompt.match(/[\u4e00-\u9fa5a-zA-Z]{2,}/g) || [];
    
    // 过滤常见停用词
    const stopWords = ['查询', '搜索', '类型', '判断', '用户', '请', '的', '是', '在', '有'];
    
    keywords.forEach(word => {
      if (!stopWords.includes(word) && word.length > 1) {
        entities.push(word);
      }
    });
    
    return entities.slice(0, 5); // 最多5个实体
  }

  // 生成简单答案
  generateSimpleAnswer(prompt) {
    const contextMatch = prompt.match(/知识库上下文：\s*([\s\S]*)/);
    if (contextMatch) {
      const context = contextMatch[1];
      const sentences = context.split(/[。！？.!?]/).filter(s => s.trim().length > 10);
      return sentences.slice(0, 2).join('。') + '。';
    }
    return "根据现有信息，暂时无法提供准确答案。";
  }

  // 提取简单片段
  extractSimpleSnippet(prompt) {
    const textMatch = prompt.match(/文本：([\s\S]*)/);
    if (textMatch) {
      const text = textMatch[1];
      return text.substring(0, 200) + (text.length > 200 ? '...' : '');
    }
    return "无法提取相关片段。";
  }

  // 获取默认模型
  getDefaultModel() {
    switch (this.currentProvider) {
      case 'qwen':
        return 'qwen-turbo';
      case 'openai':
        return 'gpt-3.5-turbo';
      default:
        return 'fallback';
    }
  }

  // 生成缓存键
  generateCacheKey(prompt, model, temperature) {
    const content = prompt + model + temperature;
    return btoa(content).substring(0, 32);
  }

  // 速率限制检查
  checkRateLimit() {
    const now = Date.now();
    const windowMs = 60000; // 1分钟窗口
    const maxRequests = 20; // 每分钟最多20次请求
    
    const key = `${this.currentProvider}_${Math.floor(now / windowMs)}`;
    const count = this.rateLimiter.get(key) || 0;
    
    if (count >= maxRequests) {
      return false;
    }
    
    this.rateLimiter.set(key, count + 1);
    
    // 清理过期的限制记录
    for (const [k, v] of this.rateLimiter.entries()) {
      if (k < key - 5) { // 保留最近5个窗口
        this.rateLimiter.delete(k);
      }
    }
    
    return true;
  }

  // 获取模型信息
  getModelInfo() {
    const provider = this.providers[this.currentProvider];
    return {
      provider: this.currentProvider,
      name: provider.name,
      models: Object.keys(provider.models),
      defaultModel: this.getDefaultModel()
    };
  }

  // 估算成本
  estimateCost(prompt, model) {
    const provider = this.providers[this.currentProvider];
    const modelInfo = provider.models[model] || provider.models[this.getDefaultModel()];
    const tokenCount = Math.ceil(prompt.length / 4); // 粗略估算
    
    return {
      estimatedTokens: tokenCount,
      estimatedCost: tokenCount * modelInfo.cost / 1000,
      currency: 'USD'
    };
  }
}

// 导出单例
const llmService = new LLMService();
export default llmService;
