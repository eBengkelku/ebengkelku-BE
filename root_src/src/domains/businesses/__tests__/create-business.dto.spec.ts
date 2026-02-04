import { validate } from 'class-validator';
import { plainToInstance } from 'class-transformer';
import { CreateBusinessDto } from '../dto/create-business.dto';
import { BusinessHoursItemDto } from '../dto/business-hours-item.dto';

describe('CreateBusinessDto', () => {
  describe('name', () => {
    it('should fail when name is missing', async () => {
      const dto = plainToInstance(CreateBusinessDto, {});
      const errors = await validate(dto);
      expect(errors.some((e) => e.property === 'name')).toBe(true);
    });

    it('should fail when name is empty string', async () => {
      const dto = plainToInstance(CreateBusinessDto, { name: '' });
      const errors = await validate(dto);
      expect(errors.some((e) => e.property === 'name')).toBe(true);
    });

    it('should pass when name is provided', async () => {
      const dto = plainToInstance(CreateBusinessDto, { name: 'My Workshop' });
      const errors = await validate(dto);
      expect(errors.filter((e) => e.property === 'name')).toHaveLength(0);
    });
  });

  describe('optional fields', () => {
    it('should pass with only name', async () => {
      const dto = plainToInstance(CreateBusinessDto, { name: 'Only Name' });
      const errors = await validate(dto);
      expect(errors).toHaveLength(0);
    });

    it('should pass with tagline, phone, address', async () => {
      const dto = plainToInstance(CreateBusinessDto, {
        name: 'Full',
        tagline: 'Tag',
        phone: '+62',
        address: 'Address',
      });
      const errors = await validate(dto);
      expect(errors).toHaveLength(0);
    });

    it('should fail when latitude is out of range', async () => {
      const dto = plainToInstance(CreateBusinessDto, {
        name: 'X',
        latitude: 100,
      });
      const errors = await validate(dto);
      expect(errors.some((e) => e.property === 'latitude')).toBe(true);
    });

    it('should fail when longitude is out of range', async () => {
      const dto = plainToInstance(CreateBusinessDto, {
        name: 'X',
        longitude: -200,
      });
      const errors = await validate(dto);
      expect(errors.some((e) => e.property === 'longitude')).toBe(true);
    });

    it('should pass when latitude/longitude in range', async () => {
      const dto = plainToInstance(CreateBusinessDto, {
        name: 'X',
        latitude: -6.2,
        longitude: 106.8,
      });
      const errors = await validate(dto);
      expect(
        errors.filter(
          (e) => e.property === 'latitude' || e.property === 'longitude',
        ),
      ).toHaveLength(0);
    });
  });

  describe('business_hours', () => {
    it('should pass with valid business_hours array', async () => {
      const dto = plainToInstance(CreateBusinessDto, {
        name: 'X',
        business_hours: [
          { day_of_week: 0, open_time: '09:00', close_time: '17:00' },
          { day_of_week: 1, open_time: '08:00', close_time: '16:00' },
        ],
      });
      const errors = await validate(dto);
      expect(errors).toHaveLength(0);
    });

    it('should fail when day_of_week is invalid', async () => {
      const dto = plainToInstance(CreateBusinessDto, {
        name: 'X',
        business_hours: [
          { day_of_week: 7, open_time: '09:00', close_time: '17:00' },
        ],
      });
      const errors = await validate(dto);
      expect(errors.length).toBeGreaterThan(0);
    });

    it('should fail when open_time format is invalid', async () => {
      const dto = plainToInstance(CreateBusinessDto, {
        name: 'X',
        business_hours: [
          { day_of_week: 1, open_time: '25:00', close_time: '17:00' },
        ],
      });
      const errors = await validate(dto);
      expect(errors.length).toBeGreaterThan(0);
    });
  });
});

describe('BusinessHoursItemDto', () => {
  it('should pass valid HH:MM and day 0-6', async () => {
    const dto = plainToInstance(BusinessHoursItemDto, {
      day_of_week: 1,
      open_time: '09:00',
      close_time: '17:00',
    });
    const errors = await validate(dto);
    expect(errors).toHaveLength(0);
  });

  it('should pass day 0 (Sunday) and day 6 (Saturday)', async () => {
    for (const day of [0, 6]) {
      const dto = plainToInstance(BusinessHoursItemDto, {
        day_of_week: day,
        open_time: '08:00',
        close_time: '16:00',
      });
      const errors = await validate(dto);
      expect(errors).toHaveLength(0);
    }
  });

  it('should fail when day_of_week is 7', async () => {
    const dto = plainToInstance(BusinessHoursItemDto, {
      day_of_week: 7,
      open_time: '09:00',
      close_time: '17:00',
    });
    const errors = await validate(dto);
    expect(errors.some((e) => e.property === 'day_of_week')).toBe(true);
  });

  it('should fail when day_of_week is -1', async () => {
    const dto = plainToInstance(BusinessHoursItemDto, {
      day_of_week: -1,
      open_time: '09:00',
      close_time: '17:00',
    });
    const errors = await validate(dto);
    expect(errors.some((e) => e.property === 'day_of_week')).toBe(true);
  });

  it('should fail when open_time is not HH:MM', async () => {
    const dto = plainToInstance(BusinessHoursItemDto, {
      day_of_week: 1,
      open_time: '9:0',
      close_time: '17:00',
    });
    const errors = await validate(dto);
    expect(errors.some((e) => e.property === 'open_time')).toBe(true);
  });

  it('should fail when close_time is invalid format', async () => {
    const dto = plainToInstance(BusinessHoursItemDto, {
      day_of_week: 1,
      open_time: '09:00',
      close_time: '24:00',
    });
    const errors = await validate(dto);
    expect(errors.some((e) => e.property === 'close_time')).toBe(true);
  });
});
