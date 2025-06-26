#!/bin/bash

# 智能知识助手部署脚本

echo "🚀 开始部署智能知识助手..."

# 检查Node.js版本
echo "📋 检查环境..."
node --version
npm --version

# 安装依赖
echo "📦 安装依赖..."
npm install

# 复制ONNX运行时文件
echo "🧠 准备AI模型运行时..."
mkdir -p public/onnx-wasm
cp node_modules/onnxruntime-web/dist/*.wasm public/onnx-wasm/ 2>/dev/null || echo "ONNX WASM文件将在构建时复制"

# 检查模型文件
echo "🔍 检查AI模型文件..."
if [ -f "public/models/all-MiniLM-L6-v2-quantized.onnx" ]; then
    echo "✅ AI模型文件已存在"
    MODEL_SIZE=$(du -h public/models/all-MiniLM-L6-v2-quantized.onnx | cut -f1)
    echo "   模型大小: $MODEL_SIZE"
else
    echo "⚠️  AI模型文件不存在，将使用备用方案"
    echo "   请参考 public/models/README.md 下载模型文件以获得最佳体验"
fi

# 构建项目
echo "🔨 构建项目..."
npm run build

# 检查构建结果
if [ $? -eq 0 ]; then
    echo "✅ 构建成功"
    
    # 显示构建统计
    echo "📊 构建统计:"
    du -sh build/
    echo "   静态文件:"
    ls -la build/static/js/ | head -5
    ls -la build/static/css/ | head -5
    
    # 部署到GitHub Pages
    echo "🌐 部署到GitHub Pages..."
    npm run deploy
    
    if [ $? -eq 0 ]; then
        echo "🎉 部署成功！"
        echo "🔗 访问地址: https://spiritualnoble.github.io/knowledge-assistant"
        echo ""
        echo "📋 功能说明:"
        echo "   ✅ 本地文档存储和搜索"
        echo "   ✅ 端到端加密保护"
        echo "   ✅ AI语义搜索（如果有模型文件）"
        echo "   ✅ 多存储后端支持"
        echo ""
        echo "🔧 如需配置云端服务，请编辑 .env 文件"
    else
        echo "❌ 部署失败"
        exit 1
    fi
else
    echo "❌ 构建失败"
    exit 1
fi
