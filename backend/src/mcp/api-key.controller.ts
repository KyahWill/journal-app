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
  NotFoundException,
  BadRequestException,
} from '@nestjs/common'
import { ApiKeyService } from './api-key.service'
import { AuthGuard } from '@/common/guards/auth.guard'
import { CurrentUser } from '@/common/decorators/user.decorator'

class CreateApiKeyDto {
  name: string
}

class RenameApiKeyDto {
  name: string
}

@Controller('api-keys')
@UseGuards(AuthGuard)
export class ApiKeyController {
  constructor(private readonly apiKeyService: ApiKeyService) {}

  /**
   * Create a new API key
   */
  @Post()
  @HttpCode(HttpStatus.CREATED)
  async create(@CurrentUser() user: any, @Body() dto: CreateApiKeyDto) {
    if (!dto.name || dto.name.trim().length === 0) {
      throw new BadRequestException('API key name is required')
    }

    const result = await this.apiKeyService.createApiKey(user.uid, dto.name.trim())

    return {
      success: true,
      message: 'API key created successfully. Save this key now - it will not be shown again.',
      api_key: result,
    }
  }

  /**
   * List all API keys for the current user
   */
  @Get()
  async list(@CurrentUser() user: any) {
    const keys = await this.apiKeyService.getUserApiKeys(user.uid)

    return {
      api_keys: keys,
      total: keys.length,
    }
  }

  /**
   * Revoke (deactivate) an API key
   */
  @Patch(':id/revoke')
  @HttpCode(HttpStatus.OK)
  async revoke(@CurrentUser() user: any, @Param('id') keyId: string) {
    const success = await this.apiKeyService.revokeApiKey(user.uid, keyId)

    if (!success) {
      throw new NotFoundException('API key not found or you do not have permission to revoke it')
    }

    return {
      success: true,
      message: 'API key revoked successfully',
    }
  }

  /**
   * Rename an API key
   */
  @Patch(':id/rename')
  @HttpCode(HttpStatus.OK)
  async rename(
    @CurrentUser() user: any,
    @Param('id') keyId: string,
    @Body() dto: RenameApiKeyDto,
  ) {
    if (!dto.name || dto.name.trim().length === 0) {
      throw new BadRequestException('New name is required')
    }

    const success = await this.apiKeyService.renameApiKey(user.uid, keyId, dto.name.trim())

    if (!success) {
      throw new NotFoundException('API key not found or you do not have permission to rename it')
    }

    return {
      success: true,
      message: 'API key renamed successfully',
    }
  }

  /**
   * Delete an API key permanently
   */
  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  async delete(@CurrentUser() user: any, @Param('id') keyId: string) {
    const success = await this.apiKeyService.deleteApiKey(user.uid, keyId)

    if (!success) {
      throw new NotFoundException('API key not found or you do not have permission to delete it')
    }

    return {
      success: true,
      message: 'API key deleted successfully',
    }
  }
}

