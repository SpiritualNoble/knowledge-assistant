import axios from 'axios';

// 根据环境设置API URL
const API_URL = process.env.REACT_APP_API_URL || 'https://pm-copilot-rag.your-account.workers.dev';

// 创建axios实例
const apiClient = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// 查询知识库
export const searchKnowledge = async (query) => {
  try {
    const response = await apiClient.post('/api/query', { query });
    return response.data;
  } catch (error) {
    console.error('Error searching knowledge:', error);
    throw error;
  }
};

// 上传文档
export const uploadDocument = async (file, metadata) => {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('metadata', JSON.stringify(metadata));
  
  try {
    const response = await apiClient.post('/api/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
  } catch (error) {
    console.error('Error uploading document:', error);
    throw error;
  }
};

// 获取知识库统计信息
export const getKnowledgeStats = async () => {
  try {
    const response = await apiClient.get('/api/stats');
    return response.data;
  } catch (error) {
    console.error('Error getting knowledge stats:', error);
    throw error;
  }
};

// 导入外部文档（飞书、语雀等）
export const importExternalDocument = async (source, docId, accessToken) => {
  try {
    const response = await apiClient.post('/api/import', {
      source,
      docId,
      accessToken,
    });
    return response.data;
  } catch (error) {
    console.error('Error importing external document:', error);
    throw error;
  }
};
