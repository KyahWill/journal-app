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
} from '@nestjs/common'
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

  @Get('prompts')
  async suggestPrompts(@CurrentUser() user: any) {
    return this.chatService.suggestPrompts(user.uid)
  }
}

