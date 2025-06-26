import React, { useState } from 'react';
import { uploadDocument, importExternalDocument } from '../services/api';
import simpleDocumentService from '../services/simpleDocumentService';

export default function UploadPage({ user }) {
  const [file, setFile] = useState(null);
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('general');
  const [tags, setTags] = useState('');
  const [uploading, setUploading] = useState(false);
  const [uploadSuccess, setUploadSuccess] = useState(false);
  const [uploadError, setUploadError] = useState(null);
  
  // 外部导入相关状态
  const [externalSource, setExternalSource] = useState('feishu');
  const [externalDocId, setExternalDocId] = useState('');
  const [externalToken, setExternalToken] = useState('');
  const [importing, setImporting] = useState(false);
  const [importSuccess, setImportSuccess] = useState(false);
  const [importError, setImportError] = useState(null);

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    setFile(selectedFile);
    
    // 自动填充标题
    if (selectedFile && !title) {
      setTitle(selectedFile.name.split('.')[0]);
    }
  };

  const handleUpload = async (e) => {
    e.preventDefault();
    
    if (!user) {
      setUploadError('请先登录后再上传文档');
      return;
    }
    
    if (!file) {
      setUploadError('请选择要上传的文件');
      return;
    }

    setUploading(true);
    setUploadError(null);
    setUploadSuccess(false);

    try {
      // 首先尝试上传到云端API
      const formData = new FormData();
      formData.append('file', file);
      formData.append('title', title);
      formData.append('category', category);
      formData.append('tags', JSON.stringify(tags.split(',').map(tag => tag.trim()).filter(tag => tag)));

      const token = localStorage.getItem('userToken');
      
      try {
        const response = await fetch(`${process.env.REACT_APP_API_URL || ''}/api/documents/upload`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`
          },
          body: formData
        });

        if (response.ok) {
          const result = await response.json();
          setUploadSuccess(true);
          console.log('文档上传到云端成功:', result.document);
        } else {
          throw new Error('云端上传失败');
        }
      } catch (cloudError) {
        console.log('云端API不可用，使用本地存储:', cloudError.message);
        
        // 云端API不可用，使用简单文档服务
        console.log('📄 使用简单文档服务处理文档...');
        const document = await simpleDocumentService.addDocument(
          file,
          {
            title: title,
            category: category,
            tags: tags.split(',').map(tag => tag.trim()).filter(tag => tag)
          },
          user.id
        );
        
        setUploadSuccess(true);
        console.log('文档保存到本地成功:', document);
      }
      
      setFile(null);
      setTitle('');
      setTags('');
      
      // 重置文件输入
      const fileInput = document.getElementById('file-upload');
      if (fileInput) fileInput.value = '';
      
    } catch (error) {
      console.error('Upload failed:', error);
      setUploadError('文件上传失败：' + error.message);
    } finally {
      setUploading(false);
    }
  };

  const handleImport = async (e) => {
    e.preventDefault();
    
    if (!user) {
      setImportError('请先登录后再导入文档');
      return;
    }
    
    if (!externalDocId) {
      setImportError('请输入文档ID');
      return;
    }

    setImporting(true);
    setImportError(null);
    setImportSuccess(false);

    try {
      const token = localStorage.getItem('userToken');
      const response = await fetch(`${process.env.REACT_APP_API_URL || ''}/api/documents/import`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          source: externalSource,
          docId: externalDocId,
          token: externalToken
        })
      });

      if (response.ok) {
        const result = await response.json();
        setImportSuccess(true);
        setExternalDocId('');
        setExternalToken('');
        console.log('文档导入成功:', result.document);
      } else {
        const error = await response.json();
        setImportError(error.error || '文档导入失败，请检查ID和权限');
      }
    } catch (error) {
      console.error('Import failed:', error);
      setImportError('网络错误，请检查连接后重试');
    } finally {
      setImporting(false);
    }
  };

  return (
    <div className="py-10">
      <header>
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <h1 className="text-3xl font-bold leading-tight tracking-tight text-gray-900">
            上传文档
          </h1>
          <p className="mt-2 text-lg text-gray-600">
            将您的知识文档添加到专属知识库中
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
                      <p>请先登录后再上传文档，这样可以确保文档归属到您的个人知识库中。</p>
                    </div>
                  </div>
                </div>
              </div>
            )}
            
            <div className="grid grid-cols-1 gap-x-8 gap-y-8 md:grid-cols-2">
              {/* 本地文件上传 */}
              <div className="bg-white shadow sm:rounded-lg">
                <div className="px-4 py-5 sm:p-6">
                  <h3 className="text-base font-semibold leading-6 text-gray-900">
                    上传本地文档
                  </h3>
                  <div className="mt-2 max-w-xl text-sm text-gray-500">
                    <p>支持 .txt, .md, .pdf, .docx, .pptx 等格式的文档</p>
                  </div>
                  
                  {uploadSuccess && (
                    <div className="rounded-md bg-green-50 p-4 mt-4">
                      <div className="flex">
                        <div className="flex-shrink-0">
                          <svg className="h-5 w-5 text-green-400" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                          </svg>
                        </div>
                        <div className="ml-3">
                          <p className="text-sm font-medium text-green-800">
                            文档上传成功！已添加到您的知识库中。
                          </p>
                        </div>
                      </div>
                    </div>
                  )}

                  {uploadError && (
                    <div className="rounded-md bg-red-50 p-4 mt-4">
                      <div className="flex">
                        <div className="flex-shrink-0">
                          <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                          </svg>
                        </div>
                        <div className="ml-3">
                          <p className="text-sm font-medium text-red-800">
                            {uploadError}
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                  
                  <form className="mt-5" onSubmit={handleUpload}>
                    <div className="mt-2">
                      <label htmlFor="file" className="block text-sm font-medium text-gray-700">
                        选择文件
                      </label>
                      <div className="mt-1 flex justify-center rounded-md border-2 border-dashed border-gray-300 px-6 pt-5 pb-6">
                        <div className="space-y-1 text-center">
                          <svg
                            className="mx-auto h-12 w-12 text-gray-400"
                            stroke="currentColor"
                            fill="none"
                            viewBox="0 0 48 48"
                            aria-hidden="true"
                          >
                            <path
                              d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02"
                              strokeWidth={2}
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            />
                          </svg>
                          <div className="flex text-sm text-gray-600">
                            <label
                              htmlFor="file-upload"
                              className="relative cursor-pointer rounded-md bg-white font-medium text-blue-600 focus-within:outline-none focus-within:ring-2 focus-within:ring-blue-500 focus-within:ring-offset-2 hover:text-blue-500"
                            >
                              <span>上传文件</span>
                              <input
                                id="file-upload"
                                name="file-upload"
                                type="file"
                                className="sr-only"
                                onChange={handleFileChange}
                                disabled={!user}
                              />
                            </label>
                            <p className="pl-1">或拖放文件到此处</p>
                          </div>
                          <p className="text-xs text-gray-500">最大支持10MB</p>
                        </div>
                      </div>
                      {file && (
                        <p className="mt-2 text-sm text-gray-500">
                          已选择: {file.name} ({(file.size / 1024).toFixed(2)} KB)
                        </p>
                      )}
                    </div>

                    <div className="mt-4">
                      <label htmlFor="title" className="block text-sm font-medium text-gray-700">
                        文档标题
                      </label>
                      <input
                        type="text"
                        name="title"
                        id="title"
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                        placeholder="输入文档标题"
                        disabled={!user}
                      />
                    </div>

                    <div className="mt-4">
                      <label htmlFor="category" className="block text-sm font-medium text-gray-700">
                        文档分类
                      </label>
                      <select
                        id="category"
                        name="category"
                        value={category}
                        onChange={(e) => setCategory(e.target.value)}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                        disabled={!user}
                      >
                        <option value="general">通用文档</option>
                        <option value="technical">技术文档</option>
                        <option value="business">业务文档</option>
                        <option value="research">研究报告</option>
                        <option value="training">培训资料</option>
                        <option value="policy">政策制度</option>
                        <option value="other">其他</option>
                      </select>
                    </div>

                    <div className="mt-4">
                      <label htmlFor="tags" className="block text-sm font-medium text-gray-700">
                        标签 (可选)
                      </label>
                      <input
                        type="text"
                        name="tags"
                        id="tags"
                        value={tags}
                        onChange={(e) => setTags(e.target.value)}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                        placeholder="用逗号分隔多个标签，如：重要,项目文档,2024"
                        disabled={!user}
                      />
                    </div>

                    <div className="mt-5">
                      <button
                        type="submit"
                        disabled={uploading || !file || !user}
                        className="inline-flex items-center rounded-md border border-transparent bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:bg-gray-300 disabled:cursor-not-allowed"
                      >
                        {uploading ? '上传中...' : '上传文档'}
                      </button>
                    </div>
                  </form>
                </div>
              </div>

              {/* 外部文档导入 */}
              <div className="bg-white shadow sm:rounded-lg">
                <div className="px-4 py-5 sm:p-6">
                  <h3 className="text-base font-semibold leading-6 text-gray-900">
                    导入外部文档
                  </h3>
                  <div className="mt-2 max-w-xl text-sm text-gray-500">
                    <p>从飞书、语雀、钉钉等平台导入文档到您的个人知识库</p>
                  </div>
                  
                  {importSuccess && (
                    <div className="rounded-md bg-green-50 p-4 mt-4">
                      <div className="flex">
                        <div className="flex-shrink-0">
                          <svg className="h-5 w-5 text-green-400" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                          </svg>
                        </div>
                        <div className="ml-3">
                          <p className="text-sm font-medium text-green-800">
                            文档导入成功！已添加到您的知识库中。
                          </p>
                        </div>
                      </div>
                    </div>
                  )}

                  {importError && (
                    <div className="rounded-md bg-red-50 p-4 mt-4">
                      <div className="flex">
                        <div className="flex-shrink-0">
                          <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                          </svg>
                        </div>
                        <div className="ml-3">
                          <p className="text-sm font-medium text-red-800">
                            {importError}
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                  
                  <form className="mt-5" onSubmit={handleImport}>
                    <div className="mt-2">
                      <label htmlFor="externalSource" className="block text-sm font-medium text-gray-700">
                        文档来源
                      </label>
                      <select
                        id="externalSource"
                        name="externalSource"
                        value={externalSource}
                        onChange={(e) => setExternalSource(e.target.value)}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                        disabled={!user}
                      >
                        <option value="feishu">飞书文档</option>
                        <option value="yuque">语雀</option>
                        <option value="dingtalk">钉钉文档</option>
                        <option value="notion">Notion</option>
                        <option value="confluence">Confluence</option>
                      </select>
                    </div>

                    <div className="mt-4">
                      <label htmlFor="externalDocId" className="block text-sm font-medium text-gray-700">
                        文档ID或URL
                      </label>
                      <input
                        type="text"
                        name="externalDocId"
                        id="externalDocId"
                        value={externalDocId}
                        onChange={(e) => setExternalDocId(e.target.value)}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                        placeholder="输入文档ID或完整URL"
                        disabled={!user}
                      />
                      <p className="mt-1 text-xs text-gray-500">
                        {externalSource === 'feishu' && '例如: https://feishu.cn/docs/doccnhZPl8KnswEthRXUz8ivnhb'}
                        {externalSource === 'yuque' && '例如: https://www.yuque.com/username/repo/doc_slug'}
                        {externalSource === 'dingtalk' && '输入钉钉文档的完整URL'}
                        {externalSource === 'notion' && '例如: https://notion.so/page-id'}
                        {externalSource === 'confluence' && '输入Confluence页面的完整URL'}
                      </p>
                    </div>

                    <div className="mt-4">
                      <label htmlFor="externalToken" className="block text-sm font-medium text-gray-700">
                        访问令牌 (可选)
                      </label>
                      <input
                        type="password"
                        name="externalToken"
                        id="externalToken"
                        value={externalToken}
                        onChange={(e) => setExternalToken(e.target.value)}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                        placeholder="如果文档需要访问权限，请输入令牌"
                        disabled={!user}
                      />
                    </div>

                    <div className="mt-5">
                      <button
                        type="submit"
                        disabled={importing || !externalDocId || !user}
                        className="inline-flex items-center rounded-md border border-transparent bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:bg-gray-300 disabled:cursor-not-allowed"
                      >
                        {importing ? '导入中...' : '导入文档'}
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            </div>

            {user && (
              <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h4 className="font-medium text-blue-900 mb-2">上传提示</h4>
                <ul className="text-sm text-blue-700 space-y-1">
                  <li>• 上传的文档将自动进行内容提取和向量化处理</li>
                  <li>• 文档仅在您的个人账户内可见和搜索</li>
                  <li>• 支持批量上传，建议为文档添加合适的标签便于管理</li>
                  <li>• 处理完成后可在"文档管理"页面查看和管理</li>
                </ul>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
