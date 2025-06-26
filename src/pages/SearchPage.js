import React, { useState } from 'react';
import { searchKnowledge } from '../services/api';

export default function SearchPage({ user }) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [searchPerformed, setSearchPerformed] = useState(false);

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

    try {
      // 在实际部署前，使用模拟数据
      // 实际部署后，取消注释下面的代码
      /*
      const token = localStorage.getItem('userToken');
      const data = await searchKnowledge(query, token);
      setResults(data.results || []);
      */
      
      // 模拟API调用延迟
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // 模拟数据 - 根据用户显示不同结果
      const mockResults = [
        {
          id: '1',
          content: `针对您的个人知识库搜索结果：这是一个关于"${query}"的详细解答。基于您上传的文档内容，我们为您提供最相关的信息。`,
          metadata: {
            source: `personal_knowledge_base.md`,
            paragraph_index: 1,
            uploadedBy: user.email
          },
          score: 0.92
        },
        {
          id: '2',
          content: `在您的知识库中，关于"${query}"还有以下相关内容：这些信息来自您上传的文档，确保了内容的准确性和相关性。`,
          metadata: {
            source: `my_documents.pdf`,
            paragraph_index: 3,
            uploadedBy: user.email
          },
          score: 0.85
        }
      ];
      
      setResults(mockResults);
    } catch (err) {
      console.error('Search failed:', err);
      setError('搜索失败，请稍后再试');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="py-10">
      <header>
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <h1 className="text-3xl font-bold leading-tight tracking-tight text-gray-900">
            智能知识搜索
          </h1>
          <p className="mt-2 text-lg text-gray-600">
            在您的专属知识库中快速找到所需信息
          </p>
        </div>
      </header>
      <main>
        <div className="mx-auto max-w-7xl sm:px-6 lg:px-8">
          <div className="px-4 py-8 sm:px-0">
            {!user && (
              <div className="rounded-md bg-yellow-50 p-4 mb-6">
                <div className="flex">
                  <div className="ml-3">
                    <h3 className="text-sm font-medium text-yellow-800">提示</h3>
                    <div className="mt-2 text-sm text-yellow-700">
                      <p>请先登录后再使用搜索功能，这样可以确保您只搜索到属于您组织的知识内容。</p>
                    </div>
                  </div>
                </div>
              </div>
            )}
            
            <form onSubmit={handleSearch} className="mb-8">
              <div className="flex rounded-md shadow-sm">
                <input
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  className="block w-full rounded-md border-0 py-3 pl-4 pr-10 text-gray-900 ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-blue-600 sm:text-sm sm:leading-6"
                  placeholder="输入您的问题，例如：项目管理最佳实践、技术文档规范等..."
                  disabled={!user}
                />
                <button
                  type="submit"
                  className="ml-4 inline-flex items-center rounded-md bg-blue-600 px-6 py-3 text-sm font-semibold text-white shadow-sm hover:bg-blue-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 disabled:opacity-50"
                  disabled={loading || !user}
                >
                  {loading ? '搜索中...' : '搜索'}
                </button>
              </div>
            </form>

            {error && (
              <div className="rounded-md bg-red-50 p-4 mb-6">
                <div className="flex">
                  <div className="ml-3">
                    <h3 className="text-sm font-medium text-red-800">错误</h3>
                    <div className="mt-2 text-sm text-red-700">
                      <p>{error}</p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {searchPerformed && !loading && results.length === 0 && (
              <div className="text-center py-12">
                <svg
                  className="mx-auto h-12 w-12 text-gray-400"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  aria-hidden="true"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                <h3 className="mt-2 text-sm font-medium text-gray-900">未找到结果</h3>
                <p className="mt-1 text-sm text-gray-500">
                  在您的个人知识库中未找到相关内容，尝试使用不同的关键词或上传更多文档。
                </p>
              </div>
            )}

            {results.length > 0 && (
              <div className="mt-8">
                <h2 className="text-lg font-medium text-gray-900 mb-4">
                  搜索结果 ({results.length} 条)
                </h2>
                <div className="space-y-6">
                  {results.map((result) => (
                    <div
                      key={result.id}
                      className="bg-white overflow-hidden shadow rounded-lg border-l-4 border-blue-500"
                    >
                      <div className="px-4 py-5 sm:p-6">
                        <div className="flex justify-between items-start mb-2">
                          <div className="flex-1">
                            <span className="text-xs font-medium text-gray-500">
                              来源: {result.metadata.source}
                            </span>
                            {result.metadata.uploadedBy && (
                              <span className="ml-4 text-xs text-gray-400">
                                上传者: {result.metadata.uploadedBy}
                              </span>
                            )}
                          </div>
                          <span className="text-xs font-medium text-blue-600 bg-blue-100 px-2 py-1 rounded">
                            相关度: {(result.score * 100).toFixed(0)}%
                          </span>
                        </div>
                        <div className="mt-2 text-sm text-gray-700">
                          <p>{result.content}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {user && (
              <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h4 className="font-medium text-blue-900 mb-2">搜索提示</h4>
                <ul className="text-sm text-blue-700 space-y-1">
                  <li>• 使用具体的关键词可以获得更精准的结果</li>
                  <li>• 支持自然语言问题，如"如何提高用户留存率？"</li>
                  <li>• 搜索结果仅来自您的个人知识库</li>
                  <li>• 可以搜索文档内容、标题和标签</li>
                </ul>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
