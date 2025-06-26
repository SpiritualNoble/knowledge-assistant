// 智能结果生成器 - LLM驱动的答案合成
import llmService from './llmService';

class IntelligentResponseGenerator {
  constructor() {
    this.responseCache = new Map();
    this.templateCache = new Map();
    this.maxContextLength = 4000; // 最大上下文长度
    this.maxResponseLength = 800; // 最大回答长度
  }

  // 生成智能回答
  async generateResponse(query, searchResults, analysisResult, options = {}) {
    const {
      responseType = 'comprehensive', // comprehensive | concise | detailed
      includeReferences = true,
      maxSources = 5,
      language = 'zh-CN'
    } = options;

    try {
      // 检查缓存
      const cacheKey = this.generateCacheKey(query, searchResults.slice(0, 3));
      if (this.responseCache.has(cacheKey)) {
        const cached = this.responseCache.get(cacheKey);
        if (Date.now() - cached.timestamp < 600000) { // 10分钟缓存
          return cached.response;
        }
      }

      // 准备上下文
      const context = this.prepareContext(searchResults, maxSources);
      
      // 生成回答
      const response = await this.generateIntelligentAnswer(
        query, 
        context, 
        analysisResult, 
        responseType,
        language
      );

      // 添加引用信息
      const finalResponse = includeReferences 
        ? this.addReferences(response, searchResults.slice(0, maxSources))
        : response;

      // 缓存结果
      this.responseCache.set(cacheKey, {
        response: finalResponse,
        timestamp: Date.now()
      });

      return finalResponse;
    } catch (error) {
      console.warn('智能回答生成失败，使用备用方案:', error);
      return this.generateFallbackResponse(query, searchResults, analysisResult);
    }
  }

  // 准备上下文信息
  prepareContext(searchResults, maxSources) {
    const contexts = [];
    let totalLength = 0;

    for (let i = 0; i < Math.min(searchResults.length, maxSources); i++) {
      const result = searchResults[i];
      const source = `[来源${i + 1}: ${result.metadata?.title || result.metadata?.source || '未知文档'}]`;
      const content = result.content || '';
      
      const contextItem = `${source}\n${content}`;
      
      // 控制总长度
      if (totalLength + contextItem.length > this.maxContextLength) {
        const remainingLength = this.maxContextLength - totalLength;
        if (remainingLength > 100) {
          contexts.push(contextItem.substring(0, remainingLength) + '...');
        }
        break;
      }
      
      contexts.push(contextItem);
      totalLength += contextItem.length;
    }

    return contexts.join('\n\n---\n\n');
  }

  // 生成智能答案
  async generateIntelligentAnswer(query, context, analysisResult, responseType, language) {
    const prompt = this.buildResponsePrompt(query, context, analysisResult, responseType, language);
    
    const response = await llmService.chatCompletion(prompt, {
      model: 'qwen-plus', // 使用更强的模型生成回答
      temperature: 0.3,
      maxTokens: this.maxResponseLength,
      useCache: true
    });

    return this.postProcessResponse(response, analysisResult);
  }

  // 构建回答提示词
  buildResponsePrompt(query, context, analysisResult, responseType, language) {
    const intentPrompts = {
      information_seeking: '请基于提供的知识库内容，准确回答用户的信息查询问题。',
      problem_solving: '请基于提供的知识库内容，帮助用户解决遇到的问题，提供具体的解决方案。',
      how_to: '请基于提供的知识库内容，为用户提供详细的操作步骤和指导。',
      concept_explanation: '请基于提供的知识库内容，清晰地解释相关概念和原理。'
    };

    const responseTypePrompts = {
      comprehensive: '请提供全面详细的回答，包含背景信息、具体内容和相关建议。',
      concise: '请提供简洁明了的回答，直接回答核心问题。',
      detailed: '请提供深入详细的回答，包含技术细节和实现方法。'
    };

    const intentPrompt = intentPrompts[analysisResult.intent] || intentPrompts.information_seeking;
    const typePrompt = responseTypePrompts[responseType] || responseTypePrompts.comprehensive;

    return `你是一个专业的知识助手，擅长基于文档内容回答用户问题。

**任务要求：**
${intentPrompt}
${typePrompt}

**回答规范：**
1. 基于提供的知识库内容回答，不要编造信息
2. 如果信息不足，请明确说明并建议用户查找更多资料
3. 使用清晰的结构组织回答（如分点、分段）
4. 重要信息可以加粗显示
5. 如果涉及步骤，请使用有序列表
6. 回答长度控制在${this.maxResponseLength}字以内

**用户问题：** ${query}

**知识库内容：**
${context}

**回答要求：**
- 语言：${language === 'zh-CN' ? '中文' : '英文'}
- 查询复杂度：${analysisResult.complexity}
- 回答类型：${responseType}

请直接提供回答，不要包含"根据提供的内容"等前缀：`;
  }

