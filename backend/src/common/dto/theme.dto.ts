import {
  IsString,
  IsBoolean,
  IsNumber,
  IsObject,
  IsOptional,
  IsEnum,
  ValidateNested,
  Min,
  Max,
} from 'class-validator'
import { Type } from 'class-transformer'
import { ThemeDensity, ThemeShadowIntensity } from '../types/journal.types'

export class ThemeColorsDto {
  @IsString()
  background: string

  @IsString()
  foreground: string

  @IsString()
  card: string

  @IsString()
  cardForeground: string

  @IsString()
  popover: string

  @IsString()
  popoverForeground: string

  @IsString()
  primary: string

  @IsString()
  primaryForeground: string

  @IsString()
  secondary: string

  @IsString()
  secondaryForeground: string

  @IsString()
  muted: string

  @IsString()
  mutedForeground: string

  @IsString()
  accent: string

  @IsString()
  accentForeground: string

  @IsString()
  destructive: string

  @IsString()
  destructiveForeground: string

  @IsString()
  border: string

  @IsString()
  input: string

  @IsString()
  ring: string
}

export class ThemeTypographyDto {
  @IsString()
  fontFamily: string

  @IsNumber()
  @Min(10)
  @Max(24)
  baseFontSize: number

  @IsNumber()
  @Min(1)
  @Max(2)
  headingScale: number

  @IsNumber()
  @Min(1)
  @Max(2.5)
  lineHeight: number
}

export class ThemeSpacingDto {
  @IsNumber()
  @Min(0.5)
  @Max(2)
  scale: number
}

export class ThemeAnimationsDto {
  @IsNumber()
  @Min(0)
  @Max(1000)
  duration: number

  @IsString()
  easing: string
}

export class CreateThemeDto {
  @IsString()
  name: string

  @IsBoolean()
  @IsOptional()
  is_default?: boolean

  @IsBoolean()
  @IsOptional()
  is_public?: boolean

  @IsObject()
  @ValidateNested()
  @Type(() => ThemeColorsDto)
  colors: ThemeColorsDto

  @IsObject()
  @ValidateNested()
  @Type(() => ThemeTypographyDto)
  typography: ThemeTypographyDto

  @IsObject()
  @ValidateNested()
  @Type(() => ThemeSpacingDto)
  spacing: ThemeSpacingDto

  @IsNumber()
  @Min(0)
  @Max(2)
  borderRadius: number

  @IsEnum(['none', 'subtle', 'medium', 'strong'])
  shadowIntensity: ThemeShadowIntensity

  @IsObject()
  @ValidateNested()
  @Type(() => ThemeAnimationsDto)
  animations: ThemeAnimationsDto

  @IsEnum(['comfortable', 'compact', 'spacious'])
  density: ThemeDensity
}

export class UpdateThemeDto {
  @IsString()
  @IsOptional()
  name?: string

  @IsBoolean()
  @IsOptional()
  is_default?: boolean

  @IsBoolean()
  @IsOptional()
  is_public?: boolean

  @IsObject()
  @ValidateNested()
  @Type(() => ThemeColorsDto)
  @IsOptional()
  colors?: ThemeColorsDto

  @IsObject()
  @ValidateNested()
  @Type(() => ThemeTypographyDto)
  @IsOptional()
  typography?: ThemeTypographyDto

  @IsObject()
  @ValidateNested()
  @Type(() => ThemeSpacingDto)
  @IsOptional()
  spacing?: ThemeSpacingDto

  @IsNumber()
  @Min(0)
  @Max(2)
  @IsOptional()
  borderRadius?: number

  @IsEnum(['none', 'subtle', 'medium', 'strong'])
  @IsOptional()
  shadowIntensity?: ThemeShadowIntensity

  @IsObject()
  @ValidateNested()
  @Type(() => ThemeAnimationsDto)
  @IsOptional()
  animations?: ThemeAnimationsDto

  @IsEnum(['comfortable', 'compact', 'spacious'])
  @IsOptional()
  density?: ThemeDensity
}

export class RecommendThemeDto {
  @IsString()
  @IsOptional()
  mood?: string

  @IsString()
  @IsOptional()
  preferences?: string
}

