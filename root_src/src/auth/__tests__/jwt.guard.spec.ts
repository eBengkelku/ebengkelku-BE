import { Test, TestingModule } from '@nestjs/testing';
import { ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Reflector } from '@nestjs/core';
import { I18nService } from 'nestjs-i18n';
import { JwtAuthGuard } from '../jwt.guard';
import { AuthService, AccessUser } from '../auth.service';
import { IS_PUBLIC_KEY } from '@/common/decorators/public.decorator';
import { NodeEnv } from '@/config';
import { getDevUser, DEV_MODE_BYPASS_MESSAGE } from '../dev-user.config';

describe('JwtAuthGuard', () => {
  let guard: JwtAuthGuard;
  let reflector: jest.Mocked<Reflector>;
  let i18nService: jest.Mocked<I18nService>;

  // Mock data
  const mockAccessUser: AccessUser = {
    sub: 'user-123',
    email: 'test@example.com',
    preferred_username: 'testuser',
    realm_access: { roles: ['user'] },
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

  const mockConfigService = {
    get: jest.fn(),
  };

  // Helper function to create delayed mock (extracted to reduce nesting depth)
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
        {
          provide: ConfigService,
          useValue: mockConfigService,
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
      // Should not check config or auth service
      expect(mockConfigService.get).not.toHaveBeenCalled();
      expect(mockAuthService.verifyAccessToken).not.toHaveBeenCalled();
    });
  });

  describe('Development mode bypass', () => {
    beforeEach(() => {
      // Non-public route
      mockReflector.getAllAndOverride.mockReturnValue(false);
    });

    it('should bypass auth in local environment', async () => {
      mockConfigService.get.mockReturnValue(NodeEnv.Local);

      const result = await guard.canActivate(mockExecutionContext);

      expect(result).toBe(true);
      expect(mockConfigService.get).toHaveBeenCalledWith('nodeEnv');
      expect(mockAuthService.verifyAccessToken).not.toHaveBeenCalled();
    });

    it('should bypass auth in development environment', async () => {
      mockConfigService.get.mockReturnValue(NodeEnv.Development);

      const result = await guard.canActivate(mockExecutionContext);

      expect(result).toBe(true);
      expect(mockConfigService.get).toHaveBeenCalledWith('nodeEnv');
      expect(mockAuthService.verifyAccessToken).not.toHaveBeenCalled();
    });

    it('should attach dev user to request in local mode', async () => {
      mockConfigService.get.mockReturnValue(NodeEnv.Local);

      await guard.canActivate(mockExecutionContext);

      expect(mockRequest.user).toBeDefined();
      expect(mockRequest.user.sub).toBe('dev-user-001');
      expect(mockRequest.user.preferred_username).toBe('developer');
      expect(mockRequest.user.email).toBe('dev@ebengkelku.local');
      expect(mockRequest.user.realm_access).toEqual({
        roles: ['admin', 'user'],
      });
    });

    it('should attach dev user to request in development mode', async () => {
      mockConfigService.get.mockReturnValue(NodeEnv.Development);

      await guard.canActivate(mockExecutionContext);

      expect(mockRequest.user).toBeDefined();
      expect(mockRequest.user.sub).toBe('dev-user-001');
      expect(mockRequest.user.preferred_username).toBe('developer');
      expect(mockRequest.user.email).toBe('dev@ebengkelku.local');
    });

    it('should set dev_mode_bypass flag in auth_metrics', async () => {
      mockConfigService.get.mockReturnValue(NodeEnv.Local);

      await guard.canActivate(mockExecutionContext);

      expect(mockRequest.auth_metrics).toBeDefined();
      expect(mockRequest.auth_metrics.dev_mode_bypass).toBe(true);
      expect(mockRequest.auth_metrics.verify_duration_ms).toBe(0);
    });

    it('should set verify_duration_ms to 0 in dev mode', async () => {
      mockConfigService.get.mockReturnValue(NodeEnv.Development);

      await guard.canActivate(mockExecutionContext);

      expect(mockRequest.auth_metrics.verify_duration_ms).toBe(0);
    });
  });

  describe('Production mode (strict auth)', () => {
    beforeEach(() => {
      // Non-public route
      mockReflector.getAllAndOverride.mockReturnValue(false);
      // Production environment
      mockConfigService.get.mockReturnValue(NodeEnv.Production);
    });

    it('should enforce auth in production environment', async () => {
      mockRequest.headers = {
        authorization: 'Bearer valid-jwt-token',
        'x-lang': 'en',
      };
      mockAuthService.verifyAccessToken.mockResolvedValue(mockAccessUser);

      const result = await guard.canActivate(mockExecutionContext);

      expect(result).toBe(true);
      expect(mockAuthService.verifyAccessToken).toHaveBeenCalledWith(
        'valid-jwt-token',
        'en',
      );
    });

    it('should throw UnauthorizedException when no Authorization header in production', async () => {
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

    it('should allow access when JWT token is valid in production', async () => {
      mockRequest.headers = {
        authorization: 'Bearer valid-jwt-token',
        'x-lang': 'en',
      };
      mockAuthService.verifyAccessToken.mockResolvedValue(mockAccessUser);

      const result = await guard.canActivate(mockExecutionContext);

      expect(result).toBe(true);
      expect(mockRequest.user).toEqual(mockAccessUser);
      expect(mockRequest.auth_metrics).toHaveProperty('verify_duration_ms');
      expect(mockRequest.auth_metrics.dev_mode_bypass).toBeUndefined();
    });

    it('should throw error when JWT token is invalid in production', async () => {
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

    it('should throw error when JWT token is expired in production', async () => {
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

      // Simulate some processing time using extracted delay helper
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

  describe('getDevUser configuration', () => {
    it('should return a valid AccessUser object', () => {
      const devUser = getDevUser();

      expect(devUser).toBeDefined();
      expect(devUser.sub).toBe('dev-user-001');
      expect(devUser.preferred_username).toBe('developer');
      expect(devUser.email).toBe('dev@ebengkelku.local');
    });

    it('should have admin and user roles', () => {
      const devUser = getDevUser();

      expect(devUser.realm_access).toBeDefined();
      expect(devUser.realm_access?.roles).toContain('admin');
      expect(devUser.realm_access?.roles).toContain('user');
    });

    it('should have valid iat and exp timestamps', () => {
      const now = Math.floor(Date.now() / 1000);
      const devUser = getDevUser();

      expect(devUser.iat).toBeDefined();
      expect(devUser.exp).toBeDefined();
      // iat should be close to current time (within 5 seconds)
      expect(Math.abs((devUser.iat as number) - now)).toBeLessThan(5);
      // exp should be approximately 1 day from now
      expect((devUser.exp as number) - (devUser.iat as number)).toBe(86400);
    });

    it('should return a new object on each call', () => {
      const devUser1 = getDevUser();
      const devUser2 = getDevUser();

      expect(devUser1).not.toBe(devUser2); // Different object references
      expect(devUser1.sub).toBe(devUser2.sub); // Same content
    });
  });

  describe('DEV_MODE_BYPASS_MESSAGE constant', () => {
    it('should be defined and contain relevant information', () => {
      expect(DEV_MODE_BYPASS_MESSAGE).toBeDefined();
      expect(DEV_MODE_BYPASS_MESSAGE).toContain('Development mode');
      expect(DEV_MODE_BYPASS_MESSAGE).toContain('bypass');
    });
  });

  describe('Edge cases', () => {
    beforeEach(() => {
      mockReflector.getAllAndOverride.mockReturnValue(false);
    });

    it('should handle undefined nodeEnv (defaults to production behavior)', async () => {
      mockConfigService.get.mockReturnValue(undefined);
      mockRequest.headers = {};

      // Should throw because undefined is not local/development
      await expect(guard.canActivate(mockExecutionContext)).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it('should handle null nodeEnv (defaults to production behavior)', async () => {
      mockConfigService.get.mockReturnValue(null);
      mockRequest.headers = {};

      // Should throw because null is not local/development
      await expect(guard.canActivate(mockExecutionContext)).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it('should handle unknown environment string (defaults to production behavior)', async () => {
      mockConfigService.get.mockReturnValue('staging');
      mockRequest.headers = {};

      // Should throw because 'staging' is not local/development
      await expect(guard.canActivate(mockExecutionContext)).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it('should bypass even with valid token in dev mode', async () => {
      mockConfigService.get.mockReturnValue(NodeEnv.Local);
      mockRequest.headers = {
        authorization: 'Bearer valid-jwt-token',
        'x-lang': 'en',
      };

      const result = await guard.canActivate(mockExecutionContext);

      expect(result).toBe(true);
      // Should use dev user, not verify the actual token
      expect(mockAuthService.verifyAccessToken).not.toHaveBeenCalled();
      expect(mockRequest.user.sub).toBe('dev-user-001');
    });

    it('should bypass even with invalid token in dev mode', async () => {
      mockConfigService.get.mockReturnValue(NodeEnv.Development);
      mockRequest.headers = {
        authorization: 'Bearer totally-invalid-garbage',
        'x-lang': 'en',
      };

      const result = await guard.canActivate(mockExecutionContext);

      expect(result).toBe(true);
      // Should use dev user without checking token
      expect(mockAuthService.verifyAccessToken).not.toHaveBeenCalled();
      expect(mockRequest.user.sub).toBe('dev-user-001');
    });
  });
});
