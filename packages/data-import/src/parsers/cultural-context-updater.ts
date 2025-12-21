/**
 * Cultural Context Updater
 * 
 * Determines when and how to update cultural context based on new messages
 */

import type { CulturalContextInfo } from '@soul-kg-crm/agents';

/**
 * Options for checking if cultural context should be updated
 */
export interface ShouldUpdateOptions {
  currentCulturalContext?: CulturalContextInfo | null;
  currentLanguage?: string;
  newLanguage?: string;
  messageCount: number;
  daysSinceLastUpdate?: number;
  hasNewMessages: boolean;
}

/**
 * Determine if cultural context should be updated
 * 
 * Returns true if:
 * - No cultural context exists yet
 * - Language changed significantly
 * - Enough time passed since last update
 * - Not enough messages were analyzed before
 */
export function shouldUpdateCulturalContext(options: ShouldUpdateOptions): boolean {
  const {
    currentCulturalContext,
    currentLanguage,
    newLanguage,
    messageCount,
    daysSinceLastUpdate = 0,
    hasNewMessages,
  } = options;

  // Always update if no cultural context exists
  if (!currentCulturalContext) {
    return true;
  }

  // Update if language changed significantly
  if (currentLanguage && newLanguage && currentLanguage !== newLanguage) {
    return true;
  }

  // Update if not enough messages were analyzed before (< 5 messages)
  if (messageCount < 5 && hasNewMessages) {
    return true;
  }

  // Update if >30 days passed since last update
  if (daysSinceLastUpdate > 30) {
    return true;
  }

  // Update if confidence was low (< 0.6) and we have new messages
  if (currentCulturalContext.confidence && currentCulturalContext.confidence < 0.6 && hasNewMessages) {
    return true;
  }

  // Don't update if recently updated (< 7 days) and confidence is high
  if (daysSinceLastUpdate < 7 && currentCulturalContext.confidence && currentCulturalContext.confidence >= 0.7) {
    return false;
  }

  // Default: update if we have new messages and it's been >7 days
  return hasNewMessages && daysSinceLastUpdate > 7;
}

/**
 * Merge cultural context updates
 * 
 * Combines old and new cultural context, preferring higher confidence values
 */
export function mergeCulturalContext(
  oldContext: CulturalContextInfo | null | undefined,
  newContext: CulturalContextInfo
): CulturalContextInfo {
  if (!oldContext) {
    return newContext;
  }

  // If new context has higher confidence, prefer it
  const oldConfidence = oldContext.confidence || 0.5;
  const newConfidence = newContext.confidence || 0.5;

  if (newConfidence > oldConfidence + 0.1) {
    // New context is significantly better
    return newContext;
  }

  if (oldConfidence > newConfidence + 0.1) {
    // Old context is significantly better
    return oldContext;
  }

  // Merge: prefer new values but keep old if new is missing
  return {
    likelyOrigin: newContext.likelyOrigin || oldContext.likelyOrigin,
    region: newContext.region || oldContext.region,
    communicationStyle: newContext.communicationStyle || oldContext.communicationStyle,
    dietaryRestrictions: [
      ...new Set([
        ...(oldContext.dietaryRestrictions || []),
        ...(newContext.dietaryRestrictions || []),
      ]),
    ],
    culturalNotes: [
      ...new Set([
        ...(oldContext.culturalNotes || []),
        ...(newContext.culturalNotes || []),
      ]),
    ],
    confidence: Math.max(oldConfidence, newConfidence),
  };
}

