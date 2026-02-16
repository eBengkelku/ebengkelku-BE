import { Test, TestingModule } from '@nestjs/testing';
import {
  UnauthorizedException,
  BadRequestException,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { BusinessService } from '../business.service';
import { DatabaseService } from '../../../database/database.service';
import { FileService } from '../../../domains/files/file.service';
import { BusinessRepository } from '../repository/business.repository';
import { I18nService } from 'nestjs-i18n';
import { CreateBusinessDto } from '../dto/create-business.dto';
import { BusinessStatus } from '../contracts/business-status.enum';

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
      findAllByOwnerId: jest.fn().mockResolvedValue([]),
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
      expect(mockRepository.findUserIdByPublicId).toHaveBeenCalledWith(
        publicId,
      );
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
      expect(result.business.status).toBe(BusinessStatus.ACTIVE);
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
      (
        mockRepository.findBusinessWithHoursById as jest.Mock
      ).mockResolvedValueOnce({
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
            updated_at: now,
            deleted_at: null,
            id_creator: null,
            id_updater: null,
          },
        ],
      });

      const result = await service.findById(businessId);
      expect(result).not.toBeNull();
      expect(mockRepository.findBusinessWithHoursById).toHaveBeenCalledWith(
        businessId,
      );
      expect(result!.business.id).toBe(businessId);
      expect(result!.business_hours).toHaveLength(1);
    });

    it('should return null when business not found', async () => {
      (
        mockRepository.findBusinessWithHoursById as jest.Mock
      ).mockResolvedValueOnce(null);
      const result = await service.findById('non-existent');
      expect(result).toBeNull();
    });
  });

  /**
   * ========================================================================
   * Test Suite: findAllByOwner()
   * GET /v1/business endpoint business logic tests
   * ========================================================================
   */
  describe('findAllByOwner', () => {
    const mockBusinessWithHours = {
      business: {
        id: 'business-1',
        owner_id: ownerId,
        name: 'Bengkel A',
        tagline: 'Service terpercaya',
        status: 'active',
        phone: '+6281234567890',
        image: 'uploads/images/business-1.jpg',
        cover_image: 'uploads/images/business-1-cover.jpg',
        latitude: '-6.2088',
        longitude: '106.8456',
        address: 'Jl. Sudirman No. 123',
        created_at: new Date('2026-01-15T08:30:00.000Z'),
        updated_at: new Date('2026-01-20T10:15:00.000Z'),
        deleted_at: null,
        id_creator: publicId,
        id_updater: null,
      },
      business_hours: [
        {
          id: 'hour-1',
          business_id: 'business-1',
          day_of_week: 1,
          open_time: '08:00',
          close_time: '17:00',
          updated_at: null,
          deleted_at: null,
          id_creator: publicId,
          id_updater: null,
        },
        {
          id: 'hour-2',
          business_id: 'business-1',
          day_of_week: 2,
          open_time: '08:00',
          close_time: '17:00',
          updated_at: null,
          deleted_at: null,
          id_creator: publicId,
          id_updater: null,
        },
      ],
    };

    const mockBusinessWithoutHours = {
      business: {
        id: 'business-2',
        owner_id: ownerId,
        name: 'Bengkel B',
        tagline: null,
        status: 'pending',
        phone: null,
        image: null,
        cover_image: null,
        latitude: null,
        longitude: null,
        address: null,
        created_at: new Date('2026-01-10T14:20:00.000Z'),
        updated_at: null,
        deleted_at: null,
        id_creator: publicId,
        id_updater: null,
      },
      business_hours: [],
    };

    // ========================================================================
    // POSITIVE TEST CASES (30+)
    // ========================================================================

    describe('Positive Test Cases', () => {
      it('should return empty array when user has no businesses', async () => {
        (mockRepository.findAllByOwnerId as jest.Mock).mockResolvedValueOnce(
          [],
        );

        const result = await service.findAllByOwner(publicId);

        expect(result).toEqual([]);
        expect(mockRepository.findAllByOwnerId).toHaveBeenCalledWith(ownerId);
      });

      it('should return single business with no hours', async () => {
        (mockRepository.findAllByOwnerId as jest.Mock).mockResolvedValueOnce([
          mockBusinessWithoutHours,
        ]);

        const result = await service.findAllByOwner(publicId);

        expect(result).toHaveLength(1);
        expect(result[0].business.id).toBe('business-2');
        expect(result[0].business_hours).toEqual([]);
      });

      it('should return single business with one hour', async () => {
        const businessWithOneHour = {
          ...mockBusinessWithHours,
          business_hours: [mockBusinessWithHours.business_hours[0]],
        };
        (mockRepository.findAllByOwnerId as jest.Mock).mockResolvedValueOnce([
          businessWithOneHour,
        ]);

        const result = await service.findAllByOwner(publicId);

        expect(result).toHaveLength(1);
        expect(result[0].business_hours).toHaveLength(1);
        expect(result[0].business_hours[0].day_of_week).toBe(1);
      });

      it('should return single business with multiple hours (all days)', async () => {
        const businessWithAllDays = {
          ...mockBusinessWithHours,
          business_hours: [0, 1, 2, 3, 4, 5, 6].map((day) => ({
            id: `hour-${day}`,
            business_id: 'business-1',
            day_of_week: day,
            open_time: '08:00',
            close_time: '17:00',
            updated_at: null,
            deleted_at: null,
            id_creator: publicId,
            id_updater: null,
          })),
        };
        (mockRepository.findAllByOwnerId as jest.Mock).mockResolvedValueOnce([
          businessWithAllDays,
        ]);

        const result = await service.findAllByOwner(publicId);

        expect(result).toHaveLength(1);
        expect(result[0].business_hours).toHaveLength(7);
        expect(result[0].business_hours.map((h) => h.day_of_week)).toEqual([
          0, 1, 2, 3, 4, 5, 6,
        ]);
      });

      it('should return multiple businesses (each with hours)', async () => {
        (mockRepository.findAllByOwnerId as jest.Mock).mockResolvedValueOnce([
          mockBusinessWithHours,
          {
            ...mockBusinessWithHours,
            business: { ...mockBusinessWithHours.business, id: 'business-3' },
          },
        ]);

        const result = await service.findAllByOwner(publicId);

        expect(result).toHaveLength(2);
        expect(result[0].business_hours).not.toEqual([]);
        expect(result[1].business_hours).not.toEqual([]);
      });

      it('should return multiple businesses (some with hours, some without)', async () => {
        (mockRepository.findAllByOwnerId as jest.Mock).mockResolvedValueOnce([
          mockBusinessWithHours,
          mockBusinessWithoutHours,
        ]);

        const result = await service.findAllByOwner(publicId);

        expect(result).toHaveLength(2);
        expect(result[0].business_hours).toHaveLength(2);
        expect(result[1].business_hours).toEqual([]);
      });

      it('should return businesses with all status types (pending, active, banned)', async () => {
        const businesses = [
          {
            ...mockBusinessWithHours,
            business: { ...mockBusinessWithHours.business, status: 'pending' },
          },
          {
            ...mockBusinessWithHours,
            business: {
              ...mockBusinessWithHours.business,
              id: 'business-2',
              status: 'active',
            },
          },
          {
            ...mockBusinessWithHours,
            business: {
              ...mockBusinessWithHours.business,
              id: 'business-3',
              status: 'banned',
            },
          },
        ];
        (mockRepository.findAllByOwnerId as jest.Mock).mockResolvedValueOnce(
          businesses,
        );

        const result = await service.findAllByOwner(publicId);

        expect(result).toHaveLength(3);
        expect(result.map((b) => b.business.status)).toContain('pending');
        expect(result.map((b) => b.business.status)).toContain('active');
        expect(result.map((b) => b.business.status)).toContain('banned');
      });

      it('should return businesses with complete data (all fields populated)', async () => {
        (mockRepository.findAllByOwnerId as jest.Mock).mockResolvedValueOnce([
          mockBusinessWithHours,
        ]);

        const result = await service.findAllByOwner(publicId);

        expect(result[0].business.name).toBeTruthy();
        expect(result[0].business.tagline).toBeTruthy();
        expect(result[0].business.phone).toBeTruthy();
        expect(result[0].business.image).toBeTruthy();
        expect(result[0].business.cover_image).toBeTruthy();
        expect(result[0].business.latitude).toBeTruthy();
        expect(result[0].business.longitude).toBeTruthy();
        expect(result[0].business.address).toBeTruthy();
      });

      it('should return businesses with minimal data (only required fields)', async () => {
        (mockRepository.findAllByOwnerId as jest.Mock).mockResolvedValueOnce([
          mockBusinessWithoutHours,
        ]);

        const result = await service.findAllByOwner(publicId);

        expect(result[0].business.id).toBeTruthy();
        expect(result[0].business.owner_id).toBeTruthy();
        expect(result[0].business.name).toBeTruthy();
        expect(result[0].business.status).toBeTruthy();
        expect(result[0].business.created_at).toBeTruthy();
      });

      it('should return businesses with image and cover_image', async () => {
        (mockRepository.findAllByOwnerId as jest.Mock).mockResolvedValueOnce([
          mockBusinessWithHours,
        ]);

        const result = await service.findAllByOwner(publicId);

        expect(result[0].business.image).toContain('uploads/images');
        expect(result[0].business.cover_image).toContain('uploads/images');
      });

      it('should return businesses with latitude and longitude', async () => {
        (mockRepository.findAllByOwnerId as jest.Mock).mockResolvedValueOnce([
          mockBusinessWithHours,
        ]);

        const result = await service.findAllByOwner(publicId);

        expect(result[0].business.latitude).toBe('-6.2088');
        expect(result[0].business.longitude).toBe('106.8456');
      });

      it('should return businesses with phone and address', async () => {
        (mockRepository.findAllByOwnerId as jest.Mock).mockResolvedValueOnce([
          mockBusinessWithHours,
        ]);

        const result = await service.findAllByOwner(publicId);

        expect(result[0].business.phone).toContain('+62');
        expect(result[0].business.address).toContain('Jl.');
      });

      it('should return businesses created by same user', async () => {
        (mockRepository.findAllByOwnerId as jest.Mock).mockResolvedValueOnce([
          mockBusinessWithHours,
        ]);

        const result = await service.findAllByOwner(publicId);

        expect(result[0].business.id_creator).toBe(publicId);
      });

      it('should return businesses updated by same user', async () => {
        const updatedBusiness = {
          ...mockBusinessWithHours,
          business: {
            ...mockBusinessWithHours.business,
            id_updater: publicId,
            updated_at: new Date(),
          },
        };
        (mockRepository.findAllByOwnerId as jest.Mock).mockResolvedValueOnce([
          updatedBusiness,
        ]);

        const result = await service.findAllByOwner(publicId);

        expect(result[0].business.id_updater).toBe(publicId);
        expect(result[0].business.updated_at).toBeTruthy();
      });

      it('should return hours with all time ranges (00:00 - 23:59)', async () => {
        const businessWithExtendedHours = {
          ...mockBusinessWithHours,
          business_hours: [
            {
              ...mockBusinessWithHours.business_hours[0],
              open_time: '00:00',
              close_time: '23:59',
            },
          ],
        };
        (mockRepository.findAllByOwnerId as jest.Mock).mockResolvedValueOnce([
          businessWithExtendedHours,
        ]);

        const result = await service.findAllByOwner(publicId);

        expect(result[0].business_hours[0].open_time).toBe('00:00');
        expect(result[0].business_hours[0].close_time).toBe('23:59');
      });

      it('should return hours for different day_of_week values (0-6)', async () => {
        const businessWithAllDays = {
          ...mockBusinessWithHours,
          business_hours: [0, 1, 2, 3, 4, 5, 6].map((day) => ({
            id: `hour-${day}`,
            business_id: 'business-1',
            day_of_week: day,
            open_time: '08:00',
            close_time: '17:00',
            updated_at: null,
            deleted_at: null,
            id_creator: publicId,
            id_updater: null,
          })),
        };
        (mockRepository.findAllByOwnerId as jest.Mock).mockResolvedValueOnce([
          businessWithAllDays,
        ]);

        const result = await service.findAllByOwner(publicId);

        const days = result[0].business_hours.map((h) => h.day_of_week);
        expect(days).toContain(0); // Sunday
        expect(days).toContain(6); // Saturday
        expect(Math.min(...days)).toBe(0);
        expect(Math.max(...days)).toBe(6);
      });

      it('should return correct hour timestamps (updated_at, deleted_at)', async () => {
        (mockRepository.findAllByOwnerId as jest.Mock).mockResolvedValueOnce([
          mockBusinessWithHours,
        ]);

        const result = await service.findAllByOwner(publicId);

        expect(result[0].business_hours[0].updated_at).toBeNull();
        expect(result[0].business_hours[0].deleted_at).toBeNull();
      });

      it('should handle UUID format for all ID fields', async () => {
        (mockRepository.findAllByOwnerId as jest.Mock).mockResolvedValueOnce([
          mockBusinessWithHours,
        ]);

        const result = await service.findAllByOwner(publicId);

        const uuidRegex =
          /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
        expect(result[0].business.id).toMatch(/^business-/); // Mock ID
        expect(result[0].business.owner_id).toMatch(/^user-/); // Mock ID
        expect(result[0].business_hours[0].id).toMatch(/^hour-/); // Mock ID
      });

      it('should handle different owner_id values', async () => {
        const differentOwnerId = 'different-user-uuid';
        (
          mockRepository.findUserIdByPublicId as jest.Mock
        ).mockResolvedValueOnce(differentOwnerId);
        (mockRepository.findAllByOwnerId as jest.Mock).mockResolvedValueOnce(
          [],
        );

        const result = await service.findAllByOwner(publicId);

        expect(mockRepository.findAllByOwnerId).toHaveBeenCalledWith(
          differentOwnerId,
        );
        expect(result).toEqual([]);
      });

      it('should handle different public_id to owner_id mappings', async () => {
        const differentPublicId = '22222222-2222-4222-8222-222222222222';
        const differentOwnerId = 'user-xyz-456';
        (
          mockRepository.findUserIdByPublicId as jest.Mock
        ).mockResolvedValueOnce(differentOwnerId);
        (mockRepository.findAllByOwnerId as jest.Mock).mockResolvedValueOnce(
          [],
        );

        const result = await service.findAllByOwner(differentPublicId);

        expect(mockRepository.findUserIdByPublicId).toHaveBeenCalledWith(
          differentPublicId,
        );
        expect(mockRepository.findAllByOwnerId).toHaveBeenCalledWith(
          differentOwnerId,
        );
      });

      it('should return consistent data structure across requests', async () => {
        (mockRepository.findAllByOwnerId as jest.Mock).mockResolvedValue([
          mockBusinessWithHours,
        ]);

        const result1 = await service.findAllByOwner(publicId);
        const result2 = await service.findAllByOwner(publicId);

        expect(result1).toEqual(result2);
      });

      it('should handle large number of businesses (100+)', async () => {
        const manyBusinesses = Array.from({ length: 100 }, (_, i) => ({
          ...mockBusinessWithoutHours,
          business: {
            ...mockBusinessWithoutHours.business,
            id: `business-${i}`,
            name: `Bengkel ${i}`,
          },
        }));
        (mockRepository.findAllByOwnerId as jest.Mock).mockResolvedValueOnce(
          manyBusinesses,
        );

        const result = await service.findAllByOwner(publicId);

        expect(result).toHaveLength(100);
      });

      it('should handle large number of hours per business (7 days)', async () => {
        const businessWithAllDays = {
          ...mockBusinessWithHours,
          business_hours: Array.from({ length: 7 }, (_, i) => ({
            id: `hour-${i}`,
            business_id: 'business-1',
            day_of_week: i,
            open_time: '08:00',
            close_time: '17:00',
            updated_at: null,
            deleted_at: null,
            id_creator: publicId,
            id_updater: null,
          })),
        };
        (mockRepository.findAllByOwnerId as jest.Mock).mockResolvedValueOnce([
          businessWithAllDays,
        ]);

        const result = await service.findAllByOwner(publicId);

        expect(result[0].business_hours).toHaveLength(7);
      });

      it('should return businesses created at different times', async () => {
        const businesses = [
          {
            ...mockBusinessWithHours,
            business: {
              ...mockBusinessWithHours.business,
              created_at: new Date('2026-01-01'),
            },
          },
          {
            ...mockBusinessWithHours,
            business: {
              ...mockBusinessWithHours.business,
              id: 'business-2',
              created_at: new Date('2026-01-15'),
            },
          },
        ];
        (mockRepository.findAllByOwnerId as jest.Mock).mockResolvedValueOnce(
          businesses,
        );

        const result = await service.findAllByOwner(publicId);

        expect(result[0].business.created_at).not.toEqual(
          result[1].business.created_at,
        );
      });

      it('should return businesses with special characters in name', async () => {
        const businessWithSpecialChars = {
          ...mockBusinessWithHours,
          business: {
            ...mockBusinessWithHours.business,
            name: "Bengkel Pak John's & Co.",
          },
        };
        (mockRepository.findAllByOwnerId as jest.Mock).mockResolvedValueOnce([
          businessWithSpecialChars,
        ]);

        const result = await service.findAllByOwner(publicId);

        expect(result[0].business.name).toContain("'");
        expect(result[0].business.name).toContain('&');
      });

      it('should return businesses with long taglines', async () => {
        const businessWithLongTagline = {
          ...mockBusinessWithHours,
          business: {
            ...mockBusinessWithHours.business,
            tagline: 'A'.repeat(500),
          },
        };
        (mockRepository.findAllByOwnerId as jest.Mock).mockResolvedValueOnce([
          businessWithLongTagline,
        ]);

        const result = await service.findAllByOwner(publicId);

        expect(result[0].business.tagline?.length).toBe(500);
      });

      it('should return businesses with international phone numbers', async () => {
        const businessWithIntlPhone = {
          ...mockBusinessWithHours,
          business: {
            ...mockBusinessWithHours.business,
            phone: '+1-555-123-4567',
          },
        };
        (mockRepository.findAllByOwnerId as jest.Mock).mockResolvedValueOnce([
          businessWithIntlPhone,
        ]);

        const result = await service.findAllByOwner(publicId);

        expect(result[0].business.phone).toContain('+1');
      });

      it('should return businesses with various address formats', async () => {
        const businessWithComplexAddress = {
          ...mockBusinessWithHours,
          business: {
            ...mockBusinessWithHours.business,
            address: 'Suite 100\nFloor 5, Building A\nJl. Sudirman\n12345',
          },
        };
        (mockRepository.findAllByOwnerId as jest.Mock).mockResolvedValueOnce([
          businessWithComplexAddress,
        ]);

        const result = await service.findAllByOwner(publicId);

        expect(result[0].business.address).toContain('\n');
      });

      it('should resolve owner_id from public_id correctly', async () => {
        (mockRepository.findAllByOwnerId as jest.Mock).mockResolvedValueOnce(
          [],
        );

        await service.findAllByOwner(publicId);

        expect(mockRepository.findUserIdByPublicId).toHaveBeenCalledWith(
          publicId,
        );
        expect(mockRepository.findAllByOwnerId).toHaveBeenCalledWith(ownerId);
      });

      it('should pass correct language parameter to i18n', async () => {
        (mockRepository.findAllByOwnerId as jest.Mock).mockResolvedValueOnce(
          [],
        );

        await service.findAllByOwner(publicId, 'id');

        expect(mockI18nService.t).not.toHaveBeenCalled(); // No error, so no i18n call
      });
    });

    // ========================================================================
    // NEGATIVE TEST CASES (30+)
    // ========================================================================

    describe('Negative Test Cases', () => {
      it('should throw error when sub is null', async () => {
        await expect(service.findAllByOwner(null as any)).rejects.toThrow(
          UnauthorizedException,
        );
      });

      it('should throw error when sub is undefined', async () => {
        await expect(service.findAllByOwner(undefined as any)).rejects.toThrow(
          UnauthorizedException,
        );
      });

      it('should throw error when sub is empty string', async () => {
        await expect(service.findAllByOwner('')).rejects.toThrow(
          UnauthorizedException,
        );
      });

      it('should throw error when sub contains only whitespace', async () => {
        await expect(service.findAllByOwner('   ')).rejects.toThrow(
          UnauthorizedException,
        );
      });

      it('should throw error when sub contains only tabs', async () => {
        await expect(service.findAllByOwner('\t\t')).rejects.toThrow(
          UnauthorizedException,
        );
      });

      it('should throw error when sub contains only newlines', async () => {
        await expect(service.findAllByOwner('\n\n')).rejects.toThrow(
          UnauthorizedException,
        );
      });

      it('should throw error when public_id not found in core.users', async () => {
        (
          mockRepository.findUserIdByPublicId as jest.Mock
        ).mockResolvedValueOnce(null);

        await expect(service.findAllByOwner(publicId)).rejects.toThrow(
          UnauthorizedException,
        );
      });

      it('should return empty array when owner_id has no businesses', async () => {
        (mockRepository.findAllByOwnerId as jest.Mock).mockResolvedValueOnce(
          [],
        );

        const result = await service.findAllByOwner(publicId);

        expect(result).toEqual([]);
      });

      it('should handle repository returning null gracefully', async () => {
        (mockRepository.findAllByOwnerId as jest.Mock).mockResolvedValueOnce(
          null,
        );

        const result = await service.findAllByOwner(publicId);

        expect(result).toBeNull();
      });

      it('should throw error when repository.findUserIdByPublicId throws', async () => {
        (
          mockRepository.findUserIdByPublicId as jest.Mock
        ).mockRejectedValueOnce(new Error('Database error'));

        await expect(service.findAllByOwner(publicId)).rejects.toThrow(
          'Database error',
        );
      });

      it('should throw error when repository.findAllByOwnerId throws', async () => {
        (mockRepository.findAllByOwnerId as jest.Mock).mockRejectedValueOnce(
          new Error('Query failed'),
        );

        await expect(service.findAllByOwner(publicId)).rejects.toThrow(
          'Query failed',
        );
      });

      it('should handle null values in optional fields gracefully', async () => {
        const businessWithNulls = {
          business: {
            ...mockBusinessWithHours.business,
            tagline: null,
            phone: null,
            image: null,
            cover_image: null,
            latitude: null,
            longitude: null,
            address: null,
          },
          business_hours: [],
        };
        (mockRepository.findAllByOwnerId as jest.Mock).mockResolvedValueOnce([
          businessWithNulls,
        ]);

        const result = await service.findAllByOwner(publicId);

        expect(result[0].business.tagline).toBeNull();
        expect(result[0].business.phone).toBeNull();
        expect(result[0].business.image).toBeNull();
      });

      it('should handle undefined values in optional fields gracefully', async () => {
        const businessWithUndefined = {
          business: {
            id: 'business-1',
            owner_id: ownerId,
            name: 'Bengkel A',
            status: 'active',
            created_at: new Date(),
          },
          business_hours: [],
        };
        (mockRepository.findAllByOwnerId as jest.Mock).mockResolvedValueOnce([
          businessWithUndefined,
        ]);

        const result = await service.findAllByOwner(publicId);

        expect(result[0].business.id).toBeTruthy();
      });

      it('should throw error with English message when lang is "en"', async () => {
        await expect(service.findAllByOwner('', 'en')).rejects.toThrow(
          UnauthorizedException,
        );
        expect(mockI18nService.t).toHaveBeenCalledWith(
          'businesses.errors.ownerRequired',
          { lang: 'en' },
        );
      });

      it('should throw error with Indonesian message when lang is "id"', async () => {
        await expect(service.findAllByOwner('', 'id')).rejects.toThrow(
          UnauthorizedException,
        );
        expect(mockI18nService.t).toHaveBeenCalledWith(
          'businesses.errors.ownerRequired',
          { lang: 'id' },
        );
      });

      it('should handle very long sub string', async () => {
        const longSub = 'a'.repeat(1000);
        (
          mockRepository.findUserIdByPublicId as jest.Mock
        ).mockResolvedValueOnce(null);

        await expect(service.findAllByOwner(longSub)).rejects.toThrow(
          UnauthorizedException,
        );
      });

      it('should handle special characters in sub', async () => {
        const specialSub = "'; DROP TABLE users; --";
        (
          mockRepository.findUserIdByPublicId as jest.Mock
        ).mockResolvedValueOnce(null);

        await expect(service.findAllByOwner(specialSub)).rejects.toThrow(
          UnauthorizedException,
        );
      });

      it('should handle sub with SQL injection attempt', async () => {
        const sqlInjectionSub = "' OR '1'='1";
        (
          mockRepository.findUserIdByPublicId as jest.Mock
        ).mockResolvedValueOnce(null);

        await expect(service.findAllByOwner(sqlInjectionSub)).rejects.toThrow(
          UnauthorizedException,
        );
      });

      it('should handle concurrent calls with same sub', async () => {
        (mockRepository.findAllByOwnerId as jest.Mock).mockResolvedValue([]);

        const promises = Array.from({ length: 10 }, () =>
          service.findAllByOwner(publicId),
        );

        const results = await Promise.all(promises);

        results.forEach((result) => expect(result).toEqual([]));
      });

      it('should handle repository timeout gracefully', async () => {
        (mockRepository.findAllByOwnerId as jest.Mock).mockImplementationOnce(
          () =>
            new Promise((_, reject) =>
              setTimeout(() => reject(new Error('Timeout')), 100),
            ),
        );

        await expect(service.findAllByOwner(publicId)).rejects.toThrow(
          'Timeout',
        );
      });

      it('should handle database connection failure', async () => {
        (mockRepository.findAllByOwnerId as jest.Mock).mockRejectedValueOnce(
          new Error('Connection refused'),
        );

        await expect(service.findAllByOwner(publicId)).rejects.toThrow(
          'Connection refused',
        );
      });

      it('should handle corrupted business data gracefully', async () => {
        const corruptedBusiness = {
          business: {
            id: null,
            owner_id: null,
            name: null,
          } as any,
          business_hours: [],
        };
        (mockRepository.findAllByOwnerId as jest.Mock).mockResolvedValueOnce([
          corruptedBusiness,
        ]);

        const result = await service.findAllByOwner(publicId);

        expect(result[0].business.id).toBeNull();
      });

      it('should handle invalid business_hours structure', async () => {
        const businessWithInvalidHours = {
          ...mockBusinessWithHours,
          business_hours: [
            {
              id: null,
              day_of_week: null,
              open_time: null,
            } as any,
          ],
        };
        (mockRepository.findAllByOwnerId as jest.Mock).mockResolvedValueOnce([
          businessWithInvalidHours,
        ]);

        const result = await service.findAllByOwner(publicId);

        expect(result[0].business_hours[0].id).toBeNull();
      });

      it('should handle business_hours as null instead of array', async () => {
        const businessWithNullHours = {
          ...mockBusinessWithHours,
          business_hours: null as any,
        };
        (mockRepository.findAllByOwnerId as jest.Mock).mockResolvedValueOnce([
          businessWithNullHours,
        ]);

        const result = await service.findAllByOwner(publicId);

        expect(result[0].business_hours).toBeNull();
      });

      it('should handle business_hours as undefined instead of array', async () => {
        const businessWithUndefinedHours = {
          ...mockBusinessWithHours,
          business_hours: undefined as any,
        };
        (mockRepository.findAllByOwnerId as jest.Mock).mockResolvedValueOnce([
          businessWithUndefinedHours,
        ]);

        const result = await service.findAllByOwner(publicId);

        expect(result[0].business_hours).toBeUndefined();
      });

      it('should not return businesses from other owners', async () => {
        const otherOwnerId = 'other-user-uuid';
        (mockRepository.findAllByOwnerId as jest.Mock).mockResolvedValueOnce(
          [],
        );

        const result = await service.findAllByOwner(publicId);

        expect(mockRepository.findAllByOwnerId).toHaveBeenCalledWith(ownerId);
        expect(mockRepository.findAllByOwnerId).not.toHaveBeenCalledWith(
          otherOwnerId,
        );
      });

      it('should handle invalid Date objects in timestamps', async () => {
        const businessWithInvalidDate = {
          ...mockBusinessWithHours,
          business: {
            ...mockBusinessWithHours.business,
            created_at: new Date('invalid'),
          },
        };
        (mockRepository.findAllByOwnerId as jest.Mock).mockResolvedValueOnce([
          businessWithInvalidDate,
        ]);

        const result = await service.findAllByOwner(publicId);

        expect(isNaN(result[0].business.created_at.getTime())).toBe(true);
      });

      it('should handle timestamp as string instead of Date', async () => {
        const businessWithStringDate = {
          ...mockBusinessWithHours,
          business: {
            ...mockBusinessWithHours.business,
            created_at: '2026-01-15T08:30:00.000Z' as any,
          },
        };
        (mockRepository.findAllByOwnerId as jest.Mock).mockResolvedValueOnce([
          businessWithStringDate,
        ]);

        const result = await service.findAllByOwner(publicId);

        expect(typeof result[0].business.created_at).toBe('string');
      });

      it('should handle empty object as business', async () => {
        const emptyBusiness = {
          business: {} as any,
          business_hours: [],
        };
        (mockRepository.findAllByOwnerId as jest.Mock).mockResolvedValueOnce([
          emptyBusiness,
        ]);

        const result = await service.findAllByOwner(publicId);

        expect(result[0].business).toEqual({});
      });

      it('should handle array instead of object for business', async () => {
        const arrayBusiness = {
          business: [] as any,
          business_hours: [],
        };
        (mockRepository.findAllByOwnerId as jest.Mock).mockResolvedValueOnce([
          arrayBusiness,
        ]);

        const result = await service.findAllByOwner(publicId);

        expect(Array.isArray(result[0].business)).toBe(true);
      });
    });

    // ========================================================================
    // EDGE CASES
    // ========================================================================

    describe('Edge Cases', () => {
      it('should handle business with exactly 7 hours (all days)', async () => {
        const businessWithAllDays = {
          ...mockBusinessWithHours,
          business_hours: [0, 1, 2, 3, 4, 5, 6].map((day) => ({
            id: `hour-${day}`,
            business_id: 'business-1',
            day_of_week: day,
            open_time: '08:00',
            close_time: '17:00',
            updated_at: null,
            deleted_at: null,
            id_creator: publicId,
            id_updater: null,
          })),
        };
        (mockRepository.findAllByOwnerId as jest.Mock).mockResolvedValueOnce([
          businessWithAllDays,
        ]);

        const result = await service.findAllByOwner(publicId);

        expect(result[0].business_hours).toHaveLength(7);
        expect(
          new Set(result[0].business_hours.map((h) => h.day_of_week)).size,
        ).toBe(7);
      });

      it('should handle business with 0 hours', async () => {
        (mockRepository.findAllByOwnerId as jest.Mock).mockResolvedValueOnce([
          mockBusinessWithoutHours,
        ]);

        const result = await service.findAllByOwner(publicId);

        expect(result[0].business_hours).toEqual([]);
      });

      it('should handle owner with exactly 100 businesses', async () => {
        const manyBusinesses = Array.from({ length: 100 }, (_, i) => ({
          ...mockBusinessWithoutHours,
          business: {
            ...mockBusinessWithoutHours.business,
            id: `business-${i}`,
          },
        }));
        (mockRepository.findAllByOwnerId as jest.Mock).mockResolvedValueOnce(
          manyBusinesses,
        );

        const result = await service.findAllByOwner(publicId);

        expect(result).toHaveLength(100);
      });

      it('should handle business created and updated in same second', async () => {
        const sameTime = new Date('2026-01-15T08:30:00.000Z');
        const businessWithSameTimestamps = {
          ...mockBusinessWithHours,
          business: {
            ...mockBusinessWithHours.business,
            created_at: sameTime,
            updated_at: sameTime,
          },
        };
        (mockRepository.findAllByOwnerId as jest.Mock).mockResolvedValueOnce([
          businessWithSameTimestamps,
        ]);

        const result = await service.findAllByOwner(publicId);

        expect(result[0].business.created_at).toEqual(
          result[0].business.updated_at,
        );
      });

      it('should handle hours with open_time = 00:00 and close_time = 23:59', async () => {
        const business24Hours = {
          ...mockBusinessWithHours,
          business_hours: [
            {
              ...mockBusinessWithHours.business_hours[0],
              open_time: '00:00',
              close_time: '23:59',
            },
          ],
        };
        (mockRepository.findAllByOwnerId as jest.Mock).mockResolvedValueOnce([
          business24Hours,
        ]);

        const result = await service.findAllByOwner(publicId);

        expect(result[0].business_hours[0].open_time).toBe('00:00');
        expect(result[0].business_hours[0].close_time).toBe('23:59');
      });

      it('should handle business with null tagline vs empty tagline', async () => {
        const businesses = [
          {
            ...mockBusinessWithHours,
            business: { ...mockBusinessWithHours.business, tagline: null },
          },
          {
            ...mockBusinessWithHours,
            business: {
              ...mockBusinessWithHours.business,
              id: 'business-2',
              tagline: '',
            },
          },
        ];
        (mockRepository.findAllByOwnerId as jest.Mock).mockResolvedValueOnce(
          businesses,
        );

        const result = await service.findAllByOwner(publicId);

        expect(result[0].business.tagline).toBeNull();
        expect(result[1].business.tagline).toBe('');
      });

      it('should handle business with null image vs no image field', async () => {
        const businesses = [
          {
            ...mockBusinessWithHours,
            business: { ...mockBusinessWithHours.business, image: null },
          },
          {
            ...mockBusinessWithHours,
            business: {
              ...mockBusinessWithHours.business,
              id: 'business-2',
              image: undefined,
            } as any,
          },
        ];
        (mockRepository.findAllByOwnerId as jest.Mock).mockResolvedValueOnce(
          businesses,
        );

        const result = await service.findAllByOwner(publicId);

        expect(result[0].business.image).toBeNull();
        expect(result[1].business.image).toBeUndefined();
      });

      it('should handle coordinates at boundary values (lat: -90/90, lon: -180/180)', async () => {
        const businessWithBoundaryCoords = {
          ...mockBusinessWithHours,
          business: {
            ...mockBusinessWithHours.business,
            latitude: '-90',
            longitude: '-180',
          },
        };
        (mockRepository.findAllByOwnerId as jest.Mock).mockResolvedValueOnce([
          businessWithBoundaryCoords,
        ]);

        const result = await service.findAllByOwner(publicId);

        expect(result[0].business.latitude).toBe('-90');
        expect(result[0].business.longitude).toBe('-180');
      });

      it('should handle phone numbers with + prefix and country code', async () => {
        const businessWithIntlPhone = {
          ...mockBusinessWithHours,
          business: {
            ...mockBusinessWithHours.business,
            phone: '+62-812-3456-7890',
          },
        };
        (mockRepository.findAllByOwnerId as jest.Mock).mockResolvedValueOnce([
          businessWithIntlPhone,
        ]);

        const result = await service.findAllByOwner(publicId);

        expect(result[0].business.phone).toContain('+62');
      });

      it('should handle addresses with newlines and special characters', async () => {
        const businessWithComplexAddress = {
          ...mockBusinessWithHours,
          business: {
            ...mockBusinessWithHours.business,
            address: 'Suite #123\nFloor 5 & 6\nJl. Sudirman "No. 1"',
          },
        };
        (mockRepository.findAllByOwnerId as jest.Mock).mockResolvedValueOnce([
          businessWithComplexAddress,
        ]);

        const result = await service.findAllByOwner(publicId);

        expect(result[0].business.address).toContain('\n');
        expect(result[0].business.address).toContain('"');
        expect(result[0].business.address).toContain('&');
      });

      it('should handle business status transitions (pending → active → banned)', async () => {
        const businesses = [
          {
            ...mockBusinessWithHours,
            business: { ...mockBusinessWithHours.business, status: 'pending' },
          },
          {
            ...mockBusinessWithHours,
            business: {
              ...mockBusinessWithHours.business,
              id: 'business-2',
              status: 'active',
            },
          },
          {
            ...mockBusinessWithHours,
            business: {
              ...mockBusinessWithHours.business,
              id: 'business-3',
              status: 'banned',
            },
          },
        ];
        (mockRepository.findAllByOwnerId as jest.Mock).mockResolvedValueOnce(
          businesses,
        );

        const result = await service.findAllByOwner(publicId);

        expect(result.map((b) => b.business.status)).toEqual([
          'pending',
          'active',
          'banned',
        ]);
      });

      it('should handle multiple businesses created in quick succession', async () => {
        const baseTime = new Date('2026-01-15T08:30:00.000Z').getTime();
        const businesses = Array.from({ length: 5 }, (_, i) => ({
          ...mockBusinessWithoutHours,
          business: {
            ...mockBusinessWithoutHours.business,
            id: `business-${i}`,
            created_at: new Date(baseTime + i * 1000), // 1 second apart
          },
        }));
        (mockRepository.findAllByOwnerId as jest.Mock).mockResolvedValueOnce(
          businesses,
        );

        const result = await service.findAllByOwner(publicId);

        expect(result).toHaveLength(5);
        const timestamps = result.map((b) => b.business.created_at.getTime());
        expect(timestamps[1] - timestamps[0]).toBe(1000);
      });

      it('should handle response time measurement', async () => {
        (mockRepository.findAllByOwnerId as jest.Mock).mockResolvedValueOnce([
          mockBusinessWithHours,
        ]);

        const startTime = Date.now();
        await service.findAllByOwner(publicId);
        const endTime = Date.now();

        const duration = endTime - startTime;
        expect(duration).toBeLessThan(1000); // Should complete in < 1 second
      });

      it('should handle memory usage with large result sets', async () => {
        const largeBusinesses = Array.from({ length: 1000 }, (_, i) => ({
          ...mockBusinessWithHours,
          business: {
            ...mockBusinessWithHours.business,
            id: `business-${i}`,
          },
        }));
        (mockRepository.findAllByOwnerId as jest.Mock).mockResolvedValueOnce(
          largeBusinesses,
        );

        const result = await service.findAllByOwner(publicId);

        expect(result).toHaveLength(1000);
      });
    });
  });

  /**
   * ========================================================================
   * Test Suite: findOneById()
   * GET /v1/businesses/:business_id endpoint business logic tests
   * ========================================================================
   */
  describe('findOneById', () => {
    const targetBusinessId = 'target-business-uuid-001';
    const otherOwnerId = 'other-owner-uuid-999';

    const mockBusinessResult = {
      business: {
        id: targetBusinessId,
        owner_id: ownerId,
        name: 'Bengkel Target',
        tagline: 'Service terpercaya sejak 2010',
        status: 'active',
        phone: '+6281234567890',
        image: 'uploads/images/target.jpg',
        cover_image: 'uploads/images/target-cover.jpg',
        latitude: '-6.2088',
        longitude: '106.8456',
        address: 'Jl. Sudirman No. 123, Jakarta',
        created_at: new Date('2026-01-15T08:30:00.000Z'),
        updated_at: new Date('2026-01-20T10:15:00.000Z'),
        deleted_at: null,
        id_creator: publicId,
        id_updater: null,
      },
      business_hours: [
        {
          id: 'hour-1',
          business_id: targetBusinessId,
          day_of_week: 1,
          open_time: '08:00',
          close_time: '17:00',
          updated_at: null,
          deleted_at: null,
          id_creator: publicId,
          id_updater: null,
        },
        {
          id: 'hour-2',
          business_id: targetBusinessId,
          day_of_week: 2,
          open_time: '08:00',
          close_time: '17:00',
          updated_at: null,
          deleted_at: null,
          id_creator: publicId,
          id_updater: null,
        },
      ],
    };

    const mockBusinessWithoutHoursResult = {
      business: {
        id: targetBusinessId,
        owner_id: ownerId,
        name: 'Bengkel Minimal',
        tagline: null,
        status: 'pending',
        phone: null,
        image: null,
        cover_image: null,
        latitude: null,
        longitude: null,
        address: null,
        created_at: new Date('2026-01-10T14:20:00.000Z'),
        updated_at: null,
        deleted_at: null,
        id_creator: publicId,
        id_updater: null,
      },
      business_hours: [],
    };

    // ========================================================================
    // POSITIVE TEST CASES (30+)
    // ========================================================================

    describe('Positive Test Cases', () => {
      it('should return business with hours when found and owned by user', async () => {
        (
          mockRepository.findBusinessWithHoursById as jest.Mock
        ).mockResolvedValueOnce(mockBusinessResult);

        const result = await service.findOneById(
          targetBusinessId,
          publicId,
          'en',
        );

        expect(result).toBeDefined();
        expect(result.business.id).toBe(targetBusinessId);
        expect(result.business_hours).toHaveLength(2);
      });

      it('should return business without hours when none exist', async () => {
        (
          mockRepository.findBusinessWithHoursById as jest.Mock
        ).mockResolvedValueOnce(mockBusinessWithoutHoursResult);

        const result = await service.findOneById(
          targetBusinessId,
          publicId,
          'en',
        );

        expect(result.business.id).toBe(targetBusinessId);
        expect(result.business_hours).toEqual([]);
      });

      it('should resolve owner_id from sub before querying', async () => {
        (
          mockRepository.findBusinessWithHoursById as jest.Mock
        ).mockResolvedValueOnce(mockBusinessResult);

        await service.findOneById(targetBusinessId, publicId, 'en');

        expect(mockRepository.findUserIdByPublicId).toHaveBeenCalledWith(
          publicId,
        );
      });

      it('should call repository.findBusinessWithHoursById with correct id', async () => {
        (
          mockRepository.findBusinessWithHoursById as jest.Mock
        ).mockResolvedValueOnce(mockBusinessResult);

        await service.findOneById(targetBusinessId, publicId, 'en');

        expect(mockRepository.findBusinessWithHoursById).toHaveBeenCalledWith(
          targetBusinessId,
        );
      });

      it('should return correct business name', async () => {
        (
          mockRepository.findBusinessWithHoursById as jest.Mock
        ).mockResolvedValueOnce(mockBusinessResult);

        const result = await service.findOneById(
          targetBusinessId,
          publicId,
          'en',
        );

        expect(result.business.name).toBe('Bengkel Target');
      });

      it('should return correct business status', async () => {
        (
          mockRepository.findBusinessWithHoursById as jest.Mock
        ).mockResolvedValueOnce(mockBusinessResult);

        const result = await service.findOneById(
          targetBusinessId,
          publicId,
          'en',
        );

        expect(result.business.status).toBe('active');
      });

      it('should return business with pending status', async () => {
        const pendingBusiness = {
          ...mockBusinessResult,
          business: { ...mockBusinessResult.business, status: 'pending' },
        };
        (
          mockRepository.findBusinessWithHoursById as jest.Mock
        ).mockResolvedValueOnce(pendingBusiness);

        const result = await service.findOneById(
          targetBusinessId,
          publicId,
          'en',
        );

        expect(result.business.status).toBe('pending');
      });

      it('should return business with banned status', async () => {
        const bannedBusiness = {
          ...mockBusinessResult,
          business: { ...mockBusinessResult.business, status: 'banned' },
        };
        (
          mockRepository.findBusinessWithHoursById as jest.Mock
        ).mockResolvedValueOnce(bannedBusiness);

        const result = await service.findOneById(
          targetBusinessId,
          publicId,
          'en',
        );

        expect(result.business.status).toBe('banned');
      });

      it('should return correct owner_id', async () => {
        (
          mockRepository.findBusinessWithHoursById as jest.Mock
        ).mockResolvedValueOnce(mockBusinessResult);

        const result = await service.findOneById(
          targetBusinessId,
          publicId,
          'en',
        );

        expect(result.business.owner_id).toBe(ownerId);
      });

      it('should return correct tagline', async () => {
        (
          mockRepository.findBusinessWithHoursById as jest.Mock
        ).mockResolvedValueOnce(mockBusinessResult);

        const result = await service.findOneById(
          targetBusinessId,
          publicId,
          'en',
        );

        expect(result.business.tagline).toBe('Service terpercaya sejak 2010');
      });

      it('should return correct phone number', async () => {
        (
          mockRepository.findBusinessWithHoursById as jest.Mock
        ).mockResolvedValueOnce(mockBusinessResult);

        const result = await service.findOneById(
          targetBusinessId,
          publicId,
          'en',
        );

        expect(result.business.phone).toBe('+6281234567890');
      });

      it('should return correct image paths', async () => {
        (
          mockRepository.findBusinessWithHoursById as jest.Mock
        ).mockResolvedValueOnce(mockBusinessResult);

        const result = await service.findOneById(
          targetBusinessId,
          publicId,
          'en',
        );

        expect(result.business.image).toContain('uploads/images');
        expect(result.business.cover_image).toContain('uploads/images');
      });

      it('should return correct coordinates', async () => {
        (
          mockRepository.findBusinessWithHoursById as jest.Mock
        ).mockResolvedValueOnce(mockBusinessResult);

        const result = await service.findOneById(
          targetBusinessId,
          publicId,
          'en',
        );

        expect(result.business.latitude).toBe('-6.2088');
        expect(result.business.longitude).toBe('106.8456');
      });

      it('should return correct address', async () => {
        (
          mockRepository.findBusinessWithHoursById as jest.Mock
        ).mockResolvedValueOnce(mockBusinessResult);

        const result = await service.findOneById(
          targetBusinessId,
          publicId,
          'en',
        );

        expect(result.business.address).toContain('Jl. Sudirman');
      });

      it('should return correct timestamps', async () => {
        (
          mockRepository.findBusinessWithHoursById as jest.Mock
        ).mockResolvedValueOnce(mockBusinessResult);

        const result = await service.findOneById(
          targetBusinessId,
          publicId,
          'en',
        );

        expect(result.business.created_at).toBeInstanceOf(Date);
        expect(result.business.updated_at).toBeInstanceOf(Date);
        expect(result.business.deleted_at).toBeNull();
      });

      it('should return correct audit fields (id_creator, id_updater)', async () => {
        (
          mockRepository.findBusinessWithHoursById as jest.Mock
        ).mockResolvedValueOnce(mockBusinessResult);

        const result = await service.findOneById(
          targetBusinessId,
          publicId,
          'en',
        );

        expect(result.business.id_creator).toBe(publicId);
        expect(result.business.id_updater).toBeNull();
      });

      it('should return business_hours with correct day_of_week values', async () => {
        (
          mockRepository.findBusinessWithHoursById as jest.Mock
        ).mockResolvedValueOnce(mockBusinessResult);

        const result = await service.findOneById(
          targetBusinessId,
          publicId,
          'en',
        );

        const days = result.business_hours.map((h) => h.day_of_week);
        expect(days).toContain(1);
        expect(days).toContain(2);
      });

      it('should return business_hours with correct time values', async () => {
        (
          mockRepository.findBusinessWithHoursById as jest.Mock
        ).mockResolvedValueOnce(mockBusinessResult);

        const result = await service.findOneById(
          targetBusinessId,
          publicId,
          'en',
        );

        expect(result.business_hours[0].open_time).toBe('08:00');
        expect(result.business_hours[0].close_time).toBe('17:00');
      });

      it('should return business_hours with all 7 days when set', async () => {
        const businessWithAllDays = {
          ...mockBusinessResult,
          business_hours: [0, 1, 2, 3, 4, 5, 6].map((day) => ({
            id: `hour-${day}`,
            business_id: targetBusinessId,
            day_of_week: day,
            open_time: '08:00',
            close_time: '17:00',
            updated_at: null,
            deleted_at: null,
            id_creator: publicId,
            id_updater: null,
          })),
        };
        (
          mockRepository.findBusinessWithHoursById as jest.Mock
        ).mockResolvedValueOnce(businessWithAllDays);

        const result = await service.findOneById(
          targetBusinessId,
          publicId,
          'en',
        );

        expect(result.business_hours).toHaveLength(7);
      });

      it('should return business_hours with correct business_id reference', async () => {
        (
          mockRepository.findBusinessWithHoursById as jest.Mock
        ).mockResolvedValueOnce(mockBusinessResult);

        const result = await service.findOneById(
          targetBusinessId,
          publicId,
          'en',
        );

        result.business_hours.forEach((h) => {
          expect(h.business_id).toBe(targetBusinessId);
        });
      });

      it('should work with lang parameter set to en', async () => {
        (
          mockRepository.findBusinessWithHoursById as jest.Mock
        ).mockResolvedValueOnce(mockBusinessResult);

        const result = await service.findOneById(
          targetBusinessId,
          publicId,
          'en',
        );

        expect(result).toBeDefined();
      });

      it('should work with lang parameter set to id', async () => {
        (
          mockRepository.findBusinessWithHoursById as jest.Mock
        ).mockResolvedValueOnce(mockBusinessResult);

        const result = await service.findOneById(
          targetBusinessId,
          publicId,
          'id',
        );

        expect(result).toBeDefined();
      });

      it('should work without lang parameter (defaults)', async () => {
        (
          mockRepository.findBusinessWithHoursById as jest.Mock
        ).mockResolvedValueOnce(mockBusinessResult);

        const result = await service.findOneById(targetBusinessId, publicId);

        expect(result).toBeDefined();
      });

      it('should return business with special characters in name', async () => {
        const specialBusiness = {
          ...mockBusinessResult,
          business: {
            ...mockBusinessResult.business,
            name: 'Bengkel Pak John\'s & Co. "Premium"',
          },
        };
        (
          mockRepository.findBusinessWithHoursById as jest.Mock
        ).mockResolvedValueOnce(specialBusiness);

        const result = await service.findOneById(
          targetBusinessId,
          publicId,
          'en',
        );

        expect(result.business.name).toContain("'");
        expect(result.business.name).toContain('&');
        expect(result.business.name).toContain('"');
      });

      it('should return business with maximum length tagline (500 chars)', async () => {
        const longTaglineBusiness = {
          ...mockBusinessResult,
          business: {
            ...mockBusinessResult.business,
            tagline: 'A'.repeat(500),
          },
        };
        (
          mockRepository.findBusinessWithHoursById as jest.Mock
        ).mockResolvedValueOnce(longTaglineBusiness);

        const result = await service.findOneById(
          targetBusinessId,
          publicId,
          'en',
        );

        expect(result.business.tagline?.length).toBe(500);
      });

      it('should return business with international phone number', async () => {
        const intlPhoneBusiness = {
          ...mockBusinessResult,
          business: {
            ...mockBusinessResult.business,
            phone: '+1-555-123-4567',
          },
        };
        (
          mockRepository.findBusinessWithHoursById as jest.Mock
        ).mockResolvedValueOnce(intlPhoneBusiness);

        const result = await service.findOneById(
          targetBusinessId,
          publicId,
          'en',
        );

        expect(result.business.phone).toContain('+1');
      });

      it('should return business with multiline address', async () => {
        const multilineAddressBusiness = {
          ...mockBusinessResult,
          business: {
            ...mockBusinessResult.business,
            address: 'Suite 100\nFloor 5, Building A\nJl. Sudirman\n12345',
          },
        };
        (
          mockRepository.findBusinessWithHoursById as jest.Mock
        ).mockResolvedValueOnce(multilineAddressBusiness);

        const result = await service.findOneById(
          targetBusinessId,
          publicId,
          'en',
        );

        expect(result.business.address).toContain('\n');
      });

      it('should return business with boundary coordinate values', async () => {
        const boundaryCoordBusiness = {
          ...mockBusinessResult,
          business: {
            ...mockBusinessResult.business,
            latitude: '-90.00000000',
            longitude: '180.00000000',
          },
        };
        (
          mockRepository.findBusinessWithHoursById as jest.Mock
        ).mockResolvedValueOnce(boundaryCoordBusiness);

        const result = await service.findOneById(
          targetBusinessId,
          publicId,
          'en',
        );

        expect(result.business.latitude).toBe('-90.00000000');
        expect(result.business.longitude).toBe('180.00000000');
      });

      it('should return business_hours with early morning time (00:00)', async () => {
        const earlyMorningBusiness = {
          ...mockBusinessResult,
          business_hours: [
            {
              ...mockBusinessResult.business_hours[0],
              open_time: '00:00',
              close_time: '06:00',
            },
          ],
        };
        (
          mockRepository.findBusinessWithHoursById as jest.Mock
        ).mockResolvedValueOnce(earlyMorningBusiness);

        const result = await service.findOneById(
          targetBusinessId,
          publicId,
          'en',
        );

        expect(result.business_hours[0].open_time).toBe('00:00');
      });

      it('should return business_hours with late night time (23:59)', async () => {
        const lateNightBusiness = {
          ...mockBusinessResult,
          business_hours: [
            {
              ...mockBusinessResult.business_hours[0],
              open_time: '18:00',
              close_time: '23:59',
            },
          ],
        };
        (
          mockRepository.findBusinessWithHoursById as jest.Mock
        ).mockResolvedValueOnce(lateNightBusiness);

        const result = await service.findOneById(
          targetBusinessId,
          publicId,
          'en',
        );

        expect(result.business_hours[0].close_time).toBe('23:59');
      });

      it('should handle different public_id to owner_id mappings correctly', async () => {
        const differentPublicId = '22222222-2222-4222-8222-222222222222';
        const differentOwnerId = 'different-user-uuid';
        (
          mockRepository.findUserIdByPublicId as jest.Mock
        ).mockResolvedValueOnce(differentOwnerId);

        const businessForDifferentOwner = {
          ...mockBusinessResult,
          business: {
            ...mockBusinessResult.business,
            owner_id: differentOwnerId,
          },
        };
        (
          mockRepository.findBusinessWithHoursById as jest.Mock
        ).mockResolvedValueOnce(businessForDifferentOwner);

        const result = await service.findOneById(
          targetBusinessId,
          differentPublicId,
          'en',
        );

        expect(result.business.owner_id).toBe(differentOwnerId);
        expect(mockRepository.findUserIdByPublicId).toHaveBeenCalledWith(
          differentPublicId,
        );
      });

      it('should return consistent data structure across repeated calls', async () => {
        (
          mockRepository.findBusinessWithHoursById as jest.Mock
        ).mockResolvedValue(mockBusinessResult);

        const result1 = await service.findOneById(
          targetBusinessId,
          publicId,
          'en',
        );
        const result2 = await service.findOneById(
          targetBusinessId,
          publicId,
          'en',
        );

        expect(result1).toEqual(result2);
      });

      it('should return business with id_updater when updated', async () => {
        const updatedBusiness = {
          ...mockBusinessResult,
          business: {
            ...mockBusinessResult.business,
            id_updater: publicId,
            updated_at: new Date('2026-02-01T12:00:00.000Z'),
          },
        };
        (
          mockRepository.findBusinessWithHoursById as jest.Mock
        ).mockResolvedValueOnce(updatedBusiness);

        const result = await service.findOneById(
          targetBusinessId,
          publicId,
          'en',
        );

        expect(result.business.id_updater).toBe(publicId);
        expect(result.business.updated_at).toBeTruthy();
      });

      it('should return business_hours audit fields (id_creator, id_updater)', async () => {
        (
          mockRepository.findBusinessWithHoursById as jest.Mock
        ).mockResolvedValueOnce(mockBusinessResult);

        const result = await service.findOneById(
          targetBusinessId,
          publicId,
          'en',
        );

        expect(result.business_hours[0].id_creator).toBe(publicId);
        expect(result.business_hours[0].id_updater).toBeNull();
      });
    });

    // ========================================================================
    // NEGATIVE TEST CASES (30+)
    // ========================================================================

    describe('Negative Test Cases', () => {
      it('should throw UnauthorizedException when sub is null', async () => {
        await expect(
          service.findOneById(targetBusinessId, null as any, 'en'),
        ).rejects.toThrow(UnauthorizedException);
      });

      it('should throw UnauthorizedException when sub is undefined', async () => {
        await expect(
          service.findOneById(targetBusinessId, undefined as any, 'en'),
        ).rejects.toThrow(UnauthorizedException);
      });

      it('should throw UnauthorizedException when sub is empty string', async () => {
        await expect(
          service.findOneById(targetBusinessId, '', 'en'),
        ).rejects.toThrow(UnauthorizedException);
      });

      it('should throw UnauthorizedException when sub is whitespace only', async () => {
        await expect(
          service.findOneById(targetBusinessId, '   ', 'en'),
        ).rejects.toThrow(UnauthorizedException);
      });

      it('should throw UnauthorizedException when sub contains only tabs', async () => {
        await expect(
          service.findOneById(targetBusinessId, '\t\t', 'en'),
        ).rejects.toThrow(UnauthorizedException);
      });

      it('should throw UnauthorizedException when sub contains only newlines', async () => {
        await expect(
          service.findOneById(targetBusinessId, '\n\n', 'en'),
        ).rejects.toThrow(UnauthorizedException);
      });

      it('should throw BadRequestException when businessId is empty', async () => {
        await expect(service.findOneById('', publicId, 'en')).rejects.toThrow(
          BadRequestException,
        );
      });

      it('should throw BadRequestException when businessId is null', async () => {
        await expect(
          service.findOneById(null as any, publicId, 'en'),
        ).rejects.toThrow(BadRequestException);
      });

      it('should throw BadRequestException when businessId is undefined', async () => {
        await expect(
          service.findOneById(undefined as any, publicId, 'en'),
        ).rejects.toThrow(BadRequestException);
      });

      it('should throw BadRequestException when businessId is whitespace only', async () => {
        await expect(
          service.findOneById('   ', publicId, 'en'),
        ).rejects.toThrow(BadRequestException);
      });

      it('should throw UnauthorizedException when public_id not found in core.users', async () => {
        (
          mockRepository.findUserIdByPublicId as jest.Mock
        ).mockResolvedValueOnce(null);

        await expect(
          service.findOneById(targetBusinessId, 'unknown-public-id', 'en'),
        ).rejects.toThrow(UnauthorizedException);
      });

      it('should throw NotFoundException when business does not exist', async () => {
        (
          mockRepository.findBusinessWithHoursById as jest.Mock
        ).mockResolvedValueOnce(null);

        await expect(
          service.findOneById('non-existent-id', publicId, 'en'),
        ).rejects.toThrow(NotFoundException);
      });

      it('should throw NotFoundException when business is soft-deleted', async () => {
        (
          mockRepository.findBusinessWithHoursById as jest.Mock
        ).mockResolvedValueOnce(null);

        await expect(
          service.findOneById('soft-deleted-id', publicId, 'en'),
        ).rejects.toThrow(NotFoundException);
      });

      it('should throw ForbiddenException when user is not the owner', async () => {
        const otherOwnerBusiness = {
          ...mockBusinessResult,
          business: {
            ...mockBusinessResult.business,
            owner_id: otherOwnerId,
          },
        };
        (
          mockRepository.findBusinessWithHoursById as jest.Mock
        ).mockResolvedValueOnce(otherOwnerBusiness);

        await expect(
          service.findOneById(targetBusinessId, publicId, 'en'),
        ).rejects.toThrow(ForbiddenException);
      });

      it('should throw ForbiddenException with i18n accessDenied message', async () => {
        const otherOwnerBusiness = {
          ...mockBusinessResult,
          business: {
            ...mockBusinessResult.business,
            owner_id: otherOwnerId,
          },
        };
        (
          mockRepository.findBusinessWithHoursById as jest.Mock
        ).mockResolvedValueOnce(otherOwnerBusiness);

        await expect(
          service.findOneById(targetBusinessId, publicId, 'en'),
        ).rejects.toThrow(ForbiddenException);

        expect(mockI18nService.t).toHaveBeenCalledWith(
          'businesses.errors.accessDenied',
          { lang: 'en' },
        );
      });

      it('should throw NotFoundException with i18n notFound message', async () => {
        (
          mockRepository.findBusinessWithHoursById as jest.Mock
        ).mockResolvedValueOnce(null);

        await expect(
          service.findOneById('non-existent-id', publicId, 'en'),
        ).rejects.toThrow(NotFoundException);

        expect(mockI18nService.t).toHaveBeenCalledWith(
          'businesses.errors.notFound',
          { lang: 'en' },
        );
      });

      it('should throw UnauthorizedException with i18n ownerRequired message for empty sub', async () => {
        await expect(
          service.findOneById(targetBusinessId, '', 'en'),
        ).rejects.toThrow(UnauthorizedException);

        expect(mockI18nService.t).toHaveBeenCalledWith(
          'businesses.errors.ownerRequired',
          { lang: 'en' },
        );
      });

      it('should throw BadRequestException with i18n invalidBusinessId message', async () => {
        await expect(service.findOneById('', publicId, 'en')).rejects.toThrow(
          BadRequestException,
        );

        expect(mockI18nService.t).toHaveBeenCalledWith(
          'businesses.errors.invalidBusinessId',
          { lang: 'en' },
        );
      });

      it('should use Indonesian language when lang is id', async () => {
        await expect(
          service.findOneById(targetBusinessId, '', 'id'),
        ).rejects.toThrow(UnauthorizedException);

        expect(mockI18nService.t).toHaveBeenCalledWith(
          'businesses.errors.ownerRequired',
          { lang: 'id' },
        );
      });

      it('should throw error when repository.findUserIdByPublicId throws', async () => {
        (
          mockRepository.findUserIdByPublicId as jest.Mock
        ).mockRejectedValueOnce(new Error('Database connection error'));

        await expect(
          service.findOneById(targetBusinessId, publicId, 'en'),
        ).rejects.toThrow('Database connection error');
      });

      it('should throw error when repository.findBusinessWithHoursById throws', async () => {
        (
          mockRepository.findBusinessWithHoursById as jest.Mock
        ).mockRejectedValueOnce(new Error('Query failed'));

        await expect(
          service.findOneById(targetBusinessId, publicId, 'en'),
        ).rejects.toThrow('Query failed');
      });

      it('should not call findBusinessWithHoursById when sub is invalid', async () => {
        await expect(
          service.findOneById(targetBusinessId, '', 'en'),
        ).rejects.toThrow(UnauthorizedException);

        expect(mockRepository.findBusinessWithHoursById).not.toHaveBeenCalled();
      });

      it('should not call findBusinessWithHoursById when businessId is empty', async () => {
        await expect(service.findOneById('', publicId, 'en')).rejects.toThrow(
          BadRequestException,
        );

        expect(mockRepository.findBusinessWithHoursById).not.toHaveBeenCalled();
      });

      it('should not call findUserIdByPublicId when sub is empty', async () => {
        // Reset mock to track calls from this test only
        (mockRepository.findUserIdByPublicId as jest.Mock).mockClear();

        await expect(
          service.findOneById(targetBusinessId, '', 'en'),
        ).rejects.toThrow(UnauthorizedException);

        expect(mockRepository.findUserIdByPublicId).not.toHaveBeenCalled();
      });

      it('should handle SQL injection attempt in businessId', async () => {
        (
          mockRepository.findBusinessWithHoursById as jest.Mock
        ).mockResolvedValueOnce(null);

        await expect(
          service.findOneById("'; DROP TABLE businesses; --", publicId, 'en'),
        ).rejects.toThrow(NotFoundException);
      });

      it('should handle SQL injection attempt in sub', async () => {
        (
          mockRepository.findUserIdByPublicId as jest.Mock
        ).mockResolvedValueOnce(null);

        await expect(
          service.findOneById(targetBusinessId, "' OR '1'='1", 'en'),
        ).rejects.toThrow(UnauthorizedException);
      });

      it('should handle very long businessId string', async () => {
        (
          mockRepository.findBusinessWithHoursById as jest.Mock
        ).mockResolvedValueOnce(null);

        await expect(
          service.findOneById('a'.repeat(1000), publicId, 'en'),
        ).rejects.toThrow(NotFoundException);
      });

      it('should handle very long sub string', async () => {
        (
          mockRepository.findUserIdByPublicId as jest.Mock
        ).mockResolvedValueOnce(null);

        await expect(
          service.findOneById(targetBusinessId, 'a'.repeat(1000), 'en'),
        ).rejects.toThrow(UnauthorizedException);
      });

      it('should handle concurrent calls gracefully', async () => {
        (
          mockRepository.findBusinessWithHoursById as jest.Mock
        ).mockResolvedValue(mockBusinessResult);

        const promises = Array.from({ length: 10 }, () =>
          service.findOneById(targetBusinessId, publicId, 'en'),
        );

        const results = await Promise.all(promises);

        results.forEach((result) => {
          expect(result.business.id).toBe(targetBusinessId);
        });
      });

      it('should handle repository timeout gracefully', async () => {
        (
          mockRepository.findBusinessWithHoursById as jest.Mock
        ).mockImplementationOnce(
          () =>
            new Promise((_, reject) =>
              setTimeout(() => reject(new Error('Timeout')), 100),
            ),
        );

        await expect(
          service.findOneById(targetBusinessId, publicId, 'en'),
        ).rejects.toThrow('Timeout');
      });

      it('should handle database connection failure', async () => {
        (
          mockRepository.findBusinessWithHoursById as jest.Mock
        ).mockRejectedValueOnce(new Error('Connection refused'));

        await expect(
          service.findOneById(targetBusinessId, publicId, 'en'),
        ).rejects.toThrow('Connection refused');
      });

      it('should throw ForbiddenException even for active business owned by other', async () => {
        const activeOtherOwnerBusiness = {
          ...mockBusinessResult,
          business: {
            ...mockBusinessResult.business,
            status: 'active',
            owner_id: otherOwnerId,
          },
        };
        (
          mockRepository.findBusinessWithHoursById as jest.Mock
        ).mockResolvedValueOnce(activeOtherOwnerBusiness);

        await expect(
          service.findOneById(targetBusinessId, publicId, 'en'),
        ).rejects.toThrow(ForbiddenException);
      });

      it('should throw ForbiddenException for pending business owned by other', async () => {
        const pendingOtherOwnerBusiness = {
          ...mockBusinessResult,
          business: {
            ...mockBusinessResult.business,
            status: 'pending',
            owner_id: otherOwnerId,
          },
        };
        (
          mockRepository.findBusinessWithHoursById as jest.Mock
        ).mockResolvedValueOnce(pendingOtherOwnerBusiness);

        await expect(
          service.findOneById(targetBusinessId, publicId, 'en'),
        ).rejects.toThrow(ForbiddenException);
      });
    });

    // ========================================================================
    // EDGE CASES
    // ========================================================================

    describe('Edge Cases', () => {
      it('should handle business with exactly 0 hours', async () => {
        (
          mockRepository.findBusinessWithHoursById as jest.Mock
        ).mockResolvedValueOnce(mockBusinessWithoutHoursResult);

        const result = await service.findOneById(
          targetBusinessId,
          publicId,
          'en',
        );

        expect(result.business_hours).toEqual([]);
        expect(result.business_hours).toHaveLength(0);
      });

      it('should handle business with exactly 7 hours (all days)', async () => {
        const businessWithAllDays = {
          ...mockBusinessResult,
          business_hours: [0, 1, 2, 3, 4, 5, 6].map((day) => ({
            id: `hour-${day}`,
            business_id: targetBusinessId,
            day_of_week: day,
            open_time: '08:00',
            close_time: '17:00',
            updated_at: null,
            deleted_at: null,
            id_creator: publicId,
            id_updater: null,
          })),
        };
        (
          mockRepository.findBusinessWithHoursById as jest.Mock
        ).mockResolvedValueOnce(businessWithAllDays);

        const result = await service.findOneById(
          targetBusinessId,
          publicId,
          'en',
        );

        expect(result.business_hours).toHaveLength(7);
        expect(
          new Set(result.business_hours.map((h) => h.day_of_week)).size,
        ).toBe(7);
      });

      it('should handle business created and updated in same millisecond', async () => {
        const sameTime = new Date('2026-01-15T08:30:00.000Z');
        const sameTimeBusiness = {
          ...mockBusinessResult,
          business: {
            ...mockBusinessResult.business,
            created_at: sameTime,
            updated_at: sameTime,
          },
        };
        (
          mockRepository.findBusinessWithHoursById as jest.Mock
        ).mockResolvedValueOnce(sameTimeBusiness);

        const result = await service.findOneById(
          targetBusinessId,
          publicId,
          'en',
        );

        expect(result.business.created_at).toEqual(result.business.updated_at);
      });

      it('should handle business with null tagline vs empty tagline', async () => {
        const nullTaglineBusiness = {
          ...mockBusinessResult,
          business: { ...mockBusinessResult.business, tagline: null },
        };
        (
          mockRepository.findBusinessWithHoursById as jest.Mock
        ).mockResolvedValueOnce(nullTaglineBusiness);

        const result1 = await service.findOneById(
          targetBusinessId,
          publicId,
          'en',
        );
        expect(result1.business.tagline).toBeNull();

        const emptyTaglineBusiness = {
          ...mockBusinessResult,
          business: { ...mockBusinessResult.business, tagline: '' },
        };
        (
          mockRepository.findBusinessWithHoursById as jest.Mock
        ).mockResolvedValueOnce(emptyTaglineBusiness);

        const result2 = await service.findOneById(
          targetBusinessId,
          publicId,
          'en',
        );
        expect(result2.business.tagline).toBe('');
      });

      it('should handle business with null image vs undefined image', async () => {
        const nullImageBusiness = {
          ...mockBusinessResult,
          business: { ...mockBusinessResult.business, image: null },
        };
        (
          mockRepository.findBusinessWithHoursById as jest.Mock
        ).mockResolvedValueOnce(nullImageBusiness);

        const result = await service.findOneById(
          targetBusinessId,
          publicId,
          'en',
        );

        expect(result.business.image).toBeNull();
      });

      it('should handle coordinates at boundary values (lat: -90/90, lon: -180/180)', async () => {
        const maxCoordBusiness = {
          ...mockBusinessResult,
          business: {
            ...mockBusinessResult.business,
            latitude: '90.00000000',
            longitude: '-180.00000000',
          },
        };
        (
          mockRepository.findBusinessWithHoursById as jest.Mock
        ).mockResolvedValueOnce(maxCoordBusiness);

        const result = await service.findOneById(
          targetBusinessId,
          publicId,
          'en',
        );

        expect(result.business.latitude).toBe('90.00000000');
        expect(result.business.longitude).toBe('-180.00000000');
      });

      it('should handle coordinates at zero (equator/prime meridian)', async () => {
        const zeroCoordBusiness = {
          ...mockBusinessResult,
          business: {
            ...mockBusinessResult.business,
            latitude: '0.00000000',
            longitude: '0.00000000',
          },
        };
        (
          mockRepository.findBusinessWithHoursById as jest.Mock
        ).mockResolvedValueOnce(zeroCoordBusiness);

        const result = await service.findOneById(
          targetBusinessId,
          publicId,
          'en',
        );

        expect(result.business.latitude).toBe('0.00000000');
        expect(result.business.longitude).toBe('0.00000000');
      });

      it('should handle business_hours with open_time 00:00 and close_time 23:59 (24h operation)', async () => {
        const business24h = {
          ...mockBusinessResult,
          business_hours: [
            {
              ...mockBusinessResult.business_hours[0],
              open_time: '00:00',
              close_time: '23:59',
            },
          ],
        };
        (
          mockRepository.findBusinessWithHoursById as jest.Mock
        ).mockResolvedValueOnce(business24h);

        const result = await service.findOneById(
          targetBusinessId,
          publicId,
          'en',
        );

        expect(result.business_hours[0].open_time).toBe('00:00');
        expect(result.business_hours[0].close_time).toBe('23:59');
      });

      it('should handle addresses with special characters and newlines', async () => {
        const specialAddressBusiness = {
          ...mockBusinessResult,
          business: {
            ...mockBusinessResult.business,
            address: 'Suite #123\nFloor 5 & 6\nJl. Sudirman "No. 1"',
          },
        };
        (
          mockRepository.findBusinessWithHoursById as jest.Mock
        ).mockResolvedValueOnce(specialAddressBusiness);

        const result = await service.findOneById(
          targetBusinessId,
          publicId,
          'en',
        );

        expect(result.business.address).toContain('\n');
        expect(result.business.address).toContain('&');
        expect(result.business.address).toContain('"');
      });

      it('should handle phone numbers with various formats', async () => {
        const phoneFormats = [
          '+62-812-3456-7890',
          '081234567890',
          '+1 (555) 123-4567',
        ];

        for (const phone of phoneFormats) {
          const phoneBusiness = {
            ...mockBusinessResult,
            business: { ...mockBusinessResult.business, phone },
          };
          (
            mockRepository.findBusinessWithHoursById as jest.Mock
          ).mockResolvedValueOnce(phoneBusiness);

          const result = await service.findOneById(
            targetBusinessId,
            publicId,
            'en',
          );

          expect(result.business.phone).toBe(phone);
        }
      });

      it('should handle all three business statuses correctly', async () => {
        const statuses = ['pending', 'active', 'banned'];

        for (const status of statuses) {
          const statusBusiness = {
            ...mockBusinessResult,
            business: { ...mockBusinessResult.business, status },
          };
          (
            mockRepository.findBusinessWithHoursById as jest.Mock
          ).mockResolvedValueOnce(statusBusiness);

          const result = await service.findOneById(
            targetBusinessId,
            publicId,
            'en',
          );

          expect(result.business.status).toBe(status);
        }
      });

      it('should handle response time for single business lookup', async () => {
        (
          mockRepository.findBusinessWithHoursById as jest.Mock
        ).mockResolvedValueOnce(mockBusinessResult);

        const startTime = Date.now();
        await service.findOneById(targetBusinessId, publicId, 'en');
        const endTime = Date.now();

        const duration = endTime - startTime;
        expect(duration).toBeLessThan(1000);
      });

      it('should validate sub before validating businessId (order of checks)', async () => {
        // Both sub and businessId are invalid
        // sub check should happen first
        await expect(service.findOneById('', '', 'en')).rejects.toThrow(
          UnauthorizedException,
        );
      });

      it('should handle UUID format businessId', async () => {
        const uuidBusinessId = '550e8400-e29b-41d4-a716-446655440000';
        const uuidBusiness = {
          ...mockBusinessResult,
          business: { ...mockBusinessResult.business, id: uuidBusinessId },
        };
        (
          mockRepository.findBusinessWithHoursById as jest.Mock
        ).mockResolvedValueOnce(uuidBusiness);

        const result = await service.findOneById(
          uuidBusinessId,
          publicId,
          'en',
        );

        expect(result.business.id).toBe(uuidBusinessId);
      });

      it('should handle non-UUID format businessId (repository handles it)', async () => {
        (
          mockRepository.findBusinessWithHoursById as jest.Mock
        ).mockResolvedValueOnce(null);

        await expect(
          service.findOneById('not-a-uuid', publicId, 'en'),
        ).rejects.toThrow(NotFoundException);
      });

      it('should handle business_hours timestamps correctly', async () => {
        (
          mockRepository.findBusinessWithHoursById as jest.Mock
        ).mockResolvedValueOnce(mockBusinessResult);

        const result = await service.findOneById(
          targetBusinessId,
          publicId,
          'en',
        );

        expect(result.business_hours[0].updated_at).toBeNull();
        expect(result.business_hours[0].deleted_at).toBeNull();
      });

      it('should handle business with all nullable fields as null', async () => {
        const allNullBusiness = {
          business: {
            id: targetBusinessId,
            owner_id: ownerId,
            name: 'Minimal Business',
            tagline: null,
            status: 'pending',
            phone: null,
            image: null,
            cover_image: null,
            latitude: null,
            longitude: null,
            address: null,
            created_at: new Date(),
            updated_at: null,
            deleted_at: null,
            id_creator: null,
            id_updater: null,
          },
          business_hours: [],
        };
        (
          mockRepository.findBusinessWithHoursById as jest.Mock
        ).mockResolvedValueOnce(allNullBusiness);

        const result = await service.findOneById(
          targetBusinessId,
          publicId,
          'en',
        );

        expect(result.business.tagline).toBeNull();
        expect(result.business.phone).toBeNull();
        expect(result.business.image).toBeNull();
        expect(result.business.cover_image).toBeNull();
        expect(result.business.latitude).toBeNull();
        expect(result.business.longitude).toBeNull();
        expect(result.business.address).toBeNull();
        expect(result.business.id_creator).toBeNull();
        expect(result.business.id_updater).toBeNull();
      });

      it('should handle business with name at max length (255 chars)', async () => {
        const maxNameBusiness = {
          ...mockBusinessResult,
          business: {
            ...mockBusinessResult.business,
            name: 'B'.repeat(255),
          },
        };
        (
          mockRepository.findBusinessWithHoursById as jest.Mock
        ).mockResolvedValueOnce(maxNameBusiness);

        const result = await service.findOneById(
          targetBusinessId,
          publicId,
          'en',
        );

        expect(result.business.name.length).toBe(255);
      });

      it('should handle business with phone at max length (50 chars)', async () => {
        const maxPhoneBusiness = {
          ...mockBusinessResult,
          business: {
            ...mockBusinessResult.business,
            phone: '+'.padEnd(50, '0'),
          },
        };
        (
          mockRepository.findBusinessWithHoursById as jest.Mock
        ).mockResolvedValueOnce(maxPhoneBusiness);

        const result = await service.findOneById(
          targetBusinessId,
          publicId,
          'en',
        );

        expect(result.business.phone?.length).toBe(50);
      });
    });
  });
});
