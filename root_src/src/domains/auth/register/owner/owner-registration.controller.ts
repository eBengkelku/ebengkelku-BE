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
import { OwnerRegistrationService } from './owner-registration.service';
import { CreateOwnerDto } from './dto';
import { IRegistrationResponse } from './interfaces';
import { Public } from '../../../../common/decorators/public.decorator';

/**
 * Owner Registration Controller
 *
 * HTTP controller for owner registration endpoint.
 * Handles POST /v1/auth/register/owner
 *
 * @class OwnerRegistrationController
 * @version 1.0.0
 * @since 2026-01-29
 */
@Controller('v1/auth/register')
@ApiTags('Auth - Registration')
export class OwnerRegistrationController {
  constructor(private readonly service: OwnerRegistrationService) {}

  /**
   * Register a new owner account
   *
   * Creates a new workshop owner with email/password authentication.
   * Automatically assigns the "owner" role and sets email as verified.
   *
   * @param dto - Owner registration data
   * @param lang - Language for response messages (optional)
   * @returns Registration response with user data
   */
  @Post('owner')
  @Public() // Bypass JWT authentication
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Register a new workshop owner account',
    description: `
      Creates a new workshop owner account using email and password authentication.
      
      **Features:**
      - Automatically assigns the "owner" role
      - Sets email_verified_at to current timestamp
      - Encrypts PII data (name, email, phone)
      - Hashes password using bcrypt
      
      **Note:** This endpoint does NOT return a JWT token. 
      Use the login endpoint after registration to obtain a token.
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
  @ApiBody({ type: CreateOwnerDto })
  @ApiResponse({
    status: 201,
    description: 'Owner registered successfully',
    schema: {
      example: {
        success: true,
        message: 'Workshop owner registered successfully',
        data: {
          id: '123e4567-e89b-12d3-a456-426614174000',
          public_id: '123e4567-e89b-12d3-a456-426614174001',
          name: 'John Doe',
          email: 'owner@example.com',
          phone: '+6281234567890',
          image: null,
          provider: null,
          provider_id: null,
          email_verified_at: '2026-01-29T15:00:00.000Z',
          created_at: '2026-01-29T15:00:00.000Z',
          updated_at: null,
          deleted_at: null,
          id_creator: null,
          id_updater: null,
          roles: [
            {
              id: 'role-uuid',
              key: 'owner',
              name: 'Owner',
              description: 'Workshop owner role',
            },
          ],
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
            message: 'Email must be a valid email address',
          },
        ],
      },
    },
  })
  @ApiResponse({
    status: 409,
    description: 'Email already exists',
    schema: {
      example: {
        statusCode: 409,
        code: 'OWNER_EMAIL_ALREADY_EXISTS',
        message: 'Email address is already registered',
      },
    },
  })
  async register(
    @Body() dto: CreateOwnerDto,
    @Headers('x-lang') lang?: string,
  ): Promise<IRegistrationResponse> {
    return this.service.register(dto, lang);
  }
}
