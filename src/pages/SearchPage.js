import React, { useState } from 'react';
import { searchKnowledge } from '../services/api';
import intelligentDocumentService from '../services/intelligentDocumentService';

export default function SearchPage({ user }) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [intelligentAnswer, setIntelligentAnswer] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [searchPerformed, setSearchPerformed] = useState(false);
  const [searchMetadata, setSearchMetadata] = useState(null);

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!query.trim()) return;

    if (!user) {
      setError('请先登录后再进行搜索');
      return;
    }

    setLoading(true);
    setError(null);
    setSearchPerformed(true);
    setResults([]);
    setIntelligentAnswer('');
    setSearchMetadata(null);

    try {
      console.log('🧠 开始智能搜索:', query);
      
      // 使用智能文档服务搜索
      const searchResult = await intelligentDocumentService.search(query, user.id);
      
      console.log('📋 搜索结果:', searchResult);
      
      // 设置智能回答
      setIntelligentAnswer(searchResult.answer);
      
      // 转换结果格式
      const formattedResults = searchResult.results.map((result, index) => ({
        id: result.id || `result_${Date.now()}_${index}`,
        content: result.content || '',
        score: result.score,
        metadata: {
          source: result.docTitle || result.title || '文档',
          title: result.title || '相关内容',
          category: result.type || 'general',
          tags: [],
          uploadedAt: new Date().toISOString()
        }
      }));
      
      setResults(formattedResults);
      setSearchMetadata({
        totalResults: searchResult.totalFound || 0,
        responseTime: 50,
        searchType: searchResult.searchType || 'intelligent',
        confidence: searchResult.confidence || 0,
        aiPowered: searchResult.aiPowered || false
      });
      
      console.log('✅ 智能搜索完成，找到', formattedResults.length, '个结果');
      console.log('🤖 AI增强:', searchResult.aiPowered ? '是' : '否');
      
    } catch (err) {
      console.error('❌ 智能搜索失败:', err);
      setError('搜索过程中遇到问题，请稍后重试。');
    } finally {
      setLoading(false);
    }
  };

  const formatScore = (score) => {
    return (score * 100).toFixed(1);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('zh-CN');
  };

  const renderIntelligentAnswer = () => {
    if (!intelligentAnswer) return null;

    return (
      <div className="mb-8 p-6 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg">
        <div className="flex items-center mb-4">
          <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center mr-3">
            <span className="text-white text-sm font-bold">AI</span>
          </div>
          <h3 className="text-lg font-semibold text-blue-900">智能回答</h3>
          {searchMetadata && (
            <span className="ml-auto text-xs text-blue-600 bg-blue-100 px-2 py-1 rounded">
              {searchMetadata.searchType} · {searchMetadata.responseTime}ms
            </span>
          )}
        </div>
        
        <div className="prose prose-blue max-w-none">
          <div 
            className="text-gray-800 leading-relaxed whitespace-pre-wrap"
            dangerouslySetInnerHTML={{
              __html: intelligentAnswer.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
            }}
          />
        </div>

        {searchMetadata && (
          <div className="mt-4 pt-4 border-t border-blue-200">
            <div className="flex items-center text-xs text-blue-600 space-x-4">
              <span>总结果: {searchMetadata.totalResults}</span>
              <span>置信度: {(searchMetadata.confidence * 100).toFixed(1)}%</span>
              <span>响应时间: {searchMetadata.responseTime}ms</span>
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">🔍 智能搜索</h1>
        <p className="text-gray-600">基于LLM-RAG技术的自然语言搜索，理解您的意图并提供精准答案</p>
      </div>

      <form onSubmit={handleSearch} className="mb-8">
        <div className="flex space-x-4">
          <div className="flex-1">
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="请输入您的问题，支持自然语言查询..."
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-lg"
              disabled={loading}
            />
          </div>
          <button
            type="submit"
            disabled={loading || !query.trim()}
            className="px-8 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
          >
            {loading ? '搜索中...' : '搜索'}
          </button>
        </div>
      </form>

      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-red-700">{error}</p>
        </div>
      )}

      {loading && (
        <div className="text-center py-12">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <p className="mt-4 text-gray-600">正在分析查询并搜索相关内容...</p>
        </div>
      )}

      {/* 智能回答区域 */}
      {renderIntelligentAnswer()}

      {/* 搜索结果 */}
      {searchPerformed && !loading && (
        <div>
          {results.length > 0 ? (
            <div>
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold text-gray-900">
                  📋 相关文档 ({results.length})
                </h2>
                {searchMetadata && (
                  <div className="text-sm text-gray-500">
                    搜索类型: {searchMetadata.searchType === 'hybrid' ? '混合搜索' : 
                              searchMetadata.searchType === 'semantic' ? '语义搜索' : '关键词搜索'}
                  </div>
                )}
              </div>
              
              <div className="space-y-6">
                {results.map((result, index) => (
                  <div key={result.id} className="bg-white border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <h3 className="text-lg font-semibold text-gray-900 mb-1">
                          {result.metadata?.title || result.metadata?.source || `文档 ${index + 1}`}
                        </h3>
                        <div className="flex items-center text-sm text-gray-500 space-x-4">
                          <span>📁 {result.metadata?.category || '通用'}</span>
                          <span>📅 {result.metadata?.uploadedAt ? formatDate(result.metadata.uploadedAt) : '未知'}</span>
                          <span className="flex items-center">
                            <span className="w-2 h-2 bg-green-400 rounded-full mr-1"></span>
                            相关性: {formatScore(result.score)}%
                          </span>
                          {result.type && (
                            <span className={`px-2 py-1 rounded text-xs ${
                              result.type === 'semantic' ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'
                            }`}>
                              {result.type === 'semantic' ? '语义匹配' : '关键词匹配'}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    
                    <div className="text-gray-700 leading-relaxed mb-4">
                      {result.content}
                    </div>
                    
                    {result.metadata?.tags && result.metadata.tags.length > 0 && (
                      <div className="flex flex-wrap gap-2">
                        {result.metadata.tags.map((tag, tagIndex) => (
                          <span key={tagIndex} className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded">
                            #{tag}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="text-center py-12">
              <div className="text-6xl mb-4">🔍</div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">未找到相关内容</h3>
              <div className="text-gray-600 space-y-2">
                <p>在您的个人知识库中未找到相关内容，尝试使用不同的关键词或上传更多文档。</p>
                <div className="mt-4 p-4 bg-gray-50 rounded-lg text-left max-w-md mx-auto">
                  <h4 className="font-medium text-gray-900 mb-2">💡 搜索建议：</h4>
                  <ul className="text-sm text-gray-600 space-y-1">
                    <li>• 使用自然语言描述您的问题</li>
                    <li>• 尝试不同的关键词组合</li>
                    <li>• 检查拼写是否正确</li>
                    <li>• 上传更多相关文档到知识库</li>
                  </ul>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {!searchPerformed && !loading && (
        <div className="text-center py-12">
          <div className="text-6xl mb-4">🤖</div>
          <h3 className="text-xl font-semibold text-gray-900 mb-2">AI驱动的智能搜索</h3>
          <div className="text-gray-600 max-w-2xl mx-auto space-y-4">
            <p>使用自然语言描述您的问题，AI将理解您的意图并从知识库中找到最相关的答案。</p>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
              <div className="p-4 bg-blue-50 rounded-lg text-left">
                <h4 className="font-medium text-blue-900 mb-2">🎯 智能特性</h4>
                <ul className="text-sm text-blue-700 space-y-1">
                  <li>• 自然语言查询理解</li>
                  <li>• 语义搜索 + 关键词匹配</li>
                  <li>• AI生成的智能回答</li>
                  <li>• 溯源增强的结果展示</li>
                </ul>
              </div>
              
              <div className="p-4 bg-green-50 rounded-lg text-left">
                <h4 className="font-medium text-green-900 mb-2">📝 查询示例</h4>
                <ul className="text-sm text-green-700 space-y-1">
                  <li>• "如何配置数据库连接？"</li>
                  <li>• "项目部署的详细步骤"</li>
                  <li>• "API接口的使用方法"</li>
                  <li>• "常见错误的解决方案"</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
