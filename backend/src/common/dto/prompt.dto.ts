import { IsString, IsBoolean, IsOptional, MaxLength, MinLength } from 'class-validator'

export class CreatePromptDto {
  @IsString()
  @MinLength(1)
  @MaxLength(100)
  name: string

  @IsString()
  @MinLength(1)
  @MaxLength(10000)
  prompt_text: string

  @IsOptional()
  @IsBoolean()
  is_default?: boolean
}

export class UpdatePromptDto {
  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(100)
  name?: string

  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(10000)
  prompt_text?: string

  @IsOptional()
  @IsBoolean()
  is_default?: boolean
}

export class ImprovePromptDto {
  @IsString()
  @MinLength(1)
  @MaxLength(10000)
  prompt_text: string
}

