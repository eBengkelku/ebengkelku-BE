import { Test, TestingModule } from '@nestjs/testing';
import { ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { I18nService } from 'nestjs-i18n';
import { AuthController } from '../auth.controller';
import { AuthService, AccessUser } from '../auth.service';
import { JwtAuthGuard } from '../jwt.guard';
import { IS_PUBLIC_KEY } from '@/common/decorators/public.decorator';

describe('AuthController - getCurrentUser with JwtAuthGuard', () => {
  let controller: AuthController;
  let authService: AuthService;
  let jwtAuthGuard: JwtAuthGuard;
  let reflector: Reflector;
  let i18nService: I18nService;

  // Mock data
  const mockAccessUser: AccessUser = {
    sub: 'user-123',
    email: 'test@example.com',
    name: 'Test User',
  };

  const mockAuthService = {
    verifyAccessToken: jest.fn(),
    i18n: {
      t: jest.fn().mockReturnValue('Existing user validated'),
    },
  };

  const mockI18nService = {
    t: jest.fn().mockImplementation((key: string) => {
      const translations: Record<string, string> = {
        'auth.errors.noToken': 'Authorization token is required',
        'auth.errors.unauthorized': 'Unauthorized access',
        'common.jwt.expired': 'JWT token has expired',
        'common.jwt.invalid': 'Invalid JWT token',
        'common.jwt.audienceMismatch': 'JWT audience mismatch',
        'common.jwt.issuerMismatch': 'JWT issuer mismatch',
        'common.jwt.noMatchingKey':
          'No matching key found for JWT verification',
        'auth.errors.tokenMissingOrTooLarge': 'Token is missing or too large',
        'auth.errors.invalidAudience': 'Invalid token audience',
      };
      return translations[key] || key;
    }),
  };

  const mockReflector = {
    getAllAndOverride: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [
        {
          provide: AuthService,
          useValue: mockAuthService,
        },
        {
          provide: I18nService,
          useValue: mockI18nService,
        },
        {
          provide: Reflector,
          useValue: mockReflector,
        },
        JwtAuthGuard,
      ],
    }).compile();

    controller = module.get<AuthController>(AuthController);
    authService = module.get<AuthService>(AuthService);
    jwtAuthGuard = module.get<JwtAuthGuard>(JwtAuthGuard);
    reflector = module.get<Reflector>(Reflector);
    i18nService = module.get<I18nService>(I18nService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('getCurrentUser', () => {
    it('should return current user when JWT is valid', async () => {
      // Test the controller method directly
      const result = await controller.getCurrentUser(mockAccessUser, 'en');

      expect(result).toEqual({
        success: true,
        message: 'Existing user validated',
        data: {
          user: mockAccessUser,
        },
      });
      expect(authService['i18n'].t).toHaveBeenCalledWith(
        'auth.existingUserValidated',
        { lang: 'en' },
      );
    });

    it('should handle missing language header', async () => {
      const result = await controller.getCurrentUser(mockAccessUser);

      expect(result.success).toBe(true);
      expect(result.data.user).toEqual(mockAccessUser);
    });
  });

  describe('JwtAuthGuard', () => {
    let mockExecutionContext: ExecutionContext;
    let mockRequest: any;
    let mockGetHandler: jest.Mock;
    let mockGetClass: jest.Mock;

    beforeEach(() => {
      mockRequest = {
        headers: {},
        user: null,
      };

      mockGetHandler = jest.fn();
      mockGetClass = jest.fn();

      mockExecutionContext = {
        switchToHttp: () => ({
          getRequest: () => mockRequest,
          getResponse: jest.fn(),
          getNext: jest.fn(),
        }),
        switchToRpc: jest.fn(),
        switchToWs: jest.fn(),
        getArgs: jest.fn(),
        getArgByIndex: jest.fn(),
        getType: jest.fn(),
        getHandler: () => mockGetHandler,
        getClass: () => mockGetClass,
      } as ExecutionContext;
    });

    it('should allow access when @Public() decorator is present', async () => {
      // Mock @Public() decorator present
      mockReflector.getAllAndOverride.mockReturnValue(true);

      const result = await jwtAuthGuard.canActivate(
        mockExecutionContext as ExecutionContext,
      );

      expect(result).toBe(true);
      expect(reflector.getAllAndOverride).toHaveBeenCalledWith(IS_PUBLIC_KEY, [
        mockExecutionContext.getHandler(),
        mockExecutionContext.getClass(),
      ]);
    });

    it('should throw UnauthorizedException when no Authorization header', async () => {
      // Mock no @Public() decorator
      mockReflector.getAllAndOverride.mockReturnValue(false);

      // No Authorization header
      mockRequest.headers = {};

      await expect(
        jwtAuthGuard.canActivate(mockExecutionContext as ExecutionContext),
      ).rejects.toThrow(UnauthorizedException);

      expect(i18nService.t).toHaveBeenCalledWith('auth.errors.noToken', {
        lang: 'en',
      });
    });

    it('should throw UnauthorizedException when Authorization header is malformed', async () => {
      mockReflector.getAllAndOverride.mockReturnValue(false);

      // Malformed Authorization header
      mockRequest.headers = {
        authorization: 'InvalidToken',
        'x-lang': 'en',
      };

      await expect(
        jwtAuthGuard.canActivate(mockExecutionContext as ExecutionContext),
      ).rejects.toThrow(UnauthorizedException);

      expect(i18nService.t).toHaveBeenCalledWith('auth.errors.noToken', {
        lang: 'en',
      });
    });

    it('should allow access when JWT token is valid', async () => {
      mockReflector.getAllAndOverride.mockReturnValue(false);

      // Valid Authorization header
      mockRequest.headers = {
        authorization: 'Bearer valid-jwt-token',
        'x-lang': 'en',
      };

      // Mock successful token verification
      mockAuthService.verifyAccessToken.mockResolvedValue(mockAccessUser);

      const result = await jwtAuthGuard.canActivate(
        mockExecutionContext as ExecutionContext,
      );

      expect(result).toBe(true);
      expect(mockRequest.user).toEqual(mockAccessUser);
      expect(mockRequest.auth_metrics).toHaveProperty('verify_duration_ms');
      expect(authService.verifyAccessToken).toHaveBeenCalledWith(
        'valid-jwt-token',
        'en',
      );
    });

    it('should throw error when JWT token is invalid', async () => {
      mockReflector.getAllAndOverride.mockReturnValue(false);

      mockRequest.headers = {
        authorization: 'Bearer invalid-jwt-token',
        'x-lang': 'en',
      };

      // Mock token verification failure with realistic error
      const invalidTokenError = new Error('Invalid JWT token');
      mockAuthService.verifyAccessToken.mockRejectedValue(invalidTokenError);

      await expect(
        jwtAuthGuard.canActivate(mockExecutionContext as ExecutionContext),
      ).rejects.toThrow('Invalid JWT token');

      expect(authService.verifyAccessToken).toHaveBeenCalledWith(
        'invalid-jwt-token',
        'en',
      );
    });

    it('should use default language when x-lang header is missing', async () => {
      mockReflector.getAllAndOverride.mockReturnValue(false);

      mockRequest.headers = {
        authorization: 'Bearer valid-jwt-token',
        // No x-lang header
      };

      mockAuthService.verifyAccessToken.mockResolvedValue(mockAccessUser);

      await jwtAuthGuard.canActivate(mockExecutionContext as ExecutionContext);

      expect(authService.verifyAccessToken).toHaveBeenCalledWith(
        'valid-jwt-token',
        'en', // Default language
      );
    });

    it('should throw error when JWT token is expired', async () => {
      mockReflector.getAllAndOverride.mockReturnValue(false);

      mockRequest.headers = {
        authorization: 'Bearer expired-jwt-token',
        'x-lang': 'en',
      };

      // Mock token verification failure with expired token error
      const expiredTokenError = new Error('JWT token has expired');
      mockAuthService.verifyAccessToken.mockRejectedValue(expiredTokenError);

      await expect(
        jwtAuthGuard.canActivate(mockExecutionContext as ExecutionContext),
      ).rejects.toThrow('JWT token has expired');

      expect(authService.verifyAccessToken).toHaveBeenCalledWith(
        'expired-jwt-token',
        'en',
      );
    });

    it('should throw error when JWT audience is invalid', async () => {
      mockReflector.getAllAndOverride.mockReturnValue(false);

      mockRequest.headers = {
        authorization: 'Bearer wrong-audience-token',
        'x-lang': 'en',
      };

      // Mock token verification failure with audience mismatch error
      const audienceError = new Error('Invalid token audience');
      mockAuthService.verifyAccessToken.mockRejectedValue(audienceError);

      await expect(
        jwtAuthGuard.canActivate(mockExecutionContext as ExecutionContext),
      ).rejects.toThrow('Invalid token audience');

      expect(authService.verifyAccessToken).toHaveBeenCalledWith(
        'wrong-audience-token',
        'en',
      );
    });

    it('should throw error when JWT issuer is invalid', async () => {
      mockReflector.getAllAndOverride.mockReturnValue(false);

      mockRequest.headers = {
        authorization: 'Bearer wrong-issuer-token',
        'x-lang': 'en',
      };

      // Mock token verification failure with issuer mismatch error
      const issuerError = new Error('JWT issuer mismatch');
      mockAuthService.verifyAccessToken.mockRejectedValue(issuerError);

      await expect(
        jwtAuthGuard.canActivate(mockExecutionContext as ExecutionContext),
      ).rejects.toThrow('JWT issuer mismatch');

      expect(authService.verifyAccessToken).toHaveBeenCalledWith(
        'wrong-issuer-token',
        'en',
      );
    });

    it('should throw error when no matching key found for JWT verification', async () => {
      mockReflector.getAllAndOverride.mockReturnValue(false);

      mockRequest.headers = {
        authorization: 'Bearer no-matching-key-token',
        'x-lang': 'en',
      };

      // Mock token verification failure with no matching key error
      const noKeyError = new Error(
        'No matching key found for JWT verification',
      );
      mockAuthService.verifyAccessToken.mockRejectedValue(noKeyError);

      await expect(
        jwtAuthGuard.canActivate(mockExecutionContext as ExecutionContext),
      ).rejects.toThrow('No matching key found for JWT verification');

      expect(authService.verifyAccessToken).toHaveBeenCalledWith(
        'no-matching-key-token',
        'en',
      );
    });

    it('should throw error for unauthorized access (fallback error)', async () => {
      mockReflector.getAllAndOverride.mockReturnValue(false);

      mockRequest.headers = {
        authorization: 'Bearer unknown-error-token',
        'x-lang': 'en',
      };

      // Mock token verification failure with general unauthorized error
      const unauthorizedError = new Error('Unauthorized access');
      mockAuthService.verifyAccessToken.mockRejectedValue(unauthorizedError);

      await expect(
        jwtAuthGuard.canActivate(mockExecutionContext as ExecutionContext),
      ).rejects.toThrow('Unauthorized access');

      expect(authService.verifyAccessToken).toHaveBeenCalledWith(
        'unknown-error-token',
        'en',
      );
    });

    it('should measure JWT verification duration', async () => {
      mockReflector.getAllAndOverride.mockReturnValue(false);

      mockRequest.headers = {
        authorization: 'Bearer valid-jwt-token',
        'x-lang': 'en',
      };

      // Simulate some processing time
      mockAuthService.verifyAccessToken.mockImplementation(
        () =>
          new Promise((resolve) => {
            setTimeout(() => resolve(mockAccessUser), 50);
          }),
      );

      await jwtAuthGuard.canActivate(mockExecutionContext as ExecutionContext);

      expect(mockRequest.auth_metrics).toHaveProperty('verify_duration_ms');
      expect(
        mockRequest.auth_metrics.verify_duration_ms,
      ).toBeGreaterThanOrEqual(0);
    });
  });

  describe('Integration Test - Guard + Controller', () => {
    it('should successfully get current user when JWT guard passes', async () => {
      // This simulates the full flow: Guard passes -> Controller executes
      const user = mockAccessUser;
      const lang = 'en';

      // Test controller method with authenticated user
      const result = await controller.getCurrentUser(user, lang);

      expect(result).toEqual({
        success: true,
        message: 'Existing user validated',
        data: { user },
      });
    });
  });
});
