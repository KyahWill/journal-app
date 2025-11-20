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
} from '@nestjs/common'
import { JournalService } from './journal.service'
import { CreateJournalDto, UpdateJournalDto } from '@/common/dto/journal.dto'
import { AuthGuard } from '@/common/guards/auth.guard'
import { CurrentUser } from '@/common/decorators/user.decorator'

@Controller('journal')
@UseGuards(AuthGuard)
export class JournalController {
  constructor(private readonly journalService: JournalService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async create(@CurrentUser() user: any, @Body() createJournalDto: CreateJournalDto) {
    return this.journalService.create(user.uid, createJournalDto)
  }

  @Get()
  async findAll(@CurrentUser() user: any) {
    return this.journalService.findAll(user.uid)
  }

  @Get('recent')
  async getRecent(@CurrentUser() user: any, @Query('limit') limit?: string) {
    const limitNum = limit ? parseInt(limit, 10) : 10
    return this.journalService.getRecent(user.uid, limitNum)
  }

  @Get('search')
  async search(@CurrentUser() user: any, @Query('q') searchTerm: string) {
    return this.journalService.search(user.uid, searchTerm)
  }

  @Get(':id')
  async findOne(@CurrentUser() user: any, @Param('id') id: string) {
    return this.journalService.findOne(id, user.uid)
  }

  @Put(':id')
  async update(
    @CurrentUser() user: any,
    @Param('id') id: string,
    @Body() updateJournalDto: UpdateJournalDto,
  ) {
    return this.journalService.update(id, user.uid, updateJournalDto)
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  async remove(@CurrentUser() user: any, @Param('id') id: string) {
    return this.journalService.remove(id, user.uid)
  }
}

