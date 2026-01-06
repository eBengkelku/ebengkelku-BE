import { ArgumentsHost, HttpException, HttpStatus } from '@nestjs/common';
import { I18nService } from 'nestjs-i18n';
import { GlobalExceptionFilter } from '../../filters/global-exception.filter';
import { ErrorCodes } from '../../errors';

describe('GlobalExceptionFilter', () => {
  let filter: GlobalExceptionFilter;
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
      method: 'GET',
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

    filter = new GlobalExceptionFilter(mockI18nService);
  });

  describe('unhandled exceptions', () => {
    it('should handle generic Error', () => {
      const exception = new Error('Something went wrong');

      filter.catch(exception, mockArgumentsHost);

      expect(mockResponse.status).toHaveBeenCalledWith(500);
      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          statusCode: 500,
          message: 'Something went wrong',
          errors: expect.arrayContaining([
            expect.objectContaining({
              code: ErrorCodes.INTERNAL_SERVER_ERROR,
              message: 'Something went wrong',
            }),
          ]),
        }),
      );
    });

    it('should handle unknown error without message', () => {
      const exception = { unknownError: true };

      filter.catch(exception, mockArgumentsHost);

      expect(mockResponse.status).toHaveBeenCalledWith(500);
      const callArgs = mockResponse.json.mock.calls[0][0];
      expect(callArgs.errors[0].message).toBeDefined();
    });

    it('should handle null exception', () => {
      const exception = null;

      filter.catch(exception, mockArgumentsHost);

      expect(mockResponse.status).toHaveBeenCalledWith(500);
    });

    it('should handle undefined exception', () => {
      const exception = undefined;

      filter.catch(exception, mockArgumentsHost);

      expect(mockResponse.status).toHaveBeenCalledWith(500);
    });
  });

  describe('HttpException handling', () => {
    it('should extract status from HttpException', () => {
      const exception = new HttpException('Not found', HttpStatus.NOT_FOUND);

      filter.catch(exception, mockArgumentsHost);

      expect(mockResponse.status).toHaveBeenCalledWith(404);
    });

    it('should use exception message', () => {
      const exception = new HttpException(
        'Custom error message',
        HttpStatus.BAD_REQUEST,
      );

      filter.catch(exception, mockArgumentsHost);

      const callArgs = mockResponse.json.mock.calls[0][0];
      expect(callArgs.message).toBe('Custom error message');
    });
  });

  describe('status code extraction', () => {
    it('should use status property if available', () => {
      const exception = { status: 403, message: 'Forbidden' };

      filter.catch(exception, mockArgumentsHost);

      expect(mockResponse.status).toHaveBeenCalledWith(403);
    });

    it('should use statusCode property if available', () => {
      const exception = { statusCode: 422, message: 'Unprocessable' };

      filter.catch(exception, mockArgumentsHost);

      expect(mockResponse.status).toHaveBeenCalledWith(422);
    });

    it('should default to 500 if no status found', () => {
      const exception = { message: 'Error without status' };

      filter.catch(exception, mockArgumentsHost);

      expect(mockResponse.status).toHaveBeenCalledWith(500);
    });
  });

  describe('error code handling', () => {
    it('should use errorCode property if available', () => {
      const exception = {
        errorCode: 'CUSTOM_ERROR_CODE',
        message: 'Custom error',
      };

      filter.catch(exception, mockArgumentsHost);

      const callArgs = mockResponse.json.mock.calls[0][0];
      expect(callArgs.errors[0].code).toBe('CUSTOM_ERROR_CODE');
    });

    it('should use code property if errorCode not available', () => {
      const exception = {
        code: 'ALTERNATE_CODE',
        message: 'Error with code',
      };

      filter.catch(exception, mockArgumentsHost);

      const callArgs = mockResponse.json.mock.calls[0][0];
      expect(callArgs.errors[0].code).toBe('ALTERNATE_CODE');
    });

    it('should default to INTERNAL_SERVER_ERROR code', () => {
      const exception = new Error('Generic error');

      filter.catch(exception, mockArgumentsHost);

      const callArgs = mockResponse.json.mock.calls[0][0];
      expect(callArgs.errors[0].code).toBe(ErrorCodes.INTERNAL_SERVER_ERROR);
    });
  });

  describe('context handling', () => {
    it('should include context if available', () => {
      const exception = {
        message: 'Error with context',
        context: {
          userId: '123',
          action: 'delete',
          resource: 'product',
        },
      };

      filter.catch(exception, mockArgumentsHost);

      const callArgs = mockResponse.json.mock.calls[0][0];
      expect(callArgs.errors[0].context).toEqual({
        userId: '123',
        action: 'delete',
        resource: 'product',
      });
    });

    it('should not include context if not available', () => {
      const exception = new Error('Error without context');

      filter.catch(exception, mockArgumentsHost);

      const callArgs = mockResponse.json.mock.calls[0][0];
      expect(callArgs.errors[0].context).toBeUndefined();
    });
  });

  describe('i18n translation', () => {
    it('should translate message if translationKey exists', () => {
      // Mock the translate function to return translated message
      mockI18nService.translate.mockImplementation((key: string) => {
        if (key === 'errors.custom') return 'Translated message';
        return key;
      });

      const exception = {
        message: 'Original message',
        translationKey: 'errors.custom',
        translationParams: { param: 'value' },
      };

      filter.catch(exception, mockArgumentsHost);

      expect(mockI18nService.translate).toHaveBeenCalledWith('errors.custom', {
        lang: 'en',
        args: { param: 'value' },
      });

      const callArgs = mockResponse.json.mock.calls[0][0];
      expect(callArgs.message).toBe('Translated message');
    });

    it('should work without I18nService', () => {
      const filterWithoutI18n = new GlobalExceptionFilter();
      const exception = new Error('Test error');

      filterWithoutI18n.catch(exception, mockArgumentsHost);

      expect(mockResponse.status).toHaveBeenCalledWith(500);
      expect(mockResponse.json).toHaveBeenCalled();
    });
  });

  describe('response structure', () => {
    it('should always set success to false', () => {
      const exception = new Error('Test');

      filter.catch(exception, mockArgumentsHost);

      const callArgs = mockResponse.json.mock.calls[0][0];
      expect(callArgs.success).toBe(false);
    });

    it('should include timestamp', () => {
      const exception = new Error('Test');

      filter.catch(exception, mockArgumentsHost);

      const callArgs = mockResponse.json.mock.calls[0][0];
      expect(callArgs.timestamp).toBeDefined();
      expect(new Date(callArgs.timestamp).toString()).not.toBe('Invalid Date');
    });

    it('should include request path', () => {
      mockRequest.url = '/api/v1/test';
      const exception = new Error('Test');

      filter.catch(exception, mockArgumentsHost);

      const callArgs = mockResponse.json.mock.calls[0][0];
      expect(callArgs.path).toBe('/api/v1/test');
    });

    it('should include stack trace in development', () => {
      process.env.NODE_ENV = 'development';
      const exception = new Error('Test error');

      filter.catch(exception, mockArgumentsHost);

      const callArgs = mockResponse.json.mock.calls[0][0];
      expect(callArgs.stack).toBeDefined();

      // Cleanup
      delete process.env.NODE_ENV;
    });

    it('should not include stack trace in production', () => {
      process.env.NODE_ENV = 'production';
      const exception = new Error('Test error');

      filter.catch(exception, mockArgumentsHost);

      const callArgs = mockResponse.json.mock.calls[0][0];
      expect(callArgs.stack).toBeUndefined();

      // Cleanup
      delete process.env.NODE_ENV;
    });
  });

  describe('language extraction', () => {
    it('should extract from x-lang header', () => {
      mockRequest.headers['x-lang'] = 'id';

      const exception = {
        translationKey: 'test.key',
        message: 'Test',
      };

      filter.catch(exception, mockArgumentsHost);

      expect(mockI18nService.translate).toHaveBeenCalledWith(
        'test.key',
        expect.objectContaining({ lang: 'id' }),
      );
    });

    it('should extract from accept-language header', () => {
      delete mockRequest.headers['x-lang'];
      mockRequest.headers['accept-language'] = 'fr-FR,fr;q=0.9';

      const exception = {
        translationKey: 'test.key',
        message: 'Test',
      };

      filter.catch(exception, mockArgumentsHost);

      expect(mockI18nService.translate).toHaveBeenCalledWith(
        'test.key',
        expect.objectContaining({ lang: 'fr-FR' }),
      );
    });

    it('should default to en', () => {
      delete mockRequest.headers['x-lang'];
      delete mockRequest.headers['accept-language'];

      const exception = {
        translationKey: 'test.key',
        message: 'Test',
      };

      filter.catch(exception, mockArgumentsHost);

      expect(mockI18nService.translate).toHaveBeenCalledWith(
        'test.key',
        expect.objectContaining({ lang: 'en' }),
      );
    });
  });

  describe('default messages', () => {
    it('should provide default message for 400', () => {
      const exception = new HttpException('', HttpStatus.BAD_REQUEST);
      exception.message = ''; // Force empty message

      filter.catch(exception, mockArgumentsHost);

      const callArgs = mockResponse.json.mock.calls[0][0];
      expect(callArgs.message).toBeTruthy();
    });

    it('should provide default message for 500', () => {
      const exception = { status: 500 };

      filter.catch(exception, mockArgumentsHost);

      const callArgs = mockResponse.json.mock.calls[0][0];
      expect(callArgs.message).toBeTruthy();
    });
  });
});
