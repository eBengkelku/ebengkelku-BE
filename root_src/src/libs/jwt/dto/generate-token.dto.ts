/**
 * Generate Token DTO
 *
 * @module Libs/JWT/DTO
 * @version 1.0.0
 * @since 2026-01-27
 */

import { IsString, IsUUID, IsOptional, IsNumber, Min } from 'class-validator';

/**
 * DTO for generating access token
 */
export class GenerateTokenDto {
  /**
   * User's public_id (UUID v4)
   */
  @IsString()
  @IsUUID('4')
  publicId: string;

  /**
   * Optional custom expiration time in milliseconds
   */
  @IsOptional()
  @IsNumber()
  @Min(1000)
  expiresInMs?: number;

  /**
   * Optional JTI prefix
   */
  @IsOptional()
  @IsString()
  jtiPrefix?: string;
}
