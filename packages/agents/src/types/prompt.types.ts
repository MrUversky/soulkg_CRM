/**
 * Типы для управления промптами
 */

import { AgentType } from '@soul-kg-crm/database';

/**
 * Загруженный промпт из базы данных
 */
export interface LoadedPrompt {
  id: string;
  organizationId: string;
  agentType: AgentType;
  name: string;
  prompt: string;
  settings: Record<string, unknown>;
  version?: string;
  updatedAt: Date;
}

/**
 * Вариант промпта для A/B тестирования
 */
export interface PromptVariant {
  id: string;
  organizationId: string;
  agentType: AgentType;
  name: string;
  prompt: string;
  description?: string;
  isActive: boolean;
  experimentId?: string;
}

/**
 * Кеш промпта
 */
export interface PromptCacheEntry {
  prompt: LoadedPrompt;
  cachedAt: Date;
  expiresAt: Date;
}

/**
 * Параметры загрузки промпта
 */
export interface LoadPromptOptions {
  organizationId: string;
  agentType: AgentType;
  name?: string;
  useCache?: boolean;
  variantId?: string;
}

