import { IsString, IsOptional, IsArray, MinLength } from 'class-validator'

export class CreateJournalDto {
  @IsString()
  @MinLength(1)
  title: string

  @IsString()
  @MinLength(1)
  content: string

  @IsOptional()
  @IsString()
  mood?: string

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tags?: string[]
}

export class UpdateJournalDto {
  @IsOptional()
  @IsString()
  @MinLength(1)
  title?: string

  @IsOptional()
  @IsString()
  @MinLength(1)
  content?: string

  @IsOptional()
  @IsString()
  mood?: string

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tags?: string[]
}

