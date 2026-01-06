import {
  ArgumentsHost,
  HttpException,
  HttpStatus,
  NotFoundException as NestNotFoundException,
} from '@nestjs/common';
import { I18nService } from 'nestjs-i18n';
import { HttpExceptionFilter } from '../../filters/http-exception.filter';
import { NotFoundException, ConflictException } from '../../exceptions';
import { ErrorCodes } from '../../errors';

describe('HttpExceptionFilter', () => {
  let filter: HttpExceptionFilter;
  let mockI18nService: jest.Mocked<I18nService>;
  let mockArgumentsHost: ArgumentsHost;
  let mockResponse: any;
  let mockRequest: any;

  beforeEach(() => {
    // Mock I18nService
    mockI18nService = {
      translate: jest.fn((key: string) => key),
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

    filter = new HttpExceptionFilter(mockI18nService);
  });

  describe('BaseHttpException handling', () => {
    it('should format NotFoundException correctly', () => {
      const exception = NotFoundException.forId('Product', '123');

      filter.catch(exception, mockArgumentsHost);

      expect(mockResponse.status).toHaveBeenCalledWith(404);
      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          statusCode: 404,
          errors: expect.arrayContaining([
            expect.objectContaining({
              code: ErrorCodes.NOT_FOUND,
            }),
          ]),
        }),
      );
    });

    it('should format ConflictException correctly', () => {
      const exception = ConflictException.duplicate('User', {
        email: 'test@example.com',
      });

      filter.catch(exception, mockArgumentsHost);

      expect(mockResponse.status).toHaveBeenCalledWith(409);
      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          statusCode: 409,
          errors: expect.arrayContaining([
            expect.objectContaining({
              code: ErrorCodes.DUPLICATE_ENTITY,
            }),
          ]),
        }),
      );
    });

    it('should include error context', () => {
      const exception = new NotFoundException(
        'Product not found',
        ErrorCodes.NOT_FOUND,
        { productId: '123', userId: '456' },
      );

      filter.catch(exception, mockArgumentsHost);

      const callArgs = mockResponse.json.mock.calls[0][0];
      expect(callArgs.errors[0].context).toEqual({
        productId: '123',
        userId: '456',
      });
    });

    it('should handle exception with multiple errors', () => {
      const exception = new NotFoundException('Not found');
      exception.setErrors([
        { code: 'ERR_1', message: 'Error 1' },
        { code: 'ERR_2', message: 'Error 2' },
      ]);

      filter.catch(exception, mockArgumentsHost);

      const callArgs = mockResponse.json.mock.calls[0][0];
      expect(callArgs.errors).toHaveLength(2);
    });
  });

  describe('Standard HttpException handling', () => {
    it('should handle NestJS NotFoundException', () => {
      const exception = new NestNotFoundException('Resource not found');

      filter.catch(exception, mockArgumentsHost);

      expect(mockResponse.status).toHaveBeenCalledWith(404);
      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          statusCode: 404,
          message: 'Not Found', // NestJS default error message
          errors: [
            {
              code: ErrorCodes.NOT_FOUND,
              message: 'Resource not found',
            },
          ],
        }),
      );
    });

    it('should handle HttpException with string response', () => {
      const exception = new HttpException(
        'Bad request',
        HttpStatus.BAD_REQUEST,
      );

      filter.catch(exception, mockArgumentsHost);

      expect(mockResponse.status).toHaveBeenCalledWith(400);
      const callArgs = mockResponse.json.mock.calls[0][0];
      expect(callArgs.errors[0].message).toBe('Bad request');
      expect(callArgs.errors[0].code).toBe(ErrorCodes.BAD_REQUEST);
    });

    it('should handle HttpException with object response', () => {
      const exception = new HttpException(
        {
          message: 'Validation error',
          error: 'Bad Request',
        },
        HttpStatus.BAD_REQUEST,
      );

      filter.catch(exception, mockArgumentsHost);

      const callArgs = mockResponse.json.mock.calls[0][0];
      expect(callArgs.message).toBe('Bad Request');
    });

    it('should handle HttpException with message array', () => {
      const exception = new HttpException(
        {
          message: ['Error 1', 'Error 2', 'Error 3'],
        },
        HttpStatus.BAD_REQUEST,
      );

      filter.catch(exception, mockArgumentsHost);

      const callArgs = mockResponse.json.mock.calls[0][0];
      expect(callArgs.errors).toHaveLength(3);
      expect(callArgs.message).toBe('Error 1, Error 2, Error 3');
    });
  });

  describe('error code mapping', () => {
    it('should map 400 to BAD_REQUEST', () => {
      const exception = new HttpException('Error', HttpStatus.BAD_REQUEST);
      filter.catch(exception, mockArgumentsHost);

      const callArgs = mockResponse.json.mock.calls[0][0];
      expect(callArgs.errors[0].code).toBe(ErrorCodes.BAD_REQUEST);
    });

    it('should map 401 to UNAUTHORIZED', () => {
      const exception = new HttpException('Error', HttpStatus.UNAUTHORIZED);
      filter.catch(exception, mockArgumentsHost);

      const callArgs = mockResponse.json.mock.calls[0][0];
      expect(callArgs.errors[0].code).toBe(ErrorCodes.UNAUTHORIZED);
    });

    it('should map 403 to FORBIDDEN', () => {
      const exception = new HttpException('Error', HttpStatus.FORBIDDEN);
      filter.catch(exception, mockArgumentsHost);

      const callArgs = mockResponse.json.mock.calls[0][0];
      expect(callArgs.errors[0].code).toBe(ErrorCodes.FORBIDDEN);
    });

    it('should map 404 to NOT_FOUND', () => {
      const exception = new HttpException('Error', HttpStatus.NOT_FOUND);
      filter.catch(exception, mockArgumentsHost);

      const callArgs = mockResponse.json.mock.calls[0][0];
      expect(callArgs.errors[0].code).toBe(ErrorCodes.NOT_FOUND);
    });

    it('should map 409 to CONFLICT', () => {
      const exception = new HttpException('Error', HttpStatus.CONFLICT);
      filter.catch(exception, mockArgumentsHost);

      const callArgs = mockResponse.json.mock.calls[0][0];
      expect(callArgs.errors[0].code).toBe(ErrorCodes.CONFLICT);
    });

    it('should map 500 to INTERNAL_SERVER_ERROR', () => {
      const exception = new HttpException(
        'Error',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
      filter.catch(exception, mockArgumentsHost);

      const callArgs = mockResponse.json.mock.calls[0][0];
      expect(callArgs.errors[0].code).toBe(ErrorCodes.INTERNAL_SERVER_ERROR);
    });
  });

  describe('i18n translation', () => {
    it('should translate custom exception messages', () => {
      const translationKey = 'errors.product.not_found';
      mockI18nService.translate.mockReturnValueOnce('Product tidak ditemukan');

      const exception = new NotFoundException(
        'Product not found',
        ErrorCodes.NOT_FOUND,
        undefined,
        translationKey,
        { id: '123' },
      );

      filter.catch(exception, mockArgumentsHost);

      expect(mockI18nService.translate).toHaveBeenCalledWith(
        translationKey,
        expect.objectContaining({
          lang: 'en',
          args: { id: '123' },
        }),
      );
    });
  });

  describe('response structure', () => {
    it('should always set success to false', () => {
      const exception = new HttpException('Error', HttpStatus.BAD_REQUEST);
      filter.catch(exception, mockArgumentsHost);

      const callArgs = mockResponse.json.mock.calls[0][0];
      expect(callArgs.success).toBe(false);
    });

    it('should include timestamp', () => {
      const exception = new HttpException('Error', HttpStatus.BAD_REQUEST);
      filter.catch(exception, mockArgumentsHost);

      const callArgs = mockResponse.json.mock.calls[0][0];
      expect(callArgs.timestamp).toBeDefined();
      expect(new Date(callArgs.timestamp).toString()).not.toBe('Invalid Date');
    });

    it('should include request path', () => {
      mockRequest.url = '/api/v1/products/123';
      const exception = new HttpException('Error', HttpStatus.NOT_FOUND);
      filter.catch(exception, mockArgumentsHost);

      const callArgs = mockResponse.json.mock.calls[0][0];
      expect(callArgs.path).toBe('/api/v1/products/123');
    });

    it('should include statusCode from exception', () => {
      const exception = new HttpException('Error', HttpStatus.FORBIDDEN);
      filter.catch(exception, mockArgumentsHost);

      const callArgs = mockResponse.json.mock.calls[0][0];
      expect(callArgs.statusCode).toBe(403);
      expect(mockResponse.status).toHaveBeenCalledWith(403);
    });
  });

  describe('language extraction', () => {
    it('should prioritize x-lang header', () => {
      mockRequest.headers['x-lang'] = 'id';
      mockRequest.headers['accept-language'] = 'en-US';

      const exception = new NotFoundException('Test', ErrorCodes.NOT_FOUND);
      filter.catch(exception, mockArgumentsHost);

      expect(mockI18nService.translate).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({ lang: 'id' }),
      );
    });

    it('should fallback to accept-language', () => {
      delete mockRequest.headers['x-lang'];
      mockRequest.headers['accept-language'] = 'id-ID,id;q=0.9';

      const exception = new NotFoundException('Test', ErrorCodes.NOT_FOUND);
      filter.catch(exception, mockArgumentsHost);

      expect(mockI18nService.translate).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({ lang: 'id-ID' }),
      );
    });

    it('should default to en', () => {
      delete mockRequest.headers['x-lang'];
      delete mockRequest.headers['accept-language'];

      const exception = new NotFoundException('Test', ErrorCodes.NOT_FOUND);
      filter.catch(exception, mockArgumentsHost);

      expect(mockI18nService.translate).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({ lang: 'en' }),
      );
    });
  });
});
