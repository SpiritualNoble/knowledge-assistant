# 智能知识助手

企业级知识管理与检索平台，基于RAG技术为企业和个人提供精准的知识支持。

## 🌟 在线体验

访问在线版本：[https://spiritualnoble.github.io/knowledge-assistant](https://spiritualnoble.github.io/knowledge-assistant)

## 🚀 核心功能

- **智能知识检索**：基于语义理解的检索技术，精准找到相关知识
- **智能对话助手**：与AI助手实时对话，获取知识库中的精准答案
- **多源知识集成**：支持飞书、语雀、钉钉等多平台知识库集成
- **网页内容收藏**：浏览器插件一键保存有价值的网页内容到知识库
- **多租户隔离**：企业级数据安全隔离，支持团队协作
- **用户权限管理**：完整的用户认证和权限控制系统

## 🏗️ 技术架构

- **前端**：React.js + TailwindCSS
- **后端**：Cloudflare Workers
- **向量存储**：Cloudflare Vectorize
- **文档存储**：Cloudflare R2
- **部署**：GitHub Pages + GitHub Actions

## 📱 功能页面

### 🏠 首页
- 项目介绍和功能概览
- 快速导航到各个功能模块

### 🔍 搜索知识
- 智能语义搜索
- 多维度筛选和排序
- 搜索结果高亮显示

### 💬 智能对话
- 实时AI对话
- 基于知识库的精准回答
- 显示答案来源和参考文档
- 支持上下文理解

### 📤 上传文档
- 支持多种文档格式
- 自动文档解析和向量化
- 批量上传功能

### 📚 文档管理
- 文档列表和分类管理
- 文档预览和编辑
- 权限控制和共享

## 🛠️ 本地开发

### 环境要求
- Node.js 16+
- npm 或 yarn

### 安装依赖
```bash
npm install
```

### 启动开发服务器
```bash
npm start
```

访问 http://localhost:3000

### 构建生产版本
```bash
npm run build
```

## 🚀 部署到GitHub Pages

### 自动部署
1. Fork 这个仓库
2. 在 GitHub 仓库设置中启用 GitHub Pages
3. 选择 Source: GitHub Actions
4. 推送代码到 main 分支，自动触发部署

### 手动部署
```bash
npm run deploy
```

## 🔧 配置说明

### 环境变量
创建 `.env.local` 文件：
```env
REACT_APP_API_BASE_URL=你的后端API地址
REACT_APP_ENVIRONMENT=development
```

### API配置
在 `src/services/` 目录下配置各种服务：
- `openaiService.js` - OpenAI API配置
- `aiServiceSelector.js` - AI服务选择器
- `documentService.js` - 文档服务

## 📖 使用指南

### 1. 用户注册/登录
- 点击右上角"登录/注册"按钮
- 填写邮箱和密码完成注册
- 登录后即可使用所有功能

### 2. 上传文档
- 进入"上传文档"页面
- 选择要上传的文档文件
- 系统自动解析并建立索引

### 3. 智能搜索
- 在"搜索知识"页面输入关键词
- 系统返回相关度最高的结果
- 支持高级筛选和排序

### 4. AI对话
- 进入"智能对话"页面
- 与AI助手实时对话
- AI基于你的知识库提供精准答案

## 🤝 贡献指南

1. Fork 本仓库
2. 创建特性分支 (`git checkout -b feature/amazing-feature`)
3. 提交更改 (`git commit -m 'Add some amazing feature'`)
4. 推送到分支 (`git push origin feature/amazing-feature`)
5. 创建 Pull Request

## 📄 许可证

MIT License

## 📞 联系我们

- 📧 邮箱: wwwaaannn7878@163.com
- 🔗 GitHub: https://github.com/SpiritualNoble/knowledge-assistant

---

⭐ 如果这个项目对你有帮助，请给我们一个星标！
