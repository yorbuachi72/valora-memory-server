import { Memory } from '../types/memory.js';
import fs from 'fs/promises';
import path from 'path';
import os from 'os';
import { Low } from 'lowdb';
import { z } from 'zod';
import { encrypt, decrypt } from '../utils/encryption.js';
import { retrievalService } from '../retrieval/service.js';
import { taggingService } from '../tagging/service.js';

const MemorySchema = z.object({
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

const DbSchema = z.object({
  memories: z.array(MemorySchema),
});

type DbData = z.infer<typeof DbSchema>;

const MEMORY_PATH = path.join(os.homedir(), '.valora');
const DB_FILE = path.join(MEMORY_PATH, 'db.json');

let db: Low<DbData>;
let encryptionKey: string;

class EncryptedFileAdapter {
  #file: string;
  #secret: string;

  constructor(file: string, secret: string) {
    this.#file = file;
    this.#secret = secret;
  }

  async read(): Promise<DbData | null> {
    try {
      const encryptedData = await fs.readFile(this.#file, 'utf-8');
      if (!encryptedData) return null;
      const decryptedData = decrypt(encryptedData, this.#secret);
      return JSON.parse(decryptedData) as DbData;
    } catch (e: any) {
      if (e.code === 'ENOENT') {
        return null;
      }
      // Provide a more specific error for decryption failures
      if (e.message.includes('Unsupported state or unable to authenticate data')) {
        console.error('FATAL: Decryption failed. The encryption key may be incorrect or the data corrupted.');
        process.exit(1);
      }
      throw e;
    }
  }

  async write(data: DbData): Promise<void> {
    const stringifiedData = JSON.stringify(data);
    const encryptedData = encrypt(stringifiedData, this.#secret);
    await fs.writeFile(this.#file, encryptedData);
  }
}

export const initMemoryContainer = async () => {
  encryptionKey = process.env.VALORA_SECRET_KEY as string;
  if (!encryptionKey) {
    console.error(
      'FATAL: VALORA_SECRET_KEY environment variable not set. This is required for encryption.'
    );
    process.exit(1);
  }

  await fs.mkdir(MEMORY_PATH, { recursive: true });

  const adapter = new EncryptedFileAdapter(DB_FILE, encryptionKey);
  db = new Low<DbData>(adapter, { memories: [] });

  await db.read();
  await db.write();

  await retrievalService.init();
  await taggingService.init();

  console.log(`🧠 Valora memory container initialized at ${DB_FILE}`);
};

export const saveMemory = async (memory: Memory): Promise<void> => {
  await db.read();
  memory.inferredTags = await taggingService.generateTags(memory.content);
  db.data?.memories.push(memory);
  await db.write();
  await retrievalService.addMemory(memory.id, memory.content);
};

export const getMemory = async (id: string): Promise<Memory | null> => {
  await db.read();
  const memory = db.data?.memories.find((m) => m.id === id);
  return memory || null;
};

export const searchMemories = async (query: string): Promise<Memory[]> => {
  await db.read();
  if (!db.data) return [];
  const lowerCaseQuery = query.toLowerCase();
  return db.data.memories.filter(
    (m) =>
      m.content.toLowerCase().includes(lowerCaseQuery) ||
      m.tags.some((t) => t.toLowerCase().includes(lowerCaseQuery)) ||
      m.inferredTags?.some((t) => t.toLowerCase().includes(lowerCaseQuery))
  );
};

export const updateMemory = async (
  id: string,
  updates: Partial<Memory>
): Promise<Memory | null> => {
  await db.read();
  const memoryIndex = db.data?.memories.findIndex((m) => m.id === id);

  if (db.data && memoryIndex !== -1 && db.data.memories) {
    const originalMemory = db.data.memories[memoryIndex];
    const updatedMemory = {
      ...originalMemory,
      ...updates,
      id: originalMemory.id, // Ensure ID is not changed
      timestamp: new Date(), // Update timestamp
      version: originalMemory.version + 1, // Increment version
    };

    if (updates.content) {
      updatedMemory.inferredTags = await taggingService.generateTags(
        updates.content
      );
    }

    db.data.memories[memoryIndex] = updatedMemory;
    await db.write();
    if (updates.content) {
      await retrievalService.updateMemory(updatedMemory.id, updatedMemory.content);
    }
    return updatedMemory;
  }
  return null;
};

export const deleteMemory = async (id: string): Promise<boolean> => {
  await db.read();
  const initialLength = db.data?.memories.length || 0;
  if (db.data) {
    db.data.memories = db.data.memories.filter((m) => m.id !== id);
    if (db.data.memories.length < initialLength) {
      await db.write();
      await retrievalService.deleteMemory(id);
      return true;
    }
  }
  return false;
};

// New functions for chat support
export const getMemoriesByConversation = async (conversationId: string): Promise<Memory[]> => {
  await db.read();
  if (!db.data) return [];
  
  return db.data.memories
    .filter(m => m.conversationId === conversationId)
    .sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());
};

export const searchMemoriesByType = async (contentType: string): Promise<Memory[]> => {
  await db.read();
  if (!db.data) return [];
  
  return db.data.memories.filter(m => m.contentType === contentType);
};

export const getConversationContext = async (conversationId: string): Promise<Memory[]> => {
  return getMemoriesByConversation(conversationId);
}; 