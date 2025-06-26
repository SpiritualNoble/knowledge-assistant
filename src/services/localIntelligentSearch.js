// 本地智能搜索 - 无需API的真正智能搜索
class LocalIntelligentSearch {
  constructor() {
    this.documents = new Map(); // 存储用户文档
    this.processedContent = new Map(); // 存储处理后的内容
  }

  // 添加文档
  async addDocument(file, metadata, userId) {
    console.log('📄 添加文档到本地智能搜索:', file.name);
    
    try {
      // 提取文档内容
      const content = await this.extractContent(file);
      
      // 智能处理文档
      const processed = this.processDocument(content, metadata);
      
      const docId = crypto.randomUUID();
      const document = {
        id: docId,
        userId,
        filename: file.name,
        title: metadata.title || file.name,
        content,
        processed,
        uploadedAt: new Date().toISOString(),
        metadata
      };
      
      // 存储文档
      if (!this.documents.has(userId)) {
        this.documents.set(userId, []);
      }
      this.documents.get(userId).push(document);
      
      // 同时存储到localStorage作为持久化
      this.saveToLocalStorage(userId, document);
      
      console.log('✅ 文档添加成功，已处理', processed.sections.length, '个章节');
      return document;
      
    } catch (error) {
      console.error('❌ 文档添加失败:', error);
      throw error;
    }
  }

  // 提取文档内容
  async extractContent(file) {
    if (file.type.startsWith('text/') || file.name.endsWith('.md') || file.name.endsWith('.txt')) {
      return await file.text();
    }
    throw new Error('不支持的文件类型');
  }

