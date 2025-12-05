/**
 * Register MCP Server with ElevenLabs
 *
 * This script registers the Journal MCP server with ElevenLabs
 * and outputs the mcp-server-id to be used for agent configuration.
 *
 * Usage: npx ts-node -r tsconfig-paths/register scripts/register-mcp-server.ts
 */

import * as dotenv from 'dotenv'
import * as fs from 'fs'
import * as path from 'path'
import * as readline from 'readline'

// Load environment variables
dotenv.config()

const ELEVENLABS_API_KEY = process.env.ELEVEN_LABS_API_KEY
const MCP_SERVER_URL = process.env.MCP_SERVER_URL || 'https://your-backend-url.com/mcp'
const MCP_SERVER_SECRET = process.env.MCP_SERVER_SECRET

interface McpServerConfig {
  name: string
  description: string
  server_url: string
  auth_type: 'none' | 'api_key' | 'bearer'
  auth_secret?: string
  tools: McpToolConfig[]
}

interface McpToolConfig {
  name: string
  description: string
  parameters: {
    type: string
    properties: Record<string, any>
    required: string[]
  }
}

const MCP_TOOLS: McpToolConfig[] = [
  {
    name: 'create_goal',
    description:
      'Create a new goal for the user. Use this when the user expresses something they want to achieve, a habit they want to build, or a target they are working toward.',
    parameters: {
      type: 'object',
      properties: {
        title: {
          type: 'string',
          description: 'Short, actionable goal title (3-200 characters)',
        },
        description: {
          type: 'string',
          description: 'Detailed description of the goal (optional, max 2000 characters)',
        },
        category: {
          type: 'string',
          enum: ['career', 'health', 'personal', 'financial', 'relationships', 'learning', 'other'],
          description: 'Category of the goal',
        },
        target_date: {
          type: 'string',
          description: 'Target completion date in ISO format (YYYY-MM-DD)',
        },
        is_habit: {
          type: 'boolean',
          description: 'Whether this is a recurring habit (default: false)',
        },
      },
      required: ['title', 'category', 'target_date'],
    },
  },
  {
    name: 'create_journal_entry',
    description:
      'Create a journal entry for the user. Use this when the user shares reflections, experiences, emotional insights, or wants to log a conversation summary.',
    parameters: {
      type: 'object',
      properties: {
        title: {
          type: 'string',
          description: 'Title of the journal entry',
        },
        content: {
          type: 'string',
          description: 'Content of the journal entry',
        },
        mood: {
          type: 'string',
          description: 'Current mood (optional)',
        },
        tags: {
          type: 'array',
          items: { type: 'string' },
          description: 'Tags for categorizing the entry (optional)',
        },
      },
      required: ['title', 'content'],
    },
  },
  {
    name: 'list_goals',
    description:
      "Get the user's goals. Use this to understand what the user is currently working on and provide relevant context for coaching.",
    parameters: {
      type: 'object',
      properties: {
        status: {
          type: 'string',
          enum: ['not_started', 'in_progress', 'completed', 'abandoned'],
          description: 'Filter by goal status (optional)',
        },
        limit: {
          type: 'number',
          description: 'Maximum number of goals to return (default: 10)',
        },
      },
      required: [],
    },
  },
  {
    name: 'list_journal_entries',
    description:
      "Get the user's recent journal entries. Use this to understand the user's recent thoughts, moods, and reflections.",
    parameters: {
      type: 'object',
      properties: {
        limit: {
          type: 'number',
          description: 'Maximum number of entries to return (default: 10)',
        },
      },
      required: [],
    },
  },
]

async function prompt(question: string): Promise<string> {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  })

  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      rl.close()
      resolve(answer.trim())
    })
  })
}

