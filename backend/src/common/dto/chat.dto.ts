import { IsString, IsArray, IsOptional, MinLength } from 'class-validator'

export class SendMessageDto {
  @IsString()
  @MinLength(1)
  message: string

  @IsOptional()
  @IsString()
  sessionId?: string

  @IsOptional()
  @IsString()
  personalityId?: string
}

export class ChatHistoryDto {
  @IsOptional()
  @IsArray()
  history?: Array<{
    role: 'user' | 'assistant'
    content: string
  }>
}

export class UpdateSessionTitleDto {
  @IsString()
  @MinLength(1)
  title: string
}
