/**
 * Script: Generate ElevenLabs Agents for Coach Personalities
 * 
 * This script creates ElevenLabs conversational AI agents for all coach_personalities
 * that don't already have an elevenlabs_agent_id.
 * 
 * Run with: npx ts-node -r tsconfig-paths/register src/firebase/migrations/generate-elevenlabs-agents.ts
 * 
 * Options:
 *   --live     Actually create agents (default is dry run)
 *   --limit N  Only process N personalities (useful for testing)
 */

import * as admin from 'firebase-admin';
import * as dotenv from 'dotenv';
import * as path from 'path';

// Load environment variables
dotenv.config({ path: path.join(__dirname, '../../../.env') });

// Initialize Firebase Admin
const serviceAccountKey = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;
const databaseId = process.env.FIREBASE_DATABASE_ID || '(default)';
const elevenLabsApiKey = process.env.ELEVEN_LABS_API_KEY;

if (!serviceAccountKey) {
  console.error('❌ FIREBASE_SERVICE_ACCOUNT_KEY environment variable is not set');
  process.exit(1);
}

if (!elevenLabsApiKey) {
  console.error('❌ ELEVEN_LABS_API_KEY environment variable is not set');
  process.exit(1);
}

let serviceAccount: admin.ServiceAccount;
try {
  serviceAccount = JSON.parse(serviceAccountKey);
} catch (parseError) {
  console.error('❌ FIREBASE_SERVICE_ACCOUNT_KEY is not valid JSON.');
  process.exit(1);
}

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    projectId: (serviceAccount as any).project_id,
  });
}

const db = admin.firestore();

if (databaseId && databaseId !== '(default)') {
  console.log(`Using Firestore database: ${databaseId}`);
  db.settings({ databaseId });
}

// Default voice settings
const DEFAULT_VOICE_ID = 'pNInz6obpgDQGcFmaJgB'; // Adam voice
const DEFAULT_VOICE_STABILITY = 0.5;
const DEFAULT_VOICE_SIMILARITY_BOOST = 0.75;
const DEFAULT_FIRST_MESSAGE = "Hello! I'm your AI coach. How can I help you today?";

interface CoachPersonality {
  id: string;
  user_id: string;
  name: string;
  description?: string;
  style?: string;
  system_prompt: string;
  voice_id?: string;
  voice_stability?: number;
  voice_similarity_boost?: number;
  first_message?: string;
  language?: string;
  elevenlabs_agent_id?: string;
}

interface CreateAgentConfig {
  name: string;
  prompt: string;
  firstMessage?: string;
  language?: string;
  voiceId?: string;
  voiceStability?: number;
  voiceSimilarityBoost?: number;
}

/**
 * Create an ElevenLabs conversational AI agent
 */
