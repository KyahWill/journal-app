import { NestFactory } from '@nestjs/core'
import { ValidationPipe, Logger } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { AppModule } from './app.module'

async function bootstrap() {
  const logger = new Logger('Bootstrap')

  const app = await NestFactory.create(AppModule, {
    logger: ['log', 'error', 'warn', 'debug', 'verbose'],
  })

  const configService = app.get(ConfigService)

  // Enable CORS
  const corsOrigins = configService.get<string>('CORS_ORIGINS')?.split(',') || [
    'http://localhost:3000',
  ]

  app.enableCors({
    origin: corsOrigins,
    credentials: true,
  })

  // Global validation pipe
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
    }),
  )

  // Set global prefix
  const apiPrefix = configService.get<string>('API_PREFIX') || 'api/v1'
  app.setGlobalPrefix(apiPrefix)

  // Get port from env or default to 3001
  const port = configService.get<number>('PORT') || 3001

  await app.listen(port)

  logger.log(`🚀 Application is running on: http://localhost:${port}`)
  logger.log(`📡 API endpoint: http://localhost:${port}/${apiPrefix}`)
  logger.log(`🌐 CORS enabled for: ${corsOrigins.join(', ')}`)
}

bootstrap()

