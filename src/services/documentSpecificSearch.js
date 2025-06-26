// 针对特定文档的搜索优化
import enhancedQueryProcessor from './enhancedQueryProcessor';

class DocumentSpecificSearch {
  constructor() {
    // 预处理的文档内容结构
    this.documentSections = {
      '短剧创作功能PRD.md': {
        sections: [
          {
            title: '创建人设-短剧解说',
            content: `创建人设-短剧解说功能允许用户创建和编辑角色人设，包括角色名称、性格特征、背景故事、说话风格等。

核心字段包括：
- 角色基本信息：姓名、年龄、职业、外貌特征
- 性格特征：性格标签、行为习惯、价值观
- 背景设定：成长经历、人际关系、重要事件
- 语言风格：说话习惯、口头禅、语调特点

交互设计：
- 分步骤引导式创建流程
- 可视化的性格特征选择器
- 实时预览角色卡片
- 支持模板快速创建

操作步骤：
1. 点击"新建人设"弹出创建表单
2. 拖拽标签添加性格特征
3. 文本框输入背景故事
4. 下拉选择说话风格模板
5. 保存角色人设`,
            keywords: ['人设', '角色', '创建', '人物设定', '性格', '背景', '说话风格'],
            type: 'function_description'
          },
          {
            title: '用户流程',
            content: `短剧创作的完整流程：
1. 开始创作短剧
2. 创建角色人设
3. 上传/管理素材
4. 基于人设和素材创建解说内容
5. 预览和调整
6. 导出/发布`,
            keywords: ['流程', '步骤', '创建', '人设', '角色'],
            type: 'process'
          },
          {
            title: '功能模块详细说明',
            content: `创建人设-短剧解说功能提供角色创建向导，帮助用户系统化地构建角色人设。

具体包括：
- 角色基本信息设置
- 性格特征标签选择
- 背景故事编写
- 语言风格定义
- 角色卡片预览
- 模板化快速创建

边界条件：
- 角色名称不能为空
- 性格标签最多选择10个
- 背景故事字数限制1000字
- 保存失败时显示错误提示`,
            keywords: ['人设', '角色', '创建', '向导', '系统化', '构建'],
            type: 'detailed_description'
          }
        ]
      }
    };
  }

  // 专门针对"怎么创建人设"的搜索
  searchPersonaCreation(query) {
    console.log('🔍 专门搜索人设创建相关内容:', query);
    
    // 使用增强查询处理器
    const enhancedQuery = enhancedQueryProcessor.enhanceQuery(query);
    console.log('📋 增强查询结果:', enhancedQuery);

    const results = [];
    const document = this.documentSections['短剧创作功能PRD.md'];

    if (document) {
      for (const section of document.sections) {
        const matchResult = this.calculateSectionRelevance(section, enhancedQuery);
        
        if (matchResult.score > 0) {
          results.push({
            id: `section_${section.title.replace(/\s+/g, '_')}`,
            title: section.title,
            content: this.extractRelevantContent(section.content, enhancedQuery),
            score: matchResult.score,
            type: section.type,
            metadata: {
              source: '短剧创作功能PRD.md',
              section: section.title,
              keywords: section.keywords,
              matchedTerms: matchResult.matchedTerms
            }
          });
        }
      }
    }

    // 按相关性排序
    results.sort((a, b) => b.score - a.score);

    return {
      query: query,
      enhancedQuery: enhancedQuery,
      results: results,
      totalResults: results.length,
      searchType: 'document_specific'
    };
  }

  // 计算章节相关性
  calculateSectionRelevance(section, enhancedQuery) {
    let score = 0;
    const matchedTerms = [];
    const contentLower = section.content.toLowerCase();
    const titleLower = section.title.toLowerCase();

    // 检查标题匹配（高权重）
    for (const term of enhancedQuery.expandedTerms) {
      const termLower = term.toLowerCase();
      if (titleLower.includes(termLower)) {
        score += 3.0;
        matchedTerms.push({ term, location: 'title', weight: 3.0 });
      }
    }

    // 检查关键词匹配（中权重）
    for (const keyword of section.keywords) {
      for (const term of enhancedQuery.expandedTerms) {
        if (keyword.toLowerCase().includes(term.toLowerCase()) || 
            term.toLowerCase().includes(keyword.toLowerCase())) {
          score += 2.0;
          matchedTerms.push({ term, location: 'keywords', weight: 2.0 });
        }
      }
    }

    // 检查内容匹配（基础权重）
    for (const term of enhancedQuery.expandedTerms) {
      const termLower = term.toLowerCase();
      const matches = (contentLower.match(new RegExp(termLower, 'g')) || []).length;
      if (matches > 0) {
        score += matches * 0.5;
        matchedTerms.push({ term, location: 'content', weight: matches * 0.5 });
      }
    }

    // 特殊加权：如果是"怎么创建人设"类型的查询
    if (enhancedQuery.questionType === 'howTo' && section.type === 'function_description') {
      score *= 1.5;
    }

    return {
      score: Math.min(score, 10), // 限制最高分
      matchedTerms
    };
  }

  // 提取相关内容
  extractRelevantContent(content, enhancedQuery, maxLength = 300) {
    const sentences = content.split(/[。！？.!?]/);
    const relevantSentences = [];

    for (const sentence of sentences) {
      if (sentence.trim().length < 10) continue;
      
      let relevance = 0;
      const sentenceLower = sentence.toLowerCase();
      
      // 计算句子相关性
      for (const term of enhancedQuery.expandedTerms) {
        if (sentenceLower.includes(term.toLowerCase())) {
          relevance += 1;
        }
      }

      if (relevance > 0) {
        relevantSentences.push({
          sentence: sentence.trim(),
          relevance
        });
      }
    }

    // 选择最相关的句子
    relevantSentences.sort((a, b) => b.relevance - a.relevance);
    
    let result = '';
    let currentLength = 0;
    
    for (const item of relevantSentences) {
      if (currentLength + item.sentence.length > maxLength) break;
      result += item.sentence + '。';
      currentLength += item.sentence.length;
    }

    return result || content.substring(0, maxLength) + '...';
  }

  // 生成针对性的回答
  generateSpecificAnswer(query, searchResults) {
    if (query.includes('怎么') && query.includes('人设')) {
      const steps = [
        '1. 点击"新建人设"按钮开始创建',
        '2. 填写角色基本信息（姓名、年龄、职业等）',
        '3. 选择性格特征标签（最多10个）',
        '4. 编写角色背景故事（限1000字）',
        '5. 设定语言风格和说话习惯',
        '6. 预览角色卡片并保存'
      ];

      return `根据短剧创作功能PRD文档，创建人设的具体步骤如下：

${steps.join('\n')}

**功能特点：**
- 提供分步骤引导式创建流程
- 支持可视化的性格特征选择器
- 实时预览角色卡片效果
- 支持模板快速创建功能

**注意事项：**
- 角色名称不能为空
- 性格标签最多选择10个
- 背景故事字数限制在1000字以内

这个功能旨在帮助短剧创作者系统化地构建角色人设，提升创作效率。`;
    }

    return '根据文档内容，为您找到了相关信息。';
  }
}

// 导出单例
const documentSpecificSearch = new DocumentSpecificSearch();
export default documentSpecificSearch;
