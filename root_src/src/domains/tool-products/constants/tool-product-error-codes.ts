/**
 * Tool Product Domain Error Codes
 *
 * Extends default domain error codes with tool-product-specific errors.
 *
 * @module ToolProductErrorCodes
 * @version 1.0.0
 * @since 2026-02-12
 */

import { DomainErrorCodesDefault } from '../../../common/domain/exceptions/constants';

export const ToolProductErrorCodes = {
  ...DomainErrorCodesDefault,

  // Validation Errors
  TOOL_PRODUCT_VALIDATION_WARRANTY_MONTHS_NEGATIVE:
    'domain.toolProducts.validation.warranty_months_negative',

  // Business Logic Errors
  TOOL_PRODUCT_NOT_FOUND: 'domain.toolProducts.not_found',
  TOOL_PRODUCT_ALREADY_EXISTS: 'domain.toolProducts.already_exists',
  TOOL_PRODUCT_NOT_BELONG_TO_BUSINESS:
    'domain.toolProducts.not_belong_to_business',

  // Business Access Errors
  TOOL_PRODUCT_BUSINESS_NOT_FOUND: 'domain.toolProducts.business.not_found',
  TOOL_PRODUCT_BUSINESS_ACCESS_DENIED:
    'domain.toolProducts.business.access_denied',
} as const;

export type ToolProductErrorCode =
  (typeof ToolProductErrorCodes)[keyof typeof ToolProductErrorCodes];
