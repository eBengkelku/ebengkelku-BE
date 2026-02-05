import { ServiceModel } from '../models/service.model';
import { DomainValidationException } from '../../../common/domain';
// import { ServiceErrorCodes } from '../constants';

describe('ServiceModel', () => {
  const validServiceData = {
    id: 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
    business_id: 'b47ac10b-58cc-4372-a567-0e02b2c3d479',
    name: 'Oil Change Service',
    description: 'Complete oil change with filter replacement',
    price: 150000,
    duration_minutes: 30,
    daily_quota: 10,
    id_creator: 'u47ac10b-58cc-4372-a567-0e02b2c3d479',
    created_at: new Date(),
  };

  describe('create()', () => {
    it('should create a valid service', () => {
      const service = ServiceModel.create(validServiceData);

      expect(service.getId()).toBe(validServiceData.id);
      expect(service.getBusinessId()).toBe(validServiceData.business_id);
      expect(service.getName()).toBe(validServiceData.name);
      expect(service.getDescription()).toBe(validServiceData.description);
      expect(service.getPrice()).toBe(validServiceData.price);
      expect(service.getDurationMinutes()).toBe(
        validServiceData.duration_minutes,
      );
      expect(service.getDailyQuota()).toBe(validServiceData.daily_quota);
    });

    it('should trim name whitespace', () => {
      const service = ServiceModel.create({
        ...validServiceData,
        name: '  Trimmed Name  ',
      });
      expect(service.getName()).toBe('Trimmed Name');
    });

    it('should throw when name is empty', () => {
      expect(() =>
        ServiceModel.create({ ...validServiceData, name: '' }),
      ).toThrow(DomainValidationException);
    });

    it('should throw when name is too long', () => {
      expect(() =>
        ServiceModel.create({ ...validServiceData, name: 'a'.repeat(256) }),
      ).toThrow(DomainValidationException);
    });

    it('should throw when price is negative', () => {
      expect(() =>
        ServiceModel.create({ ...validServiceData, price: -1 }),
      ).toThrow(DomainValidationException);
    });

    it('should throw when price is not an integer', () => {
      expect(() =>
        ServiceModel.create({ ...validServiceData, price: 150.5 }),
      ).toThrow(DomainValidationException);
    });

    it('should allow zero price (free service)', () => {
      const service = ServiceModel.create({ ...validServiceData, price: 0 });
      expect(service.getPrice()).toBe(0);
      expect(service.isFreeService()).toBe(true);
    });

    it('should allow null duration_minutes', () => {
      const service = ServiceModel.create({
        ...validServiceData,
        duration_minutes: null,
      });
      expect(service.getDurationMinutes()).toBeNull();
      expect(service.hasTimeLimit()).toBe(false);
    });

    it('should allow null daily_quota', () => {
      const service = ServiceModel.create({
        ...validServiceData,
        daily_quota: null,
      });
      expect(service.getDailyQuota()).toBeNull();
      expect(service.hasQuotaLimit()).toBe(false);
    });
  });

  describe('reconstitute()', () => {
    it('should reconstitute from database entity', () => {
      const entity = {
        ...validServiceData,
        updated_at: new Date(),
        deleted_at: null,
      };

      const service = ServiceModel.reconstitute(entity);

      expect(service.getId()).toBe(entity.id);
      expect(service.getName()).toBe(entity.name);
      expect(service.getUpdatedAt()).toEqual(entity.updated_at);
    });
  });

  describe('toEntity()', () => {
    it('should convert to database entity format', () => {
      const service = ServiceModel.create(validServiceData);
      const entity = service.toEntity();

      expect(entity.id).toBe(validServiceData.id);
      expect(entity.business_id).toBe(validServiceData.business_id);
      expect(entity.name).toBe(validServiceData.name);
      expect(entity.price).toBe(validServiceData.price);
    });
  });

  describe('query methods', () => {
    it('isFreeService() returns true for price 0', () => {
      const service = ServiceModel.create({ ...validServiceData, price: 0 });
      expect(service.isFreeService()).toBe(true);
    });

    it('isFreeService() returns false for non-zero price', () => {
      const service = ServiceModel.create(validServiceData);
      expect(service.isFreeService()).toBe(false);
    });

    it('hasTimeLimit() returns true when duration is set', () => {
      const service = ServiceModel.create(validServiceData);
      expect(service.hasTimeLimit()).toBe(true);
    });

    it('hasQuotaLimit() returns true when quota is set', () => {
      const service = ServiceModel.create(validServiceData);
      expect(service.hasQuotaLimit()).toBe(true);
    });
  });
});
