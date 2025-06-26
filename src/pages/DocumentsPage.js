import React, { useState, useEffect } from 'react';
import { DocumentTextIcon, TrashIcon, EyeIcon } from '@heroicons/react/24/outline';

const DocumentsPage = ({ user }) => {
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedDoc, setSelectedDoc] = useState(null);

  useEffect(() => {
    fetchDocuments();
  }, [user]);

  const fetchDocuments = async () => {
    try {
      const token = localStorage.getItem('userToken');
      const response = await fetch(`${process.env.REACT_APP_API_URL || ''}/api/documents`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setDocuments(data.documents || []);
      } else if (response.status === 401) {
        // 令牌无效，清除本地存储
        localStorage.removeItem('userToken');
        localStorage.removeItem('userInfo');
        alert('登录已过期，请重新登录');
      } else {
        console.error('获取文档失败:', response.statusText);
      }
    } catch (error) {
      console.error('获取文档失败:', error);
      // 如果API不可用，显示模拟数据
      setDocuments([
        {
          id: 'demo_1',
          filename: 'sample.pdf',
          title: '示例文档',
          size: 1024000,
          category: 'technical',
          tags: ['示例', '测试'],
          uploadedAt: new Date().toISOString(),
          contentType: 'application/pdf'
        },
        {
          id: 'demo_2',
          filename: 'guide.md',
          title: '使用指南',
          size: 512000,
          category: 'general',
          tags: ['指南', '帮助'],
          uploadedAt: new Date(Date.now() - 86400000).toISOString(),
          contentType: 'text/markdown'
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  const deleteDocument = async (docId) => {
    if (!window.confirm('确定要删除这个文档吗？')) return;
    
    try {
      const token = localStorage.getItem('userToken');
      const response = await fetch(`${process.env.REACT_APP_API_URL || ''}/api/documents/${docId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (response.ok) {
        setDocuments(documents.filter(doc => doc.id !== docId));
        alert('文档删除成功');
      } else {
        const error = await response.json();
        alert(error.error || '删除失败，请稍后重试');
      }
    } catch (error) {
      console.error('删除文档失败:', error);
      alert('网络错误，请检查连接后重试');
    }
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">文档管理</h1>
        <p className="text-gray-600">管理您的知识库文档</p>
      </div>

      {documents.length === 0 ? (
        <div className="text-center py-12">
          <DocumentTextIcon className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">暂无文档</h3>
          <p className="mt-1 text-sm text-gray-500">
            开始上传您的第一个文档吧
          </p>
        </div>
      ) : (
        <div className="bg-white shadow overflow-hidden sm:rounded-md">
          <ul className="divide-y divide-gray-200">
            {documents.map((doc) => (
              <li key={doc.id}>
                <div className="px-4 py-4 flex items-center justify-between">
                  <div className="flex items-center">
                    <DocumentTextIcon className="h-8 w-8 text-gray-400 mr-3" />
                    <div>
                      <h3 className="text-sm font-medium text-gray-900">
                        {doc.title || doc.filename}
                      </h3>
                      <p className="text-sm text-gray-500">
                        {formatFileSize(doc.size)} • 
                        上传于 {new Date(doc.uploadedAt).toLocaleDateString()}
                      </p>
                      {doc.tags && doc.tags.length > 0 && (
                        <div className="mt-1">
                          {doc.tags.map((tag, index) => (
                            <span
                              key={index}
                              className="inline-block bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded mr-1"
                            >
                              {tag}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => setSelectedDoc(doc)}
                      className="text-blue-600 hover:text-blue-800"
                      title="查看详情"
                    >
                      <EyeIcon className="h-5 w-5" />
                    </button>
                    <button
                      onClick={() => deleteDocument(doc.id)}
                      className="text-red-600 hover:text-red-800"
                      title="删除文档"
                    >
                      <TrashIcon className="h-5 w-5" />
                    </button>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* 文档详情模态框 */}
      {selectedDoc && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-96 overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold">{selectedDoc.title || selectedDoc.filename}</h2>
              <button
                onClick={() => setSelectedDoc(null)}
                className="text-gray-500 hover:text-gray-700"
              >
                ×
              </button>
            </div>
            
            <div className="space-y-3">
              <div>
                <span className="font-medium">文件大小：</span>
                {formatFileSize(selectedDoc.size)}
              </div>
              <div>
                <span className="font-medium">上传时间：</span>
                {new Date(selectedDoc.uploadedAt).toLocaleString()}
              </div>
              {selectedDoc.summary && (
                <div>
                  <span className="font-medium">摘要：</span>
                  <p className="mt-1 text-gray-700">{selectedDoc.summary}</p>
                </div>
              )}
              {selectedDoc.content && (
                <div>
                  <span className="font-medium">内容预览：</span>
                  <p className="mt-1 text-gray-700 text-sm bg-gray-50 p-3 rounded max-h-32 overflow-y-auto">
                    {selectedDoc.content.substring(0, 500)}...
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DocumentsPage;
