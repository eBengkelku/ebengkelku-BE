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
 * Create Owner DTO
 *
 * Data Transfer Object for owner registration endpoint.
 * Handles validation of incoming registration data.
 *
 * @class CreateOwnerDto
 * @version 1.0.0
 * @since 2026-01-29
 */
export class CreateOwnerDto {
  @ApiProperty({
    description: 'Owner full name',
    example: 'John Doe',
    minLength: 1,
    maxLength: 255,
  })
  @IsNotEmpty({ message: 'ownerRegistration.validation.name.required' })
  @IsString({ message: 'ownerRegistration.validation.name.string' })
  @Length(1, 255, { message: 'ownerRegistration.validation.name.length' })
  name: string;

  @ApiProperty({
    description: 'Owner email address (must be unique)',
    example: 'owner@example.com',
    minLength: 1,
    maxLength: 255,
  })
  @IsNotEmpty({ message: 'ownerRegistration.validation.email.required' })
  @IsEmail({}, { message: 'ownerRegistration.validation.email.invalid' })
  @Length(1, 255, { message: 'ownerRegistration.validation.email.length' })
  email: string;

  @ApiProperty({
    description:
      'Password (min 8 chars, must contain lowercase, uppercase, number, special char)',
    example: 'SecureP@ss123',
    minLength: 8,
  })
  @IsNotEmpty({ message: 'ownerRegistration.validation.password.required' })
  @IsString({ message: 'ownerRegistration.validation.password.string' })
  @MinLength(8, {
    message: 'ownerRegistration.validation.password.minLength',
  })
  @Matches(PASSWORD_REGEX, {
    message: 'ownerRegistration.validation.password.complexity',
  })
  password: string;

  @ApiPropertyOptional({
    description: 'Owner phone number',
    example: '+6281234567890',
    maxLength: 50,
  })
  @IsOptional()
  @IsString({ message: 'ownerRegistration.validation.phone.string' })
  @Length(1, 50, { message: 'ownerRegistration.validation.phone.length' })
  phone?: string;

  @ApiPropertyOptional({
    description: 'Profile image URL',
    example: 'https://example.com/photo.jpg',
    maxLength: 500,
  })
  @IsOptional()
  @IsString({ message: 'ownerRegistration.validation.image.string' })
  @Length(1, 500, { message: 'ownerRegistration.validation.image.length' })
  image?: string;
}
