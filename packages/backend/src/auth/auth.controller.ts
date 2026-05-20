import { Controller, Post, Body, Get, UseGuards, Request } from '@nestjs/common';
import { AuthService } from './auth.service';
import { JwtAuthGuard } from './jwt.guard';
import { RolesGuard } from './roles.guard';
import { Roles } from './roles.decorator';

@Controller('api/auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('sso')
  async ssoLogin(
    @Body('email') email: string,
    @Body('displayName') displayName: string,
    @Body('role') role?: string,
    @Body('provider') provider?: string
  ) {
    // For prototype purposes, this simulates redirection and verification from Google/Apple SSO
    console.log(`[Auth] SSO login attempt via ${provider || 'Google'} for email: ${email}`);
    return this.authService.validateOrCreateSSOUser(email, displayName, role);
  }

  @UseGuards(JwtAuthGuard)
  @Get('profile')
  async getProfile(@Request() req: any) {
    return req.user;
  }

  // Example role-restricted endpoints to test permissions isolation
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('Resident')
  @Get('resident-only')
  async residentOnly() {
    return { message: 'Success: You have Resident access.' };
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('Admin')
  @Get('admin-only')
  async adminOnly() {
    return { message: 'Success: You have Admin access.' };
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('Super Admin')
  @Get('superadmin-only')
  async superAdminOnly() {
    return { message: 'Success: You have Super Admin access.' };
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('Support')
  @Get('support-only')
  async supportOnly() {
    return { message: 'Success: You have Support access.' };
  }
}
