import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common'
import { PromptService } from './prompt.service'
import { GeminiService } from '@/gemini/gemini.service'
import { CreatePromptDto, UpdatePromptDto, ImprovePromptDto } from '@/common/dto/prompt.dto'
import { AuthGuard } from '@/common/guards/auth.guard'
import { CurrentUser } from '@/common/decorators/user.decorator'

@Controller('prompt')
@UseGuards(AuthGuard)
export class PromptController {
  constructor(
    private readonly promptService: PromptService,
    private readonly geminiService: GeminiService,
  ) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async createPrompt(@CurrentUser() user: any, @Body() createPromptDto: CreatePromptDto) {
    return this.promptService.createPrompt(user.uid, createPromptDto)
  }

  @Get()
  async getAllPrompts(@CurrentUser() user: any) {
    return this.promptService.getAllPrompts(user.uid)
  }

  @Get('default')
  async getDefaultPrompt(@CurrentUser() user: any) {
    return this.promptService.getDefaultPrompt(user.uid)
  }

  @Get(':id')
  async getPrompt(@CurrentUser() user: any, @Param('id') id: string) {
    return this.promptService.getPrompt(id, user.uid)
  }

  @Patch(':id')
  @HttpCode(HttpStatus.OK)
  async updatePrompt(
    @CurrentUser() user: any,
    @Param('id') id: string,
    @Body() updatePromptDto: UpdatePromptDto,
  ) {
    return this.promptService.updatePrompt(id, user.uid, updatePromptDto)
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  async deletePrompt(@CurrentUser() user: any, @Param('id') id: string) {
    await this.promptService.deletePrompt(id, user.uid)
    return { success: true, message: 'Prompt deleted successfully' }
  }

  @Patch(':id/set-default')
  @HttpCode(HttpStatus.OK)
  async setAsDefault(@CurrentUser() user: any, @Param('id') id: string) {
    return this.promptService.setAsDefault(id, user.uid)
  }

  @Post('improve')
  @HttpCode(HttpStatus.OK)
  async improvePrompt(@CurrentUser() user: any, @Body() improvePromptDto: ImprovePromptDto) {
    return this.geminiService.analyzePrompt(improvePromptDto.prompt_text)
  }
}

