/**
 * Prompt Loader
 * 
 * Загружает промпты из базы данных с поддержкой кеширования
 */

import { PrismaClient, AgentType } from '@soul-kg-crm/database';
import type { LoadedPrompt, LoadPromptOptions } from '../types';
import { PromptCache } from './prompt-cache';

/**
 * Загрузчик промптов из базы данных
 */
export class PromptLoader {
  private readonly prisma: PrismaClient;
  private readonly cache: PromptCache;

  constructor(prisma: PrismaClient, cache?: PromptCache) {
    this.prisma = prisma;
    this.cache = cache || new PromptCache();
  }

  /**
   * Загружает промпт из базы данных
   * 
   * @param options - Параметры загрузки промпта
   * @returns Загруженный промпт
   */
  async loadPrompt(options: LoadPromptOptions): Promise<LoadedPrompt> {
    const cacheKey = this.getCacheKey(options);

    // Проверяем кеш
    if (options.useCache !== false) {
      const cached = this.cache.get(cacheKey);
      if (cached) {
        return cached.prompt;
      }
    }

    // Загружаем из базы данных
    const prompt = await this.loadFromDatabase(options);

    // Сохраняем в кеш
    if (options.useCache !== false) {
      this.cache.set(cacheKey, prompt);
    }

    return prompt;
  }

  /**
   * Загружает промпт из базы данных
   */
  private async loadFromDatabase(options: LoadPromptOptions): Promise<LoadedPrompt> {
    const { organizationId, agentType, name, variantId } = options;

    // Если указан вариант промпта (для A/B тестирования)
    if (variantId) {
      const variant = await this.prisma.promptVariant.findFirst({
        where: {
          id: variantId,
          organizationId,
          agentType,
          isActive: true,
        },
      });

      if (!variant) {
        throw new Error(
          `Prompt variant not found: ${variantId} for organization ${organizationId}`
        );
      }

      return {
        id: variant.id,
        organizationId: variant.organizationId,
        agentType: variant.agentType,
        name: variant.name,
        prompt: variant.prompt,
        settings: {},
        updatedAt: variant.updatedAt,
      };
    }

    // Загружаем основной промпт
    const config = await this.prisma.agentConfiguration.findFirst({
      where: {
        organizationId,
        agentType,
        name: name || 'default',
        isActive: true,
      },
    });

    if (!config) {
      throw new Error(
        `Agent configuration not found: ${agentType} (${name || 'default'}) for organization ${organizationId}`
      );
    }

    return {
      id: config.id,
      organizationId: config.organizationId,
      agentType: config.agentType,
      name: config.name,
      prompt: config.prompt,
      settings: (config.settings as Record<string, unknown>) || {},
      updatedAt: config.updatedAt,
    };
  }

  /**
   * Генерирует ключ кеша для промпта
   */
  private getCacheKey(options: LoadPromptOptions): string {
    const { organizationId, agentType, name, variantId } = options;
    return `prompt:${organizationId}:${agentType}:${name || 'default'}:${variantId || 'main'}`;
  }

  /**
   * Очищает кеш для организации
   */
  clearCache(organizationId: string, agentType?: AgentType): void {
    this.cache.clear(organizationId, agentType);
  }
}

