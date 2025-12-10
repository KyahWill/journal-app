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
import { CurrentUser } from '@/common/decorators/user.decorator'

@Controller('goal')
@UseGuards(AuthGuard)
export class GoalController {
  constructor(private readonly goalService: GoalService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async create(@CurrentUser() user: any, @Body() createGoalDto: CreateGoalDto) {
    return this.goalService.createGoal(user.uid, createGoalDto)
  }
  
  @Post('batch')
  @HttpCode(HttpStatus.CREATED)
  async batchCreate(@CurrentUser() user: any, @Body() createGoalDtos: CreateGoalDto[]) {
    return this.goalService.batchCreateGoals(user.uid, createGoalDtos)
  }
  
  @Put('batch')
  async batchUpdate(
    @CurrentUser() user: any,
    @Body() updates: Array<{ goalId: string; data: UpdateGoalDto }>,
  ) {
    return this.goalService.batchUpdateGoals(user.uid, updates)
  }

  @Get()
  async findAll(
    @CurrentUser() user: any,
    @Query('category') category?: string,
    @Query('status') status?: string,
    @Query('limit') limit?: string,
    @Query('startAfter') startAfter?: string,
  ) {
    const parsedLimit = limit ? parseInt(limit, 10) : undefined
    return this.goalService.getGoals(user.uid, { category, status }, parsedLimit, startAfter)
  }
  
  @Get('counts')
  async getCounts(@CurrentUser() user: any) {
    return this.goalService.getGoalCounts(user.uid)
  }

  @Get('overdue')
  async getOverdue(@CurrentUser() user: any) {
    return this.goalService.getOverdueGoals(user.uid)
  }

  @Get('category/:category')
  async getByCategory(@CurrentUser() user: any, @Param('category') category: string) {
    return this.goalService.getGoalsByCategory(user.uid, category)
  }

  @Get(':id')
  async findOne(@CurrentUser() user: any, @Param('id') id: string) {
    return this.goalService.getGoalById(user.uid, id)
  }

  @Put(':id')
  async update(
    @CurrentUser() user: any,
    @Param('id') id: string,
    @Body() updateGoalDto: UpdateGoalDto,
  ) {
    return this.goalService.updateGoal(user.uid, id, updateGoalDto)
  }

  @Patch(':id/status')
  async updateStatus(
    @CurrentUser() user: any,
    @Param('id') id: string,
    @Body() updateStatusDto: UpdateGoalStatusDto,
  ) {
    return this.goalService.updateGoalStatus(user.uid, id, updateStatusDto)
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
  ) {
    return this.goalService.addMilestone(user.uid, goalId, createMilestoneDto)
  }

  @Get(':id/milestone')
  async getMilestones(@CurrentUser() user: any, @Param('id') goalId: string) {
    return this.goalService.getMilestones(user.uid, goalId)
  }

  @Put(':goalId/milestone/:milestoneId')
  async updateMilestone(
    @CurrentUser() user: any,
    @Param('goalId') goalId: string,
    @Param('milestoneId') milestoneId: string,
    @Body() updateMilestoneDto: UpdateMilestoneDto,
  ) {
    return this.goalService.updateMilestone(user.uid, goalId, milestoneId, updateMilestoneDto)
  }

  @Patch(':goalId/milestone/:milestoneId/complete')
  async toggleMilestone(
    @CurrentUser() user: any,
    @Param('goalId') goalId: string,
    @Param('milestoneId') milestoneId: string,
  ) {
    return this.goalService.toggleMilestone(user.uid, goalId, milestoneId)
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
  ) {
    return this.goalService.addProgressUpdate(user.uid, goalId, createProgressDto)
  }

  @Get(':id/progress')
  async getProgressUpdates(@CurrentUser() user: any, @Param('id') goalId: string) {
    return this.goalService.getProgressUpdates(user.uid, goalId)
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
