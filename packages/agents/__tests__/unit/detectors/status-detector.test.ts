/**
 * Unit tests for LLM Status Detector
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { LLMStatusDetector } from '../../../src/detectors/status-detector';
import { ClientStatus } from '@soul-kg-crm/database';
import type { ILLMProvider } from '../../../src/providers';
import type { PromptLoader } from '../../../src/prompt-manager';
import type { ExtractedMessage } from '@soul-kg-crm/data-import';

describe('LLMStatusDetector', () => {
  let mockLLMProvider: ILLMProvider;
  let mockPromptLoader: PromptLoader;
  let detector: LLMStatusDetector;

  beforeEach(() => {
    mockLLMProvider = {
      complete: vi.fn(),
      isAvailable: vi.fn().mockResolvedValue(true),
    } as unknown as ILLMProvider;

    mockPromptLoader = {
      loadPrompt: vi.fn(),
    } as unknown as PromptLoader;

    detector = new LLMStatusDetector(mockLLMProvider, mockPromptLoader);
  });

  describe('detectStatus', () => {
    it('should detect status from LLM response', async () => {
      const mockPrompt = {
        id: 'prompt-123',
        organizationId: 'org-123',
        agentType: 'STATUS_DETECTION' as any,
        name: 'default',
        prompt: 'Test prompt',
        settings: { model: 'gpt-4o-mini', temperature: 0.3 },
        updatedAt: new Date(),
      };

      const mockLLMResponse = {
        content: JSON.stringify({
          status: 'QUALIFIED',
          confidence: 0.9,
          reasoning: 'Client asked about dates and prices',
        }),
        model: 'gpt-4o-mini',
      };

      vi.mocked(mockPromptLoader.loadPrompt).mockResolvedValue(mockPrompt as any);
      vi.mocked(mockLLMProvider.complete).mockResolvedValue(mockLLMResponse);

      const messages: ExtractedMessage[] = [
        {
          id: 'msg-1',
          content: 'When can we go?',
          timestamp: new Date(),
          fromMe: false,
          type: 'text',
        },
      ];

      const result = await detector.detectStatus({
        organizationId: 'org-123',
        messages,
        firstMessageDate: new Date(),
        lastMessageDate: new Date(),
        language: 'en',
      });

      expect(result.status).toBe(ClientStatus.QUALIFIED);
      expect(result.confidence).toBeGreaterThan(0);
    });

    it('should handle invalid JSON response with fallback', async () => {
      const mockPrompt = {
        id: 'prompt-123',
        organizationId: 'org-123',
        agentType: 'STATUS_DETECTION' as any,
        name: 'default',
        prompt: 'Test prompt',
        settings: {},
        updatedAt: new Date(),
      };

      const mockLLMResponse = {
        content: 'This is not JSON',
        model: 'gpt-4o-mini',
      };

      vi.mocked(mockPromptLoader.loadPrompt).mockResolvedValue(mockPrompt as any);
      vi.mocked(mockLLMProvider.complete).mockResolvedValue(mockLLMResponse);

      const messages: ExtractedMessage[] = [
        {
          id: 'msg-1',
          content: 'Hello',
          timestamp: new Date(),
          fromMe: false,
          type: 'text',
        },
      ];

      const result = await detector.detectStatus({
        organizationId: 'org-123',
        messages,
        firstMessageDate: new Date(),
        lastMessageDate: new Date(),
      });

      // Should fallback to NEW_LEAD
      expect(result.status).toBe(ClientStatus.NEW_LEAD);
      expect(result.confidence).toBeLessThanOrEqual(0.5);
    });

    it('should parse status from JSON response', async () => {
      const mockPrompt = {
        id: 'prompt-123',
        organizationId: 'org-123',
        agentType: 'STATUS_DETECTION' as any,
        name: 'default',
        prompt: 'Test prompt',
        settings: {},
        updatedAt: new Date(),
      };

      const mockLLMResponse = {
        content: `{
          "status": "SOLD",
          "confidence": 0.95,
          "reasoning": "Payment confirmed"
        }`,
        model: 'gpt-4o-mini',
      };

      vi.mocked(mockPromptLoader.loadPrompt).mockResolvedValue(mockPrompt as any);
      vi.mocked(mockLLMProvider.complete).mockResolvedValue(mockLLMResponse);

      const messages: ExtractedMessage[] = [
        {
          id: 'msg-1',
          content: 'I paid for the tour',
          timestamp: new Date(),
          fromMe: false,
          type: 'text',
        },
      ];

      const result = await detector.detectStatus({
        organizationId: 'org-123',
        messages,
        firstMessageDate: new Date(),
        lastMessageDate: new Date(),
      });

      expect(result.status).toBe(ClientStatus.SOLD);
      expect(result.confidence).toBe(0.95);
      expect(result.reasoning).toBe('Payment confirmed');
    });
  });
});

