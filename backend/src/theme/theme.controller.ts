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
import { ThemeService } from './theme.service'
import { AuthGuard } from '@/common/guards/auth.guard'
import { CurrentUser } from '@/common/decorators/user.decorator'
import { CreateThemeDto, UpdateThemeDto, RecommendThemeDto } from '@/common/dto/theme.dto'
import { UserTheme } from '@/common/types/journal.types'

@Controller('theme')
@UseGuards(AuthGuard)
export class ThemeController {
  constructor(private readonly themeService: ThemeService) {}

  @Get()
  async getAllThemes(@CurrentUser() user: any): Promise<UserTheme[]> {
    return this.themeService.getAllThemes(user.uid)
  }

  @Get('default')
  async getDefaultTheme(@CurrentUser() user: any): Promise<UserTheme> {
    return this.themeService.getDefaultTheme(user.uid)
  }

  @Get('public/:id')
  async getPublicTheme(@Param('id') id: string): Promise<UserTheme> {
    return this.themeService.getPublicTheme(id)
  }

  @Get(':id')
  async getTheme(@Param('id') id: string, @CurrentUser() user: any): Promise<UserTheme> {
    return this.themeService.getTheme(id, user.uid)
  }

  @Post()
  async createTheme(
    @Body() createThemeDto: CreateThemeDto,
    @CurrentUser() user: any,
  ): Promise<UserTheme> {
    return this.themeService.createTheme(user.uid, createThemeDto)
  }

  @Post('recommend')
  async getRecommendations(
    @Body() recommendThemeDto: RecommendThemeDto,
    @CurrentUser() user: any,
  ): Promise<{ suggestions: string }> {
    return this.themeService.getRecommendations(user.uid, recommendThemeDto)
  }

  @Patch(':id')
  async updateTheme(
    @Param('id') id: string,
    @Body() updateThemeDto: UpdateThemeDto,
    @CurrentUser() user: any,
  ): Promise<UserTheme> {
    return this.themeService.updateTheme(id, user.uid, updateThemeDto)
  }

  @Patch(':id/set-default')
  async setAsDefault(@Param('id') id: string, @CurrentUser() user: any): Promise<UserTheme> {
    return this.themeService.setAsDefault(id, user.uid)
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  async deleteTheme(
    @Param('id') id: string,
    @CurrentUser() user: any,
  ): Promise<{ success: boolean; message: string }> {
    await this.themeService.deleteTheme(id, user.uid)
    return {
      success: true,
      message: 'Theme deleted successfully',
    }
  }
}

