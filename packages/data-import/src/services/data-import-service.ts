/**
 * Data Import Service
 * 
 * Main service orchestrating the import process
 */

import { WhatsAppExtractor } from '../extractors/whatsapp-extractor';
import { detectPrimaryLanguage } from '../parsers/language-detector';
import { detectStatus } from '../parsers/status-detector';
import { parseMessages } from '../parsers/message-parser';
import { detectCulturalContext, extractCountryCode } from '../parsers/cultural-context-detector';
import { extractBestName } from '../parsers/name-extractor';
import { validateClientData } from '../validators/data-validator';
import { checkDuplicate } from '../validators/duplicate-detector';
import { importClient } from '../importers/client-importer';
import { importConversation } from '../importers/conversation-importer';
import { importMessages } from '../importers/message-importer';
import type {
  ImportOptions,
  ImportResult,
  ParsedClientData,
} from '../types/import.types';
import { CommunicationChannel, ClientStatus } from '@soul-kg-crm/database';
import { StatusDetectionStrategy } from '@soul-kg-crm/agents';
import { OpenRouterProvider } from '@soul-kg-crm/agents';
import { PromptLoader } from '@soul-kg-crm/agents';
import { LLMStatusDetector } from '@soul-kg-crm/agents';
import { prisma } from '@soul-kg-crm/database';

/**
 * Main data import service
 */
export class DataImportService {
  private extractor: WhatsAppExtractor;
  private organizationId: string;
  public readonly importId: string;
  private statusDetectionStrategy?: StatusDetectionStrategy;

