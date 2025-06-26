# AI模型文件部署指南

## 模型文件下载

由于网络限制，请手动下载以下模型文件：

### 方法1：直接下载（推荐）
1. 访问：https://huggingface.co/sentence-transformers/all-MiniLM-L6-v2/tree/main/onnx
2. 下载 `model_quantized.onnx` (约23MB)
3. 重命名为 `all-MiniLM-L6-v2-quantized.onnx`
4. 放置到 `public/models/` 目录

### 方法2：使用Git LFS
```bash
git clone https://huggingface.co/sentence-transformers/all-MiniLM-L6-v2
cp all-MiniLM-L6-v2/onnx/model_quantized.onnx public/models/all-MiniLM-L6-v2-quantized.onnx
```

### 方法3：使用Python下载
```python
from huggingface_hub import hf_hub_download

# 下载模型
model_path = hf_hub_download(
    repo_id="sentence-transformers/all-MiniLM-L6-v2",
    filename="onnx/model_quantized.onnx"
)

# 复制到项目目录
import shutil
shutil.copy(model_path, "public/models/all-MiniLM-L6-v2-quantized.onnx")
```

## 无模型运行

如果暂时无法下载模型，系统会自动使用备用方案：
- 基于哈希的向量生成
- 关键词匹配搜索
- 功能完全可用，只是语义搜索精度稍低

## 验证模型加载

模型文件正确放置后，在浏览器控制台会看到：
```
Loading embedding model...
Embedding model loaded successfully
```
