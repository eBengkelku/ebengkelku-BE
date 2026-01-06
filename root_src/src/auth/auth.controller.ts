import { CurrentUser } from '@/common/decorators/current-user.decorator';
import { Controller, Get, Headers, Logger } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiHeader,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { AccessUser, AuthService } from './auth.service';

@Controller('v1/auth')
@ApiTags('Auth')
@ApiBearerAuth('JWT-auth')
export class AuthController {
  private readonly logger = new Logger(AuthController.name);

  constructor(private readonly authService: AuthService) {}

  @Get('me')
  @ApiOperation({ summary: 'Get current user' })
  @ApiHeader({
    name: 'x-lang',
    description: 'Language code for internationalization',
    required: false,
    example: 'en',
    schema: { type: 'string', enum: ['en', 'id'], default: 'en' },
  })
  async getCurrentUser(
    @CurrentUser() user: AccessUser,
    @Headers('x-lang') lang?: string,
  ) {
    return {
      success: true,
      message: this.authService['i18n'].t('auth.existingUserValidated', {
        lang,
      }),
      data: {
        user: user,
      },
    };
  }
}
