/**
 * Product Type Domain Error Codes
 *
 * Extends default domain error codes with product-type-specific errors.
 *
 * @module ProductTypeErrorCodes
 * @version 1.0.0
 * @since 2026-02-12
 */

import { DomainErrorCodesDefault } from '../../../common/domain/exceptions/constants';

export const ProductTypeErrorCodes = {
  ...DomainErrorCodesDefault,

  // Validation Errors
  PRODUCT_TYPE_VALIDATION_NAME_REQUIRED:
    'domain.productTypes.validation.name_required',
  PRODUCT_TYPE_VALIDATION_NAME_TOO_LONG:
    'domain.productTypes.validation.name_too_long',

  // Business Logic Errors
  PRODUCT_TYPE_NAME_EXISTS: 'domain.productTypes.name_exists',
  PRODUCT_TYPE_NOT_FOUND: 'domain.productTypes.not_found',
  PRODUCT_TYPE_HAS_CATEGORIES: 'domain.productTypes.has_categories',

  // Business Access Errors
  PRODUCT_TYPE_BUSINESS_NOT_FOUND: 'domain.productTypes.business.not_found',
  PRODUCT_TYPE_BUSINESS_ACCESS_DENIED:
    'domain.productTypes.business.access_denied',
} as const;

export type ProductTypeErrorCode =
  (typeof ProductTypeErrorCodes)[keyof typeof ProductTypeErrorCodes];