  // 后处理回答
  postProcessResponse(response, analysisResult) {
    let processed = response.trim();

    // 移除常见的无用前缀
    const prefixesToRemove = [
      '根据提供的知识库内容，',
      '基于以上信息，',
      '根据文档内容，',
      '从知识库中可以看出，'
    ];

    for (const prefix of prefixesToRemove) {
      if (processed.startsWith(prefix)) {
        processed = processed.substring(prefix.length);
        break;
      }
    }

    // 确保回答以适当的语气结束
    if (!processed.endsWith('。') && !processed.endsWith('.') && !processed.endsWith('！') && !processed.endsWith('?')) {
      processed += '。';
    }

    return processed;
  }

  // 添加引用信息
  addReferences(response, searchResults) {
    if (!searchResults || searchResults.length === 0) {
      return response;
    }

    const references = searchResults.map((result, index) => {
      const title = result.metadata?.title || result.metadata?.source || `文档${index + 1}`;
      const score = (result.score * 100).toFixed(1);
      const uploadDate = result.metadata?.uploadedAt 
        ? new Date(result.metadata.uploadedAt).toLocaleDateString('zh-CN')
        : '未知';
      
      return `${index + 1}. **${title}** (相关性: ${score}%, 更新时间: ${uploadDate})`;
    }).join('\n');

    return `${response}\n\n---\n\n**📚 参考来源**\n${references}`;
  }

  // 生成备用回答
  generateFallbackResponse(query, searchResults, analysisResult) {
    if (!searchResults || searchResults.length === 0) {
      return this.generateNoResultsResponse(query, analysisResult);
    }

    // 简单的基于模板的回答
    const topResult = searchResults[0];
    const content = topResult.content || '';
    const title = topResult.metadata?.title || '相关文档';

    let response = '';
    
    switch (analysisResult.intent) {
      case 'problem_solving':
        response = `关于您遇到的问题，在文档"${title}"中找到了相关信息：\n\n${content.substring(0, 300)}`;
        break;
      case 'how_to':
        response = `关于如何操作的问题，在文档"${title}"中有详细说明：\n\n${content.substring(0, 300)}`;
        break;
      case 'concept_explanation':
        response = `关于这个概念的解释，在文档"${title}"中有如下说明：\n\n${content.substring(0, 300)}`;
        break;
      default:
        response = `根据搜索结果，在文档"${title}"中找到了相关信息：\n\n${content.substring(0, 300)}`;
    }

    if (content.length > 300) {
      response += '...\n\n如需了解更多详细信息，请查看完整文档。';
    }

    return response;
  }

  // 生成无结果回答
  generateNoResultsResponse(query, analysisResult) {
    const suggestions = analysisResult.suggestedQueries || [];
    
    let response = '抱歉，在当前知识库中没有找到与您的问题直接相关的信息。';
    
    if (suggestions.length > 0) {
      response += '\n\n您可以尝试搜索以下相关问题：\n';
      response += suggestions.map((suggestion, index) => `${index + 1}. ${suggestion}`).join('\n');
    }
    
    response += '\n\n建议：\n- 尝试使用不同的关键词\n- 检查拼写是否正确\n- 使用更具体或更通用的搜索词';
    
    return response;
  }

  // 生成摘要
  async generateSummary(documents, topic, maxLength = 300) {
    if (!documents || documents.length === 0) {
      return '暂无相关文档可供总结。';
    }

    const context = documents.slice(0, 3).map(doc => 
      `${doc.metadata?.title || '文档'}: ${doc.content?.substring(0, 200) || ''}`
    ).join('\n\n');

    const prompt = `请基于以下文档内容，生成关于"${topic}"的简洁摘要：

文档内容：
${context}

要求：
- 摘要长度不超过${maxLength}字
- 突出关键信息和要点
- 使用清晰的语言表达
- 如果信息不足，请说明

摘要：`;

    try {
      const summary = await llmService.chatCompletion(prompt, {
        model: 'qwen-turbo',
        temperature: 0.3,
        maxTokens: maxLength,
        useCache: true
      });

      return summary.trim();
    } catch (error) {
      console.warn('摘要生成失败:', error);
      return this.generateSimpleSummary(documents, topic, maxLength);
    }
  }

  // 生成简单摘要
  generateSimpleSummary(documents, topic, maxLength) {
    const contents = documents.map(doc => doc.content || '').join(' ');
    const sentences = contents.split(/[。！？.!?]/).filter(s => s.trim().length > 10);
    
    let summary = '';
    for (const sentence of sentences) {
      if (summary.length + sentence.length > maxLength) break;
      if (sentence.toLowerCase().includes(topic.toLowerCase())) {
        summary += sentence.trim() + '。';
      }
    }
    
    return summary || `关于"${topic}"的信息，请查看相关文档获取详细内容。`;
  }

  // 生成缓存键
  generateCacheKey(query, results) {
    const resultIds = results.map(r => r.id).join(',');
    return btoa(query + resultIds).substring(0, 32);
  }

  // 清理缓存
  clearCache() {
    this.responseCache.clear();
    this.templateCache.clear();
  }

  // 获取统计信息
  getStats() {
    return {
      cacheSize: this.responseCache.size,
      templateCacheSize: this.templateCache.size,
      maxContextLength: this.maxContextLength,
      maxResponseLength: this.maxResponseLength
    };
  }
}

// 导出单例
const intelligentResponseGenerator = new IntelligentResponseGenerator();
export default intelligentResponseGenerator;
