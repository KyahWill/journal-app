import { IsString, IsBoolean, IsOptional, IsNumber, IsEnum, MinLength } from 'class-validator'

export enum CoachingStyle {
  SUPPORTIVE = 'supportive',
  DIRECT = 'direct',
  MOTIVATIONAL = 'motivational',
  ANALYTICAL = 'analytical',
  EMPATHETIC = 'empathetic',
}

export class CreateCoachPersonalityDto {
  @IsString()
  @MinLength(1)
  name: string

  @IsString()
  @MinLength(1)
  description: string

  @IsEnum(CoachingStyle)
  style: CoachingStyle

  @IsString()
  @MinLength(1)
  systemPrompt: string

  @IsOptional()
  @IsString()
  firstMessage?: string

  @IsOptional()
  @IsString()
  language?: string

  @IsOptional()
  @IsBoolean()
  isDefault?: boolean
}

export class UpdateCoachPersonalityDto {
  @IsOptional()
  @IsString()
  @MinLength(1)
  name?: string

  @IsOptional()
  @IsString()
  @MinLength(1)
  description?: string

  @IsOptional()
  @IsEnum(CoachingStyle)
  style?: CoachingStyle

  @IsOptional()
  @IsString()
  @MinLength(1)
  systemPrompt?: string

  @IsOptional()
  @IsString()
  firstMessage?: string

  @IsOptional()
  @IsString()
  language?: string

  @IsOptional()
  @IsBoolean()
  isDefault?: boolean
}

