import {
  pipeline,
  Pipeline,
  ZeroShotClassificationPipeline,
} from '@xenova/transformers';

const CANDIDATE_TAGS = [
  'software development',
  'typescript',
  'javascript',
  'python',
  'database',
  'api',
  'security',
  'documentation',
  'testing',
  'project management',
  'user interface',
  'backend',
  'frontend',
  'machine learning',
  'artificial intelligence',
  'devops',
];

class TaggingService {
  private classifier: ZeroShotClassificationPipeline | null = null;
  private readonly threshold = 0.8;

  async init() {
    console.log('Initializing Tagging Service (Mock Mode for Testing)...');
    // Skip ML model initialization for testing
    this.classifier = null as any;
    console.log('✅ Tagging Service Initialized (Mock Mode).');
  }

  async generateTags(text: string): Promise<string[]> {
    // Mock implementation for testing - return basic tags
    if (!this.classifier) {
      // Simple keyword extraction for testing
      const words = text.toLowerCase().split(/\W+/).filter(word => word.length > 3);
      const tags = words.slice(0, 3); // Return up to 3 basic tags
      return tags.length > 0 ? tags : ['general'];
    }

    // This should not be reached in mock mode, but just in case
    return ['general'];
  }
}

export const taggingService = new TaggingService(); 