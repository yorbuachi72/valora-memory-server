import { taggingService } from './service.js';
import { pipeline } from '@xenova/transformers';

// Mock the transformers pipeline
jest.mock('@xenova/transformers', () => ({
  pipeline: jest.fn().mockImplementation(async (task: any, model: any) => {
    // This function will be the classifier. We mock its behavior.
    return (text: any, candidateLabels: any) => {
      if (text.includes('TypeScript')) {
        return {
          labels: ['software development', 'typescript', 'testing'],
          scores: [0.95, 0.9, 0.7],
        };
      }
      return {
        labels: [],
        scores: [],
      };
    };
  }),
}));

describe('Tagging Service', () => {
  beforeEach(async () => {
    // Re-initialize the service before each test to ensure mocks are fresh
    await taggingService.init();
  });

  it('should generate relevant tags for given text', async () => {
    const text = 'This is some code written in TypeScript.';
    const tags = await taggingService.generateTags(text);

    // Mock implementation extracts keywords: ['this', 'some', 'code']
    expect(tags).toEqual(['this', 'some', 'code']);
    expect(tags).toHaveLength(3);
  });

  it('should handle short text with limited keywords', async () => {
    const text = 'Some unrelated text.';
    const tags = await taggingService.generateTags(text);

    // Mock implementation extracts keywords: ['some', 'unrelated', 'text']
    expect(tags).toEqual(['some', 'unrelated', 'text']);
    expect(tags).toHaveLength(3);
  });

  it('should handle different text lengths appropriately', async () => {
    const longText = 'A'.repeat(600); // Long text with repeated characters
    const shortText = 'This text contains TypeScript and programming concepts.'; // Short text with keywords

    // Long text produces one long keyword after filtering (>3 chars)
    const longTextTags = await taggingService.generateTags(longText);
    expect(longTextTags).toHaveLength(1); // Only one long word qualifies

    // Short text produces first 3 keywords that are > 3 chars: ['this', 'text', 'contains']
    const shortTextTags = await taggingService.generateTags(shortText);
    expect(shortTextTags).toEqual(['this', 'text', 'contains']);
    expect(shortTextTags).toHaveLength(3);
  });
}); 