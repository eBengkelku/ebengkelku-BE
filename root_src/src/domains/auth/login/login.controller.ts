import {
  Controller,
  Post,
  Body,
  HttpCode,
  HttpStatus,
  Headers,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBody,
  ApiHeader,
} from '@nestjs/swagger';
import { LoginService } from './login.service';
import { LoginDto } from './dto';
import { ILoginResponse } from './interfaces';
import { Public } from '../../../common/decorators/public.decorator';

/**
 * Login Controller
 *
 * HTTP controller for user login endpoint.
 * Handles POST /v1/auth/login
 *
 * @class LoginController
 * @version 1.0.0
 * @since 2026-01-28
 */
@Controller('v1/auth')
@ApiTags('Auth - Login')
export class LoginController {
  constructor(private readonly service: LoginService) {}

  /**
   * Authenticate user and return JWT token
   *
   * Validates email and password credentials against the database.
   * Returns a JWT access token on successful authentication.
   *
   * @param dto - Login credentials
   * @param lang - Language for response messages (optional)
   * @returns Login response with access token
   */
  @Post('login')
  @Public() // Bypass JWT authentication
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'User login with email and password',
    description: `
      Authenticate a user using email and password credentials.
      
      **Features:**
      - Case-insensitive email matching
      - Email trimming (leading/trailing spaces)
      - Password verification using bcrypt
      - Returns JWT access token on success
      
      **Security:**
      - Generic error messages prevent user enumeration
      - Deleted accounts receive same error as non-existent accounts
      - Failed login attempts are logged for security monitoring
      
      **Account Requirements:**
      - Email must be verified (email_verified_at must be set)
      - Account must not be deleted (deleted_at must be null)
    `,
  })
  @ApiHeader({
    name: 'x-lang',
    description: 'Language for response messages',
    required: false,
    examples: {
      en: { value: 'en', summary: 'English' },
      id: { value: 'id', summary: 'Indonesian' },
    },
  })
  @ApiBody({ type: LoginDto })
  @ApiResponse({
    status: 200,
    description: 'Login successful',
    schema: {
      example: {
        success: true,
        message: 'Login successful',
        data: {
          access_token: 'eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9...',
          type: 'Bearer',
          expiration_time: 300000,
        },
      },
    },
  })
  @ApiResponse({
    status: 400,
    description: 'Validation error',
    schema: {
      example: {
        statusCode: 400,
        message: 'Validation failed',
        errors: [
          {
            field: 'email',
            message: 'Email is required',
          },
        ],
      },
    },
  })
  @ApiResponse({
    status: 401,
    description: 'Invalid credentials',
    schema: {
      example: {
        statusCode: 401,
        code: 'LOGIN_INVALID_CREDENTIALS',
        message: 'Invalid credentials',
      },
    },
  })
  @ApiResponse({
    status: 403,
    description: 'Email not verified',
    schema: {
      example: {
        statusCode: 403,
        code: 'LOGIN_EMAIL_NOT_VERIFIED',
        message:
          'Email verification required. Please verify your email before logging in',
      },
    },
  })
  @ApiResponse({
    status: 500,
    description: 'Token generation failed',
    schema: {
      example: {
        statusCode: 500,
        code: 'LOGIN_TOKEN_GENERATION_FAILED',
        message: 'Failed to generate access token',
      },
    },
  })
  async login(
    @Body() dto: LoginDto,
    @Headers('x-lang') lang?: string,
  ): Promise<ILoginResponse> {
    return this.service.login(dto, lang);
  }
}
