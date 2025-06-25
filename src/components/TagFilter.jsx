import React, { useState, useEffect } from 'react';
import { ChevronDownIcon, XMarkIcon, FunnelIcon } from '@heroicons/react/24/outline';

const TagFilter = ({ onFilterChange, availableTags = [], selectedTags = [] }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [localSelectedTags, setLocalSelectedTags] = useState(selectedTags);

  // 过滤标签
  const filteredTags = availableTags.filter(tag =>
    tag.name.toLowerCase().includes(searchTerm.toLowerCase()) &&
    !localSelectedTags.some(selected => selected.id === tag.id)
  );

  // 处理标签选择
  const handleTagSelect = (tag) => {
    const newSelectedTags = [...localSelectedTags, tag];
    setLocalSelectedTags(newSelectedTags);
    onFilterChange(newSelectedTags);
    setSearchTerm('');
  };

  // 处理标签移除
  const handleTagRemove = (tagId) => {
    const newSelectedTags = localSelectedTags.filter(tag => tag.id !== tagId);
    setLocalSelectedTags(newSelectedTags);
    onFilterChange(newSelectedTags);
  };

  // 清空所有标签
  const handleClearAll = () => {
    setLocalSelectedTags([]);
    onFilterChange([]);
  };

  return (
    <div className="relative w-full max-w-md">
      {/* 主输入框 */}
      <div className="relative">
        <div className="flex items-center min-h-[42px] px-3 py-2 border border-gray-300 rounded-lg bg-white shadow-sm focus-within:ring-2 focus-within:ring-blue-500 focus-within:border-blue-500">
          <FunnelIcon className="h-4 w-4 text-gray-400 mr-2" />
          
          {/* 已选择的标签 */}
          <div className="flex flex-wrap gap-1 flex-1">
            {localSelectedTags.map((tag) => (
              <span
                key={tag.id}
                className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800"
              >
                {tag.name}
                <button
                  onClick={() => handleTagRemove(tag.id)}
                  className="ml-1 h-3 w-3 text-blue-600 hover:text-blue-800"
                >
                  <XMarkIcon className="h-3 w-3" />
                </button>
              </span>
            ))}
            
            {/* 搜索输入 */}
            <input
              type="text"
              placeholder={localSelectedTags.length === 0 ? "搜索或选择标签..." : ""}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onFocus={() => setIsOpen(true)}
              className="flex-1 min-w-[120px] outline-none bg-transparent text-sm"
            />
          </div>

          {/* 清空按钮和下拉箭头 */}
          <div className="flex items-center space-x-1">
            {localSelectedTags.length > 0 && (
              <button
                onClick={handleClearAll}
                className="text-gray-400 hover:text-gray-600 text-xs"
              >
                清空
              </button>
            )}
            <ChevronDownIcon 
              className={`h-4 w-4 text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`}
            />
          </div>
        </div>
      </div>

      {/* 下拉选项 */}
      {isOpen && (
        <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-auto">
          {/* 快速筛选选项 */}
          <div className="p-2 border-b border-gray-100">
            <div className="text-xs text-gray-500 mb-2">快速筛选</div>
            <div className="flex flex-wrap gap-1">
              {['产品需求', '用户研究', '竞品分析', '数据分析', '项目管理'].map((quickTag) => (
                <button
                  key={quickTag}
                  onClick={() => handleTagSelect({ id: `quick-${quickTag}`, name: quickTag, type: 'quick' })}
                  className="px-2 py-1 text-xs bg-gray-100 hover:bg-gray-200 rounded-full transition-colors"
                >
                  {quickTag}
                </button>
              ))}
            </div>
          </div>

          {/* 搜索结果 */}
          <div className="max-h-40 overflow-y-auto">
            {filteredTags.length > 0 ? (
              filteredTags.map((tag) => (
                <button
                  key={tag.id}
                  onClick={() => handleTagSelect(tag)}
                  className="w-full px-3 py-2 text-left hover:bg-gray-50 flex items-center justify-between group"
                >
                  <div className="flex items-center">
                    <span className="text-sm">{tag.name}</span>
                    {tag.count && (
                      <span className="ml-2 text-xs text-gray-500">({tag.count})</span>
                    )}
                  </div>
                  {tag.color && (
                    <div 
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: tag.color }}
                    />
                  )}
                </button>
              ))
            ) : (
              <div className="px-3 py-2 text-sm text-gray-500">
                {searchTerm ? `没有找到包含 "${searchTerm}" 的标签` : '没有可选择的标签'}
              </div>
            )}
          </div>

          {/* 创建新标签选项 */}
          {searchTerm && !filteredTags.some(tag => tag.name.toLowerCase() === searchTerm.toLowerCase()) && (
            <div className="border-t border-gray-100 p-2">
              <button
                onClick={() => handleTagSelect({ 
                  id: `new-${Date.now()}`, 
                  name: searchTerm, 
                  type: 'custom',
                  isNew: true 
                })}
                className="w-full px-2 py-1 text-left text-sm text-blue-600 hover:bg-blue-50 rounded"
              >
                + 创建标签 "{searchTerm}"
              </button>
            </div>
          )}
        </div>
      )}

      {/* 点击外部关闭下拉框 */}
      {isOpen && (
        <div 
          className="fixed inset-0 z-0" 
          onClick={() => setIsOpen(false)}
        />
      )}
    </div>
  );
};

// 使用示例组件
const TagFilterExample = () => {
  const [selectedTags, setSelectedTags] = useState([]);
  
  // 模拟可用标签数据
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

  const handleFilterChange = (tags) => {
    setSelectedTags(tags);
    console.log('Selected tags:', tags);
  };

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <h2 className="text-xl font-semibold mb-4">知识库标签筛选</h2>
      
      <TagFilter
        availableTags={availableTags}
        selectedTags={selectedTags}
        onFilterChange={handleFilterChange}
      />

      {/* 筛选结果展示 */}
      {selectedTags.length > 0 && (
        <div className="mt-6 p-4 bg-gray-50 rounded-lg">
          <h3 className="text-sm font-medium text-gray-700 mb-2">当前筛选条件:</h3>
          <div className="flex flex-wrap gap-2">
            {selectedTags.map((tag) => (
              <span
                key={tag.id}
                className="px-3 py-1 bg-white border border-gray-200 rounded-full text-sm"
              >
                {tag.name}
                {tag.isNew && <span className="ml-1 text-xs text-blue-600">(新)</span>}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default TagFilter;
export { TagFilterExample };
