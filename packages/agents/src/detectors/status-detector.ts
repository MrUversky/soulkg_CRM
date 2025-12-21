/**
 * LLM Status Detector
 * 
 * Определяет статус клиента на основе диалога с использованием LLM
 */

import { ClientStatus, AgentType } from '@soul-kg-crm/database';
import type { ILLMProvider } from '../providers';
import type { PromptLoader } from '../prompt-manager';

// Define ExtractedMessage locally to avoid circular dependency
// This matches the type from @soul-kg-crm/data-import
export interface ExtractedMessage {
  id: string;
  content: string;
  timestamp: Date;
  fromMe: boolean;
  type: 'text' | 'image' | 'video' | 'audio' | 'document';
  mediaUrl?: string;
}

/**
 * Параметры для детекции статуса
 */
export interface DetectStatusOptions {
  organizationId: string;
  messages: ExtractedMessage[];
  firstMessageDate: Date;
  lastMessageDate: Date;
  language?: string;
}

/**
 * Результат детекции статуса
 */
export interface StatusDetectionResult {
  status: ClientStatus;
  confidence: number; // 0-1
  reasoning?: string; // Объяснение решения (для отладки)
}

/**
 * LLM-based детектор статусов клиентов
 */
export class LLMStatusDetector {
  private readonly llmProvider: ILLMProvider;
  private readonly promptLoader: PromptLoader;

  constructor(llmProvider: ILLMProvider, promptLoader: PromptLoader) {
    this.llmProvider = llmProvider;
    this.promptLoader = promptLoader;
  }

  /**
   * Определяет статус клиента на основе диалога
   */
  async detectStatus(options: DetectStatusOptions): Promise<StatusDetectionResult> {
    const { organizationId, messages, firstMessageDate, lastMessageDate, language } = options;

    // Логирование для отладки
    const lastMessage = messages[messages.length - 1];
    const lastMessageFrom = lastMessage?.fromMe ? 'Agent' : 'Client';
    console.log(`🔍 LLM Status Detection:`);
    console.log(`   Messages: ${messages.length}`);
    console.log(`   Last message from: ${lastMessageFrom}`);
    console.log(`   Language: ${language || 'unknown'}`);

    // Загружаем промпт из БД
    const promptConfig = await this.promptLoader.loadPrompt({
      organizationId,
      agentType: AgentType.STATUS_DETECTION,
      name: 'default',
    });

    // Формируем контекст диалога
    const conversationContext = this.formatConversationContext(
      messages,
      firstMessageDate,
      lastMessageDate,
      language
    );

    // Формируем полный промпт
    const fullPrompt = this.buildPrompt(promptConfig.prompt, conversationContext);

    // Вызываем LLM
    const response = await this.llmProvider.complete({
      prompt: fullPrompt,
      organizationId,
      model: (promptConfig.settings.model as string) || undefined,
      temperature: (promptConfig.settings.temperature as number) || 0.3,
      maxTokens: (promptConfig.settings.maxTokens as number) || 100,
    });

    // Парсим ответ LLM
    const result = this.parseLLMResponse(response.content);
    
    console.log(`   ✅ Detected status: ${result.status} (confidence: ${result.confidence})`);
    if (result.reasoning) {
      console.log(`   Reasoning: ${result.reasoning}`);
    }
    
    return result;
  }

