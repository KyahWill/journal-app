import {
  Controller,
  Post,
  Get,
  Put,
  Delete,
  Body,
  Param,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common'
import { AuthService } from './auth.service'
import { CreateUserDto, VerifyTokenDto } from '@/common/dto/auth.dto'
import { AuthGuard } from '@/common/guards/auth.guard'
import { CurrentUser } from '@/common/decorators/user.decorator'

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('signup')
  @HttpCode(HttpStatus.CREATED)
  async signup(@Body() createUserDto: CreateUserDto) {
    return this.authService.createUser(createUserDto)
  }

  @Post('verify')
  @HttpCode(HttpStatus.OK)
  async verifyToken(@Body() verifyTokenDto: VerifyTokenDto) {
    return this.authService.verifyToken(verifyTokenDto.token)
  }

  @Get('me')
  @UseGuards(AuthGuard)
  async getCurrentUser(@CurrentUser() user: any) {
    return this.authService.getUserById(user.uid)
  }

  @Get('user/:uid')
  @UseGuards(AuthGuard)
  async getUserById(@Param('uid') uid: string) {
    return this.authService.getUserById(uid)
  }

  @Put('user/:uid')
  @UseGuards(AuthGuard)
  async updateUser(
    @Param('uid') uid: string,
    @Body() updateData: { displayName?: string; email?: string },
    @CurrentUser() user: any,
  ) {
    // Ensure user can only update their own profile
    if (user.uid !== uid) {
      throw new Error('Unauthorized')
    }
    return this.authService.updateUser(uid, updateData)
  }

  @Delete('user/:uid')
  @UseGuards(AuthGuard)
  async deleteUser(@Param('uid') uid: string, @CurrentUser() user: any) {
    // Ensure user can only delete their own account
    if (user.uid !== uid) {
      throw new Error('Unauthorized')
    }
    return this.authService.deleteUser(uid)
  }

  @Post('token/:uid')
  @UseGuards(AuthGuard)
  async createCustomToken(@Param('uid') uid: string, @Body() claims?: any) {
    return this.authService.createCustomToken(uid, claims)
  }
}

