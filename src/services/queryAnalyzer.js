// 查询理解模块 - LLM驱动的智能查询分析
import llmService from './llmService';

class QueryAnalyzer {
  constructor() {
    this.queryCache = new Map();
    this.entityPatterns = {
      // 产品相关
      product: /产品|功能|特性|模块|组件|系统/gi,
      // 文档类型
      docType: /文档|手册|指南|教程|说明|规范|标准/gi,
      // 时间相关
      time: /今天|昨天|本周|上周|本月|上月|最近|(\d+)天前|(\d+)月前/gi,
      // 操作相关
      action: /如何|怎么|怎样|方法|步骤|流程|操作/gi,
      // 问题相关
      problem: /问题|错误|异常|故障|bug|失败|不能|无法/gi
    };
  }

  // 主要查询分析入口
  async analyzeQuery(query, context = {}) {
    // 检查缓存
    const cacheKey = this.generateCacheKey(query, context);
    if (this.queryCache.has(cacheKey)) {
      return this.queryCache.get(cacheKey);
    }

    try {
      // 使用LLM进行深度分析
      const llmAnalysis = await this.performLLMAnalysis(query, context);
      
      // 结合规则基础分析
      const ruleAnalysis = this.performRuleBasedAnalysis(query);
      
      // 融合分析结果
      const finalAnalysis = this.mergeAnalysis(llmAnalysis, ruleAnalysis, query);
      
      // 缓存结果
      this.queryCache.set(cacheKey, finalAnalysis);
      
      return finalAnalysis;
    } catch (error) {
      console.warn('LLM查询分析失败，使用规则基础分析:', error);
      return this.performRuleBasedAnalysis(query);
    }
  }

  // LLM深度分析
  async performLLMAnalysis(query, context) {
    const prompt = this.buildAnalysisPrompt(query, context);
    
    const response = await llmService.chatCompletion(prompt, {
      model: 'qwen-turbo',
      temperature: 0.3,
      maxTokens: 500,
      useCache: true
    });

    try {
      // 尝试解析JSON响应
      const parsed = JSON.parse(response);
      return this.validateAnalysisResult(parsed);
    } catch (parseError) {
      console.warn('LLM响应解析失败:', parseError);
      // 尝试从文本中提取结构化信息
      return this.extractStructuredInfo(response, query);
    }
  }

  // 构建分析提示词
  buildAnalysisPrompt(query, context) {
    const { userHistory = [], documentTypes = [], recentDocs = [] } = context;
    
    return `你是一个专业的搜索查询分析助手。请分析用户查询并返回标准化的搜索指令。

**分析要求：**
1. 识别查询意图（信息查找/问题解决/操作指导/概念解释）
2. 提取核心实体（产品名/功能名/文档类型/技术术语）
3. 判断最佳搜索策略（语义搜索/关键词匹配/混合搜索）
4. 识别过滤条件（时间范围/文档类型/标签分类）
5. 评估查询复杂度和紧急程度

**用户查询：** "${query}"

**上下文信息：**
- 用户历史查询：${userHistory.slice(-3).join(', ') || '无'}
- 可用文档类型：${documentTypes.join(', ') || '通用文档'}
- 最近文档：${recentDocs.slice(0, 3).map(d => d.title).join(', ') || '无'}

**输出格式（严格JSON）：**
\`\`\`json
{
  "intent": "information_seeking|problem_solving|how_to|concept_explanation",
  "entities": ["实体1", "实体2"],
  "searchType": "semantic|keyword|hybrid",
  "filters": {
    "timeRange": "recent|week|month|all",
    "docTypes": ["类型1", "类型2"],
    "tags": ["标签1", "标签2"],
    "priority": "high|medium|low"
  },
  "complexity": "simple|medium|complex",
  "confidence": 0.85,
  "suggestedQueries": ["相关查询1", "相关查询2"]
}
\`\`\`

请确保返回有效的JSON格式。`;
  }

  // 规则基础分析（备用方案）
  performRuleBasedAnalysis(query) {
    const entities = this.extractEntitiesWithRules(query);
    const intent = this.detectIntent(query);
    const searchType = this.determineSearchType(query, intent);
    const filters = this.extractFilters(query);

    return {
      intent,
      entities,
      searchType,
      filters,
      complexity: this.assessComplexity(query),
      confidence: 0.7, // 规则基础分析置信度较低
      suggestedQueries: this.generateSuggestedQueries(query, entities),
      source: 'rule-based'
    };
  }

