import {
  IsNotEmpty,
  IsString,
  IsOptional,
  IsEmail,
  Length,
  MinLength,
  Matches,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

/**
 * Password validation regex
 * Requires at least:
 * - 1 lowercase letter
 * - 1 uppercase letter
 * - 1 digit
 * - 1 special character (@$!%*?&)
 */
const PASSWORD_REGEX =
  /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&\s]{8,}$/;

/**
 * Create Customer DTO
 *
 * Data Transfer Object for customer registration endpoint.
 * Handles validation of incoming registration data.
 *
 * @class CreateCustomerDto
 * @version 1.0.0
 * @since 2026-01-27
 */
export class CreateCustomerDto {
  @ApiProperty({
    description: 'Customer full name',
    example: 'John Doe',
    minLength: 1,
    maxLength: 255,
  })
  @IsNotEmpty({ message: 'customerRegistration.validation.name.required' })
  @IsString({ message: 'customerRegistration.validation.name.string' })
  @Length(1, 255, { message: 'customerRegistration.validation.name.length' })
  name: string;

  @ApiProperty({
    description: 'Customer email address (must be unique)',
    example: 'john.doe@example.com',
    minLength: 1,
    maxLength: 255,
  })
  @IsNotEmpty({ message: 'customerRegistration.validation.email.required' })
  @IsEmail({}, { message: 'customerRegistration.validation.email.invalid' })
  @Length(1, 255, { message: 'customerRegistration.validation.email.length' })
  email: string;

  @ApiProperty({
    description:
      'Password (min 8 chars, must contain lowercase, uppercase, number, special char)',
    example: 'SecureP@ss123',
    minLength: 8,
  })
  @IsNotEmpty({ message: 'customerRegistration.validation.password.required' })
  @IsString({ message: 'customerRegistration.validation.password.string' })
  @MinLength(8, {
    message: 'customerRegistration.validation.password.minLength',
  })
  @Matches(PASSWORD_REGEX, {
    message: 'customerRegistration.validation.password.complexity',
  })
  password: string;

  @ApiPropertyOptional({
    description: 'Customer phone number',
    example: '+6281234567890',
    maxLength: 50,
  })
  @IsOptional()
  @IsString({ message: 'customerRegistration.validation.phone.string' })
  @Length(1, 50, { message: 'customerRegistration.validation.phone.length' })
  phone?: string;

  @ApiPropertyOptional({
    description: 'Profile image URL',
    example: 'https://example.com/photo.jpg',
    maxLength: 500,
  })
  @IsOptional()
  @IsString({ message: 'customerRegistration.validation.image.string' })
  @Length(1, 500, { message: 'customerRegistration.validation.image.length' })
  image?: string;
}
