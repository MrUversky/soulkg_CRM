/**
 * Script to save current WhatsApp session to database
 * 
 * This script reads an existing session from file system and saves it to database.
 * Useful for migrating existing sessions to database storage.
 * 
 * Usage:
 *   npx tsx scripts/save-current-session-to-db.ts <organizationId> [sessionPath]
 * 
 * Example:
 *   npx tsx scripts/save-current-session-to-db.ts 36b9d610-8ffb-419f-9a57-4df35afce40e
 */

import { prisma } from '@soul-kg-crm/database';
import * as fs from 'fs';
import * as path from 'path';
// @ts-ignore - archiver doesn't have perfect types
const archiver = require('archiver');

async function main() {
  const organizationId = process.argv[2];
  const customSessionPath = process.argv[3];

  if (!organizationId) {
    console.log('📋 Available organizations:');
    const orgs = await prisma.organization.findMany({
      select: { id: true, name: true },
      take: 5,
    });

    if (orgs.length === 0) {
      console.error('❌ No organizations found. Please create one first.');
      process.exit(1);
    }

    orgs.forEach((org, i) => {
      console.log(`  ${i + 1}. ${org.name} (${org.id})`);
    });

    console.log('\nUsage: npx tsx scripts/save-current-session-to-db.ts <organizationId> [sessionPath]');
    console.log(`Example: npx tsx scripts/save-current-session-to-db.ts ${orgs[0].id}`);
    process.exit(0);
  }

  // Verify organization exists
  const org = await prisma.organization.findUnique({
    where: { id: organizationId },
    select: { id: true, name: true },
  });

  if (!org) {
    console.error(`❌ Organization ${organizationId} not found`);
    process.exit(1);
  }

  console.log(`\n💾 Saving session for organization: ${org.name} (${org.id})\n`);

  // Determine session path
  // Try import session first (if exists), then integration session
  let sessionPath = customSessionPath;
  
  if (!sessionPath) {
    // Try import session first
    const importPath = path.join(
      '.whatsapp-sessions',
      `import-${organizationId}`,
      `session-import-${organizationId}`
    );
    
    // Try integration session
    const integrationPath = path.join(
      '.whatsapp-sessions',
      `org-${organizationId}`,
      `session-org-${organizationId}`
    );
    
    if (fs.existsSync(importPath)) {
      sessionPath = importPath;
      console.log(`📁 Found import session, using: ${sessionPath}`);
    } else if (fs.existsSync(integrationPath)) {
      sessionPath = integrationPath;
      console.log(`📁 Found integration session, using: ${sessionPath}`);
    } else {
      sessionPath = integrationPath; // Default to integration path
    }
  }

  console.log(`📁 Looking for session at: ${sessionPath}`);

  // Check if session directory exists
  if (!fs.existsSync(sessionPath)) {
    console.error(`❌ Session directory not found: ${sessionPath}`);
    console.log('\n💡 Tip: Make sure you have an active WhatsApp session.');
    console.log('   Run the import script first to create a session.');
    process.exit(1);
  }

  try {
    // Create temporary directory for compression
    const tempDir = path.join('.whatsapp-sessions', `temp-${Date.now()}`);
    const zipFileName = `session-org-${organizationId}.zip`;
    const zipFilePath = path.join('.whatsapp-sessions', zipFileName);

    // Copy session directory to temp (excluding unnecessary files)
    console.log('📦 Compressing session...');
    fs.mkdirSync(tempDir, { recursive: true });
    
    // Copy only required directories (same as RemoteAuth)
    const requiredDirs = ['Default', 'IndexedDB', 'Local Storage'];
    const sessionDirs = [tempDir, path.join(tempDir, 'Default')];
    
    // Copy Default directory structure
    const defaultPath = path.join(sessionPath, 'Default');
    if (fs.existsSync(defaultPath)) {
      fs.mkdirSync(path.join(tempDir, 'Default'), { recursive: true });
      const defaultFiles = fs.readdirSync(defaultPath);
      for (const file of defaultFiles) {
        if (requiredDirs.includes(file) || file.includes('Local Storage') || file.includes('IndexedDB')) {
          const src = path.join(defaultPath, file);
          const dest = path.join(tempDir, 'Default', file);
          if (fs.statSync(src).isDirectory()) {
            fs.cpSync(src, dest, { recursive: true });
          } else {
            fs.copyFileSync(src, dest);
          }
        }
      }
    }

    // Create ZIP archive
    const output = fs.createWriteStream(zipFilePath);
    const archive = archiver('zip', { zlib: { level: 9 } });

    return new Promise<void>((resolve, reject) => {
      archive.on('error', (err) => reject(err));
      output.on('close', async () => {
        try {
          // Read ZIP file as buffer
          const zipBuffer = fs.readFileSync(zipFilePath);
          const zipBase64 = zipBuffer.toString('base64');

          // Save to database
          console.log('💾 Saving to database...');
          await prisma.whatsAppSession.upsert({
            where: { organizationId },
            update: {
              sessionData: zipBase64,
              updatedAt: new Date(),
            },
            create: {
              id: `session-org-${organizationId}`,
              organizationId,
              sessionData: zipBase64,
            },
          });

          // Cleanup
          fs.unlinkSync(zipFilePath);
          fs.rmSync(tempDir, { recursive: true, force: true });

          console.log('\n✅ Session saved to database successfully!');
          console.log(`   Organization: ${org.name}`);
          console.log(`   Session ID: session-org-${organizationId}`);
          console.log(`   Size: ${(zipBuffer.length / 1024).toFixed(2)} KB`);
          console.log('\n💡 Next time you start WhatsApp client, it will use this session from database.');
          
          resolve();
        } catch (error) {
          reject(error);
        }
      });

      archive.pipe(output);
      archive.directory(tempDir, false);
      archive.finalize();
    });
  } catch (error) {
    console.error('\n❌ Error saving session:', error);
    if (error instanceof Error) {
      console.error('Stack:', error.stack);
    }
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main().catch(console.error);