  // 实体提取（规则基础）
  extractEntitiesWithRules(query) {
    const entities = [];
    const cleanQuery = query.toLowerCase();

    // 使用正则模式提取实体
    for (const [category, pattern] of Object.entries(this.entityPatterns)) {
      const matches = cleanQuery.match(pattern);
      if (matches) {
        entities.push(...matches.map(match => ({
          text: match,
          category,
          confidence: 0.8
        })));
      }
    }

    // 提取专有名词（大写开头的词组）
    const properNouns = query.match(/[A-Z][a-zA-Z]+(?:\s+[A-Z][a-zA-Z]+)*/g) || [];
    entities.push(...properNouns.map(noun => ({
      text: noun,
      category: 'proper_noun',
      confidence: 0.9
    })));

    // 提取中文关键词（2-4个字符的词组）
    const chineseKeywords = query.match(/[\u4e00-\u9fa5]{2,4}/g) || [];
    entities.push(...chineseKeywords.map(keyword => ({
      text: keyword,
      category: 'keyword',
      confidence: 0.6
    })));

    // 去重并按置信度排序
    const uniqueEntities = Array.from(
      new Map(entities.map(e => [e.text.toLowerCase(), e])).values()
    ).sort((a, b) => b.confidence - a.confidence);

    return uniqueEntities.slice(0, 8).map(e => e.text);
  }

  // 意图检测
  detectIntent(query) {
    const intentPatterns = {
      problem_solving: /问题|错误|异常|故障|不能|无法|失败|报错/i,
      how_to: /如何|怎么|怎样|方法|步骤|流程|操作指南/i,
      concept_explanation: /什么是|定义|概念|原理|介绍|说明/i,
      information_seeking: /查找|搜索|找到|获取|了解|知道/i
    };

    for (const [intent, pattern] of Object.entries(intentPatterns)) {
      if (pattern.test(query)) {
        return intent;
      }
    }

    return 'information_seeking'; // 默认意图
  }

  // 搜索类型判断
  determineSearchType(query, intent) {
    // 精确匹配的情况
    if (query.includes('"') || query.includes('精确') || query.includes('完全匹配')) {
      return 'keyword';
    }

    // 语义搜索的情况
    if (intent === 'concept_explanation' || query.length > 20 || /相关|类似|相似/.test(query)) {
      return 'semantic';
    }

    // 默认混合搜索
    return 'hybrid';
  }

  // 过滤条件提取
  extractFilters(query) {
    const filters = {
      timeRange: 'all',
      docTypes: [],
      tags: [],
      priority: 'medium'
    };

    // 时间范围检测
    if (/最近|近期|今天|昨天/.test(query)) {
      filters.timeRange = 'recent';
    } else if (/本周|这周|上周/.test(query)) {
      filters.timeRange = 'week';
    } else if (/本月|这月|上月/.test(query)) {
      filters.timeRange = 'month';
    }

    // 文档类型检测
    const docTypeMatches = query.match(/文档|手册|指南|教程|说明|API|接口|规范/gi);
    if (docTypeMatches) {
      filters.docTypes = [...new Set(docTypeMatches.map(m => m.toLowerCase()))];
    }

    // 优先级检测
    if (/紧急|急|重要|关键/.test(query)) {
      filters.priority = 'high';
    } else if (/一般|普通|了解/.test(query)) {
      filters.priority = 'low';
    }

    return filters;
  }

  // 复杂度评估
  assessComplexity(query) {
    const length = query.length;
    const wordCount = query.split(/\s+/).length;
    const hasLogicalOperators = /和|或|不是|除了|但是|然而/.test(query);
    const hasMultipleQuestions = (query.match(/[？?]/g) || []).length > 1;

    if (length > 50 || wordCount > 10 || hasLogicalOperators || hasMultipleQuestions) {
      return 'complex';
    } else if (length > 20 || wordCount > 5) {
      return 'medium';
    } else {
      return 'simple';
    }
  }

