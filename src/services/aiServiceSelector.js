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
    this.initializeService();
  }

  async initializeService() {
    // 在生产环境中优先使用OpenAI
    if (process.env.NODE_ENV === 'production') {
      console.log('🌐 生产环境：使用OpenAI GPT-3.5 Turbo');
      this.currentService = openaiService;
      this.isLocalAIAvailable = false;
      this.initialized = true;
      return;
    }

    // 检查是否启用本地AI服务
    const enableLocalAI = process.env.REACT_APP_ENABLE_LOCAL_AI === 'true';
    const localAIUrl = process.env.REACT_APP_LOCAL_AI_URL || 'http://localhost:5001';

    if (enableLocalAI) {
      try {
        // 测试本地AI服务是否可用
        const response = await fetch(`${localAIUrl}/health`, {
          method: 'GET',
          timeout: 3000
        });
        
        if (response.ok) {
          this.isLocalAIAvailable = true;
          this.currentService = localAIService;
          console.log('✅ 使用本地Qwen3-Embedding-8B模型');
          return;
        }
      } catch (error) {
        console.warn('⚠️ 本地AI服务不可用，切换到OpenAI模式');
      }
    }

    // 回退到OpenAI服务
    console.log('🤖 使用OpenAI GPT-3.5 Turbo');
    this.currentService = openaiService;
    this.isLocalAIAvailable = false;
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

    try {
      return await this.currentService.searchDocuments(query, options);
    } catch (error) {
      console.error('AI搜索失败:', error);
      
      // 如果当前是本地AI服务失败，尝试切换到OpenAI
      if (this.isLocalAIAvailable && this.currentService === localAIService) {
        console.log('🔄 本地AI服务失败，切换到OpenAI模式');
        this.isLocalAIAvailable = false;
        this.currentService = openaiService;
        return await this.currentService.searchDocuments(query, options);
      }
      
      // 如果OpenAI失败，最后切换到简单搜索
      if (this.currentService === openaiService) {
        console.log('🔄 OpenAI服务失败，切换到简单搜索模式');
        this.currentService = intelligentDocumentService;
        return await this.currentService.searchDocuments(query, options);
      }
      
      throw error;
    }
  }

  async addDocument(document) {
    await this.ensureInitialized();
    if (!this.currentService) {
      throw new Error('AI服务未初始化');
    }
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
    if (this.currentService === openaiService) {
      return {
        isLocalAI: false,
        serviceName: 'OpenAI GPT-3.5 Turbo',
        status: this.currentService ? 'ready' : 'initializing',
        type: 'cloud_ai'
      };
    }
    
    return {
      isLocalAI: this.isLocalAIAvailable,
      serviceName: this.isLocalAIAvailable ? 'Qwen3-Embedding-8B (本地)' : 'Browser AI (浏览器)',
      status: this.currentService ? 'ready' : 'initializing',
      type: this.isLocalAIAvailable ? 'local_ai' : 'browser_ai'
    };
  }
}

// 导出单例实例
const aiServiceSelector = new AIServiceSelector();
export default aiServiceSelector;
