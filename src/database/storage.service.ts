import { Memory } from '../types/memory.js';
import { dbManager, executeQuery, executeQuerySingle, executeTransaction } from './config.js';
import { v4 as uuidv4 } from 'uuid';

// PostgreSQL-based storage service
export class PostgreSQLStorageService {
  private tenantId: string;

  constructor(tenantId: string = 'default-tenant-id') {
    this.tenantId = tenantId;
  }

  async init(): Promise<void> {
    await dbManager.connect();
    console.log('✅ PostgreSQL storage service initialized');
  }

  async saveMemory(memory: Memory): Promise<void> {
    const query = `
      INSERT INTO memories (
        id, tenant_id, user_id, content, content_type, source,
        tags, inferred_tags, metadata, conversation_id,
        participant, context, version
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
    `;

    const params = [
      memory.id,
      this.tenantId,
      'default-user-id', // Default user for MVP
      memory.content,
      memory.contentType || 'note',
      memory.source,
      memory.tags || [],
      memory.inferredTags || [],
      memory.metadata || {},
      memory.conversationId || null,
      memory.participant || null,
      memory.context || null,
      memory.version || 1,
    ];

    await executeQuery(query, params);
  }

  async getMemory(id: string): Promise<Memory | null> {
    const query = `
      SELECT * FROM memories
      WHERE id = $1 AND tenant_id = $2 AND is_deleted = false
    `;

    const memory = await executeQuerySingle<Memory>(query, [id, this.tenantId]);

    if (memory) {
      // Convert PostgreSQL timestamp to Date object
      // Use existing timestamp or current time
    }

    return memory;
  }

  async searchMemories(query: string): Promise<Memory[]> {
    const searchQuery = `
      SELECT * FROM memories
      WHERE tenant_id = $1
        AND is_deleted = false
        AND (
          content ILIKE $2
          OR EXISTS (SELECT 1 FROM unnest(tags) AS tag WHERE tag ILIKE $2)
          OR EXISTS (SELECT 1 FROM unnest(inferred_tags) AS inferred_tag WHERE inferred_tag ILIKE $2)
        )
      ORDER BY created_at DESC
      LIMIT 100
    `;

    const searchTerm = `%${query}%`;
    const memories = await executeQuery<Memory>(searchQuery, [this.tenantId, searchTerm]);

    // Convert timestamps
    return memories.map(memory => ({
      ...memory,
      timestamp: memory.timestamp,
    }));
  }

  async updateMemory(id: string, updates: Partial<Memory>): Promise<Memory | null> {
    return await executeTransaction(async (client) => {
      // First, get the current memory
      const getQuery = 'SELECT * FROM memories WHERE id = $1 AND tenant_id = $2 AND is_deleted = false';
      const currentMemory = await client.query(getQuery, [id, this.tenantId]);

      if (currentMemory.rows.length === 0) {
        return null;
      }

      const existingMemory = currentMemory.rows[0];

      // Build update query dynamically
      const updateFields: string[] = [];
      const params: any[] = [];
      let paramIndex = 1;

      if (updates.content !== undefined) {
        updateFields.push(`content = $${paramIndex++}`);
        params.push(updates.content);
      }

      if (updates.tags !== undefined) {
        updateFields.push(`tags = $${paramIndex++}`);
        params.push(updates.tags);
      }

      if (updates.inferredTags !== undefined) {
        updateFields.push(`inferred_tags = $${paramIndex++}`);
        params.push(updates.inferredTags);
      }

      if (updates.metadata !== undefined) {
        updateFields.push(`metadata = $${paramIndex++}`);
        params.push(updates.metadata);
      }

      if (updates.source !== undefined) {
        updateFields.push(`source = $${paramIndex++}`);
        params.push(updates.source);
      }

      if (updates.contentType !== undefined) {
        updateFields.push(`content_type = $${paramIndex++}`);
        params.push(updates.contentType);
      }

      if (updates.conversationId !== undefined) {
        updateFields.push(`conversation_id = $${paramIndex++}`);
        params.push(updates.conversationId);
      }

      if (updates.participant !== undefined) {
        updateFields.push(`participant = $${paramIndex++}`);
        params.push(updates.participant);
      }

      if (updates.context !== undefined) {
        updateFields.push(`context = $${paramIndex++}`);
        params.push(updates.context);
      }

      if (updateFields.length === 0) {
        // No updates provided
        return {
          ...existingMemory,
          timestamp: new Date(existingMemory.created_at),
        };
      }

      // Add version increment and updated_at
      updateFields.push(`version = version + 1`);
      updateFields.push(`updated_at = NOW()`);

      // Add the ID and tenant_id parameters
      params.push(id, this.tenantId);

      const updateQuery = `
        UPDATE memories
        SET ${updateFields.join(', ')}
        WHERE id = $${paramIndex++} AND tenant_id = $${paramIndex}
        RETURNING *
      `;

      const result = await client.query(updateQuery, params);

      if (result.rows.length === 0) {
        return null;
      }

      return {
        ...result.rows[0],
        timestamp: new Date(result.rows[0].created_at),
      };
    });
  }

  async deleteMemory(id: string): Promise<boolean> {
    const query = `
      UPDATE memories
      SET is_deleted = true, updated_at = NOW()
      WHERE id = $1 AND tenant_id = $2 AND is_deleted = false
    `;

    const result = await executeQuery(query, [id, this.tenantId]);
    return result.length > 0;
  }

