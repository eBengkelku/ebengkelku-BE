import { Test, TestingModule } from '@nestjs/testing';
import {
  UnauthorizedException,
  ForbiddenException,
  InternalServerErrorException,
} from '@nestjs/common';
import { I18nService } from 'nestjs-i18n';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import { LoginService } from '../login.service';
import { LoginRepository } from '../repository/login.repository';
import { LoginDto } from '../dto';
import { LoginErrorCodes } from '../errors';
import { JwtService } from '../../../../libs/jwt/services/jwt.service';
import { UserModel } from '../models';
import { IUserRow } from '../interfaces';

// Mock bcrypt
jest.mock('bcrypt', () => ({
  compare: jest.fn(),
}));

describe('LoginService', () => {
  let service: LoginService;
  let repository: jest.Mocked<LoginRepository>;
  let jwtService: jest.Mocked<JwtService>;
  let i18n: jest.Mocked<I18nService>;

  // Mock user data (raw database row)
  const mockUserRow: IUserRow = {
    id: 'user-uuid-123',
    public_id: 'public-uuid-456',
    name: 'John Doe',
    email: 'john.doe@example.com',
    phone: '+6281234567890',
    password: '$2b$10$hashedPasswordMock',
    image: null,
    provider: null,
    provider_id: null,
    email_verified_at: new Date('2026-01-27T15:00:00.000Z'),
    created_at: new Date('2026-01-27T15:00:00.000Z'),
    updated_at: null,
    deleted_at: null,
    id_creator: null,
    id_updater: null,
    is_encrypted: false,
  };

  // Create UserModel from mock data
  const createMockUser = (overrides?: Partial<IUserRow>): UserModel => {
    return UserModel.reconstitute({ ...mockUserRow, ...overrides });
  };

  const mockLoginDto: LoginDto = {
    email: 'john.doe@example.com',
    password: 'SecureP@ss123',
  };

  const mockAccessToken =
    'eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9.mockPayload.mockSignature';

  beforeEach(async () => {
    const mockRepository = {
      findByEmail: jest.fn(),
    };

    const mockJwtService = {
      generateAccessToken: jest.fn(),
    };

    const mockI18n = {
      t: jest.fn().mockImplementation((key: string) => `Translated: ${key}`),
    };

    const mockConfigService = {
      get: jest.fn().mockReturnValue(300000),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        LoginService,
        {
          provide: LoginRepository,
          useValue: mockRepository,
        },
        {
          provide: JwtService,
          useValue: mockJwtService,
        },
        {
          provide: I18nService,
          useValue: mockI18n,
        },
        {
          provide: ConfigService,
          useValue: mockConfigService,
        },
      ],
    }).compile();

    service = module.get<LoginService>(LoginService);
    repository = module.get(LoginRepository);
    jwtService = module.get(JwtService);
    i18n = module.get(I18nService);

    // Reset mocks
    jest.clearAllMocks();

    // Default mock implementations
    repository.findByEmail.mockResolvedValue(createMockUser());
    (bcrypt.compare as jest.Mock).mockResolvedValue(true);
    jwtService.generateAccessToken.mockResolvedValue(mockAccessToken);
  });

  describe('Success Scenarios', () => {
    it('should return access token on successful login', async () => {
      const result = await service.login(mockLoginDto);

      expect(result.success).toBe(true);
      expect(result.data.access_token).toBe(mockAccessToken);
      expect(result.data.type).toBe('Bearer');
      expect(result.data.expiration_time).toBe(300000);
    });

    it('should call repository.findByEmail with normalized email', async () => {
      await service.login(mockLoginDto);

      expect(repository.findByEmail).toHaveBeenCalledWith(
        'john.doe@example.com',
      );
    });

    it('should normalize email to lowercase', async () => {
      const dto = { ...mockLoginDto, email: 'JOHN.DOE@EXAMPLE.COM' };

      await service.login(dto);

      expect(repository.findByEmail).toHaveBeenCalledWith(
        'john.doe@example.com',
      );
    });

    it('should trim whitespace from email', async () => {
      const dto = { ...mockLoginDto, email: '  john.doe@example.com  ' };

      await service.login(dto);

      expect(repository.findByEmail).toHaveBeenCalledWith(
        'john.doe@example.com',
      );
    });

    it('should normalize email with mixed case and spaces', async () => {
      const dto = { ...mockLoginDto, email: '  JOHN.Doe@Example.COM  ' };

      await service.login(dto);

      expect(repository.findByEmail).toHaveBeenCalledWith(
        'john.doe@example.com',
      );
    });

    it('should call bcrypt.compare with correct parameters', async () => {
      await service.login(mockLoginDto);

      expect(bcrypt.compare).toHaveBeenCalledWith(
        'SecureP@ss123',
        '$2b$10$hashedPasswordMock',
      );
    });

    it('should call jwtService.generateAccessToken with public_id', async () => {
      await service.login(mockLoginDto);

      expect(jwtService.generateAccessToken).toHaveBeenCalledWith(
        'public-uuid-456',
      );
    });

    it('should return translated success message', async () => {
      i18n.t.mockReturnValueOnce('Login berhasil');

      const result = await service.login(mockLoginDto, 'id');

      expect(result.message).toBe('Login berhasil');
    });

    it('should use language header for translations', async () => {
      await service.login(mockLoginDto, 'id');

      expect(i18n.t).toHaveBeenCalledWith(
        'login.success',
        expect.objectContaining({ lang: 'id' }),
      );
    });

    it('should return Bearer as token type', async () => {
      const result = await service.login(mockLoginDto);

      expect(result.data.type).toBe('Bearer');
    });

    it('should return expiration time from config', async () => {
      const result = await service.login(mockLoginDto);

      expect(result.data.expiration_time).toBe(300000);
    });
  });

  describe('Failure Scenarios - Invalid Credentials', () => {
    it('should throw UnauthorizedException when email not found', async () => {
      repository.findByEmail.mockResolvedValue(null);

      await expect(service.login(mockLoginDto)).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it('should include INVALID_CREDENTIALS error code when email not found', async () => {
      repository.findByEmail.mockResolvedValue(null);

      try {
        await service.login(mockLoginDto);
        fail('Expected UnauthorizedException to be thrown');
      } catch (error) {
        expect(error.response.code).toBe(LoginErrorCodes.INVALID_CREDENTIALS);
      }
    });

    it('should throw UnauthorizedException when password is incorrect', async () => {
      (bcrypt.compare as jest.Mock).mockResolvedValue(false);

      await expect(service.login(mockLoginDto)).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it('should include INVALID_CREDENTIALS error code when password is incorrect', async () => {
      (bcrypt.compare as jest.Mock).mockResolvedValue(false);

      try {
        await service.login(mockLoginDto);
        fail('Expected UnauthorizedException to be thrown');
      } catch (error) {
        expect(error.response.code).toBe(LoginErrorCodes.INVALID_CREDENTIALS);
      }
    });

    it('should return same error for non-existent email and wrong password', async () => {
      // Test non-existent email
      repository.findByEmail.mockResolvedValue(null);
      let emailError: any;
      try {
        await service.login(mockLoginDto);
      } catch (error) {
        emailError = error;
      }

      // Reset and test wrong password
      repository.findByEmail.mockResolvedValue(createMockUser());
      (bcrypt.compare as jest.Mock).mockResolvedValue(false);
      let passwordError: any;
      try {
        await service.login(mockLoginDto);
      } catch (error) {
        passwordError = error;
      }

      // Both should have same error code
      expect(emailError.response.code).toBe(passwordError.response.code);
    });
  });

  describe('Failure Scenarios - Account Status (using UserModel methods)', () => {
    it('should throw UnauthorizedException when account is deleted (isActive returns false)', async () => {
      const deletedUser = createMockUser({
        deleted_at: new Date('2026-01-26T12:00:00.000Z'),
      });
      repository.findByEmail.mockResolvedValue(deletedUser);

      await expect(service.login(mockLoginDto)).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it('should use generic error for deleted accounts to prevent enumeration', async () => {
      const deletedUser = createMockUser({
        deleted_at: new Date('2026-01-26T12:00:00.000Z'),
      });
      repository.findByEmail.mockResolvedValue(deletedUser);

      try {
        await service.login(mockLoginDto);
        fail('Expected UnauthorizedException to be thrown');
      } catch (error) {
        expect(error.response.code).toBe(LoginErrorCodes.INVALID_CREDENTIALS);
      }
    });

    it('should throw ForbiddenException when email is not verified (isEmailVerified returns false)', async () => {
      const unverifiedUser = createMockUser({ email_verified_at: null });
      repository.findByEmail.mockResolvedValue(unverifiedUser);

      await expect(service.login(mockLoginDto)).rejects.toThrow(
        ForbiddenException,
      );
    });

    it('should include EMAIL_NOT_VERIFIED error code for unverified email', async () => {
      const unverifiedUser = createMockUser({ email_verified_at: null });
      repository.findByEmail.mockResolvedValue(unverifiedUser);

      try {
        await service.login(mockLoginDto);
        fail('Expected ForbiddenException to be thrown');
      } catch (error) {
        expect(error.response.code).toBe(LoginErrorCodes.EMAIL_NOT_VERIFIED);
      }
    });

    it('should throw UnauthorizedException when user has no password (hasPasswordAuth returns false)', async () => {
      const oauthUser = createMockUser({ password: null });
      repository.findByEmail.mockResolvedValue(oauthUser);

      await expect(service.login(mockLoginDto)).rejects.toThrow(
        UnauthorizedException,
      );
    });
  });

  describe('Failure Scenarios - Token Generation', () => {
    it('should throw InternalServerErrorException when JwtService fails', async () => {
      jwtService.generateAccessToken.mockRejectedValue(
        new Error('Token generation failed'),
      );

      await expect(service.login(mockLoginDto)).rejects.toThrow(
        InternalServerErrorException,
      );
    });

    it('should include TOKEN_GENERATION_FAILED error code', async () => {
      jwtService.generateAccessToken.mockRejectedValue(
        new Error('Token generation failed'),
      );

      try {
        await service.login(mockLoginDto);
        fail('Expected InternalServerErrorException to be thrown');
      } catch (error) {
        expect(error.response.code).toBe(
          LoginErrorCodes.TOKEN_GENERATION_FAILED,
        );
      }
    });
  });

  describe('Edge Cases', () => {
    it('should handle email with plus sign', async () => {
      const dto = { ...mockLoginDto, email: 'user+tag@example.com' };
      repository.findByEmail.mockResolvedValue(
        createMockUser({ email: 'user+tag@example.com' }),
      );

      const result = await service.login(dto);

      expect(result.success).toBe(true);
    });

    it('should handle email with dots', async () => {
      const dto = { ...mockLoginDto, email: 'user.name@example.com' };
      repository.findByEmail.mockResolvedValue(
        createMockUser({ email: 'user.name@example.com' }),
      );

      const result = await service.login(dto);

      expect(result.success).toBe(true);
    });

    it('should handle long passwords', async () => {
      const longPassword =
        'VeryLongSecureP@ssw0rd123456789012345678901234567890123456789012345678901234567890';
      const dto = { ...mockLoginDto, password: longPassword };

      const result = await service.login(dto);

      expect(bcrypt.compare).toHaveBeenCalledWith(
        longPassword,
        mockUserRow.password,
      );
      expect(result.success).toBe(true);
    });

    it('should not call bcrypt.compare if user not found', async () => {
      repository.findByEmail.mockResolvedValue(null);

      try {
        await service.login(mockLoginDto);
      } catch {
        // Expected
      }

      expect(bcrypt.compare).not.toHaveBeenCalled();
    });

    it('should not call bcrypt.compare if account is deleted', async () => {
      const deletedUser = createMockUser({
        deleted_at: new Date(),
      });
      repository.findByEmail.mockResolvedValue(deletedUser);

      try {
        await service.login(mockLoginDto);
      } catch {
        // Expected
      }

      expect(bcrypt.compare).not.toHaveBeenCalled();
    });

    it('should not call jwtService if password is incorrect', async () => {
      (bcrypt.compare as jest.Mock).mockResolvedValue(false);

      try {
        await service.login(mockLoginDto);
      } catch {
        // Expected
      }

      expect(jwtService.generateAccessToken).not.toHaveBeenCalled();
    });

    it('should handle user with encrypted data', async () => {
      const encryptedUser = createMockUser({ is_encrypted: true });
      repository.findByEmail.mockResolvedValue(encryptedUser);

      const result = await service.login(mockLoginDto);

      expect(result.success).toBe(true);
    });

    it('should handle user with non-encrypted data', async () => {
      const nonEncryptedUser = createMockUser({ is_encrypted: false });
      repository.findByEmail.mockResolvedValue(nonEncryptedUser);

      const result = await service.login(mockLoginDto);

      expect(result.success).toBe(true);
    });
  });

  describe('Security Tests', () => {
    it('should call bcrypt.compare exactly once per login attempt', async () => {
      await service.login(mockLoginDto);

      expect(bcrypt.compare).toHaveBeenCalledTimes(1);
    });

    it('should verify password against stored hash', async () => {
      const customHash = '$2b$10$customHashValue';
      const userWithCustomHash = createMockUser({ password: customHash });
      repository.findByEmail.mockResolvedValue(userWithCustomHash);

      await service.login(mockLoginDto);

      expect(bcrypt.compare).toHaveBeenCalledWith(
        mockLoginDto.password,
        customHash,
      );
    });

    it('should not reveal if email exists in error message for wrong password', async () => {
      (bcrypt.compare as jest.Mock).mockResolvedValue(false);

      try {
        await service.login(mockLoginDto);
      } catch (error) {
        // Error message should be generic
        expect(error.response.message).not.toContain('email');
        expect(error.response.message).not.toContain('password');
      }
    });
  });

  describe('UserModel Integration', () => {
    it('should use UserModel.isActive() to check if account is deleted', async () => {
      const activeUser = createMockUser({ deleted_at: null });
      expect(activeUser.isActive()).toBe(true);

      const deletedUser = createMockUser({
        deleted_at: new Date(),
      });
      expect(deletedUser.isActive()).toBe(false);
    });

    it('should use UserModel.isEmailVerified() to check verification status', async () => {
      const verifiedUser = createMockUser({
        email_verified_at: new Date(),
      });
      expect(verifiedUser.isEmailVerified()).toBe(true);

      const unverifiedUser = createMockUser({ email_verified_at: null });
      expect(unverifiedUser.isEmailVerified()).toBe(false);
    });

    it('should use UserModel.hasPasswordAuth() to check password presence', async () => {
      const passwordUser = createMockUser({ password: 'hashed' });
      expect(passwordUser.hasPasswordAuth()).toBe(true);

      const oauthUser = createMockUser({ password: null });
      expect(oauthUser.hasPasswordAuth()).toBe(false);
    });

    it('should access publicId via UserModel getter', async () => {
      const user = createMockUser();

      await service.login(mockLoginDto);

      expect(jwtService.generateAccessToken).toHaveBeenCalledWith(
        user.publicId,
      );
    });
  });
});
