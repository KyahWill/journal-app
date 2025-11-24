import {
  IsString,
  IsArray,
  IsNumber,
  IsOptional,
  IsEnum,
  IsDateString,
  ValidateNested,
  Min,
  Max,
  MinLength,
} from 'class-validator';
import { Type } from 'class-transformer';

export class CreateSessionDto {
  @IsOptional()
  @IsString()
  personalityId?: string;

  @IsOptional()
  context?: any;
}

export class GetSignedUrlDto {
  @IsOptional()
  @IsString()
  personalityId?: string;

  @IsOptional()
  @IsString()
  context?: string;
}

export class ConversationMessageDto {
  @IsEnum(['user', 'agent'])
  role: 'user' | 'agent';

  @IsString()
  @MinLength(1)
  content: string;

  @IsDateString()
  timestamp: string;

  @IsOptional()
  @IsString()
  audioUrl?: string;
}

export class SaveConversationDto {
  @IsString()
  @MinLength(1)
  conversationId: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ConversationMessageDto)
  transcript: ConversationMessageDto[];

  @IsNumber()
  @Min(0)
  @Max(7200) // Max 2 hours
  duration: number;

  @IsDateString()
  startedAt: string;

  @IsDateString()
  endedAt: string;
}

export class GetConversationHistoryDto {
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(100)
  @Type(() => Number)
  limit?: number;

  @IsOptional()
  @IsString()
  search?: string;

  @IsOptional()
  @IsDateString()
  startDate?: string;

  @IsOptional()
  @IsDateString()
  endDate?: string;

  @IsOptional()
  @IsEnum(['newest', 'oldest', 'longest', 'shortest'])
  sortBy?: 'newest' | 'oldest' | 'longest' | 'shortest';
}
