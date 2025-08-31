import { executeQuery, executeQuerySingle } from './config.js';

// Vector search service for semantic similarity
export class VectorSearchService {
  private tenantId: string;

  constructor(tenantId: string = 'default-tenant-id') {
    this.tenantId = tenantId;
  }

  // Generate embedding for text (placeholder - would integrate with OpenAI or local model)
  async generateEmbedding(text: string): Promise<number[]> {
    // This is a placeholder implementation
    // In production, this would call an embedding service like OpenAI's text-embedding-ada-002
    // or a local model like sentence-transformers

    // For now, return a mock 384-dimensional vector
    // In a real implementation, you'd call:
    // const response = await openai.embeddings.create({
    //   model: 'text-embedding-ada-002',
    //   input: text,
    // });

    const embedding = new Array(384).fill(0).map(() => Math.random() * 2 - 1);
    return embedding;
  }

  // Store embedding for a memory
  async storeEmbedding(memoryId: string, embedding: number[]): Promise<void> {
    const query = `
      UPDATE memories
      SET embedding = $1::vector, updated_at = NOW()
      WHERE id = $2 AND tenant_id = $3
    `;

    // Convert embedding array to PostgreSQL vector format
    const vectorString = `[${embedding.join(',')}]`;

    await executeQuery(query, [vectorString, memoryId, this.tenantId]);
  }

  // Semantic search using vector similarity
  async semanticSearch(query: string, options: {
    limit?: number;
    threshold?: number;
    userId?: string;
  } = {}): Promise<Array<{
    id: string;
    content: string;
    similarity: number;
    tags: string[];
    inferredTags: string[];
    createdAt: Date;
  }>> {
    const { limit = 10, threshold = 0.7, userId } = options;

    // Generate embedding for the query
    const queryEmbedding = await this.generateEmbedding(query);
    const vectorString = `[${queryEmbedding.join(',')}]`;

    // Build the query
    let searchQuery = `
      SELECT
        id,
        content,
        tags,
        inferred_tags,
        created_at,
        1 - (embedding <=> $1::vector) as similarity
      FROM memories
      WHERE tenant_id = $2
        AND is_deleted = false
        AND embedding IS NOT NULL
    `;

    const params: any[] = [vectorString, this.tenantId];
    let paramIndex = 3;

    if (userId) {
      searchQuery += ` AND user_id = $${paramIndex++}`;
      params.push(userId);
    }

    searchQuery += `
      AND (1 - (embedding <=> $1::vector)) > $${paramIndex++}
      ORDER BY embedding <=> $1::vector
      LIMIT $${paramIndex}
    `;

    params.push(threshold, limit);

    const results = await executeQuery(searchQuery, params);

    return results.map((row: any) => ({
      id: row.id,
      content: row.content,
      similarity: parseFloat(row.similarity),
      tags: row.tags || [],
      inferredTags: row.inferred_tags || [],
      createdAt: new Date(row.created_at),
    }));
  }

  // Hybrid search combining semantic and keyword search
  async hybridSearch(query: string, options: {
    limit?: number;
    semanticWeight?: number;
    keywordWeight?: number;
    userId?: string;
  } = {}): Promise<Array<{
    id: string;
    content: string;
    score: number;
    semanticScore: number;
    keywordScore: number;
    tags: string[];
    inferredTags: string[];
    createdAt: Date;
  }>> {
    const {
      limit = 10,
      semanticWeight = 0.7,
      keywordWeight = 0.3,
      userId
    } = options;

    // Generate embedding for semantic search
    const queryEmbedding = await this.generateEmbedding(query);
    const vectorString = `[${queryEmbedding.join(',')}]`;

    // Build hybrid search query
    let searchQuery = `
      SELECT
        id,
        content,
        tags,
        inferred_tags,
        created_at,
        1 - (embedding <=> $1::vector) as semantic_score,
        CASE
          WHEN content ILIKE $2 THEN 1.0
          WHEN content ILIKE $3 THEN 0.8
          ELSE 0.0
        END as keyword_score
      FROM memories
      WHERE tenant_id = $4
        AND is_deleted = false
    `;

    const params: any[] = [
      vectorString,
      `%${query}%`, // Exact match
      `%${query.toLowerCase()}%`, // Case-insensitive match
      this.tenantId
    ];
    let paramIndex = 5;

    if (userId) {
      searchQuery += ` AND user_id = $${paramIndex++}`;
      params.push(userId);
    }

    searchQuery += `
      ORDER BY (
        (1 - (embedding <=> $1::vector)) * ${semanticWeight} +
        CASE
          WHEN content ILIKE $2 THEN 1.0 * ${keywordWeight}
          WHEN content ILIKE $3 THEN 0.8 * ${keywordWeight}
          ELSE 0.0
        END
      ) DESC
      LIMIT $${paramIndex}
    `;

    params.push(limit);

    const results = await executeQuery(searchQuery, params);

    return results.map((row: any) => ({
      id: row.id,
      content: row.content,
      score: parseFloat(row.semantic_score) * semanticWeight +
             parseFloat(row.keyword_score) * keywordWeight,
      semanticScore: parseFloat(row.semantic_score),
      keywordScore: parseFloat(row.keyword_score),
      tags: row.tags || [],
      inferredTags: row.inferred_tags || [],
      createdAt: new Date(row.created_at),
    }));
  }

