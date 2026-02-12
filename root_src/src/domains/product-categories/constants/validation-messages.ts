/**
 * Product Category Domain Validation Messages
 *
 * Internationalization keys for product category domain validation messages.
 *
 * @module ProductCategoryValidationMessages
 * @version 1.0.0
 * @since 2026-02-12
 */

export const ProductCategoryValidationMessages = {
  // Name validation
  NAME_REQUIRED: 'productCategories.validation.name.required',
  NAME_STRING: 'productCategories.validation.name.string',
  NAME_LENGTH: 'productCategories.validation.name.length',

  // Description validation
  DESCRIPTION_STRING: 'productCategories.validation.description.string',

  // Product type validation
  PRODUCT_TYPE_ID_REQUIRED:
    'productCategories.validation.product_type_id.required',
  PRODUCT_TYPE_ID_UUID: 'productCategories.validation.product_type_id.uuid',

  // Business validation
  BUSINESS_ID_REQUIRED: 'productCategories.validation.business_id.required',
  BUSINESS_ID_UUID: 'productCategories.validation.business_id.uuid',
};
