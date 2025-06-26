// 存储抽象层 - 支持多种存储后端
// 基于localForage + WebDAV.js + Cloudflare API

import localforage from 'localforage';

// 存储适配器接口
class StorageAdapter {
  constructor(type = 'indexeddb') {
    this.type = type;
    this.init();
  }

  async init() {
    switch (this.type) {
      case 'indexeddb':
        return this.initIndexedDB();
      case 'webdav':
        return this.initWebDAV();
      case 'cloudflare':
        return this.initCloudflare();
      default:
        throw new Error(`Unsupported storage type: ${this.type}`);
    }
  }

  // IndexedDB适配器（默认）
  async initIndexedDB() {
    this.store = localforage.createInstance({
      name: 'KnowledgeAssistant',
      storeName: 'documents',
      driver: localforage.INDEXEDDB
    });

    this.contentStore = localforage.createInstance({
      name: 'KnowledgeAssistant',
      storeName: 'content',
      driver: localforage.INDEXEDDB
    });
  }

  // WebDAV适配器（企业网盘）
  async initWebDAV() {
    const { createClient } = await import('webdav');
    
    this.webdavClient = createClient(
      process.env.REACT_APP_WEBDAV_URL || 'https://your-webdav-server.com',
      {
        username: process.env.REACT_APP_WEBDAV_USERNAME,
        password: process.env.REACT_APP_WEBDAV_PASSWORD
      }
    );

    // 确保目录存在
    try {
      await this.webdavClient.createDirectory('/knowledge-assistant');
      await this.webdavClient.createDirectory('/knowledge-assistant/documents');
      await this.webdavClient.createDirectory('/knowledge-assistant/metadata');
    } catch (error) {
      // 目录可能已存在
    }
  }

  // Cloudflare适配器
  async initCloudflare() {
    this.apiUrl = process.env.REACT_APP_API_URL;
    this.token = localStorage.getItem('userToken');
  }

  // 统一的文档保存接口
  async saveDocument(document, content, userId) {
    const encryptedContent = await this.encryptContent(content, userId);
    
    switch (this.type) {
      case 'indexeddb':
        return this.saveToIndexedDB(document, encryptedContent);
      case 'webdav':
        return this.saveToWebDAV(document, encryptedContent);
      case 'cloudflare':
        return this.saveToCloudflare(document, encryptedContent);
    }
  }

  // IndexedDB保存
  async saveToIndexedDB(document, encryptedContent) {
    await this.store.setItem(document.id, document);
    await this.contentStore.setItem(document.id, encryptedContent);
    return document;
  }

  // WebDAV保存
  async saveToWebDAV(document, encryptedContent) {
    const metadataPath = `/knowledge-assistant/metadata/${document.id}.json`;
    const contentPath = `/knowledge-assistant/documents/${document.id}.dat`;
    
    await Promise.all([
      this.webdavClient.putFileContents(metadataPath, JSON.stringify(document)),
      this.webdavClient.putFileContents(contentPath, encryptedContent)
    ]);
    
    return document;
  }

