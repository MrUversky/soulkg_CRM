/**
 * Prompt Cache
 * 
 * In-memory кеш для промптов
 * В будущем можно заменить на Redis
 */

import type { LoadedPrompt, PromptCacheEntry } from '../types';
import { AgentType } from '@soul-kg-crm/database';

/**
 * In-memory кеш для промптов
 */
export class PromptCache {
  private readonly cache: Map<string, PromptCacheEntry>;
  private readonly defaultTTL: number; // Время жизни кеша в миллисекундах

  constructor(defaultTTL: number = 3600000) {
    // По умолчанию 1 час
    this.cache = new Map();
    this.defaultTTL = defaultTTL;
  }

  /**
   * Получает промпт из кеша
   */
  get(key: string): PromptCacheEntry | null {
    const entry = this.cache.get(key);

    if (!entry) {
      return null;
    }

    // Проверяем срок действия
    if (Date.now() > entry.expiresAt.getTime()) {
      this.cache.delete(key);
      return null;
    }

    return entry;
  }

  /**
   * Сохраняет промпт в кеш
   */
  set(key: string, prompt: LoadedPrompt, ttl?: number): void {
    const now = Date.now();
    const expiresAt = new Date(now + (ttl || this.defaultTTL));

    this.cache.set(key, {
      prompt,
      cachedAt: new Date(now),
      expiresAt,
    });
  }

  /**
   * Удаляет промпт из кеша
   */
  delete(key: string): void {
    this.cache.delete(key);
  }

  /**
   * Очищает кеш для организации
   */
  clear(organizationId: string, agentType?: AgentType): void {
    const prefix = agentType
      ? `prompt:${organizationId}:${agentType}:`
      : `prompt:${organizationId}:`;

    for (const key of this.cache.keys()) {
      if (key.startsWith(prefix)) {
        this.cache.delete(key);
      }
    }
  }

  /**
   * Очищает весь кеш
   */
  clearAll(): void {
    this.cache.clear();
  }

  /**
   * Очищает просроченные записи
   */
  cleanup(): void {
    const now = Date.now();
    for (const [key, entry] of this.cache.entries()) {
      if (now > entry.expiresAt.getTime()) {
        this.cache.delete(key);
      }
    }
  }

  /**
   * Получает размер кеша
   */
  size(): number {
    return this.cache.size;
  }
}

