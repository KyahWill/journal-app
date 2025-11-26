import {
  Controller,
  Get,
  Post,
  Delete,
  Patch,
  Body,
  Param,
  UseGuards,
  HttpCode,
  HttpStatus,
  Sse,
  MessageEvent,
  Res,
  Header,
} from '@nestjs/common'
import { Response } from 'express'
import { Observable } from 'rxjs'
import { ChatService } from './chat.service'
import { SendMessageDto, UpdateSessionTitleDto } from '@/common/dto/chat.dto'
import { AuthGuard } from '@/common/guards/auth.guard'
import { CurrentUser } from '@/common/decorators/user.decorator'

@Controller('chat')
@UseGuards(AuthGuard)
export class ChatController {
  constructor(private readonly chatService: ChatService) {}

  @Post('message')
  @HttpCode(HttpStatus.OK)
  async sendMessage(@CurrentUser() user: any, @Body() sendMessageDto: SendMessageDto) {
    return this.chatService.sendMessage(user.uid, sendMessageDto)
  }

  @Post('message/stream')
  @Header('Content-Type', 'text/event-stream')
  @Header('Cache-Control', 'no-cache')
  @Header('Connection', 'keep-alive')
  @Header('X-Accel-Buffering', 'no')
  async sendMessageStream(
    @CurrentUser() user: any,
    @Body() sendMessageDto: SendMessageDto,
    @Res() res: Response,
  ): Promise<void> {
    // Set SSE headers explicitly
    res.setHeader('Content-Type', 'text/event-stream')
    res.setHeader('Cache-Control', 'no-cache')
    res.setHeader('Connection', 'keep-alive')
    res.setHeader('X-Accel-Buffering', 'no')
    res.flushHeaders()
    
    try {
      for await (const data of this.chatService.sendMessageStream(user.uid, sendMessageDto)) {
        const sseData = `data: ${JSON.stringify(data)}\n\n`
        res.write(sseData)
      }
      
      res.end()
    } catch (error) {
      res.write(`data: ${JSON.stringify({ type: 'error', message: error.message })}\n\n`)
      res.end()
    }
  }

  @Post('session')
  @HttpCode(HttpStatus.CREATED)
  async createSession(@CurrentUser() user: any) {
    return this.chatService.createSession(user.uid)
  }

  @Get('sessions')
  async getAllSessions(@CurrentUser() user: any) {
    return this.chatService.getAllSessions(user.uid)
  }

  @Get('session/:id')
  async getSession(@CurrentUser() user: any, @Param('id') id: string) {
    return this.chatService.getSession(id, user.uid)
  }

  @Delete('session/:id')
  @HttpCode(HttpStatus.OK)
  async deleteSession(@CurrentUser() user: any, @Param('id') id: string) {
    return this.chatService.deleteSession(id, user.uid)
  }

  @Patch('session/:id/title')
  @HttpCode(HttpStatus.OK)
  async updateSessionTitle(
    @CurrentUser() user: any,
    @Param('id') id: string,
    @Body() updateSessionTitleDto: UpdateSessionTitleDto,
  ) {
    return this.chatService.updateSessionTitle(id, user.uid, updateSessionTitleDto.title)
  }

  @Get('insights')
  async generateInsights(@CurrentUser() user: any) {
    return this.chatService.generateInsights(user.uid)
  }

  @Sse('insights/stream')
  async generateInsightsStream(@CurrentUser() user: any): Promise<Observable<MessageEvent>> {
    return new Observable((subscriber) => {
      (async () => {
        try {
          for await (const event of this.chatService.generateInsightsStream(user.uid)) {
            subscriber.next({ data: JSON.stringify(event) } as MessageEvent)
          }
          subscriber.complete()
        } catch (error) {
          subscriber.error(error)
        }
      })()
    })
  }

  @Get('prompts')
  async suggestPrompts(@CurrentUser() user: any) {
    return this.chatService.suggestPrompts(user.uid)
  }

  @Post('suggest-goals')
  @HttpCode(HttpStatus.OK)
  async suggestGoals(@CurrentUser() user: any) {
    return this.chatService.suggestGoals(user.uid)
  }

  @Get('goal-insights/:goalId')
  async getGoalInsights(@CurrentUser() user: any, @Param('goalId') goalId: string) {
    return this.chatService.getGoalInsights(user.uid, goalId)
  }

  @Sse('goal-insights/:goalId/stream')
  async getGoalInsightsStream(
    @CurrentUser() user: any,
    @Param('goalId') goalId: string,
  ): Promise<Observable<MessageEvent>> {
    return new Observable((subscriber) => {
      (async () => {
        try {
          for await (const event of this.chatService.getGoalInsightsStream(user.uid, goalId)) {
            subscriber.next({ data: JSON.stringify(event) } as MessageEvent)
          }
          subscriber.complete()
        } catch (error) {
          subscriber.error(error)
        }
      })()
    })
  }
}

