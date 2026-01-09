import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Patch,
  Body,
  Param,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common'
import { GoalService } from './goal.service'
import {
  CreateGoalDto,
  UpdateGoalDto,
  UpdateGoalStatusDto,
  CreateMilestoneDto,
  UpdateMilestoneDto,
  CreateProgressDto,
} from '@/common/dto/goal.dto'
import { AuthGuard } from '@/common/guards/auth.guard'
import { CurrentUser, EncryptionKey } from '@/common/decorators/user.decorator'

@Controller('goal')
@UseGuards(AuthGuard)
export class GoalController {
  constructor(private readonly goalService: GoalService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async create(
    @CurrentUser() user: any,
    @Body() createGoalDto: CreateGoalDto,
    @EncryptionKey() encryptionKey?: Buffer,
  ) {
    return this.goalService.createGoal(user.uid, createGoalDto, encryptionKey)
  }
  
  @Post('batch')
  @HttpCode(HttpStatus.CREATED)
  async batchCreate(
    @CurrentUser() user: any,
    @Body() createGoalDtos: CreateGoalDto[],
    @EncryptionKey() encryptionKey?: Buffer,
  ) {
    return this.goalService.batchCreateGoals(user.uid, createGoalDtos, encryptionKey)
  }
  
  @Put('batch')
  async batchUpdate(
    @CurrentUser() user: any,
    @Body() updates: Array<{ goalId: string; data: UpdateGoalDto }>,
    @EncryptionKey() encryptionKey?: Buffer,
  ) {
    return this.goalService.batchUpdateGoals(user.uid, updates, encryptionKey)
  }

  @Get()
  async findAll(
    @CurrentUser() user: any,
    @Query('category') category?: string,
    @Query('status') status?: string,
    @Query('limit') limit?: string,
    @Query('startAfter') startAfter?: string,
    @EncryptionKey() encryptionKey?: Buffer,
  ) {
    const parsedLimit = limit ? parseInt(limit, 10) : undefined
    return this.goalService.getGoals(user.uid, { category, status }, parsedLimit, startAfter, encryptionKey)
  }
  
  @Get('counts')
  async getCounts(@CurrentUser() user: any) {
    return this.goalService.getGoalCounts(user.uid)
  }

  @Get('overdue')
  async getOverdue(
    @CurrentUser() user: any,
    @EncryptionKey() encryptionKey?: Buffer,
  ) {
    return this.goalService.getOverdueGoals(user.uid, encryptionKey)
  }

  @Get('category/:category')
  async getByCategory(
    @CurrentUser() user: any,
    @Param('category') category: string,
    @EncryptionKey() encryptionKey?: Buffer,
  ) {
    return this.goalService.getGoalsByCategory(user.uid, category, encryptionKey)
  }

  @Get(':id')
  async findOne(
    @CurrentUser() user: any,
    @Param('id') id: string,
    @EncryptionKey() encryptionKey?: Buffer,
  ) {
    return this.goalService.getGoalById(user.uid, id, encryptionKey)
  }

  @Put(':id')
  async update(
    @CurrentUser() user: any,
    @Param('id') id: string,
    @Body() updateGoalDto: UpdateGoalDto,
    @EncryptionKey() encryptionKey?: Buffer,
  ) {
    return this.goalService.updateGoal(user.uid, id, updateGoalDto, encryptionKey)
  }

  @Patch(':id/status')
  async updateStatus(
    @CurrentUser() user: any,
    @Param('id') id: string,
    @Body() updateStatusDto: UpdateGoalStatusDto,
    @EncryptionKey() encryptionKey?: Buffer,
  ) {
    return this.goalService.updateGoalStatus(user.uid, id, updateStatusDto, encryptionKey)
  }

  @Get(':id/deletion-info')
  async getDeletionInfo(@CurrentUser() user: any, @Param('id') id: string) {
    return this.goalService.getGoalDeletionInfo(user.uid, id)
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  async remove(@CurrentUser() user: any, @Param('id') id: string) {
    return this.goalService.deleteGoal(user.uid, id)
  }

  // Milestone endpoints

  @Post(':id/milestone')
  @HttpCode(HttpStatus.CREATED)
  async addMilestone(
    @CurrentUser() user: any,
    @Param('id') goalId: string,
    @Body() createMilestoneDto: CreateMilestoneDto,
    @EncryptionKey() encryptionKey?: Buffer,
  ) {
    return this.goalService.addMilestone(user.uid, goalId, createMilestoneDto, encryptionKey)
  }

  @Get(':id/milestone')
  async getMilestones(
    @CurrentUser() user: any,
    @Param('id') goalId: string,
    @EncryptionKey() encryptionKey?: Buffer,
  ) {
    return this.goalService.getMilestones(user.uid, goalId, encryptionKey)
  }

  @Put(':goalId/milestone/:milestoneId')
  async updateMilestone(
    @CurrentUser() user: any,
    @Param('goalId') goalId: string,
    @Param('milestoneId') milestoneId: string,
    @Body() updateMilestoneDto: UpdateMilestoneDto,
    @EncryptionKey() encryptionKey?: Buffer,
  ) {
    return this.goalService.updateMilestone(user.uid, goalId, milestoneId, updateMilestoneDto, encryptionKey)
  }

  @Patch(':goalId/milestone/:milestoneId/complete')
  async toggleMilestone(
    @CurrentUser() user: any,
    @Param('goalId') goalId: string,
    @Param('milestoneId') milestoneId: string,
    @EncryptionKey() encryptionKey?: Buffer,
  ) {
    return this.goalService.toggleMilestone(user.uid, goalId, milestoneId, encryptionKey)
  }

  @Delete(':goalId/milestone/:milestoneId')
  @HttpCode(HttpStatus.OK)
  async deleteMilestone(
    @CurrentUser() user: any,
    @Param('goalId') goalId: string,
    @Param('milestoneId') milestoneId: string,
  ) {
    return this.goalService.deleteMilestone(user.uid, goalId, milestoneId)
  }

  // Progress update endpoints

  @Post(':id/progress')
  @HttpCode(HttpStatus.CREATED)
  async addProgressUpdate(
    @CurrentUser() user: any,
    @Param('id') goalId: string,
    @Body() createProgressDto: CreateProgressDto,
    @EncryptionKey() encryptionKey?: Buffer,
  ) {
    return this.goalService.addProgressUpdate(user.uid, goalId, createProgressDto, encryptionKey)
  }

  @Get(':id/progress')
  async getProgressUpdates(
    @CurrentUser() user: any,
    @Param('id') goalId: string,
    @EncryptionKey() encryptionKey?: Buffer,
  ) {
    return this.goalService.getProgressUpdates(user.uid, goalId, encryptionKey)
  }

  @Delete(':goalId/progress/:progressId')
  @HttpCode(HttpStatus.OK)
  async deleteProgressUpdate(
    @CurrentUser() user: any,
    @Param('goalId') goalId: string,
    @Param('progressId') progressId: string,
  ) {
    return this.goalService.deleteProgressUpdate(user.uid, goalId, progressId)
  }

  // Goal-Journal linking endpoints

  @Post(':id/link-journal')
  @HttpCode(HttpStatus.CREATED)
  async linkJournalEntry(
    @CurrentUser() user: any,
    @Param('id') goalId: string,
    @Body('journal_entry_id') journalEntryId: string,
  ) {
    return this.goalService.linkJournalEntry(user.uid, goalId, journalEntryId)
  }

  @Delete(':id/link-journal/:entryId')
  @HttpCode(HttpStatus.OK)
  async unlinkJournalEntry(
    @CurrentUser() user: any,
    @Param('id') goalId: string,
    @Param('entryId') entryId: string,
  ) {
    return this.goalService.unlinkJournalEntry(user.uid, goalId, entryId)
  }

  @Get(':id/linked-journals')
  async getLinkedJournalEntries(@CurrentUser() user: any, @Param('id') goalId: string) {
    return this.goalService.getLinkedJournalEntries(user.uid, goalId)
  }
}
