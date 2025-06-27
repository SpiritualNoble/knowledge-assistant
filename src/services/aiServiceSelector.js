/**
 * AI服务选择器
 * 根据环境自动选择合适的AI服务
 */

import localAIService from './localAIService';
import intelligentDocumentService from './intelligentDocumentService';
import openaiService from './openaiService';

class AIServiceSelector {
  constructor() {
    this.isLocalAIAvailable = false;
    this.currentService = null;
    this.initialized = false;
    this.serviceStatus = {
      local: false,
      openai: false,
      fallback: true
    };
    this.initializeService();
  }

  async initializeService() {
    console.log('🚀 初始化AI服务选择器...');
    
    // 检查是否启用本地AI服务
    const enableLocalAI = process.env.REACT_APP_ENABLE_LOCAL_AI === 'true';
    const localAIUrl = process.env.REACT_APP_LOCAL_AI_URL || 'http://localhost:5001';

    // 优先尝试本地AI服务（Qwen模型）
    if (enableLocalAI) {
      try {
        console.log('🔍 检查本地Qwen模型服务...');
        const isAvailable = await localAIService.checkAvailability();
        
        if (isAvailable) {
          this.isLocalAIAvailable = true;
          this.currentService = localAIService;
          this.serviceStatus.local = true;
          console.log('✅ 使用本地Qwen3-Embedding-8B模型');
          this.initialized = true;
          return;
        } else {
          console.warn('⚠️ 本地Qwen模型服务不可用');
        }
      } catch (error) {
        console.warn('⚠️ 本地AI服务连接失败:', error.message);
      }
    }

    // 检查OpenAI API密钥是否可用
    if (openaiService.hasApiKey()) {
      console.log('🤖 使用OpenAI GPT服务');
      this.currentService = openaiService;
      this.serviceStatus.openai = true;
      this.initialized = true;
      return;
    }

    // 回退到智能文档服务（不需要API密钥）
    console.log('📚 使用智能文档服务（无需API密钥）');
    this.currentService = intelligentDocumentService;
    this.initialized = true;
  }

  async ensureInitialized() {
    if (!this.initialized) {
      await this.initializeService();
    }
  }

  async searchDocuments(query, options = {}) {
    await this.ensureInitialized();
    if (!this.currentService) {
      throw new Error('AI服务未初始化');
    }

    const { conversationMode = false, includeAnswer = false } = options;

    try {
      console.log(`🔍 使用${this.getServiceInfo().serviceName}进行搜索:`, query);
      
      let result;
      
      // 如果是对话模式且使用本地AI，尝试生成更智能的回答
      if (conversationMode && this.currentService === localAIService) {
        result = await this.currentService.searchDocuments(query, options);
        
        // 为本地AI生成更好的对话回答
        if (result.results && result.results.length > 0) {
          result.answer = this.generateConversationalAnswer(query, result.results);
        } else {
          result.answer = '抱歉，我在知识库中没有找到相关信息。你可以尝试上传相关文档或换个方式描述问题。';
        }
      } else {
        result = await this.currentService.searchDocuments(query, options);
      }
      
      return result;
      
    } catch (error) {
      console.error('❌ AI搜索失败:', error);
      
      // 服务降级逻辑
      if (this.currentService === localAIService && this.serviceStatus.openai) {
        console.log('🔄 本地AI服务失败，切换到OpenAI模式');
        this.currentService = openaiService;
        this.serviceStatus.local = false;
        return await this.currentService.searchDocuments(query, options);
      }
      
      if (this.currentService === openaiService) {
        console.log('🔄 OpenAI服务失败，切换到简单搜索模式');
        this.currentService = intelligentDocumentService;
        this.serviceStatus.openai = false;
        return await this.currentService.searchDocuments(query, options);
      }
      
      throw error;
    }
  }

