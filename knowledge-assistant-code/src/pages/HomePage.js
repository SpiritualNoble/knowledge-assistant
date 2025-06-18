import React from 'react';
import { Link } from 'react-router-dom';

export default function HomePage() {
  return (
    <div className="py-10">
      <header>
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <h1 className="text-3xl font-bold leading-tight tracking-tight text-gray-900">
            智能知识助手
          </h1>
        </div>
      </header>
      <main>
        <div className="mx-auto max-w-7xl sm:px-6 lg:px-8">
          {/* 英雄区域 */}
          <div className="bg-white shadow-xl rounded-lg overflow-hidden">
            <div className="px-4 py-5 sm:p-6">
              <div className="text-center">
                <h2 className="text-3xl font-extrabold text-gray-900 sm:text-4xl">
                  知识检索增强系统
                </h2>
                <p className="mt-3 max-w-md mx-auto text-xl text-gray-500 sm:mt-5">
                  基于RAG技术，提供精准的知识支持，提升工作效率
                </p>
                <div className="mt-8 flex justify-center">
                  <div className="rounded-md shadow">
                    <Link
                      to="/search"
                      className="w-full flex items-center justify-center px-8 py-3 border border-transparent text-base font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 md:py-4 md:text-lg md:px-10"
                    >
                      开始使用
                    </Link>
                  </div>
                  <div className="ml-3">
                    <Link
                      to="/upload"
                      className="w-full flex items-center justify-center px-8 py-3 border border-transparent text-base font-medium rounded-md text-indigo-700 bg-indigo-100 hover:bg-indigo-200 md:py-4 md:text-lg md:px-10"
                    >
                      上传文档
                    </Link>
                  </div>
                </div>
              </div>
            </div>
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
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
