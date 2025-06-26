// 简化的嵌入模型服务
// 使用备用方案确保系统可用性

class EmbeddingService {
  constructor() {
    this.modelLoaded = false;
    this.useONNX = false; // 暂时禁用ONNX，使用备用方案
  }

  // 初始化模型
  async init() {
    if (this.modelLoaded) return;

    try {
      console.log('Initializing embedding service...');
      
      // 检查是否有ONNX模型文件
      const modelExists = await this.checkModelExists();
      
      if (modelExists && window.BigInt && window.BigInt64Array) {
        console.log('ONNX model available, but using fallback for compatibility');
        // 暂时使用备用方案确保兼容性
        this.useONNX = false;
      } else {
        console.log('Using fallback embedding method');
        this.useONNX = false;
      }
      
      this.modelLoaded = true;
      console.log('Embedding service initialized successfully');
    } catch (error) {
      console.warn('Embedding service init with fallback:', error);
      this.useONNX = false;
      this.modelLoaded = true;
    }
  }

  // 检查模型文件是否存在
  async checkModelExists() {
    try {
      const response = await fetch('/models/all-MiniLM-L6-v2-quantized.onnx', { method: 'HEAD' });
      return response.ok;
    } catch {
      return false;
    }
  }

  // 生成文本嵌入向量
  async embed(text) {
    if (!this.modelLoaded) {
      await this.init();
    }

    if (this.useONNX) {
      // ONNX推理（暂时禁用）
      return this.generateONNXEmbedding(text);
    } else {
      // 使用改进的哈希向量
      return this.generateEnhancedHashVector(text);
    }
  }

  // 改进的哈希向量生成
  generateEnhancedHashVector(text, dimensions = 384) {
    const cleanText = text.toLowerCase().trim();
    const words = cleanText.split(/\s+/);
    const vector = new Array(dimensions).fill(0);
    
    // 基于词汇的特征提取
    const features = this.extractTextFeatures(cleanText, words);
    
    // 使用多个哈希函数生成向量
    for (let i = 0; i < dimensions; i++) {
      let value = 0;
      
      // 字符级特征
      value += this.hashFunction(cleanText, i * 7 + 1) * 0.3;
      
      // 词汇级特征
      for (const word of words) {
        if (word.length > 2) { // 忽略停用词
          value += this.hashFunction(word, i * 11 + 3) * 0.4;
        }
      }
      
      // 语义特征
      value += features.avgWordLength * this.hashFunction('length', i) * 0.1;
      value += features.uniqueWords * this.hashFunction('unique', i) * 0.1;
      value += features.sentenceCount * this.hashFunction('sentences', i) * 0.1;
      
      vector[i] = Math.tanh(value); // 使用tanh激活函数
    }
    
    return this.normalize(vector);
  }

  // 提取文本特征
  extractTextFeatures(text, words) {
    return {
      length: text.length,
      wordCount: words.length,
      uniqueWords: new Set(words).size,
      avgWordLength: words.reduce((sum, word) => sum + word.length, 0) / words.length || 0,
      sentenceCount: text.split(/[.!?]+/).length,
      hasNumbers: /\d/.test(text),
      hasSpecialChars: /[!@#$%^&*(),.?":{}|<>]/.test(text)
    };
  }

  // 改进的哈希函数
  hashFunction(str, seed = 0) {
    let hash = seed;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // 转换为32位整数
    }
    return hash / 2147483647; // 归一化到[-1, 1]
  }

  // 向量归一化
  normalize(vector) {
    const norm = Math.sqrt(vector.reduce((sum, val) => sum + val * val, 0));
    if (norm === 0) return vector;
    return vector.map(val => val / norm);
  }

  // 计算余弦相似度
  cosineSimilarity(vecA, vecB) {
    if (vecA.length !== vecB.length) {
      throw new Error('Vectors must have the same length');
    }
    
    let dotProduct = 0;
    let normA = 0;
    let normB = 0;
    
    for (let i = 0; i < vecA.length; i++) {
      dotProduct += vecA[i] * vecB[i];
      normA += vecA[i] * vecA[i];
      normB += vecB[i] * vecB[i];
    }
    
    const denominator = Math.sqrt(normA) * Math.sqrt(normB);
    return denominator === 0 ? 0 : dotProduct / denominator;
  }