  // 生成对话式回答
  generateConversationalAnswer(query, results) {
    if (!results || results.length === 0) {
      return '抱歉，我在知识库中没有找到相关信息。';
    }

    const bestResult = results[0];
    const similarity = bestResult.score ? (bestResult.score * 100).toFixed(1) : '未知';
    
    // 根据相似度调整回答语气
    let answer = '';
    if (bestResult.score && bestResult.score > 0.8) {
      answer = `根据文档《${bestResult.title}》，我找到了很匹配的信息：\n\n`;
    } else if (bestResult.score && bestResult.score > 0.6) {
      answer = `在文档《${bestResult.title}》中找到了相关信息：\n\n`;
    } else {
      answer = `在文档《${bestResult.title}》中找到了可能相关的信息：\n\n`;
    }
    
    // 截取合适长度的内容
    let content = bestResult.content;
    if (content.length > 500) {
      content = content.substring(0, 500) + '...';
    }
    answer += content;
    
    // 如果有多个相关结果，提及其他来源
    if (results.length > 1) {
      const otherSources = results.slice(1, 3).map(r => r.title);
      answer += `\n\n💡 相关文档还包括：${otherSources.join('、')}`;
    }
    
    return answer;
  }

  async addDocument(document) {
    await this.ensureInitialized();
    if (!this.currentService) {
      throw new Error('AI服务未初始化');
    }
    
    console.log(`📄 使用${this.getServiceInfo().serviceName}添加文档:`, document.title);
    return await this.currentService.addDocument(document);
  }

  async getDocuments(userId) {
    await this.ensureInitialized();
    if (!this.currentService) {
      throw new Error('AI服务未初始化');
    }
    return await this.currentService.getDocuments(userId);
  }

  async deleteDocument(id) {
    await this.ensureInitialized();
    if (!this.currentService) {
      throw new Error('AI服务未初始化');
    }
    return await this.currentService.deleteDocument(id);
  }

  getServiceInfo() {
    if (this.currentService === localAIService) {
      return {
        isLocalAI: true,
        serviceName: 'Qwen3-Embedding-8B (本地)',
        status: this.serviceStatus.local ? 'ready' : 'error',
        type: 'local_ai',
        available: this.serviceStatus.local,
        description: '本地Qwen模型，支持中文语义理解'
      };
    }
    
    if (this.currentService === openaiService) {
      return {
        isLocalAI: false,
        serviceName: 'OpenAI GPT-3.5 Turbo',
        status: this.serviceStatus.openai ? 'ready' : 'error',
        type: 'cloud_ai',
        available: this.serviceStatus.openai,
        description: 'OpenAI云端AI服务'
      };
    }
    
    // 智能文档服务
    return {
      isLocalAI: false,
      serviceName: '智能文档服务',
      status: 'ready',
      type: 'document_service',
      available: true,
      description: '基于关键词匹配的文档搜索'
    };
  }

  // 手动切换服务
  async switchToService(serviceType) {
    console.log(`🔄 手动切换到${serviceType}服务`);
    
    switch (serviceType) {
      case 'local':
        if (process.env.REACT_APP_ENABLE_LOCAL_AI === 'true') {
          const isAvailable = await localAIService.checkAvailability();
          if (isAvailable) {
            this.currentService = localAIService;
            this.serviceStatus.local = true;
            console.log('✅ 已切换到本地Qwen模型');
            return true;
          }
        }
        console.warn('⚠️ 本地AI服务不可用');
        return false;
        
      case 'openai':
        if (openaiService.hasApiKey()) {
          this.currentService = openaiService;
          this.serviceStatus.openai = true;
          console.log('✅ 已切换到OpenAI服务');
          return true;
        }
        console.warn('⚠️ OpenAI API密钥未配置');
        return false;
        
      case 'fallback':
        this.currentService = intelligentDocumentService;
        console.log('✅ 已切换到智能文档服务');
        return true;
        
      default:
        return false;
    }
  }
}

// 导出单例实例
const aiServiceSelector = new AIServiceSelector();
export default aiServiceSelector;
