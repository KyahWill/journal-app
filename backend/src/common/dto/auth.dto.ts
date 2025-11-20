import { IsEmail, IsString, MinLength } from 'class-validator'

export class CreateUserDto {
  @IsEmail()
  email: string

  @IsString()
  @MinLength(6)
  password: string

  @IsString()
  @MinLength(1)
  displayName?: string
}

export class SignInDto {
  @IsEmail()
  email: string

  @IsString()
  @MinLength(6)
  password: string
}

export class VerifyTokenDto {
  @IsString()
  token: string
}

