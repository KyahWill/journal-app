import { Injectable, Logger, OnModuleInit } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { Server } from '@modelcontextprotocol/sdk/server/index.js'
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js'
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  Tool,
} from '@modelcontextprotocol/sdk/types.js'
import { GoalService } from '@/goal/goal.service'
import { JournalService } from '@/journal/journal.service'
import { CategoryService } from '@/category/category.service'
import { ApiKeyService } from './api-key.service'

// Tool definitions
const TOOLS: Tool[] = [
  {
    name: 'create_goal',
    description:
      'Create a new goal for the user. Use this when the user expresses something they want to achieve, a habit they want to build, or a target they are working toward.',
    inputSchema: {
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
        habit_frequency: {
          type: 'string',
          enum: ['daily', 'weekly', 'monthly'],
          description: 'Frequency for habit goals (required if is_habit is true)',
        },
      },
      required: ['title', 'category', 'target_date'],
    },
  },
  {
    name: 'create_journal_entry',
    description:
      'Create a journal entry for the user. Use this when the user shares reflections, experiences, emotional insights, or wants to log a conversation summary.',
    inputSchema: {
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
    inputSchema: {
      type: 'object',
      properties: {
        status: {
          type: 'string',
          enum: ['not_started', 'in_progress', 'completed', 'abandoned'],
          description: 'Filter by goal status (optional)',
        },
        category: {
          type: 'string',
          enum: ['career', 'health', 'personal', 'financial', 'relationships', 'learning', 'other'],
          description: 'Filter by category (optional)',
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
    inputSchema: {
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
  {
    name: 'get_categories',
    description: 'Get the list of available goal categories.',
    inputSchema: {
      type: 'object',
      properties: {},
      required: [],
    },
  },
]

@Injectable()
export class McpService implements OnModuleInit {
  private readonly logger = new Logger(McpService.name)
  private server: Server

  constructor(
    private readonly configService: ConfigService,
    private readonly goalService: GoalService,
    private readonly journalService: JournalService,
    private readonly categoryService: CategoryService,
    private readonly apiKeyService: ApiKeyService,
  ) {}

  async onModuleInit() {
    this.logger.log('MCP Service initialized')
  }

  /**
   * Create and configure a new MCP server instance
   */
  createServer(): Server {
    const server = new Server(
      {
        name: 'journal-mcp-server',
        version: '1.0.0',
      },
      {
        capabilities: {
          tools: {},
        },
      },
    )

    // Register tool listing handler
    server.setRequestHandler(ListToolsRequestSchema, async () => {
      return { tools: TOOLS }
    })

    // Register tool call handler
    server.setRequestHandler(CallToolRequestSchema, async (request) => {
      const { name, arguments: args } = request.params

      // Note: In SSE mode, userId will be passed via the request context
      // For now, we'll need to extract it from the connection
      const userId = (request as any).userId

      if (!userId) {
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify({ error: 'User authentication required' }),
            },
          ],
          isError: true,
        }
      }

      try {
        const result = await this.executeTool(name, args, userId)
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(result),
            },
          ],
        }
      } catch (error) {
        this.logger.error(`Error executing tool ${name}:`, error)
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify({ error: error.message }),
            },
          ],
          isError: true,
        }
      }
    })

    this.server = server
    return server
  }

  /**
   * Execute an MCP tool
   */
  async executeTool(toolName: string, args: any, userId: string): Promise<any> {
    this.logger.log(`Executing tool: ${toolName} for user: ${userId}`)

    switch (toolName) {
      case 'create_goal':
        return this.createGoal(userId, args)
      case 'create_journal_entry':
        return this.createJournalEntry(userId, args)
      case 'list_goals':
        return this.listGoals(userId, args)
      case 'list_journal_entries':
        return this.listJournalEntries(userId, args)
      case 'get_categories':
        return this.getCategories(userId)
      default:
        throw new Error(`Unknown tool: ${toolName}`)
    }
  }

  /**
   * Create a goal for the user
   */
  private async createGoal(
    userId: string,
    args: {
      title: string
      description?: string
      category: string
      target_date: string
      is_habit?: boolean
      habit_frequency?: string
    },
  ) {
    const goal = await this.goalService.createGoal(userId, {
      title: args.title,
      description: args.description,
      category: args.category,
      target_date: args.target_date,
      is_habit: args.is_habit,
      habit_frequency: args.habit_frequency as any,
    })

    return {
      success: true,
      message: `Goal "${goal.title}" created successfully`,
      goal: {
        id: goal.id,
        title: goal.title,
        category: goal.category,
        target_date: goal.target_date,
        status: goal.status,
      },
    }
  }

  /**
   * Create a journal entry for the user
   */
  private async createJournalEntry(
    userId: string,
    args: {
      title: string
      content: string
      mood?: string
      tags?: string[]
    },
  ) {
    const entry = await this.journalService.create(userId, {
      title: args.title,
      content: args.content,
      mood: args.mood,
      tags: args.tags,
    })

    return {
      success: true,
      message: `Journal entry "${entry.title}" created successfully`,
      entry: {
        id: entry.id,
        title: entry.title,
        created_at: entry.created_at,
      },
    }
  }

  /**
   * List goals for the user
   */
  private async listGoals(
    userId: string,
    args: {
      status?: string
      category?: string
      limit?: number
    },
  ) {
    const limit = args.limit || 10
    const result = await this.goalService.getGoals(
      userId,
      { status: args.status, category: args.category },
      limit,
    )

    return {
      goals: result.goals.map((goal) => ({
        id: goal.id,
        title: goal.title,
        description: goal.description,
        category: goal.category,
        status: goal.status,
        target_date: goal.target_date,
        progress_percentage: goal.progress_percentage,
        is_habit: goal.is_habit,
      })),
      total: result.goals.length,
    }
  }

  /**
   * List journal entries for the user
   */
  private async listJournalEntries(
    userId: string,
    args: {
      limit?: number
    },
  ) {
    const limit = args.limit || 10
    const entries = await this.journalService.getRecent(userId, limit)

    return {
      entries: entries.map((entry) => ({
        id: entry.id,
        title: entry.title,
        content: entry.content.substring(0, 200) + (entry.content.length > 200 ? '...' : ''),
        mood: entry.mood,
        tags: entry.tags,
        created_at: entry.created_at,
      })),
      total: entries.length,
    }
  }

  /**
   * Get available categories
   */
  private async getCategories(userId: string) {
    // Get all categories (both default and custom)
    const allCategories = await this.categoryService.getCategories(userId)

    const defaultCategories = allCategories.filter((cat) => cat.is_default)
    const customCategories = allCategories.filter((cat) => !cat.is_default)

    return {
      default_categories: defaultCategories.map((cat) => cat.name.toLowerCase()),
      custom_categories: customCategories.map((cat) => ({
        id: cat.id,
        name: cat.name,
        color: cat.color,
        icon: cat.icon,
      })),
    }
  }

  /**
   * Get the list of available tools
   */
  getTools(): Tool[] {
    return TOOLS
  }

  /**
   * Start the MCP server with stdio transport (for CLI usage)
   */
  async startStdioServer() {
    const server = this.createServer()
    const transport = new StdioServerTransport()
    await server.connect(transport)
    this.logger.log('MCP Server started with stdio transport')
  }
}

