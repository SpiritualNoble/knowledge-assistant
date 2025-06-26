// 智能文档处理器 - 真正理解文档内容
class IntelligentDocumentProcessor {
  constructor() {
    this.processedDocuments = new Map();
    this.documentKnowledge = new Map();
  }

  // 智能处理文档
  async processDocument(file, metadata, userId) {
    console.log('🧠 开始智能处理文档:', file.name);
    
    try {
      // 1. 提取文档内容
      const content = await this.extractContent(file);
      
      // 2. 结构化分析
      const structure = this.analyzeDocumentStructure(content);
      
      // 3. 提取知识点
      const knowledgePoints = this.extractKnowledgePoints(structure);
      
      // 4. 构建问答对
      const qaPairs = this.generateQAPairs(knowledgePoints);
      
      // 5. 创建语义索引
      const semanticIndex = await this.createSemanticIndex(content, knowledgePoints);
      
      const processedDoc = {
        id: crypto.randomUUID(),
        userId,
        filename: file.name,
        title: metadata.title || file.name,
        originalContent: content,
        structure,
        knowledgePoints,
        qaPairs,
        semanticIndex,
        processedAt: new Date().toISOString(),
        metadata
      };
      
      // 6. 存储处理结果
      this.processedDocuments.set(processedDoc.id, processedDoc);
      this.updateUserKnowledge(userId, processedDoc);
      
      console.log('✅ 文档处理完成，提取了', knowledgePoints.length, '个知识点');
      return processedDoc;
      
    } catch (error) {
      console.error('❌ 文档处理失败:', error);
      throw error;
    }
  }

  // 提取文档内容
  async extractContent(file) {
    const fileType = file.type;
    const fileName = file.name.toLowerCase();
    
    if (fileType.startsWith('text/') || fileName.endsWith('.md') || fileName.endsWith('.txt')) {
      return await file.text();
    } else if (fileName.endsWith('.json')) {
      return await file.text();
    } else {
      throw new Error(`不支持的文件类型: ${fileType}`);
    }
  }

