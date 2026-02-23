import {
  Controller,
  Post,
  Get,
  Delete,
  Put,
  Body,
  Param,
  Req,
  UseInterceptors,
  UseGuards,
  UnauthorizedException,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { FileFieldsInterceptor } from '@nestjs/platform-express';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiConsumes,
  ApiBody,
} from '@nestjs/swagger';
import { I18nService } from 'nestjs-i18n';
import { BusinessService } from './business.service';
import { CreateBusinessDto } from './dto/create-business.dto';
import { UpdateBusinessDto } from './dto/update-business.dto';
import { ResponseMessage } from '../../common/decorators/response-message.decorator';
import { JwtAuthGuard } from '../../auth/jwt.guard';
import { BusinessFormDataInterceptor } from './interceptors/business-form-data.interceptor';
import type { IBusiness, IBusinessHours } from './interfaces';
import type { Request } from 'express';

@Controller('v1/businesses')
@ApiTags('businesses')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard)
@UseInterceptors(
  FileFieldsInterceptor([
    { name: 'image', maxCount: 1 },
    { name: 'cover_image', maxCount: 1 },
  ]),
  BusinessFormDataInterceptor,
)
export class BusinessController {
  constructor(
    private readonly businessService: BusinessService,
    private readonly i18n: I18nService,
  ) {}

