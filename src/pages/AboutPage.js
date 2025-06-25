import React from 'react';

export default function AboutPage() {
  return (
    <div className="py-10">
      <header>
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <h1 className="text-3xl font-bold leading-tight tracking-tight text-gray-900">
            关于我们
          </h1>
        </div>
      </header>
      <main>
        <div className="mx-auto max-w-7xl sm:px-6 lg:px-8">
          <div className="px-4 py-8 sm:px-0">
            <div className="bg-white shadow overflow-hidden sm:rounded-lg">
              <div className="px-4 py-5 sm:px-6">
                <h2 className="text-lg leading-6 font-medium text-gray-900">
                  产品经理智能副驾驶
                </h2>
                <p className="mt-1 max-w-2xl text-sm text-gray-500">
                  基于RAG技术的知识检索增强系统
                </p>
              </div>
              <div className="border-t border-gray-200 px-4 py-5 sm:p-6">
                <h3 className="text-lg font-medium leading-6 text-gray-900 mb-4">
                  项目介绍
                </h3>
                <p className="text-base text-gray-700 mb-4">
                  产品经理智能副驾驶是一个专为产品经理设计的知识检索增强系统，通过RAG (Retrieval Augmented Generation) 技术，为产品经理提供精准的知识支持，提升工作效率。
                </p>
                <p className="text-base text-gray-700 mb-4">
                  系统利用Cloudflare Workers、Vectorize和R2构建了一个高性能、低成本的公网RAG服务，可与各种AI助手无缝集成。
                </p>
                
                <h3 className="text-lg font-medium leading-6 text-gray-900 mt-8 mb-4">
                  核心功能
                </h3>
                <ul className="list-disc pl-5 space-y-2 text-base text-gray-700">
                  <li>智能知识检索：基于语义理解的检索技术，精准找到相关知识</li>
                  <li>多源知识集成：支持飞书、语雀、钉钉等多平台知识库集成</li>
                  <li>网页内容收藏：浏览器插件一键保存有价值的网页内容到知识库</li>
                  <li>安全可控：所有数据经过脱敏处理，保障信息安全</li>
                  <li>低延迟响应：利用Cloudflare全球网络，实现毫秒级响应</li>
                </ul>
                
                <h3 className="text-lg font-medium leading-6 text-gray-900 mt-8 mb-4">
                  技术架构
                </h3>
                <p className="text-base text-gray-700 mb-4">
                  本系统采用现代云原生架构，主要组件包括：
                </p>
                <ul className="list-disc pl-5 space-y-2 text-base text-gray-700">
                  <li>前端：React.js + TailwindCSS，托管在GitHub Pages</li>
                  <li>后端：Cloudflare Workers提供API服务</li>
                  <li>向量存储：Cloudflare Vectorize存储文档向量</li>
                  <li>文档存储：Cloudflare R2存储原始文档</li>
                </ul>
                
                <h3 className="text-lg font-medium leading-6 text-gray-900 mt-8 mb-4">
                  联系我们
                </h3>
                <p className="text-base text-gray-700">
                  如果您有任何问题或建议，请通过以下方式联系我们：
                </p>
                <p className="text-base text-gray-700 mt-2">
                  Email: <a href="mailto:contact@example.com" className="text-primary-600 hover:text-primary-500">contact@example.com</a>
                </p>
                <p className="text-base text-gray-700 mt-2">
                  GitHub: <a href="https://github.com/yourusername/pm-copilot" className="text-primary-600 hover:text-primary-500" target="_blank" rel="noopener noreferrer">github.com/yourusername/pm-copilot</a>
                </p>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
