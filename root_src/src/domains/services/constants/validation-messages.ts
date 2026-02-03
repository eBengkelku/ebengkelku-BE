/**
 * Service Domain Validation Messages
 *
 * Internationalization keys for service domain validation messages.
 * These keys map to actual translated messages in the i18n files.
 *
 * @module ServiceValidationMessages
 * @version 1.0.0
 * @since 2026-02-03
 */

export const ServiceValidationMessages = {
  // Name validation
  NAME_REQUIRED: 'services.validation.name.required',
  NAME_STRING: 'services.validation.name.string',
  NAME_LENGTH: 'services.validation.name.length',
  NAME_NOT_EMPTY: 'services.validation.name.notEmpty',

  // Price validation
  PRICE_REQUIRED: 'services.validation.price.required',
  PRICE_INTEGER: 'services.validation.price.integer',
  PRICE_MIN: 'services.validation.price.min',
  PRICE_MAX: 'services.validation.price.max',

  // Business validation
  BUSINESS_ID_REQUIRED: 'services.validation.business_id.required',
  BUSINESS_ID_UUID: 'services.validation.business_id.uuid',

  // Duration validation
  DURATION_INTEGER: 'services.validation.duration_minutes.integer',
  DURATION_MIN: 'services.validation.duration_minutes.min',
  DURATION_MAX: 'services.validation.duration_minutes.max',

  // Quota validation
  QUOTA_INTEGER: 'services.validation.daily_quota.integer',
  QUOTA_MIN: 'services.validation.daily_quota.min',
  QUOTA_MAX: 'services.validation.daily_quota.max',

  // Description validation
  DESCRIPTION_STRING: 'services.validation.description.string',
  DESCRIPTION_LENGTH: 'services.validation.description.length',
};