  /**
   * Create/register a workshop/business with optional operating hours and images.
   * Owner ID is derived from the authenticated JWT (cannot be spoofed).
   */
  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ResponseMessage('businesses.created')
  @ApiOperation({ summary: 'Create new business' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      required: ['name'],
      properties: {
        name: {
          type: 'string',
          description: 'Business/workshop name',
          example: 'Bengkel Jaya Motor',
          minLength: 1,
          maxLength: 255,
        },
        tagline: {
          type: 'string',
          description: 'Short tagline',
          example: 'Service terpercaya sejak 2010',
          maxLength: 500,
        },
        phone: {
          type: 'string',
          description: 'Contact phone',
          example: '+6281234567890',
          maxLength: 50,
        },
        address: {
          type: 'string',
          description: 'Full address',
          example: 'Jl. Sudirman No. 123, Jakarta',
        },
        latitude: {
          type: 'number',
          description: 'Latitude coordinate',
          example: -6.2088,
          minimum: -90,
          maximum: 90,
        },
        longitude: {
          type: 'number',
          description: 'Longitude coordinate',
          example: 106.8456,
          minimum: -180,
          maximum: 180,
        },
        business_hours: {
          type: 'string',
          description:
            'Operating hours per day as JSON string. Example: [{"day_of_week":1,"open_time":"08:00","close_time":"17:00"}]',
          example:
            '[{"day_of_week":1,"open_time":"08:00","close_time":"17:00"}]',
        },
        image: {
          type: 'string',
          format: 'binary',
          description: 'Business logo/profile image',
        },
        cover_image: {
          type: 'string',
          format: 'binary',
          description: 'Business cover/banner image',
        },
      },
    },
  })
  @ApiResponse({
    status: 201,
    description: 'Business created successfully',
    schema: {
      example: {
        success: true,
        message: 'Business created successfully',
        data: {
          business: {
            id: '550e8400-e29b-41d4-a716-446655440000',
            owner_id: 'user-uuid-internal',
            name: 'Bengkel Jaya Motor',
            tagline: 'Service terpercaya sejak 2010',
            status: 'pending',
            phone: '+6281234567890',
            image: '/var/www/files/images/2026/02/abc123.jpg',
            cover_image: null,
            latitude: '-6.2088',
            longitude: '106.8456',
            address: 'Jl. Sudirman No. 123, Jakarta',
            created_at: '2026-02-05T08:00:00.000Z',
            updated_at: '2026-02-05T08:00:00.000Z',
            deleted_at: null,
            id_creator: 'public-uuid',
            id_updater: null,
          },
          business_hours: [
            {
              id: '660e8400-e29b-41d4-a716-446655440001',
              business_id: '550e8400-e29b-41d4-a716-446655440000',
              day_of_week: 1,
              open_time: '08:00',
              close_time: '17:00',
              created_at: '2026-02-05T08:00:00.000Z',
              updated_at: null,
              deleted_at: null,
              id_creator: 'public-uuid',
              id_updater: null,
            },
          ],
        },
      },
    },
  })
  @ApiResponse({
    status: 400,
    description: 'Validation error',
    schema: {
      example: {
        statusCode: 400,
        message: 'Validation failed',
        errors: [
          {
            field: 'name',
            message: 'Business name is required',
          },
        ],
      },
    },
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized',
    schema: {
      example: {
        statusCode: 401,
        code: 'BUSINESS_OWNER_REQUIRED',
        message: 'Owner identity is required. Please provide a valid JWT.',
      },
    },
  })
  async create(
    @Body() dto: CreateBusinessDto,
    @Req()
    req: Request & {
      user?: { sub: string };
      files?: {
        image?: Express.Multer.File[];
        cover_image?: Express.Multer.File[];
      };
    },
  ) {
    const sub = req.user?.sub;
    const lang = (req.headers['x-lang'] as string) || 'en';
    if (!sub) {
      throw new UnauthorizedException(
        this.i18n.t('businesses.errors.ownerRequired', { lang }),
      );
    }

    const ownerId = await this.businessService.resolveOwnerIdFromSub(sub);
    const creatorPublicId =
      await this.businessService.resolveCreatorPublicId(sub);
    const files = req.files ?? {};
    const image = Array.isArray(files.image) ? files.image[0] : files.image;
    const cover_image = Array.isArray(files.cover_image)
      ? files.cover_image[0]
      : files.cover_image;

    const { owner_id: _omit, ...dtoSafe } = dto as CreateBusinessDto & {
      owner_id?: string;
    };
    const result = await this.businessService.create(
      dtoSafe as CreateBusinessDto,
      ownerId,
      creatorPublicId,
      {
        image,
        cover_image,
        lang,
      },
    );

    return {
      business: result.business,
      business_hours: result.business_hours,
    };
  }

  /**
   * Get all businesses owned by the authenticated user.
   * Returns empty array if user has no businesses.
   * Owner is derived from JWT (cannot be spoofed).
   *
   * @param {Request} req - Express request with JWT user payload
   * @returns {Promise<Array<{business: IBusiness; business_hours: IBusinessHours[]}>>}
   * @throws {UnauthorizedException} If JWT is invalid or user not found
   *
   * @example
   * ```
   * GET /v1/businesses
   * Headers:
   *   Authorization: Bearer <jwt-token>
   *   x-lang: en
   *
   * Response:
   * {
   *   "statusCode": 200,
   *   "message": "Businesses retrieved successfully",
   *   "data": [
   *     {
   *       "business": { "id": "...", "name": "Bengkel A", ... },
   *       "business_hours": [ { "day_of_week": 1, ... } ]
   *     }
   *   ]
   * }
   * ```
   */
  @Get()
  @HttpCode(HttpStatus.OK)
  @ResponseMessage('businesses.listed')
  @ApiOperation({ summary: 'Get all businesses with operating hours' })
  @ApiResponse({
    status: 200,
    description: 'Businesses retrieved successfully',
    schema: {
      type: 'object',
      properties: {
        statusCode: { type: 'number', example: 200 },
        message: {
          type: 'string',
          example: 'Businesses retrieved successfully',
        },
        data: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              business: {
                type: 'object',
                properties: {
                  id: { type: 'string', example: 'uuid-123' },
                  owner_id: { type: 'string', example: 'user-uuid' },
                  name: { type: 'string', example: 'Bengkel Jaya Motor' },
                  tagline: { type: 'string', example: 'Service terpercaya' },
                  status: {
                    type: 'string',
                    enum: ['pending', 'active', 'banned'],
                    example: 'active',
                  },
                  phone: { type: 'string', example: '+6281234567890' },
                  image: { type: 'string', example: 'uploads/...' },
                  cover_image: { type: 'string', example: 'uploads/...' },
                  latitude: { type: 'string', example: '-6.2088' },
                  longitude: { type: 'string', example: '106.8456' },
                  address: { type: 'string', example: 'Jl. Sudirman No. 123' },
                  created_at: {
                    type: 'string',
                    format: 'date-time',
                    example: '2026-01-15T08:30:00.000Z',
                  },
                  updated_at: {
                    type: 'string',
                    format: 'date-time',
                    example: '2026-01-20T10:15:00.000Z',
                  },
                  deleted_at: { type: 'string', nullable: true, example: null },
                  id_creator: { type: 'string', example: 'public-uuid' },
                  id_updater: { type: 'string', nullable: true, example: null },
                },
              },
              business_hours: {
                type: 'array',
                items: {
                  type: 'object',
                  properties: {
                    id: { type: 'string', example: 'hour-uuid' },
                    business_id: { type: 'string', example: 'business-uuid' },
                    day_of_week: {
                      type: 'number',
                      minimum: 0,
                      maximum: 6,
                      example: 1,
                    },
                    open_time: { type: 'string', example: '08:00' },
                    close_time: { type: 'string', example: '17:00' },
                    updated_at: {
                      type: 'string',
                      format: 'date-time',
                      nullable: true,
                      example: null,
                    },
                    deleted_at: {
                      type: 'string',
                      nullable: true,
                      example: null,
                    },
                    id_creator: { type: 'string', example: 'public-uuid' },
                    id_updater: {
                      type: 'string',
                      nullable: true,
                      example: null,
                    },
                  },
                },
              },
            },
          },
        },
      },
    },
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized',
    schema: {
      example: {
        statusCode: 401,
        code: 'BUSINESS_OWNER_REQUIRED',
        message: 'Owner identity is required. Please provide a valid JWT.',
      },
    },
  })
  async findAll(
    @Req()
    req: Request & {
      user?: { sub: string };
    },
  ): Promise<Array<{ business: IBusiness; business_hours: IBusinessHours[] }>> {
    const sub = req.user?.sub;
    const lang = (req.headers['x-lang'] as string) || 'en';

    if (!sub) {
      throw new UnauthorizedException(
        this.i18n.t('businesses.errors.ownerRequired', { lang }),
      );
    }

    return this.businessService.findAllByOwner(sub, lang);
  }

  /**
   * Get a specific business by ID owned by the authenticated user.
   * Returns the business with its business_hours.
   * Owner is derived from JWT (cannot be spoofed).
   * Only the owner of the business can access this endpoint.
   *
   * @param {string} businessId - UUID of the business (from URL path)
   * @param {Request} req - Express request with JWT user payload
   * @returns {Promise<{ business: IBusiness; business_hours: IBusinessHours[] }>}
   * @throws {UnauthorizedException} If JWT is invalid or user not found
   * @throws {NotFoundException} If business not found or soft-deleted
   * @throws {ForbiddenException} If user is not the owner of the business
   *
   * @example
   * ```
   * GET /v1/businesses/550e8400-e29b-41d4-a716-446655440000
   * Headers:
   *   Authorization: Bearer <jwt-token>
   *   x-lang: en
   *
   * Response:
   * {
   *   "statusCode": 200,
   *   "message": "Business retrieved successfully",
   *   "data": {
   *     "business": { "id": "...", "name": "Bengkel A", ... },
   *     "business_hours": [ { "day_of_week": 1, ... } ]
   *   }
   * }
   * ```
   */
  @Get(':business_id')
  @HttpCode(HttpStatus.OK)
  @ResponseMessage('businesses.found')
  @ApiOperation({ summary: 'Get business by ID' })
  @ApiResponse({
    status: 200,
    description: 'Business found',
    schema: {
      type: 'object',
      properties: {
        statusCode: { type: 'number', example: 200 },
        message: {
          type: 'string',
          example: 'Business retrieved successfully',
        },
        data: {
          type: 'object',
          properties: {
            business: {
              type: 'object',
              properties: {
                id: {
                  type: 'string',
                  example: '550e8400-e29b-41d4-a716-446655440000',
                },
                owner_id: { type: 'string', example: 'user-uuid' },
                name: { type: 'string', example: 'Bengkel Jaya Motor' },
                tagline: { type: 'string', example: 'Service terpercaya' },
                status: {
                  type: 'string',
                  enum: ['pending', 'active', 'banned'],
                  example: 'active',
                },
                phone: { type: 'string', example: '+6281234567890' },
                image: { type: 'string', example: 'uploads/...' },
                cover_image: { type: 'string', example: 'uploads/...' },
                latitude: { type: 'string', example: '-6.2088' },
                longitude: { type: 'string', example: '106.8456' },
                address: {
                  type: 'string',
                  example: 'Jl. Sudirman No. 123',
                },
                created_at: {
                  type: 'string',
                  format: 'date-time',
                  example: '2026-01-15T08:30:00.000Z',
                },
                updated_at: {
                  type: 'string',
                  format: 'date-time',
                  example: '2026-01-20T10:15:00.000Z',
                },
                deleted_at: {
                  type: 'string',
                  nullable: true,
                  example: null,
                },
                id_creator: { type: 'string', example: 'public-uuid' },
                id_updater: {
                  type: 'string',
                  nullable: true,
                  example: null,
                },
              },
            },
            business_hours: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  id: { type: 'string', example: 'hour-uuid' },
                  business_id: { type: 'string', example: 'business-uuid' },
                  day_of_week: {
                    type: 'number',
                    minimum: 0,
                    maximum: 6,
                    example: 1,
                  },
                  open_time: { type: 'string', example: '08:00' },
                  close_time: { type: 'string', example: '17:00' },
                  updated_at: {
                    type: 'string',
                    format: 'date-time',
                    nullable: true,
                    example: null,
                  },
                  deleted_at: {
                    type: 'string',
                    nullable: true,
                    example: null,
                  },
                  id_creator: { type: 'string', example: 'public-uuid' },
                  id_updater: {
                    type: 'string',
                    nullable: true,
                    example: null,
                  },
                },
              },
            },
          },
        },
      },
    },
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized',
    schema: {
      example: {
        statusCode: 401,
        code: 'BUSINESS_OWNER_REQUIRED',
        message: 'Owner identity is required. Please provide a valid JWT.',
      },
    },
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden',
    schema: {
      example: {
        statusCode: 403,
        code: 'BUSINESS_ACCESS_DENIED',
        message: 'You do not have permission to access this business',
      },
    },
  })
  @ApiResponse({
    status: 404,
    description: 'Business not found',
    schema: {
      example: {
        statusCode: 404,
        code: 'BUSINESS_NOT_FOUND',
        message: 'Business not found',
      },
    },
  })
  async findOne(
    @Param('business_id') businessId: string,
    @Req()
    req: Request & {
      user?: { sub: string };
    },
  ): Promise<{ business: IBusiness; business_hours: IBusinessHours[] }> {
    const sub = req.user?.sub;
    const lang = (req.headers['x-lang'] as string) || 'en';

    if (!sub) {
      throw new UnauthorizedException(
        this.i18n.t('businesses.errors.ownerRequired', { lang }),
      );
    }

    return this.businessService.findOneById(businessId, sub, lang);
  }

  /**
   * Update a business by ID owned by the authenticated user.
   * Supports partial updates for all fields including images and business_hours.
   * Only the owner of the business can update it.
   *
   * @param {string} businessId - UUID of the business (from URL path)
   * @param {UpdateBusinessDto} dto - Fields to update (all optional)
   * @param {Request} req - Express request with JWT user payload and files
   * @returns {Promise<{ business: IBusiness; business_hours: IBusinessHours[] }>}
   * @throws {UnauthorizedException} If JWT is invalid or user not found
   * @throws {BadRequestException} If validation fails
   * @throws {NotFoundException} If business not found or soft-deleted
   * @throws {ForbiddenException} If user is not the owner of the business
   *
   * @example
   * ```
   * PUT /v1/businesses/550e8400-e29b-41d4-a716-446655440000
   * Headers:
   *   Authorization: Bearer <jwt-token>
   *   Content-Type: multipart/form-data
   *   x-lang: en
   *
   * Body (form-data):
   *   name: "Bengkel Jaya Motor Updated"
   *   tagline: "Service terpercaya sejak 2010"
   *   business_hours: [{"day_of_week":1,"open_time":"08:00","close_time":"17:00"}]
   *   image: (file)
   *
   * Response:
   * {
   *   "success": true,
   *   "statusCode": 200,
   *   "message": "Business updated successfully",
   *   "data": {
   *     "business": { "id": "...", "name": "Bengkel Jaya Motor Updated", ... },
   *     "business_hours": [ { "day_of_week": 1, ... } ]
   *   },
   *   "errors": null,
   *   "timestamp": "2026-02-18T10:00:01.000Z",
   *   "path": "/v1/businesses/550e8400-e29b-41d4-a716-446655440000",
   *   "requestTime": 120
   * }
   * ```
   */
  @Put(':business_id')
  @HttpCode(HttpStatus.OK)
  @ResponseMessage('businesses.updated')
  @ApiOperation({ summary: 'Update business by ID' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        name: {
          type: 'string',
          description: 'Business/workshop name',
          example: 'Bengkel Jaya Motor Updated',
          minLength: 1,
          maxLength: 255,
        },
        tagline: {
          type: 'string',
          description: 'Short tagline',
          example: 'Service terpercaya sejak 2010',
          maxLength: 500,
        },
        status: {
          type: 'string',
          enum: ['pending', 'active', 'banned'],
          description: 'Business status',
          example: 'active',
        },
        phone: {
          type: 'string',
          description: 'Contact phone',
          example: '+6281234567890',
          maxLength: 50,
        },
        address: {
          type: 'string',
          description: 'Full address',
          example: 'Jl. Sudirman No. 123, Jakarta',
        },
        latitude: {
          type: 'number',
          description: 'Latitude coordinate',
          example: -6.2088,
          minimum: -90,
          maximum: 90,
        },
        longitude: {
          type: 'number',
          description: 'Longitude coordinate',
          example: 106.8456,
          minimum: -180,
          maximum: 180,
        },
        business_hours: {
          type: 'string',
          description:
            'Operating hours per day as JSON string. Example: [{"day_of_week":1,"open_time":"08:00","close_time":"17:00"}]',
          example:
            '[{"day_of_week":1,"open_time":"08:00","close_time":"17:00"}]',
        },
        image: {
          type: 'string',
          format: 'binary',
          description: 'Business logo/profile image',
        },
        cover_image: {
          type: 'string',
          format: 'binary',
          description: 'Business cover/banner image',
        },
      },
    },
  })
  @ApiResponse({
    status: 200,
    description: 'Business updated successfully',
    schema: {
      example: {
        success: true,
        statusCode: 200,
        message: 'Business updated successfully',
        data: {
          business: {
            id: '550e8400-e29b-41d4-a716-446655440000',
            owner_id: 'user-uuid-internal',
            name: 'Bengkel Jaya Motor Updated',
            tagline: 'Service terpercaya sejak 2010',
            status: 'active',
            phone: '+6281234567890',
            image: '/var/www/files/images/2026/02/abc123.jpg',
            cover_image: '/var/www/files/images/2026/02/cover123.jpg',
            latitude: '-6.2088',
            longitude: '106.8456',
            address: 'Jl. Sudirman No. 123, Jakarta',
            created_at: '2026-02-05T08:00:00.000Z',
            updated_at: '2026-02-18T10:00:00.000Z',
            deleted_at: null,
            id_creator: 'public-uuid',
            id_updater: 'public-uuid',
          },
          business_hours: [
            {
              id: '660e8400-e29b-41d4-a716-446655440001',
              business_id: '550e8400-e29b-41d4-a716-446655440000',
              day_of_week: 1,
              open_time: '08:00',
              close_time: '17:00',
              updated_at: '2026-02-18T10:00:00.000Z',
              deleted_at: null,
              id_creator: 'public-uuid',
              id_updater: 'public-uuid',
            },
          ],
        },
        errors: null,
        timestamp: '2026-02-18T10:00:01.000Z',
        path: '/v1/businesses/550e8400-e29b-41d4-a716-446655440000',
        requestTime: 120,
      },
    },
  })
  @ApiResponse({
    status: 400,
    description: 'Validation error',
    schema: {
      example: {
        success: false,
        statusCode: 400,
        message: 'Validation failed',
        data: null,
        errors: [
          {
            field: 'name',
            message: 'Business name must be between 1 and 255 characters',
            code: 'VALIDATION_LENGTH',
          },
        ],
        timestamp: '2026-02-18T10:00:01.000Z',
        path: '/v1/businesses/550e8400-e29b-41d4-a716-446655440000',
        requestTime: 5,
      },
    },
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized',
    schema: {
      example: {
        success: false,
        statusCode: 401,
        message: 'Owner identity is required. Please provide a valid JWT.',
        data: null,
        errors: [
          {
            code: 'UNAUTHORIZED',
            message: 'Owner identity is required. Please provide a valid JWT.',
          },
        ],
        timestamp: '2026-02-18T10:00:01.000Z',
        path: '/v1/businesses/550e8400-e29b-41d4-a716-446655440000',
        requestTime: 2,
      },
    },
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden',
    schema: {
      example: {
        success: false,
        statusCode: 403,
        message: 'You do not have permission to access this business',
        data: null,
        errors: [
          {
            code: 'BUSINESS_ACCESS_DENIED',
            message: 'You do not have permission to access this business',
          },
        ],
        timestamp: '2026-02-18T10:00:01.000Z',
        path: '/v1/businesses/550e8400-e29b-41d4-a716-446655440000',
        requestTime: 8,
      },
    },
  })
  @ApiResponse({
    status: 404,
    description: 'Business not found',
    schema: {
      example: {
        success: false,
        statusCode: 404,
        message: 'Business not found',
        data: null,
        errors: [
          {
            code: 'BUSINESS_NOT_FOUND',
            message: 'Business not found',
          },
        ],
        timestamp: '2026-02-18T10:00:01.000Z',
        path: '/v1/businesses/00000000-0000-0000-0000-000000000000',
        requestTime: 6,
      },
    },
  })
  async update(
    @Param('business_id') businessId: string,
    @Body() dto: UpdateBusinessDto,
    @Req()
    req: Request & {
      user?: { sub: string };
      files?: {
        image?: Express.Multer.File[];
        cover_image?: Express.Multer.File[];
      };
    },
  ): Promise<{ business: IBusiness; business_hours: IBusinessHours[] }> {
    const sub = req.user?.sub;
    const lang = (req.headers['x-lang'] as string) || 'en';

    if (!sub) {
      throw new UnauthorizedException(
        this.i18n.t('businesses.errors.ownerRequired', { lang }),
      );
    }

    const files = req.files ?? {};
    const image = Array.isArray(files.image) ? files.image[0] : files.image;
    const cover_image = Array.isArray(files.cover_image)
      ? files.cover_image[0]
      : files.cover_image;

    // Prevent owner_id spoofing: remove from DTO if present
    const { owner_id: _omit, ...dtoSafe } = dto as UpdateBusinessDto & {
      owner_id?: string;
    };

    return this.businessService.update(
      businessId,
      dtoSafe as UpdateBusinessDto,
      sub,
      {
        image,
        cover_image,
        lang,
      },
    );
  }

  /**
   * Delete (soft delete) a business by ID owned by the authenticated user.
   * Cascades soft delete to business_hours, business_reviews, and services.
   * Deletes physical image files after successful database transaction.
   * Only the owner of the business can delete it.
   * Idempotent: returns 200 OK if business is already soft-deleted.
   *
   * @param {string} businessId - UUID of the business (from URL path)
   * @param {Request} req - Express request with JWT user payload
   * @returns {Promise<void>}
   * @throws {UnauthorizedException} If JWT is invalid or user not found
   * @throws {BadRequestException} If businessId is empty/invalid
   * @throws {NotFoundException} If business not found
   * @throws {ForbiddenException} If user is not the owner of the business
   *
   * @example
   * ```
   * DELETE /v1/businesses/550e8400-e29b-41d4-a716-446655440000
   * Headers:
   *   Authorization: Bearer <jwt-token>
   *   x-lang: en
   *
   * Response:
   * {
   *   "success": true,
   *   "statusCode": 200,
   *   "message": "Business deleted successfully",
   *   "data": null,
   *   "errors": null,
   *   "timestamp": "2026-02-18T10:00:00.000Z",
   *   "path": "/v1/businesses/550e8400-e29b-41d4-a716-446655440000",
   *   "requestTime": 45
   * }
   * ```
   */
  @Delete(':business_id')
  @HttpCode(HttpStatus.OK)
  @ResponseMessage('businesses.deleted')
  @ApiOperation({ summary: 'Delete business by ID (soft delete)' })
  @ApiResponse({
    status: 200,
    description: 'Business deleted successfully',
    schema: {
      example: {
        success: true,
        statusCode: 200,
        message: 'Business deleted successfully',
        data: null,
        errors: null,
        timestamp: '2026-02-18T10:00:00.000Z',
        path: '/v1/businesses/550e8400-e29b-41d4-a716-446655440000',
        requestTime: 45,
      },
    },
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid business ID',
    schema: {
      example: {
        success: false,
        statusCode: 400,
        message: 'Business ID is required and must be a valid identifier',
        data: null,
        errors: [
          {
            code: 'INVALID_BUSINESS_ID',
            message: 'Business ID is required and must be a valid identifier',
          },
        ],
        timestamp: '2026-02-18T10:00:00.000Z',
        path: '/v1/businesses/invalid',
        requestTime: 5,
      },
    },
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized',
    schema: {
      example: {
        success: false,
        statusCode: 401,
        message: 'Owner identity is required. Please provide a valid JWT.',
        data: null,
        errors: [
          {
            code: 'BUSINESS_OWNER_REQUIRED',
            message: 'Owner identity is required. Please provide a valid JWT.',
          },
        ],
        timestamp: '2026-02-18T10:00:00.000Z',
        path: '/v1/businesses/550e8400-e29b-41d4-a716-446655440000',
        requestTime: 2,
      },
    },
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden',
    schema: {
      example: {
        success: false,
        statusCode: 403,
        message: 'You do not have permission to access this business',
        data: null,
        errors: [
          {
            code: 'BUSINESS_ACCESS_DENIED',
            message: 'You do not have permission to access this business',
          },
        ],
        timestamp: '2026-02-18T10:00:00.000Z',
        path: '/v1/businesses/550e8400-e29b-41d4-a716-446655440000',
        requestTime: 12,
      },
    },
  })
  @ApiResponse({
    status: 404,
    description: 'Business not found',
    schema: {
      example: {
        success: false,
        statusCode: 404,
        message: 'Business not found',
        data: null,
        errors: [
          {
            code: 'BUSINESS_NOT_FOUND',
            message: 'Business not found',
          },
        ],
        timestamp: '2026-02-18T10:00:00.000Z',
        path: '/v1/businesses/550e8400-e29b-41d4-a716-446655440001',
        requestTime: 8,
      },
    },
  })
  async remove(
    @Param('business_id') businessId: string,
    @Req()
    req: Request & {
      user?: { sub: string };
    },
  ): Promise<void> {
    const sub = req.user?.sub;
    const lang = (req.headers['x-lang'] as string) || 'en';

    if (!sub) {
      throw new UnauthorizedException(
        this.i18n.t('businesses.errors.ownerRequired', { lang }),
      );
    }

    await this.businessService.remove(businessId, sub, lang);
  }
}
