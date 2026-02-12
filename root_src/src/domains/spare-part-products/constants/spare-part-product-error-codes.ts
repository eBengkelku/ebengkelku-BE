/**
 * Spare Part Product Domain Error Codes
 *
 * Extends default domain error codes with spare-part-product-specific errors.
 *
 * @module SparePartProductErrorCodes
 * @version 1.0.0
 * @since 2026-02-12
 */

import { DomainErrorCodesDefault } from '../../../common/domain/exceptions/constants';

export const SparePartProductErrorCodes = {
  ...DomainErrorCodesDefault,

  // Validation Errors
  SPARE_PART_PRODUCT_VALIDATION_GRADE_INVALID:
    'domain.sparePartProducts.validation.grade_invalid',
  SPARE_PART_PRODUCT_VALIDATION_BRAND_TOO_LONG:
    'domain.sparePartProducts.validation.brand_too_long',

  // Business Logic Errors
  SPARE_PART_PRODUCT_NOT_FOUND: 'domain.sparePartProducts.not_found',
  SPARE_PART_PRODUCT_ALREADY_EXISTS: 'domain.sparePartProducts.already_exists',
  SPARE_PART_PRODUCT_NOT_BELONG_TO_BUSINESS:
    'domain.sparePartProducts.not_belong_to_business',

  // Business Access Errors
  SPARE_PART_PRODUCT_BUSINESS_NOT_FOUND:
    'domain.sparePartProducts.business.not_found',
  SPARE_PART_PRODUCT_BUSINESS_ACCESS_DENIED:
    'domain.sparePartProducts.business.access_denied',
} as const;

export type SparePartProductErrorCode =
  (typeof SparePartProductErrorCodes)[keyof typeof SparePartProductErrorCodes];
