// 增强查询处理器 - 针对特定领域优化
class EnhancedQueryProcessor {
  constructor() {
    // 领域特定的同义词映射
    this.synonymMaps = {
      // 人设相关
      '人设': ['角色', '人物', '角色设定', '人物设定', '角色人设', '人物角色'],
      '创建': ['制作', '建立', '设计', '构建', '生成', '新建'],
      '怎么': ['如何', '怎样', '方法', '步骤', '流程'],
      
      // 短剧相关
      '短剧': ['短视频', '微剧', '网剧', '剧集'],
      '解说': ['旁白', '配音', '说明', '讲解', '叙述'],
      '素材': ['资源', '材料', '文件', '内容', '资料'],
      
      // 功能相关
      '管理': ['管理', '整理', '组织', '维护'],
      '编辑': ['修改', '调整', '更新', '编辑'],
      '生成': ['创建', '制作', '产生', '生成']
    };

    // 领域特定的关键词权重
    this.keywordWeights = {
      // 高权重关键词
      high: ['人设', '角色', '创建', '短剧', '解说', '功能', '流程', '步骤'],
      // 中权重关键词
      medium: ['管理', '素材', '内容', '编辑', '生成', '模板'],
      // 低权重关键词
      low: ['系统', '平台', '工具', '界面', '操作']
    };

    // 问题类型模式
    this.questionPatterns = {
      howTo: /^(怎么|如何|怎样|方法|步骤)/,
      what: /^(什么是|什么叫|定义)/,
      where: /^(在哪|哪里|位置)/,
      why: /^(为什么|原因|目的)/
    };
  }

  // 增强查询处理
  enhanceQuery(originalQuery) {
    const enhanced = {
      originalQuery,
      expandedTerms: [],
      questionType: null,
      focusKeywords: [],
      searchStrategy: 'hybrid'
    };

    // 1. 识别问题类型
    enhanced.questionType = this.identifyQuestionType(originalQuery);

    // 2. 扩展同义词
    enhanced.expandedTerms = this.expandSynonyms(originalQuery);

    // 3. 提取焦点关键词
    enhanced.focusKeywords = this.extractFocusKeywords(originalQuery);

    // 4. 确定搜索策略
    enhanced.searchStrategy = this.determineSearchStrategy(originalQuery, enhanced.questionType);

    return enhanced;
  }

  // 识别问题类型
  identifyQuestionType(query) {
    for (const [type, pattern] of Object.entries(this.questionPatterns)) {
      if (pattern.test(query)) {
        return type;
      }
    }
    return 'general';
  }

  // 扩展同义词
  expandSynonyms(query) {
    const words = query.split(/\s+/);
    const expanded = new Set(words);

    for (const word of words) {
      // 查找同义词
      for (const [key, synonyms] of Object.entries(this.synonymMaps)) {
        if (word.includes(key) || synonyms.some(syn => word.includes(syn))) {
          synonyms.forEach(syn => expanded.add(syn));
          expanded.add(key);
        }
      }
    }

    return Array.from(expanded);
  }

  // 提取焦点关键词
  extractFocusKeywords(query) {
    const words = query.split(/\s+/);
    const keywords = [];

    for (const word of words) {
      let weight = 0;
      
      // 计算权重
      if (this.keywordWeights.high.some(kw => word.includes(kw))) {
        weight = 3;
      } else if (this.keywordWeights.medium.some(kw => word.includes(kw))) {
        weight = 2;
      } else if (this.keywordWeights.low.some(kw => word.includes(kw))) {
        weight = 1;
      }

      if (weight > 0) {
        keywords.push({ word, weight });
      }
    }

    return keywords.sort((a, b) => b.weight - a.weight);
  }

  // 确定搜索策略
  determineSearchStrategy(query, questionType) {
    // 根据问题类型调整搜索策略
    switch (questionType) {
      case 'howTo':
        return 'procedure_focused'; // 重点搜索步骤和流程
      case 'what':
        return 'definition_focused'; // 重点搜索定义和说明
      case 'where':
        return 'location_focused'; // 重点搜索位置和界面
      default:
        return 'hybrid';
    }
  }

