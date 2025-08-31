#!/usr/bin/env ts-node
/**
 * Migration script to move from lowdb (JSON file) to PostgreSQL
 *
 * Usage:
 *   npx ts-node scripts/migrate-to-postgres.ts
 *
 * Prerequisites:
 *   1. PostgreSQL database must be set up and accessible
 *   2. Database schema must be created (see database/schema.sql)
 *   3. Environment variables must be configured:
 *      - DB_HOST, DB_PORT, DB_NAME, DB_USER, DB_PASSWORD
 *      - VALORA_SECRET_KEY (for decrypting existing data)
 */

import * as fs from 'fs/promises';
import * as path from 'path';
import * as os from 'os';
import { Low } from 'lowdb';
import { z } from 'zod';
import { createStorageService } from '../src/database/storage.service.js';
import { createVectorSearchService } from '../src/database/vector.service.js';
import { encrypt, decrypt } from '../src/utils/encryption.js';

// Legacy memory schema (from lowdb)
const LegacyMemorySchema = z.object({
  id: z.string().uuid(),
  content: z.string(),
  timestamp: z.coerce.date(),
  version: z.number(),
  tags: z.array(z.string()),
  inferredTags: z.array(z.string()).optional(),
  metadata: z.record(z.any()),
  source: z.string(),
  contentType: z.enum(['chat', 'code', 'documentation', 'note']).optional(),
  conversationId: z.string().optional(),
  participant: z.string().optional(),
  context: z.string().optional(),
});

const LegacyDbSchema = z.object({
  memories: z.array(LegacyMemorySchema),
});

type LegacyMemory = z.infer<typeof LegacyMemorySchema>;
type LegacyDbData = z.infer<typeof LegacyDbSchema>;

// Migration statistics
interface MigrationStats {
  totalMemories: number;
  migratedMemories: number;
  failedMemories: number;
  skippedMemories: number;
  errors: string[];
}

class DatabaseMigrator {
  private legacyDbPath: string;
  private encryptionKey: string;
  private storageService: any;
  private vectorService: any;
  private stats: MigrationStats;

  constructor() {
    this.legacyDbPath = path.join(os.homedir(), '.valora', 'db.json');
    this.encryptionKey = process.env.VALORA_SECRET_KEY || '';
    this.storageService = createStorageService();
    this.vectorService = createVectorSearchService();
    this.stats = {
      totalMemories: 0,
      migratedMemories: 0,
      failedMemories: 0,
      skippedMemories: 0,
      errors: [],
    };
  }

  async validatePrerequisites(): Promise<void> {
    console.log('🔍 Validating migration prerequisites...');

    // Check if legacy database exists
    try {
      await fs.access(this.legacyDbPath);
      console.log('✅ Legacy database file found');
    } catch {
      throw new Error(`Legacy database file not found at: ${this.legacyDbPath}`);
    }

    // Check encryption key
    if (!this.encryptionKey) {
      throw new Error('VALORA_SECRET_KEY environment variable is required');
    }

    // Check PostgreSQL connection
    try {
      await this.storageService.init();
      console.log('✅ PostgreSQL connection established');
    } catch (error) {
      throw new Error(`PostgreSQL connection failed: ${error.message}`);
    }
  }

  async loadLegacyData(): Promise<LegacyMemory[]> {
    console.log('📖 Loading legacy database...');

    // Read and decrypt the legacy database
    const encryptedData = await fs.readFile(this.legacyDbPath, 'utf-8');
    const decryptedData = decrypt(encryptedData, this.encryptionKey);
    const rawData = JSON.parse(decryptedData);

    // Validate the data structure
    const validatedData = LegacyDbSchema.parse(rawData);

    console.log(`✅ Loaded ${validatedData.memories.length} memories from legacy database`);
    return validatedData.memories;
  }

  async migrateMemories(legacyMemories: LegacyMemory[]): Promise<void> {
    console.log('🚀 Starting memory migration...');

    this.stats.totalMemories = legacyMemories.length;

    // Process memories in batches to avoid overwhelming the database
    const batchSize = 10;

    for (let i = 0; i < legacyMemories.length; i += batchSize) {
      const batch = legacyMemories.slice(i, i + batchSize);
      console.log(`Processing batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(legacyMemories.length / batchSize)}`);

      await this.processBatch(batch);
    }

    console.log('✅ Memory migration completed');
  }

