import { Pool, PoolConfig } from 'pg';
import { z } from 'zod';

// Database configuration schema
const DatabaseConfigSchema = z.object({
  host: z.string().default('localhost'),
  port: z.number().default(5432),
  database: z.string().default('valora'),
  username: z.string().default('valora'),
  password: z.string().default(''),
  ssl: z.boolean().default(false),
  max: z.number().default(20), // Maximum number of clients in the pool
  min: z.number().default(2), // Minimum number of clients in the pool
  idleTimeoutMillis: z.number().default(30000), // Close idle clients after 30 seconds
  connectionTimeoutMillis: z.number().default(2000), // Return an error after 2 seconds if connection could not be established
  queryTimeoutMillis: z.number().default(10000), // Return an error after 10 seconds for queries
});

export type DatabaseConfig = z.infer<typeof DatabaseConfigSchema>;

class DatabaseManager {
  private pool: Pool | null = null;
  private config: DatabaseConfig;

  constructor() {
    this.config = this.loadConfig();
  }

  private loadConfig(): DatabaseConfig {
    const config: Partial<DatabaseConfig> = {
      host: process.env.DB_HOST || process.env.DATABASE_HOST,
      port: parseInt(process.env.DB_PORT || process.env.DATABASE_PORT || '5432'),
      database: process.env.DB_NAME || process.env.DATABASE_NAME || 'valora',
      username: process.env.DB_USER || process.env.DATABASE_USER || 'valora',
      password: process.env.DB_PASSWORD || process.env.DATABASE_PASSWORD || '',
      ssl: process.env.DB_SSL === 'true' || process.env.DATABASE_SSL === 'true',
      max: parseInt(process.env.DB_MAX_CONNECTIONS || '20'),
      min: parseInt(process.env.DB_MIN_CONNECTIONS || '2'),
      idleTimeoutMillis: parseInt(process.env.DB_IDLE_TIMEOUT || '30000'),
      connectionTimeoutMillis: parseInt(process.env.DB_CONNECTION_TIMEOUT || '2000'),
      queryTimeoutMillis: parseInt(process.env.DB_QUERY_TIMEOUT || '10000'),
    };

    return DatabaseConfigSchema.parse(config);
  }

  async connect(): Promise<Pool> {
    if (this.pool) {
      return this.pool;
    }

    const poolConfig: PoolConfig = {
      host: this.config.host,
      port: this.config.port,
      database: this.config.database,
      user: this.config.username,
      password: this.config.password,
      ssl: this.config.ssl,
      max: this.config.max,
      min: this.config.min,
      idleTimeoutMillis: this.config.idleTimeoutMillis,
      connectionTimeoutMillis: this.config.connectionTimeoutMillis,
      query_timeout: this.config.queryTimeoutMillis,
    };

    this.pool = new Pool(poolConfig);

    // Handle pool errors
    this.pool.on('error', (err) => {
      console.error('Unexpected error on idle client', err);
      process.exit(-1);
    });

    this.pool.on('connect', (client) => {
      console.log('✅ New database client connected');
    });

    // Test the connection
    try {
      const client = await this.pool.connect();
      console.log('✅ Database connection established successfully');
      client.release();
    } catch (error) {
      console.error('❌ Database connection failed:', error);
      throw error;
    }

    return this.pool;
  }

  async disconnect(): Promise<void> {
    if (this.pool) {
      await this.pool.end();
      this.pool = null;
      console.log('✅ Database connection closed');
    }
  }

  async healthCheck(): Promise<{
    status: 'healthy' | 'unhealthy';
    latency: number;
    connectionCount: number;
    config: Partial<DatabaseConfig>;
  }> {
    const startTime = Date.now();

    try {
      if (!this.pool) {
        throw new Error('Database pool not initialized');
      }

      const client = await this.pool.connect();
      await client.query('SELECT 1');
      client.release();

      const latency = Date.now() - startTime;

      return {
        status: 'healthy',
        latency,
        connectionCount: this.pool.totalCount,
        config: {
          host: this.config.host,
          port: this.config.port,
          database: this.config.database,
          username: this.config.username,
          max: this.config.max,
          min: this.config.min,
        },
      };
    } catch (error) {
      return {
        status: 'unhealthy',
        latency: Date.now() - startTime,
        connectionCount: this.pool?.totalCount || 0,
        config: {},
      };
    }
  }

  getPool(): Pool | null {
    return this.pool;
  }

  getConfig(): DatabaseConfig {
    return { ...this.config };
  }
}

// Global database manager instance
export const dbManager = new DatabaseManager();

// Helper function to get a database client
export const getDbClient = async () => {
  const pool = await dbManager.connect();
  return await pool.connect();
};

// Helper function to execute a query with automatic client management
export const executeQuery = async <T = any>(
  query: string,
  params: any[] = []
): Promise<T[]> => {
  const client = await getDbClient();

  try {
    const result = await client.query(query, params);
    return result.rows;
  } finally {
    client.release();
  }
};

// Helper function to execute a single query
export const executeQuerySingle = async <T = any>(
  query: string,
  params: any[] = []
): Promise<T | null> => {
  const rows = await executeQuery<T>(query, params);
  return rows.length > 0 ? rows[0] : null;
};

// Transaction helper
export const executeTransaction = async <T>(
  callback: (client: any) => Promise<T>
): Promise<T> => {
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
};
