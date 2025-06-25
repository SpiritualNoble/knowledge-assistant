import React, { useState } from 'react';
import { searchKnowledge } from '../services/api';

export default function SearchPage() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [searchPerformed, setSearchPerformed] = useState(false);

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!query.trim()) return;

    setLoading(true);
    setError(null);
    setSearchPerformed(true);

    try {
      // 在实际部署前，使用模拟数据
      // 实际部署后，取消注释下面的代码
      /*
      const data = await searchKnowledge(query);
      setResults(data.results || []);
      */
      
      // 模拟API调用延迟
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // 模拟数据
      if (query.includes('用户研究')) {
        setResults([
          {
            id: '1',
            content: '用户研究是产品开发过程中不可或缺的环节，它能够帮助产品团队深入理解目标用户的需求、痛点和行为模式，验证产品假设和设计决策，发现潜在的产品机会和创新点，降低产品开发风险，提高产品成功率，建立以用户为中心的产品文化。',
            metadata: {
              source: 'user_research_methods.md',
              paragraph_index: 2
            },
            score: 0.92
          },
          {
            id: '2',
            content: '常用用户研究方法包括用户访谈、问卷调查、可用性测试、用户画像、用户旅程地图、A/B测试和卡片分类法等。每种方法适用于不同的研究目的和阶段。',
            metadata: {
              source: 'user_research_methods.md',
              paragraph_index: 12
            },
            score: 0.85
          }
        ]);
      } else if (query.includes('产品指标')) {
        setResults([
          {
            id: '3',
            content: '产品指标体系应当覆盖用户生命周期的各个阶段，从获取到激活、留存、收入和推荐。AARRR框架（也称为海盗指标）是一个常用的产品指标体系框架。',
            metadata: {
              source: 'product_metrics.md',
              paragraph_index: 1
            },
            score: 0.89
          }
        ]);
      } else {
        setResults([]);
      }
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
                  className="block w-full rounded-md border-0 py-3 pl-4 pr-10 text-gray-900 ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-primary-600 sm:text-sm sm:leading-6"
                  placeholder="输入您的问题，例如：用户研究的重要性是什么？"
                />
                <button
                  type="submit"
                  className="ml-4 inline-flex items-center rounded-md bg-primary-600 px-6 py-3 text-sm font-semibold text-white shadow-sm hover:bg-primary-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-600"
                  disabled={loading}
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
                          <span className="text-xs font-medium text-primary-600">
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
