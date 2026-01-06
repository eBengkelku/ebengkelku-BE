/**
 * Domain Infrastructure Barrel Export
 *
 * This file provides centralized exports for the domain model pattern infrastructure.
 * Import from this file to access all domain-related base classes, exceptions, filters,
 * and configurations.
 *
 * @module Domain
 * @version 1.1.0
 * @since 2025-10-03
 * @updated 2025-10-03 - Added i18n exception support
 *
 * @example
 * ```typescript
 * // Import all domain infrastructure
 * import {
 *   BaseDomainModel,
 *   BaseDomainRepository,
 *   BaseDomainService,
 *   DomainRepositoryConfig,
 *   DEFAULT_DOMAIN_REPOSITORY_CONFIG,
 *   DomainException,
 *   DomainValidationException,
 *   DomainNotFoundException,
 *   DomainConflictException,
 *   DomainErrorCodes,
 *   DomainExceptionFilter,
 *   createDomainExceptionFilterProvider,
 * } from '@/common/domain';
 *
 * // Or import selectively
 * import {
 *   BaseDomainModel,
 *   DomainValidationException,
 *   DomainErrorCodes,
 * } from '@/common/domain';
 * ```
 */

// ============================================================================
// Base Classes
// ============================================================================
export { BaseDomainModel } from './base-domain.model';
export { BaseDomainRepository } from './base-domain.repository';
export { BaseDomainService } from './base-domain.service';

// ============================================================================
// Configuration
// ============================================================================
export {
  DomainRepositoryConfig,
  DEFAULT_DOMAIN_REPOSITORY_CONFIG,
} from './domain-repository.config';

// ============================================================================
// Exceptions (NEW - i18n support)
// ============================================================================
export {
  DomainException,
  DomainValidationException,
  DomainNotFoundException,
  DomainConflictException,
} from './exceptions';

// ============================================================================
// Default Error Codes (Common/Reusable - Injectable Pattern)
// ============================================================================
export {
  DomainErrorCodesDefault,
  DomainErrorCodeDefault,
  isDefaultDomainErrorCode,
} from './exceptions';

// ============================================================================
// DEPRECATED: Unified Error Codes (for backward compatibility)
// Use domain-specific error codes instead (e.g., ProductErrorCodes)
// Will be removed in v2.0.0
// ============================================================================
export {
  DomainErrorCodes,
  DomainErrorCode,
  isDomainErrorCode,
  getErrorCodesForDomain,
} from './exceptions';

// ============================================================================
// Exception Filters (NEW - i18n support)
// ============================================================================
export {
  DomainExceptionFilter,
  createDomainExceptionFilterProvider,
} from '../filters/domain-exception.filter';
