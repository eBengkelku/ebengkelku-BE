import { IsNotEmpty, IsString, IsEmail } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

/**
 * Login DTO
 *
 * Data Transfer Object for user login endpoint.
 * Handles validation of incoming login credentials.
 *
 * @class LoginDto
 * @version 1.0.0
 * @since 2026-01-28
 */
export class LoginDto {
  @ApiProperty({
    description: 'User email address',
    example: 'john.doe@example.com',
  })
  @IsNotEmpty({ message: 'login.validation.email.required' })
  @IsEmail({}, { message: 'login.validation.email.invalid' })
  email: string;

  @ApiProperty({
    description: 'User password',
    example: 'SecureP@ss123',
  })
  @IsNotEmpty({ message: 'login.validation.password.required' })
  @IsString({ message: 'login.validation.password.string' })
  password: string;
}
