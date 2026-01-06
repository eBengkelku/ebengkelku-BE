import { ExecutionContext, CallHandler, HttpStatus } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { of } from 'rxjs';
import {
  ResponseTransformInterceptor,
  RESPONSE_MESSAGE_KEY,
  SKIP_TRANSFORM_KEY,
} from '../../interceptors/response-transform.interceptor';
import { StandardResponse, PaginatedResponse } from '../../interfaces';

describe('ResponseTransformInterceptor', () => {
  let interceptor: ResponseTransformInterceptor<any>;
  let reflector: Reflector;
  let mockI18nService: any;
  let mockExecutionContext: ExecutionContext;
  let mockCallHandler: CallHandler;
  let mockResponse: any;
  let mockRequest: any;

  beforeEach(() => {
    reflector = new Reflector();

    // Mock I18nService
    mockI18nService = {
      translate: jest.fn((key: string, options?: any) => {
        // Simple mock that returns the key itself if not found
        const translations: Record<string, string> = {
          'common.success.request_successful': 'Request successful',
          'common.success.resource_created': 'Resource created successfully',
          'common.success.request_accepted': 'Request accepted',
          'common.success.no_content': 'No content',
        };
        return translations[key] || key;
      }),
    };

    interceptor = new ResponseTransformInterceptor(reflector, mockI18nService);

    mockRequest = {
      url: '/test',
      headers: {
        'x-lang': 'en',
      },
    };

    mockResponse = {
      statusCode: HttpStatus.OK,
    };

    mockExecutionContext = {
      switchToHttp: () => ({
        getResponse: () => mockResponse,
        getRequest: () => mockRequest,
      }),
      getHandler: jest.fn(),
      getClass: jest.fn(),
    } as any;

    mockCallHandler = {
      handle: jest.fn(),
    } as any;

    // Default mock for getAllAndOverride to prevent errors
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(false); // Default: don't skip transform
  });

  describe('basic transformation', () => {
    it('should transform plain data into StandardResponse', (done) => {
      // Mock getAllAndOverride to return false for skip_transform and undefined for message
      jest
        .spyOn(reflector, 'getAllAndOverride')
        .mockReturnValueOnce(false) // skip_transform
        .mockReturnValueOnce(undefined); // custom message

      const testData = { id: 1, name: 'Test' };
      (mockCallHandler.handle as jest.Mock).mockReturnValue(of(testData));

      interceptor.intercept(mockExecutionContext, mockCallHandler).subscribe({
        next: (result: StandardResponse) => {
          expect(result.success).toBe(true);
          expect(result.statusCode).toBe(HttpStatus.OK);
          expect(result.message).toBe('Request successful');
          expect(result.data).toEqual(testData);
          expect(result.errors).toBeNull();
          expect(result.timestamp).toBeDefined();
          expect(result.path).toBe('/test');
          done();
        },
      });
    });

    it('should use 201 status code for created resources', (done) => {
      mockResponse.statusCode = HttpStatus.CREATED;
      const testData = { id: 1, name: 'New Item' };
      (mockCallHandler.handle as jest.Mock).mockReturnValue(of(testData));

      interceptor.intercept(mockExecutionContext, mockCallHandler).subscribe({
        next: (result: StandardResponse) => {
          expect(result.statusCode).toBe(HttpStatus.CREATED);
          expect(result.message).toBe('Resource created successfully');
          done();
        },
      });
    });

    it('should handle array data', (done) => {
      const testData = [
        { id: 1, name: 'Item 1' },
        { id: 2, name: 'Item 2' },
      ];
      (mockCallHandler.handle as jest.Mock).mockReturnValue(of(testData));

      interceptor.intercept(mockExecutionContext, mockCallHandler).subscribe({
        next: (result: StandardResponse) => {
          expect(result.success).toBe(true);
          expect(result.data).toEqual(testData);
          expect(Array.isArray(result.data)).toBe(true);
          done();
        },
      });
    });

    it('should handle null data', (done) => {
      (mockCallHandler.handle as jest.Mock).mockReturnValue(of(null));

      interceptor.intercept(mockExecutionContext, mockCallHandler).subscribe({
        next: (result: StandardResponse) => {
          expect(result.success).toBe(true);
          expect(result.data).toBeNull();
          done();
        },
      });
    });
  });

  describe('custom message decorator', () => {
    it('should use custom message from @ResponseMessage decorator', (done) => {
      const customMessage = 'Custom success message';
      jest.spyOn(reflector, 'getAllAndOverride').mockReturnValueOnce(false); // skip_transform
      jest
        .spyOn(reflector, 'getAllAndOverride')
        .mockReturnValueOnce(customMessage); // custom message

      const testData = { id: 1 };
      (mockCallHandler.handle as jest.Mock).mockReturnValue(of(testData));

      interceptor.intercept(mockExecutionContext, mockCallHandler).subscribe({
        next: (result: StandardResponse) => {
          expect(result.message).toBe(customMessage);
          done();
        },
      });
    });
  });

  describe('skip transform decorator', () => {
    it('should skip transformation when @SkipTransform is used', (done) => {
      jest.spyOn(reflector, 'getAllAndOverride').mockReturnValueOnce(true); // skip_transform = true

      const rawData = { custom: 'format', raw: true };
      (mockCallHandler.handle as jest.Mock).mockReturnValue(of(rawData));

      interceptor.intercept(mockExecutionContext, mockCallHandler).subscribe({
        next: (result: any) => {
          // Should return raw data without transformation
          expect(result).toEqual(rawData);
          expect(result.success).toBeUndefined();
          expect(result.statusCode).toBeUndefined();
          done();
        },
      });
    });
  });

  describe('paginated response', () => {
    it('should transform paginated data correctly', (done) => {
      const paginatedData = {
        data: [{ id: 1 }, { id: 2 }],
        pagination: {
          page: 1,
          limit: 10,
          total: 100,
          totalPages: 10,
        },
      };
      (mockCallHandler.handle as jest.Mock).mockReturnValue(of(paginatedData));

      interceptor.intercept(mockExecutionContext, mockCallHandler).subscribe({
        next: (result: PaginatedResponse) => {
          expect(result.success).toBe(true);
          expect(result.data).toEqual(paginatedData.data);
          expect(result.pagination).toEqual(paginatedData.pagination);
          expect(result.errors).toBeNull();
          done();
        },
      });
    });

    it('should handle paginated data with page/limit/total format', (done) => {
      const paginatedData = {
        data: [{ id: 1 }],
        page: 2,
        limit: 20,
        total: 50,
        message: 'Items retrieved',
      };
      (mockCallHandler.handle as jest.Mock).mockReturnValue(of(paginatedData));

      interceptor.intercept(mockExecutionContext, mockCallHandler).subscribe({
        next: (result: PaginatedResponse) => {
          expect(result.success).toBe(true);
          expect(result.data).toEqual(paginatedData.data);
          expect(result.pagination).toBeDefined();
          expect(result.pagination?.page).toBe(2);
          expect(result.pagination?.limit).toBe(20);
          expect(result.pagination?.total).toBe(50);
          expect(result.pagination?.totalPages).toBe(3);
          expect(result.message).toBe('Items retrieved');
          expect(result.errors).toBeNull();
          done();
        },
      });
    });
  });

  describe('legacy response format', () => {
    it('should transform legacy success response format', (done) => {
      const legacyData = {
        success: true,
        message: 'Legacy success message',
        data: { id: 1, name: 'Test' },
      };
      (mockCallHandler.handle as jest.Mock).mockReturnValue(of(legacyData));

      interceptor.intercept(mockExecutionContext, mockCallHandler).subscribe({
        next: (result: StandardResponse) => {
          expect(result.success).toBe(true);
          expect(result.statusCode).toBe(HttpStatus.OK);
          expect(result.message).toBe('Legacy success message');
          expect(result.data).toEqual(legacyData.data);
          expect(result.timestamp).toBeDefined();
          done();
        },
      });
    });
  });

  describe('already standardized response', () => {
    it('should return response as-is if already in StandardResponse format', (done) => {
      const standardResponse: StandardResponse = {
        success: true,
        statusCode: 200,
        message: 'Already standardized',
        data: { id: 1 },
        timestamp: '2025-10-10T00:00:00.000Z',
      };
      (mockCallHandler.handle as jest.Mock).mockReturnValue(
        of(standardResponse),
      );

      interceptor.intercept(mockExecutionContext, mockCallHandler).subscribe({
        next: (result: StandardResponse) => {
          expect(result).toEqual(standardResponse);
          done();
        },
      });
    });

    it('should not double-wrap StandardResponse', (done) => {
      const standardResponse: StandardResponse = {
        success: false,
        statusCode: 400,
        message: 'Error response',
        errors: [
          {
            code: 'ERR_2000',
            message: 'Validation failed',
          },
        ],
      };
      (mockCallHandler.handle as jest.Mock).mockReturnValue(
        of(standardResponse),
      );

      interceptor.intercept(mockExecutionContext, mockCallHandler).subscribe({
        next: (result: StandardResponse) => {
          expect(result).toEqual(standardResponse);
          expect(result.data).toBeUndefined();
          expect(result.errors).toBeDefined();
          done();
        },
      });
    });
  });

  describe('edge cases', () => {
    it('should handle undefined data', (done) => {
      (mockCallHandler.handle as jest.Mock).mockReturnValue(of(undefined));

      interceptor.intercept(mockExecutionContext, mockCallHandler).subscribe({
        next: (result: StandardResponse) => {
          expect(result.success).toBe(true);
          expect(result.data).toBeUndefined();
          done();
        },
      });
    });

    it('should handle empty object', (done) => {
      (mockCallHandler.handle as jest.Mock).mockReturnValue(of({}));

      interceptor.intercept(mockExecutionContext, mockCallHandler).subscribe({
        next: (result: StandardResponse) => {
          expect(result.success).toBe(true);
          expect(result.data).toEqual({});
          done();
        },
      });
    });

    it('should handle empty array', (done) => {
      (mockCallHandler.handle as jest.Mock).mockReturnValue(of([]));

      interceptor.intercept(mockExecutionContext, mockCallHandler).subscribe({
        next: (result: StandardResponse) => {
          expect(result.success).toBe(true);
          expect(result.data).toEqual([]);
          done();
        },
      });
    });

    it('should handle string data', (done) => {
      const stringData = 'Simple string response';
      (mockCallHandler.handle as jest.Mock).mockReturnValue(of(stringData));

      interceptor.intercept(mockExecutionContext, mockCallHandler).subscribe({
        next: (result: StandardResponse) => {
          expect(result.success).toBe(true);
          expect(result.data).toBe(stringData);
          done();
        },
      });
    });

    it('should handle number data', (done) => {
      const numberData = 42;
      (mockCallHandler.handle as jest.Mock).mockReturnValue(of(numberData));

      interceptor.intercept(mockExecutionContext, mockCallHandler).subscribe({
        next: (result: StandardResponse) => {
          expect(result.success).toBe(true);
          expect(result.data).toBe(numberData);
          done();
        },
      });
    });

    it('should handle boolean data', (done) => {
      const booleanData = true;
      (mockCallHandler.handle as jest.Mock).mockReturnValue(of(booleanData));

      interceptor.intercept(mockExecutionContext, mockCallHandler).subscribe({
        next: (result: StandardResponse) => {
          expect(result.success).toBe(true);
          expect(result.data).toBe(booleanData);
          done();
        },
      });
    });
  });

  describe('metadata extraction', () => {
    it('should call reflector to get metadata', (done) => {
      const getAllAndOverrideSpy = jest.spyOn(reflector, 'getAllAndOverride');
      (mockCallHandler.handle as jest.Mock).mockReturnValue(of({ id: 1 }));

      interceptor.intercept(mockExecutionContext, mockCallHandler).subscribe({
        next: () => {
          expect(getAllAndOverrideSpy).toHaveBeenCalledWith(
            SKIP_TRANSFORM_KEY,
            expect.any(Array),
          );
          expect(getAllAndOverrideSpy).toHaveBeenCalledWith(
            RESPONSE_MESSAGE_KEY,
            expect.any(Array),
          );
          done();
        },
      });
    });
  });
});
