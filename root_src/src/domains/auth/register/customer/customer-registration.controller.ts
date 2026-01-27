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
import { CustomerRegistrationService } from './customer-registration.service';
import { CreateCustomerDto } from './dto';
import { IRegistrationResponse } from './interfaces';
import { Public } from '../../../../common/decorators/public.decorator';

/**
 * Customer Registration Controller
 *
 * HTTP controller for customer registration endpoint.
 * Handles POST /v1/auth/register/customer
 *
 * @class CustomerRegistrationController
 * @version 1.0.0
 * @since 2026-01-27
 */
@Controller('v1/auth/register')
@ApiTags('Auth - Registration')
export class CustomerRegistrationController {
  constructor(private readonly service: CustomerRegistrationService) {}

  /**
   * Register a new customer account
   *
   * Creates a new customer with email/password authentication.
   * Automatically assigns the "customer" role and sets email as verified.
   *
   * @param dto - Customer registration data
   * @param lang - Language for response messages (optional)
   * @returns Registration response with user data
   */
  @Post('customer')
  @Public() // Bypass JWT authentication
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Register a new customer account',
    description: `
      Creates a new customer account using email and password authentication.
      
      **Features:**
      - Automatically assigns the "customer" role
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
  @ApiBody({ type: CreateCustomerDto })
  @ApiResponse({
    status: 201,
    description: 'Customer registered successfully',
    schema: {
      example: {
        success: true,
        message: 'Customer registered successfully',
        data: {
          id: '123e4567-e89b-12d3-a456-426614174000',
          public_id: '123e4567-e89b-12d3-a456-426614174001',
          name: 'John Doe',
          email: 'john.doe@example.com',
          phone: '+6281234567890',
          image: null,
          provider: null,
          provider_id: null,
          email_verified_at: '2026-01-27T15:00:00.000Z',
          created_at: '2026-01-27T15:00:00.000Z',
          updated_at: null,
          deleted_at: null,
          id_creator: null,
          id_updater: null,
          roles: [
            {
              id: 'role-uuid',
              key: 'customer',
              name: 'Customer',
              description: 'Customer role description',
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
        code: 'CUSTOMER_EMAIL_ALREADY_EXISTS',
        message: 'Email address is already registered',
      },
    },
  })
  async register(
    @Body() dto: CreateCustomerDto,
    @Headers('x-lang') lang?: string,
  ): Promise<IRegistrationResponse> {
    return this.service.register(dto, lang);
  }
}
