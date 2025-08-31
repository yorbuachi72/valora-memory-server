import fs from 'fs/promises';
import path from 'path';
import { saveMemory } from '../storage/container.js';
import { Memory } from '../types/memory.js';
import { randomUUID } from 'crypto';

export const crawlDirectory = async (
  dirPath: string,
  extensions: string[]
) => {
  const dirents = await fs.readdir(dirPath, { withFileTypes: true });

  for (const dirent of dirents) {
    const fullPath = path.join(dirPath, dirent.name);

    if (dirent.isDirectory()) {
      await crawlDirectory(fullPath, extensions);
    } else if (dirent.isFile() && extensions.includes(path.extname(dirent.name))) {
      const content = await fs.readFile(fullPath, 'utf-8');
      const newMemory: Memory = {
        id: randomUUID(),
        content,
        source: `file://${fullPath}`,
        timestamp: new Date(),
        version: 1,
        tags: ['file-ingestion', path.extname(dirent.name)],
        metadata: {
          filePath: fullPath,
          fileName: dirent.name,
        },
      };
      await saveMemory(newMemory);
      console.log(`📝 Ingested: ${fullPath}`);
    }
  }
}; 