  async getMemoriesByConversation(conversationId: string): Promise<Memory[]> {
    const query = `
      SELECT * FROM memories
      WHERE conversation_id = $1 AND tenant_id = $2 AND is_deleted = false
      ORDER BY created_at ASC
    `;

    const memories = await executeQuery<Memory>(query, [conversationId, this.tenantId]);

    return memories.map(memory => ({
      ...memory,
      timestamp: memory.timestamp,
    }));
  }

  async searchMemoriesByType(contentType: string): Promise<Memory[]> {
    const query = `
      SELECT * FROM memories
      WHERE content_type = $1 AND tenant_id = $2 AND is_deleted = false
      ORDER BY created_at DESC
      LIMIT 100
    `;

    const memories = await executeQuery<Memory>(query, [contentType, this.tenantId]);

    return memories.map(memory => ({
      ...memory,
      timestamp: memory.timestamp,
    }));
  }

  async getConversationContext(conversationId: string): Promise<Memory[]> {
    return this.getMemoriesByConversation(conversationId);
  }

  // Advanced search methods
  async searchMemoriesAdvanced(options: {
    query?: string;
    tags?: string[];
    contentType?: string;
    source?: string;
    dateFrom?: Date;
    dateTo?: Date;
    limit?: number;
    offset?: number;
  }): Promise<Memory[]> {
    let query = `
      SELECT * FROM memories
      WHERE tenant_id = $1 AND is_deleted = false
    `;

    const params: any[] = [this.tenantId];
    let paramIndex = 2;

    if (options.query) {
      query += ` AND content ILIKE $${paramIndex++}`;
      params.push(`%${options.query}%`);
    }

    if (options.tags && options.tags.length > 0) {
      query += ` AND tags && $${paramIndex++}`;
      params.push(options.tags);
    }

    if (options.contentType) {
      query += ` AND content_type = $${paramIndex++}`;
      params.push(options.contentType);
    }

    if (options.source) {
      query += ` AND source = $${paramIndex++}`;
      params.push(options.source);
    }

    if (options.dateFrom) {
      query += ` AND created_at >= $${paramIndex++}`;
      params.push(options.dateFrom);
    }

    if (options.dateTo) {
      query += ` AND created_at <= $${paramIndex++}`;
      params.push(options.dateTo);
    }

    query += ` ORDER BY created_at DESC`;

    if (options.limit) {
      query += ` LIMIT $${paramIndex++}`;
      params.push(options.limit);
    }

    if (options.offset) {
      query += ` OFFSET $${paramIndex++}`;
      params.push(options.offset);
    }

    const memories = await executeQuery<Memory>(query, params);

    return memories.map(memory => ({
      ...memory,
      timestamp: memory.timestamp,
    }));
  }

  // Bulk operations
  async saveMemoriesBatch(memories: Memory[]): Promise<void> {
    if (memories.length === 0) return;

    await executeTransaction(async (client) => {
      for (const memory of memories) {
        const query = `
          INSERT INTO memories (
            id, tenant_id, user_id, content, content_type, source,
            tags, inferred_tags, metadata, conversation_id,
            participant, context, version
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
        `;

        const params = [
          memory.id,
          this.tenantId,
          'default-user-id',
          memory.content,
          memory.contentType || 'note',
          memory.source,
          memory.tags || [],
          memory.inferredTags || [],
          memory.metadata || {},
          memory.conversationId || null,
          memory.participant || null,
          memory.context || null,
          memory.version || 1,
        ];

        await client.query(query, params);
      }
    });
  }

  // Statistics and analytics
  async getMemoryStats(): Promise<{
    totalMemories: number;
    memoriesByType: Record<string, number>;
    memoriesBySource: Record<string, number>;
    recentActivity: number; // Last 24 hours
  }> {
    const totalQuery = 'SELECT COUNT(*) as count FROM memories WHERE tenant_id = $1 AND is_deleted = false';
    const typeQuery = 'SELECT content_type, COUNT(*) as count FROM memories WHERE tenant_id = $1 AND is_deleted = false GROUP BY content_type';
    const sourceQuery = 'SELECT source, COUNT(*) as count FROM memories WHERE tenant_id = $1 AND is_deleted = false GROUP BY source';
    const recentQuery = 'SELECT COUNT(*) as count FROM memories WHERE tenant_id = $1 AND is_deleted = false AND created_at >= NOW() - INTERVAL \'24 hours\'';

    const [totalResult, typeResults, sourceResults, recentResult] = await Promise.all([
      executeQuerySingle(totalQuery, [this.tenantId]),
      executeQuery(typeQuery, [this.tenantId]),
      executeQuery(sourceQuery, [this.tenantId]),
      executeQuerySingle(recentQuery, [this.tenantId]),
    ]);

    const memoriesByType: Record<string, number> = {};
    typeResults.forEach((row: any) => {
      memoriesByType[row.content_type] = parseInt(row.count);
    });

    const memoriesBySource: Record<string, number> = {};
    sourceResults.forEach((row: any) => {
      memoriesBySource[row.source] = parseInt(row.count);
    });

    return {
      totalMemories: parseInt(totalResult?.count || '0'),
      memoriesByType,
      memoriesBySource,
      recentActivity: parseInt(recentResult?.count || '0'),
    };
  }
}

// Factory function to create storage service
export const createStorageService = (tenantId?: string) => {
  return new PostgreSQLStorageService(tenantId);
};
