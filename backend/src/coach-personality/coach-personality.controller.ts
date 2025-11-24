import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { AuthGuard } from '@/common/guards/auth.guard';
import { CurrentUser } from '@/common/decorators/user.decorator';
import { CoachPersonalityService } from './coach-personality.service';
import { CreateCoachPersonalityDto, UpdateCoachPersonalityDto } from './coach-personality.dto';

@Controller('coach-personalities')
@UseGuards(AuthGuard)
export class CoachPersonalityController {
  constructor(private readonly coachPersonalityService: CoachPersonalityService) {}

  @Post()
  async create(@CurrentUser() user: any, @Body() dto: CreateCoachPersonalityDto) {
    return this.coachPersonalityService.create(user.uid, dto);
  }

  @Get()
  async findAll(@CurrentUser() user: any) {
    return this.coachPersonalityService.findAll(user.uid);
  }

  @Get('default')
  async findDefault(@CurrentUser() user: any) {
    return this.coachPersonalityService.findDefault(user.uid);
  }

  @Get(':id')
  async findOne(@CurrentUser() user: any, @Param('id') id: string) {
    return this.coachPersonalityService.findOne(user.uid, id);
  }

  @Put(':id')
  async update(
    @CurrentUser() user: any,
    @Param('id') id: string,
    @Body() dto: UpdateCoachPersonalityDto,
  ) {
    return this.coachPersonalityService.update(user.uid, id, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async delete(@CurrentUser() user: any, @Param('id') id: string) {
    await this.coachPersonalityService.delete(user.uid, id);
  }

  @Post(':id/link-agent')
  async linkAgent(
    @CurrentUser() user: any,
    @Param('id') id: string,
    @Body('agentId') agentId: string,
  ) {
    return this.coachPersonalityService.linkAgent(user.uid, id, agentId);
  }

  @Post(':id/generate-agent')
  async generateAgent(@CurrentUser() user: any, @Param('id') id: string) {
    return this.coachPersonalityService.generateAgent(user.uid, id);
  }
  
  @Post('initialize')
  async initializePersonalities(@CurrentUser() user: any) {
    return this.coachPersonalityService.initializeDefaultPersonalities(user.uid);
  }
}
