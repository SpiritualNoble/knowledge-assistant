import React, { useState, useEffect, useRef } from 'react';
import aiServiceSelector from '../services/aiServiceSelector';
import ApiKeyModal from '../components/ApiKeyModal';
import openaiService from '../services/openaiService';

export default function ChatPage({ user }) {
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [serviceInfo, setServiceInfo] = useState(null);
  const [showApiKeyModal, setShowApiKeyModal] = useState(false);
  const [hasApiKey, setHasApiKey] = useState(false);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    // 获取AI服务信息
    const updateServiceInfo = () => {
      setServiceInfo(aiServiceSelector.getServiceInfo());
      setHasApiKey(openaiService.hasApiKey());
    };
    
    updateServiceInfo();
    const interval = setInterval(updateServiceInfo, 2000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const handleApiKeySave = (apiKey) => {
    openaiService.setApiKey(apiKey);
    setHasApiKey(true);
    console.log('✅ OpenAI API密钥已设置');
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!inputMessage.trim() || loading) return;

    if (!user) {
      setError('请先登录后再进行对话');
      return;
    }

    const userMessage = {
      id: Date.now(),
      type: 'user',
      content: inputMessage.trim(),
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputMessage('');
    setLoading(true);
    setError(null);

    try {
      console.log('🤖 开始AI对话:', userMessage.content);
      
      // 使用AI服务选择器进行对话
      const response = await aiServiceSelector.searchDocuments(userMessage.content, { 
        userId: user.id,
        conversationMode: true 
      });
      
      const aiMessage = {
        id: Date.now() + 1,
        type: 'ai',
        content: response.answer || '抱歉，我无法理解您的问题，请尝试重新表述。',
        timestamp: new Date(),
        sources: response.results || []
      };

      setMessages(prev => [...prev, aiMessage]);
      
    } catch (error) {
      console.error('❌ 对话失败:', error);
      const errorMessage = {
        id: Date.now() + 1,
        type: 'ai',
        content: '抱歉，处理您的消息时出现了错误。请稍后重试。',
        timestamp: new Date(),
        isError: true
      };
      setMessages(prev => [...prev, errorMessage]);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const clearChat = () => {
    setMessages([]);
    setError(null);
  };

  const formatTime = (timestamp) => {
    return new Date(timestamp).toLocaleTimeString('zh-CN', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const renderMessage = (message) => {
    const isUser = message.type === 'user';
    
    return (
      <div key={message.id} className={`flex ${isUser ? 'justify-end' : 'justify-start'} mb-4`}>
        <div className={`max-w-3xl ${isUser ? 'order-2' : 'order-1'}`}>
          <div className={`flex items-end space-x-2 ${isUser ? 'flex-row-reverse space-x-reverse' : ''}`}>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
              isUser ? 'bg-blue-500' : message.isError ? 'bg-red-500' : 'bg-gray-500'
            }`}>
              <span className="text-white text-sm font-bold">
                {isUser ? '我' : 'AI'}
              </span>
            </div>
            
            <div className={`px-4 py-3 rounded-lg ${
              isUser 
                ? 'bg-blue-500 text-white' 
                : message.isError 
                  ? 'bg-red-50 border border-red-200 text-red-800'
                  : 'bg-gray-100 text-gray-800'
            }`}>
              <div className="whitespace-pre-wrap">{message.content}</div>
              
              {/* 显示来源文档 */}
              {message.sources && message.sources.length > 0 && (
                <div className="mt-3 pt-3 border-t border-gray-300">
                  <div className="text-xs text-gray-600 mb-2">参考来源:</div>
                  <div className="space-y-1">
                    {message.sources.slice(0, 3).map((source, index) => (
                      <div key={index} className="text-xs bg-white bg-opacity-50 rounded px-2 py-1">
                        📄 {source.docTitle || source.title || `文档 ${index + 1}`}
                      </div>
                    ))}
                  </div>
                </div>
              )}
              
              <div className={`text-xs mt-2 ${
                isUser ? 'text-blue-100' : 'text-gray-500'
              }`}>
                {formatTime(message.timestamp)}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* API密钥模态框 */}
      <ApiKeyModal 
        isOpen={showApiKeyModal}
        onClose={() => setShowApiKeyModal(false)}
        onSave={handleApiKeySave}
      />

      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* 页面标题 */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">🤖 智能对话助手</h1>
          <p className="text-gray-600">与AI助手对话，获取知识库中的精准答案</p>
          
          {/* 服务状态 */}
          <div className="mt-4 flex items-center justify-center space-x-4">
            <div className="flex items-center space-x-2">
              <div className={`w-2 h-2 rounded-full ${serviceInfo?.available ? 'bg-green-500' : 'bg-red-500'}`}></div>
              <span className="text-sm text-gray-600">
                {serviceInfo?.name || '服务检测中...'}
              </span>
            </div>
            
            {!hasApiKey && (
              <button
                onClick={() => setShowApiKeyModal(true)}
                className="text-sm text-blue-600 hover:text-blue-800 underline"
              >
                配置API密钥
              </button>
            )}
            
            {messages.length > 0 && (
              <button
                onClick={clearChat}
                className="text-sm text-gray-600 hover:text-gray-800 underline"
              >
                清空对话
              </button>
            )}
          </div>
        </div>

        {/* 错误提示 */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-700">{error}</p>
          </div>
        )}

        {/* 对话区域 */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 mb-6">
          <div className="h-96 overflow-y-auto p-6">
            {messages.length === 0 ? (
              <div className="text-center text-gray-500 mt-20">
                <div className="text-4xl mb-4">💬</div>
                <p>开始与AI助手对话吧！</p>
                <p className="text-sm mt-2">我可以帮您从知识库中找到相关信息</p>
              </div>
            ) : (
              <div>
                {messages.map(renderMessage)}
                {loading && (
                  <div className="flex justify-start mb-4">
                    <div className="flex items-end space-x-2">
                      <div className="w-8 h-8 bg-gray-500 rounded-full flex items-center justify-center">
                        <span className="text-white text-sm font-bold">AI</span>
                      </div>
                      <div className="bg-gray-100 px-4 py-3 rounded-lg">
                        <div className="flex space-x-1">
                          <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                          <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{animationDelay: '0.1s'}}></div>
                          <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
        </div>

        {/* 输入区域 */}
        <form onSubmit={handleSendMessage} className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <div className="flex space-x-4">
            <input
              type="text"
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              placeholder="输入您的问题..."
              disabled={loading || !user}
              className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed"
            />
            <button
              type="submit"
              disabled={loading || !inputMessage.trim() || !user}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
            >
              {loading ? '发送中...' : '发送'}
            </button>
          </div>
          
          {!user && (
            <p className="text-sm text-gray-500 mt-2">请先登录后再开始对话</p>
          )}
        </form>

        {/* 使用提示 */}
        <div className="mt-8 bg-blue-50 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-blue-900 mb-3">💡 对话技巧</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <h4 className="font-medium text-blue-800 mb-2">提问示例:</h4>
              <ul className="text-sm text-blue-700 space-y-1">
                <li>• "如何配置数据库连接？"</li>
                <li>• "项目部署的详细步骤是什么？"</li>
                <li>• "API接口的使用方法"</li>
                <li>• "有哪些最佳实践？"</li>
              </ul>
            </div>
            <div>
              <h4 className="font-medium text-blue-800 mb-2">功能特点:</h4>
              <ul className="text-sm text-blue-700 space-y-1">
                <li>• 基于知识库的精准回答</li>
                <li>• 显示信息来源和参考文档</li>
                <li>• 支持上下文理解</li>
                <li>• 实时响应，低延迟</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