async function createElevenLabsAgent(config: CreateAgentConfig): Promise<string> {
  const agentPayload = {
    name: config.name,
    conversation_config: {
      agent: {
        prompt: {
          prompt: config.prompt,
        },
        first_message: config.firstMessage || DEFAULT_FIRST_MESSAGE,
        language: config.language || 'en',
        tts: {
          voice_id: config.voiceId || DEFAULT_VOICE_ID,
          model_id: 'eleven_turbo_v2_5',
          stability: config.voiceStability ?? DEFAULT_VOICE_STABILITY,
          similarity_boost: config.voiceSimilarityBoost ?? DEFAULT_VOICE_SIMILARITY_BOOST,
        },
      },
    },
  };

  const response = await fetch('https://api.elevenlabs.io/v1/convai/agents/create', {
    method: 'POST',
    headers: {
      'xi-api-key': elevenLabsApiKey!,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(agentPayload),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`ElevenLabs API error: ${response.status} ${response.statusText} - ${errorText}`);
  }

  const data = await response.json();
  
  if (!data.agent_id) {
    throw new Error('Agent creation succeeded but no agent_id returned');
  }

  return data.agent_id;
}

/**
 * Sleep helper for rate limiting
 */
function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Main function to generate agents for personalities without one
 */
async function generateAgentsForPersonalities(dryRun: boolean = true, limit?: number) {
  console.log('\n🚀 Generate ElevenLabs Agents for Coach Personalities');
  console.log(`   Mode: ${dryRun ? 'DRY RUN (no changes will be made)' : 'LIVE'}`);
  if (limit) {
    console.log(`   Limit: ${limit} personalities`);
  }
  console.log('');

  try {
    // Query all coach_personalities without an elevenlabs_agent_id
    let query = db.collection('coach_personalities')
      .where('elevenlabs_agent_id', '==', null);

    // Note: Firestore doesn't support querying for missing fields directly,
    // so we'll filter in code
    const snapshot = await db.collection('coach_personalities').get();
    
    // Filter personalities without agent ID
    const personalitiesWithoutAgent: CoachPersonality[] = [];
    
    snapshot.docs.forEach((doc) => {
      const data = doc.data();
      if (!data.elevenlabs_agent_id) {
        personalitiesWithoutAgent.push({
          id: doc.id,
          user_id: data.user_id,
          name: data.name,
          description: data.description,
          style: data.style,
          system_prompt: data.system_prompt,
          voice_id: data.voice_id,
          voice_stability: data.voice_stability,
          voice_similarity_boost: data.voice_similarity_boost,
          first_message: data.first_message,
          language: data.language,
        });
      }
    });

    if (personalitiesWithoutAgent.length === 0) {
      console.log('✅ All coach personalities already have ElevenLabs agents!');
      return;
    }

    console.log(`Found ${personalitiesWithoutAgent.length} personalities without ElevenLabs agents.\n`);

    // Apply limit if specified
    const toProcess = limit 
      ? personalitiesWithoutAgent.slice(0, limit)
      : personalitiesWithoutAgent;

    let successCount = 0;
    let errorCount = 0;

    for (let i = 0; i < toProcess.length; i++) {
      const personality = toProcess[i];
      
      console.log(`[${i + 1}/${toProcess.length}] Processing "${personality.name}" (${personality.id})`);
      console.log(`    User: ${personality.user_id}`);

      try {
        const agentConfig: CreateAgentConfig = {
          name: personality.name,
          prompt: personality.system_prompt,
          firstMessage: personality.first_message || DEFAULT_FIRST_MESSAGE,
          language: personality.language || 'en',
          voiceId: personality.voice_id || DEFAULT_VOICE_ID,
          voiceStability: personality.voice_stability ?? DEFAULT_VOICE_STABILITY,
          voiceSimilarityBoost: personality.voice_similarity_boost ?? DEFAULT_VOICE_SIMILARITY_BOOST,
        };

        if (dryRun) {
          console.log(`    🔍 [DRY RUN] Would create agent with config:`);
          console.log(`       Voice ID: ${agentConfig.voiceId}`);
          console.log(`       Language: ${agentConfig.language}`);
          console.log(`       Prompt length: ${agentConfig.prompt.length} chars`);
        } else {
          // Create the agent
          console.log(`    ⏳ Creating ElevenLabs agent...`);
          const agentId = await createElevenLabsAgent(agentConfig);
          
          // Update the personality with the agent ID
          await db.collection('coach_personalities').doc(personality.id).update({
            elevenlabs_agent_id: agentId,
            updated_at: admin.firestore.FieldValue.serverTimestamp(),
          });
          
          console.log(`    ✅ Agent created: ${agentId}`);
        }

        successCount++;

        // Rate limiting: wait 1 second between API calls to avoid hitting limits
        if (!dryRun && i < toProcess.length - 1) {
          console.log(`    ⏸️  Waiting 1s (rate limiting)...`);
          await sleep(1000);
        }
      } catch (error: any) {
        console.error(`    ❌ Error: ${error.message}`);
        errorCount++;
        
        // If we hit a rate limit, wait longer
        if (error.message.includes('429') || error.message.toLowerCase().includes('rate')) {
          console.log(`    ⏸️  Rate limited, waiting 60s...`);
          await sleep(60000);
        }
      }

      console.log('');
    }

    // Summary
    console.log('\n📊 Summary:');
    console.log(`   Total without agents: ${personalitiesWithoutAgent.length}`);
    console.log(`   Processed: ${toProcess.length}`);
    console.log(`   Success: ${successCount}`);
    console.log(`   Errors: ${errorCount}`);

    if (dryRun) {
      console.log('\n⚠️  This was a DRY RUN. No changes were made.');
      console.log('   Run with --live to actually create agents.');
    } else {
      console.log('\n✅ Agent generation completed!');
    }

  } catch (error) {
    console.error('\n❌ Script failed:', error);
    process.exit(1);
  }
}

// Parse command line arguments
const args = process.argv.slice(2);
const isLive = args.includes('--live');
const limitIndex = args.indexOf('--limit');
const limit = limitIndex !== -1 ? parseInt(args[limitIndex + 1], 10) : undefined;

// Run the script
generateAgentsForPersonalities(!isLive, limit).then(() => {
  process.exit(0);
});

