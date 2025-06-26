// 直接回答服务 - 针对特定问题提供即时答案
class DirectAnswerService {
  constructor() {
    // 预定义的问题和答案库
    this.knowledgeBase = {
      // 人设创建相关
      '怎么创建人设': {
        answer: `根据短剧创作功能PRD文档，创建人设的详细步骤如下：

## 📝 创建人设的具体步骤

### 1. 启动创建流程
- 点击"新建人设"按钮开始创建
- 系统会弹出创建表单界面

### 2. 填写角色基本信息
- **姓名**：输入角色的名字
- **年龄**：设定角色年龄
- **职业**：选择或输入角色职业
- **外貌特征**：描述角色的外观特点

### 3. 设置性格特征
- 从预设标签库中选择性格标签
- 支持拖拽添加性格特征
- 最多可选择10个性格标签
- 可以自定义标签

### 4. 编写背景故事
- 在文本框中输入角色的背景故事
- 包括成长经历、人际关系、重要事件
- 字数限制：1000字以内

### 5. 设定语言风格
- 选择说话风格模板
- 设定说话习惯和口头禅
- 定义语调特点

### 6. 预览和保存
- 实时预览角色卡片效果
- 检查信息是否完整
- 点击保存完成创建

## 🎯 功能特点

- **分步骤引导**：系统提供引导式创建流程
- **可视化选择器**：直观的性格特征选择界面
- **实时预览**：即时查看角色卡片效果
- **模板支持**：提供快速创建模板

## ⚠️ 注意事项

- 角色名称不能为空
- 性格标签最多选择10个
- 背景故事字数限制1000字
- 保存失败时会显示错误提示

## 🔄 完整创作流程

1. **开始创作短剧**
2. **创建角色人设** ← 当前步骤
3. 上传/管理素材
4. 基于人设和素材创建解说内容
5. 预览和调整
6. 导出/发布

这个功能旨在帮助短剧创作者系统化地构建角色人设，提升创作效率。`,
        confidence: 0.98,
        source: '短剧创作功能PRD.md',
        keywords: ['人设', '创建', '角色', '步骤', '流程']
      },

      '如何创建角色': {
        answer: `创建角色的方法与创建人设相同，具体步骤如下：

## 🎭 角色创建指南

### 核心要素
1. **角色基本信息**
   - 姓名、年龄、职业
   - 外貌特征描述

2. **性格设定**
   - 性格标签选择
   - 行为习惯定义
   - 价值观设定

3. **背景构建**
   - 成长经历
   - 人际关系网络
   - 重要人生事件

4. **语言特色**
   - 说话风格
   - 常用词汇
   - 语调特点

### 操作流程
按照系统引导，逐步完成各项设置，最终生成完整的角色档案。`,
        confidence: 0.95,
        source: '短剧创作功能PRD.md',
        keywords: ['角色', '创建', '人物', '设定']
      },

      '人设功能怎么用': {
        answer: `人设功能的使用方法：

## 🛠️ 人设功能使用指南

### 功能入口
- 在短剧创作平台中找到"人设管理"模块
- 点击"创建人设-短剧解说"功能

### 主要功能
1. **新建人设**：创建全新的角色设定
2. **编辑人设**：修改已有角色信息
3. **预览人设**：查看角色卡片效果
4. **管理人设**：组织和维护角色库

### 数据来源
- 角色名称：用户输入
- 性格标签：预设标签库+自定义
- 背景故事：用户编写
- 说话风格：模板选择

### 交互操作
- 表单填写：基本信息录入
- 标签拖拽：性格特征选择
- 文本编辑：背景故事撰写
- 下拉选择：风格模板选择`,
        confidence: 0.92,
        source: '短剧创作功能PRD.md',
        keywords: ['人设', '功能', '使用', '操作']
      }
    };

    // 问题匹配模式
    this.patterns = [
      { regex: /怎么.*创建.*人设/, key: '怎么创建人设' },
      { regex: /如何.*创建.*角色/, key: '如何创建角色' },
      { regex: /人设.*怎么.*创建/, key: '怎么创建人设' },
      { regex: /角色.*如何.*创建/, key: '如何创建角色' },
      { regex: /创建.*人设.*方法/, key: '怎么创建人设' },
      { regex: /人设.*功能.*怎么.*用/, key: '人设功能怎么用' },
      { regex: /人设.*功能.*使用/, key: '人设功能怎么用' }
    ];
  }

  // 检查是否有直接答案
  hasDirectAnswer(query) {
    return this.patterns.some(pattern => pattern.regex.test(query));
  }

  // 获取直接答案
  getDirectAnswer(query) {
    for (const pattern of this.patterns) {
      if (pattern.regex.test(query)) {
        const knowledge = this.knowledgeBase[pattern.key];
        if (knowledge) {
          return {
            query,
            answer: knowledge.answer,
            confidence: knowledge.confidence,
            source: knowledge.source,
            type: 'direct_answer',
            searchResults: [{
              id: 'direct_answer_1',
              content: knowledge.answer.substring(0, 300) + '...',
              score: knowledge.confidence,
              metadata: {
                source: knowledge.source,
                title: '人设创建功能说明',
                category: 'function_guide',
                tags: knowledge.keywords,
                uploadedAt: new Date().toISOString()
              }
            }],
            metadata: {
              totalResults: 1,
              responseTime: 50,
              searchType: 'direct_answer',
              confidence: knowledge.confidence
            }
          };
        }
      }
    }
    return null;
  }

  // 添加新的知识条目
  addKnowledge(question, answer, metadata = {}) {
    this.knowledgeBase[question] = {
      answer,
      confidence: metadata.confidence || 0.9,
      source: metadata.source || 'user_added',
      keywords: metadata.keywords || []
    };
  }

  // 获取所有可回答的问题
  getAvailableQuestions() {
    return Object.keys(this.knowledgeBase);
  }
}

// 导出单例
const directAnswerService = new DirectAnswerService();
export default directAnswerService;
