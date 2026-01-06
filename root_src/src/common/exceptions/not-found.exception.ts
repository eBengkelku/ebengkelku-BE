import { HttpStatus } from '@nestjs/common';
import { BaseHttpException } from './base.exception';
import { ErrorCodes } from '../errors';

/**
 * Not Found Exception
 *
 * Thrown when a requested resource is not found (HTTP 404).
 * Commonly used in repository/service layers when querying for entities.
 *
 * @class NotFoundException
 * @extends BaseHttpException
 * @version 1.0.0
 * @since 2025-10-10
 *
 * @example Generic usage
 * ```typescript
 * throw new NotFoundException('Product not found');
 * ```
 *
 * @example With entity details
 * ```typescript
 * throw NotFoundException.forEntity('Product', { id: '123' });
 * ```
 *
 * @example With custom error code
 * ```typescript
 * throw new NotFoundException(
 *   'Product not found',
 *   ProductErrorCodes.PRODUCT_NOT_FOUND,
 *   { productId: '123' }
 * );
 * ```
 */
export class NotFoundException extends BaseHttpException {
  /**
   * Creates a new NotFoundException
   *
   * @param message - Error message
   * @param errorCode - Standardized error code (default: ERR_1004)
   * @param context - Additional error context
   * @param translationKey - i18n translation key
   * @param translationParams - Translation parameters
   */
  constructor(
    message: string = 'Resource not found',
    errorCode: string = ErrorCodes.NOT_FOUND,
    context?: Record<string, any>,
    translationKey?: string,
    translationParams?: Record<string, any>,
  ) {
    super(
      message,
      HttpStatus.NOT_FOUND,
      errorCode,
      context,
      translationKey || 'common.not_found',
      translationParams,
    );

    Object.setPrototypeOf(this, NotFoundException.prototype);
  }

  /**
   * Creates a NotFoundException for a specific entity
   *
   * @param entityName - Name of the entity (e.g., 'Product', 'User')
   * @param identifiers - Entity identifiers (e.g., { id: '123' })
   * @param errorCode - Custom error code (optional)
   * @returns NotFoundException instance
   *
   * @example
   * ```typescript
   * throw NotFoundException.forEntity('Product', { id: '123' });
   * // Message: "Product not found"
   * // Context: { entityName: 'Product', id: '123' }
   * ```
   */
  static forEntity(
    entityName: string,
    identifiers: Record<string, any>,
    errorCode?: string,
  ): NotFoundException {
    const identifierStrings = Object.entries(identifiers)
      .map(([key, value]) => `${key}: ${value}`)
      .join(', ');

    return new NotFoundException(
      `${entityName} not found`,
      errorCode || ErrorCodes.NOT_FOUND,
      {
        entityName,
        ...identifiers,
      },
      'common.not_found_by_id',
      {
        entityName,
        ...identifiers,
      },
    );
  }

  /**
   * Creates a NotFoundException for an entity by ID
   *
   * @param entityName - Name of the entity
   * @param id - Entity ID
   * @param errorCode - Custom error code (optional)
   * @returns NotFoundException instance
   *
   * @example
   * ```typescript
   * throw NotFoundException.forId('Product', '123');
   * // Message: "Product with id 123 not found"
   * ```
   */
  static forId(
    entityName: string,
    id: string,
    errorCode?: string,
  ): NotFoundException {
    return new NotFoundException(
      `${entityName} with id ${id} not found`,
      errorCode || ErrorCodes.NOT_FOUND,
      {
        entityName,
        id,
      },
      'common.not_found_by_id',
      {
        entityName,
        id,
      },
    );
  }

  /**
   * Creates a NotFoundException with custom criteria
   *
   * @param entityName - Name of the entity
   * @param criteria - Search criteria that didn't match
   * @param errorCode - Custom error code (optional)
   * @returns NotFoundException instance
   *
   * @example
   * ```typescript
   * throw NotFoundException.forCriteria('Product', { sku: 'ABC123' });
   * // Message: "Product not found matching criteria"
   * // Context: { entityName: 'Product', sku: 'ABC123' }
   * ```
   */
  static forCriteria(
    entityName: string,
    criteria: Record<string, any>,
    errorCode?: string,
  ): NotFoundException {
    return new NotFoundException(
      `${entityName} not found matching criteria`,
      errorCode || ErrorCodes.NOT_FOUND,
      {
        entityName,
        criteria,
      },
      'common.not_found',
      {
        entityName,
      },
    );
  }

  /**
   * Creates a NotFoundException for a route/endpoint
   *
   * @param path - Request path
   * @returns NotFoundException instance
   *
   * @example
   * ```typescript
   * throw NotFoundException.forRoute('/api/v1/unknown');
   * // Message: "Route not found: /api/v1/unknown"
   * ```
   */
  static forRoute(path: string): NotFoundException {
    return new NotFoundException(
      `Route not found: ${path}`,
      ErrorCodes.NOT_FOUND,
      { path },
      'common.route_not_found',
      { path },
    );
  }
}
