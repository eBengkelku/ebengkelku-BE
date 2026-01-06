import { HttpStatus } from '@nestjs/common';
import { BaseHttpException } from './base.exception';
import { ErrorCodes } from '../errors';

/**
 * Conflict Exception
 *
 * Thrown when a request conflicts with the current state of the resource (HTTP 409).
 * Commonly used for duplicate entries, constraint violations, or resource state conflicts.
 *
 * @class ConflictException
 * @extends BaseHttpException
 * @version 1.0.0
 * @since 2025-10-10
 *
 * @example Generic usage
 * ```typescript
 * throw new ConflictException('Resource already exists');
 * ```
 *
 * @example Duplicate entity
 * ```typescript
 * throw ConflictException.duplicate('Product', { sku: 'ABC123' });
 * ```
 *
 * @example State conflict
 * ```typescript
 * throw ConflictException.stateConflict(
 *   'Order',
 *   'cannot cancel completed order'
 * );
 * ```
 */
export class ConflictException extends BaseHttpException {
  /**
   * Creates a new ConflictException
   *
   * @param message - Error message
   * @param errorCode - Standardized error code (default: ERR_1009)
   * @param context - Additional error context
   * @param translationKey - i18n translation key
   * @param translationParams - Translation parameters
   */
  constructor(
    message: string = 'Resource conflict',
    errorCode: string = ErrorCodes.CONFLICT,
    context?: Record<string, any>,
    translationKey?: string,
    translationParams?: Record<string, any>,
  ) {
    super(
      message,
      HttpStatus.CONFLICT,
      errorCode,
      context,
      translationKey || 'common.conflict',
      translationParams,
    );

    Object.setPrototypeOf(this, ConflictException.prototype);
  }

  /**
   * Creates a ConflictException for duplicate entities
   *
   * @param entityName - Name of the entity (e.g., 'Product', 'User')
   * @param identifiers - Conflicting identifiers (e.g., { email: 'test@example.com' })
   * @param errorCode - Custom error code (optional)
   * @returns ConflictException instance
   *
   * @example
   * ```typescript
   * throw ConflictException.duplicate('User', { email: 'test@example.com' });
   * // Message: "User already exists"
   * // Context: { entityName: 'User', email: 'test@example.com' }
   * ```
   */
  static duplicate(
    entityName: string,
    identifiers: Record<string, any>,
    errorCode?: string,
  ): ConflictException {
    const identifierStrings = Object.entries(identifiers)
      .map(([key, value]) => `${key}: ${value}`)
      .join(', ');

    return new ConflictException(
      `${entityName} already exists`,
      errorCode || ErrorCodes.DUPLICATE_ENTITY,
      {
        entityName,
        conflictType: 'duplicate',
        ...identifiers,
      },
      'common.already_exists',
      {
        entityName,
        ...identifiers,
      },
    );
  }

  /**
   * Creates a ConflictException for unique constraint violations
   *
   * @param entityName - Name of the entity
   * @param field - Field with unique constraint
   * @param value - Conflicting value
   * @param errorCode - Custom error code (optional)
   * @returns ConflictException instance
   *
   * @example
   * ```typescript
   * throw ConflictException.uniqueConstraint('User', 'email', 'test@example.com');
   * // Message: "User with email test@example.com already exists"
   * ```
   */
  static uniqueConstraint(
    entityName: string,
    field: string,
    value: any,
    errorCode?: string,
  ): ConflictException {
    return new ConflictException(
      `${entityName} with ${field} ${value} already exists`,
      errorCode || ErrorCodes.DUPLICATE_ENTITY,
      {
        entityName,
        conflictType: 'unique_constraint',
        field,
        value,
      },
      'common.duplicate',
      {
        entityName,
        field,
        value,
      },
    );
  }

  /**
   * Creates a ConflictException for resource state conflicts
   *
   * @param entityName - Name of the entity
   * @param reason - Reason for the conflict
   * @param currentState - Current state of the resource (optional)
   * @param errorCode - Custom error code (optional)
   * @returns ConflictException instance
   *
   * @example
   * ```typescript
   * throw ConflictException.stateConflict(
   *   'Order',
   *   'Cannot cancel completed order',
   *   { status: 'completed' }
   * );
   * ```
   */
  static stateConflict(
    entityName: string,
    reason: string,
    currentState?: Record<string, any>,
    errorCode?: string,
  ): ConflictException {
    return new ConflictException(
      reason,
      errorCode || ErrorCodes.INVALID_STATE_TRANSITION,
      {
        entityName,
        conflictType: 'state',
        currentState,
      },
      'common.invalid_state_transition',
      {
        entityName,
        ...currentState,
      },
    );
  }

  /**
   * Creates a ConflictException for version conflicts (optimistic locking)
   *
   * @param entityName - Name of the entity
   * @param id - Entity ID
   * @param expectedVersion - Expected version
   * @param actualVersion - Actual version
   * @param errorCode - Custom error code (optional)
   * @returns ConflictException instance
   *
   * @example
   * ```typescript
   * throw ConflictException.versionConflict('Product', '123', 5, 7);
   * // Message: "Product version conflict. Resource was modified by another request."
   * ```
   */
  static versionConflict(
    entityName: string,
    id: string,
    expectedVersion: number,
    actualVersion: number,
    errorCode?: string,
  ): ConflictException {
    return new ConflictException(
      `${entityName} version conflict. Resource was modified by another request.`,
      errorCode || ErrorCodes.CONFLICT,
      {
        entityName,
        conflictType: 'version',
        id,
        expectedVersion,
        actualVersion,
      },
      'common.version_conflict',
      {
        entityName,
        expectedVersion,
        actualVersion,
      },
    );
  }

  /**
   * Creates a ConflictException for dependency conflicts
   *
   * @param entityName - Name of the entity
   * @param dependencies - Dependent entities/resources
   * @param errorCode - Custom error code (optional)
   * @returns ConflictException instance
   *
   * @example
   * ```typescript
   * throw ConflictException.dependencyConflict(
   *   'Category',
   *   ['10 products', '3 subcategories']
   * );
   * // Message: "Cannot delete Category. It has dependencies: 10 products, 3 subcategories"
   * ```
   */
  static dependencyConflict(
    entityName: string,
    dependencies: string[],
    errorCode?: string,
  ): ConflictException {
    return new ConflictException(
      `Cannot delete ${entityName}. It has dependencies: ${dependencies.join(', ')}`,
      errorCode || ErrorCodes.DEPENDENCY_EXISTS,
      {
        entityName,
        conflictType: 'dependency',
        dependencies,
      },
      'common.dependency_exists',
      {
        entityName,
        count: dependencies.length,
      },
    );
  }
}
