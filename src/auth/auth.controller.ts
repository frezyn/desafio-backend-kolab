import { Body, Controller, HttpCode, HttpStatus, Post, Req, Res, UseGuards } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthCredentialsDto } from './dto/auth-credentials.dto';
import { ApiBody, ApiCookieAuth, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { Request, Response } from 'express';

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService){}

  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Sign In' })
  @ApiBody({ type: AuthCredentialsDto })
  @ApiResponse({ status: 200, description: 'The user has been Sign in.' })
  @ApiResponse({ status: 400, description: 'Bad Request' })
  @Post('login')
  async signIn(@Body() signInDto: AuthCredentialsDto, @Res() response: Response) {
    const { accessToken } = await this.authService.signIn(signInDto);
    response.cookie('Authentication', accessToken, { httpOnly: true });
    return response.send({ accessToken });
  }

  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Sign Up' })
  @ApiBody({ type: AuthCredentialsDto })
  @ApiResponse({ status: 200, description: 'The user has been Sign Up.' })
  @ApiResponse({ status: 400, description: 'Bad Request' })
  @Post('register')
  signUp(@Body() authCredentialsDto :AuthCredentialsDto){
    return this.authService.signUp(authCredentialsDto);
  }

  @ApiOperation({ summary: 'Sign out' })
  @ApiResponse({ status: 200, description: 'The user has been Sign Up.' })
  @ApiResponse({ status: 400, description: 'Bad Request' })
  @Post('logout')
  @UseGuards(AuthGuard('jwt'))
  async logout(@Res() res: Response) {
    await this.authService.logout(res);
    return res.send({ message: 'Logged out successfully' });
  }
}
