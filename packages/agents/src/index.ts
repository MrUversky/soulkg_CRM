/**
 * @soul-kg-crm/agents
 * 
 * Пакет для работы с AI агентами системы
 * 
 * Основные компоненты:
 * - LLM Providers (OpenRouter)
 * - Prompt Manager (загрузка и кеширование промптов из БД)
 * - Status Detector (LLM-based детекция статусов клиентов)
 * - Cache (кеширование результатов LLM)
 */

// Типы
export * from './types';

// Providers
export * from './providers';

// Prompt Manager
export * from './prompt-manager';

// Detectors
export * from './detectors';

// Cache (будет реализовано)
// export * from './cache';

