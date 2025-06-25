import React, { useState, useEffect } from 'react';
import { 
  FunnelIcon, 
  TagIcon, 
  DocumentTextIcon,
  CalendarIcon,
  UserIcon,
  AdjustmentsHorizontalIcon,
  XMarkIcon
} from '@heroicons/react/24/outline';
import TagFilter from '../components/TagFilter';

const KnowledgeFilter = () => {
  const [selectedTags, setSelectedTags] = useState([]);
  const [selectedSources, setSelectedSources] = useState([]);
  const [dateRange, setDateRange] = useState({ start: '', end: '' });
  const [selectedAuthors, setSelectedAuthors] = useState([]);
  const [filteredResults, setFilteredResults] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  // 模拟数据
  const availableTags = [
    { id: 1, name: '产品需求', count: 45, color: '#3B82F6' },
    { id: 2, name: '用户研究', count: 32, color: '#10B981' },
    { id: 3, name: '竞品分析', count: 28, color: '#F59E0B' },
    { id: 4, name: '数据分析', count: 56, color: '#EF4444' },
    { id: 5, name: '项目管理', count: 23, color: '#8B5CF6' },
    { id: 6, name: 'UI设计', count: 19, color: '#EC4899' },
    { id: 7, name: '技术方案', count: 34, color: '#6B7280' },
    { id: 8, name: '市场调研', count: 41, color: '#14B8A6' },
  ];

  const dataSources = [
    { id: 'feishu', name: '飞书文档', count: 156, icon: '📄' },
    { id: 'yuque', name: '语雀知识库', count: 89, icon: '📚' },
    { id: 'dingtalk', name: '钉钉文档', count: 67, icon: '💼' },
    { id: 'web', name: '网页收藏', count: 234, icon: '🌐' },
    { id: 'upload', name: '本地上传', count: 45, icon: '📁' },
  ];

  const authors = [
    { id: 1, name: '张产品', count: 78 },
    { id: 2, name: '李设计', count: 45 },
    { id: 3, name: '王开发', count: 67 },
    { id: 4, name: '赵运营', count: 34 },
  ];

  // 模拟搜索结果
  const mockResults = [
    {
      id: 1,
      title: '用户画像分析报告',
      content: '基于用户行为数据的深度分析，识别核心用户群体特征...',
      tags: ['用户研究', '数据分析'],
      source: 'feishu',
      author: '张产品',
      date: '2024-03-15',
      relevance: 0.95
    },
    {
      id: 2,
      title: '竞品功能对比分析',
      content: '对主要竞争对手的核心功能进行详细对比分析...',
      tags: ['竞品分析', '产品需求'],
      source: 'yuque',
      author: '李设计',
      date: '2024-03-12',
      relevance: 0.87
    },
    // 更多结果...
  ];

  // 处理筛选
  const handleFilter = () => {
    setIsLoading(true);
    // 模拟API调用
    setTimeout(() => {
      setFilteredResults(mockResults);
      setIsLoading(false);
    }, 1000);
  };

  // 清空所有筛选条件
  const clearAllFilters = () => {
    setSelectedTags([]);
    setSelectedSources([]);
    setDateRange({ start: '', end: '' });
    setSelectedAuthors([]);
    setFilteredResults([]);
  };

  const hasActiveFilters = selectedTags.length > 0 || selectedSources.length > 0 || 
                         dateRange.start || dateRange.end || selectedAuthors.length > 0;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 py-6">
        {/* 页面标题 */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900 flex items-center">
            <FunnelIcon className="h-6 w-6 mr-2" />
            知识库筛选
          </h1>
          <p className="text-gray-600 mt-1">通过标签、来源、时间等条件精确筛选知识内容</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* 左侧筛选面板 */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 sticky top-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-gray-900">筛选条件</h2>
                {hasActiveFilters && (
                  <button
                    onClick={clearAllFilters}
                    className="text-sm text-blue-600 hover:text-blue-800"
                  >
                    清空全部
                  </button>
                )}
              </div>

              {/* 标签筛选 */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <TagIcon className="h-4 w-4 inline mr-1" />
                  标签
                </label>
                <TagFilter
                  availableTags={availableTags}
                  selectedTags={selectedTags}
                  onFilterChange={setSelectedTags}
                />
              </div>

              {/* 数据源筛选 */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <DocumentTextIcon className="h-4 w-4 inline mr-1" />
                  数据源
                </label>
                <div className="space-y-2">
                  {dataSources.map((source) => (
                    <label key={source.id} className="flex items-center">
                      <input
                        type="checkbox"
                        checked={selectedSources.includes(source.id)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedSources([...selectedSources, source.id]);
                          } else {
                            setSelectedSources(selectedSources.filter(id => id !== source.id));
                          }
                        }}
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                      />
                      <span className="ml-2 text-sm text-gray-700 flex items-center">
                        <span className="mr-1">{source.icon}</span>
                        {source.name}
                        <span className="ml-auto text-xs text-gray-500">({source.count})</span>
                      </span>
                    </label>
                  ))}
                </div>
              </div>

              {/* 时间范围 */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <CalendarIcon className="h-4 w-4 inline mr-1" />
                  时间范围
                </label>
                <div className="space-y-2">
                  <input
                    type="date"
                    value={dateRange.start}
                    onChange={(e) => setDateRange({...dateRange, start: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                    placeholder="开始日期"
                  />
                  <input
                    type="date"
                    value={dateRange.end}
                    onChange={(e) => setDateRange({...dateRange, end: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                    placeholder="结束日期"
                  />
                </div>
              </div>

              {/* 作者筛选 */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <UserIcon className="h-4 w-4 inline mr-1" />
                  作者
                </label>
                <div className="space-y-2">
                  {authors.map((author) => (
                    <label key={author.id} className="flex items-center">
                      <input
                        type="checkbox"
                        checked={selectedAuthors.includes(author.id)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedAuthors([...selectedAuthors, author.id]);
                          } else {
                            setSelectedAuthors(selectedAuthors.filter(id => id !== author.id));
                          }
                        }}
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                      />
                      <span className="ml-2 text-sm text-gray-700 flex items-center justify-between w-full">
                        {author.name}
                        <span className="text-xs text-gray-500">({author.count})</span>
                      </span>
                    </label>
                  ))}
                </div>
              </div>

              {/* 应用筛选按钮 */}
              <button
                onClick={handleFilter}
                disabled={!hasActiveFilters || isLoading}
                className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
              >
                {isLoading ? '筛选中...' : '应用筛选'}
              </button>
            </div>
          </div>

          {/* 右侧结果区域 */}
          <div className="lg:col-span-3">
            {/* 当前筛选条件展示 */}
            {hasActiveFilters && (
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-4">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-sm font-medium text-gray-700">当前筛选条件</h3>
                  <span className="text-xs text-gray-500">
                    {filteredResults.length} 个结果
                  </span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {selectedTags.map((tag) => (
                    <span key={tag.id} className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-blue-100 text-blue-800">
                      {tag.name}
                      <button
                        onClick={() => setSelectedTags(selectedTags.filter(t => t.id !== tag.id))}
                        className="ml-1 h-3 w-3"
                      >
                        <XMarkIcon className="h-3 w-3" />
                      </button>
                    </span>
                  ))}
                  {selectedSources.map((sourceId) => {
                    const source = dataSources.find(s => s.id === sourceId);
                    return (
                      <span key={sourceId} className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-green-100 text-green-800">
                        {source?.name}
                        <button
                          onClick={() => setSelectedSources(selectedSources.filter(s => s !== sourceId))}
                          className="ml-1 h-3 w-3"
                        >
                          <XMarkIcon className="h-3 w-3" />
                        </button>
                      </span>
                    );
                  })}
                </div>
              </div>
            )}

            {/* 搜索结果 */}
            <div className="space-y-4">
              {isLoading ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                  <p className="text-gray-500 mt-2">正在筛选...</p>
                </div>
              ) : filteredResults.length > 0 ? (
                filteredResults.map((result) => (
                  <div key={result.id} className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 hover:shadow-md transition-shadow">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h3 className="text-lg font-semibold text-gray-900 mb-2">{result.title}</h3>
                        <p className="text-gray-600 text-sm mb-3 line-clamp-2">{result.content}</p>
                        <div className="flex items-center space-x-4 text-xs text-gray-500">
                          <span>📄 {dataSources.find(s => s.id === result.source)?.name}</span>
                          <span>👤 {result.author}</span>
                          <span>📅 {result.date}</span>
                        </div>
                      </div>
                      <div className="ml-4 text-right">
                        <div className="text-xs text-gray-500 mb-2">相关度</div>
                        <div className="text-sm font-medium text-blue-600">
                          {Math.round(result.relevance * 100)}%
                        </div>
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-1 mt-3">
                      {result.tags.map((tag, index) => (
                        <span key={index} className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded-full">
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                ))
              ) : hasActiveFilters ? (
                <div className="text-center py-8">
                  <p className="text-gray-500">没有找到符合条件的结果</p>
                </div>
              ) : (
                <div className="text-center py-8">
                  <AdjustmentsHorizontalIcon className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500">请设置筛选条件开始搜索</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default KnowledgeFilter;