  // Batch process embeddings for existing memories
  async processEmbeddingsBatch(memoryIds: string[]): Promise<void> {
    await executeTransaction(async (client) => {
      for (const memoryId of memoryIds) {
        // Get the memory content
        const getQuery = 'SELECT content FROM memories WHERE id = $1 AND tenant_id = $2';
        const memory = await client.query(getQuery, [memoryId, this.tenantId]);

        if (memory.rows.length === 0) continue;

        // Generate embedding
        const content = memory.rows[0].content;
        const embedding = await this.generateEmbedding(content);

        // Update the memory with the embedding
        const updateQuery = `
          UPDATE memories
          SET embedding = $1::vector, updated_at = NOW()
          WHERE id = $2 AND tenant_id = $3
        `;

        const vectorString = `[${embedding.join(',')}]`;
        await client.query(updateQuery, [vectorString, memoryId, this.tenantId]);
      }
    });
  }

  // Find similar memories
  async findSimilarMemories(memoryId: string, options: {
    limit?: number;
    threshold?: number;
  } = {}): Promise<Array<{
    id: string;
    content: string;
    similarity: number;
    tags: string[];
    inferredTags: string[];
  }>> {
    const { limit = 5, threshold = 0.8 } = options;

    // Get the embedding of the source memory
    const getEmbeddingQuery = 'SELECT embedding FROM memories WHERE id = $1 AND tenant_id = $2';
    const sourceMemory = await executeQuerySingle(getEmbeddingQuery, [memoryId, this.tenantId]);

    if (!sourceMemory?.embedding) {
      return [];
    }

    // Find similar memories
    const similarQuery = `
      SELECT
        id,
        content,
        tags,
        inferred_tags,
        1 - (embedding <=> $1::vector) as similarity
      FROM memories
      WHERE tenant_id = $2
        AND id != $3
        AND is_deleted = false
        AND embedding IS NOT NULL
        AND (1 - (embedding <=> $1::vector)) > $4
      ORDER BY embedding <=> $1::vector
      LIMIT $5
    `;

    const results = await executeQuery(similarQuery, [
      sourceMemory.embedding,
      this.tenantId,
      memoryId,
      threshold,
      limit
    ]);

    return results.map((row: any) => ({
      id: row.id,
      content: row.content,
      similarity: parseFloat(row.similarity),
      tags: row.tags || [],
      inferredTags: row.inferred_tags || [],
    }));
  }

  // Get embedding statistics
  async getEmbeddingStats(): Promise<{
    totalMemories: number;
    memoriesWithEmbeddings: number;
    averageSimilarity: number;
    embeddingCoverage: number;
  }> {
    const statsQuery = `
      SELECT
        COUNT(*) as total_memories,
        COUNT(CASE WHEN embedding IS NOT NULL THEN 1 END) as memories_with_embeddings,
        AVG(CASE WHEN embedding IS NOT NULL THEN 1 - (embedding <=> embedding) ELSE NULL END) as avg_similarity
      FROM memories
      WHERE tenant_id = $1 AND is_deleted = false
    `;

    const stats = await executeQuerySingle(statsQuery, [this.tenantId]);

    const totalMemories = parseInt(stats.total_memories || '0');
    const memoriesWithEmbeddings = parseInt(stats.memories_with_embeddings || '0');
    const embeddingCoverage = totalMemories > 0 ? (memoriesWithEmbeddings / totalMemories) * 100 : 0;

    return {
      totalMemories,
      memoriesWithEmbeddings,
      averageSimilarity: parseFloat(stats.avg_similarity || '0'),
      embeddingCoverage,
    };
  }
}

// Helper function for executing transactions
async function executeTransaction<T>(
  callback: (client: any) => Promise<T>
): Promise<T> {
  const { dbManager } = await import('./config.js');
  const pool = await dbManager.connect();
  const client = await pool.connect();

  try {
    await client.query('BEGIN');
    const result = await callback(client);
    await client.query('COMMIT');
    return result;
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}

// Factory function to create vector search service
export const createVectorSearchService = (tenantId?: string) => {
  return new VectorSearchService(tenantId);
};