  /**
   * Форматирует контекст диалога для промпта
   * 
   * ВАЖНО: Явно указывает направление последнего сообщения для правильного определения статуса
   */
  private formatConversationContext(
    messages: ExtractedMessage[],
    firstMessageDate: Date,
    lastMessageDate: Date,
    language?: string
  ): string {
    const now = new Date();
    const daysSinceLastMessage = Math.floor(
      (now.getTime() - lastMessageDate.getTime()) / (1000 * 60 * 60 * 24)
    );
    const daysSinceFirstMessage = Math.floor(
      (now.getTime() - firstMessageDate.getTime()) / (1000 * 60 * 60 * 24)
    );

    // Определяем кто написал последнее сообщение (КРИТИЧЕСКИ ВАЖНО!)
    const lastMessage = messages[messages.length - 1];
    const lastMessageFrom = lastMessage?.fromMe ? 'Agent' : 'Client';
    const lastMessageIsFromClient = !lastMessage?.fromMe;

    // Ограничиваем количество сообщений и их длину для избежания превышения лимитов API
    const maxMessages = 20; // Последние N сообщений
    const maxMessageLength = 500; // Максимальная длина одного сообщения
    
    const messageHistory = messages
      .slice(-maxMessages) // Последние N сообщений для контекста
      .map((msg, idx) => {
        const role = msg.fromMe ? 'Agent' : 'Client';
        const isLast = idx === messages.slice(-maxMessages).length - 1;
        const marker = isLast ? ' ⬅️ LAST MESSAGE' : '';
        // Обрезаем длинные сообщения
        const content = msg.content.length > maxMessageLength 
          ? msg.content.substring(0, maxMessageLength) + '... [truncated]'
          : msg.content;
        return `${idx + 1}. [${role}]: ${content}${marker}`;
      })
      .join('\n');

    return `
Conversation Summary:
- Total messages: ${messages.length}
- First message: ${firstMessageDate.toISOString()} (${daysSinceFirstMessage} days ago)
- Last message: ${lastMessageDate.toISOString()} (${daysSinceLastMessage} days ago)
- Last message sender: ${lastMessageFrom} ${lastMessageIsFromClient ? '(Client is waiting for response)' : '(Agent sent last, waiting for client)'}
- Client language: ${language || 'unknown'}

⚠️ CRITICAL: Last message is from ${lastMessageFrom}. ${lastMessageIsFromClient 
  ? 'Client is waiting for response - DO NOT mark as CLOSED even if >30 days old.' 
  : 'Agent sent last - can be CLOSED if >30 days with no response.'}

Recent messages:
${messageHistory}
`;
  }

  /**
   * Строит полный промпт для LLM
   * Ограничивает размер промпта для избежания превышения лимитов API
   */
  private buildPrompt(basePrompt: string, context: string): string {
    const maxPromptLength = 8000; // Максимальная длина промпта (безопасный лимит)
    
    // Обрезаем базовый промпт если он слишком длинный
    let trimmedBasePrompt = basePrompt;
    if (trimmedBasePrompt.length > 2000) {
      trimmedBasePrompt = trimmedBasePrompt.substring(0, 2000) + '... [prompt truncated]';
    }
    
    // Обрезаем контекст если промпт слишком длинный
    let trimmedContext = context;
    const totalLength = trimmedBasePrompt.length + trimmedContext.length + 500; // +500 для инструкций
    
    if (totalLength > maxPromptLength) {
      const availableContextLength = maxPromptLength - trimmedBasePrompt.length - 500;
      if (availableContextLength > 0) {
        trimmedContext = trimmedContext.substring(0, availableContextLength) + '\n... [context truncated]';
      }
    }
    
    return `${trimmedBasePrompt}

${trimmedContext}

Please analyze the conversation and determine the client's status. Respond ONLY with a JSON object in this format:
{
  "status": "NEW_LEAD" | "QUALIFIED" | "WARMED" | "PROPOSAL_SENT" | "NEGOTIATION" | "SOLD" | "SERVICE" | "CLOSED",
  "confidence": 0.0-1.0,
  "reasoning": "brief explanation"
}`;
  }

  /**
   * Парсит ответ LLM в структурированный результат
   */
  private parseLLMResponse(response: string): StatusDetectionResult {
    try {
      // Пытаемся найти JSON в ответе
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('No JSON found in LLM response');
      }

      const parsed = JSON.parse(jsonMatch[0]);

      // Валидация статуса
      const validStatuses = Object.values(ClientStatus);
      if (!validStatuses.includes(parsed.status)) {
        throw new Error(`Invalid status: ${parsed.status}`);
      }

      return {
        status: parsed.status as ClientStatus,
        confidence: Math.max(0, Math.min(1, parsed.confidence || 0.5)),
        reasoning: parsed.reasoning,
      };
    } catch (error) {
      // Fallback: пытаемся определить статус по ключевым словам в ответе
      const responseLower = response.toLowerCase();
      const statusMap: Record<string, ClientStatus> = {
        'new_lead': ClientStatus.NEW_LEAD,
        'qualified': ClientStatus.QUALIFIED,
        'warmed': ClientStatus.WARMED,
        'proposal_sent': ClientStatus.PROPOSAL_SENT,
        'negotiation': ClientStatus.NEGOTIATION,
        'sold': ClientStatus.SOLD,
        'service': ClientStatus.SERVICE,
        'closed': ClientStatus.CLOSED,
      };

      for (const [key, status] of Object.entries(statusMap)) {
        if (responseLower.includes(key)) {
          return {
            status,
            confidence: 0.5,
            reasoning: 'Fallback detection from LLM response',
          };
        }
      }

      // Если ничего не найдено, возвращаем NEW_LEAD
      return {
        status: ClientStatus.NEW_LEAD,
        confidence: 0.3,
        reasoning: 'Failed to parse LLM response, defaulting to NEW_LEAD',
      };
    }
  }
}

