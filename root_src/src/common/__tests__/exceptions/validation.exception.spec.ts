import { HttpStatus } from '@nestjs/common';
import { ValidationException } from '../../exceptions/validation.exception';
import { ErrorCodes } from '../../errors';
import { ErrorDetail } from '../../interfaces';

describe('ValidationException', () => {
  describe('constructor', () => {
    it('should create validation exception with default values', () => {
      const exception = new ValidationException();

      expect(exception).toBeInstanceOf(ValidationException);
      expect(exception.message).toBe('Validation failed');
      expect(exception.getStatus()).toBe(HttpStatus.BAD_REQUEST);
      expect(exception.errorCode).toBe(ErrorCodes.VALIDATION_FAILED);
      expect(exception.errors).toEqual([]);
    });

    it('should create validation exception with custom message and errors', () => {
      const errors: ErrorDetail[] = [
        {
          property: 'price',
          value: -10,
          code: ErrorCodes.OUT_OF_RANGE,
          message: 'Price must be positive',
        },
      ];
      const exception = new ValidationException(
        'Product validation failed',
        errors,
      );

      expect(exception.message).toBe('Product validation failed');
      expect(exception.errors).toEqual(errors);
    });

    it('should use default translation key if not provided', () => {
      const exception = new ValidationException();

      expect(exception.translationKey).toBe('common.validation.failed');
    });

    it('should use custom translation key if provided', () => {
      const exception = new ValidationException(
        'Validation failed',
        [],
        'custom.validation.key',
      );

      expect(exception.translationKey).toBe('custom.validation.key');
    });
  });

  describe('fromClassValidator', () => {
    it('should create exception from class-validator errors', () => {
      const classValidatorErrors = [
        {
          property: 'email',
          value: 'invalid',
          constraints: {
            isEmail: 'email must be an email',
            isNotEmpty: 'email should not be empty',
          },
          target: {},
        },
        {
          property: 'age',
          value: -5,
          constraints: {
            min: 'age must not be less than 0',
          },
          target: {},
        },
      ];

      const exception =
        ValidationException.fromClassValidator(classValidatorErrors);

      expect(exception).toBeInstanceOf(ValidationException);
      expect(exception.message).toBe('Validation failed');
      expect(exception.errors).toHaveLength(2);

      expect(exception.errors![0]).toMatchObject({
        property: 'email',
        value: 'invalid',
        code: ErrorCodes.VALIDATION_FAILED,
        message: 'email must be an email, email should not be empty',
      });

      expect(exception.errors![1]).toMatchObject({
        property: 'age',
        value: -5,
        code: ErrorCodes.VALIDATION_FAILED,
        message: 'age must not be less than 0',
      });
    });

    it('should handle empty constraints object', () => {
      const classValidatorErrors = [
        {
          property: 'field',
          value: 'value',
          constraints: {},
          target: {},
        },
      ];

      const exception =
        ValidationException.fromClassValidator(classValidatorErrors);

      expect(exception.errors![0].message).toBe('');
    });
  });

  describe('forField', () => {
    it('should create exception for single field', () => {
      const exception = ValidationException.forField(
        'email',
        'Invalid email format',
        'invalid@',
      );

      expect(exception).toBeInstanceOf(ValidationException);
      expect(exception.message).toBe('Invalid email format');
      expect(exception.errors).toHaveLength(1);
      expect(exception.errors![0]).toMatchObject({
        property: 'email',
        value: 'invalid@',
        code: ErrorCodes.VALIDATION_FAILED,
        message: 'Invalid email format',
      });
    });

    it('should include context if provided', () => {
      const context = { pattern: '^[a-z]+$' };
      const exception = ValidationException.forField(
        'username',
        'Invalid format',
        'User123',
        context,
      );

      expect(exception.errors![0].context).toEqual(context);
    });
  });

  describe('requiredField', () => {
    it('should create exception for required field', () => {
      const exception = ValidationException.requiredField('email');

      expect(exception).toBeInstanceOf(ValidationException);
      expect(exception.message).toBe('email is required');
      expect(exception.errors).toHaveLength(1);
      expect(exception.errors![0]).toMatchObject({
        property: 'email',
        code: ErrorCodes.REQUIRED_FIELD,
        message: 'email is required',
      });
    });
  });

  describe('invalidFormat', () => {
    it('should create exception for invalid format', () => {
      const exception = ValidationException.invalidFormat(
        'email',
        'notanemail',
        'valid email address',
      );

      expect(exception).toBeInstanceOf(ValidationException);
      expect(exception.message).toBe('email has invalid format');
      expect(exception.errors![0]).toMatchObject({
        property: 'email',
        value: 'notanemail',
        code: ErrorCodes.INVALID_FORMAT,
        message: 'email has invalid format',
        context: { expectedFormat: 'valid email address' },
      });
    });

    it('should work without expected format', () => {
      const exception = ValidationException.invalidFormat('date', '2025-13-40');

      expect(exception.errors![0].context).toBeUndefined();
    });
  });

  describe('outOfRange', () => {
    it('should create exception for out of range value', () => {
      const exception = ValidationException.outOfRange('price', -10, 0, 999999);

      expect(exception).toBeInstanceOf(ValidationException);
      expect(exception.message).toBe('price is out of range');
      expect(exception.errors![0]).toMatchObject({
        property: 'price',
        value: -10,
        code: ErrorCodes.OUT_OF_RANGE,
        message: 'price is out of range',
        context: {
          min: 0,
          max: 999999,
          value: -10,
        },
      });
    });

    it('should work with partial range', () => {
      const exception = ValidationException.outOfRange('age', 5, 18);

      expect(exception.errors![0].context).toMatchObject({
        min: 18,
        max: undefined,
        value: 5,
      });
    });
  });

  describe('prototype chain', () => {
    it('should maintain proper prototype chain', () => {
      const exception = new ValidationException();

      expect(exception).toBeInstanceOf(ValidationException);
      expect(exception).toBeInstanceOf(Error);
    });
  });
});
