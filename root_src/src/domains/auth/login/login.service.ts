import {
  Injectable,
  UnauthorizedException,
  ForbiddenException,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { I18nService } from 'nestjs-i18n';
import { ConfigService } from '@nestjs/config';
import { LoginRepository } from './repository/login.repository';
import { LoginDto } from './dto';
import { ILoginResponse } from './interfaces';
import { LoginErrorCodes } from './errors';
import { JwtService } from '../../../libs/jwt/services/jwt.service';
import {
  JWT_TOKEN_TYPE,
  JWT_DEFAULT_EXPIRATION_MS,
  JWT_ENV_VARS,
} from '../../../libs/jwt/constants/jwt.constants';

/**
 * Login Service
 *
 * Application service for user login operations.
 * Orchestrates the authentication flow including credential validation,
 * password verification, and JWT token generation.
 *
 * Uses UserModel for domain logic (isActive, isEmailVerified, hasPasswordAuth).
 *
 * @class LoginService
 * @version 1.0.0
 * @since 2026-01-28
 */
@Injectable()
export class LoginService {
  private readonly logger = new Logger(LoginService.name);
  private readonly expirationMs: number;

  constructor(
    private readonly repository: LoginRepository,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly i18n: I18nService,
  ) {
    this.expirationMs =
      this.configService.get<number>(JWT_ENV_VARS.EXPIRED_TIME) ??
      JWT_DEFAULT_EXPIRATION_MS;
  }

  /**
   * Authenticate user and generate JWT token
   *
   * Flow:
   * 1. Normalize email (lowercase, trim)
   * 2. Find user by email (repository returns UserModel)
   * 3. Check if user exists via UserModel
   * 4. Check if account is active via UserModel.isActive()
   * 5. Check if email is verified via UserModel.isEmailVerified()
   * 6. Check if user has password auth via UserModel.hasPasswordAuth()
   * 7. Verify password using bcrypt
   * 8. Generate JWT token
   * 9. Return token response
   *
   * @param dto - Login credentials
   * @param lang - Language for i18n (optional)
   * @returns Login response with access token
   * @throws UnauthorizedException - Invalid credentials or deleted account
   * @throws ForbiddenException - Email not verified
   * @throws InternalServerErrorException - Token generation failed
   */
  async login(dto: LoginDto, lang?: string): Promise<ILoginResponse> {
    const normalizedEmail = dto.email.toLowerCase().trim();

    this.logger.log(`Login attempt for email: ${normalizedEmail}`);

    // Step 1: Find user by email - repository returns UserModel
    const user = await this.repository.findByEmail(normalizedEmail);

    // Step 2: Check if user exists (generic error to prevent enumeration)
    if (!user) {
      this.logger.warn(`Login failed: Email not found - ${normalizedEmail}`);
      throw new UnauthorizedException({
        code: LoginErrorCodes.INVALID_CREDENTIALS,
        message: this.i18n.t('login.errors.invalidCredentials', { lang }),
      });
    }

    // Step 3: Check if account is active using UserModel method (same generic error)
    if (!user.isActive()) {
      this.logger.warn(`Login failed: Account deleted - ${normalizedEmail}`);
      throw new UnauthorizedException({
        code: LoginErrorCodes.INVALID_CREDENTIALS,
        message: this.i18n.t('login.errors.invalidCredentials', { lang }),
      });
    }

    // Step 4: Check if email is verified using UserModel method (specific error)
    if (!user.isEmailVerified()) {
      this.logger.warn(`Login failed: Email not verified - ${normalizedEmail}`);
      throw new ForbiddenException({
        code: LoginErrorCodes.EMAIL_NOT_VERIFIED,
        message: this.i18n.t('login.errors.emailNotVerified', { lang }),
      });
    }

    // Step 5: Check if user has password auth using UserModel method (not OAuth-only user)
    if (!user.hasPasswordAuth()) {
      this.logger.warn(
        `Login failed: No password set (OAuth user) - ${normalizedEmail}`,
      );
      throw new UnauthorizedException({
        code: LoginErrorCodes.INVALID_CREDENTIALS,
        message: this.i18n.t('login.errors.invalidCredentials', { lang }),
      });
    }

    // Step 6: Verify password using bcrypt
    const isPasswordValid = await bcrypt.compare(dto.password, user.password!);

    if (!isPasswordValid) {
      this.logger.warn(`Login failed: Invalid password - ${normalizedEmail}`);
      throw new UnauthorizedException({
        code: LoginErrorCodes.INVALID_CREDENTIALS,
        message: this.i18n.t('login.errors.invalidCredentials', { lang }),
      });
    }

    // Step 7: Generate JWT token using publicId from UserModel
    let accessToken: string;
    try {
      accessToken = await this.jwtService.generateAccessToken(user.publicId);
    } catch (error) {
      this.logger.error(
        `Token generation failed for ${user.publicId}: ${error.message}`,
        error.stack,
      );
      throw new InternalServerErrorException({
        code: LoginErrorCodes.TOKEN_GENERATION_FAILED,
        message: this.i18n.t('login.errors.tokenGenerationFailed', { lang }),
      });
    }

    // Step 8: Log successful login
    this.logger.log(`Login successful for user: ${user.publicId}`);

    // Step 9: Return response
    return {
      success: true,
      message: this.i18n.t('login.success', { lang }),
      data: {
        access_token: accessToken,
        type: JWT_TOKEN_TYPE,
        expiration_time: this.expirationMs,
      },
    };
  }
}
