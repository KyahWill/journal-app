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
import { RoutineService } from './routine.service'
import { CreateRoutineDto, UpdateRoutineDto } from '@/common/dto/routine.dto'
import { AuthGuard } from '@/common/guards/auth.guard'
import { CurrentUser } from '@/common/decorators/user.decorator'

@Controller('routine')
@UseGuards(AuthGuard)
export class RoutineController {
  constructor(private readonly routineService: RoutineService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async create(@CurrentUser() user: any, @Body() createRoutineDto: CreateRoutineDto) {
    return this.routineService.createRoutine(user.uid, createRoutineDto)
  }

  @Get()
  async findAll(@CurrentUser() user: any) {
    return this.routineService.getRoutines(user.uid)
  }

  @Get('groups')
  async getGroups(@CurrentUser() user: any) {
    return this.routineService.getRoutineGroups(user.uid)
  }

  @Get(':id')
  async findOne(@CurrentUser() user: any, @Param('id') id: string) {
    return this.routineService.getRoutineById(user.uid, id)
  }

  @Patch(':id')
  async update(
    @CurrentUser() user: any,
    @Param('id') id: string,
    @Body() updateRoutineDto: UpdateRoutineDto,
  ) {
    return this.routineService.updateRoutine(user.uid, id, updateRoutineDto)
  }

  @Post(':id/steps/:stepId/toggle')
  async toggleStep(
    @CurrentUser() user: any,
    @Param('id') id: string,
    @Param('stepId') stepId: string,
  ) {
    return this.routineService.toggleStepCompletion(user.uid, id, stepId)
  }

  @Post(':id/complete')
  async complete(@CurrentUser() user: any, @Param('id') id: string) {
    return this.routineService.completeRoutine(user.uid, id)
  }

  @Post(':id/reset')
  async reset(@CurrentUser() user: any, @Param('id') id: string) {
    return this.routineService.resetRoutineSteps(user.uid, id)
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(@CurrentUser() user: any, @Param('id') id: string) {
    await this.routineService.deleteRoutine(user.uid, id)
  }
}
