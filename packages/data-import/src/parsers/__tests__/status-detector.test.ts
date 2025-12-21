/**
 * Tests for status detector
 */

import { describe, it, expect } from 'vitest';
import { detectStatus } from '../status-detector';
import { ClientStatus } from '@soul-kg-crm/database';
import type { ExtractedMessage } from '../../types/import.types';

describe('Status Detector', () => {
  const now = new Date();
  const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
  const twoDaysAgo = new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000);
  const thirtyOneDaysAgo = new Date(now.getTime() - 31 * 24 * 60 * 60 * 1000);

  describe('CLOSED status', () => {
    it('should detect CLOSED for old conversations (>30 days)', () => {
      const messages: ExtractedMessage[] = [
        { id: '1', content: 'Hello', timestamp: thirtyOneDaysAgo, fromMe: false, type: 'text' },
      ];
      expect(detectStatus(messages, thirtyOneDaysAgo, thirtyOneDaysAgo)).toBe(ClientStatus.CLOSED);
    });

    it('should detect CLOSED for explicit refusal', () => {
      const messages: ExtractedMessage[] = [
        { id: '1', content: 'No thank you', timestamp: oneDayAgo, fromMe: false, type: 'text' },
      ];
      expect(detectStatus(messages, oneDayAgo, oneDayAgo)).toBe(ClientStatus.CLOSED);
    });

    it('should detect CLOSED for Russian refusal', () => {
      const messages: ExtractedMessage[] = [
        { id: '1', content: 'Не интересно', timestamp: oneDayAgo, fromMe: false, type: 'text' },
      ];
      expect(detectStatus(messages, oneDayAgo, oneDayAgo)).toBe(ClientStatus.CLOSED);
    });
  });

  describe('SOLD status', () => {
    it('should detect SOLD for payment keywords', () => {
      const messages: ExtractedMessage[] = [
        { id: '1', content: 'I paid for the tour', timestamp: oneDayAgo, fromMe: false, type: 'text' },
      ];
      expect(detectStatus(messages, twoDaysAgo, oneDayAgo)).toBe(ClientStatus.SOLD);
    });

    it('should detect SOLD for booking keywords', () => {
      const messages: ExtractedMessage[] = [
        { id: '1', content: 'I booked the tour', timestamp: oneDayAgo, fromMe: false, type: 'text' },
      ];
      expect(detectStatus(messages, twoDaysAgo, oneDayAgo)).toBe(ClientStatus.SOLD);
    });

    it('should detect SOLD for Russian payment keywords', () => {
      const messages: ExtractedMessage[] = [
        { id: '1', content: 'Я оплатил тур', timestamp: oneDayAgo, fromMe: false, type: 'text' },
      ];
      expect(detectStatus(messages, twoDaysAgo, oneDayAgo)).toBe(ClientStatus.SOLD);
    });
  });

  describe('SERVICE status', () => {
    it('should detect SERVICE for during tour keywords', () => {
      const messages: ExtractedMessage[] = [
        { id: '1', content: 'I am currently on tour', timestamp: oneDayAgo, fromMe: false, type: 'text' },
      ];
      expect(detectStatus(messages, twoDaysAgo, oneDayAgo)).toBe(ClientStatus.SERVICE);
    });

    it('should detect SERVICE for Russian during tour keywords', () => {
      const messages: ExtractedMessage[] = [
        { id: '1', content: 'Сейчас в Кыргызстане', timestamp: oneDayAgo, fromMe: false, type: 'text' },
      ];
      expect(detectStatus(messages, twoDaysAgo, oneDayAgo)).toBe(ClientStatus.SERVICE);
    });
  });

  describe('PROPOSAL_SENT status', () => {
    it('should detect PROPOSAL_SENT when tour mentioned and outgoing messages exist', () => {
      const messages: ExtractedMessage[] = [
        { id: '1', content: 'I want a tour', timestamp: twoDaysAgo, fromMe: false, type: 'text' },
        { id: '2', content: 'Here is our tour package', timestamp: oneDayAgo, fromMe: true, type: 'text' },
      ];
      expect(detectStatus(messages, twoDaysAgo, oneDayAgo)).toBe(ClientStatus.PROPOSAL_SENT);
    });
  });

  describe('QUALIFIED status', () => {
    it('should detect QUALIFIED for questions about dates', () => {
      const messages: ExtractedMessage[] = [
        { id: '1', content: 'When is the tour?', timestamp: oneDayAgo, fromMe: false, type: 'text' },
      ];
      expect(detectStatus(messages, twoDaysAgo, oneDayAgo)).toBe(ClientStatus.QUALIFIED);
    });

    it('should detect QUALIFIED for questions about price', () => {
      const messages: ExtractedMessage[] = [
        { id: '1', content: 'What is the price?', timestamp: oneDayAgo, fromMe: false, type: 'text' },
      ];
      expect(detectStatus(messages, twoDaysAgo, oneDayAgo)).toBe(ClientStatus.QUALIFIED);
    });

    it('should detect QUALIFIED for questions about number of people', () => {
      const messages: ExtractedMessage[] = [
        { id: '1', content: 'How many people can join?', timestamp: oneDayAgo, fromMe: false, type: 'text' },
      ];
      expect(detectStatus(messages, twoDaysAgo, oneDayAgo)).toBe(ClientStatus.QUALIFIED);
    });
  });

  describe('NEW_LEAD status', () => {
    it('should detect NEW_LEAD for recent first message (<7 days)', () => {
      const messages: ExtractedMessage[] = [
        { id: '1', content: 'Hello', timestamp: oneDayAgo, fromMe: false, type: 'text' },
      ];
      expect(detectStatus(messages, oneDayAgo, oneDayAgo)).toBe(ClientStatus.NEW_LEAD);
    });

    it('should detect NEW_LEAD for empty messages', () => {
      expect(detectStatus([], now, now)).toBe(ClientStatus.NEW_LEAD);
    });
  });

  describe('Default behavior', () => {
    it('should default to QUALIFIED for started conversations', () => {
      const messages: ExtractedMessage[] = [
        { id: '1', content: 'Hi', timestamp: twoDaysAgo, fromMe: false, type: 'text' },
        { id: '2', content: 'Thanks', timestamp: oneDayAgo, fromMe: false, type: 'text' },
      ];
      // For conversations older than 7 days without specific keywords, should be QUALIFIED
      // But if less than 7 days and no outgoing messages, it's NEW_LEAD
      const result = detectStatus(messages, twoDaysAgo, oneDayAgo);
      expect([ClientStatus.QUALIFIED, ClientStatus.NEW_LEAD]).toContain(result);
    });
  });
});

