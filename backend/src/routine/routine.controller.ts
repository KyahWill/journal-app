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
import { CurrentUser, EncryptionKey } from '@/common/decorators/user.decorator'

@Controller('routine')
@UseGuards(AuthGuard)
export class RoutineController {
  constructor(private readonly routineService: RoutineService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async create(
    @CurrentUser() user: any,
    @Body() createRoutineDto: CreateRoutineDto,
    @EncryptionKey() encryptionKey?: Buffer,
  ) {
    return this.routineService.createRoutine(user.uid, createRoutineDto, encryptionKey)
  }

  @Get()
  async findAll(
    @CurrentUser() user: any,
    @EncryptionKey() encryptionKey?: Buffer,
  ) {
    return this.routineService.getRoutines(user.uid, encryptionKey)
  }

  @Get('groups')
  async getGroups(
    @CurrentUser() user: any,
    @EncryptionKey() encryptionKey?: Buffer,
  ) {
    return this.routineService.getRoutineGroups(user.uid, encryptionKey)
  }

  @Get(':id')
  async findOne(
    @CurrentUser() user: any,
    @Param('id') id: string,
    @EncryptionKey() encryptionKey?: Buffer,
  ) {
    return this.routineService.getRoutineById(user.uid, id, encryptionKey)
  }

  @Patch(':id')
  async update(
    @CurrentUser() user: any,
    @Param('id') id: string,
    @Body() updateRoutineDto: UpdateRoutineDto,
    @EncryptionKey() encryptionKey?: Buffer,
  ) {
    return this.routineService.updateRoutine(user.uid, id, updateRoutineDto, encryptionKey)
  }

  @Post(':id/steps/:stepId/toggle')
  async toggleStep(
    @CurrentUser() user: any,
    @Param('id') id: string,
    @Param('stepId') stepId: string,
    @EncryptionKey() encryptionKey?: Buffer,
  ) {
    return this.routineService.toggleStepCompletion(user.uid, id, stepId, encryptionKey)
  }

  @Post(':id/complete')
  async complete(
    @CurrentUser() user: any,
    @Param('id') id: string,
    @EncryptionKey() encryptionKey?: Buffer,
  ) {
    return this.routineService.completeRoutine(user.uid, id, encryptionKey)
  }

  @Post(':id/reset')
  async reset(
    @CurrentUser() user: any,
    @Param('id') id: string,
    @EncryptionKey() encryptionKey?: Buffer,
  ) {
    return this.routineService.resetRoutineSteps(user.uid, id, encryptionKey)
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(
    @CurrentUser() user: any,
    @Param('id') id: string,
    @EncryptionKey() encryptionKey?: Buffer,
  ) {
    await this.routineService.deleteRoutine(user.uid, id, encryptionKey)
  }
}
