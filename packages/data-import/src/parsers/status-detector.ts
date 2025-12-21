/**
 * Status Detection Parser
 * 
 * Detects client status based on conversation context
 */

import { ClientStatus } from '@soul-kg-crm/database';
import type { ExtractedMessage } from '../types/import.types';

/**
 * Detect client status from messages
 */
export function detectStatus(
  messages: ExtractedMessage[],
  firstMessageDate: Date,
  lastMessageDate: Date
): ClientStatus {
  if (messages.length === 0) {
    return ClientStatus.NEW_LEAD;
  }

  const text = messages.map((m) => m.content.toLowerCase()).join(' ');
  const now = new Date();
  const daysSinceLastMessage = Math.floor(
    (now.getTime() - lastMessageDate.getTime()) / (1000 * 60 * 60 * 24)
  );
  const daysSinceFirstMessage = Math.floor(
    (now.getTime() - firstMessageDate.getTime()) / (1000 * 60 * 60 * 24)
  );

  // CLOSED: No activity for > 30 days or explicit refusal
  if (daysSinceLastMessage > 30) {
    return ClientStatus.CLOSED;
  }

  const refusalKeywords = ['no thank', 'not interested', 'не интересно', 'не нужно', 'нет'];
  if (refusalKeywords.some((keyword) => text.includes(keyword))) {
    return ClientStatus.CLOSED;
  }

  // SOLD: Payment, booking, confirmation keywords
  const soldKeywords = [
    'paid',
    'payment',
    'booked',
    'booking',
    'confirmed',
    'оплатил',
    'оплата',
    'забронировал',
    'подтвердил',
  ];
  if (soldKeywords.some((keyword) => text.includes(keyword))) {
    return ClientStatus.SOLD;
  }

  // SERVICE: During or after tour keywords
  const serviceKeywords = [
    'during tour',
    'on tour',
    'in kyrgyzstan',
    'currently',
    'во время тура',
    'сейчас в',
    'на туре',
  ];
  if (serviceKeywords.some((keyword) => text.includes(keyword))) {
    return ClientStatus.SERVICE;
  }

  // PROPOSAL_SENT: Tour mentioned, information sent
  const proposalKeywords = [
    'tour',
    'trip',
    'package',
    'itinerary',
    'тур',
    'поездка',
    'маршрут',
  ];
  const hasProposalKeywords = proposalKeywords.some((keyword) => text.includes(keyword));
  const hasOutgoingMessages = messages.some((m) => m.fromMe);

  if (hasProposalKeywords && hasOutgoingMessages && daysSinceFirstMessage > 1) {
    return ClientStatus.PROPOSAL_SENT;
  }

  // QUALIFIED: Questions about dates, budget, number of people
  const qualificationKeywords = [
    'when',
    'date',
    'price',
    'cost',
    'budget',
    'how much',
    'how many',
    'people',
    'person',
    'когда',
    'дата',
    'цена',
    'стоимость',
    'сколько',
    'человек',
  ];
  if (qualificationKeywords.some((keyword) => text.includes(keyword))) {
    return ClientStatus.QUALIFIED;
  }

  // NEW_LEAD: Recent first message (< 7 days), no qualification signs
  if (daysSinceFirstMessage < 7 && !hasProposalKeywords && !hasOutgoingMessages) {
    return ClientStatus.NEW_LEAD;
  }

  // Default to QUALIFIED if conversation has started
  return ClientStatus.QUALIFIED;
}

