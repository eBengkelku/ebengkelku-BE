import { Test, TestingModule } from '@nestjs/testing';
import { UnauthorizedException } from '@nestjs/common';
import { BusinessController } from '../business.controller';
import { BusinessService } from '../business.service';
import { I18nService } from 'nestjs-i18n';
import { JwtAuthGuard } from '../../../auth/jwt.guard';
import { CreateBusinessDto } from '../dto/create-business.dto';

describe('BusinessController', () => {
  let controller: BusinessController;
  let mockBusinessService: Partial<BusinessService>;
  let mockI18nService: Partial<I18nService>;

  const ownerId = 'user-uuid-123';
  const publicId = '11111111-1111-4111-8111-111111111111';
  const businessId = 'business-uuid-789';

  const mockCreatedBusiness = {
    id: businessId,
    owner_id: ownerId,
    name: 'Bengkel Jaya',
    tagline: 'Service terpercaya',
    status: 'pending',
    phone: null,
    image: null,
    cover_image: null,
    latitude: null,
    longitude: null,
    address: null,
    created_at: new Date(),
    updated_at: new Date(),
    id_creator: publicId,
  };

  const mockBusinessHours = [
    {
      id: 'h1',
      business_id: businessId,
      day_of_week: 1,
      open_time: '09:00',
      close_time: '17:00',
    },
  ];

  beforeEach(async () => {
    mockBusinessService = {
      resolveOwnerIdFromSub: jest.fn().mockResolvedValue(ownerId),
      resolveCreatorPublicId: jest.fn().mockResolvedValue(publicId),
      create: jest.fn().mockResolvedValue({
        business: mockCreatedBusiness,
        business_hours: mockBusinessHours,
      }),
      findById: jest.fn().mockResolvedValue({
        business: mockCreatedBusiness,
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
    })
      .overrideGuard(JwtAuthGuard)
      .useValue({ canActivate: () => true })
      .compile();

    controller = module.get<BusinessController>(BusinessController);
  });

  describe('create', () => {
    const validDto: CreateBusinessDto = {
      name: 'Bengkel Jaya',
      tagline: 'Service terpercaya',
      phone: '+6281234567890',
      address: 'Jl. Sudirman No. 1',
      latitude: -6.2,
      longitude: 106.8,
      business_hours: [
        { day_of_week: 1, open_time: '09:00', close_time: '17:00' },
      ],
    };

    const mockReq = (
      sub?: string,
      files?: {
        image?: Express.Multer.File[];
        cover_image?: Express.Multer.File[];
      },
    ) =>
      ({
        user: sub ? { sub } : undefined,
        headers: { 'x-lang': 'en' },
        files: files ?? {},
      }) as any;

    it('should return 201 with business and business_hours when JWT is valid', async () => {
      const result = await controller.create(validDto, mockReq(publicId));
      expect(result).toEqual({
        business: mockCreatedBusiness,
        business_hours: mockBusinessHours,
      });
      expect(mockBusinessService.resolveOwnerIdFromSub).toHaveBeenCalledWith(
        publicId,
      );
      expect(mockBusinessService.resolveCreatorPublicId).toHaveBeenCalledWith(
        publicId,
      );
      expect(mockBusinessService.create).toHaveBeenCalledWith(
        validDto,
        ownerId,
        publicId,
        expect.objectContaining({ lang: 'en' }),
      );
    });

    it('should throw UnauthorizedException when req.user.sub is missing', async () => {
      await expect(controller.create(validDto, mockReq())).rejects.toThrow(
        UnauthorizedException,
      );
      expect(mockBusinessService.create).not.toHaveBeenCalled();
    });

    it('should pass image and cover_image from req.files to service', async () => {
      const imageFile = {
        fieldname: 'image',
        originalname: 'a.jpg',
        mimetype: 'image/jpeg',
        size: 100,
        buffer: Buffer.from('x'),
      } as Express.Multer.File;
      const coverFile = {
        fieldname: 'cover_image',
        originalname: 'b.jpg',
        mimetype: 'image/jpeg',
        size: 100,
        buffer: Buffer.from('y'),
      } as Express.Multer.File;
      const req = mockReq(publicId, {
        image: [imageFile],
        cover_image: [coverFile],
      });
      await controller.create(validDto, req);
      expect(mockBusinessService.create).toHaveBeenCalledWith(
        validDto,
        ownerId,
        publicId,
        expect.objectContaining({
          image: imageFile,
          cover_image: coverFile,
          lang: 'en',
        }),
      );
    });

    it('should pass x-lang header to service', async () => {
      const req = mockReq(publicId);
      req.headers['x-lang'] = 'id';
      await controller.create(validDto, req);
      expect(mockBusinessService.create).toHaveBeenCalledWith(
        validDto,
        ownerId,
        publicId,
        expect.objectContaining({ lang: 'id' }),
      );
    });

    it('should create with required name only', async () => {
      const dto: CreateBusinessDto = { name: 'Minimal Workshop' };
      await controller.create(dto, mockReq(publicId));
      expect(mockBusinessService.create).toHaveBeenCalledWith(
        dto,
        ownerId,
        publicId,
        expect.any(Object),
      );
    });

    it('should return structure with business and business_hours keys', async () => {
      const result = await controller.create(validDto, mockReq(publicId));
      expect(result).toHaveProperty('business');
      expect(result).toHaveProperty('business_hours');
      expect(Array.isArray(result.business_hours)).toBe(true);
    });

    it('should not accept owner_id from body (security: owner from JWT only)', async () => {
      const dtoWithFakeOwner = {
        ...validDto,
        owner_id: 'fake-owner-id',
      } as CreateBusinessDto & { owner_id: string };
      await controller.create(dtoWithFakeOwner, mockReq(publicId));
      expect(mockBusinessService.create).toHaveBeenCalledWith(
        expect.any(Object),
        ownerId,
        publicId,
        expect.any(Object),
      );
      expect(
        (mockBusinessService.create as jest.Mock).mock.calls[0][0].owner_id,
      ).toBeUndefined();
    });
  });
});
