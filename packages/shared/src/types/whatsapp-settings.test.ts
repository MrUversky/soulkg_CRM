/**
 * Tests for WhatsApp settings types and validation
 */

import { describe, it, expect } from 'vitest';
import {
  getDefaultWhatsAppSettings,
  validateWhatsAppSettings,
  type WhatsAppSettings,
} from './whatsapp-settings';

describe('WhatsApp Settings', () => {
  describe('getDefaultWhatsAppSettings', () => {
    it('should return conservative default settings', () => {
      const settings = getDefaultWhatsAppSettings();
      
      expect(settings.rateLimiting.messagesPerMinute).toBe(10);
      expect(settings.rateLimiting.messagesPerHour).toBe(100);
      expect(settings.rateLimiting.messagesPerDay).toBe(500);
      expect(settings.rateLimiting.concurrency).toBe(3);
      
      expect(settings.safety.enableMassSending).toBe(false);
      expect(settings.safety.requireConfirmation).toBe(true);
      expect(settings.safety.maxBatchSize).toBe(50);
    });
    
    it('should return a complete settings object', () => {
      const settings = getDefaultWhatsAppSettings();
      
      expect(settings).toHaveProperty('rateLimiting');
      expect(settings).toHaveProperty('safety');
      expect(settings.rateLimiting).toHaveProperty('messagesPerMinute');
      expect(settings.rateLimiting).toHaveProperty('messagesPerHour');
      expect(settings.rateLimiting).toHaveProperty('messagesPerDay');
      expect(settings.rateLimiting).toHaveProperty('concurrency');
      expect(settings.safety).toHaveProperty('enableMassSending');
      expect(settings.safety).toHaveProperty('requireConfirmation');
      expect(settings.safety).toHaveProperty('maxBatchSize');
    });
  });
  
  describe('validateWhatsAppSettings', () => {
    it('should return defaults for empty input', () => {
      const validated = validateWhatsAppSettings({});
      const defaults = getDefaultWhatsAppSettings();
      
      expect(validated).toEqual(defaults);
    });
    
    it('should use provided values when valid', () => {
      const partial: Partial<WhatsAppSettings> = {
        rateLimiting: {
          messagesPerMinute: 15,
          messagesPerHour: 150,
          messagesPerDay: 600,
          concurrency: 4,
        },
        safety: {
          enableMassSending: true,
          requireConfirmation: false,
          maxBatchSize: 75,
        },
      };
      
      const validated = validateWhatsAppSettings(partial);
      
      expect(validated.rateLimiting.messagesPerMinute).toBe(15);
      expect(validated.rateLimiting.messagesPerHour).toBe(150);
      expect(validated.rateLimiting.messagesPerDay).toBe(600);
      expect(validated.rateLimiting.concurrency).toBe(4);
      expect(validated.safety.enableMassSending).toBe(true);
      expect(validated.safety.requireConfirmation).toBe(false);
      expect(validated.safety.maxBatchSize).toBe(75);
    });
    
    it('should clamp messagesPerMinute to 1-20 range', () => {
      expect(validateWhatsAppSettings({
        rateLimiting: { messagesPerMinute: 0 },
      }).rateLimiting.messagesPerMinute).toBe(1);
      
      expect(validateWhatsAppSettings({
        rateLimiting: { messagesPerMinute: 25 },
      }).rateLimiting.messagesPerMinute).toBe(20);
      
      expect(validateWhatsAppSettings({
        rateLimiting: { messagesPerMinute: 15 },
      }).rateLimiting.messagesPerMinute).toBe(15);
    });
    
    it('should clamp messagesPerHour to 1-200 range', () => {
      expect(validateWhatsAppSettings({
        rateLimiting: { messagesPerHour: 0 },
      }).rateLimiting.messagesPerHour).toBe(1);
      
      expect(validateWhatsAppSettings({
        rateLimiting: { messagesPerHour: 300 },
      }).rateLimiting.messagesPerHour).toBe(200);
      
      expect(validateWhatsAppSettings({
        rateLimiting: { messagesPerHour: 150 },
      }).rateLimiting.messagesPerHour).toBe(150);
    });
    
    it('should clamp messagesPerDay to 1-1000 range', () => {
      expect(validateWhatsAppSettings({
        rateLimiting: { messagesPerDay: 0 },
      }).rateLimiting.messagesPerDay).toBe(1);
      
      expect(validateWhatsAppSettings({
        rateLimiting: { messagesPerDay: 2000 },
      }).rateLimiting.messagesPerDay).toBe(1000);
      
      expect(validateWhatsAppSettings({
        rateLimiting: { messagesPerDay: 500 },
      }).rateLimiting.messagesPerDay).toBe(500);
    });
    
    it('should clamp concurrency to 1-5 range', () => {
      expect(validateWhatsAppSettings({
        rateLimiting: { concurrency: 0 },
      }).rateLimiting.concurrency).toBe(1);
      
      expect(validateWhatsAppSettings({
        rateLimiting: { concurrency: 10 },
      }).rateLimiting.concurrency).toBe(5);
      
      expect(validateWhatsAppSettings({
        rateLimiting: { concurrency: 3 },
      }).rateLimiting.concurrency).toBe(3);
    });
    
    it('should clamp maxBatchSize to 1-100 range', () => {
      expect(validateWhatsAppSettings({
        safety: { maxBatchSize: 0 },
      }).safety.maxBatchSize).toBe(1);
      
      expect(validateWhatsAppSettings({
        safety: { maxBatchSize: 200 },
      }).safety.maxBatchSize).toBe(100);
      
      expect(validateWhatsAppSettings({
        safety: { maxBatchSize: 50 },
      }).safety.maxBatchSize).toBe(50);
    });
    
    it('should merge partial settings with defaults', () => {
      const partial: Partial<WhatsAppSettings> = {
        rateLimiting: {
          messagesPerMinute: 12,
        },
        safety: {
          enableMassSending: true,
        },
      };
      
      const validated = validateWhatsAppSettings(partial);
      const defaults = getDefaultWhatsAppSettings();
      
      // Custom values
      expect(validated.rateLimiting.messagesPerMinute).toBe(12);
      expect(validated.safety.enableMassSending).toBe(true);
      
      // Default values
      expect(validated.rateLimiting.messagesPerHour).toBe(defaults.rateLimiting.messagesPerHour);
      expect(validated.rateLimiting.messagesPerDay).toBe(defaults.rateLimiting.messagesPerDay);
      expect(validated.rateLimiting.concurrency).toBe(defaults.rateLimiting.concurrency);
      expect(validated.safety.requireConfirmation).toBe(defaults.safety.requireConfirmation);
      expect(validated.safety.maxBatchSize).toBe(defaults.safety.maxBatchSize);
    });
  });
});

