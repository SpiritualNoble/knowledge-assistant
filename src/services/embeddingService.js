// 本地嵌入模型服务
// 使用 all-MiniLM-L6-v2 + ONNX.js 实现客户端向量化

import * as ort from 'onnxruntime-web';

class EmbeddingService {
  constructor() {
    this.session = null;
    this.tokenizer = null;
    this.modelLoaded = false;
    this.modelUrl = '/models/all-MiniLM-L6-v2-quantized.onnx';
    this.tokenizerUrl = '/models/tokenizer.json';
  }

  // 初始化模型
  async init() {
    if (this.modelLoaded) return;

    try {
      console.log('Loading embedding model...');
      
      // 配置ONNX运行时
      ort.env.wasm.wasmPaths = '/onnx-wasm/';
      ort.env.wasm.numThreads = navigator.hardwareConcurrency || 4;
      
      // 加载模型和分词器
      await Promise.all([
        this.loadModel(),
        this.loadTokenizer()
      ]);
      
      this.modelLoaded = true;
      console.log('Embedding model loaded successfully');
    } catch (error) {
      console.error('Failed to load embedding model:', error);
      throw error;
    }
  }

  // 加载ONNX模型
  async loadModel() {
    try {
      this.session = await ort.InferenceSession.create(this.modelUrl, {
        executionProviders: ['wasm'],
        graphOptimizationLevel: 'all'
      });
    } catch (error) {
      console.warn('Failed to load ONNX model, using fallback');
      this.session = null;
    }
  }

  // 加载分词器
  async loadTokenizer() {
    try {
      const response = await fetch(this.tokenizerUrl);
      this.tokenizer = await response.json();
    } catch (error) {
      console.warn('Failed to load tokenizer, using simple tokenization');
      this.tokenizer = null;
    }
  }

  // 文本分词
  tokenize(text, maxLength = 512) {
    if (this.tokenizer) {
      return this.advancedTokenize(text, maxLength);
    } else {
      return this.simpleTokenize(text, maxLength);
    }
  }

  // 高级分词（使用预训练分词器）
  advancedTokenize(text, maxLength) {
    // 这里应该实现完整的BERT分词逻辑
    // 简化版本，实际应该使用transformers.js或类似库
    const vocab = this.tokenizer.vocab || {};
    const tokens = [];
    const words = text.toLowerCase().split(/\s+/);
    
    tokens.push(101); // [CLS] token
    
    for (const word of words) {
      if (tokens.length >= maxLength - 1) break;
      
      const tokenId = vocab[word] || vocab['[UNK]'] || 100;
      tokens.push(tokenId);
    }
    
    tokens.push(102); // [SEP] token
    
    // 填充到固定长度
    while (tokens.length < maxLength) {
      tokens.push(0); // [PAD] token
    }
    
    return tokens.slice(0, maxLength);
  }

  // 简单分词（备用方案）
  simpleTokenize(text, maxLength) {
    // 简单的字符级分词
    const chars = text.toLowerCase().split('');
    const tokens = chars.map(char => char.charCodeAt(0)).slice(0, maxLength - 2);
    
    // 添加特殊标记
    return [101, ...tokens, 102, ...Array(maxLength - tokens.length - 2).fill(0)];
  }

  // 生成文本嵌入向量
  async embed(text) {
    if (!this.modelLoaded) {
      await this.init();
    }

    if (!this.session) {
      // 模型不可用，使用简单的哈希向量
      return this.generateHashVector(text);
    }

    try {
      // 分词
      const tokens = this.tokenize(text);
      const inputIds = new ort.Tensor('int64', BigInt64Array.from(tokens.map(t => BigInt(t))), [1, tokens.length]);
      const attentionMask = new ort.Tensor('int64', BigInt64Array.from(tokens.map(t => t > 0 ? 1n : 0n)), [1, tokens.length]);
      
      // 推理
      const feeds = {
        input_ids: inputIds,
        attention_mask: attentionMask
      };
      
      const results = await this.session.run(feeds);
      const embeddings = results.last_hidden_state.data;
      
      // 平均池化
      const embedding = this.meanPooling(embeddings, attentionMask.data, tokens.length);
      
      // 归一化
      return this.normalize(embedding);
    } catch (error) {
      console.warn('ONNX inference failed, using hash vector:', error);
      return this.generateHashVector(text);
    }
  }

  // 平均池化
  meanPooling(embeddings, attentionMask, seqLength, hiddenSize = 384) {
    const pooled = new Array(hiddenSize).fill(0);
    let validTokens = 0;
    
    for (let i = 0; i < seqLength; i++) {
      if (attentionMask[i] > 0) {
        validTokens++;
        for (let j = 0; j < hiddenSize; j++) {
          pooled[j] += embeddings[i * hiddenSize + j];
        }
      }
    }
    
    return pooled.map(val => val / validTokens);
  }

  // 向量归一化
  normalize(vector) {
    const norm = Math.sqrt(vector.reduce((sum, val) => sum + val * val, 0));
    return vector.map(val => val / norm);
  }

  // 生成哈希向量（备用方案）
  generateHashVector(text, dimensions = 384) {
    const vector = new Array(dimensions);
    const hash = this.simpleHash(text);
    
    // 使用文本哈希作为种子生成伪随机向量
    let seed = hash;
    for (let i = 0; i < dimensions; i++) {
      seed = (seed * 9301 + 49297) % 233280;
      vector[i] = (seed / 233280) * 2 - 1; // 归一化到[-1, 1]
    }
    
    return this.normalize(vector);
  }

  // 简单哈希函数
  simpleHash(str) {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // 转换为32位整数
    }
    return Math.abs(hash);
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
    
    return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
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
  kMeansClustering(documents, k, maxIterations = 100) {
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
        let bestDistance = Infinity;
        
        for (let i = 0; i < k; i++) {
          const distance = 1 - this.cosineSimilarity(doc.embedding, centroids[i]);
          if (distance < bestDistance) {
            bestDistance = distance;
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
        if (similarity < 0.99) {
          converged = false;
          break;
        }
      }
      
      centroids = newCentroids;
      iteration++;
    }
    
    return clusters.filter(cluster => cluster.length > 0);
  }
}

// 导出单例
const embeddingService = new EmbeddingService();
export default embeddingService;
