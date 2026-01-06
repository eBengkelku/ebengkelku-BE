/**
 * Domain Exceptions Barrel Export
 *
 * Centralized exports for all domain exception classes and utilities.
 *
 * @module DomainExceptions
 * @version 1.1.0
 * @since 2025-10-03
 * @updated 2025-10-03 - Refactored to injectable constant pattern
 *
 * @example
 * ```typescript
 * import {
 *   DomainException,
 *   DomainValidationException,
 *   DomainNotFoundException,
 *   DomainErrorCodesDefault,
 * } from '@/common/domain';
 * ```
 */

// ============================================================================
// Exception Classes
// ============================================================================
export {
  DomainException,
  DomainValidationException,
  DomainNotFoundException,
  DomainConflictException,
} from './domain.exception';

// ============================================================================
// Default Error Codes (Common/Reusable)
// ============================================================================
export {
  DomainErrorCodesDefault,
  DomainErrorCodeDefault,
  isDefaultDomainErrorCode,
} from './constants';

// ============================================================================
// DEPRECATED: Old unified error codes (for backward compatibility)
// Will be removed in v2.0.0
// Use domain-specific error codes instead (e.g., ProductErrorCodes)
// ============================================================================
export {
  DomainErrorCodes,
  DomainErrorCode,
  isDomainErrorCode,
  getErrorCodesForDomain,
} from './domain-error-codes';
