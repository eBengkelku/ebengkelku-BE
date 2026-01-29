import {
  CustomerRegistrationErrorCodes,
  isCustomerRegistrationErrorCode,
  CustomerRegistrationErrorCode,
} from '../errors/customer-registration-error-codes';

describe('CustomerRegistrationErrorCodes', () => {
  describe('constants', () => {
    it('should have EMAIL_ALREADY_EXISTS error code', () => {
      expect(CustomerRegistrationErrorCodes.EMAIL_ALREADY_EXISTS).toBe(
        'CUSTOMER_EMAIL_ALREADY_EXISTS',
      );
    });

    it('should have ROLE_NOT_FOUND error code', () => {
      expect(CustomerRegistrationErrorCodes.ROLE_NOT_FOUND).toBe(
        'CUSTOMER_ROLE_NOT_FOUND',
      );
    });

    it('should have REGISTRATION_FAILED error code', () => {
      expect(CustomerRegistrationErrorCodes.REGISTRATION_FAILED).toBe(
        'CUSTOMER_REGISTRATION_FAILED',
      );
    });

    it('should have PASSWORD_HASH_FAILED error code', () => {
      expect(CustomerRegistrationErrorCodes.PASSWORD_HASH_FAILED).toBe(
        'CUSTOMER_PASSWORD_HASH_FAILED',
      );
    });

    it('should have ENCRYPTION_FAILED error code', () => {
      expect(CustomerRegistrationErrorCodes.ENCRYPTION_FAILED).toBe(
        'CUSTOMER_ENCRYPTION_FAILED',
      );
    });

    it('should be immutable (readonly)', () => {
      const code: CustomerRegistrationErrorCode =
        CustomerRegistrationErrorCodes.EMAIL_ALREADY_EXISTS;
      expect(code).toBe('CUSTOMER_EMAIL_ALREADY_EXISTS');
    });
  });

  describe('isCustomerRegistrationErrorCode', () => {
    it('should return true for valid EMAIL_ALREADY_EXISTS code', () => {
      expect(
        isCustomerRegistrationErrorCode('CUSTOMER_EMAIL_ALREADY_EXISTS'),
      ).toBe(true);
    });

    it('should return true for valid ROLE_NOT_FOUND code', () => {
      expect(isCustomerRegistrationErrorCode('CUSTOMER_ROLE_NOT_FOUND')).toBe(
        true,
      );
    });

    it('should return true for valid REGISTRATION_FAILED code', () => {
      expect(
        isCustomerRegistrationErrorCode('CUSTOMER_REGISTRATION_FAILED'),
      ).toBe(true);
    });

    it('should return true for valid PASSWORD_HASH_FAILED code', () => {
      expect(
        isCustomerRegistrationErrorCode('CUSTOMER_PASSWORD_HASH_FAILED'),
      ).toBe(true);
    });

    it('should return true for valid ENCRYPTION_FAILED code', () => {
      expect(
        isCustomerRegistrationErrorCode('CUSTOMER_ENCRYPTION_FAILED'),
      ).toBe(true);
    });

    it('should return false for invalid error codes', () => {
      expect(isCustomerRegistrationErrorCode('INVALID_CODE')).toBe(false);
      expect(isCustomerRegistrationErrorCode('ERR_1000')).toBe(false);
      expect(isCustomerRegistrationErrorCode('CUSTOMER_UNKNOWN')).toBe(false);
    });

    it('should return false for empty string', () => {
      expect(isCustomerRegistrationErrorCode('')).toBe(false);
    });

    it('should return false for partial match', () => {
      expect(isCustomerRegistrationErrorCode('CUSTOMER')).toBe(false);
      expect(isCustomerRegistrationErrorCode('EMAIL_ALREADY_EXISTS')).toBe(
        false,
      );
    });

    it('should be case-sensitive', () => {
      expect(
        isCustomerRegistrationErrorCode('customer_email_already_exists'),
      ).toBe(false);
      expect(
        isCustomerRegistrationErrorCode('Customer_Email_Already_Exists'),
      ).toBe(false);
    });

    it('should return true for all defined error codes', () => {
      // Test all values in the ErrorCodes object
      Object.values(CustomerRegistrationErrorCodes).forEach((code) => {
        expect(isCustomerRegistrationErrorCode(code)).toBe(true);
      });
    });
  });

  describe('completeness', () => {
    it('should have all expected error codes defined', () => {
      expect(CustomerRegistrationErrorCodes.EMAIL_ALREADY_EXISTS).toBeDefined();
      expect(CustomerRegistrationErrorCodes.ROLE_NOT_FOUND).toBeDefined();
      expect(CustomerRegistrationErrorCodes.REGISTRATION_FAILED).toBeDefined();
      expect(CustomerRegistrationErrorCodes.PASSWORD_HASH_FAILED).toBeDefined();
      expect(CustomerRegistrationErrorCodes.ENCRYPTION_FAILED).toBeDefined();
    });

    it('should have exactly 5 error codes', () => {
      const errorCodeCount = Object.keys(CustomerRegistrationErrorCodes).length;
      expect(errorCodeCount).toBe(5);
    });
  });

  describe('error code format', () => {
    it('should follow CUSTOMER_[ACTION] format', () => {
      Object.values(CustomerRegistrationErrorCodes).forEach((code) => {
        expect(code).toMatch(/^CUSTOMER_[A-Z_]+$/);
      });
    });
  });
});
