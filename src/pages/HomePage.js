import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getKnowledgeStats } from '../services/api';

export default function HomePage({ user }) {
  const [stats, setStats] = useState({
    totalDocuments: 0,
    totalQueries: 0,
    uptime: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // 在实际部署前，先使用模拟数据
    // 实际部署后，取消注释下面的代码
    /*
    const fetchStats = async () => {
      try {
        const data = await getKnowledgeStats();
        setStats(data);
      } catch (error) {
        console.error('Failed to fetch stats:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
    */
    
    // 模拟数据
    setTimeout(() => {
      setStats({
        totalDocuments: 124,
        totalQueries: 1893,
        uptime: 15,
      });
      setLoading(false);
    }, 500);
  }, []);

  return (
    <div className="py-10">
      <header>
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <h1 className="text-3xl font-bold leading-tight tracking-tight text-gray-900">
            智能知识助手
          </h1>
          {user && (
            <p className="mt-2 text-lg text-gray-600">
              欢迎回来，{user.email}
            </p>
          )}
        </div>
      </header>
      <main>
        <div className="mx-auto max-w-7xl sm:px-6 lg:px-8">
          {/* 英雄区域 */}
          <div className="bg-white shadow-xl rounded-lg overflow-hidden">
            <div className="px-4 py-5 sm:p-6">
              <div className="text-center">
                <h2 className="text-3xl font-extrabold text-gray-900 sm:text-4xl">
                  企业级知识管理平台
                </h2>
                <p className="mt-3 max-w-md mx-auto text-xl text-gray-500 sm:mt-5">
                  基于RAG技术，为企业和个人提供精准的知识检索与管理服务，提升工作效率
                </p>
                <div className="mt-8 flex justify-center">
                  <div className="rounded-md shadow">
                    <Link
                      to="/search"
                      className="w-full flex items-center justify-center px-8 py-3 border border-transparent text-base font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 md:py-4 md:text-lg md:px-10"
                    >
                      开始搜索
                    </Link>
                  </div>
                  <div className="ml-3">
                    <Link
                      to="/upload"
                      className="w-full flex items-center justify-center px-8 py-3 border border-transparent text-base font-medium rounded-md text-blue-700 bg-blue-100 hover:bg-blue-200 md:py-4 md:text-lg md:px-10"
                    >
                      上传文档
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* 统计信息 */}
          <div className="mt-8">
            <dl className="grid grid-cols-1 gap-5 sm:grid-cols-3">
              <div className="bg-white overflow-hidden shadow rounded-lg">
                <div className="px-4 py-5 sm:p-6">
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    知识库文档数
                  </dt>
                  <dd className="mt-1 text-3xl font-semibold text-gray-900">
                    {loading ? '加载中...' : stats.totalDocuments}
                  </dd>
                </div>
              </div>
              <div className="bg-white overflow-hidden shadow rounded-lg">
                <div className="px-4 py-5 sm:p-6">
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    累计查询次数
                  </dt>
                  <dd className="mt-1 text-3xl font-semibold text-gray-900">
                    {loading ? '加载中...' : stats.totalQueries}
                  </dd>
                </div>
              </div>
              <div className="bg-white overflow-hidden shadow rounded-lg">
                <div className="px-4 py-5 sm:p-6">
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    系统运行天数
                  </dt>
                  <dd className="mt-1 text-3xl font-semibold text-gray-900">
                    {loading ? '加载中...' : stats.uptime}
                  </dd>
                </div>
              </div>
            </dl>
          </div>

          {/* 功能介绍 */}
          <div className="mt-10">
            <h2 className="text-2xl font-bold text-gray-900">核心功能</h2>
            <div className="mt-5 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
              <div className="bg-white overflow-hidden shadow rounded-lg">
                <div className="px-4 py-5 sm:p-6">
                  <h3 className="text-lg font-medium text-gray-900">智能知识检索</h3>
                  <p className="mt-2 text-sm text-gray-500">
                    基于语义理解的检索技术，精准找到相关知识，不再局限于关键词匹配
                  </p>
                </div>
              </div>
              <div className="bg-white overflow-hidden shadow rounded-lg">
                <div className="px-4 py-5 sm:p-6">
                  <h3 className="text-lg font-medium text-gray-900">多源知识集成</h3>
                  <p className="mt-2 text-sm text-gray-500">
                    支持飞书、语雀、钉钉等多平台知识库集成，一站式检索所有资源
                  </p>
                </div>
              </div>
              <div className="bg-white overflow-hidden shadow rounded-lg">
                <div className="px-4 py-5 sm:p-6">
                  <h3 className="text-lg font-medium text-gray-900">网页内容收藏</h3>
                  <p className="mt-2 text-sm text-gray-500">
                    浏览器插件一键保存有价值的网页内容到知识库，随时检索利用
                  </p>
                </div>
              </div>
              <div className="bg-white overflow-hidden shadow rounded-lg">
                <div className="px-4 py-5 sm:p-6">
                  <h3 className="text-lg font-medium text-gray-900">多租户隔离</h3>
                  <p className="mt-2 text-sm text-gray-500">
                    企业级数据隔离，确保每个组织的数据安全独立，支持团队协作
                  </p>
                </div>
              </div>
              <div className="bg-white overflow-hidden shadow rounded-lg">
                <div className="px-4 py-5 sm:p-6">
                  <h3 className="text-lg font-medium text-gray-900">实时同步</h3>
                  <p className="mt-2 text-sm text-gray-500">
                    支持与企业现有系统集成，实时同步最新知识内容，保持信息时效性
                  </p>
                </div>
              </div>
              <div className="bg-white overflow-hidden shadow rounded-lg">
                <div className="px-4 py-5 sm:p-6">
                  <h3 className="text-lg font-medium text-gray-900">智能推荐</h3>
                  <p className="mt-2 text-sm text-gray-500">
                    基于用户行为和内容关联性，主动推荐相关知识，提升发现效率
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
