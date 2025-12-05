/**
 * Add MCP Server to All ElevenLabs Agents
 *
 * This script fetches all existing ElevenLabs agents and adds the
 * MCP server ID to each one, enabling them to use the journal tools.
 *
 * Usage: npx ts-node -r tsconfig-paths/register scripts/add-mcp-to-agents.ts
 */

import * as dotenv from 'dotenv'
import * as readline from 'readline'

// Load environment variables
dotenv.config()

const ELEVENLABS_API_KEY = process.env.ELEVEN_LABS_API_KEY
const MCP_SERVER_ID = process.env.MCP_SERVER_ID
const MCP_SERVER_URL = process.env.MCP_SERVER_URL

interface ElevenLabsAgent {
  agent_id: string
  name: string
  conversation_config?: {
    agent?: {
      prompt?: {
        prompt?: string
      }
      first_message?: string
      language?: string
    }
    mcp_servers?: string[]
    client_tools?: any[]
  }
}

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

async function fetchAllAgents(): Promise<ElevenLabsAgent[]> {
  console.log('Fetching all ElevenLabs agents...')

  const response = await fetch('https://api.elevenlabs.io/v1/convai/agents', {
    method: 'GET',
    headers: {
      'xi-api-key': ELEVENLABS_API_KEY!,
    },
  })

  if (!response.ok) {
    const errorText = await response.text()
    throw new Error(`Failed to fetch agents: ${response.status} ${errorText}`)
  }

  const data = await response.json()
  return data.agents || []
}

