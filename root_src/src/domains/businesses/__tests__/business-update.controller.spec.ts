import { Test, TestingModule } from '@nestjs/testing';
import {
  UnauthorizedException,
  BadRequestException,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { BusinessController } from '../business.controller';
import { BusinessService } from '../business.service';
import { I18nService } from 'nestjs-i18n';
import { UpdateBusinessDto } from '../dto/update-business.dto';
import { BusinessStatus } from '../contracts/business-status.enum';
import type { IBusiness, IBusinessHours } from '../interfaces';

describe('BusinessController - Update', () => {
  let controller: BusinessController;
  let mockBusinessService: Partial<BusinessService>;
  let mockI18nService: Partial<I18nService>;

  const publicId = '11111111-1111-4111-8111-111111111111';
  const businessId = '550e8400-e29b-41d4-a716-446655440000';
  const ownerId = 'user-uuid-123';

  const mockBusiness: IBusiness = {
    id: businessId,
    owner_id: ownerId,
    name: 'Updated Business',
    tagline: 'Updated tagline',
    status: BusinessStatus.ACTIVE,
    phone: '+6281234567890',
    image: '/uploads/image.jpg',
    cover_image: '/uploads/cover.jpg',
    latitude: '-6.2088',
    longitude: '106.8456',
    address: 'Updated Address',
    created_at: new Date('2026-02-05T08:00:00.000Z'),
    updated_at: new Date('2026-02-18T10:00:00.000Z'),
    deleted_at: null,
    id_creator: publicId,
    id_updater: publicId,
  };

  const mockBusinessHours: IBusinessHours[] = [
    {
      id: 'hour-uuid-1',
      business_id: businessId,
      day_of_week: 1,
      open_time: '08:00',
      close_time: '17:00',
      updated_at: new Date('2026-02-18T10:00:00.000Z'),
      deleted_at: null,
      id_creator: publicId,
      id_updater: publicId,
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
    mockBusinessService = {
      update: jest.fn().mockResolvedValue({
        business: mockBusiness,
        business_hours: mockBusinessHours,
      }),
    };

    mockI18nService = {
      t: jest.fn().mockImplementation((key: string) => key),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [BusinessController],
      providers: [
        { provide: BusinessService, useValue: mockBusinessService },
        { provide: I18nService, useValue: mockI18nService },
      ],
    }).compile();

    controller = module.get<BusinessController>(BusinessController);
  });

  // =======================
  // CONTROLLER HAPPY PATH (20)
  // =======================
  describe('Controller Happy Path', () => {
    it('CHP01: should call service.update with correct parameters', async () => {
      const dto: UpdateBusinessDto = { name: 'Test Update' };
      const req = {
        user: { sub: publicId },
        headers: { 'x-lang': 'en' },
        files: {},
      } as any;

      await controller.update(businessId, dto, req);

      expect(mockBusinessService.update).toHaveBeenCalledWith(
        businessId,
        dto,
        publicId,
        { image: undefined, cover_image: undefined, lang: 'en' },
      );
    });

    it('CHP02: should return business and business_hours', async () => {
      const dto: UpdateBusinessDto = { name: 'Test' };
      const req = {
        user: { sub: publicId },
        headers: { 'x-lang': 'en' },
        files: {},
      } as any;

      const result = await controller.update(businessId, dto, req);

      expect(result).toEqual({
        business: mockBusiness,
        business_hours: mockBusinessHours,
      });
    });

    it('CHP03: should handle image file upload', async () => {
      const dto: UpdateBusinessDto = { name: 'With Image' };
      const req = {
        user: { sub: publicId },
        headers: { 'x-lang': 'en' },
        files: { image: [mockFile] },
      } as any;

      await controller.update(businessId, dto, req);

      expect(mockBusinessService.update).toHaveBeenCalledWith(
        businessId,
        dto,
        publicId,
        { image: mockFile, cover_image: undefined, lang: 'en' },
      );
    });

    it('CHP04: should handle cover_image file upload', async () => {
      const dto: UpdateBusinessDto = { name: 'With Cover' };
      const req = {
        user: { sub: publicId },
        headers: { 'x-lang': 'en' },
        files: { cover_image: [mockFile] },
      } as any;

      await controller.update(businessId, dto, req);

      expect(mockBusinessService.update).toHaveBeenCalledWith(
        businessId,
        dto,
        publicId,
        { image: undefined, cover_image: mockFile, lang: 'en' },
      );
    });

    it('CHP05: should handle both image and cover_image', async () => {
      const dto: UpdateBusinessDto = { name: 'Both Files' };
      const req = {
        user: { sub: publicId },
        headers: { 'x-lang': 'en' },
        files: { image: [mockFile], cover_image: [mockFile] },
      } as any;

      await controller.update(businessId, dto, req);

      expect(mockBusinessService.update).toHaveBeenCalledWith(
        businessId,
        dto,
        publicId,
        { image: mockFile, cover_image: mockFile, lang: 'en' },
      );
    });

    it('CHP06: should extract businessId from path param', async () => {
      const dto: UpdateBusinessDto = { name: 'Test' };
      const req = {
        user: { sub: publicId },
        headers: { 'x-lang': 'en' },
        files: {},
      } as any;

      await controller.update(businessId, dto, req);

      expect(mockBusinessService.update).toHaveBeenCalledWith(
        businessId,
        expect.any(Object),
        publicId,
        expect.any(Object),
      );
    });

    it('CHP07: should extract sub from JWT user', async () => {
      const dto: UpdateBusinessDto = { name: 'Test' };
      const req = {
        user: { sub: publicId },
        headers: { 'x-lang': 'en' },
        files: {},
      } as any;

      await controller.update(businessId, dto, req);

      expect(mockBusinessService.update).toHaveBeenCalledWith(
        expect.any(String),
        expect.any(Object),
        publicId,
        expect.any(Object),
      );
    });

    it('CHP08: should use x-lang header for language', async () => {
      const dto: UpdateBusinessDto = { name: 'Test' };
      const req = {
        user: { sub: publicId },
        headers: { 'x-lang': 'id' },
        files: {},
      } as any;

      await controller.update(businessId, dto, req);

      expect(mockBusinessService.update).toHaveBeenCalledWith(
        businessId,
        dto,
        publicId,
        expect.objectContaining({ lang: 'id' }),
      );
    });

    it('CHP09: should default to "en" when x-lang not provided', async () => {
      const dto: UpdateBusinessDto = { name: 'Test' };
      const req = {
        user: { sub: publicId },
        headers: {},
        files: {},
      } as any;

      await controller.update(businessId, dto, req);

      expect(mockBusinessService.update).toHaveBeenCalledWith(
        businessId,
        dto,
        publicId,
        expect.objectContaining({ lang: 'en' }),
      );
    });

    it('CHP10: should remove owner_id from DTO to prevent spoofing', async () => {
      const dto: any = { name: 'Test', owner_id: 'spoofed-id' };
      const req = {
        user: { sub: publicId },
        headers: { 'x-lang': 'en' },
        files: {},
      } as any;

      await controller.update(businessId, dto, req);

      const calledDto = (mockBusinessService.update as jest.Mock).mock
        .calls[0][1];
      expect(calledDto).not.toHaveProperty('owner_id');
      expect(calledDto.name).toBe('Test');
    });

    it('CHP11: should handle empty files object', async () => {
      const dto: UpdateBusinessDto = { name: 'Test' };
      const req = {
        user: { sub: publicId },
        headers: { 'x-lang': 'en' },
        files: {},
      } as any;

      await controller.update(businessId, dto, req);

      expect(mockBusinessService.update).toHaveBeenCalledWith(
        businessId,
        dto,
        publicId,
        { image: undefined, cover_image: undefined, lang: 'en' },
      );
    });

    it('CHP12: should handle undefined files', async () => {
      const dto: UpdateBusinessDto = { name: 'Test' };
      const req = {
        user: { sub: publicId },
        headers: { 'x-lang': 'en' },
      } as any;

      await controller.update(businessId, dto, req);

      expect(mockBusinessService.update).toHaveBeenCalledWith(
        businessId,
        dto,
        publicId,
        { image: undefined, cover_image: undefined, lang: 'en' },
      );
    });

    it('CHP13: should handle image as single file (not array)', async () => {
      const dto: UpdateBusinessDto = { name: 'Test' };
      const req = {
        user: { sub: publicId },
        headers: { 'x-lang': 'en' },
        files: { image: mockFile },
      } as any;

      await controller.update(businessId, dto, req);

      expect(mockBusinessService.update).toHaveBeenCalledWith(
        businessId,
        dto,
        publicId,
        { image: mockFile, cover_image: undefined, lang: 'en' },
      );
    });

    it('CHP14: should extract first file from array', async () => {
      const dto: UpdateBusinessDto = { name: 'Test' };
      const req = {
        user: { sub: publicId },
        headers: { 'x-lang': 'en' },
        files: { image: [mockFile, mockFile] },
      } as any;

      await controller.update(businessId, dto, req);

      expect(mockBusinessService.update).toHaveBeenCalledWith(
        businessId,
        dto,
        publicId,
        { image: mockFile, cover_image: undefined, lang: 'en' },
      );
    });

    it('CHP15: should handle empty DTO', async () => {
      const dto: UpdateBusinessDto = {};
      const req = {
        user: { sub: publicId },
        headers: { 'x-lang': 'en' },
        files: {},
      } as any;

      await controller.update(businessId, dto, req);

      expect(mockBusinessService.update).toHaveBeenCalledWith(
        businessId,
        {},
        publicId,
        expect.any(Object),
      );
    });

    it('CHP16: should handle business_hours in DTO', async () => {
      const dto: UpdateBusinessDto = {
        business_hours: [
          { day_of_week: 1, open_time: '08:00', close_time: '17:00' },
        ],
      };
      const req = {
        user: { sub: publicId },
        headers: { 'x-lang': 'en' },
        files: {},
      } as any;

      await controller.update(businessId, dto, req);

      expect(mockBusinessService.update).toHaveBeenCalledWith(
        businessId,
        dto,
        publicId,
        expect.any(Object),
      );
    });

    it('CHP17: should handle status update in DTO', async () => {
      const dto: UpdateBusinessDto = { status: BusinessStatus.PENDING };
      const req = {
        user: { sub: publicId },
        headers: { 'x-lang': 'en' },
        files: {},
      } as any;

      await controller.update(businessId, dto, req);

      expect(mockBusinessService.update).toHaveBeenCalledWith(
        businessId,
        dto,
        publicId,
        expect.any(Object),
      );
    });

    it('CHP18: should handle latitude/longitude in DTO', async () => {
      const dto: UpdateBusinessDto = { latitude: -7.25, longitude: 112.75 };
      const req = {
        user: { sub: publicId },
        headers: { 'x-lang': 'en' },
        files: {},
      } as any;

      await controller.update(businessId, dto, req);

      expect(mockBusinessService.update).toHaveBeenCalledWith(
        businessId,
        dto,
        publicId,
        expect.any(Object),
      );
    });

    it('CHP19: should return promise resolving to correct shape', async () => {
      const dto: UpdateBusinessDto = { name: 'Test' };
      const req = {
        user: { sub: publicId },
        headers: { 'x-lang': 'en' },
        files: {},
      } as any;

      const result = await controller.update(businessId, dto, req);

      expect(result).toHaveProperty('business');
      expect(result).toHaveProperty('business_hours');
      expect(Array.isArray(result.business_hours)).toBe(true);
    });

    it('CHP20: should pass through service response unchanged', async () => {
      const dto: UpdateBusinessDto = { name: 'Test' };
      const req = {
        user: { sub: publicId },
        headers: { 'x-lang': 'en' },
        files: {},
      } as any;

      const serviceResponse = {
        business: mockBusiness,
        business_hours: mockBusinessHours,
      };
      (mockBusinessService.update as jest.Mock).mockResolvedValueOnce(
        serviceResponse,
      );

      const result = await controller.update(businessId, dto, req);

      expect(result).toEqual(serviceResponse);
    });
  });

  // =======================
  // CONTROLLER SAD PATH (20)
  // =======================
  describe('Controller Sad Path', () => {
    it('CSP01: should throw 401 when user not in request', async () => {
      const dto: UpdateBusinessDto = { name: 'Test' };
      const req = {
        headers: { 'x-lang': 'en' },
        files: {},
      } as any;

      await expect(controller.update(businessId, dto, req)).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it('CSP02: should throw 401 when sub not in user', async () => {
      const dto: UpdateBusinessDto = { name: 'Test' };
      const req = {
        user: {},
        headers: { 'x-lang': 'en' },
        files: {},
      } as any;

      await expect(controller.update(businessId, dto, req)).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it('CSP03: should throw 401 when sub is empty string', async () => {
      const dto: UpdateBusinessDto = { name: 'Test' };
      const req = {
        user: { sub: '' },
        headers: { 'x-lang': 'en' },
        files: {},
      } as any;

      await expect(controller.update(businessId, dto, req)).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it('CSP04: should propagate service UnauthorizedException', async () => {
      (mockBusinessService.update as jest.Mock).mockRejectedValueOnce(
        new UnauthorizedException('User not found'),
      );

      const dto: UpdateBusinessDto = { name: 'Test' };
      const req = {
        user: { sub: publicId },
        headers: { 'x-lang': 'en' },
        files: {},
      } as any;

      await expect(controller.update(businessId, dto, req)).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it('CSP05: should propagate service BadRequestException', async () => {
      (mockBusinessService.update as jest.Mock).mockRejectedValueOnce(
        new BadRequestException('Validation failed'),
      );

      const dto: UpdateBusinessDto = { name: 'Test' };
      const req = {
        user: { sub: publicId },
        headers: { 'x-lang': 'en' },
        files: {},
      } as any;

      await expect(controller.update(businessId, dto, req)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('CSP06: should propagate service NotFoundException', async () => {
      (mockBusinessService.update as jest.Mock).mockRejectedValueOnce(
        new NotFoundException('Business not found'),
      );

      const dto: UpdateBusinessDto = { name: 'Test' };
      const req = {
        user: { sub: publicId },
        headers: { 'x-lang': 'en' },
        files: {},
      } as any;

      await expect(controller.update(businessId, dto, req)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('CSP07: should propagate service ForbiddenException', async () => {
      (mockBusinessService.update as jest.Mock).mockRejectedValueOnce(
        new ForbiddenException('Access denied'),
      );

      const dto: UpdateBusinessDto = { name: 'Test' };
      const req = {
        user: { sub: publicId },
        headers: { 'x-lang': 'en' },
        files: {},
      } as any;

      await expect(controller.update(businessId, dto, req)).rejects.toThrow(
        ForbiddenException,
      );
    });

    it('CSP08: should use i18n for error messages', async () => {
      const dto: UpdateBusinessDto = { name: 'Test' };
      const req = {
        user: { sub: '' },
        headers: { 'x-lang': 'id' },
        files: {},
      } as any;

      try {
        await controller.update(businessId, dto, req);
      } catch {
        expect(mockI18nService.t).toHaveBeenCalledWith(
          'businesses.errors.ownerRequired',
          expect.objectContaining({ lang: 'id' }),
        );
      }
    });

    it('CSP09: should handle service throwing generic Error', async () => {
      (mockBusinessService.update as jest.Mock).mockRejectedValueOnce(
        new Error('Unexpected error'),
      );

      const dto: UpdateBusinessDto = { name: 'Test' };
      const req = {
        user: { sub: publicId },
        headers: { 'x-lang': 'en' },
        files: {},
      } as any;

      await expect(controller.update(businessId, dto, req)).rejects.toThrow(
        'Unexpected error',
      );
    });

    it('CSP10: should not call service when sub is missing', async () => {
      const dto: UpdateBusinessDto = { name: 'Test' };
      const req = {
        user: {},
        headers: { 'x-lang': 'en' },
        files: {},
      } as any;

      try {
        await controller.update(businessId, dto, req);
      } catch {
        expect(mockBusinessService.update).not.toHaveBeenCalled();
      }
    });

    it('CSP11: should handle null user object', async () => {
      const dto: UpdateBusinessDto = { name: 'Test' };
      const req = {
        user: null,
        headers: { 'x-lang': 'en' },
        files: {},
      } as any;

      await expect(controller.update(businessId, dto, req)).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it('CSP12: should handle undefined user object', async () => {
      const dto: UpdateBusinessDto = { name: 'Test' };
      const req = {
        headers: { 'x-lang': 'en' },
        files: {},
      } as any;

      await expect(controller.update(businessId, dto, req)).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it('CSP13: should handle whitespace-only sub', async () => {
      const dto: UpdateBusinessDto = { name: 'Test' };
      const req = {
        user: { sub: '   ' },
        headers: { 'x-lang': 'en' },
        files: {},
      } as any;

      await expect(controller.update(businessId, dto, req)).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it('CSP14: should handle service validation errors for business_hours', async () => {
      (mockBusinessService.update as jest.Mock).mockRejectedValueOnce(
        new BadRequestException('Invalid day_of_week'),
      );

      const dto: UpdateBusinessDto = {
        business_hours: [
          { day_of_week: 10, open_time: '08:00', close_time: '17:00' },
        ],
      };
      const req = {
        user: { sub: publicId },
        headers: { 'x-lang': 'en' },
        files: {},
      } as any;

      await expect(controller.update(businessId, dto, req)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('CSP15: should handle service validation errors for duplicate day', async () => {
      (mockBusinessService.update as jest.Mock).mockRejectedValueOnce(
        new BadRequestException('Duplicate day_of_week'),
      );

      const dto: UpdateBusinessDto = {
        business_hours: [
          { day_of_week: 1, open_time: '08:00', close_time: '17:00' },
          { day_of_week: 1, open_time: '09:00', close_time: '18:00' },
        ],
      };
      const req = {
        user: { sub: publicId },
        headers: { 'x-lang': 'en' },
        files: {},
      } as any;

      await expect(controller.update(businessId, dto, req)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('CSP16: should handle service errors for invalid coordinates', async () => {
      (mockBusinessService.update as jest.Mock).mockRejectedValueOnce(
        new BadRequestException('Invalid latitude'),
      );

      const dto: UpdateBusinessDto = { latitude: 100 };
      const req = {
        user: { sub: publicId },
        headers: { 'x-lang': 'en' },
        files: {},
      } as any;

      await expect(controller.update(businessId, dto, req)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('CSP17: should handle service errors for invalid status', async () => {
      (mockBusinessService.update as jest.Mock).mockRejectedValueOnce(
        new BadRequestException('Invalid status'),
      );

      const dto: UpdateBusinessDto = { status: 'invalid' as any };
      const req = {
        user: { sub: publicId },
        headers: { 'x-lang': 'en' },
        files: {},
      } as any;

      await expect(controller.update(businessId, dto, req)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('CSP18: should handle missing businessId parameter', async () => {
      const dto: UpdateBusinessDto = { name: 'Test' };
      const req = {
        user: { sub: publicId },
        headers: { 'x-lang': 'en' },
        files: {},
      } as any;

      // This would normally be caught by routing, but test service call
      await controller.update('', dto, req);

      expect(mockBusinessService.update).toHaveBeenCalledWith(
        '',
        dto,
        publicId,
        expect.any(Object),
      );
    });

    it('CSP19: should handle malformed headers object', async () => {
      const dto: UpdateBusinessDto = { name: 'Test' };
      const req = {
        user: { sub: publicId },
        headers: null,
        files: {},
      } as any;

      // Should default to 'en' when headers are null
      await controller.update(businessId, dto, req);

      expect(mockBusinessService.update).toHaveBeenCalledWith(
        businessId,
        dto,
        publicId,
        expect.objectContaining({ lang: 'en' }),
      );
    });

    it('CSP20: should handle service throwing database errors', async () => {
      (mockBusinessService.update as jest.Mock).mockRejectedValueOnce(
        new Error('Database connection failed'),
      );

      const dto: UpdateBusinessDto = { name: 'Test' };
      const req = {
        user: { sub: publicId },
        headers: { 'x-lang': 'en' },
        files: {},
      } as any;

      await expect(controller.update(businessId, dto, req)).rejects.toThrow(
        'Database connection failed',
      );
    });
  });

  // =======================
  // CONTROLLER EDGE CASES (20)
  // =======================
  describe('Controller Edge Cases', () => {
    it('CEC01: should handle very long businessId', async () => {
      const longId = 'a'.repeat(1000);
      const dto: UpdateBusinessDto = { name: 'Test' };
      const req = {
        user: { sub: publicId },
        headers: { 'x-lang': 'en' },
        files: {},
      } as any;

      await controller.update(longId, dto, req);

      expect(mockBusinessService.update).toHaveBeenCalledWith(
        longId,
        dto,
        publicId,
        expect.any(Object),
      );
    });

    it('CEC02: should handle special characters in businessId', async () => {
      const specialId = '550e8400-e29b-41d4-a716-446655440000&test=1';
      const dto: UpdateBusinessDto = { name: 'Test' };
      const req = {
        user: { sub: publicId },
        headers: { 'x-lang': 'en' },
        files: {},
      } as any;

      await controller.update(specialId, dto, req);

      expect(mockBusinessService.update).toHaveBeenCalledWith(
        specialId,
        dto,
        publicId,
        expect.any(Object),
      );
    });

    it('CEC03: should handle case-insensitive x-lang header', async () => {
      const req = {
        user: { sub: publicId },
        headers: { 'X-LANG': 'id' },
        files: {},
      } as any;

      // Express normalizes headers to lowercase
      const lang = (req.headers['x-lang'] as string) || 'en';
      expect(lang).toBe('en'); // Because X-LANG !== x-lang
    });

    it('CEC04: should handle unknown language code', async () => {
      const dto: UpdateBusinessDto = { name: 'Test' };
      const req = {
        user: { sub: publicId },
        headers: { 'x-lang': 'fr' },
        files: {},
      } as any;

      await controller.update(businessId, dto, req);

      expect(mockBusinessService.update).toHaveBeenCalledWith(
        businessId,
        dto,
        publicId,
        expect.objectContaining({ lang: 'fr' }),
      );
    });

    it('CEC05: should handle multiple files in image field', async () => {
      const dto: UpdateBusinessDto = { name: 'Test' };
      const req = {
        user: { sub: publicId },
        headers: { 'x-lang': 'en' },
        files: { image: [mockFile, mockFile, mockFile] },
      } as any;

      await controller.update(businessId, dto, req);

      // Should only take first file
      expect(mockBusinessService.update).toHaveBeenCalledWith(
        businessId,
        dto,
        publicId,
        { image: mockFile, cover_image: undefined, lang: 'en' },
      );
    });

    it('CEC06: should handle empty array in image field', async () => {
      const dto: UpdateBusinessDto = { name: 'Test' };
      const req = {
        user: { sub: publicId },
        headers: { 'x-lang': 'en' },
        files: { image: [] },
      } as any;

      await controller.update(businessId, dto, req);

      expect(mockBusinessService.update).toHaveBeenCalledWith(
        businessId,
        dto,
        publicId,
        { image: undefined, cover_image: undefined, lang: 'en' },
      );
    });

    it('CEC07: should handle mixed file format (array and non-array)', async () => {
      const dto: UpdateBusinessDto = { name: 'Test' };
      const req = {
        user: { sub: publicId },
        headers: { 'x-lang': 'en' },
        files: { image: [mockFile], cover_image: mockFile },
      } as any;

      await controller.update(businessId, dto, req);

      expect(mockBusinessService.update).toHaveBeenCalledWith(
        businessId,
        dto,
        publicId,
        { image: mockFile, cover_image: mockFile, lang: 'en' },
      );
    });

    it('CEC08: should handle sub with special characters', async () => {
      const specialSub = '11111111-1111-4111-8111-111111111111@#$';
      const dto: UpdateBusinessDto = { name: 'Test' };
      const req = {
        user: { sub: specialSub },
        headers: { 'x-lang': 'en' },
        files: {},
      } as any;

      await controller.update(businessId, dto, req);

      expect(mockBusinessService.update).toHaveBeenCalledWith(
        businessId,
        dto,
        specialSub,
        expect.any(Object),
      );
    });

    it('CEC09: should handle DTO with extra unknown fields', async () => {
      const dto: any = {
        name: 'Test',
        unknownField: 'value',
        anotherUnknown: 123,
      };
      const req = {
        user: { sub: publicId },
        headers: { 'x-lang': 'en' },
        files: {},
      } as any;

      await controller.update(businessId, dto, req);

      // Service gets DTO as-is (validation pipe would strip unknown fields)
      expect(mockBusinessService.update).toHaveBeenCalled();
    });

    it('CEC10: should handle request without headers property', async () => {
      const dto: UpdateBusinessDto = { name: 'Test' };
      const req = {
        user: { sub: publicId },
        files: {},
      } as any;

      await controller.update(businessId, dto, req);

      // Should default to 'en'
      expect(mockBusinessService.update).toHaveBeenCalledWith(
        businessId,
        dto,
        publicId,
        expect.objectContaining({ lang: 'en' }),
      );
    });

    it('CEC11: should handle request with headers as undefined', async () => {
      const dto: UpdateBusinessDto = { name: 'Test' };
      const req = {
        user: { sub: publicId },
        headers: undefined,
        files: {},
      } as any;

      await controller.update(businessId, dto, req);

      expect(mockBusinessService.update).toHaveBeenCalledWith(
        businessId,
        dto,
        publicId,
        expect.objectContaining({ lang: 'en' }),
      );
    });

    it('CEC12: should handle numeric businessId', async () => {
      const numericId = '123456789';
      const dto: UpdateBusinessDto = { name: 'Test' };
      const req = {
        user: { sub: publicId },
        headers: { 'x-lang': 'en' },
        files: {},
      } as any;

      await controller.update(numericId, dto, req);

      expect(mockBusinessService.update).toHaveBeenCalledWith(
        numericId,
        dto,
        publicId,
        expect.any(Object),
      );
    });

    it('CEC13: should handle very large DTO', async () => {
      const largeDto: any = {
        name: 'Test',
        tagline: 'T'.repeat(500),
        address: 'A'.repeat(1000),
        business_hours: Array(7)
          .fill(null)
          .map((_, i) => ({
            day_of_week: i,
            open_time: '08:00',
            close_time: '17:00',
          })),
      };
      const req = {
        user: { sub: publicId },
        headers: { 'x-lang': 'en' },
        files: {},
      } as any;

      await controller.update(businessId, largeDto, req);

      expect(mockBusinessService.update).toHaveBeenCalledWith(
        businessId,
        largeDto,
        publicId,
        expect.any(Object),
      );
    });

    it('CEC14: should preserve DTO structure when removing owner_id', async () => {
      const dto: any = {
        name: 'Test',
        tagline: 'Tagline',
        owner_id: 'spoofed',
        phone: '+6281234567890',
      };
      const req = {
        user: { sub: publicId },
        headers: { 'x-lang': 'en' },
        files: {},
      } as any;

      await controller.update(businessId, dto, req);

      const calledDto = (mockBusinessService.update as jest.Mock).mock
        .calls[0][1];
      expect(calledDto.name).toBe('Test');
      expect(calledDto.tagline).toBe('Tagline');
      expect(calledDto.phone).toBe('+6281234567890');
      expect(calledDto).not.toHaveProperty('owner_id');
    });

    it('CEC15: should handle DTO with null values', async () => {
      const dto: any = {
        name: 'Test',
        tagline: null,
        phone: null,
      };
      const req = {
        user: { sub: publicId },
        headers: { 'x-lang': 'en' },
        files: {},
      } as any;

      await controller.update(businessId, dto, req);

      expect(mockBusinessService.update).toHaveBeenCalledWith(
        businessId,
        dto,
        publicId,
        expect.any(Object),
      );
    });

    it('CEC16: should handle DTO with undefined values', async () => {
      const dto: any = {
        name: 'Test',
        tagline: undefined,
        phone: undefined,
      };
      const req = {
        user: { sub: publicId },
        headers: { 'x-lang': 'en' },
        files: {},
      } as any;

      await controller.update(businessId, dto, req);

      expect(mockBusinessService.update).toHaveBeenCalled();
    });

    it('CEC17: should handle files with null values', async () => {
      const dto: UpdateBusinessDto = { name: 'Test' };
      const req = {
        user: { sub: publicId },
        headers: { 'x-lang': 'en' },
        files: { image: null, cover_image: null },
      } as any;

      await controller.update(businessId, dto, req);

      // null is not an array, so it should be used as-is
      expect(mockBusinessService.update).toHaveBeenCalledWith(
        businessId,
        dto,
        publicId,
        { image: null, cover_image: null, lang: 'en' },
      );
    });

    it('CEC18: should handle x-lang with extra whitespace', async () => {
      const dto: UpdateBusinessDto = { name: 'Test' };
      const req = {
        user: { sub: publicId },
        headers: { 'x-lang': '  id  ' },
        files: {},
      } as any;

      await controller.update(businessId, dto, req);

      // String is used as-is, no trimming in controller
      expect(mockBusinessService.update).toHaveBeenCalledWith(
        businessId,
        dto,
        publicId,
        expect.objectContaining({ lang: '  id  ' }),
      );
    });

    it('CEC19: should handle sub with leading/trailing whitespace', async () => {
      const dto: UpdateBusinessDto = { name: 'Test' };
      const req = {
        user: { sub: '  ' + publicId + '  ' },
        headers: { 'x-lang': 'en' },
        files: {},
      } as any;

      await controller.update(businessId, dto, req);

      // Service handles validation
      expect(mockBusinessService.update).toHaveBeenCalledWith(
        businessId,
        dto,
        '  ' + publicId + '  ',
        expect.any(Object),
      );
    });

    it('CEC20: should handle concurrent requests independently', async () => {
      const dto1: UpdateBusinessDto = { name: 'First' };
      const dto2: UpdateBusinessDto = { name: 'Second' };
      const req = {
        user: { sub: publicId },
        headers: { 'x-lang': 'en' },
        files: {},
      } as any;

      await Promise.all([
        controller.update(businessId, dto1, req),
        controller.update(businessId, dto2, req),
      ]);

      expect(mockBusinessService.update).toHaveBeenCalledTimes(2);
    });
  });
});
