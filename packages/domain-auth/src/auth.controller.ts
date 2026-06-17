import { Body, Controller, Get, Headers, HttpCode, HttpStatus, Post } from '@nestjs/common';

import { AuthService } from './auth.service';

type RegisterBody = {
  email: string;
  password: string;
  displayName?: string;
};

type LoginBody = {
  email: string;
  password: string;
};

type EmailBody = {
  email: string;
};

type TokenBody = {
  token: string;
};

type PasswordResetConfirmBody = {
  token: string;
  newPassword: string;
};

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  register(@Body() body: RegisterBody) {
    return this.authService.register(body);
  }

  @Post('login')
  @HttpCode(HttpStatus.OK)
  login(@Body() body: LoginBody) {
    return this.authService.login(body);
  }

  @Post('logout')
  @HttpCode(HttpStatus.OK)
  logout(@Headers('authorization') authorization?: string) {
    return this.authService.logout(authorization);
  }

  @Get('session')
  verifySession(@Headers('authorization') authorization?: string) {
    return this.authService.verifySession(authorization);
  }

  @Post('email-verification/request')
  @HttpCode(HttpStatus.CREATED)
  requestEmailVerification(@Body() body: EmailBody) {
    return this.authService.requestEmailVerification(body.email);
  }

  @Post('email-verification/confirm')
  @HttpCode(HttpStatus.OK)
  confirmEmailVerification(@Body() body: TokenBody) {
    return this.authService.confirmEmailVerification(body.token);
  }

  @Post('password-reset/request')
  @HttpCode(HttpStatus.CREATED)
  requestPasswordReset(@Body() body: EmailBody) {
    return this.authService.requestPasswordReset(body.email);
  }

  @Post('password-reset/confirm')
  @HttpCode(HttpStatus.OK)
  confirmPasswordReset(@Body() body: PasswordResetConfirmBody) {
    return this.authService.confirmPasswordReset(body.token, body.newPassword);
  }
}
