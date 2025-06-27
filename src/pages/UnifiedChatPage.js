import React, { useState, useEffect, useRef } from 'react';
import { Send, Bot, User, Loader, Search, Upload, Settings, Paperclip } from 'lucide-react';
import aiServiceSelector from '../services/aiServiceSelector';

export default function UnifiedChatPage({ user }) {
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [serviceInfo, setServiceInfo] = useState(null);
  const [showUpload, setShowUpload] = useState(false);
  const messagesEndRef = useRef(null);
  const fileInputRef = useRef(null);

  // 聊天历史记录的localStorage key
  const getChatHistoryKey = () => user ? `chat_history_${user.id}` : 'chat_history_guest';

  // 加载聊天历史记录
  useEffect(() => {
    const loadChatHistory = () => {
      try {
        const historyKey = getChatHistoryKey();
        const savedHistory = localStorage.getItem(historyKey);
        
        if (savedHistory) {
          const parsedHistory = JSON.parse(savedHistory);
          // 确保历史记录是数组且不为空
          if (Array.isArray(parsedHistory) && parsedHistory.length > 0) {
            setMessages(parsedHistory);
            return;
          }
        }
      } catch (error) {
        console.error('加载聊天历史失败:', error);
      }
      
      // 如果没有历史记录或加载失败，显示欢迎消息
      setMessages([{
        id: Date.now(),
        type: 'assistant',
        content: '你好！我是智能知识助手，可以帮你搜索知识库、回答问题。你可以：\n\n• 直接问问题，我会从知识库中找答案\n• 上传文档来扩充知识库\n• 进行自然语言对话\n\n有什么可以帮你的吗？',
        timestamp: new Date()
      }]);
    };

    loadChatHistory();
  }, [user]);

  // 保存聊天历史记录
  useEffect(() => {
    if (messages.length > 0) {
      try {
        const historyKey = getChatHistoryKey();
        localStorage.setItem(historyKey, JSON.stringify(messages));
      } catch (error) {
        console.error('保存聊天历史失败:', error);
      }
    }
  }, [messages, user]);

  useEffect(() => {
    // 获取AI服务信息
    const updateServiceInfo = () => {
      const info = aiServiceSelector.getServiceInfo();
      setServiceInfo(info);
    };
    
    updateServiceInfo();
    const interval = setInterval(updateServiceInfo, 5000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!inputMessage.trim() || isLoading) return;

    if (!user) {
      addMessage('system', '请先登录后再进行对话');
      return;
    }

    const userMessage = inputMessage.trim();
    addMessage('user', userMessage);
    setInputMessage('');
    setIsLoading(true);

    try {
      console.log('🤖 开始AI对话:', userMessage);
      
      // 使用AI服务选择器进行搜索和对话
      const response = await aiServiceSelector.searchDocuments(userMessage, { 
        userId: user.id,
        conversationMode: true,
        includeAnswer: true
      });
      
      let assistantMessage = '';
      
      // 如果有智能回答，优先使用
      if (response.answer || response.intelligentAnswer) {
        assistantMessage = response.answer || response.intelligentAnswer;
      } else if (response.results && response.results.length > 0) {
        // 基于搜索结果生成回答
        const topResult = response.results[0];
        assistantMessage = `根据文档《${topResult.title}》的内容：\n\n${topResult.content}`;
        
        if (response.results.length > 1) {
          assistantMessage += `\n\n相关文档还包括：${response.results.slice(1, 3).map(r => r.title).join('、')}`;
        }
      } else {
        assistantMessage = '抱歉，我在知识库中没有找到相关信息。你可以尝试：\n\n• 换个方式描述问题\n• 上传相关文档来扩充知识库\n• 检查问题是否在我的知识范围内';
      }

      addMessage('assistant', assistantMessage, response.results);
      
    } catch (error) {
      console.error('❌ 对话失败:', error);
      addMessage('assistant', '抱歉，处理您的消息时出现了错误。请稍后重试。', null, true);
    } finally {
      setIsLoading(false);
    }
  };

  const addMessage = (type, content, sources = null, isError = false) => {
    const message = {
      id: Date.now(),
      type,
      content,
      timestamp: new Date(),
      sources,
      isError
    };
    setMessages(prev => [...prev, message]);
  };

  const handleFileUpload = async (event) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    const file = files[0];
    if (!user) {
      addMessage('system', '请先登录后再上传文档');
      return;
    }

    setIsLoading(true);
    addMessage('user', `📎 上传文档: ${file.name}`);

    try {
      const content = await readFileContent(file);
      const document = {
        id: Date.now().toString(),
        title: file.name,
        content: content,
        userId: user.id,
        source: 'upload',
        type: file.type
      };

      const result = await aiServiceSelector.addDocument(document);
      
      if (result.success !== false) {
        addMessage('assistant', `✅ 文档《${file.name}》已成功添加到知识库！现在你可以向我询问关于这个文档的问题了。`);
      } else {
        addMessage('assistant', `❌ 文档上传失败：${result.error || '未知错误'}`, null, true);
      }
    } catch (error) {
      console.error('文档上传失败:', error);
      addMessage('assistant', `❌ 文档上传失败：${error.message}`, null, true);
    } finally {
      setIsLoading(false);
      event.target.value = '';
    }
  };

  const readFileContent = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => resolve(e.target.result);
      reader.onerror = (e) => reject(new Error('文件读取失败'));
      reader.readAsText(file, 'UTF-8');
    });
  };

  const formatTime = (timestamp) => {
    return new Date(timestamp).toLocaleTimeString('zh-CN', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const renderMessage = (message) => {
    const isUser = message.type === 'user';
    const isSystem = message.type === 'system';
    
    return (
      <div key={message.id} className={`flex ${isUser ? 'justify-end' : 'justify-start'} mb-6`}>
        <div className={`max-w-4xl ${isUser ? 'order-2' : 'order-1'}`}>
          <div className={`flex items-start space-x-3 ${isUser ? 'flex-row-reverse space-x-reverse' : ''}`}>
            {/* 头像 */}
            <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${
              isUser ? 'bg-blue-500' : 
              isSystem ? 'bg-gray-500' :
              message.isError ? 'bg-red-500' : 'bg-green-500'
            }`}>
              {isUser ? (
                <User className="w-5 h-5 text-white" />
              ) : (
                <Bot className="w-5 h-5 text-white" />
              )}
            </div>
            
            {/* 消息内容 */}
            <div className={`rounded-2xl px-4 py-3 ${
              isUser 
                ? 'bg-blue-500 text-white' 
                : isSystem
                  ? 'bg-gray-100 text-gray-700'
                  : message.isError 
                    ? 'bg-red-50 border border-red-200 text-red-800'
                    : 'bg-white border border-gray-200 text-gray-800 shadow-sm'
            }`}>
              <div className="whitespace-pre-wrap leading-relaxed">{message.content}</div>
              
              {/* 显示来源文档 */}
              {message.sources && message.sources.length > 0 && (
                <div className="mt-4 pt-3 border-t border-gray-200">
                  <div className="text-xs text-gray-500 mb-2">📚 参考来源:</div>
                  <div className="space-y-2">
                    {message.sources.slice(0, 3).map((source, index) => (
                      <div key={index} className="text-xs bg-gray-50 rounded-lg px-3 py-2 border">
                        <div className="font-medium text-gray-700">
                          📄 {source.title || `文档 ${index + 1}`}
                        </div>
                        {source.score && (
                          <div className="text-gray-500 mt-1">
                            相似度: {(source.score * 100).toFixed(1)}%
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
              
              <div className={`text-xs mt-2 ${
                isUser ? 'text-blue-100' : 'text-gray-400'
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
    <div className="flex flex-col h-screen bg-gray-50">
      {/* 顶部状态栏 */}
      <div className="bg-white shadow-sm border-b px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-green-500 rounded-full flex items-center justify-center">
              <Bot className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-semibold text-gray-900">智能知识助手</h1>
              <div className="flex items-center space-x-2">
                <div className={`w-2 h-2 rounded-full ${serviceInfo?.type === 'local_ai' ? 'bg-green-500' : serviceInfo?.type === 'cloud_ai' ? 'bg-blue-500' : 'bg-gray-500'}`}></div>
                <span className="text-sm text-gray-500">
                  {serviceInfo?.serviceName || '服务检测中...'}
                </span>
              </div>
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            <button
              onClick={() => fileInputRef.current?.click()}
              className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
              title="上传文档"
            >
              <Upload className="w-5 h-5" />
            </button>
            <button
              onClick={() => {
                const welcomeMessage = {
                  id: Date.now(),
                  type: 'assistant',
                  content: '你好！我是智能知识助手，可以帮你搜索知识库、回答问题。你可以：\n\n• 直接问问题，我会从知识库中找答案\n• 上传文档来扩充知识库\n• 进行自然语言对话\n\n有什么可以帮你的吗？',
                  timestamp: new Date()
                };
                setMessages([welcomeMessage]);
                // 清空localStorage中的历史记录
                try {
                  const historyKey = getChatHistoryKey();
                  localStorage.removeItem(historyKey);
                } catch (error) {
                  console.error('清空历史记录失败:', error);
                }
              }}
              className="px-3 py-1 text-sm text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors"
            >
              清空对话
            </button>
          </div>
        </div>
      </div>

      {/* 消息区域 */}
      <div className="flex-1 overflow-y-auto px-6 py-6">
        <div className="max-w-4xl mx-auto">
          {messages.map(renderMessage)}
          
          {/* 加载状态 */}
          {isLoading && (
            <div className="flex justify-start mb-6">
              <div className="flex items-start space-x-3">
                <div className="w-10 h-10 bg-green-500 rounded-full flex items-center justify-center">
                  <Bot className="w-5 h-5 text-white" />
                </div>
                <div className="bg-white border border-gray-200 rounded-2xl px-4 py-3 shadow-sm">
                  <div className="flex items-center space-x-2">
                    <Loader className="w-4 h-4 animate-spin text-gray-500" />
                    <span className="text-sm text-gray-500">正在思考中...</span>
                  </div>
                </div>
              </div>
            </div>
          )}
          
          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* 输入区域 */}
      <div className="bg-white border-t px-6 py-4">
        <div className="max-w-4xl mx-auto">
          <form onSubmit={handleSendMessage} className="flex items-end space-x-4">
            <div className="flex-1">
              <textarea
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                onKeyPress={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSendMessage(e);
                  }
                }}
                placeholder={user ? "输入你的问题，我会从知识库中找到答案..." : "请先登录后再开始对话"}
                className="w-full px-4 py-3 border border-gray-300 rounded-2xl focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none max-h-32"
                rows="1"
                disabled={isLoading || !user}
                style={{ minHeight: '48px' }}
              />
            </div>
            
            <div className="flex items-center space-x-2">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={isLoading || !user}
                className="p-3 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-full disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                title="上传文档"
              >
                <Paperclip className="w-5 h-5" />
              </button>
              
              <button
                type="submit"
                disabled={!inputMessage.trim() || isLoading || !user}
                className="p-3 bg-blue-500 text-white rounded-full hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <Send className="w-5 h-5" />
              </button>
            </div>
          </form>
          
          {!user && (
            <p className="text-sm text-gray-500 mt-2 text-center">请先登录后再开始对话</p>
          )}
        </div>
      </div>

      {/* 隐藏的文件输入 */}
      <input
        ref={fileInputRef}
        type="file"
        onChange={handleFileUpload}
        accept=".txt,.md,.pdf,.doc,.docx"
        className="hidden"
      />
    </div>
  );
}