  // 批量嵌入
  async embedBatch(texts, batchSize = 8) {
    const embeddings = [];
    
    for (let i = 0; i < texts.length; i += batchSize) {
      const batch = texts.slice(i, i + batchSize);
      const batchEmbeddings = await Promise.all(
        batch.map(text => this.embed(text))
      );
      embeddings.push(...batchEmbeddings);
      
      // 避免阻塞UI
      if (i % (batchSize * 4) === 0) {
        await new Promise(resolve => setTimeout(resolve, 10));
      }
    }
    
    return embeddings;
  }

  // 语义搜索
  async semanticSearch(query, documents, topK = 10) {
    const queryEmbedding = await this.embed(query);
    const results = [];
    
    for (const doc of documents) {
      if (!doc.embedding) {
        // 如果文档没有嵌入向量，现场生成
        doc.embedding = await this.embed(doc.content || doc.title);
      }
      
      const similarity = this.cosineSimilarity(queryEmbedding, doc.embedding);
      results.push({
        ...doc,
        score: similarity
      });
    }
    
    return results
      .sort((a, b) => b.score - a.score)
      .slice(0, topK);
  }

  // 文档聚类
  async clusterDocuments(documents, numClusters = 5) {
    // 确保所有文档都有嵌入向量
    for (const doc of documents) {
      if (!doc.embedding) {
        doc.embedding = await this.embed(doc.content || doc.title);
      }
    }
    
    // 简单的K-means聚类
    return this.kMeansClustering(documents, numClusters);
  }

  // K-means聚类实现
  kMeansClustering(documents, k, maxIterations = 50) {
    if (documents.length < k) return [documents];
    
    const dimensions = documents[0].embedding.length;
    
    // 随机初始化聚类中心
    let centroids = [];
    for (let i = 0; i < k; i++) {
      const randomDoc = documents[Math.floor(Math.random() * documents.length)];
      centroids.push([...randomDoc.embedding]);
    }
    
    let clusters = [];
    let converged = false;
    let iteration = 0;
    
    while (!converged && iteration < maxIterations) {
      // 分配文档到最近的聚类中心
      clusters = Array(k).fill().map(() => []);
      
      for (const doc of documents) {
        let bestCluster = 0;
        let bestSimilarity = -1;
        
        for (let i = 0; i < k; i++) {
          const similarity = this.cosineSimilarity(doc.embedding, centroids[i]);
          if (similarity > bestSimilarity) {
            bestSimilarity = similarity;
            bestCluster = i;
          }
        }
        
        clusters[bestCluster].push(doc);
      }
      
      // 更新聚类中心
      const newCentroids = [];
      for (let i = 0; i < k; i++) {
        if (clusters[i].length === 0) {
          newCentroids.push(centroids[i]);
          continue;
        }
        
        const centroid = new Array(dimensions).fill(0);
        for (const doc of clusters[i]) {
          for (let j = 0; j < dimensions; j++) {
            centroid[j] += doc.embedding[j];
          }
        }
        
        for (let j = 0; j < dimensions; j++) {
          centroid[j] /= clusters[i].length;
        }
        
        newCentroids.push(this.normalize(centroid));
      }
      
      // 检查收敛
      converged = true;
      for (let i = 0; i < k; i++) {
        const similarity = this.cosineSimilarity(centroids[i], newCentroids[i]);
        if (similarity < 0.95) {
          converged = false;
          break;
        }
      }
      
      centroids = newCentroids;
      iteration++;
    }
    
    return clusters.filter(cluster => cluster.length > 0);
  }

  // 文本相似度（不使用向量）
  textSimilarity(text1, text2) {
    const words1 = new Set(text1.toLowerCase().split(/\s+/));
    const words2 = new Set(text2.toLowerCase().split(/\s+/));
    
    const intersection = new Set([...words1].filter(x => words2.has(x)));
    const union = new Set([...words1, ...words2]);
    
    return intersection.size / union.size; // Jaccard相似度
  }

  // 关键词提取
  extractKeywords(text, topK = 10) {
    const words = text.toLowerCase().match(/\b\w{3,}\b/g) || [];
    const wordCount = {};
    
    // 统计词频
    words.forEach(word => {
      wordCount[word] = (wordCount[word] || 0) + 1;
    });
    
    // 按频率排序
    const sortedWords = Object.entries(wordCount)
      .sort(([,a], [,b]) => b - a)
      .slice(0, topK)
      .map(([word]) => word);
    
    return sortedWords;
  }
}

// 导出单例
const embeddingService = new EmbeddingService();
export default embeddingService;
