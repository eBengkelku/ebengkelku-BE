/**
 * Service Domain Error Codes
 * Extends default domain error codes with service-specific errors.
 */
import { DomainErrorCodesDefault } from '../../../common/domain/exceptions/constants';

export const ServiceErrorCodes = {
  ...DomainErrorCodesDefault,

  // Validation Errors
  SERVICE_VALIDATION_NAME_REQUIRED: 'domain.services.validation.name_required',
  SERVICE_VALIDATION_NAME_TOO_LONG: 'domain.services.validation.name_too_long',
  SERVICE_VALIDATION_NAME_DUPLICATE:
    'domain.services.validation.name_duplicate',
  SERVICE_VALIDATION_PRICE_INVALID: 'domain.services.validation.price_invalid',
  SERVICE_VALIDATION_INVALID_NUMBER:
    'domain.services.validation.invalid_number',

  // Business Logic Errors
  SERVICE_BUSINESS_NOT_FOUND: 'domain.services.business.not_found',
  SERVICE_BUSINESS_ACCESS_DENIED: 'domain.services.business.access_denied',

  // Data Errors
  SERVICE_NOT_FOUND: 'domain.services.data.not_found',
  SERVICE_BATCH_TOO_LARGE: 'domain.services.batch.too_large',
};