  constructor(
    organizationId: string,
    importId?: string,
    options?: {
      useLLMStatusDetection?: boolean;
      openRouterApiKey?: string;
    }
  ) {
    this.organizationId = organizationId;
    this.importId = importId || `import-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    this.extractor = new WhatsAppExtractor({ organizationId });

    // Инициализируем LLM детектор если нужно
    if (options?.useLLMStatusDetection && options?.openRouterApiKey) {
      try {
        const llmProvider = new OpenRouterProvider({
          apiKey: options.openRouterApiKey,
          defaultModel: 'openrouter/gpt-4o-mini',
        });
        const promptLoader = new PromptLoader(prisma);
        const llmDetector = new LLMStatusDetector(llmProvider, promptLoader);
        this.statusDetectionStrategy = new StatusDetectionStrategy({
          llmDetector,
          useLLMByDefault: true,
          fallbackToHeuristic: true,
        });
      } catch (error) {
        console.warn('Failed to initialize LLM status detection, falling back to heuristic:', error);
        // Используем эвристику по умолчанию
      }
    }
  }

  /**
   * Initialize WhatsApp connection
   */
  async initialize(): Promise<void> {
    await this.extractor.initialize();
  }

  /**
   * Get QR code for authentication
   */
  async getQRCode(): Promise<string | null> {
    return this.extractor.getQRCode();
  }

  /**
   * Start import process
   */
  async startImport(options: ImportOptions): Promise<ImportResult> {
    const result: ImportResult = {
      importId: this.importId,
      status: 'RUNNING',
      totalChats: 0,
      processedChats: 0,
      successfulImports: 0,
      failedImports: 0,
      skippedDuplicates: 0,
      errors: [],
    };

          // Merge options with defaults
          const importOptions = {
            organizationId: options.organizationId || this.organizationId,
            importContacts: options.importContacts ?? true,
            importMessages: options.importMessages ?? true,
            detectStatus: options.detectStatus ?? true,
            useLLMStatusDetection: options.useLLMStatusDetection ?? false,
            skipDuplicates: options.skipDuplicates ?? true,
            dryRun: options.dryRun ?? false,
            limit: options.limit, // Optional limit for testing
          };

    try {
      // Extract contacts (with limit applied early to avoid unnecessary API calls)
      console.log('📥 Extracting contacts...');
      const contacts = await this.extractor.extractContacts(importOptions.limit);
      result.totalChats = contacts.length;
      
      console.log(`📊 Processing ${contacts.length} contacts...`);

      // Process each contact
      for (let i = 0; i < contacts.length; i++) {
        const contact = contacts[i];
        console.log(`\n[${i + 1}/${contacts.length}] Processing: ${contact.name || contact.phone}`);
        try {
          // Extract messages for this contact
          // We'll use phone number to find the chat
          // WhatsApp extractor will handle finding the chat by phone
          console.log(`   📨 Extracting messages...`);
          const extractedMessages = await this.extractor.extractMessages(contact.phone);
          console.log(`   ✅ Found ${extractedMessages.length} messages`);

          if (extractedMessages.length === 0 && !importOptions.importContacts) {
            continue; // Skip if no messages and contacts import disabled
          }

          // Parse data
          const parsedData = await this.parseChatData(contact, extractedMessages, importOptions);

          // Validate
          const validation = validateClientData(parsedData);
          if (!validation.isValid) {
            result.errors.push({
              chat: contact.name || contact.phone,
              error: validation.errors.join('; '),
            });
            result.failedImports++;
            result.processedChats++;
            continue;
          }

          // Check duplicates
          const duplicateCheck = await checkDuplicate(this.organizationId, parsedData);
          if (duplicateCheck.isDuplicate && importOptions.skipDuplicates) {
            result.skippedDuplicates++;
            result.processedChats++;
            continue;
          }

          // Import (if not dry run)
          if (!importOptions.dryRun) {
            await this.importChatData(parsedData, duplicateCheck.existingClientId);
            result.successfulImports++;
          } else {
            // In dry-run mode, count as successful if validation passed
            result.successfulImports++;
          }
        } catch (error) {
          result.errors.push({
            chat: contact.name || contact.phone,
            error: error instanceof Error ? error.message : String(error),
          });
          result.failedImports++;
        }

        result.processedChats++;
      }

      result.status = 'COMPLETED';
    } catch (error) {
      result.status = 'FAILED';
      result.errors.push({
        chat: 'System',
        error: error instanceof Error ? error.message : String(error),
      });
    }

    return result;
  }

  /**
   * Parse chat data into structured format
   */
  private async parseChatData(
    contact: { phone: string; name?: string },
    messages: any[],
    importOptions: Required<Omit<ImportOptions, 'limit'>> & { limit?: number }
  ): Promise<ParsedClientData> {
    if (messages.length === 0) {
      return {
        phone: contact.phone,
        name: contact.name,
        detectedStatus: ClientStatus.NEW_LEAD,
        messages: [],
        firstMessageDate: new Date(),
        lastMessageDate: new Date(),
      };
    }

    const sortedMessages = messages.sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());
    const firstMessageDate = sortedMessages[0].timestamp;
    const lastMessageDate = sortedMessages[sortedMessages.length - 1].timestamp;

    const parsedMessages = parseMessages(messages);
    const primaryLanguage = detectPrimaryLanguage(messages);

    // Определяем статус: используем LLM если доступен, иначе эвристику
    let detectedStatus: ClientStatus;
    let detectionMethod: 'LLM' | 'heuristic' = 'heuristic';
    let statusResult: any = null; // Store LLM result for cultural context
    
    if (
      importOptions.useLLMStatusDetection &&
      this.statusDetectionStrategy
    ) {
      try {
        console.log(`   🤖 Using LLM for status detection...`);
        detectionMethod = 'LLM';
        statusResult = await this.statusDetectionStrategy.detectStatus({
          organizationId: this.organizationId,
          messages,
          firstMessageDate,
          lastMessageDate,
          language: primaryLanguage,
          useLLM: true,
          fallbackToHeuristic: true,
        });
        detectedStatus = statusResult.status;
        console.log(`   ✅ LLM detected status: ${detectedStatus} (confidence: ${statusResult.confidence})`);
        
        // Use LLM cultural context if available
        if (statusResult.culturalContext) {
          console.log(`   🌍 LLM detected cultural context: ${statusResult.culturalContext.likelyOrigin || 'unknown'} (${statusResult.culturalContext.region || 'unknown'})`);
        }
      } catch (error) {
        console.warn(`   ⚠️  LLM status detection failed, falling back to heuristic:`, error);
        detectionMethod = 'heuristic';
        detectedStatus = detectStatus(messages, firstMessageDate, lastMessageDate);
        console.log(`   ✅ Heuristic detected status: ${detectedStatus}`);
      }
    } else {
      console.log(`   📊 Using heuristic for status detection...`);
      detectionMethod = 'heuristic';
      detectedStatus = detectStatus(messages, firstMessageDate, lastMessageDate);
      console.log(`   ✅ Heuristic detected status: ${detectedStatus}`);
    }

    // Detect cultural context
    // Priority: LLM result > heuristic fallback
    let culturalContext: any;
    
    if (detectionMethod === 'LLM' && statusResult?.culturalContext) {
      // Use LLM-detected cultural context
      const heuristicContext = detectCulturalContext(primaryLanguage, contact.phone);
      culturalContext = {
        ...statusResult.culturalContext,
        language: primaryLanguage, // Always include detected language
        // Add timezone from phone (LLM doesn't know current location)
        timezone: heuristicContext.timezone,
        countryCode: contact.phone ? extractCountryCode(contact.phone) : undefined,
        country: heuristicContext.country, // Current location from phone
      };
    } else {
      // Fallback to heuristic
      culturalContext = detectCulturalContext(primaryLanguage, contact.phone);
    }

    // Extract best available name from multiple sources
    const extractedName = extractBestName(contact.name, messages, contact.phone);

    // Prepare metadata
    const metadata = {
      importSource: 'whatsapp',
      importId: this.importId,
      importDate: new Date().toISOString(),
      statusDetectionMethod: detectionMethod,
      messageCount: messages.length,
      firstContactDate: firstMessageDate.toISOString(),
      lastContactDate: lastMessageDate.toISOString(),
      avatar: contact.avatar,
      nameSource: extractedName ? (extractedName === contact.name ? 'whatsapp_contact' : 'message_extraction') : 'none',
    };

    return {
      phone: contact.phone,
      name: extractedName,
      preferredLanguage: primaryLanguage,
      detectedStatus,
      messages: parsedMessages,
      firstMessageDate,
      lastMessageDate,
      metadata: {
        ...metadata,
        culturalContext,
      },
    };
  }

  /**
   * Import chat data into database
   */
  private async importChatData(data: ParsedClientData, existingClientId?: string): Promise<void> {
    // Import client
    const clientResult = await importClient(this.organizationId, data, existingClientId);

    // Import conversation
    const conversationResult = await importConversation(
      this.organizationId,
      clientResult.clientId,
      CommunicationChannel.WHATSAPP
    );

    // Import messages
    if (data.messages.length > 0) {
      await importMessages(
        this.organizationId,
        conversationResult.conversationId,
        data.messages
      );
    }
  }


  /**
   * Disconnect and cleanup
   */
  async disconnect(): Promise<void> {
    await this.extractor.disconnect();
  }
}

