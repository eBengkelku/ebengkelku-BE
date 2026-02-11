import { Test, TestingModule } from '@nestjs/testing';
import { LoginController } from '../login.controller';
import { LoginService } from '../login.service';
import { LoginDto } from '../dto';
import { ILoginResponse } from '../interfaces';

describe('LoginController', () => {
  let controller: LoginController;
  let service: jest.Mocked<LoginService>;

  const mockLoginDto: LoginDto = {
    email: 'john.doe@example.com',
    password: 'SecureP@ss123',
  };

  const mockLoginResponse: ILoginResponse = {
    success: true,
    message: 'Login successful',
    data: {
      access_token:
        'eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9.mockPayload.mockSignature',
      type: 'Bearer',
      expiration_time: 300000,
      first_time_login: true,
      last_login: null,
    },
  };

  beforeEach(async () => {
    const mockService = {
      login: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [LoginController],
      providers: [
        {
          provide: LoginService,
          useValue: mockService,
        },
      ],
    }).compile();

    controller = module.get<LoginController>(LoginController);
    service = module.get(LoginService);

    // Reset mocks
    jest.clearAllMocks();

    // Default mock implementation
    service.login.mockResolvedValue(mockLoginResponse);
  });

  describe('login', () => {
    it('should be defined', () => {
      expect(controller).toBeDefined();
    });

    it('should call loginService.login with dto and lang', async () => {
      await controller.login(mockLoginDto, 'en');

      expect(service.login).toHaveBeenCalledWith(mockLoginDto, 'en');
    });

    it('should call loginService.login with undefined lang when not provided', async () => {
      await controller.login(mockLoginDto, undefined);

      expect(service.login).toHaveBeenCalledWith(mockLoginDto, undefined);
    });

    it('should return login response on success', async () => {
      const result = await controller.login(mockLoginDto);

      expect(result).toEqual(mockLoginResponse);
    });

    it('should return access_token in response', async () => {
      const result = await controller.login(mockLoginDto);

      expect(result.data.access_token).toBeDefined();
      expect(typeof result.data.access_token).toBe('string');
    });

    it('should return Bearer as token type', async () => {
      const result = await controller.login(mockLoginDto);

      expect(result.data.type).toBe('Bearer');
    });

    it('should return expiration time in response', async () => {
      const result = await controller.login(mockLoginDto);

      expect(result.data.expiration_time).toBe(300000);
    });

    it('should return success true on successful login', async () => {
      const result = await controller.login(mockLoginDto);

      expect(result.success).toBe(true);
    });

    it('should return translated message', async () => {
      service.login.mockResolvedValue({
        ...mockLoginResponse,
        message: 'Login berhasil',
      });

      const result = await controller.login(mockLoginDto, 'id');

      expect(result.message).toBe('Login berhasil');
    });

    it('should propagate service exceptions', async () => {
      const error = new Error('Service error');
      service.login.mockRejectedValue(error);

      await expect(controller.login(mockLoginDto)).rejects.toThrow(
        'Service error',
      );
    });

    it('should handle email with uppercase letters', async () => {
      const dto = { ...mockLoginDto, email: 'JOHN.DOE@EXAMPLE.COM' };

      await controller.login(dto);

      expect(service.login).toHaveBeenCalledWith(dto, undefined);
    });

    it('should handle email with spaces', async () => {
      const dto = { ...mockLoginDto, email: '  john.doe@example.com  ' };

      await controller.login(dto);

      expect(service.login).toHaveBeenCalledWith(dto, undefined);
    });

    it('should pass language header to service', async () => {
      await controller.login(mockLoginDto, 'id');

      expect(service.login).toHaveBeenCalledWith(mockLoginDto, 'id');
    });

    it('should handle empty language header', async () => {
      await controller.login(mockLoginDto, '');

      expect(service.login).toHaveBeenCalledWith(mockLoginDto, '');
    });
  });

  describe('Response Structure', () => {
    it('should return response with success, message, and data', async () => {
      const result = await controller.login(mockLoginDto);

      expect(result).toHaveProperty('success');
      expect(result).toHaveProperty('message');
      expect(result).toHaveProperty('data');
    });

    it('should return data with access_token, type, and expiration_time', async () => {
      const result = await controller.login(mockLoginDto);

      expect(result.data).toHaveProperty('access_token');
      expect(result.data).toHaveProperty('type');
      expect(result.data).toHaveProperty('expiration_time');
      expect(result.data).toHaveProperty('first_time_login');
      expect(result.data).toHaveProperty('last_login');
    });

    it('should return first_time_login as boolean', async () => {
      const result = await controller.login(mockLoginDto);

      expect(typeof result.data.first_time_login).toBe('boolean');
    });

    it('should return last_login as null or Date', async () => {
      const result = await controller.login(mockLoginDto);

      expect(
        result.data.last_login === null ||
          result.data.last_login instanceof Date,
      ).toBe(true);
    });

    it('should return first_time_login true when user has never logged in before', async () => {
      service.login.mockResolvedValue({
        ...mockLoginResponse,
        data: {
          ...mockLoginResponse.data,
          first_time_login: true,
          last_login: null,
        },
      });

      const result = await controller.login(mockLoginDto);

      expect(result.data.first_time_login).toBe(true);
      expect(result.data.last_login).toBeNull();
    });

    it('should return first_time_login false when user has logged in before', async () => {
      const previousLogin = new Date('2026-02-10T08:15:30Z');
      service.login.mockResolvedValue({
        ...mockLoginResponse,
        data: {
          ...mockLoginResponse.data,
          first_time_login: false,
          last_login: previousLogin,
        },
      });

      const result = await controller.login(mockLoginDto);

      expect(result.data.first_time_login).toBe(false);
      expect(result.data.last_login).toEqual(previousLogin);
    });

    it('should not include password in response', async () => {
      const result = await controller.login(mockLoginDto);

      expect(result.data).not.toHaveProperty('password');
      expect(result).not.toHaveProperty('password');
    });

    it('should not include user object in response', async () => {
      const result = await controller.login(mockLoginDto);

      expect(result.data).not.toHaveProperty('user');
      expect(result).not.toHaveProperty('user');
    });

    it('should return JWT token with three parts', async () => {
      const result = await controller.login(mockLoginDto);

      const tokenParts = result.data.access_token.split('.');
      expect(tokenParts).toHaveLength(3);
    });
  });
});
