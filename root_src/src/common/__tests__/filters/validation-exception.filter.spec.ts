import { ArgumentsHost, BadRequestException } from '@nestjs/common';
import { I18nService } from 'nestjs-i18n';
import { ValidationExceptionFilter } from '../../filters/validation-exception.filter';
import { ValidationException } from '../../exceptions';
import { ErrorCodes } from '../../errors';

describe('ValidationExceptionFilter', () => {
  let filter: ValidationExceptionFilter;
  let mockI18nService: jest.Mocked<I18nService>;
  let mockArgumentsHost: ArgumentsHost;
  let mockResponse: any;
  let mockRequest: any;

  beforeEach(() => {
    // Mock I18nService
    mockI18nService = {
      translate: jest.fn((key: string, _options?: any) => {
        if (key === 'common.validation.failed') return 'Validation failed';
        return key;
      }),
    } as any;

    // Mock request
    mockRequest = {
      url: '/test',
      headers: {
        'x-lang': 'en',
      },
    };

    // Mock response
    mockResponse = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };

    // Mock ArgumentsHost
    mockArgumentsHost = {
      switchToHttp: () => ({
        getResponse: () => mockResponse,
        getRequest: () => mockRequest,
      }),
    } as any;

    filter = new ValidationExceptionFilter(mockI18nService);
  });

  describe('ValidationException handling', () => {
    it('should format ValidationException correctly as object', () => {
      const exception = new ValidationException('Validation failed', [
        {
          property: 'email',
          value: 'invalid',
          code: ErrorCodes.INVALID_EMAIL,
          message: 'Invalid email format',
        },
      ]);

      filter.catch(exception, mockArgumentsHost);

      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          statusCode: 400,
          message: 'Validation failed',
          errors: {
            email: {
              value: 'invalid',
              code: ErrorCodes.INVALID_EMAIL,
              message: 'Invalid email format',
            },
          },
          timestamp: expect.any(String),
          path: '/test',
        }),
      );
    });

    it('should handle ValidationException with translation key', () => {
      const translationKey = 'custom.validation.failed';
      mockI18nService.translate.mockReturnValueOnce('Custom validation failed');

      const exception = new ValidationException(
        'Validation failed',
        [],
        translationKey,
      );

      filter.catch(exception, mockArgumentsHost);

      expect(mockI18nService.translate).toHaveBeenCalledWith(
        translationKey,
        expect.any(Object),
      );
      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'Custom validation failed',
        }),
      );
    });

    it('should handle multiple validation errors as object', () => {
      const exception = new ValidationException('Multiple errors', [
        {
          property: 'email',
          code: ErrorCodes.INVALID_EMAIL,
          message: 'Invalid email',
        },
        {
          property: 'password',
          code: ErrorCodes.TOO_SHORT,
          message: 'Password too short',
        },
      ]);

      filter.catch(exception, mockArgumentsHost);

      const callArgs = mockResponse.json.mock.calls[0][0];
      expect(Object.keys(callArgs.errors)).toHaveLength(2);
      expect(callArgs.errors.email).toBeDefined();
      expect(callArgs.errors.email.code).toBe(ErrorCodes.INVALID_EMAIL);
      expect(callArgs.errors.password).toBeDefined();
      expect(callArgs.errors.password.code).toBe(ErrorCodes.TOO_SHORT);
    });
  });

  describe('BadRequestException handling', () => {
    it('should handle BadRequestException with validation array as object', () => {
      const exception = new BadRequestException({
        message: [
          {
            property: 'name',
            value: '',
            constraints: {
              isNotEmpty: 'name should not be empty',
            },
          },
        ],
      });

      filter.catch(exception, mockArgumentsHost);

      expect(mockResponse.status).toHaveBeenCalledWith(400);
      const callArgs = mockResponse.json.mock.calls[0][0];
      expect(callArgs.errors.name).toBeDefined();
      expect(callArgs.errors.name.message).toBe('name should not be empty');
    });

    it('should handle BadRequestException with string array as object', () => {
      const exception = new BadRequestException({
        message: ['Error 1', 'Error 2'],
      });

      filter.catch(exception, mockArgumentsHost);

      const callArgs = mockResponse.json.mock.calls[0][0];
      expect(Object.keys(callArgs.errors)).toHaveLength(2);
      expect(callArgs.errors.field_0.message).toBe('Error 1');
      expect(callArgs.errors.field_1.message).toBe('Error 2');
    });

    it('should handle BadRequestException with string message as object', () => {
      const exception = new BadRequestException('Simple error message');

      filter.catch(exception, mockArgumentsHost);

      const callArgs = mockResponse.json.mock.calls[0][0];
      expect(Object.keys(callArgs.errors)).toHaveLength(1);
      expect(callArgs.errors.field_0.message).toBe('Simple error message');
    });
  });

  describe('error code mapping', () => {
    it('should map isNotEmpty to VALIDATION_REQUIRED', () => {
      const exception = new BadRequestException({
        message: [
          {
            property: 'name',
            constraints: {
              isNotEmpty: 'name should not be empty',
            },
          },
        ],
      });

      filter.catch(exception, mockArgumentsHost);

      const callArgs = mockResponse.json.mock.calls[0][0];
      expect(callArgs.errors.name.code).toBe('VALIDATION_REQUIRED');
    });

    it('should map isEmail to VALIDATION_EMAIL_FORMAT', () => {
      const exception = new BadRequestException({
        message: [
          {
            property: 'email',
            constraints: {
              isEmail: 'email must be an email',
            },
          },
        ],
      });

      filter.catch(exception, mockArgumentsHost);

      const callArgs = mockResponse.json.mock.calls[0][0];
      expect(callArgs.errors.email.code).toBe('VALIDATION_EMAIL_FORMAT');
    });

    it('should map min to VALIDATION_MIN_VALUE', () => {
      const exception = new BadRequestException({
        message: [
          {
            property: 'age',
            constraints: {
              min: 'age must not be less than 18',
            },
          },
        ],
      });

      filter.catch(exception, mockArgumentsHost);

      const callArgs = mockResponse.json.mock.calls[0][0];
      expect(callArgs.errors.age.code).toBe('VALIDATION_MIN_VALUE');
    });

    it('should use descriptive code for unknown constraints', () => {
      const exception = new BadRequestException({
        message: [
          {
            property: 'field',
            constraints: {
              customConstraint: 'custom error',
            },
          },
        ],
      });

      filter.catch(exception, mockArgumentsHost);

      const callArgs = mockResponse.json.mock.calls[0][0];
      expect(callArgs.errors.field.code).toBe('VALIDATION_CUSTOMCONSTRAINT');
    });
  });

  describe('language handling', () => {
    it('should extract language from x-lang header', () => {
      mockRequest.headers['x-lang'] = 'id';

      const exception = new ValidationException('Test');
      filter.catch(exception, mockArgumentsHost);

      expect(mockI18nService.translate).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({ lang: 'id' }),
      );
    });

    it('should extract language from accept-language header', () => {
      delete mockRequest.headers['x-lang'];
      mockRequest.headers['accept-language'] = 'id-ID,id;q=0.9,en-US;q=0.8';

      const exception = new ValidationException('Test');
      filter.catch(exception, mockArgumentsHost);

      expect(mockI18nService.translate).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({ lang: 'id-ID' }),
      );
    });

    it('should default to en if no language header', () => {
      delete mockRequest.headers['x-lang'];
      delete mockRequest.headers['accept-language'];

      const exception = new ValidationException('Test');
      filter.catch(exception, mockArgumentsHost);

      expect(mockI18nService.translate).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({ lang: 'en' }),
      );
    });
  });

  describe('response structure', () => {
    it('should always set success to false', () => {
      const exception = new ValidationException('Test');
      filter.catch(exception, mockArgumentsHost);

      const callArgs = mockResponse.json.mock.calls[0][0];
      expect(callArgs.success).toBe(false);
    });

    it('should include timestamp', () => {
      const exception = new ValidationException('Test');
      filter.catch(exception, mockArgumentsHost);

      const callArgs = mockResponse.json.mock.calls[0][0];
      expect(callArgs.timestamp).toBeDefined();
      expect(new Date(callArgs.timestamp).toString()).not.toBe('Invalid Date');
    });

    it('should include request path', () => {
      mockRequest.url = '/api/v1/products';
      const exception = new ValidationException('Test');
      filter.catch(exception, mockArgumentsHost);

      const callArgs = mockResponse.json.mock.calls[0][0];
      expect(callArgs.path).toBe('/api/v1/products');
    });
  });
});
