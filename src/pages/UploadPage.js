import React, { useState } from 'react';
import { uploadDocument, importExternalDocument } from '../services/api';

export default function UploadPage() {
  const [file, setFile] = useState(null);
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('product');
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
    
    if (!file) {
      setUploadError('请选择要上传的文件');
      return;
    }

    setUploading(true);
    setUploadError(null);
    setUploadSuccess(false);

    try {
      // 在实际部署前，使用模拟数据
      // 实际部署后，取消注释下面的代码
      /*
      await uploadDocument(file, {
        title,
        category,
        uploadedAt: new Date().toISOString()
      });
      */
      
      // 模拟API调用延迟
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      setUploadSuccess(true);
      setFile(null);
      setTitle('');
    } catch (error) {
      console.error('Upload failed:', error);
      setUploadError('文件上传失败，请稍后再试');
    } finally {
      setUploading(false);
    }
  };

  const handleImport = async (e) => {
    e.preventDefault();
    
    if (!externalDocId) {
      setImportError('请输入文档ID');
      return;
    }

    setImporting(true);
    setImportError(null);
    setImportSuccess(false);

    try {
      // 在实际部署前，使用模拟数据
      // 实际部署后，取消注释下面的代码
      /*
      await importExternalDocument(
        externalSource,
        externalDocId,
        externalToken
      );
      */
      
      // 模拟API调用延迟
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      setImportSuccess(true);
      setExternalDocId('');
      setExternalToken('');
    } catch (error) {
      console.error('Import failed:', error);
      setImportError('文档导入失败，请检查ID和权限');
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
        </div>
      </header>
      <main>
        <div className="mx-auto max-w-7xl sm:px-6 lg:px-8">
          <div className="px-4 py-8 sm:px-0">
            <div className="grid grid-cols-1 gap-x-8 gap-y-8 md:grid-cols-2">
              {/* 本地文件上传 */}
              <div className="bg-white shadow sm:rounded-lg">
                <div className="px-4 py-5 sm:p-6">
                  <h3 className="text-base font-semibold leading-6 text-gray-900">
                    上传本地文档
                  </h3>
                  <div className="mt-2 max-w-xl text-sm text-gray-500">
                    <p>支持 .txt, .md, .pdf, .docx 等格式的文档</p>
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
                            文档上传成功！
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
                              className="relative cursor-pointer rounded-md bg-white font-medium text-primary-600 focus-within:outline-none focus-within:ring-2 focus-within:ring-primary-500 focus-within:ring-offset-2 hover:text-primary-500"
                            >
                              <span>上传文件</span>
                              <input
                                id="file-upload"
                                name="file-upload"
                                type="file"
                                className="sr-only"
                                onChange={handleFileChange}
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
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
                        placeholder="输入文档标题"
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
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
                      >
                        <option value="product">产品管理</option>
                        <option value="research">用户研究</option>
                        <option value="design">产品设计</option>
                        <option value="development">开发文档</option>
                        <option value="other">其他</option>
                      </select>
                    </div>

                    <div className="mt-5">
                      <button
                        type="submit"
                        disabled={uploading || !file}
                        className="inline-flex items-center rounded-md border border-transparent bg-primary-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 disabled:bg-gray-300 disabled:cursor-not-allowed"
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
                    <p>从飞书、语雀、钉钉等平台导入文档</p>
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
                            文档导入成功！
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
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
                      >
                        <option value="feishu">飞书文档</option>
                        <option value="yuque">语雀</option>
                        <option value="dingtalk">钉钉文档</option>
                      </select>
                    </div>

                    <div className="mt-4">
                      <label htmlFor="externalDocId" className="block text-sm font-medium text-gray-700">
                        文档ID
                      </label>
                      <input
                        type="text"
                        name="externalDocId"
                        id="externalDocId"
                        value={externalDocId}
                        onChange={(e) => setExternalDocId(e.target.value)}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
                        placeholder="输入文档ID或URL"
                      />
                      <p className="mt-1 text-xs text-gray-500">
                        {externalSource === 'feishu' && '例如: https://feishu.cn/docs/doccnhZPl8KnswEthRXUz8ivnhb 中的 doccnhZPl8KnswEthRXUz8ivnhb'}
                        {externalSource === 'yuque' && '例如: https://www.yuque.com/username/repo/doc_slug 中的 doc_slug'}
                        {externalSource === 'dingtalk' && '输入钉钉文档的完整URL'}
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
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
                        placeholder="如果文档需要访问权限，请输入令牌"
                      />
                    </div>

                    <div className="mt-5">
                      <button
                        type="submit"
                        disabled={importing || !externalDocId}
                        className="inline-flex items-center rounded-md border border-transparent bg-primary-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 disabled:bg-gray-300 disabled:cursor-not-allowed"
                      >
                        {importing ? '导入中...' : '导入文档'}
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
