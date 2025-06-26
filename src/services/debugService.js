/**
 * 调试服务 - 用于诊断线上问题
 */

class DebugService {
  static log(message, data = null) {
    const timestamp = new Date().toISOString();
    const logEntry = `[${timestamp}] ${message}`;
    
    console.log(logEntry, data);
    
    // 保存到localStorage用于调试
    try {
      const logs = JSON.parse(localStorage.getItem('debug_logs') || '[]');
      logs.push({ timestamp, message, data });
      
      // 只保留最近100条日志
      if (logs.length > 100) {
        logs.splice(0, logs.length - 100);
      }
      
      localStorage.setItem('debug_logs', JSON.stringify(logs));
    } catch (error) {
      console.error('无法保存调试日志:', error);
    }
  }

  static getLogs() {
    try {
      return JSON.parse(localStorage.getItem('debug_logs') || '[]');
    } catch (error) {
      console.error('无法读取调试日志:', error);
      return [];
    }
  }

  static clearLogs() {
    try {
      localStorage.removeItem('debug_logs');
      console.log('调试日志已清除');
    } catch (error) {
      console.error('无法清除调试日志:', error);
    }
  }

  static checkEnvironment() {
    const env = {
      nodeEnv: process.env.NODE_ENV,
      userAgent: navigator.userAgent,
      url: window.location.href,
      localStorage: {
        available: this.testLocalStorage(),
        documents: this.getDocumentCount(),
        logs: this.getLogs().length
      },
      services: {
        openaiApiKey: !!localStorage.getItem('openai_api_key'),
        currentService: 'unknown'
      }
    };

    this.log('环境检查', env);
    return env;
  }

  static testLocalStorage() {
    try {
      const testKey = 'test_' + Date.now();
      localStorage.setItem(testKey, 'test');
      const value = localStorage.getItem(testKey);
      localStorage.removeItem(testKey);
      return value === 'test';
    } catch (error) {
      return false;
    }
  }

  static getDocumentCount() {
    try {
      const docs = JSON.parse(localStorage.getItem('knowledge_documents') || '[]');
      return docs.length;
    } catch (error) {
      return 0;
    }
  }

  static testDocumentSave() {
    try {
      const testDoc = {
        id: 'debug_test_' + Date.now(),
        title: '调试测试文档',
        content: '这是一个用于调试的测试文档',
        userId: 'debug_user',
        createdAt: new Date().toISOString(),
        source: 'debug'
      };

      // 尝试保存
      const docs = JSON.parse(localStorage.getItem('knowledge_documents') || '[]');
      docs.push(testDoc);
      localStorage.setItem('knowledge_documents', JSON.stringify(docs));

      // 验证保存
      const savedDocs = JSON.parse(localStorage.getItem('knowledge_documents') || '[]');
      const found = savedDocs.find(doc => doc.id === testDoc.id);

      this.log('文档保存测试', {
        success: !!found,
        totalDocs: savedDocs.length,
        testDoc: testDoc
      });

      return !!found;
    } catch (error) {
      this.log('文档保存测试失败', error);
      return false;
    }
  }
}

export default DebugService;
