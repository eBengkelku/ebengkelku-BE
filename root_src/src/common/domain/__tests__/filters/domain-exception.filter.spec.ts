import { ArgumentsHost, HttpStatus } from '@nestjs/common';
import { I18nService } from 'nestjs-i18n';
import { DomainExceptionFilter } from '../../../filters/domain-exception.filter';
import {
  DomainException,
  DomainValidationException,
  DomainNotFoundException,
  DomainConflictException,
} from '../../exceptions/domain.exception';

describe('DomainExceptionFilter', () => {
  let filter: DomainExceptionFilter;
  let mockI18nService: jest.Mocked<I18nService>;
  let mockResponse: any;
  let mockRequest: any;
  let mockArgumentsHost: ArgumentsHost;

  beforeEach(() => {
    // Mock I18nService
    mockI18nService = {
      translate: jest.fn((key: string, options?: any) => {
        // Mock translation - in real app would return translated text
        return `Translated: ${key}`;
      }),
    } as any;

    // Mock Response
    mockResponse = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    };

    // Mock Request
    mockRequest = {
      url: '/api/test',
      method: 'GET',
      headers: {},
    };

    // Mock ArgumentsHost
    mockArgumentsHost = {
      switchToHttp: jest.fn().mockReturnValue({
        getResponse: () => mockResponse,
        getRequest: () => mockRequest,
      }),
      getArgByIndex: jest.fn(),
      getArgs: jest.fn(),
      getType: jest.fn(),
      switchToRpc: jest.fn(),
      switchToWs: jest.fn(),
    } as any;

    filter = new DomainExceptionFilter(mockI18nService);
  });

  describe('DomainValidationException', () => {
    it('should catch and format DomainValidationException with standardized response', () => {
      const exception = new DomainValidationException(
        'domain.products.validation.price_negative',
        { price: -10 },
      );

      filter.catch(exception, mockArgumentsHost);

      expect(mockResponse.status).toHaveBeenCalledWith(HttpStatus.BAD_REQUEST);

      const callArgs = mockResponse.json.mock.calls[0][0];

      expect(callArgs).toEqual({
        success: false,
        data: null,
        message: 'Translated: domain.products.validation.price_negative',
        errors: [
          {
            code: 'DOMAIN_VALIDATION_ERROR',
            message: 'Translated: domain.products.validation.price_negative',
            context: { price: -10 },
          },
        ],
        statusCode: HttpStatus.BAD_REQUEST,
        timestamp: expect.any(String),
        path: '/api/test',
      });
    });

    it('should handle DomainValidationException without params', () => {
      const exception = new DomainValidationException(
        'domain.common.validation.required',
      );

      filter.catch(exception, mockArgumentsHost);

      const callArgs = mockResponse.json.mock.calls[0][0];

      expect(callArgs.errors[0]).toEqual({
        code: 'DOMAIN_VALIDATION_ERROR',
        message: 'Translated: domain.common.validation.required',
      });
      expect(callArgs.errors[0].context).toBeUndefined();
    });
  });

  describe('DomainNotFoundException', () => {
    it('should catch and format DomainNotFoundException with NOT_FOUND status', () => {
      const exception = new DomainNotFoundException(
        'domain.products.not_found',
        { id: '123' },
      );

      filter.catch(exception, mockArgumentsHost);

      expect(mockResponse.status).toHaveBeenCalledWith(HttpStatus.NOT_FOUND);

      const callArgs = mockResponse.json.mock.calls[0][0];

      expect(callArgs).toEqual({
        success: false,
        data: null,
        message: 'Translated: domain.products.not_found',
        errors: [
          {
            code: 'DOMAIN_NOT_FOUND',
            message: 'Translated: domain.products.not_found',
            context: { id: '123' },
          },
        ],
        statusCode: HttpStatus.NOT_FOUND,
        timestamp: expect.any(String),
        path: '/api/test',
      });
    });
  });

  describe('DomainConflictException', () => {
    it('should catch and format DomainConflictException with CONFLICT status', () => {
      const exception = new DomainConflictException(
        'domain.products.sku_already_exists',
        { sku: 'PROD-001' },
      );

      filter.catch(exception, mockArgumentsHost);

      expect(mockResponse.status).toHaveBeenCalledWith(HttpStatus.CONFLICT);

      const callArgs = mockResponse.json.mock.calls[0][0];

      expect(callArgs).toEqual({
        success: false,
        data: null,
        message: 'Translated: domain.products.sku_already_exists',
        errors: [
          {
            code: 'DOMAIN_CONFLICT',
            message: 'Translated: domain.products.sku_already_exists',
            context: { sku: 'PROD-001' },
          },
        ],
        statusCode: HttpStatus.CONFLICT,
        timestamp: expect.any(String),
        path: '/api/test',
      });
    });
  });

  describe('Generic DomainException', () => {
    it('should catch and format generic DomainException', () => {
      const exception = new DomainException(
        'domain.generic.error',
        { detail: 'something' },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );

      filter.catch(exception, mockArgumentsHost);

      expect(mockResponse.status).toHaveBeenCalledWith(
        HttpStatus.INTERNAL_SERVER_ERROR,
      );

      const callArgs = mockResponse.json.mock.calls[0][0];

      expect(callArgs.errors[0].code).toBe('DOMAIN_ERROR');
    });
  });

  describe('Language handling', () => {
    it('should use x-lang header for language preference', () => {
      mockRequest.headers['x-lang'] = 'id';

      const exception = new DomainValidationException(
        'domain.products.validation.price_negative',
      );

      filter.catch(exception, mockArgumentsHost);

      expect(mockI18nService.translate).toHaveBeenCalledWith(
        'domain.products.validation.price_negative',
        {
          lang: 'id',
          args: {},
        },
      );
    });

    it('should fallback to accept-language header if x-lang not present', () => {
      mockRequest.headers['accept-language'] = 'es,en;q=0.9';

      const exception = new DomainValidationException(
        'domain.products.validation.price_negative',
      );

      filter.catch(exception, mockArgumentsHost);

      expect(mockI18nService.translate).toHaveBeenCalledWith(
        'domain.products.validation.price_negative',
        {
          lang: 'es',
          args: {},
        },
      );
    });

    it('should use default "en" if no language headers present', () => {
      const exception = new DomainValidationException(
        'domain.products.validation.price_negative',
      );

      filter.catch(exception, mockArgumentsHost);

      expect(mockI18nService.translate).toHaveBeenCalledWith(
        'domain.products.validation.price_negative',
        {
          lang: 'en',
          args: {},
        },
      );
    });
  });

  describe('Translation params', () => {
    it('should pass translation params to i18n service', () => {
      const params = { min: 0, max: 100, value: 150 };
      const exception = new DomainValidationException(
        'domain.common.validation.out_of_range',
        params,
      );

      filter.catch(exception, mockArgumentsHost);

      expect(mockI18nService.translate).toHaveBeenCalledWith(
        'domain.common.validation.out_of_range',
        {
          lang: 'en',
          args: params,
        },
      );
    });

    it('should include params in error context', () => {
      const params = { field: 'price', value: -10 };
      const exception = new DomainValidationException(
        'domain.common.validation.negative_number',
        params,
      );

      filter.catch(exception, mockArgumentsHost);

      const callArgs = mockResponse.json.mock.calls[0][0];

      expect(callArgs.errors[0].context).toEqual(params);
    });
  });

  describe('Error response structure', () => {
    it('should always include required fields in response', () => {
      const exception = new DomainValidationException('domain.test.error');

      filter.catch(exception, mockArgumentsHost);

      const callArgs = mockResponse.json.mock.calls[0][0];

      expect(callArgs).toHaveProperty('success', false);
      expect(callArgs).toHaveProperty('message');
      expect(callArgs).toHaveProperty('errors');
      expect(callArgs).toHaveProperty('statusCode');
      expect(callArgs).toHaveProperty('timestamp');
      expect(callArgs).toHaveProperty('path');
    });

    it('should format timestamp correctly', () => {
      const exception = new DomainValidationException('domain.test.error');

      filter.catch(exception, mockArgumentsHost);

      const callArgs = mockResponse.json.mock.calls[0][0];

      // Check if timestamp is valid ISO string
      expect(() => new Date(callArgs.timestamp)).not.toThrow();
      expect(callArgs.timestamp).toMatch(
        /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/,
      );
    });

    it('should include request path in response', () => {
      mockRequest.url = '/api/v1/products/123';

      const exception = new DomainValidationException('domain.test.error');

      filter.catch(exception, mockArgumentsHost);

      const callArgs = mockResponse.json.mock.calls[0][0];

      expect(callArgs.path).toBe('/api/v1/products/123');
    });
  });

  describe('Error codes', () => {
    it('should use DOMAIN_VALIDATION_ERROR for DomainValidationException', () => {
      const exception = new DomainValidationException('test.error');
      filter.catch(exception, mockArgumentsHost);

      const callArgs = mockResponse.json.mock.calls[0][0];
      expect(callArgs.errors[0].code).toBe('DOMAIN_VALIDATION_ERROR');
    });

    it('should use DOMAIN_NOT_FOUND for DomainNotFoundException', () => {
      const exception = new DomainNotFoundException('test.error');
      filter.catch(exception, mockArgumentsHost);

      const callArgs = mockResponse.json.mock.calls[0][0];
      expect(callArgs.errors[0].code).toBe('DOMAIN_NOT_FOUND');
    });

    it('should use DOMAIN_CONFLICT for DomainConflictException', () => {
      const exception = new DomainConflictException('test.error');
      filter.catch(exception, mockArgumentsHost);

      const callArgs = mockResponse.json.mock.calls[0][0];
      expect(callArgs.errors[0].code).toBe('DOMAIN_CONFLICT');
    });

    it('should use DOMAIN_ERROR for generic DomainException', () => {
      const exception = new DomainException('test.error');
      filter.catch(exception, mockArgumentsHost);

      const callArgs = mockResponse.json.mock.calls[0][0];
      expect(callArgs.errors[0].code).toBe('DOMAIN_ERROR');
    });
  });
});
