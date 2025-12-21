/**
 * Tests for language detector
 */

import { describe, it, expect } from 'vitest';
import { detectLanguage, detectPrimaryLanguage } from '../language-detector';
import type { ExtractedMessage } from '../../types/import.types';

describe('Language Detector', () => {
  describe('detectLanguage', () => {
    it('should detect English', () => {
      expect(detectLanguage('Hello, how are you?')).toBe('en');
      expect(detectLanguage('I want to book a tour')).toBe('en');
      expect(detectLanguage('What is the price?')).toBe('en');
    });

    it('should detect Russian', () => {
      expect(detectLanguage('Привет, как дела?')).toBe('ru');
      expect(detectLanguage('Хочу забронировать тур')).toBe('ru');
      expect(detectLanguage('Какая цена?')).toBe('ru');
    });

    it('should detect Arabic', () => {
      expect(detectLanguage('مرحبا، كيف حالك؟')).toBe('ar');
      expect(detectLanguage('أريد حجز جولة')).toBe('ar');
    });

    it('should detect French', () => {
      expect(detectLanguage('Bonjour, comment allez-vous?')).toBe('fr');
      expect(detectLanguage('bonjour merci')).toBe('fr');
    });

    it('should detect German', () => {
      expect(detectLanguage('Hallo, wie geht es dir?')).toBe('de');
      expect(detectLanguage('hallo danke')).toBe('de');
    });

    it('should detect Spanish', () => {
      expect(detectLanguage('Hola, ¿cómo estás?')).toBe('es');
      expect(detectLanguage('hola gracias')).toBe('es');
    });

    it('should detect Polish', () => {
      expect(detectLanguage('Cześć, jak się masz?')).toBe('pl');
      expect(detectLanguage('cześć dziękuję')).toBe('pl');
    });

    it('should default to English for unknown languages', () => {
      expect(detectLanguage('')).toBe('en');
      expect(detectLanguage('123456')).toBe('en');
      expect(detectLanguage('!@#$%^&*()')).toBe('en');
    });

    it('should handle mixed languages (priority order)', () => {
      // Arabic has highest priority (script detection)
      expect(detectLanguage('مرحبا Hello')).toBe('ar');
      // Russian has higher priority than English (script detection)
      expect(detectLanguage('Привет Hello')).toBe('ru');
      // English defaults when no script detected
      expect(detectLanguage('Hello Bonjour')).toBe('fr'); // French word detected first
    });
  });

  describe('detectPrimaryLanguage', () => {
    it('should detect primary language from multiple messages', () => {
      const messages: ExtractedMessage[] = [
        { id: '1', content: 'Hello', timestamp: new Date(), fromMe: false, type: 'text' },
        { id: '2', content: 'How are you?', timestamp: new Date(), fromMe: false, type: 'text' },
        { id: '3', content: 'I want a tour', timestamp: new Date(), fromMe: false, type: 'text' },
      ];
      expect(detectPrimaryLanguage(messages)).toBe('en');
    });

    it('should detect Russian as primary when majority is Russian', () => {
      const messages: ExtractedMessage[] = [
        { id: '1', content: 'Привет', timestamp: new Date(), fromMe: false, type: 'text' },
        { id: '2', content: 'Как дела?', timestamp: new Date(), fromMe: false, type: 'text' },
        { id: '3', content: 'Hello', timestamp: new Date(), fromMe: false, type: 'text' },
      ];
      expect(detectPrimaryLanguage(messages)).toBe('ru');
    });

    it('should default to English for empty messages', () => {
      expect(detectPrimaryLanguage([])).toBe('en');
    });

    it('should handle Arabic messages', () => {
      const messages: ExtractedMessage[] = [
        { id: '1', content: 'مرحبا', timestamp: new Date(), fromMe: false, type: 'text' },
        { id: '2', content: 'كيف حالك؟', timestamp: new Date(), fromMe: false, type: 'text' },
      ];
      expect(detectPrimaryLanguage(messages)).toBe('ar');
    });
  });
});

