import { Controller, Get, Post, Delete, Query, Res, UseGuards, Req, HttpStatus } from '@nestjs/common'
import { Response, Request } from 'express'
import { GoogleCalendarService } from './google-calendar.service'
import { AuthGuard } from '@/common/guards/auth.guard'
import { ConfigService } from '@nestjs/config'

@Controller('calendar')
export class GoogleCalendarController {
  constructor(
    private readonly calendarService: GoogleCalendarService,
    private readonly configService: ConfigService,
  ) {}

  /**
   * Get the Google Calendar connection status
   */
  @Get('status')
  @UseGuards(AuthGuard)
  async getStatus(@Req() req: Request) {
    const userId = (req as any).user.uid
    const connected = await this.calendarService.isConnected(userId)
    return { connected }
  }

  /**
   * Get the OAuth URL to connect Google Calendar
   */
  @Get('connect')
  @UseGuards(AuthGuard)
  async getConnectUrl(@Req() req: Request) {
    const userId = (req as any).user.uid
    const url = this.calendarService.getAuthUrl(userId)
    return { url }
  }

  /**
   * OAuth callback handler - redirects to frontend after processing
   */
  @Get('callback')
  async handleCallback(
    @Query('code') code: string,
    @Query('state') userId: string,
    @Query('error') error: string,
    @Res() res: Response,
  ) {
    const frontendUrl = this.configService.get<string>('FRONTEND_URL') || 'http://localhost:3000'
    
    if (error) {
      return res.redirect(`${frontendUrl}/app/settings?calendar_error=${encodeURIComponent(error)}`)
    }

    if (!code || !userId) {
      return res.redirect(`${frontendUrl}/app/settings?calendar_error=missing_params`)
    }

    try {
      await this.calendarService.handleOAuthCallback(code, userId)
      return res.redirect(`${frontendUrl}/app/settings?calendar_connected=true`)
    } catch (err) {
      return res.redirect(`${frontendUrl}/app/settings?calendar_error=connection_failed`)
    }
  }

  /**
   * Disconnect Google Calendar
   */
  @Delete('disconnect')
  @UseGuards(AuthGuard)
  async disconnect(@Req() req: Request) {
    const userId = (req as any).user.uid
    await this.calendarService.disconnect(userId)
    return { success: true, message: 'Google Calendar disconnected' }
  }
}

