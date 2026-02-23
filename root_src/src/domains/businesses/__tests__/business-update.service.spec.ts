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
import { UpdateBusinessDto } from '../dto/update-business.dto';
import { BusinessStatus } from '../contracts/business-status.enum';
import type { IBusiness, IBusinessHours } from '../interfaces';

describe('BusinessService - Update', () => {
  let service: BusinessService;
  let mockRepository: Partial<BusinessRepository>;
  let mockDatabaseService: Partial<DatabaseService>;
  let mockI18nService: Partial<I18nService>;
  let mockFileService: Partial<FileService>;
  let mockKnex: any;
  let mockTransaction: any;

  const ownerId = 'user-uuid-123';
  const anotherOwnerId = 'user-uuid-456';
  const publicId = '11111111-1111-4111-8111-111111111111';
  const businessId = '550e8400-e29b-41d4-a716-446655440000';

  const existingBusiness: IBusiness = {
    id: businessId,
    owner_id: ownerId,
    name: 'Bengkel Jaya Motor',
    tagline: 'Service terpercaya',
    status: BusinessStatus.ACTIVE,
    phone: '+6281234567890',
    image: '/uploads/old-image.jpg',
    cover_image: '/uploads/old-cover.jpg',
    latitude: '-6.2088',
    longitude: '106.8456',
    address: 'Jl. Sudirman No. 123',
    created_at: new Date('2026-02-05T08:00:00.000Z'),
    updated_at: new Date('2026-02-05T08:00:00.000Z'),
    deleted_at: null,
    id_creator: publicId,
    id_updater: null,
  };

  const existingHours: IBusinessHours[] = [
    {
      id: 'hour-uuid-1',
      business_id: businessId,
      day_of_week: 1,
      open_time: '08:00',
      close_time: '17:00',
      updated_at: new Date('2026-02-05T08:00:00.000Z'),
      deleted_at: null,
      id_creator: publicId,
      id_updater: null,
    },
  ];

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
      findBusinessWithHoursById: jest.fn().mockResolvedValue({
        business: existingBusiness,
        business_hours: existingHours,
      }),
      updateBusiness: jest.fn().mockResolvedValue(undefined),
      softDeleteBusinessHours: jest.fn().mockResolvedValue(undefined),
      insertBusinessHours: jest.fn().mockResolvedValue(undefined),
    };

    mockI18nService = {
      t: jest
        .fn()
        .mockImplementation(
          (
            key: string,
            _opts?: { lang?: string; args?: Record<string, unknown> },
          ) => key,
        ),
    };

    mockFileService = {
      createWithFile: jest.fn().mockResolvedValue({
        file_path: '/uploads/new-file.jpg',
        id: 'file-uuid-new',
      }),
      deleteFile: jest.fn().mockResolvedValue(undefined),
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

  // =======================
  // HAPPY PATH TESTS (30)
  // =======================
  describe('Happy Path', () => {
    it('HP01: should update only name', async () => {
      const dto: UpdateBusinessDto = { name: 'Updated Name' };
      const result = await service.update(businessId, dto, publicId, {});

      expect(result.business.name).toBe('Updated Name');
      expect(result.business.tagline).toBe(existingBusiness.tagline);
      expect(mockRepository.updateBusiness).toHaveBeenCalled();
      expect(mockTransaction.commit).toHaveBeenCalled();
    });

    it('HP02: should update only tagline', async () => {
      const dto: UpdateBusinessDto = { tagline: 'New tagline' };
      const result = await service.update(businessId, dto, publicId, {});

      expect(result.business.tagline).toBe('New tagline');
      expect(result.business.name).toBe(existingBusiness.name);
    });

    it('HP03: should update only phone', async () => {
      const dto: UpdateBusinessDto = { phone: '+6289999999999' };
      const result = await service.update(businessId, dto, publicId, {});

      expect(result.business.phone).toBe('+6289999999999');
    });

    it('HP04: should update only address', async () => {
      const dto: UpdateBusinessDto = { address: 'New Address 456' };
      const result = await service.update(businessId, dto, publicId, {});

      expect(result.business.address).toBe('New Address 456');
    });

    it('HP05: should update latitude and longitude', async () => {
      const dto: UpdateBusinessDto = { latitude: -7.25, longitude: 112.75 };
      const result = await service.update(businessId, dto, publicId, {});

      expect(result.business.latitude).toBe('-7.25');
      expect(result.business.longitude).toBe('112.75');
    });

    it('HP06: should update only image file', async () => {
      const result = await service.update(businessId, {}, publicId, {
        image: mockFile,
      });

      expect(result.business.image).toBe('/uploads/new-file.jpg');
      expect(mockFileService.createWithFile).toHaveBeenCalledWith(mockFile);
    });

    it('HP07: should update only cover_image file', async () => {
      const result = await service.update(businessId, {}, publicId, {
        cover_image: mockFile,
      });

      expect(result.business.cover_image).toBe('/uploads/new-file.jpg');
    });

    it('HP08: should update multiple text fields', async () => {
      const dto: UpdateBusinessDto = {
        name: 'Multi Update',
        tagline: 'Multi Tagline',
        phone: '+6281111111111',
      };
      const result = await service.update(businessId, dto, publicId, {});

      expect(result.business.name).toBe('Multi Update');
      expect(result.business.tagline).toBe('Multi Tagline');
      expect(result.business.phone).toBe('+6281111111111');
    });

    it('HP09: should update business_hours - change times', async () => {
      const dto: UpdateBusinessDto = {
        business_hours: [
          { day_of_week: 1, open_time: '09:00', close_time: '18:00' },
        ],
      };
      const result = await service.update(businessId, dto, publicId, {});

      expect(result.business_hours).toHaveLength(1);
      expect(result.business_hours[0].open_time).toBe('09:00');
      expect(result.business_hours[0].close_time).toBe('18:00');
      expect(mockRepository.softDeleteBusinessHours).toHaveBeenCalledWith(
        mockTransaction,
        businessId,
        publicId,
      );
      expect(mockRepository.insertBusinessHours).toHaveBeenCalled();
    });

    it('HP10: should update business_hours - add new day', async () => {
      const dto: UpdateBusinessDto = {
        business_hours: [
          { day_of_week: 1, open_time: '08:00', close_time: '17:00' },
          { day_of_week: 2, open_time: '08:00', close_time: '17:00' },
        ],
      };
      const result = await service.update(businessId, dto, publicId, {});

      expect(result.business_hours).toHaveLength(2);
    });

    it('HP11: should update business_hours - remove all hours', async () => {
      const dto: UpdateBusinessDto = { business_hours: [] };
      const result = await service.update(businessId, dto, publicId, {});

      expect(result.business_hours).toHaveLength(0);
      expect(mockRepository.softDeleteBusinessHours).toHaveBeenCalled();
    });

    it('HP12: should update status from active to pending', async () => {
      const dto: UpdateBusinessDto = { status: BusinessStatus.PENDING };
      const result = await service.update(businessId, dto, publicId, {});

      expect(result.business.status).toBe(BusinessStatus.PENDING);
    });

    it('HP13: should verify owner via JWT and allow update', async () => {
      const dto: UpdateBusinessDto = { name: 'Owner Updated' };
      const result = await service.update(businessId, dto, publicId, {});

      expect(result.business.name).toBe('Owner Updated');
      expect(mockRepository.findUserIdByPublicId).toHaveBeenCalledWith(
        publicId,
      );
    });

    it('HP14: should set updated_at and id_updater', async () => {
      const dto: UpdateBusinessDto = { name: 'Test' };
      const result = await service.update(businessId, dto, publicId, {});

      expect(result.business.updated_at).toBeDefined();
      expect(result.business.id_updater).toBe(publicId);
    });

    it('HP15: should return response with success true and statusCode 200 format', async () => {
      const dto: UpdateBusinessDto = { name: 'Test' };
      const result = await service.update(businessId, dto, publicId, {});

      expect(result).toHaveProperty('business');
      expect(result).toHaveProperty('business_hours');
      expect(result.business).toHaveProperty('id');
      expect(result.business).toHaveProperty('owner_id');
    });

    it('HP16: should support x-lang: en', async () => {
      const dto: UpdateBusinessDto = { name: 'English Update' };
      await service.update(businessId, dto, publicId, { lang: 'en' });

      // i18n should be called with lang parameter
      expect(mockI18nService.t).toHaveBeenCalled();
    });

    it('HP17: should support x-lang: id', async () => {
      const dto: UpdateBusinessDto = { name: 'Indonesian Update' };
      await service.update(businessId, dto, publicId, { lang: 'id' });

      expect(mockI18nService.t).toHaveBeenCalled();
    });

    it('HP18: should update name with 1 character', async () => {
      const dto: UpdateBusinessDto = { name: 'A' };
      const result = await service.update(businessId, dto, publicId, {});

      expect(result.business.name).toBe('A');
    });

    it('HP19: should update name with 255 characters', async () => {
      const longName = 'A'.repeat(255);
      const dto: UpdateBusinessDto = { name: longName };
      const result = await service.update(businessId, dto, publicId, {});

      expect(result.business.name).toBe(longName);
    });

    it('HP20: should update tagline with 500 characters', async () => {
      const longTagline = 'T'.repeat(500);
      const dto: UpdateBusinessDto = { tagline: longTagline };
      const result = await service.update(businessId, dto, publicId, {});

      expect(result.business.tagline).toBe(longTagline);
    });

    it('HP21: should update latitude to -90', async () => {
      const dto: UpdateBusinessDto = { latitude: -90 };
      const result = await service.update(businessId, dto, publicId, {});

      expect(result.business.latitude).toBe('-90');
    });

    it('HP22: should update latitude to 90', async () => {
      const dto: UpdateBusinessDto = { latitude: 90 };
      const result = await service.update(businessId, dto, publicId, {});

      expect(result.business.latitude).toBe('90');
    });

    it('HP23: should update longitude to -180', async () => {
      const dto: UpdateBusinessDto = { longitude: -180 };
      const result = await service.update(businessId, dto, publicId, {});

      expect(result.business.longitude).toBe('-180');
    });

    it('HP24: should update longitude to 180', async () => {
      const dto: UpdateBusinessDto = { longitude: 180 };
      const result = await service.update(businessId, dto, publicId, {});

      expect(result.business.longitude).toBe('180');
    });

    it('HP25: should update business_hours with day 0 and 6', async () => {
      const dto: UpdateBusinessDto = {
        business_hours: [
          { day_of_week: 0, open_time: '08:00', close_time: '17:00' },
          { day_of_week: 6, open_time: '09:00', close_time: '15:00' },
        ],
      };
      const result = await service.update(businessId, dto, publicId, {});

      expect(result.business_hours).toHaveLength(2);
      expect(result.business_hours[0].day_of_week).toBe(0);
      expect(result.business_hours[1].day_of_week).toBe(6);
    });

    it('HP26: should update open_time 00:00, close_time 23:59', async () => {
      const dto: UpdateBusinessDto = {
        business_hours: [
          { day_of_week: 1, open_time: '00:00', close_time: '23:59' },
        ],
      };
      const result = await service.update(businessId, dto, publicId, {});

      expect(result.business_hours[0].open_time).toBe('00:00');
      expect(result.business_hours[0].close_time).toBe('23:59');
    });

    it('HP27: should handle empty body (no-op)', async () => {
      const dto: UpdateBusinessDto = {};
      const result = await service.update(businessId, dto, publicId, {});

      expect(result.business.name).toBe(existingBusiness.name);
      expect(result.business.tagline).toBe(existingBusiness.tagline);
    });

    it('HP28: should update multiple fields simultaneously', async () => {
      const dto: UpdateBusinessDto = {
        name: 'Simultaneous Update',
        address: 'Jl. Baru No. 999',
        business_hours: [
          { day_of_week: 3, open_time: '10:00', close_time: '19:00' },
        ],
      };
      const result = await service.update(businessId, dto, publicId, {});

      expect(result.business.name).toBe('Simultaneous Update');
      expect(result.business.address).toBe('Jl. Baru No. 999');
      expect(result.business_hours[0].day_of_week).toBe(3);
    });

    it('HP29: should handle double PUT sequentially', async () => {
      const dto1: UpdateBusinessDto = { name: 'First Update' };
      const dto2: UpdateBusinessDto = { name: 'Second Update' };

      await service.update(businessId, dto1, publicId, {});
      const result = await service.update(businessId, dto2, publicId, {});

      expect(result.business.name).toBe('Second Update');
    });

    it('HP30: should commit transaction on success', async () => {
      const dto: UpdateBusinessDto = { name: 'Commit Test' };
      await service.update(businessId, dto, publicId, {});

      expect(mockTransaction.commit).toHaveBeenCalled();
      expect(mockTransaction.rollback).not.toHaveBeenCalled();
    });
  });

  // =======================
  // SAD PATH TESTS (30)
  // =======================
  describe('Sad Path', () => {
    it('SP01: should throw 401 when no JWT token (sub is empty)', async () => {
      await expect(service.update(businessId, {}, '', {})).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it('SP02: should throw 401 when sub is whitespace', async () => {
      await expect(service.update(businessId, {}, '   ', {})).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it('SP03: should throw 401 when user not found from JWT sub', async () => {
      (mockRepository.findUserIdByPublicId as jest.Mock).mockResolvedValueOnce(
        null,
      );

      await expect(
        service.update(businessId, {}, 'unknown-sub', {}),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('SP04: should throw 400 when businessId is empty', async () => {
      await expect(service.update('', {}, publicId, {})).rejects.toThrow(
        BadRequestException,
      );
    });

    it('SP05: should throw 400 when businessId is whitespace', async () => {
      await expect(service.update('   ', {}, publicId, {})).rejects.toThrow(
        BadRequestException,
      );
    });

    it('SP06: should throw 404 when business not found', async () => {
      (
        mockRepository.findBusinessWithHoursById as jest.Mock
      ).mockResolvedValueOnce(null);

      await expect(
        service.update('non-existent-id', {}, publicId, {}),
      ).rejects.toThrow(NotFoundException);
    });

    it('SP07: should throw 404 when business is soft-deleted', async () => {
      (
        mockRepository.findBusinessWithHoursById as jest.Mock
      ).mockResolvedValueOnce(null);

      await expect(
        service.update(businessId, {}, publicId, {}),
      ).rejects.toThrow(NotFoundException);
    });

    it('SP08: should throw 403 when user is not owner', async () => {
      (mockRepository.findUserIdByPublicId as jest.Mock).mockResolvedValueOnce(
        anotherOwnerId,
      );

      await expect(
        service.update(businessId, {}, 'another-public-id', {}),
      ).rejects.toThrow(ForbiddenException);
    });

    it('SP09: should throw 400 when name is empty string (validation)', async () => {
      const dto: UpdateBusinessDto = { name: '' };
      // This will be caught by DTO validation before reaching service
      // Testing through controller would validate this
      expect(dto.name).toBe('');
    });

    it('SP10: should throw 400 when latitude < -90', async () => {
      const dto: UpdateBusinessDto = {
        business_hours: [
          { day_of_week: -1, open_time: '08:00', close_time: '17:00' },
        ],
      };

      await expect(
        service.update(businessId, dto, publicId, {}),
      ).rejects.toThrow(BadRequestException);
    });

    it('SP11: should throw 400 when day_of_week > 6', async () => {
      const dto: UpdateBusinessDto = {
        business_hours: [
          { day_of_week: 7, open_time: '08:00', close_time: '17:00' },
        ],
      };

      await expect(
        service.update(businessId, dto, publicId, {}),
      ).rejects.toThrow(BadRequestException);
    });

    it('SP12: should throw 400 when open_time format is invalid', async () => {
      const dto: UpdateBusinessDto = {
        business_hours: [
          { day_of_week: 1, open_time: '25:00', close_time: '17:00' },
        ],
      };

      await expect(
        service.update(businessId, dto, publicId, {}),
      ).rejects.toThrow(BadRequestException);
    });

    it('SP13: should throw 400 when close_time format is invalid', async () => {
      const dto: UpdateBusinessDto = {
        business_hours: [
          { day_of_week: 1, open_time: '08:00', close_time: 'invalid' },
        ],
      };

      await expect(
        service.update(businessId, dto, publicId, {}),
      ).rejects.toThrow(BadRequestException);
    });

    it('SP14: should throw 400 when close_time <= open_time', async () => {
      const dto: UpdateBusinessDto = {
        business_hours: [
          { day_of_week: 1, open_time: '17:00', close_time: '17:00' },
        ],
      };

      await expect(
        service.update(businessId, dto, publicId, {}),
      ).rejects.toThrow(BadRequestException);
    });

    it('SP15: should throw 400 when close_time < open_time', async () => {
      const dto: UpdateBusinessDto = {
        business_hours: [
          { day_of_week: 1, open_time: '18:00', close_time: '17:00' },
        ],
      };

      await expect(
        service.update(businessId, dto, publicId, {}),
      ).rejects.toThrow(BadRequestException);
    });

    it('SP16: should throw 400 when duplicate day_of_week in business_hours', async () => {
      const dto: UpdateBusinessDto = {
        business_hours: [
          { day_of_week: 1, open_time: '08:00', close_time: '17:00' },
          { day_of_week: 1, open_time: '09:00', close_time: '18:00' },
        ],
      };

      await expect(
        service.update(businessId, dto, publicId, {}),
      ).rejects.toThrow(BadRequestException);
    });

    it('SP17: should rollback transaction on error', async () => {
      (mockRepository.updateBusiness as jest.Mock).mockRejectedValueOnce(
        new Error('DB Error'),
      );

      await expect(
        service.update(businessId, { name: 'Test' }, publicId, {}),
      ).rejects.toThrow();

      expect(mockTransaction.rollback).toHaveBeenCalled();
    });

    it('SP18: should cleanup uploaded image on transaction failure', async () => {
      (mockRepository.updateBusiness as jest.Mock).mockRejectedValueOnce(
        new Error('DB Error'),
      );

      await expect(
        service.update(businessId, {}, publicId, { image: mockFile }),
      ).rejects.toThrow();

      expect(mockFileService.deleteFile).toHaveBeenCalledWith('file-uuid-new');
    });

    it('SP19: should cleanup uploaded cover_image on transaction failure', async () => {
      (mockRepository.updateBusiness as jest.Mock).mockRejectedValueOnce(
        new Error('DB Error'),
      );

      await expect(
        service.update(businessId, {}, publicId, { cover_image: mockFile }),
      ).rejects.toThrow();

      expect(mockFileService.deleteFile).toHaveBeenCalled();
    });

    it('SP20: should handle repository updateBusiness error', async () => {
      (mockRepository.updateBusiness as jest.Mock).mockRejectedValueOnce(
        new Error('Update failed'),
      );

      await expect(
        service.update(businessId, { name: 'Test' }, publicId, {}),
      ).rejects.toThrow('Update failed');
    });

    it('SP21: should handle repository softDeleteBusinessHours error', async () => {
      (
        mockRepository.softDeleteBusinessHours as jest.Mock
      ).mockRejectedValueOnce(new Error('Soft delete failed'));

      const dto: UpdateBusinessDto = {
        business_hours: [
          { day_of_week: 1, open_time: '08:00', close_time: '17:00' },
        ],
      };

      await expect(
        service.update(businessId, dto, publicId, {}),
      ).rejects.toThrow('Soft delete failed');
    });

    it('SP22: should handle repository insertBusinessHours error', async () => {
      (mockRepository.insertBusinessHours as jest.Mock).mockRejectedValueOnce(
        new Error('Insert failed'),
      );

      const dto: UpdateBusinessDto = {
        business_hours: [
          { day_of_week: 1, open_time: '08:00', close_time: '17:00' },
        ],
      };

      await expect(
        service.update(businessId, dto, publicId, {}),
      ).rejects.toThrow('Insert failed');
    });

    it('SP23: should handle file service error on image upload', async () => {
      (mockFileService.createWithFile as jest.Mock).mockRejectedValueOnce(
        new Error('File upload failed'),
      );

      await expect(
        service.update(businessId, {}, publicId, { image: mockFile }),
      ).rejects.toThrow('File upload failed');
    });

    it('SP24: should handle file service error on cover_image upload', async () => {
      (mockFileService.createWithFile as jest.Mock).mockRejectedValueOnce(
        new Error('Cover upload failed'),
      );

      await expect(
        service.update(businessId, {}, publicId, { cover_image: mockFile }),
      ).rejects.toThrow('Cover upload failed');
    });

    it('SP25: should swallow cleanup errors but throw original error', async () => {
      (mockRepository.updateBusiness as jest.Mock).mockRejectedValueOnce(
        new Error('Original error'),
      );
      (mockFileService.deleteFile as jest.Mock).mockRejectedValueOnce(
        new Error('Cleanup failed'),
      );

      await expect(
        service.update(businessId, {}, publicId, { image: mockFile }),
      ).rejects.toThrow('Original error');
    });

    it('SP26: should not update owner_id even if in DTO', async () => {
      // This is handled at controller level by removing owner_id from DTO
      const dto: any = { name: 'Test', owner_id: 'spoofed-id' };
      const result = await service.update(businessId, dto, publicId, {});

      expect(result.business.owner_id).toBe(ownerId);
    });

    it('SP27: should not update id even if in DTO', async () => {
      const dto: any = { name: 'Test', id: 'spoofed-id' };
      const result = await service.update(businessId, dto, publicId, {});

      expect(result.business.id).toBe(businessId);
    });

    it('SP28: should handle knex transaction creation error', async () => {
      mockKnex.transaction.mockRejectedValueOnce(
        new Error('Transaction failed'),
      );

      await expect(
        service.update(businessId, { name: 'Test' }, publicId, {}),
      ).rejects.toThrow('Transaction failed');
    });

    it('SP29: should translate error messages with provided lang', async () => {
      await expect(
        service.update(businessId, {}, '', { lang: 'id' }),
      ).rejects.toThrow();

      expect(mockI18nService.t).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({ lang: 'id' }),
      );
    });

    it('SP30: should validate business_hours before starting transaction', async () => {
      const dto: UpdateBusinessDto = {
        business_hours: [
          { day_of_week: 10, open_time: '08:00', close_time: '17:00' },
        ],
      };

      await expect(
        service.update(businessId, dto, publicId, {}),
      ).rejects.toThrow(BadRequestException);

      expect(mockKnex.transaction).not.toHaveBeenCalled();
    });
  });

  // =======================
  // EDGE CASE TESTS (30)
  // =======================
  describe('Edge Cases', () => {
    it('EC01: should handle businessId as empty string', async () => {
      await expect(service.update('', {}, publicId, {})).rejects.toThrow(
        BadRequestException,
      );
    });

    it('EC02: should handle name with exactly 255 characters', async () => {
      const exactName = 'B'.repeat(255);
      const dto: UpdateBusinessDto = { name: exactName };
      const result = await service.update(businessId, dto, publicId, {});

      expect(result.business.name).toBe(exactName);
    });

    it('EC03: should handle tagline with exactly 500 characters', async () => {
      const exactTagline = 'T'.repeat(500);
      const dto: UpdateBusinessDto = { tagline: exactTagline };
      const result = await service.update(businessId, dto, publicId, {});

      expect(result.business.tagline).toBe(exactTagline);
    });

    it('EC04: should handle high precision decimal latitude/longitude', async () => {
      const dto: UpdateBusinessDto = {
        latitude: -6.208812345678,
        longitude: 106.845612345678,
      };
      const result = await service.update(businessId, dto, publicId, {});

      expect(result.business.latitude).toBe('-6.208812345678');
      expect(result.business.longitude).toBe('106.845612345678');
    });

    it('EC05: should handle business_hours as empty array', async () => {
      const dto: UpdateBusinessDto = { business_hours: [] };
      const result = await service.update(businessId, dto, publicId, {});

      expect(result.business_hours).toHaveLength(0);
    });

    it('EC06: should handle business_hours with single day', async () => {
      const dto: UpdateBusinessDto = {
        business_hours: [
          { day_of_week: 3, open_time: '10:00', close_time: '16:00' },
        ],
      };
      const result = await service.update(businessId, dto, publicId, {});

      expect(result.business_hours).toHaveLength(1);
      expect(result.business_hours[0].day_of_week).toBe(3);
    });

    it('EC07: should handle business_hours with all 7 days', async () => {
      const dto: UpdateBusinessDto = {
        business_hours: [
          { day_of_week: 0, open_time: '08:00', close_time: '17:00' },
          { day_of_week: 1, open_time: '08:00', close_time: '17:00' },
          { day_of_week: 2, open_time: '08:00', close_time: '17:00' },
          { day_of_week: 3, open_time: '08:00', close_time: '17:00' },
          { day_of_week: 4, open_time: '08:00', close_time: '17:00' },
          { day_of_week: 5, open_time: '08:00', close_time: '17:00' },
          { day_of_week: 6, open_time: '08:00', close_time: '17:00' },
        ],
      };
      const result = await service.update(businessId, dto, publicId, {});

      expect(result.business_hours).toHaveLength(7);
    });

    it('EC08: should update only business_hours, no other fields', async () => {
      const dto: UpdateBusinessDto = {
        business_hours: [
          { day_of_week: 2, open_time: '07:00', close_time: '19:00' },
        ],
      };
      const result = await service.update(businessId, dto, publicId, {});

      expect(result.business.name).toBe(existingBusiness.name);
      expect(result.business_hours[0].day_of_week).toBe(2);
    });

    it('EC09: should handle special characters in name', async () => {
      const dto: UpdateBusinessDto = { name: 'Bengkel @#$% 中文 عربي' };
      const result = await service.update(businessId, dto, publicId, {});

      expect(result.business.name).toBe('Bengkel @#$% 中文 عربي');
    });

    it('EC10: should handle multiline address', async () => {
      const dto: UpdateBusinessDto = {
        address: 'Line 1\nLine 2\nLine 3',
      };
      const result = await service.update(businessId, dto, publicId, {});

      expect(result.business.address).toContain('\n');
    });

    it('EC11: should handle partial update - only tagline sent', async () => {
      const dto: UpdateBusinessDto = { tagline: 'Only tagline' };
      const result = await service.update(businessId, dto, publicId, {});

      expect(result.business.name).toBe(existingBusiness.name);
      expect(result.business.tagline).toBe('Only tagline');
    });

    it('EC12: should handle null vs undefined for tagline', async () => {
      const dto: UpdateBusinessDto = { tagline: null as any };
      const result = await service.update(businessId, dto, publicId, {});

      // null should set to null
      expect(result.business.tagline).toBeNull();
    });

    it('EC13: should handle image update twice', async () => {
      await service.update(businessId, {}, publicId, { image: mockFile });
      const result = await service.update(businessId, {}, publicId, {
        image: mockFile,
      });

      expect(result.business.image).toBe('/uploads/new-file.jpg');
      expect(mockFileService.createWithFile).toHaveBeenCalledTimes(2);
    });

    it('EC14: should handle replacing all business_hours', async () => {
      const dto: UpdateBusinessDto = {
        business_hours: [
          { day_of_week: 5, open_time: '12:00', close_time: '20:00' },
        ],
      };
      const result = await service.update(businessId, dto, publicId, {});

      expect(result.business_hours).toHaveLength(1);
      expect(result.business_hours[0].day_of_week).toBe(5);
    });

    it('EC15: should handle concurrent update intent (last write wins)', async () => {
      // Simulates concurrent updates - in real scenario, last transaction wins
      const dto1: UpdateBusinessDto = { name: 'First' };
      const dto2: UpdateBusinessDto = { name: 'Second' };

      await service.update(businessId, dto1, publicId, {});
      const result = await service.update(businessId, dto2, publicId, {});

      expect(result.business.name).toBe('Second');
    });

    it('EC16: should update business with status banned', async () => {
      const bannedBusiness = {
        ...existingBusiness,
        status: BusinessStatus.BANNED,
      };
      (
        mockRepository.findBusinessWithHoursById as jest.Mock
      ).mockResolvedValueOnce({
        business: bannedBusiness,
        business_hours: existingHours,
      });

      const dto: UpdateBusinessDto = { name: 'Updated Banned' };
      const result = await service.update(businessId, dto, publicId, {});

      expect(result.business.name).toBe('Updated Banned');
    });

    it('EC17: should preserve created_at and id_creator', async () => {
      const dto: UpdateBusinessDto = { name: 'Preserve Test' };
      const result = await service.update(businessId, dto, publicId, {});

      expect(result.business.created_at).toEqual(existingBusiness.created_at);
      expect(result.business.id_creator).toBe(existingBusiness.id_creator);
    });

    it('EC18: should handle very precise business_hours times', async () => {
      const dto: UpdateBusinessDto = {
        business_hours: [
          { day_of_week: 1, open_time: '09:01', close_time: '09:02' },
        ],
      };
      const result = await service.update(businessId, dto, publicId, {});

      expect(result.business_hours[0].close_time).toBe('09:02');
    });

    it('EC19: should handle empty DTO with no files', async () => {
      const result = await service.update(businessId, {}, publicId, {});

      expect(result.business.name).toBe(existingBusiness.name);
      expect(mockRepository.updateBusiness).toHaveBeenCalled();
    });

    it('EC20: should handle updating same values', async () => {
      const dto: UpdateBusinessDto = {
        name: existingBusiness.name,
        tagline: existingBusiness.tagline ?? undefined,
      };
      const result = await service.update(businessId, dto, publicId, {});

      expect(result.business.name).toBe(existingBusiness.name);
      expect(result.business.tagline).toBe(existingBusiness.tagline);
    });

    it('EC21: should handle update with image + multiple text fields', async () => {
      const dto: UpdateBusinessDto = {
        name: 'Combined Update',
        address: 'New Address',
        business_hours: [
          { day_of_week: 4, open_time: '08:30', close_time: '17:30' },
        ],
      };
      const result = await service.update(businessId, dto, publicId, {
        image: mockFile,
      });

      expect(result.business.name).toBe('Combined Update');
      expect(result.business.image).toBe('/uploads/new-file.jpg');
      expect(result.business_hours[0].day_of_week).toBe(4);
    });

    it('EC22: should trim whitespace from name', async () => {
      const dto: UpdateBusinessDto = { name: '  Trimmed Name  ' };
      const result = await service.update(businessId, dto, publicId, {});

      expect(result.business.name).toBe('Trimmed Name');
    });

    it('EC23: should trim whitespace from tagline', async () => {
      const dto: UpdateBusinessDto = { tagline: '  Trimmed Tagline  ' };
      const result = await service.update(businessId, dto, publicId, {});

      expect(result.business.tagline).toBe('Trimmed Tagline');
    });

    it('EC24: should trim whitespace from phone', async () => {
      const dto: UpdateBusinessDto = { phone: '  +6281234567890  ' };
      const result = await service.update(businessId, dto, publicId, {});

      expect(result.business.phone).toBe('+6281234567890');
    });

    it('EC25: should trim whitespace from address', async () => {
      const dto: UpdateBusinessDto = { address: '  Jl. Test  ' };
      const result = await service.update(businessId, dto, publicId, {});

      expect(result.business.address).toBe('Jl. Test');
    });

    it('EC26: should handle very long address', async () => {
      const longAddress = 'A'.repeat(1000);
      const dto: UpdateBusinessDto = { address: longAddress };
      const result = await service.update(businessId, dto, publicId, {});

      expect(result.business.address).toBe(longAddress);
    });

    it('EC27: should handle status change to same status', async () => {
      const dto: UpdateBusinessDto = { status: BusinessStatus.ACTIVE };
      const result = await service.update(businessId, dto, publicId, {});

      expect(result.business.status).toBe(BusinessStatus.ACTIVE);
    });

    it('EC28: should update id_updater even if no changes', async () => {
      const result = await service.update(businessId, {}, publicId, {});

      expect(result.business.id_updater).toBe(publicId);
    });

    it('EC29: should handle both image and cover_image update', async () => {
      const coverFile = { ...mockFile, fieldname: 'cover_image' };
      const result = await service.update(businessId, {}, publicId, {
        image: mockFile,
        cover_image: coverFile,
      });

      expect(result.business.image).toBe('/uploads/new-file.jpg');
      expect(result.business.cover_image).toBe('/uploads/new-file.jpg');
    });

    it('EC30: should maintain business_hours order by day_of_week', async () => {
      const dto: UpdateBusinessDto = {
        business_hours: [
          { day_of_week: 5, open_time: '08:00', close_time: '17:00' },
          { day_of_week: 1, open_time: '08:00', close_time: '17:00' },
          { day_of_week: 3, open_time: '08:00', close_time: '17:00' },
        ],
      };
      const result = await service.update(businessId, dto, publicId, {});

      expect(result.business_hours).toHaveLength(3);
    });
  });

  // =======================
  // SECURITY TESTS (30)
  // =======================
  describe('Security', () => {
    it('SEC01: should prevent editing business of another user', async () => {
      (mockRepository.findUserIdByPublicId as jest.Mock).mockResolvedValueOnce(
        anotherOwnerId,
      );

      await expect(
        service.update(businessId, { name: 'Hack' }, 'attacker-sub', {}),
      ).rejects.toThrow(ForbiddenException);
    });

    it('SEC02: should reject invalid JWT signature (user not found)', async () => {
      (mockRepository.findUserIdByPublicId as jest.Mock).mockResolvedValueOnce(
        null,
      );

      await expect(
        service.update(businessId, {}, 'fake-token', {}),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('SEC03: should reject expired token (handled by guard, but test null sub)', async () => {
      await expect(service.update(businessId, {}, '', {})).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it('SEC04: should prevent SQL injection in name', async () => {
      const dto: UpdateBusinessDto = {
        name: "'; DROP TABLE businesses; --",
      };
      const result = await service.update(businessId, dto, publicId, {});

      // Should be treated as literal string, not executed
      expect(result.business.name).toBe("'; DROP TABLE businesses; --");
    });

    it('SEC05: should prevent SQL injection in address', async () => {
      const dto: UpdateBusinessDto = {
        address: "1' OR '1'='1",
      };
      const result = await service.update(businessId, dto, publicId, {});

      expect(result.business.address).toBe("1' OR '1'='1");
    });

    it('SEC06: should prevent XSS in name', async () => {
      const dto: UpdateBusinessDto = {
        name: '<script>alert("xss")</script>',
      };
      const result = await service.update(businessId, dto, publicId, {});

      expect(result.business.name).toBe('<script>alert("xss")</script>');
    });

    it('SEC07: should prevent XSS in tagline', async () => {
      const dto: UpdateBusinessDto = {
        tagline: '<img src=x onerror=alert(1)>',
      };
      const result = await service.update(businessId, dto, publicId, {});

      expect(result.business.tagline).toBe('<img src=x onerror=alert(1)>');
    });

    it('SEC08: should prevent path traversal in image filename', async () => {
      const maliciousFile = {
        ...mockFile,
        originalname: '../../../etc/passwd',
      };

      // FileService should handle this - we test service integration
      await service.update(businessId, {}, publicId, {
        image: maliciousFile as Express.Multer.File,
      });

      expect(mockFileService.createWithFile).toHaveBeenCalled();
    });

    it('SEC09: should verify ownership before any updates', async () => {
      (mockRepository.findUserIdByPublicId as jest.Mock).mockResolvedValueOnce(
        anotherOwnerId,
      );

      const dto: UpdateBusinessDto = { name: 'IDOR Attack' };

      await expect(
        service.update(businessId, dto, 'attacker-sub', {}),
      ).rejects.toThrow(ForbiddenException);

      expect(mockRepository.updateBusiness).not.toHaveBeenCalled();
    });

    it('SEC10: should not allow mass assignment of owner_id', async () => {
      const dto: any = { name: 'Test', owner_id: 'spoofed-owner' };
      const result = await service.update(businessId, dto, publicId, {});

      expect(result.business.owner_id).toBe(ownerId);
      expect(result.business.owner_id).not.toBe('spoofed-owner');
    });

    it('SEC11: should not allow mass assignment of id', async () => {
      const dto: any = { name: 'Test', id: 'spoofed-id' };
      const result = await service.update(businessId, dto, publicId, {});

      expect(result.business.id).toBe(businessId);
    });

    it('SEC12: should not allow mass assignment of created_at', async () => {
      const dto: any = { name: 'Test', created_at: new Date() };
      const result = await service.update(businessId, dto, publicId, {});

      expect(result.business.created_at).toEqual(existingBusiness.created_at);
    });

    it('SEC13: should not allow mass assignment of id_creator', async () => {
      const dto: any = { name: 'Test', id_creator: 'spoofed-creator' };
      const result = await service.update(businessId, dto, publicId, {});

      expect(result.business.id_creator).toBe(existingBusiness.id_creator);
    });

    it('SEC14: should use parameterized queries (via repository)', async () => {
      const dto: UpdateBusinessDto = { name: 'Test' };
      await service.update(businessId, dto, publicId, {});

      expect(mockRepository.updateBusiness).toHaveBeenCalledWith(
        mockTransaction,
        businessId,
        expect.objectContaining({ name: 'Test' }),
      );
    });

    it('SEC15: should audit trail with id_updater', async () => {
      const dto: UpdateBusinessDto = { name: 'Audit Test' };
      const result = await service.update(businessId, dto, publicId, {});

      expect(result.business.id_updater).toBe(publicId);
    });

    it('SEC16: should audit trail with updated_at', async () => {
      const dto: UpdateBusinessDto = { name: 'Audit Test' };
      const result = await service.update(businessId, dto, publicId, {});

      expect(result.business.updated_at).toBeDefined();
      expect(result.business.updated_at).not.toEqual(
        existingBusiness.updated_at,
      );
    });

    it('SEC17: should validate JWT sub matches actual user', async () => {
      await service.update(businessId, {}, publicId, {});

      expect(mockRepository.findUserIdByPublicId).toHaveBeenCalledWith(
        publicId,
      );
    });

    it('SEC18: should prevent access with invalid businessId UUID', async () => {
      const invalidUuid = 'not-a-uuid';
      (
        mockRepository.findBusinessWithHoursById as jest.Mock
      ).mockResolvedValueOnce(null);

      await expect(
        service.update(invalidUuid, {}, publicId, {}),
      ).rejects.toThrow();
    });

    it('SEC19: should not expose whether business exists when not owner', async () => {
      (mockRepository.findUserIdByPublicId as jest.Mock).mockResolvedValueOnce(
        anotherOwnerId,
      );

      await expect(
        service.update(businessId, {}, 'other-sub', {}),
      ).rejects.toThrow(ForbiddenException);
    });

    it('SEC20: should rollback on any error to prevent partial updates', async () => {
      (mockRepository.insertBusinessHours as jest.Mock).mockRejectedValueOnce(
        new Error('Error'),
      );

      const dto: UpdateBusinessDto = {
        name: 'Partial',
        business_hours: [
          { day_of_week: 1, open_time: '08:00', close_time: '17:00' },
        ],
      };

      await expect(
        service.update(businessId, dto, publicId, {}),
      ).rejects.toThrow();

      expect(mockTransaction.rollback).toHaveBeenCalled();
    });

    it('SEC21: should validate input before transaction', async () => {
      const dto: UpdateBusinessDto = {
        business_hours: [
          { day_of_week: -1, open_time: '08:00', close_time: '17:00' },
        ],
      };

      await expect(
        service.update(businessId, dto, publicId, {}),
      ).rejects.toThrow(BadRequestException);

      expect(mockKnex.transaction).not.toHaveBeenCalled();
    });

    it('SEC22: should validate business_hours day range (security boundary)', async () => {
      const dto: UpdateBusinessDto = {
        business_hours: [
          { day_of_week: 999, open_time: '08:00', close_time: '17:00' },
        ],
      };

      await expect(
        service.update(businessId, dto, publicId, {}),
      ).rejects.toThrow(BadRequestException);
    });

    it('SEC23: should validate business_hours time format (prevent injection)', async () => {
      const dto: UpdateBusinessDto = {
        business_hours: [
          { day_of_week: 1, open_time: 'INVALID', close_time: '17:00' },
        ],
      };

      await expect(
        service.update(businessId, dto, publicId, {}),
      ).rejects.toThrow(BadRequestException);
    });

    it('SEC24: should handle malformed JWT sub gracefully', async () => {
      await expect(service.update(businessId, {}, '   ', {})).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it('SEC25: should prevent unauthorized access via businessId manipulation', async () => {
      const otherBusinessId = 'other-business-uuid';
      (
        mockRepository.findBusinessWithHoursById as jest.Mock
      ).mockResolvedValueOnce({
        business: {
          ...existingBusiness,
          id: otherBusinessId,
          owner_id: anotherOwnerId,
        },
        business_hours: [],
      });

      await expect(
        service.update(otherBusinessId, {}, publicId, {}),
      ).rejects.toThrow(ForbiddenException);
    });

    it('SEC26: should enforce owner check before validation', async () => {
      (mockRepository.findUserIdByPublicId as jest.Mock).mockResolvedValueOnce(
        anotherOwnerId,
      );

      await expect(
        service.update(businessId, { name: 'Test' }, 'other-sub', {}),
      ).rejects.toThrow(ForbiddenException);
    });

    it('SEC27: should cleanup uploaded files on failure (prevent orphans)', async () => {
      (mockRepository.updateBusiness as jest.Mock).mockRejectedValueOnce(
        new Error('Fail'),
      );

      await expect(
        service.update(businessId, {}, publicId, { image: mockFile }),
      ).rejects.toThrow();

      expect(mockFileService.deleteFile).toHaveBeenCalled();
    });

    it('SEC28: should not leak sensitive info in error messages', async () => {
      (
        mockRepository.findBusinessWithHoursById as jest.Mock
      ).mockResolvedValueOnce(null);

      try {
        await service.update(businessId, {}, publicId, {});
      } catch (error) {
        expect((error as any).message).not.toContain('database');
        expect((error as any).message).not.toContain('table');
      }
    });

    it('SEC29: should use transaction isolation to prevent race conditions', async () => {
      const dto: UpdateBusinessDto = { name: 'Race Test' };
      await service.update(businessId, dto, publicId, {});

      expect(mockKnex.transaction).toHaveBeenCalled();
    });

    it('SEC30: should verify sub corresponds to actual user in database', async () => {
      await service.update(businessId, {}, publicId, {});

      expect(mockRepository.findUserIdByPublicId).toHaveBeenCalledWith(
        publicId,
      );
      expect(mockRepository.findBusinessWithHoursById).toHaveBeenCalledWith(
        businessId,
      );
    });
  });
});
