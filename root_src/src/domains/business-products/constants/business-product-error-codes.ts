/**
 * Business Product Domain Error Codes
 *
 * Extends default domain error codes with business-product-specific errors.
 *
 * @module BusinessProductErrorCodes
 * @version 1.0.0
 * @since 2026-02-12
 */

import { DomainErrorCodesDefault } from '../../../common/domain/exceptions/constants';

export const BusinessProductErrorCodes = {
  ...DomainErrorCodesDefault,

  // Validation Errors
  BUSINESS_PRODUCT_VALIDATION_NAME_REQUIRED:
    'domain.businessProducts.validation.name_required',
  BUSINESS_PRODUCT_VALIDATION_NAME_TOO_LONG:
    'domain.businessProducts.validation.name_too_long',
  BUSINESS_PRODUCT_VALIDATION_PRICE_NOT_POSITIVE:
    'domain.businessProducts.validation.price_not_positive',
  BUSINESS_PRODUCT_VALIDATION_STATUS_INVALID:
    'domain.businessProducts.validation.status_invalid',

  // Business Logic Errors
  BUSINESS_PRODUCT_NOT_FOUND: 'domain.businessProducts.not_found',
  BUSINESS_PRODUCT_NOT_BELONG_TO_BUSINESS:
    'domain.businessProducts.not_belong_to_business',
  BUSINESS_PRODUCT_CATEGORY_NOT_FOUND:
    'domain.businessProducts.category_not_found',

  // Business Access Errors
  BUSINESS_PRODUCT_BUSINESS_NOT_FOUND:
    'domain.businessProducts.business.not_found',
  BUSINESS_PRODUCT_BUSINESS_ACCESS_DENIED:
    'domain.businessProducts.business.access_denied',
} as const;

export type BusinessProductErrorCode =
  (typeof BusinessProductErrorCodes)[keyof typeof BusinessProductErrorCodes];
