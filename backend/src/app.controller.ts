import { Controller, Get, Param } from '@nestjs/common'
import { FirebaseService } from './firebase/firebase.service'

@Controller()
export class AppController {
  constructor(private readonly firebaseService: FirebaseService) {}

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

  @Get('diagnostics/database')
  async checkDatabase() {
    const connectionStatus = await this.firebaseService.checkDatabaseConnection()
    const databaseInfo = connectionStatus.connected 
      ? await this.firebaseService.getDatabaseInfo()
      : null

    return {
      timestamp: new Date().toISOString(),
      connection: connectionStatus,
      database: databaseInfo,
    }
  }

  @Get('diagnostics/collection/:name')
  async checkCollection(@Param('name') name: string) {
    const collectionStatus = await this.firebaseService.checkCollectionExists(name)
    
    return {
      timestamp: new Date().toISOString(),
      collectionName: name,
      status: collectionStatus,
    }
  }
}

