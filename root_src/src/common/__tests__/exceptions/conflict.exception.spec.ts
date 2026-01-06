import { HttpStatus } from '@nestjs/common';
import { ConflictException } from '../../exceptions/conflict.exception';
import { ErrorCodes } from '../../errors';

describe('ConflictException', () => {
  describe('constructor', () => {
    it('should create conflict exception with default values', () => {
      const exception = new ConflictException();

      expect(exception).toBeInstanceOf(ConflictException);
      expect(exception.message).toBe('Resource conflict');
      expect(exception.getStatus()).toBe(HttpStatus.CONFLICT);
      expect(exception.errorCode).toBe(ErrorCodes.CONFLICT);
    });

    it('should create conflict exception with custom message', () => {
      const exception = new ConflictException('Product already exists');

      expect(exception.message).toBe('Product already exists');
    });

    it('should use default translation key', () => {
      const exception = new ConflictException();

      expect(exception.translationKey).toBe('common.conflict');
    });
  });

  describe('duplicate', () => {
    it('should create exception for duplicate entity with single identifier', () => {
      const exception = ConflictException.duplicate('User', {
        email: 'test@example.com',
      });

      expect(exception).toBeInstanceOf(ConflictException);
      expect(exception.message).toBe('User already exists');
      expect(exception.errorCode).toBe(ErrorCodes.DUPLICATE_ENTITY);
      expect(exception.context).toMatchObject({
        entityName: 'User',
        conflictType: 'duplicate',
        email: 'test@example.com',
      });
      expect(exception.translationKey).toBe('common.already_exists');
    });

    it('should create exception for duplicate entity with multiple identifiers', () => {
      const exception = ConflictException.duplicate('Product', {
        sku: 'ABC123',
        name: 'Test Product',
      });

      expect(exception.context).toMatchObject({
        entityName: 'Product',
        conflictType: 'duplicate',
        sku: 'ABC123',
        name: 'Test Product',
      });
    });

    it('should accept custom error code', () => {
      const customCode = 'ERR_CUSTOM_DUPLICATE';
      const exception = ConflictException.duplicate(
        'Product',
        { sku: 'ABC' },
        customCode,
      );

      expect(exception.errorCode).toBe(customCode);
    });
  });

  describe('uniqueConstraint', () => {
    it('should create exception for unique constraint violation', () => {
      const exception = ConflictException.uniqueConstraint(
        'User',
        'email',
        'test@example.com',
      );

      expect(exception).toBeInstanceOf(ConflictException);
      expect(exception.message).toBe(
        'User with email test@example.com already exists',
      );
      expect(exception.errorCode).toBe(ErrorCodes.DUPLICATE_ENTITY);
      expect(exception.context).toMatchObject({
        entityName: 'User',
        conflictType: 'unique_constraint',
        field: 'email',
        value: 'test@example.com',
      });
    });

    it('should accept custom error code', () => {
      const customCode = 'ERR_EMAIL_TAKEN';
      const exception = ConflictException.uniqueConstraint(
        'User',
        'email',
        'test@example.com',
        customCode,
      );

      expect(exception.errorCode).toBe(customCode);
    });
  });

  describe('stateConflict', () => {
    it('should create exception for state conflict', () => {
      const currentState = { status: 'completed' };
      const exception = ConflictException.stateConflict(
        'Order',
        'Cannot cancel completed order',
        currentState,
      );

      expect(exception).toBeInstanceOf(ConflictException);
      expect(exception.message).toBe('Cannot cancel completed order');
      expect(exception.errorCode).toBe(ErrorCodes.INVALID_STATE_TRANSITION);
      expect(exception.context).toMatchObject({
        entityName: 'Order',
        conflictType: 'state',
        currentState: { status: 'completed' },
      });
      expect(exception.translationKey).toBe('common.invalid_state_transition');
    });

    it('should work without current state', () => {
      const exception = ConflictException.stateConflict(
        'Order',
        'Invalid operation',
      );

      expect(exception.context?.currentState).toBeUndefined();
    });

    it('should accept custom error code', () => {
      const customCode = 'ERR_INVALID_ORDER_STATE';
      const exception = ConflictException.stateConflict(
        'Order',
        'Invalid state',
        undefined,
        customCode,
      );

      expect(exception.errorCode).toBe(customCode);
    });
  });

  describe('versionConflict', () => {
    it('should create exception for version conflict', () => {
      const exception = ConflictException.versionConflict(
        'Product',
        '123',
        5,
        7,
      );

      expect(exception).toBeInstanceOf(ConflictException);
      expect(exception.message).toBe(
        'Product version conflict. Resource was modified by another request.',
      );
      expect(exception.errorCode).toBe(ErrorCodes.CONFLICT);
      expect(exception.context).toMatchObject({
        entityName: 'Product',
        conflictType: 'version',
        id: '123',
        expectedVersion: 5,
        actualVersion: 7,
      });
      expect(exception.translationKey).toBe('common.version_conflict');
    });

    it('should accept custom error code', () => {
      const customCode = 'ERR_VERSION_MISMATCH';
      const exception = ConflictException.versionConflict(
        'Product',
        '123',
        1,
        2,
        customCode,
      );

      expect(exception.errorCode).toBe(customCode);
    });
  });

  describe('dependencyConflict', () => {
    it('should create exception for dependency conflict', () => {
      const dependencies = ['10 products', '3 subcategories'];
      const exception = ConflictException.dependencyConflict(
        'Category',
        dependencies,
      );

      expect(exception).toBeInstanceOf(ConflictException);
      expect(exception.message).toBe(
        'Cannot delete Category. It has dependencies: 10 products, 3 subcategories',
      );
      expect(exception.errorCode).toBe(ErrorCodes.DEPENDENCY_EXISTS);
      expect(exception.context).toMatchObject({
        entityName: 'Category',
        conflictType: 'dependency',
        dependencies: ['10 products', '3 subcategories'],
      });
      expect(exception.translationKey).toBe('common.dependency_exists');
    });

    it('should handle single dependency', () => {
      const exception = ConflictException.dependencyConflict('User', [
        '5 orders',
      ]);

      expect(exception.message).toBe(
        'Cannot delete User. It has dependencies: 5 orders',
      );
    });

    it('should accept custom error code', () => {
      const customCode = 'ERR_HAS_DEPENDENCIES';
      const exception = ConflictException.dependencyConflict(
        'Category',
        ['items'],
        customCode,
      );

      expect(exception.errorCode).toBe(customCode);
    });
  });

  describe('HTTP status', () => {
    it('should always return 409 status code', () => {
      const exception1 = new ConflictException();
      const exception2 = ConflictException.duplicate('User', { id: '123' });
      const exception3 = ConflictException.stateConflict('Order', 'Invalid');

      expect(exception1.getStatus()).toBe(409);
      expect(exception2.getStatus()).toBe(409);
      expect(exception3.getStatus()).toBe(409);
    });
  });

  describe('prototype chain', () => {
    it('should maintain proper prototype chain', () => {
      const exception = new ConflictException();

      expect(exception).toBeInstanceOf(ConflictException);
      expect(exception).toBeInstanceOf(Error);
    });
  });
});
