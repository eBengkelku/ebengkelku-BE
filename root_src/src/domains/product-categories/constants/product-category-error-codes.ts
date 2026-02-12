/**
 * Product Category Domain Error Codes
 *
 * Extends default domain error codes with product-category-specific errors.
 *
 * @module ProductCategoryErrorCodes
 * @version 1.0.0
 * @since 2026-02-12
 */

import { DomainErrorCodesDefault } from '../../../common/domain/exceptions/constants';

export const ProductCategoryErrorCodes = {
  ...DomainErrorCodesDefault,

  // Validation Errors
  PRODUCT_CATEGORY_VALIDATION_NAME_REQUIRED:
    'domain.productCategories.validation.name_required',
  PRODUCT_CATEGORY_VALIDATION_NAME_TOO_LONG:
    'domain.productCategories.validation.name_too_long',

  // Business Logic Errors
  PRODUCT_CATEGORY_NAME_EXISTS: 'domain.productCategories.name_exists',
  PRODUCT_CATEGORY_NOT_FOUND: 'domain.productCategories.not_found',
  PRODUCT_CATEGORY_TYPE_NOT_FOUND: 'domain.productCategories.type_not_found',
  PRODUCT_CATEGORY_HAS_PRODUCTS: 'domain.productCategories.has_products',

  // Business Access Errors
  PRODUCT_CATEGORY_BUSINESS_NOT_FOUND:
    'domain.productCategories.business.not_found',
  PRODUCT_CATEGORY_BUSINESS_ACCESS_DENIED:
    'domain.productCategories.business.access_denied',
} as const;

export type ProductCategoryErrorCode =
  (typeof ProductCategoryErrorCodes)[keyof typeof ProductCategoryErrorCodes];
