import { describe, expect, it } from 'vitest';
import type {
  ExtractedCard,
  ProcessedImage,
  ScrapeResult,
  ScraperConfig,
  ScraperType,
  ScrapeSourceConfig,
  UploadResult,
} from '../types';

describe('types', () => {
  describe('ScraperType', () => {
    it('should allow valid scraper types', () => {
      const staticType: ScraperType = 'static';
      const llmType: ScraperType = 'llm';
      const apiType: ScraperType = 'api';

      expect(staticType).toBe('static');
      expect(llmType).toBe('llm');
      expect(apiType).toBe('api');
    });
  });

  describe('ScrapeSourceConfig', () => {
    it('should create valid config object', () => {
      const config: ScrapeSourceConfig = {
        id: 'test-source-1',
        name: 'Test Source',
        type: 'llm',
        baseUrl: 'https://example.com',
        category: 'Test Category',
        groupName: 'Test Group',
        isActive: true,
      };

      expect(config.id).toBe('test-source-1');
      expect(config.type).toBe('llm');
      expect(config.isActive).toBe(true);
    });

    it('should allow optional fields to be undefined', () => {
      const config: ScrapeSourceConfig = {
        id: 'test-source-2',
        name: 'Minimal Source',
        type: 'static',
        baseUrl: 'https://example.com',
        isActive: false,
      };

      expect(config.category).toBeUndefined();
      expect(config.groupName).toBeUndefined();
      expect(config.config).toBeUndefined();
    });
  });

  describe('ScraperConfig', () => {
    it('should create valid static scraper config', () => {
      const config: ScraperConfig = {
        selectors: {
          cardList: '.cards',
          cardName: '.card-name',
          cardImage: '.card-image img',
        },
        rateLimit: 1000,
        maxPages: 10,
      };

      expect(config.selectors?.cardList).toBe('.cards');
      expect(config.rateLimit).toBe(1000);
    });

    it('should create valid LLM scraper config', () => {
      const config: ScraperConfig = {
        prompt: 'Extract card information from this page',
        rateLimit: 2000,
      };

      expect(config.prompt).toBeDefined();
      expect(config.selectors).toBeUndefined();
    });

    it('should create valid API scraper config', () => {
      const config: ScraperConfig = {
        apiEndpoint: '/api/cards',
        apiKey: 'test-api-key',
      };

      expect(config.apiEndpoint).toBe('/api/cards');
      expect(config.apiKey).toBeDefined();
    });
  });

  describe('ExtractedCard', () => {
    it('should create valid extracted card', () => {
      const card: ExtractedCard = {
        name: 'Test Card',
        imageUrl: 'https://example.com/card.png',
        series: 'Test Series',
        memberName: 'Test Member',
        groupName: 'Test Group',
        rarity: 'SR',
        releaseDate: '2025-01-01',
        sourceUrl: 'https://example.com/source',
      };

      expect(card.name).toBe('Test Card');
      expect(card.imageUrl).toBe('https://example.com/card.png');
    });

    it('should allow minimal extracted card', () => {
      const card: ExtractedCard = {
        name: 'Minimal Card',
        imageUrl: 'https://example.com/minimal.png',
      };

      expect(card.name).toBe('Minimal Card');
      expect(card.series).toBeUndefined();
    });
  });

  describe('ScrapeResult', () => {
    it('should create valid success result', () => {
      const result: ScrapeResult = {
        sourceId: 'source-1',
        status: 'success',
        itemsFound: 10,
        itemsCreated: 5,
        itemsUpdated: 3,
        cards: [],
        startedAt: new Date(),
        finishedAt: new Date(),
      };

      expect(result.status).toBe('success');
      expect(result.errorMessage).toBeUndefined();
    });

    it('should create valid failed result', () => {
      const result: ScrapeResult = {
        sourceId: 'source-1',
        status: 'failed',
        itemsFound: 0,
        itemsCreated: 0,
        itemsUpdated: 0,
        cards: [],
        errorMessage: 'Connection timeout',
        startedAt: new Date(),
        finishedAt: new Date(),
      };

      expect(result.status).toBe('failed');
      expect(result.errorMessage).toBe('Connection timeout');
    });
  });

  describe('ProcessedImage', () => {
    it('should create valid processed image', () => {
      const image: ProcessedImage = {
        buffer: Buffer.from('image-data'),
        format: 'png',
        width: 800,
        height: 600,
        originalUrl: 'https://example.com/original.webp',
      };

      expect(image.format).toBe('png');
      expect(image.width).toBe(800);
    });
  });

  describe('UploadResult', () => {
    it('should create valid upload result', () => {
      const result: UploadResult = {
        key: 'cards/abc123.png',
        url: 'https://cdn.example.com/cards/abc123.png',
        size: 12345,
      };

      expect(result.key).toBe('cards/abc123.png');
      expect(result.size).toBe(12345);
    });
  });
});