  // Cloudflare保存
  async saveToCloudflare(document, encryptedContent) {
    const formData = new FormData();
    formData.append('metadata', JSON.stringify(document));
    formData.append('content', new Blob([encryptedContent]));
    
    const response = await fetch(`${this.apiUrl}/api/documents`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${this.token}` },
      body: formData
    });
    
    if (!response.ok) throw new Error('Cloudflare save failed');
    return await response.json();
  }

  // 统一的文档获取接口
  async getDocuments(userId) {
    switch (this.type) {
      case 'indexeddb':
        return this.getFromIndexedDB(userId);
      case 'webdav':
        return this.getFromWebDAV(userId);
      case 'cloudflare':
        return this.getFromCloudflare(userId);
    }
  }

  // IndexedDB获取
  async getFromIndexedDB(userId) {
    const documents = [];
    await this.store.iterate((doc) => {
      if (doc.userId === userId) {
        documents.push(doc);
      }
    });
    return documents.sort((a, b) => new Date(b.uploadedAt) - new Date(a.uploadedAt));
  }

  // WebDAV获取
  async getFromWebDAV(userId) {
    const files = await this.webdavClient.getDirectoryContents('/knowledge-assistant/metadata');
    const documents = [];
    
    for (const file of files) {
      if (file.type === 'file' && file.filename.endsWith('.json')) {
        const content = await this.webdavClient.getFileContents(file.filename, { format: 'text' });
        const doc = JSON.parse(content);
        if (doc.userId === userId) {
          documents.push(doc);
        }
      }
    }
    
    return documents.sort((a, b) => new Date(b.uploadedAt) - new Date(a.uploadedAt));
  }

  // Cloudflare获取
  async getFromCloudflare(userId) {
    const response = await fetch(`${this.apiUrl}/api/documents`, {
      headers: { 'Authorization': `Bearer ${this.token}` }
    });
    
    if (!response.ok) throw new Error('Cloudflare fetch failed');
    const data = await response.json();
    return data.documents || [];
  }

  // 内容加密
  async encryptContent(content, userId) {
    const key = await this.getOrCreateUserKey(userId);
    const encoder = new TextEncoder();
    const data = encoder.encode(content);
    
    const iv = crypto.getRandomValues(new Uint8Array(12));
    const encrypted = await crypto.subtle.encrypt(
      { name: 'AES-GCM', iv },
      key,
      data
    );
    
    return {
      iv: Array.from(iv),
      data: Array.from(new Uint8Array(encrypted))
    };
  }

  // 内容解密
  async decryptContent(encryptedContent, userId) {
    const key = await this.getOrCreateUserKey(userId);
    const iv = new Uint8Array(encryptedContent.iv);
    const data = new Uint8Array(encryptedContent.data);
    
    const decrypted = await crypto.subtle.decrypt(
      { name: 'AES-GCM', iv },
      key,
      data
    );
    
    const decoder = new TextDecoder();
    return decoder.decode(decrypted);
  }

  // 获取或创建用户加密密钥
  async getOrCreateUserKey(userId) {
    const keyName = `userKey_${userId}`;
    let keyData = localStorage.getItem(keyName);
    
    if (!keyData) {
      // 生成新密钥
      const key = await crypto.subtle.generateKey(
        { name: 'AES-GCM', length: 256 },
        true,
        ['encrypt', 'decrypt']
      );
      
      const exported = await crypto.subtle.exportKey('raw', key);
      keyData = Array.from(new Uint8Array(exported));
      localStorage.setItem(keyName, JSON.stringify(keyData));
    } else {
      keyData = JSON.parse(keyData);
    }
    
    return await crypto.subtle.importKey(
      'raw',
      new Uint8Array(keyData),
      { name: 'AES-GCM' },
      false,
      ['encrypt', 'decrypt']
    );
  }

  // 删除文档
  async deleteDocument(docId, userId) {
    switch (this.type) {
      case 'indexeddb':
        await this.store.removeItem(docId);
        await this.contentStore.removeItem(docId);
        break;
      case 'webdav':
        await Promise.all([
          this.webdavClient.deleteFile(`/knowledge-assistant/metadata/${docId}.json`),
          this.webdavClient.deleteFile(`/knowledge-assistant/documents/${docId}.dat`)
        ]);
        break;
      case 'cloudflare':
        await fetch(`${this.apiUrl}/api/documents/${docId}`, {
          method: 'DELETE',
          headers: { 'Authorization': `Bearer ${this.token}` }
        });
        break;
    }
  }

  // 搜索文档内容
  async searchDocuments(query, userId) {
    const documents = await this.getDocuments(userId);
    const results = [];
    
    for (const doc of documents) {
      let content;
      try {
        const encryptedContent = await this.getDocumentContent(doc.id);
        content = await this.decryptContent(encryptedContent, userId);
      } catch (error) {
        console.warn('Failed to decrypt content for', doc.id);
        continue;
      }
      
      const score = this.calculateRelevanceScore(query, doc, content);
      if (score > 0) {
        results.push({
          id: doc.id,
          content: this.extractSnippet(content, query),
          metadata: {
            source: doc.filename,
            title: doc.title,
            category: doc.category,
            tags: doc.tags,
            uploadedAt: doc.uploadedAt
          },
          score
        });
      }
    }
    
    return results.sort((a, b) => b.score - a.score).slice(0, 10);
  }

  // 获取文档内容
  async getDocumentContent(docId) {
    switch (this.type) {
      case 'indexeddb':
        return await this.contentStore.getItem(docId);
      case 'webdav':
        const content = await this.webdavClient.getFileContents(
          `/knowledge-assistant/documents/${docId}.dat`,
          { format: 'text' }
        );
        return JSON.parse(content);
      case 'cloudflare':
        const response = await fetch(`${this.apiUrl}/api/documents/${docId}/content`, {
          headers: { 'Authorization': `Bearer ${this.token}` }
        });
        return await response.json();
    }
  }

  // 计算相关性分数
  calculateRelevanceScore(query, document, content) {
    const searchTerms = query.toLowerCase().split(' ').filter(term => term.length > 0);
    let score = 0;
    
    searchTerms.forEach(term => {
      // 标题匹配权重最高
      if (document.title.toLowerCase().includes(term)) score += 0.5;
      
      // 内容匹配
      const contentLower = content.toLowerCase();
      const matches = (contentLower.match(new RegExp(term, 'g')) || []).length;
      score += matches * 0.1;
      
      // 标签匹配
      if (document.tags.some(tag => tag.toLowerCase().includes(term))) score += 0.3;
      
      // 文件名匹配
      if (document.filename.toLowerCase().includes(term)) score += 0.2;
    });
    
    return Math.min(score, 1);
  }

  // 提取内容片段
  extractSnippet(content, query, maxLength = 200) {
    const searchTerms = query.toLowerCase().split(' ');
    const contentLower = content.toLowerCase();
    
    // 找到第一个匹配词的位置
    let bestPosition = 0;
    for (const term of searchTerms) {
      const pos = contentLower.indexOf(term);
      if (pos !== -1) {
        bestPosition = Math.max(0, pos - 50);
        break;
      }
    }
    
    let snippet = content.substring(bestPosition, bestPosition + maxLength);
    
    // 确保不在单词中间截断
    if (bestPosition > 0) {
      const spaceIndex = snippet.indexOf(' ');
      if (spaceIndex > 0) snippet = snippet.substring(spaceIndex + 1);
    }
    
    if (snippet.length >= maxLength) {
      const lastSpaceIndex = snippet.lastIndexOf(' ');
      if (lastSpaceIndex > maxLength * 0.8) {
        snippet = snippet.substring(0, lastSpaceIndex) + '...';
      }
    }
    
    return snippet || content.substring(0, maxLength) + '...';
  }
}

// 存储管理器 - 自动选择最佳存储方案
class StorageManager {
  constructor() {
    this.adapters = new Map();
    this.primaryAdapter = null;
    this.fallbackAdapters = [];
  }

  // 初始化存储管理器
  async init() {
    // 检测可用的存储方案
    const availableAdapters = await this.detectAvailableAdapters();
    
    // 设置主要适配器
    if (availableAdapters.includes('cloudflare') && process.env.REACT_APP_API_URL) {
      this.primaryAdapter = new StorageAdapter('cloudflare');
      this.fallbackAdapters.push(new StorageAdapter('indexeddb'));
    } else if (availableAdapters.includes('webdav') && process.env.REACT_APP_WEBDAV_URL) {
      this.primaryAdapter = new StorageAdapter('webdav');
      this.fallbackAdapters.push(new StorageAdapter('indexeddb'));
    } else {
      this.primaryAdapter = new StorageAdapter('indexeddb');
    }
    
    await this.primaryAdapter.init();
    for (const adapter of this.fallbackAdapters) {
      await adapter.init();
    }
  }

  // 检测可用的存储适配器
  async detectAvailableAdapters() {
    const adapters = ['indexeddb']; // IndexedDB总是可用
    
    // 检测WebDAV
    if (process.env.REACT_APP_WEBDAV_URL) {
      adapters.push('webdav');
    }
    
    // 检测Cloudflare API
    if (process.env.REACT_APP_API_URL) {
      try {
        const response = await fetch(`${process.env.REACT_APP_API_URL}/health`);
        if (response.ok) adapters.push('cloudflare');
      } catch (error) {
        console.log('Cloudflare API not available');
      }
    }
    
    return adapters;
  }

  // 带容错的操作执行
  async executeWithFallback(operation, ...args) {
    try {
      return await this.primaryAdapter[operation](...args);
    } catch (error) {
      console.warn(`Primary adapter failed for ${operation}:`, error);
      
      for (const fallbackAdapter of this.fallbackAdapters) {
        try {
          return await fallbackAdapter[operation](...args);
        } catch (fallbackError) {
          console.warn(`Fallback adapter failed for ${operation}:`, fallbackError);
        }
      }
      
      throw new Error(`All adapters failed for operation: ${operation}`);
    }
  }

  // 公共接口
  async saveDocument(document, content, userId) {
    return this.executeWithFallback('saveDocument', document, content, userId);
  }

  async getDocuments(userId) {
    return this.executeWithFallback('getDocuments', userId);
  }

  async deleteDocument(docId, userId) {
    return this.executeWithFallback('deleteDocument', docId, userId);
  }

  async searchDocuments(query, userId) {
    return this.executeWithFallback('searchDocuments', query, userId);
  }
}

// 导出单例
const storageManager = new StorageManager();
export default storageManager;
