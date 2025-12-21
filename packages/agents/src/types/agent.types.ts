/**
 * Типы для AI агентов системы
 */

import { AgentType } from '@soul-kg-crm/database';

/**
 * Конфигурация агента из базы данных
 */
export interface AgentConfig {
  id: string;
  organizationId: string;
  agentType: AgentType;
  name: string;
  prompt: string;
  settings: AgentSettings;
  isActive: boolean;
}

/**
 * Настройки агента (из JSON поля settings)
 */
export interface AgentSettings {
  model?: string;
  temperature?: number;
  maxTokens?: number;
  timeout?: number;
  retryAttempts?: number;
  retryDelay?: number;
  [key: string]: unknown;
}

/**
 * Параметры запроса к LLM
 */
export interface LLMRequest {
  prompt: string;
  model?: string;
  temperature?: number;
  maxTokens?: number;
  organizationId: string;
}

/**
 * Ответ от LLM
 */
export interface LLMResponse {
  content: string;
  model: string;
  usage?: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
  metadata?: Record<string, unknown>;
}

/**
 * Ошибка LLM провайдера
 */
export class LLMProviderError extends Error {
  public readonly code: string;
  public readonly statusCode?: number;
  public readonly retryable: boolean;

  constructor(
    message: string,
    code: string,
    statusCode?: number,
    retryable: boolean = false
  ) {
    super(message);
    this.name = 'LLMProviderError';
    this.code = code;
    this.statusCode = statusCode;
    this.retryable = retryable;
  }
}

