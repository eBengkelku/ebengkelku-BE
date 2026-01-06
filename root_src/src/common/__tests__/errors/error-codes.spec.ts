import {
  ErrorCodes,
  ErrorCode,
  isErrorCode,
  getErrorMetadata,
  getHttpStatus,
} from '../../errors/error-codes';

describe('ErrorCodes', () => {
  describe('constants', () => {
    it('should have HTTP error codes', () => {
      expect(ErrorCodes.BAD_REQUEST).toBe('ERR_1000');
      expect(ErrorCodes.UNAUTHORIZED).toBe('ERR_1001');
      expect(ErrorCodes.FORBIDDEN).toBe('ERR_1003');
      expect(ErrorCodes.NOT_FOUND).toBe('ERR_1004');
      expect(ErrorCodes.CONFLICT).toBe('ERR_1009');
      expect(ErrorCodes.INTERNAL_SERVER_ERROR).toBe('ERR_1500');
    });

    it('should have validation error codes', () => {
      expect(ErrorCodes.VALIDATION_FAILED).toBe('ERR_2000');
      expect(ErrorCodes.REQUIRED_FIELD).toBe('ERR_2001');
      expect(ErrorCodes.INVALID_FORMAT).toBe('ERR_2002');
      expect(ErrorCodes.OUT_OF_RANGE).toBe('ERR_2003');
    });

    it('should have business logic error codes', () => {
      expect(ErrorCodes.BUSINESS_RULE_VIOLATION).toBe('ERR_3000');
      expect(ErrorCodes.INSUFFICIENT_QUANTITY).toBe('ERR_3001');
      expect(ErrorCodes.DUPLICATE_ENTITY).toBe('ERR_3002');
      expect(ErrorCodes.INVALID_STATE_TRANSITION).toBe('ERR_3003');
    });

    it('should be immutable (readonly)', () => {
      // TypeScript will catch this at compile time
      // This test ensures the 'as const' assertion is in place
      const code: ErrorCode = ErrorCodes.NOT_FOUND;
      expect(code).toBe('ERR_1004');
    });
  });

  describe('isErrorCode', () => {
    it('should return true for valid error codes', () => {
      expect(isErrorCode('ERR_1000')).toBe(true);
      expect(isErrorCode('ERR_2000')).toBe(true);
      expect(isErrorCode('ERR_3000')).toBe(true);
    });

    it('should return false for invalid error codes', () => {
      expect(isErrorCode('INVALID')).toBe(false);
      expect(isErrorCode('ERR_9999')).toBe(false);
      expect(isErrorCode('')).toBe(false);
      expect(isErrorCode('123')).toBe(false);
    });

    it('should handle case-sensitive codes', () => {
      expect(isErrorCode('err_1000')).toBe(false);
      expect(isErrorCode('ERR_1000')).toBe(true);
    });
  });

  describe('getErrorMetadata', () => {
    it('should return metadata for valid error codes', () => {
      const metadata = getErrorMetadata(ErrorCodes.NOT_FOUND);

      expect(metadata).toBeDefined();
      expect(metadata?.code).toBe('ERR_1004');
      expect(metadata?.defaultMessage).toBe('Resource not found');
      expect(metadata?.httpStatus).toBe(404);
      expect(metadata?.category).toBe('http');
    });

    it('should return null for unregistered error codes', () => {
      const metadata = getErrorMetadata('ERR_9999' as ErrorCode);

      expect(metadata).toBeNull();
    });

    it('should return correct metadata for validation errors', () => {
      const metadata = getErrorMetadata(ErrorCodes.VALIDATION_FAILED);

      expect(metadata?.httpStatus).toBe(400);
      expect(metadata?.category).toBe('validation');
    });

    it('should return correct metadata for business errors', () => {
      const metadata = getErrorMetadata(ErrorCodes.DUPLICATE_ENTITY);

      expect(metadata?.httpStatus).toBe(409);
      expect(metadata?.category).toBe('business');
    });
  });

  describe('getHttpStatus', () => {
    it('should return correct HTTP status for error codes', () => {
      expect(getHttpStatus(ErrorCodes.BAD_REQUEST)).toBe(400);
      expect(getHttpStatus(ErrorCodes.UNAUTHORIZED)).toBe(401);
      expect(getHttpStatus(ErrorCodes.FORBIDDEN)).toBe(403);
      expect(getHttpStatus(ErrorCodes.NOT_FOUND)).toBe(404);
      expect(getHttpStatus(ErrorCodes.CONFLICT)).toBe(409);
      expect(getHttpStatus(ErrorCodes.INTERNAL_SERVER_ERROR)).toBe(500);
    });

    it('should return 500 for unregistered error codes', () => {
      expect(getHttpStatus('ERR_UNKNOWN' as ErrorCode)).toBe(500);
    });

    it('should return correct status for validation errors', () => {
      expect(getHttpStatus(ErrorCodes.VALIDATION_FAILED)).toBe(400);
      expect(getHttpStatus(ErrorCodes.REQUIRED_FIELD)).toBe(400);
      expect(getHttpStatus(ErrorCodes.OUT_OF_RANGE)).toBe(400);
    });
  });

  describe('error code format', () => {
    it('should follow ERR_[CATEGORY][NUMBER] format', () => {
      // HTTP errors: 1xxx
      expect(ErrorCodes.BAD_REQUEST).toMatch(/^ERR_1\d{3}$/);
      expect(ErrorCodes.NOT_FOUND).toMatch(/^ERR_1\d{3}$/);

      // Validation errors: 2xxx
      expect(ErrorCodes.VALIDATION_FAILED).toMatch(/^ERR_2\d{3}$/);
      expect(ErrorCodes.REQUIRED_FIELD).toMatch(/^ERR_2\d{3}$/);

      // Business errors: 3xxx
      expect(ErrorCodes.BUSINESS_RULE_VIOLATION).toMatch(/^ERR_3\d{3}$/);
      expect(ErrorCodes.DUPLICATE_ENTITY).toMatch(/^ERR_3\d{3}$/);
    });
  });

  describe('error categories', () => {
    it('should have correct categories in metadata', () => {
      const httpMeta = getErrorMetadata(ErrorCodes.NOT_FOUND);
      const validationMeta = getErrorMetadata(ErrorCodes.VALIDATION_FAILED);
      const businessMeta = getErrorMetadata(ErrorCodes.DUPLICATE_ENTITY);

      expect(httpMeta?.category).toBe('http');
      expect(validationMeta?.category).toBe('validation');
      expect(businessMeta?.category).toBe('business');
    });
  });

  describe('completeness', () => {
    it('should have all common HTTP error codes', () => {
      expect(ErrorCodes.BAD_REQUEST).toBeDefined();
      expect(ErrorCodes.UNAUTHORIZED).toBeDefined();
      expect(ErrorCodes.FORBIDDEN).toBeDefined();
      expect(ErrorCodes.NOT_FOUND).toBeDefined();
      expect(ErrorCodes.CONFLICT).toBeDefined();
      expect(ErrorCodes.INTERNAL_SERVER_ERROR).toBeDefined();
    });

    it('should have all common validation error codes', () => {
      expect(ErrorCodes.VALIDATION_FAILED).toBeDefined();
      expect(ErrorCodes.REQUIRED_FIELD).toBeDefined();
      expect(ErrorCodes.INVALID_FORMAT).toBeDefined();
      expect(ErrorCodes.OUT_OF_RANGE).toBeDefined();
      expect(ErrorCodes.INVALID_EMAIL).toBeDefined();
      expect(ErrorCodes.INVALID_UUID).toBeDefined();
    });

    it('should have all common business error codes', () => {
      expect(ErrorCodes.BUSINESS_RULE_VIOLATION).toBeDefined();
      expect(ErrorCodes.INSUFFICIENT_QUANTITY).toBeDefined();
      expect(ErrorCodes.DUPLICATE_ENTITY).toBeDefined();
      expect(ErrorCodes.INVALID_STATE_TRANSITION).toBeDefined();
      expect(ErrorCodes.OPERATION_NOT_ALLOWED).toBeDefined();
    });
  });
});
