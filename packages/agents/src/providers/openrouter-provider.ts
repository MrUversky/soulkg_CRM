/**
 * OpenRouter LLM Provider
 * 
 * Интеграция с OpenRouter API для доступа к различным LLM моделям
 */

import OpenAI from 'openai';
import { BaseLLMProvider, type ILLMProvider } from './base-provider';
import type { LLMRequest, LLMResponse } from '../types';
import { LLMProviderError } from '../types';

/**
 * Конфигурация OpenRouter провайдера
 */
export interface OpenRouterProviderConfig {
  apiKey: string;
  defaultModel?: string;
  baseURL?: string;
  timeout?: number;
  retryAttempts?: number;
  retryDelay?: number;
}

/**
 * OpenRouter LLM Provider
 * 
 * Использует OpenAI SDK для работы с OpenRouter API
 */
export class OpenRouterProvider extends BaseLLMProvider implements ILLMProvider {
  private readonly client: OpenAI;
  private readonly apiKey: string;

  constructor(config: OpenRouterProviderConfig) {
    super({
      defaultModel: config.defaultModel || 'openrouter/gpt-4o-mini',
      timeout: config.timeout,
      retryAttempts: config.retryAttempts,
      retryDelay: config.retryDelay,
    });

    if (!config.apiKey) {
      throw new Error('OpenRouter API key is required');
    }

    this.apiKey = config.apiKey;

    this.client = new OpenAI({
      apiKey: this.apiKey,
      baseURL: config.baseURL || 'https://openrouter.ai/api/v1',
    });
  }

  /**
   * Выполняет запрос к OpenRouter API
   */
  protected async executeRequest(request: LLMRequest): Promise<LLMResponse> {
    try {
      const model = request.model || this.defaultModel;
      const temperature = request.temperature ?? this.defaultTemperature;
      const maxTokens = request.maxTokens ?? this.defaultMaxTokens;

      // Логируем запрос для отладки
      console.log(`🔍 LLM Request: model=${model}, temperature=${temperature}, maxTokens=${maxTokens}`);
      console.log(`📝 Prompt length: ${request.prompt.length} chars`);

      const completion = await this.client.chat.completions.create({
        model,
        messages: [
          {
            role: 'user',
            content: request.prompt,
          },
        ],
        temperature,
        max_tokens: maxTokens,
      });

      const message = completion.choices[0]?.message?.content;
      if (!message) {
        throw new LLMProviderError(
          'Empty response from OpenRouter',
          'EMPTY_RESPONSE',
          200,
          false
        );
      }

      return {
        content: message,
        model: completion.model,
        usage: completion.usage
          ? {
              promptTokens: completion.usage.prompt_tokens,
              completionTokens: completion.usage.completion_tokens,
              totalTokens: completion.usage.total_tokens,
            }
          : undefined,
        metadata: {
          finishReason: completion.choices[0]?.finish_reason,
        },
      };
    } catch (error: unknown) {
      // Обработка ошибок OpenAI SDK
      if (error instanceof Error) {
        // Проверяем детали ошибки от OpenAI SDK
        const errorMessage = error.message || String(error);
        const errorAny = error as any; // OpenAI SDK errors have additional properties
        const errorCode = errorAny.status || errorAny.code;
        const errorResponse = errorAny.response || errorAny.body;

        // Логируем детали ошибки для отладки
        if (errorResponse) {
          console.error('OpenRouter API error details:', {
            message: errorMessage,
            code: errorCode,
            response: typeof errorResponse === 'string' ? errorResponse : JSON.stringify(errorResponse),
          });
        }

        // Rate limit ошибки - retryable
        if (errorMessage.includes('rate limit') || errorMessage.includes('429') || errorCode === 429) {
          throw new LLMProviderError(
            `Rate limit exceeded: ${errorMessage}`,
            'RATE_LIMIT',
            429,
            true
          );
        }

        // Timeout ошибки - retryable
        if (errorMessage.includes('timeout') || errorMessage.includes('ETIMEDOUT')) {
          throw new LLMProviderError(
            `Request timeout: ${errorMessage}`,
            'TIMEOUT',
            408,
            true
          );
        }

        // API ошибки - не retryable
        if (errorMessage.includes('401') || errorMessage.includes('403') || errorCode === 401 || errorCode === 403) {
          throw new LLMProviderError(
            `Authentication error: ${errorMessage}`,
            'AUTH_ERROR',
            401,
            false
          );
        }

        // 400 ошибки - обычно проблема с запросом (модель, формат и т.д.)
        if (errorMessage.includes('400') || errorCode === 400) {
          // Детальное логирование для отладки
          console.error('❌ OpenRouter API 400 Error Details:');
          console.error('  Model:', request.model || this.defaultModel);
          console.error('  Error message:', errorMessage);
          console.error('  Error code:', errorCode);
          if (errorResponse) {
            console.error('  Response:', JSON.stringify(errorResponse, null, 2));
          }
          
          const details = errorResponse?.error?.message || errorResponse?.message || errorMessage;
          throw new LLMProviderError(
            `OpenRouter API error (400): ${details}. Check model name and request format.`,
            'API_ERROR',
            400,
            false
          );
        }

        // Другие ошибки
        throw new LLMProviderError(
          `OpenRouter API error: ${errorMessage}${errorCode ? ` (code: ${errorCode})` : ''}`,
          'API_ERROR',
          errorCode,
          false
        );
      }

      throw error;
    }
  }

  /**
   * Проверяет доступность OpenRouter API
   */
  async isAvailable(): Promise<boolean> {
    try {
      // Простой запрос для проверки доступности
      await this.client.models.list();
      return true;
    } catch {
      return false;
    }
  }
}

