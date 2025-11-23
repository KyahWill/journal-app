import { IsString, IsOptional, IsEnum, IsDateString, MinLength, MaxLength } from 'class-validator'
import { GoalCategory, GoalStatus } from '@/common/types/goal.types'

export class CreateGoalDto {
  @IsString()
  @MinLength(3)
  @MaxLength(200)
  title: string

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  description?: string

  @IsString()
  @MinLength(1)
  @MaxLength(100)
  category: string // Can be a default category or custom category ID

  @IsDateString()
  target_date: string
}

export class UpdateGoalDto {
  @IsOptional()
  @IsString()
  @MinLength(3)
  @MaxLength(200)
  title?: string

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  description?: string

  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(100)
  category?: string // Can be a default category or custom category ID

  @IsOptional()
  @IsDateString()
  target_date?: string
}

export class UpdateGoalStatusDto {
  @IsEnum(['not_started', 'in_progress', 'completed', 'abandoned'])
  status: GoalStatus
}

export class CreateMilestoneDto {
  @IsString()
  @MinLength(1)
  @MaxLength(200)
  title: string

  @IsOptional()
  @IsDateString()
  due_date?: string
}

export class UpdateMilestoneDto {
  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(200)
  title?: string

  @IsOptional()
  @IsDateString()
  due_date?: string
}

export class CreateProgressDto {
  @IsString()
  @MinLength(1)
  @MaxLength(2000)
  content: string
}

export class LinkJournalDto {
  @IsString()
  journal_entry_id: string
}
