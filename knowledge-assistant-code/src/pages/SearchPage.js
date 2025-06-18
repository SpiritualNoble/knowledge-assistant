import React, { useState } from 'react';

export default function SearchPage() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchPerformed, setSearchPerformed] = useState(false);

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!query.trim()) return;

    setLoading(true);
    setSearchPerformed(true);

    try {
      // 模拟API调用延迟
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // 模拟数据
      if (query.includes('知识管理')) {
        setResults([
          {
            id: '1',
            content: '知识管理是指对组织内的知识资源进行有效的识别、获取、开发、分解、存储、分享和使用的过程，目的是提高组织的创新能力和竞争力。',
            metadata: {
              source: 'knowledge_management.md',
              paragraph_index: 2
            },
            score: 0.92
          },
          {
            id: '2',
            content: '有效的知识管理系统应当包括知识获取、知识组织、知识存储、知识分享和知识应用五个核心环节。',
            metadata: {
              source: 'knowledge_management.md',
              paragraph_index: 5
            },
            score: 0.85
          }
        ]);
      } else {
        setResults([]);
      }
    } catch (err) {
      console.error('Search failed:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="py-10">
      <header>
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <h1 className="text-3xl font-bold leading-tight tracking-tight text-gray-900">
            知识搜索
          </h1>
        </div>
      </header>
      <main>
        <div className="mx-auto max-w-7xl sm:px-6 lg:px-8">
          <div className="px-4 py-8 sm:px-0">
            <form onSubmit={handleSearch} className="mb-8">
              <div className="flex rounded-md shadow-sm">
                <input
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  className="block w-full rounded-md border-0 py-3 pl-4 pr-10 text-gray-900 ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6"
                  placeholder="输入您的问题，例如：知识管理的核心环节是什么？"
                />
                <button
                  type="submit"
                  className="ml-4 inline-flex items-center rounded-md bg-indigo-600 px-6 py-3 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
                  disabled={loading}
                >
                  {loading ? '搜索中...' : '搜索'}
                </button>
              </div>
            </form>

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
                  尝试使用不同的关键词或更广泛的问题。
                </p>
              </div>
            )}

            {results.length > 0 && (
              <div className="mt-8">
                <h2 className="text-lg font-medium text-gray-900 mb-4">搜索结果</h2>
                <div className="space-y-6">
                  {results.map((result) => (
                    <div
                      key={result.id}
                      className="bg-white overflow-hidden shadow rounded-lg"
                    >
                      <div className="px-4 py-5 sm:p-6">
                        <div className="flex justify-between">
                          <span className="text-xs font-medium text-gray-500">
                            来源: {result.metadata.source}
                          </span>
                          <span className="text-xs font-medium text-indigo-600">
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
          </div>
        </div>
      </main>
    </div>
  );
}
