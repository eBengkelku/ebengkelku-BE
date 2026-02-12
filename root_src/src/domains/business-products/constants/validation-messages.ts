/**
 * Business Product Domain Validation Messages
 *
 * Internationalization keys for business product domain validation messages.
 *
 * @module BusinessProductValidationMessages
 * @version 1.0.0
 * @since 2026-02-12
 */

export const BusinessProductValidationMessages = {
  // Name validation
  NAME_REQUIRED: 'businessProducts.validation.name.required',
  NAME_STRING: 'businessProducts.validation.name.string',
  NAME_LENGTH: 'businessProducts.validation.name.length',

  // Description validation
  DESCRIPTION_STRING: 'businessProducts.validation.description.string',

  // Price validation
  PRICE_REQUIRED: 'businessProducts.validation.price.required',
  PRICE_INTEGER: 'businessProducts.validation.price.integer',
  PRICE_MIN: 'businessProducts.validation.price.min',

  // Category validation
  CATEGORY_ID_REQUIRED: 'businessProducts.validation.category_id.required',
  CATEGORY_ID_UUID: 'businessProducts.validation.category_id.uuid',

  // Unit validation
  UNIT_STRING: 'businessProducts.validation.unit.string',
  UNIT_LENGTH: 'businessProducts.validation.unit.length',

  // Status validation
  STATUS_INVALID: 'businessProducts.validation.status.invalid',
};
