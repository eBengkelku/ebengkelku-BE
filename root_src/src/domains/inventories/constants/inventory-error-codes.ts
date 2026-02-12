/**
 * Inventory Domain Error Codes
 *
 * Extends default domain error codes with inventory-specific errors.
 *
 * @module InventoryErrorCodes
 * @version 1.0.0
 * @since 2026-02-12
 */

import { DomainErrorCodesDefault } from '../../../common/domain/exceptions/constants';

export const InventoryErrorCodes = {
  ...DomainErrorCodesDefault,

  // Validation Errors
  INVENTORY_VALIDATION_QUANTITY_NEGATIVE:
    'domain.inventories.validation.quantity_negative',
  INVENTORY_VALIDATION_MIN_STOCK_NEGATIVE:
    'domain.inventories.validation.min_stock_negative',

  // Business Logic Errors
  INVENTORY_NOT_FOUND: 'domain.inventories.not_found',
  INVENTORY_ALREADY_EXISTS: 'domain.inventories.already_exists',
  INVENTORY_NOT_BELONG_TO_BUSINESS: 'domain.inventories.not_belong_to_business',

  // Business Access Errors
  INVENTORY_BUSINESS_NOT_FOUND: 'domain.inventories.business.not_found',
  INVENTORY_BUSINESS_ACCESS_DENIED: 'domain.inventories.business.access_denied',
} as const;

export type InventoryErrorCode =
  (typeof InventoryErrorCodes)[keyof typeof InventoryErrorCodes];
