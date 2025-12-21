/**
 * Status Detection Strategy
 * 
 * Стратегия выбора между LLM и эвристическим детектором
 */

import { LLMStatusDetector, type StatusDetectionResult, type ExtractedMessage } from './status-detector';
import { ClientStatus } from '@soul-kg-crm/database';

/**
 * Эвристическая детекция статуса (fallback метод)
 * 
 * Учитывает:
 * - Направление последнего сообщения (КРИТИЧЕСКИ ВАЖНО)
 * - Давность последнего сообщения
 * - Ключевые слова в диалоге
 * - Контекст разговора
 */
function heuristicDetectStatus(
  messages: ExtractedMessage[],
  _firstMessageDate: Date,
  lastMessageDate: Date
): ClientStatus {
  if (messages.length === 0) {
    return ClientStatus.NEW_LEAD;
  }

  const now = new Date();
  const daysSinceLastMessage = Math.floor(
    (now.getTime() - lastMessageDate.getTime()) / (1000 * 60 * 60 * 24)
  );

  // Определяем кто написал последнее сообщение (КРИТИЧЕСКИ ВАЖНО!)
  const lastMessage = messages[messages.length - 1];
  const lastMessageFromClient = !lastMessage.fromMe;

  const text = messages.map((m) => m.content.toLowerCase()).join(' ');

  // CLOSED: Explicit refusal (вне зависимости от давности)
  const refusalKeywords = ['no thank', 'not interested', 'не интересно', 'не нужно', 'нет'];
  if (refusalKeywords.some((keyword) => text.includes(keyword))) {
    return ClientStatus.CLOSED;
  }

  // SOLD: Payment, booking keywords
  const soldKeywords = ['paid', 'payment', 'booked', 'booking', 'confirmed', 'оплатил', 'оплата', 'забронировал'];
  if (soldKeywords.some((keyword) => text.includes(keyword))) {
    return ClientStatus.SOLD;
  }

  // SERVICE: During tour keywords
  const serviceKeywords = ['during tour', 'on tour', 'in kyrgyzstan', 'currently', 'во время тура', 'на туре'];
  if (serviceKeywords.some((keyword) => text.includes(keyword))) {
    return ClientStatus.SERVICE;
  }

  // CLOSED: Только если последнее сообщение от АГЕНТА и прошло >30 дней
  // Если последнее сообщение от КЛИЕНТА - это не CLOSED, даже если прошло много времени
  if (daysSinceLastMessage > 30) {
    if (!lastMessageFromClient) {
      // Агент написал последним, клиент не ответил >30 дней → CLOSED
      return ClientStatus.CLOSED;
    } else {
      // Клиент написал последним, но прошло >30 дней → это пропущенный клиент
      // Используем активный статус в зависимости от контекста
      // (не CLOSED, так как клиент ждет ответа)
    }
  }

  // QUALIFIED: Questions about dates, budget, tour details
  const qualificationKeywords = [
    'when', 'date', 'price', 'cost', 'budget', 'how much',
    'когда', 'цена', 'сколько', 'details', 'itinerary', 'tour',
    'детали', 'маршрут', 'тур', 'private', 'group'
  ];
  if (qualificationKeywords.some((keyword) => text.includes(keyword))) {
    return ClientStatus.QUALIFIED;
  }

  // Если последнее сообщение от клиента и прошло <7 дней → активный статус
  if (lastMessageFromClient && daysSinceLastMessage < 7) {
    // Клиент недавно написал → активное взаимодействие
    return messages.length <= 2 ? ClientStatus.NEW_LEAD : ClientStatus.WARMED;
  }

  // Если последнее сообщение от клиента и прошло >7 дней → все равно активный статус
  // (клиент ждет ответа, не закрываем)
  if (lastMessageFromClient) {
    return ClientStatus.QUALIFIED; // Клиент ждет ответа
  }

  // Default: если разговор начался, но неопределенный статус
  return messages.length <= 2 ? ClientStatus.NEW_LEAD : ClientStatus.QUALIFIED;
}

/**
 * Параметры для детекции статуса с стратегией
 */
export interface DetectStatusWithStrategyOptions {
  organizationId: string;
  messages: ExtractedMessage[];
  firstMessageDate: Date;
  lastMessageDate: Date;
  language?: string;
  useLLM?: boolean; // Принудительно использовать LLM
  fallbackToHeuristic?: boolean; // Fallback на эвристику при ошибке LLM
}

/**
 * Стратегия детекции статуса
 * 
 * Выбирает между LLM и эвристическим детектором в зависимости от условий
 */
export class StatusDetectionStrategy {
  private readonly llmDetector?: LLMStatusDetector;
  private readonly useLLMByDefault: boolean;
  private readonly fallbackToHeuristic: boolean;

  constructor(options: {
    llmDetector?: LLMStatusDetector;
    useLLMByDefault?: boolean;
    fallbackToHeuristic?: boolean;
  }) {
    this.llmDetector = options.llmDetector;
    this.useLLMByDefault = options.useLLMByDefault ?? false;
    this.fallbackToHeuristic = options.fallbackToHeuristic ?? true;
  }

  /**
   * Определяет статус клиента используя стратегию выбора детектора
   */
  async detectStatus(
    options: DetectStatusWithStrategyOptions
  ): Promise<StatusDetectionResult> {
    const {
      organizationId,
      messages,
      firstMessageDate,
      lastMessageDate,
      language,
      useLLM,
      fallbackToHeuristic = this.fallbackToHeuristic,
    } = options;

    // Решаем какой детектор использовать
    const shouldUseLLM = useLLM ?? this.useLLMByDefault;

    // Если LLM доступен и нужно использовать
    if (shouldUseLLM && this.llmDetector) {
      try {
        return await this.llmDetector.detectStatus({
          organizationId,
          messages,
          firstMessageDate,
          lastMessageDate,
          language,
        });
      } catch (error) {
        // Если fallback разрешен, используем эвристику
        if (fallbackToHeuristic) {
          console.warn('LLM detection failed, falling back to heuristic:', error);
          return this.detectWithHeuristic(messages, firstMessageDate, lastMessageDate);
        }
        throw error;
      }
    }

    // Используем эвристический детектор
    return this.detectWithHeuristic(messages, firstMessageDate, lastMessageDate);
  }

  /**
   * Детекция статуса с помощью эвристики
   */
  private detectWithHeuristic(
    messages: ExtractedMessage[],
    firstMessageDate: Date,
    lastMessageDate: Date
  ): StatusDetectionResult {
    const status = heuristicDetectStatus(messages, firstMessageDate, lastMessageDate);
    
    // Формируем reasoning для отладки
    const lastMessage = messages[messages.length - 1];
    const lastMessageFrom = lastMessage?.fromMe ? 'Agent' : 'Client';
    const daysSinceLast = Math.floor(
      (Date.now() - lastMessageDate.getTime()) / (1000 * 60 * 60 * 24)
    );
    
    const reasoning = `Heuristic detection: Last message from ${lastMessageFrom}, ${daysSinceLast} days ago`;

    return {
      status,
      confidence: 0.6, // Эвристика имеет среднюю уверенность (ниже чем LLM)
      reasoning,
    };
  }
}

