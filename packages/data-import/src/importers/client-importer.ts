/**
 * Client Importer
 * 
 * Imports clients into the database
 */

import { prisma, StatusChangedBy } from '@soul-kg-crm/database';
import type { ParsedClientData } from '../types/import.types';

export interface ImportClientResult {
  clientId: string;
  created: boolean;
  updated: boolean;
}

/**
 * Import client into database
 */
export async function importClient(
  organizationId: string,
  data: ParsedClientData,
  existingClientId?: string
): Promise<ImportClientResult> {
  if (existingClientId) {
    // Update existing client
    const updated = await prisma.client.update({
      where: {
        id: existingClientId,
      },
      data: {
        firstName: data.name ? data.name.split(' ')[0] : undefined,
        lastName: data.name ? data.name.split(' ').slice(1).join(' ') || undefined : undefined,
        email: data.email,
        preferredLanguage: data.preferredLanguage,
        status: data.detectedStatus,
        culturalContext: data.metadata?.culturalContext || undefined,
        metadata: data.metadata as any,
        updatedAt: new Date(),
      },
    });

    // Create status history entry if status changed
    const existingClient = await prisma.client.findUnique({
      where: { id: existingClientId },
      select: { status: true },
    });

    if (existingClient && existingClient.status !== data.detectedStatus) {
      await prisma.clientStatusHistory.create({
        data: {
          clientId: existingClientId,
          organizationId,
          oldStatus: existingClient.status,
          newStatus: data.detectedStatus,
          changedBy: StatusChangedBy.SYSTEM,
          reason: 'Imported from WhatsApp',
        },
      });
    }

    return {
      clientId: updated.id,
      created: false,
      updated: true,
    };
  }

  // Create new client
  const created = await prisma.client.create({
    data: {
      organizationId,
      phone: data.phone,
      firstName: data.name ? data.name.split(' ')[0] : undefined,
      lastName: data.name ? data.name.split(' ').slice(1).join(' ') || undefined : undefined,
      email: data.email,
      status: data.detectedStatus,
      preferredLanguage: data.preferredLanguage,
      culturalContext: data.metadata?.culturalContext || undefined,
      metadata: data.metadata as any,
    },
  });

  // Create initial status history entry
  await prisma.clientStatusHistory.create({
    data: {
      clientId: created.id,
      organizationId,
      oldStatus: null,
      newStatus: data.detectedStatus,
      changedBy: StatusChangedBy.SYSTEM,
      reason: 'Imported from WhatsApp',
    },
  });

  return {
    clientId: created.id,
    created: true,
    updated: false,
  };
}

