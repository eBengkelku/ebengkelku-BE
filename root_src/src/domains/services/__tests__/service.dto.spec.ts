import { validate } from 'class-validator';
import { plainToClass } from 'class-transformer';
import {
  CreateServiceDto,
  BatchCreateServicesDto,
  ServicePayloadDto,
} from '../dto/create-service.dto';

describe('Service DTOs', () => {
  describe('ServicePayloadDto', () => {
    it('should validate valid payload', async () => {
      const validPayload = {
        name: 'Oil Change Service',
        description: 'Complete oil change',
        price: 150000,
        duration_minutes: 30,
        daily_quota: 10,
      };

      const dto = plainToClass(ServicePayloadDto, validPayload);
      const errors = await validate(dto);

      expect(errors).toHaveLength(0);
      expect(dto.name).toBe('Oil Change Service');
      expect(dto.price).toBe(150000);
    });

    it('should trim whitespace from name', async () => {
      const payload = {
        name: '  Trimmed Service  ',
        price: 100000,
      };

      const dto = plainToClass(ServicePayloadDto, payload);
      await validate(dto);

      expect(dto.name).toBe('Trimmed Service');
    });

    it('should validate required fields', async () => {
      const invalidPayload = {};

      const dto = plainToClass(ServicePayloadDto, invalidPayload);
      const errors = await validate(dto);

      const nameError = errors.find((e) => e.property === 'name');
      const priceError = errors.find((e) => e.property === 'price');

      expect(nameError).toBeDefined();
      expect(priceError).toBeDefined();
    });

    it('should validate name length constraints', async () => {
      const longNamePayload = {
        name: 'a'.repeat(256), // Too long
        price: 100000,
      };

      const dto = plainToClass(ServicePayloadDto, longNamePayload);
      const errors = await validate(dto);

      const nameError = errors.find((e) => e.property === 'name');
      expect(nameError).toBeDefined();
    });

    it('should validate price constraints', async () => {
      const invalidPrices = [
        { name: 'Test', price: -1 }, // Negative
        { name: 'Test', price: 2147483648 }, // Too large
        { name: 'Test', price: 'not-a-number' }, // Non-numeric
        { name: 'Test', price: 150.5 }, // Decimal (should convert to int)
      ];

      for (const payload of invalidPrices) {
        const dto = plainToClass(ServicePayloadDto, payload);
        const errors = await validate(dto);

        const priceError = errors.find((e) => e.property === 'price');

        if (payload.price === 150.5) {
          // Should convert to integer
          expect(dto.price).toBe(150);
        } else if (payload.price === 'not-a-number') {
          expect(priceError).toBeDefined();
        } else {
          expect(priceError).toBeDefined();
        }
      }
    });

    it('should handle optional fields correctly', async () => {
      const minimalPayload = {
        name: 'Minimal Service',
        price: 0, // Free service
      };

      const dto = plainToClass(ServicePayloadDto, minimalPayload);
      const errors = await validate(dto);

      expect(errors).toHaveLength(0);
      expect(dto.description).toBeUndefined();
      expect(dto.duration_minutes).toBeUndefined();
      expect(dto.daily_quota).toBeUndefined();
      expect(dto.price).toBe(0);
    });

    it('should validate duration_minutes constraints', async () => {
      const invalidDurations = [
        { name: 'Test', price: 100000, duration_minutes: -1 },
        { name: 'Test', price: 100000, duration_minutes: 'invalid' },
      ];

      for (const payload of invalidDurations) {
        const dto = plainToClass(ServicePayloadDto, payload);
        const errors = await validate(dto);

        const durationError = errors.find(
          (e) => e.property === 'duration_minutes',
        );
        expect(durationError).toBeDefined();
      }
    });

    it('should handle null and empty string transformations', async () => {
      const payloadWithNulls = {
        name: 'Test Service',
        price: 100000,
        duration_minutes: null,
        daily_quota: '',
      };

      const dto = plainToClass(ServicePayloadDto, payloadWithNulls);
      const errors = await validate(dto);

      expect(errors).toHaveLength(0);
      expect(dto.duration_minutes).toBeUndefined();
      expect(dto.daily_quota).toBeUndefined();
    });
  });

  describe('CreateServiceDto', () => {
    it('should validate complete DTO with business_id', async () => {
      const validDto = {
        business_id: 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
        name: 'Full Service',
        description: 'Complete service',
        price: 150000,
        duration_minutes: 45,
        daily_quota: 8,
      };

      const dto = plainToClass(CreateServiceDto, validDto);
      const errors = await validate(dto);

      expect(errors).toHaveLength(0);
      expect(dto.business_id).toBe(validDto.business_id);
    });

    it('should validate business_id format', async () => {
      const invalidBusinessIds = [
        'not-a-uuid',
        '123-456-789',
        '',
        null,
        undefined,
      ];

      for (const business_id of invalidBusinessIds) {
        const dto = plainToClass(CreateServiceDto, {
          business_id,
          name: 'Test Service',
          price: 100000,
        });

        const errors = await validate(dto);
        const businessIdError = errors.find(
          (e) => e.property === 'business_id',
        );

        expect(businessIdError).toBeDefined();
      }
    });

    it('should inherit ServicePayloadDto validations', async () => {
      const invalidDto = {
        business_id: 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
        name: '', // Empty name should fail
        price: -100, // Negative price should fail
      };

      const dto = plainToClass(CreateServiceDto, invalidDto);
      const errors = await validate(dto);

      expect(errors.length).toBeGreaterThan(0);

      const nameError = errors.find((e) => e.property === 'name');
      const priceError = errors.find((e) => e.property === 'price');

      expect(nameError).toBeDefined();
      expect(priceError).toBeDefined();
    });
  });

  describe('BatchCreateServicesDto', () => {
    const validServicePayload = {
      name: 'Batch Service',
      price: 100000,
      duration_minutes: 30,
    };

    it('should validate valid batch DTO', async () => {
      const validBatchDto = {
        business_id: 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
        services: [
          validServicePayload,
          { ...validServicePayload, name: 'Another Service' },
        ],
      };

      const dto = plainToClass(BatchCreateServicesDto, validBatchDto);
      const errors = await validate(dto);

      expect(errors).toHaveLength(0);
      expect(dto.services).toHaveLength(2);
    });

    it('should validate business_id requirement', async () => {
      const invalidDto = {
        services: [validServicePayload],
      };

      const dto = plainToClass(BatchCreateServicesDto, invalidDto);
      const errors = await validate(dto);

      const businessIdError = errors.find((e) => e.property === 'business_id');
      expect(businessIdError).toBeDefined();
    });

    it('should validate services array', async () => {
      const invalidServicesDto = {
        business_id: 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
        services: 'not-an-array',
      };

      const dto = plainToClass(BatchCreateServicesDto, invalidServicesDto);
      const errors = await validate(dto);

      const servicesError = errors.find((e) => e.property === 'services');
      expect(servicesError).toBeDefined();
    });

    it('should validate maximum array size', async () => {
      const tooManyServices = {
        business_id: 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
        services: Array(21)
          .fill(validServicePayload)
          .map((service, index) => ({
            ...service,
            name: `Service ${index + 1}`,
          })),
      };

      const dto = plainToClass(BatchCreateServicesDto, tooManyServices);
      const errors = await validate(dto);

      const servicesError = errors.find((e) => e.property === 'services');
      expect(servicesError).toBeDefined();
      expect(servicesError?.constraints?.arrayMaxSize).toBeDefined();
    });

    it('should validate individual service items in batch', async () => {
      const invalidBatchDto = {
        business_id: 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
        services: [
          validServicePayload,
          {
            name: '', // Invalid name
            price: -1, // Invalid price
          },
        ],
      };

      const dto = plainToClass(BatchCreateServicesDto, invalidBatchDto);
      const errors = await validate(dto);

      // Should have nested validation errors for the invalid service
      const nestedErrors = errors.filter(
        (e) => e.property === 'services' && e.children && e.children.length > 0,
      );

      expect(nestedErrors.length).toBeGreaterThan(0);
    });

    it('should handle empty services array', async () => {
      const emptyBatchDto = {
        business_id: 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
        services: [],
      };

      const dto = plainToClass(BatchCreateServicesDto, emptyBatchDto);
      const errors = await validate(dto);

      expect(errors).toHaveLength(0);
      expect(dto.services).toHaveLength(0);
    });

    it('should validate exactly 20 services (boundary test)', async () => {
      const exactLimitDto = {
        business_id: 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
        services: Array(20)
          .fill(validServicePayload)
          .map((service, index) => ({
            ...service,
            name: `Service ${index + 1}`,
          })),
      };

      const dto = plainToClass(BatchCreateServicesDto, exactLimitDto);
      const errors = await validate(dto);

      expect(errors).toHaveLength(0);
      expect(dto.services).toHaveLength(20);
    });
  });

  describe('edge cases and transformations', () => {
    it('should handle string numbers in price field', async () => {
      const payloadWithStringPrice = {
        name: 'Test Service',
        price: '150000', // String number
      };

      const dto = plainToClass(ServicePayloadDto, payloadWithStringPrice);
      const errors = await validate(dto);

      expect(errors).toHaveLength(0);
      expect(dto.price).toBe(150000);
      expect(typeof dto.price).toBe('number');
    });

    it('should handle string numbers in duration and quota', async () => {
      const payload = {
        name: 'Test Service',
        price: 100000,
        duration_minutes: '30',
        daily_quota: '10',
      };

      const dto = plainToClass(ServicePayloadDto, payload);
      const errors = await validate(dto);

      expect(errors).toHaveLength(0);
      expect(dto.duration_minutes).toBe(30);
      expect(dto.daily_quota).toBe(10);
    });

    it('should handle maximum integer values', async () => {
      const maxValuePayload = {
        name: 'Max Value Service',
        price: 2147483647, // Max 32-bit signed integer
        duration_minutes: 2147483647,
        daily_quota: 2147483647,
      };

      const dto = plainToClass(ServicePayloadDto, maxValuePayload);
      const errors = await validate(dto);

      expect(errors).toHaveLength(0);
    });

    it('should handle description length limit', async () => {
      const longDescPayload = {
        name: 'Test Service',
        price: 100000,
        description: 'a'.repeat(1001), // Too long
      };

      const dto = plainToClass(ServicePayloadDto, longDescPayload);
      const errors = await validate(dto);

      const descError = errors.find((e) => e.property === 'description');
      expect(descError).toBeDefined();
    });
  });
});
