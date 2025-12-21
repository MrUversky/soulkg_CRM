/**
 * Базовый интерфейс для LLM провайдеров
 */

import type { LLMRequest, LLMResponse, LLMProviderError } from '../types';

/**
 * Базовый интерфейс для всех LLM провайдеров
 */
export interface ILLMProvider {
  /**
   * Выполняет запрос к LLM
   * 
   * @param request - Параметры запроса
   * @returns Ответ от LLM
   * @throws {LLMProviderError} При ошибке провайдера
   */
  complete(request: LLMRequest): Promise<LLMResponse>;

  /**
   * Проверяет доступность провайдера
   * 
   * @returns true если провайдер доступен
   */
  isAvailable(): Promise<boolean>;
}

/**
 * Базовый класс для LLM провайдеров
 * Предоставляет общую функциональность (retry, timeout, etc.)
 */
export abstract class BaseLLMProvider implements ILLMProvider {
  protected readonly defaultModel: string;
  protected readonly defaultTemperature: number;
  protected readonly defaultMaxTokens: number;
  protected readonly timeout: number;
  protected readonly retryAttempts: number;
  protected readonly retryDelay: number;

  constructor(options: {
    defaultModel: string;
    defaultTemperature?: number;
    defaultMaxTokens?: number;
    timeout?: number;
    retryAttempts?: number;
    retryDelay?: number;
  }) {
    this.defaultModel = options.defaultModel;
    this.defaultTemperature = options.defaultTemperature ?? 0.7;
    this.defaultMaxTokens = options.defaultMaxTokens ?? 2000;
    this.timeout = options.timeout ?? 30000; // 30 секунд
    this.retryAttempts = options.retryAttempts ?? 3;
    this.retryDelay = options.retryDelay ?? 1000; // 1 секунда
  }

  /**
   * Выполняет запрос с retry логикой
   */
  async complete(request: LLMRequest): Promise<LLMResponse> {
    let lastError: Error | null = null;

    for (let attempt = 1; attempt <= this.retryAttempts; attempt++) {
      try {
        return await this.executeRequest(request);
      } catch (error) {
        lastError = error as Error;
        
        // Если ошибка не retryable или это последняя попытка
        if (
          (error instanceof Error && 'retryable' in error && !(error as LLMProviderError).retryable) ||
          attempt === this.retryAttempts
        ) {
          throw error;
        }

        // Ждем перед следующей попыткой
        await this.delay(this.retryDelay * attempt);
      }
    }

    throw lastError || new Error('Unknown error');
  }

  /**
   * Выполняет запрос к LLM (должен быть реализован в подклассах)
   */
  protected abstract executeRequest(request: LLMRequest): Promise<LLMResponse>;

  /**
   * Проверяет доступность провайдера (должен быть реализован в подклассах)
   */
  abstract isAvailable(): Promise<boolean>;

  /**
   * Задержка перед retry
   */
  protected delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  /**
   * Создает timeout promise для запроса
   */
  protected createTimeoutPromise(ms: number): Promise<never> {
    return new Promise((_, reject) => {
      setTimeout(() => {
        reject(new Error(`Request timeout after ${ms}ms`));
      }, ms);
    });
  }
}

