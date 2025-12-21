/**
 * Unit tests for Prompt Loader
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { PromptLoader } from '../../../src/prompt-manager/prompt-loader';
import { PrismaClient, AgentType } from '@soul-kg-crm/database';

// Mock Prisma
const mockPrisma = {
  agentConfiguration: {
    findFirst: vi.fn(),
  },
  promptVariant: {
    findFirst: vi.fn(),
  },
} as unknown as PrismaClient;

describe('PromptLoader', () => {
  let loader: PromptLoader;
  const organizationId = 'org-123';

  beforeEach(() => {
    vi.clearAllMocks();
    loader = new PromptLoader(mockPrisma);
  });

  describe('loadPrompt', () => {
    it('should load prompt from database', async () => {
      const mockConfig = {
        id: 'config-123',
        organizationId,
        agentType: AgentType.STATUS_DETECTION,
        name: 'default',
        prompt: 'Test prompt',
        settings: { model: 'gpt-4o-mini' },
        updatedAt: new Date(),
      };

      vi.mocked(mockPrisma.agentConfiguration.findFirst).mockResolvedValue(mockConfig as any);

      const prompt = await loader.loadPrompt({
        organizationId,
        agentType: AgentType.STATUS_DETECTION,
        name: 'default',
      });

      expect(prompt).toBeDefined();
      expect(prompt.prompt).toBe('Test prompt');
      expect(prompt.organizationId).toBe(organizationId);
    });

    it('should throw error if prompt not found', async () => {
      vi.mocked(mockPrisma.agentConfiguration.findFirst).mockResolvedValue(null);

      await expect(
        loader.loadPrompt({
          organizationId,
          agentType: AgentType.STATUS_DETECTION,
          name: 'nonexistent',
        })
      ).rejects.toThrow('Agent configuration not found');
    });

    it('should load prompt variant if variantId provided', async () => {
      const mockVariant = {
        id: 'variant-123',
        organizationId,
        agentType: AgentType.STATUS_DETECTION,
        name: 'variant-1',
        prompt: 'Variant prompt',
        updatedAt: new Date(),
      };

      vi.mocked(mockPrisma.promptVariant.findFirst).mockResolvedValue(mockVariant as any);

      const prompt = await loader.loadPrompt({
        organizationId,
        agentType: AgentType.STATUS_DETECTION,
        variantId: 'variant-123',
      });

      expect(prompt.prompt).toBe('Variant prompt');
    });
  });

  describe('clearCache', () => {
    it('should clear cache for organization', () => {
      // Cache clearing is tested through integration
      expect(() => loader.clearCache(organizationId)).not.toThrow();
    });
  });
});

