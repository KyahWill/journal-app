/**
 * Migration: Convert user_prompts to coach_personalities
 * 
 * This migration script converts existing user_prompts to coach_personalities,
 * enabling the unified coach system that works for both text and voice coaching.
 * 
 * For each user_prompt, it creates a corresponding coach_personality with:
 * - The prompt text as the systemPrompt
 * 
 * Run with: npx ts-node -r tsconfig-paths/register src/firebase/migrations/migrate-prompts-to-personalities.ts
 */

import * as admin from 'firebase-admin';
import * as dotenv from 'dotenv';
import * as path from 'path';

// Load environment variables
dotenv.config({ path: path.join(__dirname, '../../../.env') });

// Initialize Firebase Admin
const serviceAccountKey = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;
const databaseId = process.env.FIREBASE_DATABASE_ID || '(default)';

if (!serviceAccountKey) {
  console.error('FIREBASE_SERVICE_ACCOUNT_KEY environment variable is not set');
  console.error('Make sure your .env file contains the Firebase service account JSON as a string.');
  process.exit(1);
}

let serviceAccount: admin.ServiceAccount;
try {
  serviceAccount = JSON.parse(serviceAccountKey);
} catch (parseError) {
  console.error('FIREBASE_SERVICE_ACCOUNT_KEY is not valid JSON.');
  console.error('Make sure to stringify the JSON to a single line (no line breaks).');
  process.exit(1);
}

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    projectId: (serviceAccount as any).project_id,
  });
}

const db = admin.firestore();

// Use custom database if specified
if (databaseId && databaseId !== '(default)') {
  console.log(`Using Firestore database: ${databaseId}`);
  db.settings({ databaseId });
}

interface UserPrompt {
  id: string;
  user_id: string;
  name: string;
  prompt_text: string;
  is_default: boolean;
  created_at: admin.firestore.Timestamp;
  updated_at: admin.firestore.Timestamp;
}

interface CoachPersonalityData {
  user_id: string;
  name: string;
  description: string;
  style: string;
  system_prompt: string;
  first_message: string;
  language: string;
  is_default: boolean;
  migrated_from_prompt_id?: string;
  created_at: admin.firestore.FieldValue;
  updated_at: admin.firestore.FieldValue;
}

const DEFAULT_FIRST_MESSAGE = "Hello! I'm your AI coach. How can I help you today?";

// Infer coaching style from prompt content
function inferStyle(promptText: string): string {
  const lowerPrompt = promptText.toLowerCase();
  
  if (lowerPrompt.includes('motivat') || lowerPrompt.includes('energetic') || lowerPrompt.includes('enthusiastic')) {
    return 'motivational';
  }
  if (lowerPrompt.includes('analytical') || lowerPrompt.includes('data') || lowerPrompt.includes('metrics')) {
    return 'analytical';
  }
  if (lowerPrompt.includes('direct') || lowerPrompt.includes('straightforward') || lowerPrompt.includes('no-nonsense')) {
    return 'direct';
  }
  if (lowerPrompt.includes('empathetic') || lowerPrompt.includes('compassionate') || lowerPrompt.includes('feelings')) {
    return 'empathetic';
  }
  
  // Default to supportive
  return 'supportive';
}

// Generate description from prompt name and content
function generateDescription(name: string, promptText: string): string {
  const style = inferStyle(promptText);
  return `${name} - A ${style} AI coach personality migrated from the prompts system.`;
}

async function migratePromptsToPersonalities(dryRun: boolean = true) {
  console.log(`\n🚀 Starting migration of user_prompts to coach_personalities`);
  console.log(`   Mode: ${dryRun ? 'DRY RUN (no changes will be made)' : 'LIVE'}\n`);

  try {
    // Get all user_prompts
    const promptsSnapshot = await db.collection('user_prompts').get();
    
    if (promptsSnapshot.empty) {
      console.log('No user_prompts found. Nothing to migrate.');
      return;
    }

    console.log(`Found ${promptsSnapshot.size} user_prompts to migrate.\n`);

    // Get existing coach_personalities to avoid duplicates
    const personalitiesSnapshot = await db.collection('coach_personalities').get();
    const existingMigrations = new Set<string>();
    
    personalitiesSnapshot.docs.forEach((doc) => {
      const data = doc.data();
      if (data.migrated_from_prompt_id) {
        existingMigrations.add(data.migrated_from_prompt_id);
      }
    });

    console.log(`Found ${existingMigrations.size} already migrated prompts.\n`);

    let migratedCount = 0;
    let skippedCount = 0;
    let errorCount = 0;

    for (const promptDoc of promptsSnapshot.docs) {
      const prompt = promptDoc.data() as Omit<UserPrompt, 'id'>;
      const promptId = promptDoc.id;

      // Skip if already migrated
      if (existingMigrations.has(promptId)) {
        console.log(`⏭️  Skipping "${prompt.name}" (${promptId}) - already migrated`);
        skippedCount++;
        continue;
      }

      try {
        const style = inferStyle(prompt.prompt_text);
        const description = generateDescription(prompt.name, prompt.prompt_text);

        const personalityData: CoachPersonalityData = {
          user_id: prompt.user_id,
          name: prompt.name,
          description,
          style,
          system_prompt: prompt.prompt_text,
          first_message: DEFAULT_FIRST_MESSAGE,
          language: 'en',
          is_default: prompt.is_default,
          migrated_from_prompt_id: promptId,
          created_at: admin.firestore.FieldValue.serverTimestamp(),
          updated_at: admin.firestore.FieldValue.serverTimestamp(),
        };

        console.log(`📝 Processing "${prompt.name}" (${promptId})`);
        console.log(`   User: ${prompt.user_id}`);
        console.log(`   Style inferred: ${style}`);
        console.log(`   Is default: ${prompt.is_default}`);

        if (!dryRun) {
          const docRef = await db.collection('coach_personalities').add(personalityData);
          console.log(`   ✅ Created coach_personality: ${docRef.id}`);
        } else {
          console.log(`   🔍 [DRY RUN] Would create coach_personality`);
        }

        migratedCount++;
        console.log('');
      } catch (error) {
        console.error(`   ❌ Error migrating "${prompt.name}" (${promptId}):`, error);
        errorCount++;
      }
    }

    console.log('\n📊 Migration Summary:');
    console.log(`   Total prompts: ${promptsSnapshot.size}`);
    console.log(`   Migrated: ${migratedCount}`);
    console.log(`   Skipped (already migrated): ${skippedCount}`);
    console.log(`   Errors: ${errorCount}`);

    if (dryRun) {
      console.log('\n⚠️  This was a DRY RUN. No changes were made.');
      console.log('   Run with --live to perform the actual migration.');
    } else {
      console.log('\n✅ Migration completed!');
      console.log('\nNext steps:');
      console.log('1. Verify the migrated personalities in Firestore');
      console.log('2. Test the unified coach system');
    }
  } catch (error) {
    console.error('\n❌ Migration failed:', error);
    process.exit(1);
  }
}

// Run migration
const args = process.argv.slice(2);
const isLive = args.includes('--live');

migratePromptsToPersonalities(!isLive).then(() => {
  process.exit(0);
});

