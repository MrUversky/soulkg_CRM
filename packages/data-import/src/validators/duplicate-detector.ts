/**
 * Duplicate Detector
 * 
 * Detects duplicate clients based on phone number
 */

import { prisma } from '@soul-kg-crm/database';
import { normalizePhoneNumber } from '@soul-kg-crm/shared';
import type { ParsedClientData } from '../types/import.types';

export interface DuplicateCheckResult {
  isDuplicate: boolean;
  existingClientId?: string;
  conflictType?: 'phone' | 'name';
}

/**
 * Check if client already exists in database
 */
export async function checkDuplicate(
  organizationId: string,
  data: ParsedClientData
): Promise<DuplicateCheckResult> {
  const normalizedPhone = normalizePhoneNumber(data.phone);

  // Check by phone number
  const existingClient = await prisma.client.findFirst({
    where: {
      organizationId,
      phone: normalizedPhone,
    },
    select: {
      id: true,
      firstName: true,
      lastName: true,
    },
  });

  if (existingClient) {
    // Check for name conflict
    const existingName = `${existingClient.firstName || ''} ${existingClient.lastName || ''}`.trim();
    const newName = data.name || '';

    if (existingName && newName && existingName.toLowerCase() !== newName.toLowerCase()) {
      return {
        isDuplicate: true,
        existingClientId: existingClient.id,
        conflictType: 'name',
      };
    }

    return {
      isDuplicate: true,
      existingClientId: existingClient.id,
      conflictType: 'phone',
    };
  }

  return {
    isDuplicate: false,
  };
}

