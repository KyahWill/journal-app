import { IsString, IsOptional, IsEnum, IsArray, ValidateNested, MinLength, MaxLength, IsNumber } from 'class-validator'
import { Type } from 'class-transformer'
import { RoutineFrequency } from '@/common/types/routine.types'

export class CreateRoutineStepDto {
  @IsString()
  @MinLength(1)
  @MaxLength(200)
  title: string

  @IsNumber()
  order: number
}

export class CreateRoutineDto {
  @IsString()
  @MinLength(3)
  @MaxLength(200)
  title: string

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  description?: string

  @IsOptional()
  @IsString()
  @MaxLength(100)
  group?: string

  @IsEnum(['daily', 'weekly', 'monthly'])
  frequency: RoutineFrequency

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateRoutineStepDto)
  steps: CreateRoutineStepDto[]
}

export class UpdateRoutineDto {
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
  @MaxLength(100)
  group?: string

  @IsOptional()
  @IsEnum(['daily', 'weekly', 'monthly'])
  frequency?: RoutineFrequency

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateRoutineStepDto)
  steps?: CreateRoutineStepDto[]
}
