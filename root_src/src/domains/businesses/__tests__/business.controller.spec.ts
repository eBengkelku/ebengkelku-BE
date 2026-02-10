import { Test, TestingModule } from '@nestjs/testing';
import {
  UnauthorizedException,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
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
      findAllByOwner: jest.fn().mockResolvedValue([]),
      findOneById: jest.fn().mockResolvedValue({
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

  /**
   * ========================================================================
   * Test Suite: findOne()
   * GET /v1/businesses/:business_id controller tests
   * ========================================================================
   */
  describe('findOne', () => {
    const targetBusinessId = 'target-business-uuid-001';

    const mockReq = (sub?: string, lang = 'en') =>
      ({
        user: sub ? { sub } : undefined,
        headers: { 'x-lang': lang },
      }) as any;

    // ========================================================================
    // POSITIVE TEST CASES
    // ========================================================================

    describe('Positive Test Cases', () => {
      it('should return business with hours when JWT is valid and user is owner', async () => {
        const result = await controller.findOne(
          targetBusinessId,
          mockReq(publicId),
        );

        expect(result).toEqual({
          business: mockCreatedBusiness,
          business_hours: mockBusinessHours,
        });
      });

      it('should call businessService.findOneById with correct arguments', async () => {
        await controller.findOne(targetBusinessId, mockReq(publicId));

        expect(mockBusinessService.findOneById).toHaveBeenCalledWith(
          targetBusinessId,
          publicId,
          'en',
        );
      });

      it('should pass x-lang header to service', async () => {
        await controller.findOne(targetBusinessId, mockReq(publicId, 'id'));

        expect(mockBusinessService.findOneById).toHaveBeenCalledWith(
          targetBusinessId,
          publicId,
          'id',
        );
      });

      it('should return structure with business and business_hours keys', async () => {
        const result = await controller.findOne(
          targetBusinessId,
          mockReq(publicId),
        );

        expect(result).toHaveProperty('business');
        expect(result).toHaveProperty('business_hours');
        expect(Array.isArray(result.business_hours)).toBe(true);
      });

      it('should return business object with correct id', async () => {
        const result = await controller.findOne(
          targetBusinessId,
          mockReq(publicId),
        );

        expect(result.business.id).toBe(businessId);
      });

      it('should return business with correct owner_id', async () => {
        const result = await controller.findOne(
          targetBusinessId,
          mockReq(publicId),
        );

        expect(result.business.owner_id).toBe(ownerId);
      });

      it('should return business with correct name', async () => {
        const result = await controller.findOne(
          targetBusinessId,
          mockReq(publicId),
        );

        expect(result.business.name).toBe('Bengkel Jaya');
      });

      it('should return business_hours array with correct length', async () => {
        const result = await controller.findOne(
          targetBusinessId,
          mockReq(publicId),
        );

        expect(result.business_hours).toHaveLength(1);
      });

      it('should return business_hours with correct day_of_week', async () => {
        const result = await controller.findOne(
          targetBusinessId,
          mockReq(publicId),
        );

        expect(result.business_hours[0].day_of_week).toBe(1);
      });

      it('should return business_hours with correct time values', async () => {
        const result = await controller.findOne(
          targetBusinessId,
          mockReq(publicId),
        );

        expect(result.business_hours[0].open_time).toBe('09:00');
        expect(result.business_hours[0].close_time).toBe('17:00');
      });

      it('should default to en language when x-lang header is missing', async () => {
        const req = {
          user: { sub: publicId },
          headers: {},
        } as any;

        await controller.findOne(targetBusinessId, req);

        expect(mockBusinessService.findOneById).toHaveBeenCalledWith(
          targetBusinessId,
          publicId,
          'en',
        );
      });

      it('should handle UUID format businessId parameter', async () => {
        const uuidId = '550e8400-e29b-41d4-a716-446655440000';

        await controller.findOne(uuidId, mockReq(publicId));

        expect(mockBusinessService.findOneById).toHaveBeenCalledWith(
          uuidId,
          publicId,
          'en',
        );
      });

      it('should return business with pending status', async () => {
        const pendingBusiness = { ...mockCreatedBusiness, status: 'pending' };
        (mockBusinessService.findOneById as jest.Mock).mockResolvedValueOnce({
          business: pendingBusiness,
          business_hours: mockBusinessHours,
        });

        const result = await controller.findOne(
          targetBusinessId,
          mockReq(publicId),
        );

        expect(result.business.status).toBe('pending');
      });

      it('should return business with empty business_hours array', async () => {
        (mockBusinessService.findOneById as jest.Mock).mockResolvedValueOnce({
          business: mockCreatedBusiness,
          business_hours: [],
        });

        const result = await controller.findOne(
          targetBusinessId,
          mockReq(publicId),
        );

        expect(result.business_hours).toEqual([]);
      });

      it('should return business with all optional fields populated', async () => {
        const fullBusiness = {
          ...mockCreatedBusiness,
          tagline: 'Best workshop',
          phone: '+6281234567890',
          image: 'uploads/images/biz.jpg',
          cover_image: 'uploads/images/cover.jpg',
          latitude: '-6.2088',
          longitude: '106.8456',
          address: 'Jl. Sudirman No. 123',
        };
        (mockBusinessService.findOneById as jest.Mock).mockResolvedValueOnce({
          business: fullBusiness,
          business_hours: mockBusinessHours,
        });

        const result = await controller.findOne(
          targetBusinessId,
          mockReq(publicId),
        );

        expect(result.business.tagline).toBe('Best workshop');
        expect(result.business.phone).toBeTruthy();
        expect(result.business.image).toBeTruthy();
        expect(result.business.cover_image).toBeTruthy();
        expect(result.business.latitude).toBeTruthy();
        expect(result.business.longitude).toBeTruthy();
        expect(result.business.address).toBeTruthy();
      });

      it('should return business with null optional fields', async () => {
        const minimalBusiness = {
          ...mockCreatedBusiness,
          tagline: null,
          phone: null,
          image: null,
          cover_image: null,
          latitude: null,
          longitude: null,
          address: null,
        };
        (mockBusinessService.findOneById as jest.Mock).mockResolvedValueOnce({
          business: minimalBusiness,
          business_hours: [],
        });

        const result = await controller.findOne(
          targetBusinessId,
          mockReq(publicId),
        );

        expect(result.business.tagline).toBeNull();
        expect(result.business.phone).toBeNull();
      });
    });

    // ========================================================================
    // NEGATIVE TEST CASES
    // ========================================================================

    describe('Negative Test Cases', () => {
      it('should throw UnauthorizedException when req.user is undefined', async () => {
        const req = { headers: { 'x-lang': 'en' } } as any;

        await expect(
          controller.findOne(targetBusinessId, req),
        ).rejects.toThrow(UnauthorizedException);
      });

      it('should throw UnauthorizedException when req.user.sub is undefined', async () => {
        const req = {
          user: {},
          headers: { 'x-lang': 'en' },
        } as any;

        await expect(
          controller.findOne(targetBusinessId, req),
        ).rejects.toThrow(UnauthorizedException);
      });

      it('should throw UnauthorizedException when req.user is null', async () => {
        const req = {
          user: null,
          headers: { 'x-lang': 'en' },
        } as any;

        await expect(
          controller.findOne(targetBusinessId, req),
        ).rejects.toThrow(UnauthorizedException);
      });

      it('should not call findOneById when sub is missing', async () => {
        const req = { headers: { 'x-lang': 'en' } } as any;

        await expect(
          controller.findOne(targetBusinessId, req),
        ).rejects.toThrow(UnauthorizedException);

        expect(mockBusinessService.findOneById).not.toHaveBeenCalled();
      });

      it('should propagate NotFoundException from service', async () => {
        (mockBusinessService.findOneById as jest.Mock).mockRejectedValueOnce(
          new NotFoundException('Business not found'),
        );

        await expect(
          controller.findOne('non-existent-id', mockReq(publicId)),
        ).rejects.toThrow(NotFoundException);
      });

      it('should propagate ForbiddenException from service', async () => {
        (mockBusinessService.findOneById as jest.Mock).mockRejectedValueOnce(
          new ForbiddenException('Access denied'),
        );

        await expect(
          controller.findOne(targetBusinessId, mockReq(publicId)),
        ).rejects.toThrow(ForbiddenException);
      });

      it('should propagate UnauthorizedException from service', async () => {
        (mockBusinessService.findOneById as jest.Mock).mockRejectedValueOnce(
          new UnauthorizedException('Invalid token'),
        );

        await expect(
          controller.findOne(targetBusinessId, mockReq(publicId)),
        ).rejects.toThrow(UnauthorizedException);
      });

      it('should propagate generic errors from service', async () => {
        (mockBusinessService.findOneById as jest.Mock).mockRejectedValueOnce(
          new Error('Internal server error'),
        );

        await expect(
          controller.findOne(targetBusinessId, mockReq(publicId)),
        ).rejects.toThrow('Internal server error');
      });

      it('should call i18n.t with correct key when sub is missing', async () => {
        const req = { headers: { 'x-lang': 'en' } } as any;

        await expect(
          controller.findOne(targetBusinessId, req),
        ).rejects.toThrow(UnauthorizedException);

        expect(mockI18nService.t).toHaveBeenCalledWith(
          'businesses.errors.ownerRequired',
          { lang: 'en' },
        );
      });

      it('should use Indonesian language for error when x-lang is id', async () => {
        const req = { headers: { 'x-lang': 'id' } } as any;

        await expect(
          controller.findOne(targetBusinessId, req),
        ).rejects.toThrow(UnauthorizedException);

        expect(mockI18nService.t).toHaveBeenCalledWith(
          'businesses.errors.ownerRequired',
          { lang: 'id' },
        );
      });
    });

    // ========================================================================
    // EDGE CASES
    // ========================================================================

    describe('Edge Cases', () => {
      it('should handle empty string businessId (delegate to service)', async () => {
        (mockBusinessService.findOneById as jest.Mock).mockRejectedValueOnce(
          new NotFoundException('Business not found'),
        );

        await expect(
          controller.findOne('', mockReq(publicId)),
        ).rejects.toThrow(NotFoundException);
      });

      it('should pass business_id param directly to service', async () => {
        const longId = 'a'.repeat(100);

        await controller.findOne(longId, mockReq(publicId));

        expect(mockBusinessService.findOneById).toHaveBeenCalledWith(
          longId,
          publicId,
          'en',
        );
      });

      it('should handle concurrent findOne calls', async () => {
        const promises = Array.from({ length: 5 }, () =>
          controller.findOne(targetBusinessId, mockReq(publicId)),
        );

        const results = await Promise.all(promises);

        results.forEach((result) => {
          expect(result).toHaveProperty('business');
          expect(result).toHaveProperty('business_hours');
        });
      });

      it('should handle x-lang as empty string (defaults to en)', async () => {
        const req = {
          user: { sub: publicId },
          headers: { 'x-lang': '' },
        } as any;

        await controller.findOne(targetBusinessId, req);

        expect(mockBusinessService.findOneById).toHaveBeenCalledWith(
          targetBusinessId,
          publicId,
          'en',
        );
      });
    });
  });
});
