import { HttpStatus } from '@nestjs/common';
import { BaseHttpException } from '../../exceptions/base.exception';
import { ErrorCodes } from '../../errors';
import { ErrorDetail } from '../../interfaces';

describe('BaseHttpException', () => {
  describe('constructor', () => {
    it('should create exception with default values', () => {
      const exception = new BaseHttpException('Test error');

      expect(exception).toBeInstanceOf(BaseHttpException);
      expect(exception.message).toBe('Test error');
      expect(exception.getStatus()).toBe(HttpStatus.INTERNAL_SERVER_ERROR);
      expect(exception.errorCode).toBe('ERR_1500');
    });

    it('should create exception with custom status and error code', () => {
      const exception = new BaseHttpException(
        'Not found',
        HttpStatus.NOT_FOUND,
        ErrorCodes.NOT_FOUND,
      );

      expect(exception.message).toBe('Not found');
      expect(exception.getStatus()).toBe(HttpStatus.NOT_FOUND);
      expect(exception.errorCode).toBe(ErrorCodes.NOT_FOUND);
    });

    it('should create exception with context', () => {
      const context = { userId: '123', action: 'delete' };
      const exception = new BaseHttpException(
        'Operation failed',
        HttpStatus.BAD_REQUEST,
        ErrorCodes.BAD_REQUEST,
        context,
      );

      expect(exception.context).toEqual(context);
    });

    it('should create exception with translation key and params', () => {
      const translationKey = 'errors.validation.required';
      const translationParams = { field: 'email' };
      const exception = new BaseHttpException(
        'Validation failed',
        HttpStatus.BAD_REQUEST,
        ErrorCodes.VALIDATION_FAILED,
        undefined,
        translationKey,
        translationParams,
      );

      expect(exception.translationKey).toBe(translationKey);
      expect(exception.translationParams).toEqual(translationParams);
    });
  });

  describe('constructor name', () => {
    it('should have the correct constructor name', () => {
      const exception = new BaseHttpException('Test error');

      expect(exception.constructor.name).toBe('BaseHttpException');
    });
  });

  describe('toJSON', () => {
    it('should serialize exception to JSON', () => {
      const exception = new BaseHttpException(
        'Test error',
        HttpStatus.BAD_REQUEST,
        ErrorCodes.BAD_REQUEST,
        { key: 'value' },
      );

      const json = exception.toJSON();

      expect(json).toMatchObject({
        name: 'BaseHttpException',
        message: 'Test error',
        statusCode: HttpStatus.BAD_REQUEST,
        errorCode: ErrorCodes.BAD_REQUEST,
        context: { key: 'value' },
      });
      expect(json).toHaveProperty('timestamp');
    });

    it('should include translation data in JSON if present', () => {
      const exception = new BaseHttpException(
        'Test error',
        HttpStatus.BAD_REQUEST,
        ErrorCodes.BAD_REQUEST,
        undefined,
        'errors.test',
        { param: 'value' },
      );

      const json = exception.toJSON();

      expect(json).toHaveProperty('translationKey', 'errors.test');
      expect(json).toHaveProperty('translationParams', { param: 'value' });
    });

    it('should include errors array in JSON if present', () => {
      const errors: ErrorDetail[] = [
        {
          property: 'email',
          code: ErrorCodes.REQUIRED_FIELD,
          message: 'Email is required',
        },
      ];
      const exception = new BaseHttpException(
        'Validation failed',
        HttpStatus.BAD_REQUEST,
        ErrorCodes.VALIDATION_FAILED,
      );
      exception.setErrors(errors);

      const json = exception.toJSON();

      expect(json).toHaveProperty('errors', errors);
    });
  });

  describe('setErrors', () => {
    it('should set multiple error details', () => {
      const exception = new BaseHttpException('Test error');
      const errors: ErrorDetail[] = [
        {
          property: 'name',
          code: ErrorCodes.REQUIRED_FIELD,
          message: 'Name is required',
        },
        {
          property: 'email',
          code: ErrorCodes.INVALID_FORMAT,
          message: 'Invalid email format',
        },
      ];

      exception.setErrors(errors);

      expect(exception.errors).toEqual(errors);
      expect(exception.errors).toHaveLength(2);
    });

    it('should return exception instance for chaining', () => {
      const exception = new BaseHttpException('Test error');
      const result = exception.setErrors([]);

      expect(result).toBe(exception);
    });
  });

  describe('addError', () => {
    it('should add a single error detail', () => {
      const exception = new BaseHttpException('Test error');
      const error: ErrorDetail = {
        property: 'name',
        code: ErrorCodes.REQUIRED_FIELD,
        message: 'Name is required',
      };

      exception.addError(error);

      expect(exception.errors).toEqual([error]);
    });

    it('should append to existing errors', () => {
      const exception = new BaseHttpException('Test error');
      const error1: ErrorDetail = {
        property: 'name',
        code: ErrorCodes.REQUIRED_FIELD,
        message: 'Name is required',
      };
      const error2: ErrorDetail = {
        property: 'email',
        code: ErrorCodes.INVALID_FORMAT,
        message: 'Invalid email',
      };

      exception.addError(error1);
      exception.addError(error2);

      expect(exception.errors).toHaveLength(2);
      expect(exception.errors).toContainEqual(error1);
      expect(exception.errors).toContainEqual(error2);
    });

    it('should return exception instance for chaining', () => {
      const exception = new BaseHttpException('Test error');
      const error: ErrorDetail = {
        property: 'name',
        code: ErrorCodes.REQUIRED_FIELD,
        message: 'Name is required',
      };

      const result = exception.addError(error);

      expect(result).toBe(exception);
    });
  });

  describe('stack trace', () => {
    it('should capture stack trace', () => {
      const exception = new BaseHttpException('Test error');

      expect(exception.stack).toBeDefined();
      expect(exception.stack).toContain('BaseHttpException');
    });
  });

  describe('prototype chain', () => {
    it('should maintain proper prototype chain', () => {
      const exception = new BaseHttpException('Test error');

      expect(exception).toBeInstanceOf(BaseHttpException);
      expect(exception).toBeInstanceOf(Error);
    });
  });
});
