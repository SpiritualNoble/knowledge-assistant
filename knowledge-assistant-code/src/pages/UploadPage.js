import React, { useState } from 'react';

export default function UploadPage() {
  const [file, setFile] = useState(null);
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('general');
  const [uploading, setUploading] = useState(false);
  const [uploadSuccess, setUploadSuccess] = useState(false);
  const [uploadError, setUploadError] = useState(null);

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
            <div className="bg-white shadow sm:rounded-lg">
              <div className="px-4 py-5 sm:p-6">
                <h3 className="text-base font-semibold leading-6 text-gray-900">
                  上传文档到知识库
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
                            className="relative cursor-pointer rounded-md bg-white font-medium text-indigo-600 focus-within:outline-none focus-within:ring-2 focus-within:ring-indigo-500 focus-within:ring-offset-2 hover:text-indigo-500"
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
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
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
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                    >
                      <option value="general">通用知识</option>
                      <option value="technical">技术文档</option>
                      <option value="business">业务资料</option>
                      <option value="research">研究报告</option>
                      <option value="other">其他</option>
                    </select>
                  </div>

                  <div className="mt-5">
                    <button
                      type="submit"
                      disabled={uploading || !file}
                      className="inline-flex items-center rounded-md border border-transparent bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:bg-gray-300 disabled:cursor-not-allowed"
                    >
                      {uploading ? '上传中...' : '上传文档'}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
