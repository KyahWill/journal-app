import {
  Controller,
  Get,
  Post,
  Body,
  Res,
  Req,
  Headers,
  Logger,
  UnauthorizedException,
  HttpCode,
  HttpStatus,
} from '@nestjs/common'
import { Response, Request } from 'express'
import { McpService } from './mcp.service'
import { ApiKeyService } from './api-key.service'

interface McpRequest {
  jsonrpc: '2.0'
  id: string | number
  method: string
  params?: any
}

interface McpResponse {
  jsonrpc: '2.0'
  id: string | number
  result?: any
  error?: {
    code: number
    message: string
    data?: any
  }
}

@Controller('mcp')
export class McpController {
  private readonly logger = new Logger(McpController.name)

  constructor(
    private readonly mcpService: McpService,
    private readonly apiKeyService: ApiKeyService,
  ) {}

  /**
   * SSE endpoint for MCP connections
   * ElevenLabs will connect to this endpoint to communicate with the MCP server
   */
  @Get('sse')
  async sseConnection(
    @Req() req: Request,
    @Res() res: Response,
    @Headers('authorization') authHeader: string,
    @Headers('x-api-key') apiKey: string,
  ) {
    // Authenticate the request
    const key = apiKey || authHeader?.replace('Bearer ', '')
    if (!key) {
      throw new UnauthorizedException('API key required')
    }

    const keyData = await this.apiKeyService.validateApiKey(key)
    if (!keyData) {
      throw new UnauthorizedException('Invalid API key')
    }

    const userId = keyData.user_id
    this.logger.log(`SSE connection established for user: ${userId}`)

    // Set SSE headers
    res.setHeader('Content-Type', 'text/event-stream')
    res.setHeader('Cache-Control', 'no-cache')
    res.setHeader('Connection', 'keep-alive')
    res.setHeader('Access-Control-Allow-Origin', '*')
    res.flushHeaders()

    // Send initial connection message
    const tools = this.mcpService.getTools()
    const initMessage = {
      jsonrpc: '2.0',
      method: 'initialize',
      params: {
        serverInfo: {
          name: 'journal-mcp-server',
          version: '1.0.0',
        },
        capabilities: {
          tools: {},
        },
        tools: tools,
      },
    }
    res.write(`data: ${JSON.stringify(initMessage)}\n\n`)

    // Handle client disconnect
    req.on('close', () => {
      this.logger.log(`SSE connection closed for user: ${userId}`)
    })

    // Keep connection alive with heartbeat
    const heartbeat = setInterval(() => {
      res.write(': heartbeat\n\n')
    }, 30000)

    req.on('close', () => {
      clearInterval(heartbeat)
    })
  }

  /**
   * HTTP endpoint for MCP JSON-RPC requests
   * This is an alternative to SSE for simpler request/response patterns
   */
  @Post('rpc')
  @HttpCode(HttpStatus.OK)
  async handleRpcRequest(
    @Body() body: McpRequest,
    @Headers('authorization') authHeader: string,
    @Headers('x-api-key') apiKey: string,
  ): Promise<McpResponse> {
    // Authenticate the request
    const key = apiKey || authHeader?.replace('Bearer ', '')
    if (!key) {
      return {
        jsonrpc: '2.0',
        id: body.id,
        error: {
          code: -32000,
          message: 'API key required',
        },
      }
    }

    const keyData = await this.apiKeyService.validateApiKey(key)
    if (!keyData) {
      return {
        jsonrpc: '2.0',
        id: body.id,
        error: {
          code: -32001,
          message: 'Invalid API key',
        },
      }
    }

    const userId = keyData.user_id

    try {
      switch (body.method) {
        case 'initialize':
          return {
            jsonrpc: '2.0',
            id: body.id,
            result: {
              serverInfo: {
                name: 'journal-mcp-server',
                version: '1.0.0',
              },
              capabilities: {
                tools: {},
              },
            },
          }

        case 'tools/list':
          return {
            jsonrpc: '2.0',
            id: body.id,
            result: {
              tools: this.mcpService.getTools(),
            },
          }

        case 'tools/call':
          const { name, arguments: args } = body.params
          const result = await this.mcpService.executeTool(name, args, userId)
          return {
            jsonrpc: '2.0',
            id: body.id,
            result: {
              content: [
                {
                  type: 'text',
                  text: JSON.stringify(result),
                },
              ],
            },
          }

        default:
          return {
            jsonrpc: '2.0',
            id: body.id,
            error: {
              code: -32601,
              message: `Method not found: ${body.method}`,
            },
          }
      }
    } catch (error) {
      this.logger.error(`Error handling RPC request:`, error)
      return {
        jsonrpc: '2.0',
        id: body.id,
        error: {
          code: -32603,
          message: error.message,
        },
      }
    }
  }

  /**
   * Health check endpoint for the MCP server
   */
  @Get('health')
  async healthCheck() {
    return {
      status: 'ok',
      server: 'journal-mcp-server',
      version: '1.0.0',
      timestamp: new Date().toISOString(),
    }
  }

  /**
   * Get available tools (public endpoint for discovery)
   */
  @Get('tools')
  async getTools() {
    return {
      tools: this.mcpService.getTools(),
    }
  }
}

