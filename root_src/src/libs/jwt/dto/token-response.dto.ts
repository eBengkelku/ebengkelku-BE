/**
 * Token Response DTO
 *
 * @module Libs/JWT/DTO
 * @version 1.0.0
 * @since 2026-01-27
 */

/**
 * Response DTO for generated token
 */
export class TokenResponseDto {
  /**
   * Whether the operation was successful
   */
  success: boolean;

  /**
   * Response message
   */
  message: string;

  /**
   * Generated access token
   */
  accessToken: string;

  /**
   * Token type (always Bearer)
   */
  tokenType: 'Bearer';

  /**
   * Token expiration time in seconds
   */
  expiresIn: number;
}
