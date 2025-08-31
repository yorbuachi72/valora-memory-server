import { Memory } from '../types/memory.js';
import { ChatImportRequest } from '../types/memory.js';

export interface PluginCapabilities {
  memoryOperations: boolean;
  chatOperations: boolean;
  searchOperations: boolean;
  exportOperations: boolean;
}

export interface ValoraPlugin {
  name: string;
  version: string;
  description: string;
  capabilities: PluginCapabilities;
  
  initialize(): Promise<void>;
  onMemoryCreated(memory: Memory): Promise<void>;
  onMemoryUpdated(memory: Memory): Promise<void>;
  onMemoryDeleted(id: string): Promise<void>;
  onChatImported(conversation: ChatImportRequest): Promise<void>;
  
  getCapabilities(): PluginCapabilities;
}

export interface PluginConfig {
  enabled: boolean;
  settings: Record<string, any>;
}

export class PluginManager {
  private plugins: Map<string, ValoraPlugin> = new Map();
  private configs: Map<string, PluginConfig> = new Map();

  async registerPlugin(plugin: ValoraPlugin, config?: PluginConfig): Promise<void> {
    try {
      await plugin.initialize();
      this.plugins.set(plugin.name, plugin);
      this.configs.set(plugin.name, config || { enabled: true, settings: {} });
      console.log(`✅ Plugin registered: ${plugin.name} v${plugin.version}`);
    } catch (error) {
      console.error(`❌ Failed to register plugin ${plugin.name}:`, error);
      throw error;
    }
  }

  async notifyMemoryCreated(memory: Memory): Promise<void> {
    for (const [name, plugin] of this.plugins) {
      const config = this.configs.get(name);
      if (config?.enabled && plugin.capabilities.memoryOperations) {
        try {
          await plugin.onMemoryCreated(memory);
        } catch (error) {
          console.error(`Error in plugin ${name} onMemoryCreated:`, error);
        }
      }
    }
  }

  async notifyMemoryUpdated(memory: Memory): Promise<void> {
    for (const [name, plugin] of this.plugins) {
      const config = this.configs.get(name);
      if (config?.enabled && plugin.capabilities.memoryOperations) {
        try {
          await plugin.onMemoryUpdated(memory);
        } catch (error) {
          console.error(`Error in plugin ${name} onMemoryUpdated:`, error);
        }
      }
    }
  }

  async notifyMemoryDeleted(id: string): Promise<void> {
    for (const [name, plugin] of this.plugins) {
      const config = this.configs.get(name);
      if (config?.enabled && plugin.capabilities.memoryOperations) {
        try {
          await plugin.onMemoryDeleted(id);
        } catch (error) {
          console.error(`Error in plugin ${name} onMemoryDeleted:`, error);
        }
      }
    }
  }

  async notifyChatImported(conversation: ChatImportRequest): Promise<void> {
    for (const [name, plugin] of this.plugins) {
      const config = this.configs.get(name);
      if (config?.enabled && plugin.capabilities.chatOperations) {
        try {
          await plugin.onChatImported(conversation);
        } catch (error) {
          console.error(`Error in plugin ${name} onChatImported:`, error);
        }
      }
    }
  }

  getPlugins(): ValoraPlugin[] {
    return Array.from(this.plugins.values());
  }

  getPlugin(name: string): ValoraPlugin | undefined {
    return this.plugins.get(name);
  }

  isPluginEnabled(name: string): boolean {
    const config = this.configs.get(name);
    return config?.enabled || false;
  }

  async enablePlugin(name: string): Promise<void> {
    const config = this.configs.get(name);
    if (config) {
      config.enabled = true;
      console.log(`✅ Plugin enabled: ${name}`);
    }
  }

  async disablePlugin(name: string): Promise<void> {
    const config = this.configs.get(name);
    if (config) {
      config.enabled = false;
      console.log(`❌ Plugin disabled: ${name}`);
    }
  }
}

export const pluginManager = new PluginManager();