  // 生成优化的搜索查询
  generateOptimizedQueries(enhancedQuery) {
    const queries = [];

    // 1. 原始查询
    queries.push({
      query: enhancedQuery.originalQuery,
      weight: 1.0,
      type: 'original'
    });

    // 2. 扩展同义词查询
    if (enhancedQuery.expandedTerms.length > 0) {
      const expandedQuery = enhancedQuery.expandedTerms.slice(0, 5).join(' ');
      queries.push({
        query: expandedQuery,
        weight: 0.8,
        type: 'expanded'
      });
    }

    // 3. 焦点关键词查询
    if (enhancedQuery.focusKeywords.length > 0) {
      const focusQuery = enhancedQuery.focusKeywords
        .slice(0, 3)
        .map(kw => kw.word)
        .join(' ');
      queries.push({
        query: focusQuery,
        weight: 0.9,
        type: 'focused'
      });
    }

    // 4. 特定领域查询（针对你的文档）
    if (enhancedQuery.originalQuery.includes('人设') || enhancedQuery.originalQuery.includes('创建')) {
      queries.push({
        query: '创建人设 短剧解说 角色设定',
        weight: 1.2,
        type: 'domain_specific'
      });
    }

    return queries;
  }

  // 针对特定文档的内容匹配
  matchDocumentContent(query, documentContent) {
    const enhanced = this.enhanceQuery(query);
    let score = 0;
    const matches = [];

    // 检查标题匹配
    const titleMatches = this.findMatches(enhanced.expandedTerms, documentContent, 'title');
    score += titleMatches.length * 2.0;
    matches.push(...titleMatches);

    // 检查功能描述匹配
    const functionMatches = this.findMatches(enhanced.expandedTerms, documentContent, 'function');
    score += functionMatches.length * 1.5;
    matches.push(...functionMatches);

    // 检查步骤流程匹配
    if (enhanced.questionType === 'howTo') {
      const procedureMatches = this.findMatches(['步骤', '流程', '操作', '方法'], documentContent, 'procedure');
      score += procedureMatches.length * 1.8;
      matches.push(...procedureMatches);
    }

    return {
      score,
      matches,
      relevantSections: this.extractRelevantSections(documentContent, enhanced.expandedTerms)
    };
  }

  // 查找匹配项
  findMatches(terms, content, type) {
    const matches = [];
    const contentLower = content.toLowerCase();

    for (const term of terms) {
      const termLower = term.toLowerCase();
      let index = 0;
      
      while ((index = contentLower.indexOf(termLower, index)) !== -1) {
        matches.push({
          term,
          position: index,
          type,
          context: this.extractContext(content, index, termLower.length)
        });
        index += termLower.length;
      }
    }

    return matches;
  }

  // 提取上下文
  extractContext(content, position, termLength, contextSize = 100) {
    const start = Math.max(0, position - contextSize);
    const end = Math.min(content.length, position + termLength + contextSize);
    return content.substring(start, end);
  }

  // 提取相关章节
  extractRelevantSections(content, terms) {
    const sections = [];
    const lines = content.split('\n');
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const lineLower = line.toLowerCase();
      
      // 检查是否包含关键词
      const hasKeyword = terms.some(term => lineLower.includes(term.toLowerCase()));
      
      if (hasKeyword) {
        // 提取相关段落
        const sectionStart = Math.max(0, i - 2);
        const sectionEnd = Math.min(lines.length, i + 3);
        const section = lines.slice(sectionStart, sectionEnd).join('\n');
        
        sections.push({
          content: section,
          lineNumber: i + 1,
          relevance: this.calculateRelevance(line, terms)
        });
      }
    }

    return sections.sort((a, b) => b.relevance - a.relevance).slice(0, 5);
  }

  // 计算相关性
  calculateRelevance(text, terms) {
    let relevance = 0;
    const textLower = text.toLowerCase();
    
    for (const term of terms) {
      const termLower = term.toLowerCase();
      const matches = (textLower.match(new RegExp(termLower, 'g')) || []).length;
      relevance += matches * (term.length / 10); // 长词权重更高
    }
    
    return relevance;
  }
}

// 导出单例
const enhancedQueryProcessor = new EnhancedQueryProcessor();
export default enhancedQueryProcessor;
