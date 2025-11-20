import { Controller, Get } from '@nestjs/common'

@Controller()
export class AppController {
  @Get()
  getHealth() {
    return {
      status: 'ok',
      message: 'Journal Backend API is running',
      timestamp: new Date().toISOString(),
    }
  }

  @Get('health')
  getHealthCheck() {
    return {
      status: 'healthy',
      uptime: process.uptime(),
      timestamp: new Date().toISOString(),
    }
  }
}

