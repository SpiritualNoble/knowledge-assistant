// 智能文档服务 - 优先使用本地AI，降级到简单搜索
import localAIService from './localAIService';
import simpleDocumentService from './simpleDocumentService';

class IntelligentDocumentService {
  constructor() {
    this.useLocalAI = false;
    this.initializeService();
  }

  // 初始化服务
  async initializeService() {
    console.log('🚀 初始化智能文档服务...');
    
    // 检查本地AI服务是否可用
    this.useLocalAI = await localAIService.checkAvailability();
    
    if (this.useLocalAI) {
      console.log('✅ 使用本地AI服务 (Qwen3-Embedding-8B)');
    } else {
      console.log('⚠️ 本地AI服务不可用，使用简单文档服务');
    }
  }

  // 添加文档
  async addDocument(file, metadata, userId) {
    console.log('📄 添加文档:', file.name);
    
    try {
      // 首先保存到简单文档服务（作为备份）
      const simpleDoc = await simpleDocumentService.addDocument(file, metadata, userId);
      
      // 如果本地AI可用，也添加到AI服务
      if (this.useLocalAI) {
        try {
          await localAIService.addDocument(
            simpleDoc.id,
            simpleDoc.title,
            simpleDoc.content,
            userId
          );
          console.log('✅ 文档已添加到本地AI服务');
        } catch (aiError) {
          console.warn('⚠️ 添加到本地AI服务失败，仅使用简单服务:', aiError.message);
          this.useLocalAI = false;
        }
      }
      
      return simpleDoc;
      
    } catch (error) {
      console.error('❌ 添加文档失败:', error);
      throw error;
    }
  }

  // 智能搜索
  async search(query, userId) {
    console.log('🔍 开始智能搜索:', query);
    
    // 重新检查AI服务状态
    if (this.useLocalAI) {
      this.useLocalAI = await localAIService.checkAvailability();
    }
    
    try {
      if (this.useLocalAI) {
        // 使用本地AI进行语义搜索
        console.log('🤖 使用本地AI语义搜索');
        const aiResults = await localAIService.search(query, userId);
        
        if (aiResults.results.length > 0) {
          return {
            results: aiResults.results,
            answer: localAIService.generateIntelligentAnswer(query, aiResults.results),
            confidence: aiResults.results[0]?.score || 0,
            totalFound: aiResults.total,
            searchType: 'local_ai_semantic',
            aiPowered: true
          };
        }
      }
      
      // 降级到简单搜索
      console.log('📝 使用简单文档搜索');
      const simpleResults = await simpleDocumentService.search(query, userId);
      
      return {
        ...simpleResults,
        searchType: 'simple_fallback',
        aiPowered: false
      };
      
    } catch (error) {
      console.error('❌ 搜索失败:', error);
      
      // 最终降级
      const fallbackResults = await simpleDocumentService.search(query, userId);
      return {
        ...fallbackResults,
        searchType: 'error_fallback',
        aiPowered: false,
        error: error.message
      };
    }
  }

  // 获取用户文档
  async getUserDocuments(userId) {
    // 优先从简单服务获取（更可靠）
    return await simpleDocumentService.getUserDocuments(userId);
  }

  // 删除文档
  async deleteDocument(docId, userId) {
    // 从简单服务删除
    await simpleDocumentService.deleteDocument(docId, userId);
    
    // 如果使用AI服务，这里应该也删除，但当前AI服务没有删除接口
    // TODO: 添加AI服务的删除功能
  }

  // 获取服务状态
  getServiceStatus() {
    const aiStatus = localAIService.getStatus();
    
    return {
      aiService: aiStatus,
      currentMode: this.useLocalAI ? 'AI增强模式' : '基础搜索模式',
      recommendation: this.useLocalAI 
        ? '正在使用本地AI模型提供语义搜索' 
        : '建议启动本地AI服务以获得更好的搜索体验'
    };
  }

  // 手动重新检查AI服务
  async recheckAIService() {
    console.log('🔄 重新检查本地AI服务...');
    this.useLocalAI = await localAIService.checkAvailability();
    return this.useLocalAI;
  }
}

// 导出单例
const intelligentDocumentService = new IntelligentDocumentService();
export default intelligentDocumentService;