async function addMcpToAgent(agent: ElevenLabsAgent, mcpServerId: string): Promise<boolean> {
  console.log(`  Updating agent: ${agent.name} (${agent.agent_id})...`)

  try {
    // Get current agent configuration
    const getResponse = await fetch(`https://api.elevenlabs.io/v1/convai/agents/${agent.agent_id}`, {
      method: 'GET',
      headers: {
        'xi-api-key': ELEVENLABS_API_KEY!,
      },
    })

    if (!getResponse.ok) {
      console.error(`    ❌ Failed to fetch agent details: ${getResponse.status}`)
      return false
    }

    const agentDetails = await getResponse.json()

    // Check if MCP server is already added
    const existingMcpServers = agentDetails.conversation_config?.mcp_servers || []
    if (existingMcpServers.includes(mcpServerId)) {
      console.log(`    ⏭️  MCP server already added, skipping`)
      return true
    }

    // Add MCP server to the list
    const updatedMcpServers = [...existingMcpServers, mcpServerId]

    // Update agent with MCP server
    const updatePayload = {
      conversation_config: {
        ...agentDetails.conversation_config,
        mcp_servers: updatedMcpServers,
      },
    }

    const updateResponse = await fetch(`https://api.elevenlabs.io/v1/convai/agents/${agent.agent_id}`, {
      method: 'PATCH',
      headers: {
        'xi-api-key': ELEVENLABS_API_KEY!,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(updatePayload),
    })

    if (!updateResponse.ok) {
      const errorText = await updateResponse.text()
      console.error(`    ❌ Failed to update agent: ${updateResponse.status} ${errorText}`)
      return false
    }

    console.log(`    ✅ MCP server added successfully`)
    return true
  } catch (error: any) {
    console.error(`    ❌ Error updating agent: ${error.message}`)
    return false
  }
}

async function addClientToolsToAgent(agent: ElevenLabsAgent, serverUrl: string, apiKey: string): Promise<boolean> {
  console.log(`  Updating agent with client tools: ${agent.name} (${agent.agent_id})...`)

  try {
    // Get current agent configuration
    const getResponse = await fetch(`https://api.elevenlabs.io/v1/convai/agents/${agent.agent_id}`, {
      method: 'GET',
      headers: {
        'xi-api-key': ELEVENLABS_API_KEY!,
      },
    })

    if (!getResponse.ok) {
      console.error(`    ❌ Failed to fetch agent details: ${getResponse.status}`)
      return false
    }

    const agentDetails = await getResponse.json()

    // Define client tools for the journal MCP server
    const journalClientTools = [
      {
        type: 'webhook',
        name: 'create_goal',
        description: 'Create a new goal for the user. Use this when the user expresses something they want to achieve.',
        webhook: {
          url: `${serverUrl}/rpc`,
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-api-key': apiKey,
          },
          body_template: JSON.stringify({
            jsonrpc: '2.0',
            id: '{{$randomUUID}}',
            method: 'tools/call',
            params: {
              name: 'create_goal',
              arguments: {
                title: '{{title}}',
                description: '{{description}}',
                category: '{{category}}',
                target_date: '{{target_date}}',
                is_habit: '{{is_habit}}',
              },
            },
          }),
        },
        parameters: {
          type: 'object',
          properties: {
            title: { type: 'string', description: 'Goal title' },
            description: { type: 'string', description: 'Goal description' },
            category: { type: 'string', enum: ['career', 'health', 'personal', 'financial', 'relationships', 'learning', 'other'] },
            target_date: { type: 'string', description: 'Target date (YYYY-MM-DD)' },
            is_habit: { type: 'boolean', description: 'Is this a habit?' },
          },
          required: ['title', 'category', 'target_date'],
        },
      },
      {
        type: 'webhook',
        name: 'create_journal_entry',
        description: 'Create a journal entry. Use this when the user shares reflections or wants to log something.',
        webhook: {
          url: `${serverUrl}/rpc`,
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-api-key': apiKey,
          },
          body_template: JSON.stringify({
            jsonrpc: '2.0',
            id: '{{$randomUUID}}',
            method: 'tools/call',
            params: {
              name: 'create_journal_entry',
              arguments: {
                title: '{{title}}',
                content: '{{content}}',
                mood: '{{mood}}',
                tags: '{{tags}}',
              },
            },
          }),
        },
        parameters: {
          type: 'object',
          properties: {
            title: { type: 'string', description: 'Entry title' },
            content: { type: 'string', description: 'Entry content' },
            mood: { type: 'string', description: 'Current mood' },
            tags: { type: 'array', items: { type: 'string' }, description: 'Tags' },
          },
          required: ['title', 'content'],
        },
      },
      {
        type: 'webhook',
        name: 'list_goals',
        description: "Get the user's goals to provide context for coaching.",
        webhook: {
          url: `${serverUrl}/rpc`,
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-api-key': apiKey,
          },
          body_template: JSON.stringify({
            jsonrpc: '2.0',
            id: '{{$randomUUID}}',
            method: 'tools/call',
            params: {
              name: 'list_goals',
              arguments: {
                status: '{{status}}',
                limit: '{{limit}}',
              },
            },
          }),
        },
        parameters: {
          type: 'object',
          properties: {
            status: { type: 'string', enum: ['not_started', 'in_progress', 'completed', 'abandoned'] },
            limit: { type: 'number', description: 'Max results (default: 10)' },
          },
          required: [],
        },
      },
    ]

    // Merge with existing client tools (avoid duplicates)
    const existingTools = agentDetails.conversation_config?.client_tools || []
    const existingToolNames = new Set(existingTools.map((t: any) => t.name))
    const newTools = journalClientTools.filter((t) => !existingToolNames.has(t.name))

    if (newTools.length === 0) {
      console.log(`    ⏭️  All client tools already added, skipping`)
      return true
    }

    const updatedTools = [...existingTools, ...newTools]

    // Update agent with client tools
    const updatePayload = {
      conversation_config: {
        ...agentDetails.conversation_config,
        client_tools: updatedTools,
      },
    }

    const updateResponse = await fetch(`https://api.elevenlabs.io/v1/convai/agents/${agent.agent_id}`, {
      method: 'PATCH',
      headers: {
        'xi-api-key': ELEVENLABS_API_KEY!,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(updatePayload),
    })

    if (!updateResponse.ok) {
      const errorText = await updateResponse.text()
      console.error(`    ❌ Failed to update agent: ${updateResponse.status} ${errorText}`)
      return false
    }

    console.log(`    ✅ Client tools added successfully (${newTools.length} new tools)`)
    return true
  } catch (error: any) {
    console.error(`    ❌ Error updating agent: ${error.message}`)
    return false
  }
}