  private async processBatch(memories: LegacyMemory[]): Promise<void> {
    const processedMemories = memories.map(memory => ({
      ...memory,
      userId: 'migrated-user', // Default user for migrated data
    }));

    try {
      // Save memories to PostgreSQL
      await this.storageService.saveMemoriesBatch(processedMemories);

      // Generate and store embeddings
      const memoryIds = processedMemories.map(m => m.id);
      await this.vectorService.processEmbeddingsBatch(memoryIds);

      this.stats.migratedMemories += memories.length;
      console.log(`✅ Migrated ${memories.length} memories`);
    } catch (error) {
      this.stats.failedMemories += memories.length;
      this.stats.errors.push(`Batch migration failed: ${error.message}`);
      console.error(`❌ Failed to migrate batch: ${error.message}`);
    }
  }

  async validateMigration(): Promise<void> {
    console.log('🔍 Validating migration...');

    // Get counts from both systems
    const legacyMemories = await this.loadLegacyData();
    const postgresStats = await this.storageService.getMemoryStats();

    console.log(`Legacy memories: ${legacyMemories.length}`);
    console.log(`PostgreSQL memories: ${postgresStats.totalMemories}`);

    if (postgresStats.totalMemories !== legacyMemories.length) {
      console.warn('⚠️  Memory count mismatch detected');
    } else {
      console.log('✅ Memory counts match');
    }
  }

  async cleanup(): Promise<void> {
    console.log('🧹 Migration cleanup...');

    // Create backup of legacy database
    const backupPath = `${this.legacyDbPath}.backup.${Date.now()}`;
    await fs.copyFile(this.legacyDbPath, backupPath);
    console.log(`✅ Legacy database backed up to: ${backupPath}`);

    // Optionally remove legacy database (commented out for safety)
    // await fs.unlink(this.legacyDbPath);
    // console.log('✅ Legacy database removed');
  }

  printReport(): void {
    console.log('\n📊 MIGRATION REPORT');
    console.log('==================');
    console.log(`Total memories: ${this.stats.totalMemories}`);
    console.log(`Successfully migrated: ${this.stats.migratedMemories}`);
    console.log(`Failed: ${this.stats.failedMemories}`);
    console.log(`Skipped: ${this.stats.skippedMemories}`);

    if (this.stats.errors.length > 0) {
      console.log('\n❌ ERRORS:');
      this.stats.errors.forEach(error => console.log(`  - ${error}`));
    }

    const successRate = this.stats.totalMemories > 0
      ? (this.stats.migratedMemories / this.stats.totalMemories) * 100
      : 0;

    console.log(`\nSuccess rate: ${successRate.toFixed(1)}%`);

    if (successRate === 100) {
      console.log('🎉 Migration completed successfully!');
    } else if (successRate >= 95) {
      console.log('⚠️  Migration completed with minor issues');
    } else {
      console.log('❌ Migration completed with significant issues');
    }
  }

  async runMigration(): Promise<void> {
    try {
      console.log('🚀 Starting Valora database migration');
      console.log('=====================================');

      // Step 1: Validate prerequisites
      await this.validatePrerequisites();

      // Step 2: Load legacy data
      const legacyMemories = await this.loadLegacyData();

      if (legacyMemories.length === 0) {
        console.log('ℹ️  No memories found in legacy database. Nothing to migrate.');
        return;
      }

      // Step 3: Migrate memories
      await this.migrateMemories(legacyMemories);

      // Step 4: Validate migration
      await this.validateMigration();

      // Step 5: Cleanup
      await this.cleanup();

      // Step 6: Print report
      this.printReport();

    } catch (error) {
      console.error('❌ Migration failed:', error);
      this.stats.errors.push(`Migration failed: ${error.message}`);
      this.printReport();
      process.exit(1);
    }
  }
}

// Main execution
async function main() {
  const migrator = new DatabaseMigrator();
  await migrator.runMigration();
}

// Handle command line execution
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(console.error);
}

export { DatabaseMigrator };
