import { HttpStatus } from '@nestjs/common';
import { NotFoundException } from '../../exceptions/not-found.exception';
import { ErrorCodes } from '../../errors';

describe('NotFoundException', () => {
  describe('constructor', () => {
    it('should create not found exception with default values', () => {
      const exception = new NotFoundException();

      expect(exception).toBeInstanceOf(NotFoundException);
      expect(exception.message).toBe('Resource not found');
      expect(exception.getStatus()).toBe(HttpStatus.NOT_FOUND);
      expect(exception.errorCode).toBe(ErrorCodes.NOT_FOUND);
    });

    it('should create not found exception with custom message', () => {
      const exception = new NotFoundException('Product not found');

      expect(exception.message).toBe('Product not found');
    });

    it('should create not found exception with custom error code', () => {
      const customCode = 'ERR_4000';
      const exception = new NotFoundException(
        'Product not found',
        customCode,
      );

      expect(exception.errorCode).toBe(customCode);
    });

    it('should use default translation key', () => {
      const exception = new NotFoundException();

      expect(exception.translationKey).toBe('common.not_found');
    });
  });

  describe('forEntity', () => {
    it('should create exception for entity with single identifier', () => {
      const exception = NotFoundException.forEntity('Product', { id: '123' });

      expect(exception).toBeInstanceOf(NotFoundException);
      expect(exception.message).toBe('Product not found');
      expect(exception.context).toMatchObject({
        entityName: 'Product',
        id: '123',
      });
      expect(exception.translationKey).toBe('common.not_found_by_id');
    });

    it('should create exception for entity with multiple identifiers', () => {
      const exception = NotFoundException.forEntity('Order', {
        id: '456',
        userId: '789',
      });

      expect(exception.message).toBe('Order not found');
      expect(exception.context).toMatchObject({
        entityName: 'Order',
        id: '456',
        userId: '789',
      });
    });

    it('should accept custom error code', () => {
      const customCode = 'ERR_CUSTOM';
      const exception = NotFoundException.forEntity(
        'Product',
        { id: '123' },
        customCode,
      );

      expect(exception.errorCode).toBe(customCode);
    });
  });

  describe('forId', () => {
    it('should create exception for entity by ID', () => {
      const exception = NotFoundException.forId('Product', '123');

      expect(exception).toBeInstanceOf(NotFoundException);
      expect(exception.message).toBe('Product with id 123 not found');
      expect(exception.context).toMatchObject({
        entityName: 'Product',
        id: '123',
      });
      expect(exception.translationKey).toBe('common.not_found_by_id');
    });

    it('should accept custom error code', () => {
      const customCode = 'ERR_PRODUCT_NOT_FOUND';
      const exception = NotFoundException.forId('Product', '123', customCode);

      expect(exception.errorCode).toBe(customCode);
    });
  });

  describe('forCriteria', () => {
    it('should create exception with search criteria', () => {
      const criteria = { sku: 'ABC123', status: 'active' };
      const exception = NotFoundException.forCriteria('Product', criteria);

      expect(exception).toBeInstanceOf(NotFoundException);
      expect(exception.message).toBe('Product not found matching criteria');
      expect(exception.context).toMatchObject({
        entityName: 'Product',
        criteria: {
          sku: 'ABC123',
          status: 'active',
        },
      });
      expect(exception.translationKey).toBe('common.not_found');
    });

    it('should accept custom error code', () => {
      const customCode = 'ERR_SEARCH_FAILED';
      const exception = NotFoundException.forCriteria(
        'Product',
        { name: 'Test' },
        customCode,
      );

      expect(exception.errorCode).toBe(customCode);
    });
  });

  describe('forRoute', () => {
    it('should create exception for route not found', () => {
      const path = '/api/v1/unknown';
      const exception = NotFoundException.forRoute(path);

      expect(exception).toBeInstanceOf(NotFoundException);
      expect(exception.message).toBe('Route not found: /api/v1/unknown');
      expect(exception.errorCode).toBe(ErrorCodes.NOT_FOUND);
      expect(exception.context).toMatchObject({ path });
      expect(exception.translationKey).toBe('common.route_not_found');
    });
  });

  describe('HTTP status', () => {
    it('should always return 404 status code', () => {
      const exception1 = new NotFoundException();
      const exception2 = NotFoundException.forId('Product', '123');
      const exception3 = NotFoundException.forRoute('/test');

      expect(exception1.getStatus()).toBe(404);
      expect(exception2.getStatus()).toBe(404);
      expect(exception3.getStatus()).toBe(404);
    });
  });

  describe('prototype chain', () => {
    it('should maintain proper prototype chain', () => {
      const exception = new NotFoundException();

      expect(exception).toBeInstanceOf(NotFoundException);
      expect(exception).toBeInstanceOf(Error);
    });
  });
});