  // 处理文档内容
  processDocument(content, metadata) {
    const lines = content.split('\n');
    const processed = {
      sections: [],
      qaMap: new Map(),
      keywords: new Set()
    };

    let currentSection = null;
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;

      // 检测标题
      if (line.startsWith('#')) {
        if (currentSection) {
          processed.sections.push(currentSection);
        }
        
        const level = line.match(/^#+/)[0].length;
        const title = line.replace(/^#+\s*/, '');
        
        currentSection = {
          level,
          title,
          content: [],
          lineStart: i,
          keywords: new Set(this.extractKeywords(title))
        };
        
        // 添加关键词
        currentSection.keywords.forEach(kw => processed.keywords.add(kw));
        continue;
      }

      // 添加内容到当前章节
      if (currentSection) {
        currentSection.content.push(line);
        
        // 提取关键词
        const lineKeywords = this.extractKeywords(line);
        lineKeywords.forEach(kw => {
          processed.keywords.add(kw);
          currentSection.keywords.add(kw);
        });
      }
    }

    // 添加最后一个章节
    if (currentSection) {
      processed.sections.push(currentSection);
    }

    // 生成问答映射
    this.generateQAMapping(processed);

    return processed;
  }

  // 提取关键词
  extractKeywords(text) {
    const keywords = new Set();
    
    // 中文词汇提取
    const chineseWords = text.match(/[\u4e00-\u9fa5]{2,}/g) || [];
    chineseWords.forEach(word => {
      if (word.length >= 2 && word.length <= 6) {
        keywords.add(word);
      }
    });
    
    // 英文词汇提取
    const englishWords = text.match(/[a-zA-Z]{3,}/g) || [];
    englishWords.forEach(word => {
      keywords.add(word.toLowerCase());
    });
    
    return Array.from(keywords);
  }

  // 生成问答映射
  generateQAMapping(processed) {
    for (const section of processed.sections) {
      const title = section.title;
      const content = section.content.join(' ');
      
      // 生成可能的问题
      const questions = this.generateQuestions(title, content);
      
      for (const question of questions) {
        processed.qaMap.set(question.toLowerCase(), {
          answer: this.generateAnswer(title, content, question),
          section: title,
          confidence: question.confidence || 0.8
        });
      }
    }
  }

  // 生成可能的问题
  generateQuestions(title, content) {
    const questions = [];
    
    // 基于标题生成问题
    if (title.includes('创建') || title.includes('新建')) {
      questions.push(`怎么${title}`, `如何${title}`, `${title}的方法`);
    }
    
    if (title.includes('功能') || title.includes('模块')) {
      questions.push(`${title}是什么`, `${title}怎么用`);
    }
    
    // 基于内容生成问题
    if (content.includes('步骤') || content.includes('流程')) {
      const mainTopic = this.extractMainTopic(title);
      if (mainTopic) {
        questions.push(`${mainTopic}的步骤`, `如何${mainTopic}`, `怎么${mainTopic}`);
      }
    }
    
    return questions;
  }

  // 提取主题
  extractMainTopic(title) {
    // 提取核心概念
    const topics = title.match(/[\u4e00-\u9fa5]{2,}/g) || [];
    return topics.find(topic => 
      !['功能', '模块', '系统', '平台', '工具'].includes(topic)
    );
  }

  // 生成答案
  generateAnswer(title, content, question) {
    // 查找相关内容
    const sentences = content.split(/[。！？.!?]/).filter(s => s.trim().length > 5);
    
    // 如果是"怎么"类问题，查找步骤
    if (question.includes('怎么') || question.includes('如何')) {
      const steps = this.extractSteps(content);
      if (steps.length > 0) {
        return `${title}的具体步骤：\n${steps.map((step, i) => `${i + 1}. ${step}`).join('\n')}`;
      }
    }
    
    // 返回相关句子
    const relevantSentences = sentences.slice(0, 3);
    return relevantSentences.join('。') + '。';
  }

  // 提取步骤
  extractSteps(content) {
    const steps = [];
    const lines = content.split('\n');
    
    for (const line of lines) {
      // 匹配数字步骤
      const numberMatch = line.match(/^\s*(\d+)[\.\、]\s*(.+)/);
      if (numberMatch) {
        steps.push(numberMatch[2].trim());
        continue;
      }
      
      // 匹配中文步骤
      const chineseMatch = line.match(/^\s*(第[一二三四五六七八九十]+步|[一二三四五六七八九十]+[\.\、])\s*(.+)/);
      if (chineseMatch) {
        steps.push(chineseMatch[2].trim());
        continue;
      }
      
      // 匹配点击、输入等操作
      if (line.includes('点击') || line.includes('输入') || line.includes('选择') || line.includes('填写')) {
        steps.push(line.trim());
      }
    }
    
    return steps;
  }

  // 智能搜索
  async search(query, userId) {
    console.log('🔍 本地智能搜索:', query);
    
    // 加载用户文档
    await this.loadUserDocuments(userId);
    
    const userDocs = this.documents.get(userId) || [];
    if (userDocs.length === 0) {
      return {
        results: [],
        answer: '请先上传文档到知识库',
        confidence: 0
      };
    }

    const allResults = [];
    
    for (const doc of userDocs) {
      // 1. 直接问答匹配
      const qaResults = this.searchQA(query, doc.processed.qaMap);
      allResults.push(...qaResults.map(r => ({ ...r, docId: doc.id, docTitle: doc.title })));
      
      // 2. 关键词匹配
      const keywordResults = this.searchByKeywords(query, doc);
      allResults.push(...keywordResults.map(r => ({ ...r, docId: doc.id, docTitle: doc.title })));
      
      // 3. 内容匹配
      const contentResults = this.searchContent(query, doc);
      allResults.push(...contentResults.map(r => ({ ...r, docId: doc.id, docTitle: doc.title })));
    }

    // 排序和去重
    const sortedResults = this.rankResults(allResults, query);
    
    // 生成智能回答
    const answer = this.generateIntelligentAnswer(query, sortedResults);
    
    return {
      results: sortedResults.slice(0, 5),
      answer,
      confidence: sortedResults.length > 0 ? sortedResults[0].score : 0,
      totalFound: sortedResults.length
    };
  }

  // 问答搜索
  searchQA(query, qaMap) {
    const results = [];
    const queryLower = query.toLowerCase();
    
    for (const [question, qa] of qaMap) {
      let score = 0;
      
      // 完全匹配
      if (question === queryLower) {
        score = 1.0;
      }
      // 包含匹配
      else if (question.includes(queryLower) || queryLower.includes(question)) {
        score = 0.9;
      }
      // 关键词匹配
      else {
        const queryWords = queryLower.split(/\s+/);
        const questionWords = question.split(/\s+/);
        const matchCount = queryWords.filter(qw => 
          questionWords.some(qsw => qsw.includes(qw) || qw.includes(qsw))
        ).length;
        score = matchCount / queryWords.length * 0.8;
      }
      
      if (score > 0.3) {
        results.push({
          type: 'qa',
          question,
          answer: qa.answer,
          score,
          section: qa.section
        });
      }
    }
    
    return results;
  }

  // 关键词搜索
  searchByKeywords(query, doc) {
    const results = [];
    const queryKeywords = this.extractKeywords(query);
    
    for (const section of doc.processed.sections) {
      let matchCount = 0;
      
      for (const qkw of queryKeywords) {
        if (section.keywords.has(qkw)) {
          matchCount++;
        }
      }
      
      if (matchCount > 0) {
        const score = matchCount / queryKeywords.length * 0.7;
        results.push({
          type: 'keyword',
          content: section.content.slice(0, 3).join('。') + '。',
          score,
          section: section.title
        });
      }
    }
    
    return results;
  }

  // 内容搜索
  searchContent(query, doc) {
    const results = [];
    const queryLower = query.toLowerCase();
    
    for (const section of doc.processed.sections) {
      const sectionContent = section.content.join(' ');
      const contentLower = sectionContent.toLowerCase();
      
      if (contentLower.includes(queryLower)) {
        // 提取相关句子
        const sentences = sectionContent.split(/[。！？.!?]/).filter(s => s.trim().length > 5);
        const relevantSentences = sentences.filter(s => 
          s.toLowerCase().includes(queryLower)
        );
        
        if (relevantSentences.length > 0) {
          const score = relevantSentences.length / sentences.length * 0.6;
          results.push({
            type: 'content',
            content: relevantSentences.slice(0, 2).join('。') + '。',
            score,
            section: section.title
          });
        }
      }
    }
    
    return results;
  }

  // 结果排序
  rankResults(results, query) {
    // 按分数排序
    results.sort((a, b) => b.score - a.score);
    
    // 去重
    const seen = new Set();
    const uniqueResults = [];
    
    for (const result of results) {
      const key = `${result.type}_${result.section}_${result.content?.substring(0, 50)}`;
      if (!seen.has(key)) {
        seen.add(key);
        uniqueResults.push(result);
      }
    }
    
    return uniqueResults;
  }

  // 生成智能回答
  generateIntelligentAnswer(query, results) {
    if (results.length === 0) {
      return '在您的文档中没有找到相关信息。';
    }
    
    const bestResult = results[0];
    
    if (bestResult.type === 'qa') {
      return bestResult.answer;
    } else {
      return `根据文档《${bestResult.docTitle}》中的${bestResult.section}部分：\n\n${bestResult.content}`;
    }
  }

  // 保存到本地存储
  saveToLocalStorage(userId, document) {
    const key = `intelligent_docs_${userId}`;
    const existing = JSON.parse(localStorage.getItem(key) || '[]');
    existing.push({
      id: document.id,
      filename: document.filename,
      title: document.title,
      content: document.content,
      processed: {
        sections: document.processed.sections,
        qaMap: Array.from(document.processed.qaMap.entries()),
        keywords: Array.from(document.processed.keywords)
      },
      uploadedAt: document.uploadedAt
    });
    localStorage.setItem(key, JSON.stringify(existing));
  }

  // 从本地存储加载
  async loadUserDocuments(userId) {
    if (this.documents.has(userId)) return;
    
    const key = `intelligent_docs_${userId}`;
    const stored = JSON.parse(localStorage.getItem(key) || '[]');
    
    const documents = stored.map(doc => ({
      ...doc,
      processed: {
        sections: doc.processed.sections,
        qaMap: new Map(doc.processed.qaMap),
        keywords: new Set(doc.processed.keywords)
      }
    }));
    
    this.documents.set(userId, documents);
  }

  // 获取用户文档列表
  async getUserDocuments(userId) {
    await this.loadUserDocuments(userId);
    return this.documents.get(userId) || [];
  }

  // 删除文档
  async deleteDocument(docId, userId) {
    const userDocs = this.documents.get(userId) || [];
    const filteredDocs = userDocs.filter(doc => doc.id !== docId);
    this.documents.set(userId, filteredDocs);
    
    // 更新本地存储
    const key = `intelligent_docs_${userId}`;
    const toStore = filteredDocs.map(doc => ({
      ...doc,
      processed: {
        sections: doc.processed.sections,
        qaMap: Array.from(doc.processed.qaMap.entries()),
        keywords: Array.from(doc.processed.keywords)
      }
    }));
    localStorage.setItem(key, JSON.stringify(toStore));
  }
}

// 导出单例
const localIntelligentSearch = new LocalIntelligentSearch();
export default localIntelligentSearch;