  // 生成建议查询
  generateSuggestedQueries(query, entities) {
    const suggestions = [];
    
    // 基于实体生成相关查询
    if (entities.length > 0) {
      suggestions.push(`${entities[0]}的详细说明`);
      suggestions.push(`如何使用${entities[0]}`);
      
      if (entities.length > 1) {
        suggestions.push(`${entities[0]}和${entities[1]}的区别`);
      }
    }

    // 基于查询类型生成建议
    if (query.includes('问题')) {
      suggestions.push('常见问题解答');
      suggestions.push('故障排除指南');
    }

    return suggestions.slice(0, 3);
  }

  // 分析结果融合
  mergeAnalysis(llmAnalysis, ruleAnalysis, originalQuery) {
    if (!llmAnalysis || llmAnalysis.confidence < 0.5) {
      return {
        ...ruleAnalysis,
        originalQuery,
        analysisMethod: 'rule-based'
      };
    }

    // 融合LLM和规则分析的结果
    return {
      intent: llmAnalysis.intent || ruleAnalysis.intent,
      entities: this.mergeEntities(llmAnalysis.entities, ruleAnalysis.entities),
      searchType: llmAnalysis.searchType || ruleAnalysis.searchType,
      filters: { ...ruleAnalysis.filters, ...llmAnalysis.filters },
      complexity: llmAnalysis.complexity || ruleAnalysis.complexity,
      confidence: Math.max(llmAnalysis.confidence || 0, ruleAnalysis.confidence || 0),
      suggestedQueries: [
        ...(llmAnalysis.suggestedQueries || []),
        ...(ruleAnalysis.suggestedQueries || [])
      ].slice(0, 5),
      originalQuery,
      analysisMethod: 'hybrid'
    };
  }

  // 实体合并
  mergeEntities(llmEntities = [], ruleEntities = []) {
    const allEntities = [...llmEntities, ...ruleEntities];
    const uniqueEntities = Array.from(new Set(allEntities.map(e => e.toLowerCase())));
    return uniqueEntities.slice(0, 10);
  }

  // 验证分析结果
  validateAnalysisResult(result) {
    const requiredFields = ['intent', 'entities', 'searchType'];
    const validIntents = ['information_seeking', 'problem_solving', 'how_to', 'concept_explanation'];
    const validSearchTypes = ['semantic', 'keyword', 'hybrid'];

    // 检查必需字段
    for (const field of requiredFields) {
      if (!result[field]) {
        throw new Error(`Missing required field: ${field}`);
      }
    }

    // 验证枚举值
    if (!validIntents.includes(result.intent)) {
      result.intent = 'information_seeking';
    }

    if (!validSearchTypes.includes(result.searchType)) {
      result.searchType = 'hybrid';
    }

    // 确保实体是数组
    if (!Array.isArray(result.entities)) {
      result.entities = [];
    }

    // 设置默认值
    result.confidence = Math.min(Math.max(result.confidence || 0.5, 0), 1);
    result.complexity = result.complexity || 'medium';
    result.filters = result.filters || {};
    result.suggestedQueries = result.suggestedQueries || [];

    return result;
  }

  // 从文本提取结构化信息
  extractStructuredInfo(text, query) {
    // 简单的文本解析逻辑
    const entities = this.extractEntitiesWithRules(query);
    const intent = this.detectIntent(query);
    
    return {
      intent,
      entities,
      searchType: 'hybrid',
      filters: {},
      complexity: 'medium',
      confidence: 0.6,
      suggestedQueries: [],
      source: 'text-extraction'
    };
  }

  // 生成缓存键
  generateCacheKey(query, context) {
    const contextStr = JSON.stringify(context);
    return btoa(query + contextStr).substring(0, 32);
  }

  // 清理缓存
  clearCache() {
    this.queryCache.clear();
  }

  // 获取分析统计
  getAnalysisStats() {
    return {
      cacheSize: this.queryCache.size,
      supportedIntents: ['information_seeking', 'problem_solving', 'how_to', 'concept_explanation'],
      supportedSearchTypes: ['semantic', 'keyword', 'hybrid']
    };
  }
}

// 导出单例
const queryAnalyzer = new QueryAnalyzer();
export default queryAnalyzer;
