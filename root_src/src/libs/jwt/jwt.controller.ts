/**
 * JWT Controller
 *
 * REST endpoint for JWT token generation.
 *
 * @module Libs/JWT
 * @version 1.0.0
 * @since 2026-01-27
 */

import {
  Controller,
  Post,
  Body,
  HttpCode,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { I18nService } from 'nestjs-i18n';

import { JwtService } from './services/jwt.service';
import { GenerateTokenDto, TokenResponseDto } from './dto';
import {
  JWT_DEFAULT_EXPIRATION_MS,
  JWT_ENV_VARS,
} from './constants/jwt.constants';
import { ConfigService } from '@nestjs/config';

/**
 * JWT Controller for token generation
 */
@Controller('v1/jwt')
export class JwtController {
  private readonly logger = new Logger(JwtController.name);
  private readonly expirationMs: number;

  constructor(
    private readonly jwtService: JwtService,
    private readonly i18n: I18nService,
    private readonly configService: ConfigService,
  ) {
    this.expirationMs =
      this.configService.get<number>(JWT_ENV_VARS.EXPIRED_TIME) ??
      JWT_DEFAULT_EXPIRATION_MS;
  }

  /**
   * Generate a new access token
   *
   * @param dto - Token generation request
   * @returns Generated token response
   */
  @Post('generate')
  @HttpCode(HttpStatus.OK)
  async generateToken(
    @Body() dto: GenerateTokenDto,
  ): Promise<TokenResponseDto> {
    this.logger.log(`Generating token for user: ${dto.publicId}`);

    const token = await this.jwtService.generateAccessToken(dto.publicId, {
      expiresInMs: dto.expiresInMs,
      jtiPrefix: dto.jtiPrefix,
    });

    const expirationMs = dto.expiresInMs ?? this.expirationMs;

    return {
      success: true,
      message: this.i18n.t('jwt.success.tokenGenerated'),
      accessToken: token,
      tokenType: 'Bearer',
      expiresIn: Math.floor(expirationMs / 1000),
    };
  }
}