  // 分析文档结构
  analyzeDocumentStructure(content) {
    const lines = content.split('\n');
    const structure = {
      title: '',
      sections: [],
      tables: [],
      lists: [],
      codeBlocks: []
    };

    let currentSection = null;
    let inCodeBlock = false;
    let inTable = false;
    let currentTable = [];

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      
      if (!line) continue;

      // 检测标题
      if (line.startsWith('#')) {
        const level = line.match(/^#+/)[0].length;
        const title = line.replace(/^#+\s*/, '');
        
        if (level === 1 && !structure.title) {
          structure.title = title;
        }
        
        currentSection = {
          level,
          title,
          content: [],
          startLine: i
        };
        structure.sections.push(currentSection);
        continue;
      }

      // 检测代码块
      if (line.startsWith('```')) {
        inCodeBlock = !inCodeBlock;
        if (!inCodeBlock && currentSection) {
          // 代码块结束
        }
        continue;
      }

      // 检测表格
      if (line.includes('|') && !inCodeBlock) {
        if (!inTable) {
          inTable = true;
          currentTable = [];
        }
        currentTable.push(line);
        continue;
      } else if (inTable) {
        // 表格结束
        structure.tables.push({
          content: currentTable,
          section: currentSection?.title || 'unknown'
        });
        inTable = false;
        currentTable = [];
      }

      // 检测列表
      if (line.match(/^[\s]*[-*+]\s/) || line.match(/^[\s]*\d+\.\s/)) {
        const listItem = {
          content: line,
          section: currentSection?.title || 'unknown',
          type: line.match(/^\d+\./) ? 'ordered' : 'unordered'
        };
        structure.lists.push(listItem);
      }

      // 添加到当前章节
      if (currentSection && !inCodeBlock) {
        currentSection.content.push(line);
      }
    }

    return structure;
  }

  // 提取知识点
  extractKnowledgePoints(structure) {
    const knowledgePoints = [];

    // 从章节中提取知识点
    for (const section of structure.sections) {
      const sectionText = section.content.join(' ');
      
      // 提取定义类知识点
      const definitions = this.extractDefinitions(sectionText, section.title);
      knowledgePoints.push(...definitions);
      
      // 提取步骤类知识点
      const procedures = this.extractProcedures(sectionText, section.title);
      knowledgePoints.push(...procedures);
      
      // 提取功能描述
      const features = this.extractFeatures(sectionText, section.title);
      knowledgePoints.push(...features);
    }

    // 从表格中提取知识点
    for (const table of structure.tables) {
      const tableKnowledge = this.extractTableKnowledge(table);
      knowledgePoints.push(...tableKnowledge);
    }

    // 从列表中提取知识点
    for (const list of structure.lists) {
      const listKnowledge = this.extractListKnowledge(list);
      knowledgePoints.push(...listKnowledge);
    }

    return knowledgePoints;
  }

  // 提取定义类知识点
  extractDefinitions(text, sectionTitle) {
    const definitions = [];
    const definitionPatterns = [
      /(.+?)是(.+?)。/g,
      /(.+?)：(.+?)。/g,
      /(.+?)指(.+?)。/g,
      /(.+?)定义为(.+?)。/g
    ];

    for (const pattern of definitionPatterns) {
      let match;
      while ((match = pattern.exec(text)) !== null) {
        const [, term, definition] = match;
        if (term.length < 20 && definition.length > 5) {
          definitions.push({
            type: 'definition',
            term: term.trim(),
            definition: definition.trim(),
            section: sectionTitle,
            confidence: 0.8
          });
        }
      }
    }

    return definitions;
  }

  // 提取步骤类知识点
  extractProcedures(text, sectionTitle) {
    const procedures = [];
    
    // 检测步骤序列
    const stepPatterns = [
      /(\d+)[\.\、]\s*(.+?)(?=\d+[\.\、]|$)/g,
      /(第[一二三四五六七八九十]+步)[\s]*[:：]?\s*(.+?)(?=第[一二三四五六七八九十]+步|$)/g
    ];

    for (const pattern of stepPatterns) {
      const steps = [];
      let match;
      while ((match = pattern.exec(text)) !== null) {
        const [, stepNum, stepContent] = match;
        steps.push({
          step: stepNum,
          content: stepContent.trim()
        });
      }
      
      if (steps.length >= 2) {
        procedures.push({
          type: 'procedure',
          title: `${sectionTitle}的操作步骤`,
          steps,
          section: sectionTitle,
          confidence: 0.9
        });
      }
    }

    return procedures;
  }

  // 提取功能描述
  extractFeatures(text, sectionTitle) {
    const features = [];
    
    // 检测功能描述模式
    const featurePatterns = [
      /支持(.+?)功能/g,
      /提供(.+?)能力/g,
      /具备(.+?)特性/g,
      /包含(.+?)模块/g
    ];

    for (const pattern of featurePatterns) {
      let match;
      while ((match = pattern.exec(text)) !== null) {
        const [, feature] = match;
        if (feature.length < 50) {
          features.push({
            type: 'feature',
            feature: feature.trim(),
            section: sectionTitle,
            confidence: 0.7
          });
        }
      }
    }

    return features;
  }

  // 提取表格知识
  extractTableKnowledge(table) {
    const knowledge = [];
    const rows = table.content.filter(row => row.includes('|'));
    
    if (rows.length < 2) return knowledge;
    
    // 解析表头
    const headers = rows[0].split('|').map(h => h.trim()).filter(h => h);
    
    // 解析数据行
    for (let i = 2; i < rows.length; i++) { // 跳过表头和分隔行
      const cells = rows[i].split('|').map(c => c.trim()).filter(c => c);
      
      if (cells.length >= 2) {
        const rowKnowledge = {
          type: 'table_row',
          data: {},
          section: table.section,
          confidence: 0.8
        };
        
        for (let j = 0; j < Math.min(headers.length, cells.length); j++) {
          rowKnowledge.data[headers[j]] = cells[j];
        }
        
        knowledge.push(rowKnowledge);
      }
    }

    return knowledge;
  }

  // 提取列表知识
  extractListKnowledge(list) {
    return [{
      type: 'list_item',
      content: list.content.replace(/^[\s]*[-*+\d\.]\s*/, ''),
      section: list.section,
      listType: list.type,
      confidence: 0.6
    }];
  }

  // 生成问答对
  generateQAPairs(knowledgePoints) {
    const qaPairs = [];

    for (const kp of knowledgePoints) {
      switch (kp.type) {
        case 'definition':
          qaPairs.push({
            question: `什么是${kp.term}？`,
            answer: `${kp.term}是${kp.definition}`,
            confidence: kp.confidence,
            source: kp.section
          });
          break;
          
        case 'procedure':
          qaPairs.push({
            question: `如何${kp.title.replace('的操作步骤', '')}？`,
            answer: kp.steps.map((step, index) => 
              `${index + 1}. ${step.content}`
            ).join('\n'),
            confidence: kp.confidence,
            source: kp.section
          });
          break;
          
        case 'feature':
          qaPairs.push({
            question: `有什么${kp.feature}功能？`,
            answer: `系统${kp.feature}功能，详见${kp.section}部分。`,
            confidence: kp.confidence,
            source: kp.section
          });
          break;
      }
    }

    return qaPairs;
  }

  // 创建语义索引
  async createSemanticIndex(content, knowledgePoints) {
    // 分块处理
    const chunks = this.splitIntoChunks(content, 300);
    const index = {
      chunks,
      embeddings: [], // 这里应该调用嵌入服务
      knowledgeMap: new Map()
    };

    // 为每个知识点创建映射
    for (const kp of knowledgePoints) {
      const key = this.generateKnowledgeKey(kp);
      index.knowledgeMap.set(key, kp);
    }

    return index;
  }

  // 文本分块
  splitIntoChunks(text, chunkSize) {
    const sentences = text.split(/[。！？.!?]/);
    const chunks = [];
    let currentChunk = '';

    for (const sentence of sentences) {
      if (currentChunk.length + sentence.length > chunkSize && currentChunk) {
        chunks.push(currentChunk.trim());
        currentChunk = sentence;
      } else {
        currentChunk += sentence + '。';
      }
    }

    if (currentChunk.trim()) {
      chunks.push(currentChunk.trim());
    }

    return chunks;
  }

  // 生成知识点键
  generateKnowledgeKey(knowledgePoint) {
    return `${knowledgePoint.type}_${knowledgePoint.section}_${Date.now()}`;
  }

  // 更新用户知识库
  updateUserKnowledge(userId, processedDoc) {
    if (!this.documentKnowledge.has(userId)) {
      this.documentKnowledge.set(userId, []);
    }
    
    this.documentKnowledge.get(userId).push(processedDoc);
  }

  // 智能搜索
  async intelligentSearch(query, userId) {
    console.log('🔍 执行智能搜索:', query);
    
    const userDocs = this.documentKnowledge.get(userId) || [];
    if (userDocs.length === 0) {
      return { results: [], message: '请先上传文档' };
    }

    const results = [];
    
    for (const doc of userDocs) {
      // 1. 检查直接问答匹配
      const qaMatches = this.searchQAPairs(query, doc.qaPairs);
      results.push(...qaMatches);
      
      // 2. 检查知识点匹配
      const knowledgeMatches = this.searchKnowledgePoints(query, doc.knowledgePoints);
      results.push(...knowledgeMatches);
      
      // 3. 检查内容匹配
      const contentMatches = this.searchContent(query, doc);
      results.push(...contentMatches);
    }

    // 按相关性排序
    results.sort((a, b) => b.score - a.score);
    
    return {
      results: results.slice(0, 10),
      totalFound: results.length
    };
  }

  // 搜索问答对
  searchQAPairs(query, qaPairs) {
    const results = [];
    const queryLower = query.toLowerCase();
    
    for (const qa of qaPairs) {
      const questionLower = qa.question.toLowerCase();
      let score = 0;
      
      // 计算相似度
      if (questionLower.includes(queryLower) || queryLower.includes(questionLower)) {
        score = 0.9;
      } else {
        // 检查关键词匹配
        const queryWords = queryLower.split(/\s+/);
        const questionWords = questionLower.split(/\s+/);
        const matchCount = queryWords.filter(word => 
          questionWords.some(qw => qw.includes(word) || word.includes(qw))
        ).length;
        score = matchCount / queryWords.length * 0.7;
      }
      
      if (score > 0.3) {
        results.push({
          type: 'qa_pair',
          question: qa.question,
          answer: qa.answer,
          score,
          source: qa.source
        });
      }
    }
    
    return results;
  }

  // 搜索知识点
  searchKnowledgePoints(query, knowledgePoints) {
    const results = [];
    const queryLower = query.toLowerCase();
    
    for (const kp of knowledgePoints) {
      let score = 0;
      let matchedContent = '';
      
      switch (kp.type) {
        case 'definition':
          if (queryLower.includes(kp.term.toLowerCase()) || 
              kp.term.toLowerCase().includes(queryLower)) {
            score = 0.8;
            matchedContent = `${kp.term}是${kp.definition}`;
          }
          break;
          
        case 'procedure':
          if (queryLower.includes('怎么') || queryLower.includes('如何') || 
              queryLower.includes('步骤') || queryLower.includes('方法')) {
            const titleLower = kp.title.toLowerCase();
            if (this.hasCommonWords(queryLower, titleLower)) {
              score = 0.9;
              matchedContent = kp.steps.map((step, i) => 
                `${i + 1}. ${step.content}`
              ).join('\n');
            }
          }
          break;
          
        case 'feature':
          if (this.hasCommonWords(queryLower, kp.feature.toLowerCase())) {
            score = 0.6;
            matchedContent = `支持${kp.feature}功能`;
          }
          break;
      }
      
      if (score > 0.3) {
        results.push({
          type: 'knowledge_point',
          content: matchedContent,
          score,
          source: kp.section,
          knowledgeType: kp.type
        });
      }
    }
    
    return results;
  }

  // 搜索内容
  searchContent(query, doc) {
    const results = [];
    const queryLower = query.toLowerCase();
    
    for (const chunk of doc.semanticIndex.chunks) {
      const chunkLower = chunk.toLowerCase();
      if (chunkLower.includes(queryLower)) {
        const score = this.calculateContentScore(queryLower, chunkLower);
        if (score > 0.2) {
          results.push({
            type: 'content',
            content: chunk,
            score,
            source: doc.title
          });
        }
      }
    }
    
    return results;
  }

  // 检查共同词汇
  hasCommonWords(text1, text2) {
    const words1 = text1.split(/\s+/).filter(w => w.length > 1);
    const words2 = text2.split(/\s+/).filter(w => w.length > 1);
    
    const commonWords = words1.filter(w1 => 
      words2.some(w2 => w1.includes(w2) || w2.includes(w1))
    );
    
    return commonWords.length > 0;
  }

  // 计算内容分数
  calculateContentScore(query, content) {
    const queryWords = query.split(/\s+/);
    let score = 0;
    
    for (const word of queryWords) {
      if (word.length > 1) {
        const matches = (content.match(new RegExp(word, 'gi')) || []).length;
        score += matches * 0.1;
      }
    }
    
    return Math.min(score, 1);
  }

  // 获取用户文档
  getUserDocuments(userId) {
    return this.documentKnowledge.get(userId) || [];
  }
}

// 导出单例
const intelligentDocumentProcessor = new IntelligentDocumentProcessor();
export default intelligentDocumentProcessor;
