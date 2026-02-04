import { Test, TestingModule } from '@nestjs/testing';
import { UnauthorizedException, BadRequestException } from '@nestjs/common';
import { BusinessService } from '../business.service';
import { DatabaseService } from '../../../database/database.service';
import { FileService } from '../../../domains/files/file.service';
import { BusinessRepository } from '../repository/business.repository';
import { I18nService } from 'nestjs-i18n';
import { CreateBusinessDto } from '../dto/create-business.dto';

describe('BusinessService', () => {
  let service: BusinessService;
  let mockRepository: Partial<BusinessRepository>;
  let mockDatabaseService: Partial<DatabaseService>;
  let mockI18nService: Partial<I18nService>;
  let mockFileService: Partial<FileService>;
  let mockKnex: any;
  let mockTransaction: any;

  const ownerId = 'user-uuid-123';
  const publicId = '11111111-1111-4111-8111-111111111111'; // JWT sub (public_id UUID)
  const businessId = 'business-uuid-789';

  const mockCreateDto: CreateBusinessDto = {
    name: 'Bengkel Jaya',
    tagline: 'Service terpercaya',
    phone: '+6281234567890',
    address: 'Jl. Sudirman No. 1',
    latitude: -6.2,
    longitude: 106.8,
    business_hours: [
      { day_of_week: 1, open_time: '09:00', close_time: '17:00' },
      { day_of_week: 2, open_time: '09:00', close_time: '17:00' },
    ],
  };

  const mockFile = {
    fieldname: 'image',
    originalname: 'test.jpg',
    mimetype: 'image/jpeg',
    size: 1024,
    buffer: Buffer.from('test'),
  } as Express.Multer.File;

  beforeEach(async () => {
    const trxClient = {
      commit: jest.fn().mockResolvedValue(undefined),
      rollback: jest.fn().mockResolvedValue(undefined),
    };
    mockTransaction = trxClient;

    mockKnex = {
      transaction: jest.fn().mockResolvedValue(trxClient),
    };

    mockDatabaseService = {
      getKnex: () => mockKnex,
    };

    mockRepository = {
      findUserIdByPublicId: jest.fn().mockResolvedValue(ownerId),
      findUserPublicIdById: jest.fn().mockResolvedValue(publicId),
      insertBusiness: jest.fn().mockResolvedValue(undefined),
      insertBusinessHours: jest.fn().mockResolvedValue(undefined),
      findBusinessWithHoursById: jest.fn().mockResolvedValue(null),
    };

    mockI18nService = {
      t: jest
        .fn()
        .mockImplementation(
          (
            key: string,
            opts?: { lang?: string; args?: Record<string, unknown> },
          ) => key,
        ),
    };

    mockFileService = {
      createWithFile: jest.fn().mockResolvedValue({
        file_path: '/var/www/files/images/2025/01/test.jpg',
      }),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        BusinessService,
        { provide: BusinessRepository, useValue: mockRepository },
        { provide: DatabaseService, useValue: mockDatabaseService },
        { provide: I18nService, useValue: mockI18nService },
        { provide: FileService, useValue: mockFileService },
      ],
    }).compile();

    service = module.get<BusinessService>(BusinessService);
  });

  describe('resolveOwnerIdFromSub', () => {
    it('should return owner id when sub is valid', async () => {
      const result = await service.resolveOwnerIdFromSub(publicId);
      expect(result).toBe(ownerId);
      expect(mockRepository.findUserIdByPublicId).toHaveBeenCalledWith(publicId);
    });

    it('should throw UnauthorizedException when sub is empty', async () => {
      await expect(service.resolveOwnerIdFromSub('')).rejects.toThrow(
        UnauthorizedException,
      );
      await expect(service.resolveOwnerIdFromSub('   ')).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it('should throw UnauthorizedException when user not found', async () => {
      (mockRepository.findUserIdByPublicId as jest.Mock).mockResolvedValueOnce(
        null,
      );
      await expect(
        service.resolveOwnerIdFromSub('unknown-public-id'),
      ).rejects.toThrow(UnauthorizedException);
    });
  });

  describe('create - success scenarios', () => {
    it('should create business with required fields only', async () => {
      const dto: CreateBusinessDto = { name: 'My Workshop' };
      const result = await service.create(dto, ownerId, publicId, {});
      expect(result.business).toBeDefined();
      expect(result.business.name).toBe('My Workshop');
      expect(result.business.status).toBe('pending');
      expect(result.business.owner_id).toBe(ownerId);
      expect(result.business_hours).toEqual([]);
    });

    it('should create business with full optional fields', async () => {
      const result = await service.create(mockCreateDto, ownerId, publicId, {});
      expect(result.business.name).toBe(mockCreateDto.name);
      expect(result.business.tagline).toBe(mockCreateDto.tagline);
      expect(result.business.phone).toBe(mockCreateDto.phone);
      expect(result.business.address).toBe(mockCreateDto.address);
      expect(result.business.latitude).toBe(String(mockCreateDto.latitude));
      expect(result.business.longitude).toBe(String(mockCreateDto.longitude));
      expect(result.business_hours).toHaveLength(2);
    });

    it('should create business with business_hours only', async () => {
      const dto: CreateBusinessDto = {
        name: 'Workshop A',
        business_hours: [
          { day_of_week: 0, open_time: '08:00', close_time: '16:00' },
        ],
      };
      const result = await service.create(dto, ownerId, publicId, {});
      expect(result.business_hours).toHaveLength(1);
      expect(result.business_hours[0].day_of_week).toBe(0);
      expect(result.business_hours[0].open_time).toBe('08:00');
      expect(result.business_hours[0].close_time).toBe('16:00');
    });

    it('should create business with image upload', async () => {
      const dto: CreateBusinessDto = { name: 'With Image' };
      const result = await service.create(dto, ownerId, publicId, {
        image: mockFile,
      });
      expect(result.business.image).toBeDefined();
      expect(typeof result.business.image).toBe('string');
    });

    it('should create business with cover_image upload', async () => {
      const dto: CreateBusinessDto = { name: 'With Cover' };
      const cover = {
        ...mockFile,
        fieldname: 'cover_image',
      } as Express.Multer.File;
      const result = await service.create(dto, ownerId, publicId, {
        cover_image: cover,
      });
      expect(result.business.cover_image).toBeDefined();
    });

    it('should create business with both images', async () => {
      const dto: CreateBusinessDto = { name: 'Both Images' };
      const cover = {
        ...mockFile,
        fieldname: 'cover_image',
      } as Express.Multer.File;
      const result = await service.create(dto, ownerId, publicId, {
        image: mockFile,
        cover_image: cover,
      });
      expect(result.business.image).toBeDefined();
      expect(result.business.cover_image).toBeDefined();
    });

    it('should set id_creator from JWT sub (public_id UUID)', async () => {
      const dto: CreateBusinessDto = { name: 'Audit Test' };
      const result = await service.create(dto, ownerId, publicId, {});
      expect(result.business.id_creator).toBe(publicId);
    });

    it('should support multiple businesses per owner (same ownerId)', async () => {
      const dto1: CreateBusinessDto = { name: 'First' };
      const dto2: CreateBusinessDto = { name: 'Second' };
      const r1 = await service.create(dto1, ownerId, publicId, {});
      const r2 = await service.create(dto2, ownerId, publicId, {});
      expect(r1.business.id).toBeDefined();
      expect(r2.business.id).toBeDefined();
      expect(r1.business.id).not.toBe(r2.business.id);
    });
  });

  describe('create - business hours validation', () => {
    it('should throw when day_of_week is out of range (negative)', async () => {
      const dto: CreateBusinessDto = {
        name: 'X',
        business_hours: [
          { day_of_week: -1, open_time: '09:00', close_time: '17:00' },
        ],
      };
      await expect(
        service.create(dto, ownerId, publicId, { lang: 'en' }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw when day_of_week is out of range (>6)', async () => {
      const dto: CreateBusinessDto = {
        name: 'X',
        business_hours: [
          { day_of_week: 7, open_time: '09:00', close_time: '17:00' },
        ],
      };
      await expect(
        service.create(dto, ownerId, publicId, { lang: 'en' }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw when duplicate day_of_week', async () => {
      const dto: CreateBusinessDto = {
        name: 'X',
        business_hours: [
          { day_of_week: 1, open_time: '09:00', close_time: '17:00' },
          { day_of_week: 1, open_time: '10:00', close_time: '18:00' },
        ],
      };
      await expect(service.create(dto, ownerId, publicId, {})).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should throw when close_time is equal to open_time', async () => {
      const dto: CreateBusinessDto = {
        name: 'X',
        business_hours: [
          { day_of_week: 1, open_time: '09:00', close_time: '09:00' },
        ],
      };
      await expect(service.create(dto, ownerId, publicId, {})).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should throw when close_time is before open_time', async () => {
      const dto: CreateBusinessDto = {
        name: 'X',
        business_hours: [
          { day_of_week: 1, open_time: '17:00', close_time: '09:00' },
        ],
      };
      await expect(service.create(dto, ownerId, publicId, {})).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should throw when open_time format is invalid', async () => {
      const dto: CreateBusinessDto = {
        name: 'X',
        business_hours: [
          { day_of_week: 1, open_time: '25:00', close_time: '17:00' },
        ],
      };
      await expect(service.create(dto, ownerId, publicId, {})).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should throw when close_time format is invalid', async () => {
      const dto: CreateBusinessDto = {
        name: 'X',
        business_hours: [
          { day_of_week: 1, open_time: '09:00', close_time: '9:60' },
        ],
      };
      await expect(service.create(dto, ownerId, publicId, {})).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should accept valid boundary day 0 and 6', async () => {
      const dto: CreateBusinessDto = {
        name: 'Boundary',
        business_hours: [
          { day_of_week: 0, open_time: '00:00', close_time: '23:59' },
          { day_of_week: 6, open_time: '08:00', close_time: '20:00' },
        ],
      };
      const result = await service.create(dto, ownerId, publicId, {});
      expect(result.business_hours).toHaveLength(2);
    });

    it('should accept all days 0-6 without duplicate', async () => {
      const dto: CreateBusinessDto = {
        name: 'Full Week',
        business_hours: [0, 1, 2, 3, 4, 5, 6].map((day_of_week) => ({
          day_of_week,
          open_time: '09:00',
          close_time: '17:00',
        })),
      };
      const result = await service.create(dto, ownerId, publicId, {});
      expect(result.business_hours).toHaveLength(7);
    });
  });

  describe('create - file validation', () => {
    it('should throw when image file size exceeds limit', async () => {
      const largeFile = {
        ...mockFile,
        size: 11 * 1024 * 1024,
      } as Express.Multer.File;
      (mockFileService.createWithFile as jest.Mock).mockRejectedValueOnce(
        new BadRequestException('files.file.size_too_large'),
      );
      const dto: CreateBusinessDto = { name: 'X' };
      await expect(
        service.create(dto, ownerId, publicId, { image: largeFile }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw when image file type is invalid', async () => {
      const pdfFile = {
        ...mockFile,
        mimetype: 'application/pdf',
      } as Express.Multer.File;
      (mockFileService.createWithFile as jest.Mock).mockRejectedValueOnce(
        new BadRequestException('files.file.invalid_type'),
      );
      const dto: CreateBusinessDto = { name: 'X' };
      await expect(
        service.create(dto, ownerId, publicId, { image: pdfFile }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should accept image/jpeg', async () => {
      const dto: CreateBusinessDto = { name: 'Jpeg' };
      const result = await service.create(dto, ownerId, publicId, {
        image: mockFile,
      });
      expect(result.business.image).toBeDefined();
    });

    it('should accept image/png', async () => {
      const png = { ...mockFile, mimetype: 'image/png' } as Express.Multer.File;
      const dto: CreateBusinessDto = { name: 'Png' };
      const result = await service.create(dto, ownerId, publicId, {
        image: png,
      });
      expect(result.business.image).toBeDefined();
    });

    it('should accept image/webp', async () => {
      const webp = {
        ...mockFile,
        mimetype: 'image/webp',
      } as Express.Multer.File;
      const dto: CreateBusinessDto = { name: 'Webp' };
      const result = await service.create(dto, ownerId, publicId, {
        image: webp,
      });
      expect(result.business.image).toBeDefined();
    });

    it('should accept image/gif', async () => {
      const gif = { ...mockFile, mimetype: 'image/gif' } as Express.Multer.File;
      const dto: CreateBusinessDto = { name: 'Gif' };
      const result = await service.create(dto, ownerId, publicId, {
        image: gif,
      });
      expect(result.business.image).toBeDefined();
    });
  });

  describe('create - coordinates and edge cases', () => {
    it('should accept valid latitude/longitude', async () => {
      const dto: CreateBusinessDto = {
        name: 'Coords',
        latitude: -90,
        longitude: 180,
      };
      const result = await service.create(dto, ownerId, publicId, {});
      expect(result.business.latitude).toBe('-90');
      expect(result.business.longitude).toBe('180');
    });

    it('should trim name and optional strings', async () => {
      const dto: CreateBusinessDto = {
        name: '  Trimmed  ',
        tagline: '  Tag  ',
      };
      const result = await service.create(dto, ownerId, publicId, {});
      expect(result.business.name).toBe('Trimmed');
      expect(result.business.tagline).toBe('Tag');
    });

    it('should handle empty optional business_hours', async () => {
      const dto: CreateBusinessDto = { name: 'No Hours', business_hours: [] };
      const result = await service.create(dto, ownerId, publicId, {});
      expect(result.business_hours).toEqual([]);
    });
  });

  describe('create - transaction rollback', () => {
    it('should rollback transaction when hours insert fails', async () => {
      const trx = {
        commit: jest.fn().mockResolvedValue(undefined),
        rollback: jest.fn().mockResolvedValue(undefined),
      };
      (mockKnex.transaction as jest.Mock).mockResolvedValueOnce(trx);
      (mockRepository.insertBusinessHours as jest.Mock).mockRejectedValueOnce(
        new Error('hours insert fail'),
      );

      const dto: CreateBusinessDto = {
        name: 'Rollback Test',
        business_hours: [
          { day_of_week: 1, open_time: '09:00', close_time: '17:00' },
        ],
      };
      await expect(service.create(dto, ownerId, publicId, {})).rejects.toThrow(
        'hours insert fail',
      );
      expect(trx.rollback).toHaveBeenCalled();
      expect(trx.commit).not.toHaveBeenCalled();
    });
  });

  describe('findById (LEFT JOIN via repository)', () => {
    it('should return business with hours when found', async () => {
      const now = new Date();
      (mockRepository.findBusinessWithHoursById as jest.Mock).mockResolvedValueOnce(
        {
          business: {
            id: businessId,
            owner_id: ownerId,
            name: 'Found',
            tagline: null,
            status: 'pending',
            phone: null,
            image: null,
            cover_image: null,
            latitude: null,
            longitude: null,
            address: null,
            created_at: now,
            updated_at: now,
            deleted_at: null,
            id_creator: null,
            id_updater: null,
          },
          business_hours: [
            {
              id: 'h1',
              business_id: businessId,
              day_of_week: 1,
              open_time: '09:00',
              close_time: '17:00',
              created_at: now,
              updated_at: now,
              deleted_at: null,
              id_creator: null,
              id_updater: null,
            },
          ],
        },
      );

      const result = await service.findById(businessId);
      expect(result).not.toBeNull();
      expect(mockRepository.findBusinessWithHoursById).toHaveBeenCalledWith(
        businessId,
      );
      expect(result!.business.id).toBe(businessId);
      expect(result!.business_hours).toHaveLength(1);
    });

    it('should return null when business not found', async () => {
      (mockRepository.findBusinessWithHoursById as jest.Mock).mockResolvedValueOnce(
        null,
      );
      const result = await service.findById('non-existent');
      expect(result).toBeNull();
    });
  });
});
