/**
 * Test script for DatabaseAuth
 * 
 * Tests that WhatsApp sessions are correctly saved to and restored from database.
 * 
 * Usage:
 *   npx tsx scripts/test-database-auth.ts <organizationId>
 * 
 * Example:
 *   npx tsx scripts/test-database-auth.ts 36b9d610-8ffb-419f-9a57-4df35afce40e
 */

import { config } from 'dotenv';
// @ts-ignore - qrcode-terminal doesn't have types
const qrcode = require('qrcode-terminal');
import { prisma } from '@soul-kg-crm/database';
import { DatabaseAuth } from '@soul-kg-crm/shared';

config();

async function main() {
  const organizationId = process.argv[2];

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

    console.log('\nUsage: npx tsx scripts/test-database-auth.ts <organizationId>');
    console.log(`Example: npx tsx scripts/test-database-auth.ts ${orgs[0].id}`);
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

  console.log(`\n🧪 Testing DatabaseAuth for organization: ${org.name} (${org.id})\n`);

  // Check if session already exists in DB
  const existingSession = await prisma.whatsAppSession.findUnique({
    where: { organizationId },
    select: { sessionData: true, status: true },
  });

  // Use the same clientId format as save script for consistency
  // This matches the session ID saved in database: session-org-${organizationId}
  const clientId = `org-${organizationId}`;
  
  // Detect Chrome executable path for macOS
  let executablePath: string | undefined;
  if (process.platform === 'darwin') {
    const chromePath = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
    const fs = require('fs');
    if (fs.existsSync(chromePath)) {
      executablePath = chromePath;
    }
  }

  const { Client } = await import('whatsapp-web.js');

  if (existingSession?.sessionData) {
    // CASE 1: Session exists - test restoration (NO QR should appear)
    console.log('✅ Found existing session in database');
    console.log(`   Status: ${existingSession.status}`);
    console.log(`   Size: ${(existingSession.sessionData.length / 1024).toFixed(2)} KB (base64)\n`);
    
    console.log('📱 Testing session restoration from database...');
    console.log('   Creating client with DatabaseAuth...');
    console.log('   ⚠️  QR code should NOT appear if session is valid!\n');
    
    const authStrategy = new DatabaseAuth(organizationId, clientId);
    const client = new Client({
      authStrategy,
      puppeteer: {
        headless: true,
        executablePath,
        args: [
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--disable-dev-shm-usage',
          '--disable-accelerated-2d-canvas',
          '--no-first-run',
          '--no-zygote',
          '--disable-gpu',
        ],
      },
      webVersionCache: {
        type: 'remote',
        remotePath: 'https://raw.githubusercontent.com/wppconnect-team/wa-version/main/html/2.3000.1017054665.html',
      },
    });

    let ready = false;

    client.on('qr', () => {
      console.log('\n❌ FAILED: QR code appeared - session was NOT restored from database!');
      console.log('   This means DatabaseAuth did not properly restore the session.');
      client.destroy().then(() => process.exit(1));
    });

    client.on('ready', async () => {
      ready = true;
      console.log('\n✅ SUCCESS: Client is ready WITHOUT QR code!');
      console.log('   ✅ Session was successfully restored from database');
      console.log('   ✅ DatabaseAuth works correctly!\n');
      
      await client.destroy();
      
      console.log('📊 Test Summary:');
      console.log('   ✅ Session restored from database');
      console.log('   ✅ No QR code required');
      console.log('   ✅ DatabaseAuth works correctly');
      
      process.exit(0);
    });

    client.on('auth_failure', (msg) => {
      console.log(`\n❌ FAILED: Auth failure: ${msg}`);
      console.log('   Session in database might be invalid or expired.');
      client.destroy().then(() => process.exit(1));
    });

    try {
      console.log('   Initializing client (should restore from DB, no QR needed)...');
      await client.initialize();
      
      // Wait up to 30 seconds for ready event
      await new Promise<void>((resolve, reject) => {
        const timeout = setTimeout(() => {
          if (!ready) {
            reject(new Error('Timeout waiting for client to be ready'));
          } else {
            resolve();
          }
        }, 30000);

        client.once('ready', () => {
          clearTimeout(timeout);
          resolve();
        });

        client.once('auth_failure', (msg) => {
          clearTimeout(timeout);
          reject(new Error(`Auth failure: ${msg}`));
        });
      });
    } catch (error) {
      console.error('\n❌ Error:', error);
      try {
        await client.destroy();
      } catch {
        // Ignore
      }
      process.exit(1);
    }
  } else {
    // CASE 2: No session - create new one, save it, then test restoration
    console.log('ℹ️  No existing session in database');
    console.log('   Will create new session, save it, then test restoration\n');
    
    console.log('📱 Step 1: Creating new session with DatabaseAuth...');
    
    const authStrategy = new DatabaseAuth(organizationId, clientId);
    const client = new Client({
      authStrategy,
      puppeteer: {
        headless: true,
        executablePath,
        args: [
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--disable-dev-shm-usage',
          '--disable-accelerated-2d-canvas',
          '--no-first-run',
          '--no-zygote',
          '--disable-gpu',
        ],
      },
      webVersionCache: {
        type: 'remote',
        remotePath: 'https://raw.githubusercontent.com/wppconnect-team/wa-version/main/html/2.3000.1017054665.html',
      },
    });

    let qrCodeReceived = false;
    let authenticated = false;
    let ready = false;

    client.on('qr', (qr) => {
      if (!qrCodeReceived) {
        qrCodeReceived = true;
        console.log('\n📱 QR Code received! Scan with WhatsApp:');
        qrcode.generate(qr, { small: true });
        console.log('\n⏳ Waiting for authentication... (you have 2 minutes)');
      }
    });

    client.on('authenticated', () => {
      authenticated = true;
      console.log('✅ Client authenticated!');
    });

    client.on('ready', async () => {
      ready = true;
      console.log('✅ Client is ready!');
      
      // Wait a bit for session to be saved
      console.log('\n⏳ Waiting 10 seconds for session to be saved to database...');
      await new Promise(resolve => setTimeout(resolve, 10000));

      // Check if session was saved to DB
      const savedSession = await prisma.whatsAppSession.findUnique({
        where: { organizationId },
        select: { sessionData: true, status: true, updatedAt: true },
      });

      if (savedSession?.sessionData) {
        console.log('\n✅ SUCCESS: Session saved to database!');
        console.log(`   Status: ${savedSession.status}`);
        console.log(`   Updated at: ${savedSession.updatedAt}`);
        console.log(`   Size: ${(savedSession.sessionData.length / 1024).toFixed(2)} KB (base64)`);
        
        // Step 2: Test restoration
        console.log('\n📱 Step 2: Testing session restoration...');
        console.log('   Disconnecting current client...');
        
        await client.destroy();
        
        console.log('   Creating new client with same DatabaseAuth...');
        console.log('   ⚠️  QR code should NOT appear now!\n');
        
        // Create new client instance - should restore from DB
        const authStrategy2 = new DatabaseAuth(organizationId, clientId);
        const client2 = new Client({
          authStrategy: authStrategy2,
          puppeteer: {
            headless: true,
            executablePath,
            args: [
              '--no-sandbox',
              '--disable-setuid-sandbox',
              '--disable-dev-shm-usage',
              '--disable-accelerated-2d-canvas',
              '--no-first-run',
              '--no-zygote',
              '--disable-gpu',
            ],
          },
          webVersionCache: {
            type: 'remote',
            remotePath: 'https://raw.githubusercontent.com/wppconnect-team/wa-version/main/html/2.3000.1017054665.html',
          },
        });

        let restored = false;

        client2.on('ready', () => {
          restored = true;
          console.log('\n✅ SUCCESS: Session restored from database!');
          console.log('   Client is ready without QR code scan!');
          
          client2.destroy().then(() => {
            console.log('\n✅ Test completed successfully!');
            console.log('\n📊 Summary:');
            console.log('   ✅ Session saved to database');
            console.log('   ✅ Session restored from database');
            console.log('   ✅ No QR code required on second connection');
            console.log('   ✅ DatabaseAuth works correctly');
            process.exit(0);
          });
        });

        client2.on('qr', () => {
          console.log('\n❌ FAILED: QR code requested - session was NOT restored!');
          client2.destroy().then(() => process.exit(1));
        });

        client2.on('auth_failure', (msg) => {
          console.log(`\n❌ FAILED: Auth failure: ${msg}`);
          client2.destroy().then(() => process.exit(1));
        });

        console.log('   Initializing client (should restore from DB, no QR needed)...');
        await client2.initialize();

        // Wait up to 30 seconds for ready event
        await new Promise<void>((resolve, reject) => {
          const timeout = setTimeout(() => {
            if (!restored) {
              reject(new Error('Timeout waiting for client to be ready'));
            } else {
              resolve();
            }
          }, 30000);

          client2.once('ready', () => {
            clearTimeout(timeout);
            resolve();
          });

          client2.once('auth_failure', (msg) => {
            clearTimeout(timeout);
            reject(new Error(`Auth failure: ${msg}`));
          });
        });
      } else {
        console.log('\n❌ FAILED: Session was NOT saved to database!');
        await client.destroy();
        process.exit(1);
      }
    });

    client.on('auth_failure', (msg) => {
      console.error(`\n❌ Authentication failure: ${msg}`);
      process.exit(1);
    });

    client.on('disconnected', (reason) => {
      console.log(`\n⚠️  Client disconnected: ${reason}`);
    });

    // Initialize client
    try {
      await client.initialize();
      
      // Wait for authentication (up to 2 minutes)
      if (!authenticated && !ready) {
        console.log('⏳ Waiting for authentication...');
        await new Promise<void>((resolve, reject) => {
          const timeout = setTimeout(() => {
            if (!ready) {
              reject(new Error('Timeout waiting for authentication'));
            } else {
              resolve();
            }
          }, 120000); // 2 minutes

          client.once('ready', () => {
            clearTimeout(timeout);
            resolve();
          });

          client.once('auth_failure', (msg) => {
            clearTimeout(timeout);
            reject(new Error(`Auth failure: ${msg}`));
          });
        });
      }
    } catch (error) {
      console.error('\n❌ Error initializing client:', error);
      try {
        await client.destroy();
      } catch {
        // Ignore destroy errors
      }
      process.exit(1);
    }
  }
}

main().catch(async (error) => {
  console.error('\n❌ Unhandled error:', error);
  await prisma.$disconnect();
  process.exit(1);
});

