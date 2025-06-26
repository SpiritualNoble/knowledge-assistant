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
                  智能知识助手
                </h2>
                <p className="mt-1 max-w-2xl text-sm text-gray-500">
                  企业级知识管理与检索平台
                </p>
              </div>
              <div className="border-t border-gray-200 px-4 py-5 sm:p-6">
                <h3 className="text-lg font-medium leading-6 text-gray-900 mb-4">
                  项目介绍
                </h3>
                <p className="text-base text-gray-700 mb-4">
                  智能知识助手是一个企业级知识管理与检索平台，通过RAG (Retrieval Augmented Generation) 技术，为企业和个人提供精准的知识支持，提升工作效率和决策质量。
                </p>
                <p className="text-base text-gray-700 mb-4">
                  系统利用Cloudflare Workers、Vectorize和R2构建了一个高性能、低成本的云原生服务，支持多租户数据隔离，可与各种AI助手无缝集成。
                </p>
                
                <h3 className="text-lg font-medium leading-6 text-gray-900 mt-8 mb-4">
                  核心功能
                </h3>
                <ul className="list-disc pl-5 space-y-2 text-base text-gray-700">
                  <li>智能知识检索：基于语义理解的检索技术，精准找到相关知识</li>
                  <li>多源知识集成：支持飞书、语雀、钉钉等多平台知识库集成</li>
                  <li>网页内容收藏：浏览器插件一键保存有价值的网页内容到知识库</li>
                  <li>多租户隔离：企业级数据安全隔离，支持团队协作</li>
                  <li>用户权限管理：完整的用户认证和权限控制系统</li>
                  <li>实时同步：支持与企业现有系统集成，保持信息时效性</li>
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
                  <li>数据库：Cloudflare D1存储用户和元数据</li>
                  <li>认证：JWT令牌认证，支持多租户隔离</li>
                </ul>
                
                <h3 className="text-lg font-medium leading-6 text-gray-900 mt-8 mb-4">
                  应用场景
                </h3>
                <ul className="list-disc pl-5 space-y-2 text-base text-gray-700">
                  <li>企业知识管理：构建企业内部知识库，提升团队协作效率</li>
                  <li>研发文档检索：快速查找技术文档、API文档和最佳实践</li>
                  <li>客服知识库：为客服团队提供快速准确的问题解答</li>
                  <li>培训资料管理：整合培训资源，支持员工学习和发展</li>
                  <li>项目文档归档：项目相关文档的集中管理和检索</li>
                  <li>个人知识管理：个人学习笔记和资料的智能整理</li>
                </ul>
                
                <h3 className="text-lg font-medium leading-6 text-gray-900 mt-8 mb-4">
                  联系我们
                </h3>
                <p className="text-base text-gray-700">
                  如果您有任何问题、建议或合作意向，请通过以下方式联系我们：
                </p>
                <div className="mt-4 space-y-2">
                  <p className="text-base text-gray-700">
                    📧 邮箱: <a href="mailto:wwwaaannn7878@163.com" className="text-blue-600 hover:text-blue-500 underline">wwwaaannn7878@163.com</a>
                  </p>
                  <p className="text-base text-gray-700">
                    🔗 GitHub: <a href="https://github.com/SpiritualNoble/knowledge-assistant" className="text-blue-600 hover:text-blue-500 underline" target="_blank" rel="noopener noreferrer">github.com/SpiritualNoble/knowledge-assistant</a>
                  </p>
                </div>
                
                <div className="mt-6 p-4 bg-blue-50 rounded-lg">
                  <p className="text-sm text-blue-800">
                    💡 <strong>提示：</strong>我们欢迎开发者贡献代码，企业用户咨询定制化服务，以及任何形式的反馈和建议。让我们一起构建更智能的知识管理生态！
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
