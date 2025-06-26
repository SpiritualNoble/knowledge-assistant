import React, { useState, useEffect } from 'react';
import { ChartBarIcon, DocumentTextIcon, UserGroupIcon, ServerIcon } from '@heroicons/react/24/outline';

const AdminPage = ({ user }) => {
  const [stats, setStats] = useState({
    totalDocuments: 0,
    totalUsers: 0,
    storageUsed: 0,
    vectorCount: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user && user.role === 'admin') {
      fetchAdminStats();
    }
  }, [user]);

  const fetchAdminStats = async () => {
    try {
      const token = localStorage.getItem('userToken');
      const response = await fetch('/api/admin/stats', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setStats(data);
      }
    } catch (error) {
      console.error('获取统计数据失败:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatBytes = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  if (!user || user.role !== 'admin') {
    return (
      <div className="text-center py-12">
        <h3 className="text-lg font-medium text-gray-900">访问受限</h3>
        <p className="mt-2 text-sm text-gray-500">您没有权限访问此页面</p>
      </div>
    );
  }

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
        <h1 className="text-2xl font-bold text-gray-900 mb-2">系统管理</h1>
        <p className="text-gray-600">查看系统统计和数据存储情况</p>
      </div>

      {/* 统计卡片 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <DocumentTextIcon className="h-6 w-6 text-gray-400" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    总文档数
                  </dt>
                  <dd className="text-lg font-medium text-gray-900">
                    {stats.totalDocuments.toLocaleString()}
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <UserGroupIcon className="h-6 w-6 text-gray-400" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    注册用户
                  </dt>
                  <dd className="text-lg font-medium text-gray-900">
                    {stats.totalUsers.toLocaleString()}
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <ServerIcon className="h-6 w-6 text-gray-400" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    存储使用
                  </dt>
                  <dd className="text-lg font-medium text-gray-900">
                    {formatBytes(stats.storageUsed)}
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <ChartBarIcon className="h-6 w-6 text-gray-400" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    向量数量
                  </dt>
                  <dd className="text-lg font-medium text-gray-900">
                    {stats.vectorCount.toLocaleString()}
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 数据存储详情 */}
      <div className="bg-white shadow rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
            数据存储详情
          </h3>
          
          <div className="space-y-4">
            <div className="border-l-4 border-blue-400 pl-4">
              <h4 className="font-medium text-gray-900">Cloudflare Vectorize</h4>
              <p className="text-sm text-gray-600">
                存储文档向量数据，用于语义搜索
              </p>
              <p className="text-sm text-blue-600">
                向量数量: {stats.vectorCount.toLocaleString()}
              </p>
            </div>
            
            <div className="border-l-4 border-green-400 pl-4">
              <h4 className="font-medium text-gray-900">Cloudflare R2</h4>
              <p className="text-sm text-gray-600">
                存储原始文档文件
              </p>
              <p className="text-sm text-green-600">
                存储使用: {formatBytes(stats.storageUsed)}
              </p>
            </div>
            
            <div className="border-l-4 border-purple-400 pl-4">
              <h4 className="font-medium text-gray-900">Cloudflare D1</h4>
              <p className="text-sm text-gray-600">
                存储用户数据和文档元数据
              </p>
              <p className="text-sm text-purple-600">
                用户数: {stats.totalUsers.toLocaleString()}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* 访问Cloudflare控制台的链接 */}
      <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h4 className="font-medium text-blue-900 mb-2">查看详细数据</h4>
        <p className="text-sm text-blue-700 mb-3">
          您可以通过Cloudflare控制台查看详细的存储和使用情况：
        </p>
        <div className="space-y-2">
          <a
            href="https://dash.cloudflare.com/vectorize"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-block bg-blue-600 text-white px-3 py-1 rounded text-sm hover:bg-blue-700 mr-2"
          >
            Vectorize 控制台
          </a>
          <a
            href="https://dash.cloudflare.com/r2"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-block bg-green-600 text-white px-3 py-1 rounded text-sm hover:bg-green-700 mr-2"
          >
            R2 控制台
          </a>
          <a
            href="https://dash.cloudflare.com/d1"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-block bg-purple-600 text-white px-3 py-1 rounded text-sm hover:bg-purple-700"
          >
            D1 控制台
          </a>
        </div>
      </div>
    </div>
  );
};

export default AdminPage;
