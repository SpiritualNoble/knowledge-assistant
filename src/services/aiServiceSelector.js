/**
 * AI服务选择器
 * 根据环境自动选择合适的AI服务
 */

import localAIService from './localAIService';
import intelligentDocumentService from './intelligentDocumentService';

class AIServiceSelector {
  constructor() {
    this.isLocalAIAvailable = false;
    this.currentService = null;
    this.initializeService();
  }

  async initializeService() {
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
        console.warn('⚠️ 本地AI服务不可用，切换到浏览器AI模式');
      }
    }

    // 回退到浏览器内AI服务
    this.isLocalAIAvailable = false;
    this.currentService = intelligentDocumentService;
    console.log('🌐 使用浏览器内AI模型');
  }

  async searchDocuments(query, options = {}) {
    if (!this.currentService) {
      await this.initializeService();
    }

    try {
      return await this.currentService.searchDocuments(query, options);
    } catch (error) {
      console.error('AI搜索失败:', error);
      
      // 如果当前是本地AI服务失败，尝试切换到浏览器AI
      if (this.isLocalAIAvailable && this.currentService === localAIService) {
        console.log('🔄 本地AI服务失败，切换到浏览器AI模式');
        this.isLocalAIAvailable = false;
        this.currentService = intelligentDocumentService;
        return await this.currentService.searchDocuments(query, options);
      }
      
      throw error;
    }
  }

  async addDocument(document) {
    if (!this.currentService) {
      await this.initializeService();
    }

    return await this.currentService.addDocument(document);
  }

  async getDocuments() {
    if (!this.currentService) {
      await this.initializeService();
    }

    return await this.currentService.getDocuments();
  }

  async deleteDocument(id) {
    if (!this.currentService) {
      await this.initializeService();
    }

    return await this.currentService.deleteDocument(id);
  }

  getServiceInfo() {
    return {
      isLocalAI: this.isLocalAIAvailable,
      serviceName: this.isLocalAIAvailable ? 'Qwen3-Embedding-8B (本地)' : 'Browser AI (浏览器)',
      status: this.currentService ? 'ready' : 'initializing'
    };
  }
}

// 导出单例实例
const aiServiceSelector = new AIServiceSelector();
export default aiServiceSelector;
