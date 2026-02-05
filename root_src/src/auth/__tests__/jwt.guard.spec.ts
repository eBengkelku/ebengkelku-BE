import { Test, TestingModule } from '@nestjs/testing';
import { ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { I18nService } from 'nestjs-i18n';
import { JwtAuthGuard } from '../jwt.guard';
import { AuthService, AccessUser } from '../auth.service';
import { IS_PUBLIC_KEY } from '@/common/decorators/public.decorator';

describe('JwtAuthGuard', () => {
  let guard: JwtAuthGuard;
  let reflector: jest.Mocked<Reflector>;
  let i18nService: jest.Mocked<I18nService>;

  // Mock data
  const mockAccessUser: AccessUser = {
    sub: 'user-123',
    email: 'test@example.com',
    name: 'testuser',
    roles: 'user',
    permissions: ['read'],
  };

  const mockI18nService = {
    t: jest.fn().mockImplementation((key: string) => {
      const translations: Record<string, string> = {
        'auth.errors.noToken': 'Authorization token is required',
        'auth.errors.unauthorized': 'Unauthorized access',
      };
      return translations[key] || key;
    }),
  };

  const mockReflector = {
    getAllAndOverride: jest.fn(),
  };

  const mockAuthService = {
    verifyAccessToken: jest.fn(),
  };

  // Helper function to create delayed mock
  const delay = (ms: number): Promise<void> =>
    new Promise((resolve) => setTimeout(resolve, ms));

  let mockRequest: any;
  let mockExecutionContext: ExecutionContext;

  beforeEach(async () => {
    // Reset all mocks
    jest.clearAllMocks();

    // Setup mock request
    mockRequest = {
      headers: {},
      user: null,
      auth_metrics: null,
    };

    // Setup mock execution context
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
      getHandler: jest.fn(),
      getClass: jest.fn(),
    } as unknown as ExecutionContext;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        JwtAuthGuard,
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
      ],
    }).compile();

    guard = module.get<JwtAuthGuard>(JwtAuthGuard);
    reflector = module.get(Reflector);
    i18nService = module.get(I18nService);
  });

  describe('Basic functionality', () => {
    it('should be defined', () => {
      expect(guard).toBeDefined();
    });

    it('should allow access when @Public() decorator is present', async () => {
      mockReflector.getAllAndOverride.mockReturnValue(true);

      const result = await guard.canActivate(mockExecutionContext);

      expect(result).toBe(true);
      expect(reflector.getAllAndOverride).toHaveBeenCalledWith(IS_PUBLIC_KEY, [
        mockExecutionContext.getHandler(),
        mockExecutionContext.getClass(),
      ]);
      // Should not check auth service
      expect(mockAuthService.verifyAccessToken).not.toHaveBeenCalled();
    });
  });

  describe('JWT Authentication', () => {
    beforeEach(() => {
      // Non-public route
      mockReflector.getAllAndOverride.mockReturnValue(false);
    });

    it('should throw UnauthorizedException when no Authorization header', async () => {
      mockRequest.headers = {};

      await expect(guard.canActivate(mockExecutionContext)).rejects.toThrow(
        UnauthorizedException,
      );

      expect(i18nService.t).toHaveBeenCalledWith('auth.errors.noToken', {
        lang: 'en',
      });
    });

    it('should throw UnauthorizedException when Authorization header is malformed', async () => {
      mockRequest.headers = {
        authorization: 'InvalidToken',
        'x-lang': 'en',
      };

      await expect(guard.canActivate(mockExecutionContext)).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it('should throw UnauthorizedException when Authorization header does not start with Bearer', async () => {
      mockRequest.headers = {
        authorization: 'Basic sometoken',
        'x-lang': 'en',
      };

      await expect(guard.canActivate(mockExecutionContext)).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it('should allow access when JWT token is valid', async () => {
      mockRequest.headers = {
        authorization: 'Bearer valid-jwt-token',
        'x-lang': 'en',
      };
      mockAuthService.verifyAccessToken.mockResolvedValue(mockAccessUser);

      const result = await guard.canActivate(mockExecutionContext);

      expect(result).toBe(true);
      expect(mockRequest.user).toEqual(mockAccessUser);
      expect(mockRequest.auth_metrics).toHaveProperty('verify_duration_ms');
    });

    it('should verify JWT token with auth service', async () => {
      mockRequest.headers = {
        authorization: 'Bearer valid-jwt-token',
        'x-lang': 'en',
      };
      mockAuthService.verifyAccessToken.mockResolvedValue(mockAccessUser);

      await guard.canActivate(mockExecutionContext);

      expect(mockAuthService.verifyAccessToken).toHaveBeenCalledWith(
        'valid-jwt-token',
        'en',
      );
    });

    it('should throw error when JWT token is invalid', async () => {
      mockRequest.headers = {
        authorization: 'Bearer invalid-jwt-token',
        'x-lang': 'en',
      };

      const invalidTokenError = new Error('Invalid JWT token');
      mockAuthService.verifyAccessToken.mockRejectedValue(invalidTokenError);

      await expect(guard.canActivate(mockExecutionContext)).rejects.toThrow(
        'Invalid JWT token',
      );

      expect(mockAuthService.verifyAccessToken).toHaveBeenCalledWith(
        'invalid-jwt-token',
        'en',
      );
    });

    it('should throw error when JWT token is expired', async () => {
      mockRequest.headers = {
        authorization: 'Bearer expired-jwt-token',
        'x-lang': 'en',
      };

      const expiredTokenError = new Error('JWT token has expired');
      mockAuthService.verifyAccessToken.mockRejectedValue(expiredTokenError);

      await expect(guard.canActivate(mockExecutionContext)).rejects.toThrow(
        'JWT token has expired',
      );
    });

    it('should use default language when x-lang header is missing', async () => {
      mockRequest.headers = {
        authorization: 'Bearer valid-jwt-token',
        // No x-lang header
      };
      mockAuthService.verifyAccessToken.mockResolvedValue(mockAccessUser);

      await guard.canActivate(mockExecutionContext);

      expect(mockAuthService.verifyAccessToken).toHaveBeenCalledWith(
        'valid-jwt-token',
        'en', // Default language
      );
    });

    it('should use provided x-lang header value', async () => {
      mockRequest.headers = {
        authorization: 'Bearer valid-jwt-token',
        'x-lang': 'id',
      };
      mockAuthService.verifyAccessToken.mockResolvedValue(mockAccessUser);

      await guard.canActivate(mockExecutionContext);

      expect(mockAuthService.verifyAccessToken).toHaveBeenCalledWith(
        'valid-jwt-token',
        'id',
      );
    });

    it('should measure JWT verification duration', async () => {
      mockRequest.headers = {
        authorization: 'Bearer valid-jwt-token',
        'x-lang': 'en',
      };

      // Simulate some processing time
      mockAuthService.verifyAccessToken.mockImplementation(async () => {
        await delay(50);
        return mockAccessUser;
      });

      await guard.canActivate(mockExecutionContext);

      expect(mockRequest.auth_metrics).toHaveProperty('verify_duration_ms');
      expect(
        mockRequest.auth_metrics.verify_duration_ms,
      ).toBeGreaterThanOrEqual(0);
    });
  });

  describe('Edge cases', () => {
    beforeEach(() => {
      mockReflector.getAllAndOverride.mockReturnValue(false);
    });

    it('should handle empty Bearer token', async () => {
      mockRequest.headers = {
        authorization: 'Bearer ',
        'x-lang': 'en',
      };

      const emptyTokenError = new Error('Token is empty');
      mockAuthService.verifyAccessToken.mockRejectedValue(emptyTokenError);

      await expect(guard.canActivate(mockExecutionContext)).rejects.toThrow(
        'Token is empty',
      );
    });

    it('should attach user to request on successful verification', async () => {
      mockRequest.headers = {
        authorization: 'Bearer valid-jwt-token',
        'x-lang': 'en',
      };
      mockAuthService.verifyAccessToken.mockResolvedValue(mockAccessUser);

      await guard.canActivate(mockExecutionContext);

      expect(mockRequest.user).toBeDefined();
      expect(mockRequest.user.sub).toBe('user-123');
      expect(mockRequest.user.email).toBe('test@example.com');
    });
  });
});
