import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
  Logger,
} from '@nestjs/common'
import { JournalService } from './journal.service'
import { CreateJournalDto, UpdateJournalDto } from '@/common/dto/journal.dto'
import { AuthGuard } from '@/common/guards/auth.guard'
import { CurrentUser, EncryptionKey } from '@/common/decorators/user.decorator'

@Controller('journal')
@UseGuards(AuthGuard)
export class JournalController {
  private readonly logger = new Logger(JournalController.name)

  constructor(private readonly journalService: JournalService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async create(
    @CurrentUser() user: any,
    @Body() createJournalDto: CreateJournalDto,
    @EncryptionKey() encryptionKey?: Buffer,
  ) {
    return this.journalService.create(user.uid, createJournalDto, encryptionKey)
  }

  @Get()
  async findAll(
    @CurrentUser() user: any,
    @Query('limit') limit?: string,
    @Query('cursor') cursor?: string,
    @EncryptionKey() encryptionKey?: Buffer,
  ) {
    const parsedLimit = limit ? parseInt(limit, 10) : undefined
    this.logger.log(`[findAll] Request - userId: ${user.uid}, limit: ${parsedLimit}, cursor: ${cursor || 'null'}`)
    const result = await this.journalService.findAll(user.uid, parsedLimit, cursor, encryptionKey)
    this.logger.log(`[findAll] Response - entries: ${result.entries.length}, nextCursor: ${result.nextCursor || 'null'}`)
    return result
  }

  @Get('recent')
  async getRecent(
    @CurrentUser() user: any,
    @Query('limit') limit?: string,
    @EncryptionKey() encryptionKey?: Buffer,
  ) {
    const limitNum = limit ? parseInt(limit, 10) : 10
    return this.journalService.getRecent(user.uid, limitNum, encryptionKey)
  }

  @Get('search')
  async search(
    @CurrentUser() user: any,
    @Query('q') searchTerm: string,
    @EncryptionKey() encryptionKey?: Buffer,
  ) {
    return this.journalService.search(user.uid, searchTerm, encryptionKey)
  }

  @Get('grouped')
  async findAllGroupedByDate(
    @CurrentUser() user: any,
    @Query('limit') limit?: string,
    @Query('cursor') cursor?: string,
    @EncryptionKey() encryptionKey?: Buffer,
  ) {
    const parsedLimit = limit ? parseInt(limit, 10) : undefined
    return this.journalService.findAllGroupedByDate(user.uid, parsedLimit, cursor, encryptionKey)
  }

  @Get(':id')
  async findOne(
    @CurrentUser() user: any,
    @Param('id') id: string,
    @EncryptionKey() encryptionKey?: Buffer,
  ) {
    return this.journalService.findOne(id, user.uid, encryptionKey)
  }

  @Put(':id')
  async update(
    @CurrentUser() user: any,
    @Param('id') id: string,
    @Body() updateJournalDto: UpdateJournalDto,
    @EncryptionKey() encryptionKey?: Buffer,
  ) {
    return this.journalService.update(id, user.uid, updateJournalDto, encryptionKey)
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  async remove(
    @CurrentUser() user: any,
    @Param('id') id: string,
    @EncryptionKey() encryptionKey?: Buffer,
  ) {
    return this.journalService.remove(id, user.uid, encryptionKey)
  }

  @Get(':id/goals')
  async getLinkedGoals(@CurrentUser() user: any, @Param('id') id: string) {
    return this.journalService.getLinkedGoals(user.uid, id)
  }
}

