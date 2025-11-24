import { IsString, IsOptional, IsNumber, Min, Max, IsEnum, IsBoolean } from 'class-validator';

export enum CoachingStyle {
  SUPPORTIVE = 'supportive',
  DIRECT = 'direct',
  MOTIVATIONAL = 'motivational',
  ANALYTICAL = 'analytical',
  EMPATHETIC = 'empathetic',
}

export class CreateCoachPersonalityDto {
  @IsString()
  name: string;

  @IsString()
  description: string;

  @IsEnum(CoachingStyle)
  style: CoachingStyle;

  @IsString()
  systemPrompt: string;

  @IsString()
  @IsOptional()
  voiceId?: string;

  @IsNumber()
  @Min(0)
  @Max(1)
  @IsOptional()
  voiceStability?: number;

  @IsNumber()
  @Min(0)
  @Max(1)
  @IsOptional()
  voiceSimilarityBoost?: number;

  @IsString()
  @IsOptional()
  firstMessage?: string;

  @IsString()
  @IsOptional()
  language?: string;

  @IsBoolean()
  @IsOptional()
  isDefault?: boolean;
}

export class UpdateCoachPersonalityDto {
  @IsString()
  @IsOptional()
  name?: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsEnum(CoachingStyle)
  @IsOptional()
  style?: CoachingStyle;

  @IsString()
  @IsOptional()
  systemPrompt?: string;

  @IsString()
  @IsOptional()
  voiceId?: string;

  @IsNumber()
  @Min(0)
  @Max(1)
  @IsOptional()
  voiceStability?: number;

  @IsNumber()
  @Min(0)
  @Max(1)
  @IsOptional()
  voiceSimilarityBoost?: number;

  @IsString()
  @IsOptional()
  firstMessage?: string;

  @IsString()
  @IsOptional()
  language?: string;

  @IsBoolean()
  @IsOptional()
  isDefault?: boolean;
}

export interface CoachPersonality {
  id: string;
  userId: string;
  name: string;
  description: string;
  style: CoachingStyle;
  systemPrompt: string;
  voiceId?: string;
  voiceStability?: number;
  voiceSimilarityBoost?: number;
  firstMessage?: string;
  language?: string;
  isDefault: boolean;
  elevenLabsAgentId?: string; // Generated agent ID from ElevenLabs
  createdAt: Date;
  updatedAt: Date;
}