async function main() {
  console.log('='.repeat(60))
  console.log('Add MCP Server to ElevenLabs Agents')
  console.log('='.repeat(60))
  console.log()

  if (!ELEVENLABS_API_KEY) {
    console.error('Error: ELEVEN_LABS_API_KEY is not set')
    process.exit(1)
  }

  // Check configuration
  let mcpServerId = MCP_SERVER_ID
  let serverUrl = MCP_SERVER_URL
  let useClientTools = false

  if (!mcpServerId) {
    console.log('MCP_SERVER_ID is not set in environment variables.')
    console.log()
    console.log('Options:')
    console.log('  1. Enter an MCP Server ID (if you have one)')
    console.log('  2. Use Client Tools/Webhooks instead (recommended)')
    console.log()

    const choice = await prompt('Choose option (1 or 2): ')

    if (choice === '1') {
      mcpServerId = await prompt('Enter MCP Server ID: ')
      if (!mcpServerId) {
        console.error('MCP Server ID is required')
        process.exit(1)
      }
    } else {
      useClientTools = true
      if (!serverUrl) {
        serverUrl = await prompt('Enter your backend MCP endpoint URL (e.g., https://api.yourdomain.com/mcp): ')
      }
    }
  }

  // Get user API key for client tools
  let userApiKey = ''
  if (useClientTools) {
    console.log()
    console.log('To use client tools, you need a user API key.')
    console.log('Generate one from your app settings or via the API.')
    userApiKey = await prompt('Enter user API key (jrnl_...): ')
    if (!userApiKey) {
      console.error('User API key is required for client tools')
      process.exit(1)
    }
  }

  try {
    // Fetch all agents
    const agents = await fetchAllAgents()

    if (agents.length === 0) {
      console.log('No agents found.')
      return
    }

    console.log(`Found ${agents.length} agent(s)`)
    console.log()

    // List agents
    agents.forEach((agent, index) => {
      console.log(`  ${index + 1}. ${agent.name} (${agent.agent_id})`)
    })
    console.log()

    // Confirm
    const confirm = await prompt(`Update all ${agents.length} agents? (y/n): `)
    if (confirm.toLowerCase() !== 'y') {
      console.log('Aborted.')
      return
    }

    console.log()
    console.log('Updating agents...')
    console.log()

    // Update each agent
    let successCount = 0
    let failCount = 0

    for (const agent of agents) {
      let success: boolean
      if (useClientTools) {
        success = await addClientToolsToAgent(agent, serverUrl!, userApiKey)
      } else {
        success = await addMcpToAgent(agent, mcpServerId!)
      }

      if (success) {
        successCount++
      } else {
        failCount++
      }
    }

    console.log()
    console.log('='.repeat(60))
    console.log('Summary')
    console.log('='.repeat(60))
    console.log(`  ✅ Successfully updated: ${successCount}`)
    console.log(`  ❌ Failed: ${failCount}`)
    console.log(`  📊 Total: ${agents.length}`)
    console.log()

    if (successCount > 0) {
      console.log('Your ElevenLabs agents can now create goals and journal entries!')
      console.log()
      console.log('Test by starting a conversation and saying something like:')
      console.log('  "I want to start exercising three times a week"')
      console.log('  "I had a great day today, let me tell you about it"')
    }
  } catch (error: any) {
    console.error('Error:', error.message)
    process.exit(1)
  }
}

main()