async function registerMcpServer(): Promise<string> {
  console.log('='.repeat(60))
  console.log('ElevenLabs MCP Server Registration')
  console.log('='.repeat(60))
  console.log()

  if (!ELEVENLABS_API_KEY) {
    throw new Error('ELEVEN_LABS_API_KEY is not set in environment variables')
  }

  // Get server URL
  let serverUrl = MCP_SERVER_URL
  if (!serverUrl || serverUrl === 'https://your-backend-url.com/mcp') {
    serverUrl = await prompt('Enter your MCP server URL (e.g., https://api.yourdomain.com/mcp): ')
  }
  console.log(`Server URL: ${serverUrl}`)

  // Get server secret
  let serverSecret = MCP_SERVER_SECRET
  if (!serverSecret) {
    serverSecret = await prompt('Enter MCP server secret (or leave empty for no auth): ')
  }

  const mcpConfig: McpServerConfig = {
    name: 'Journal MCP Server',
    description: 'MCP server for creating goals and journal entries from voice conversations',
    server_url: serverUrl,
    auth_type: serverSecret ? 'api_key' : 'none',
    auth_secret: serverSecret || undefined,
    tools: MCP_TOOLS,
  }

  console.log()
  console.log('Registering MCP server with ElevenLabs...')
  console.log()

  try {
    // Register the MCP server with ElevenLabs
    // Note: The actual ElevenLabs API endpoint may vary
    // Check ElevenLabs documentation for the correct endpoint
    const response = await fetch('https://api.elevenlabs.io/v1/convai/mcp-servers', {
      method: 'POST',
      headers: {
        'xi-api-key': ELEVENLABS_API_KEY,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(mcpConfig),
    })

    if (!response.ok) {
      const errorText = await response.text()
      let errorData: any
      try {
        errorData = JSON.parse(errorText)
      } catch {
        errorData = { raw: errorText }
      }

      // Check if MCP servers API is not available
      if (response.status === 404) {
        console.log()
        console.log('Note: The ElevenLabs MCP server registration API may not be available.')
        console.log('You may need to:')
        console.log('  1. Register the MCP server manually in the ElevenLabs dashboard')
        console.log('  2. Or use Client Tools/Webhooks instead')
        console.log()
        console.log('Manual registration steps:')
        console.log('  1. Go to https://elevenlabs.io/app/conversational-ai')
        console.log('  2. Navigate to Settings > Integrations > MCP Servers')
        console.log('  3. Click "Add Custom MCP Server"')
        console.log(`  4. Enter Name: ${mcpConfig.name}`)
        console.log(`  5. Enter Server URL: ${mcpConfig.server_url}`)
        console.log(`  6. Enter Secret Token: ${mcpConfig.auth_secret || '(none)'}`)
        console.log('  7. Save and copy the MCP Server ID')
        console.log()

        const manualId = await prompt('Enter the MCP Server ID from the dashboard (or press Enter to skip): ')
        if (manualId) {
          return manualId
        }
        throw new Error('MCP Server ID required')
      }

      throw new Error(`Failed to register MCP server: ${response.status} ${response.statusText}\n${JSON.stringify(errorData, null, 2)}`)
    }

    const data = await response.json()
    const mcpServerId = data.mcp_server_id || data.id

    console.log('✅ MCP server registered successfully!')
    console.log()
    console.log(`MCP Server ID: ${mcpServerId}`)

    return mcpServerId
  } catch (error: any) {
    if (error.message.includes('MCP Server ID required')) {
      throw error
    }
    console.error('Error registering MCP server:', error.message)
    throw error
  }
}

async function updateEnvFile(mcpServerId: string) {
  const envPath = path.join(__dirname, '..', '.env')

  let envContent = ''
  if (fs.existsSync(envPath)) {
    envContent = fs.readFileSync(envPath, 'utf8')
  }

  // Update or add MCP_SERVER_ID
  if (envContent.includes('MCP_SERVER_ID=')) {
    envContent = envContent.replace(/MCP_SERVER_ID=.*/, `MCP_SERVER_ID=${mcpServerId}`)
  } else {
    envContent += `\n# MCP Server Configuration\nMCP_SERVER_ID=${mcpServerId}\n`
  }

  fs.writeFileSync(envPath, envContent)
  console.log('✅ Updated .env file with MCP_SERVER_ID')
}

async function main() {
  try {
    const mcpServerId = await registerMcpServer()

    // Update .env file
    const shouldUpdate = await prompt('\nUpdate .env file with MCP_SERVER_ID? (y/n): ')
    if (shouldUpdate.toLowerCase() === 'y') {
      await updateEnvFile(mcpServerId)
    }

    console.log()
    console.log('='.repeat(60))
    console.log('Next Steps:')
    console.log('='.repeat(60))
    console.log()
    console.log('1. Run the agent update script to add MCP to all agents:')
    console.log('   npx ts-node -r tsconfig-paths/register scripts/add-mcp-to-agents.ts')
    console.log()
    console.log('2. Ensure your backend is deployed and accessible at:')
    console.log(`   ${process.env.MCP_SERVER_URL || 'https://your-backend-url.com/mcp'}`)
    console.log()
    console.log('3. Test the MCP server:')
    console.log('   curl -X GET https://your-backend-url.com/mcp/health')
    console.log()
  } catch (error: any) {
    console.error('Failed to register MCP server:', error.message)
    process.exit(1)
  }
}

main()

