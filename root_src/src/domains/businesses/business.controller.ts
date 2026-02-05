import {
  Controller,
  Post,
  Body,
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
import { ResponseMessage } from '../../common/decorators/response-message.decorator';
import { JwtAuthGuard } from '../../auth/jwt.guard';
import { BusinessFormDataInterceptor } from './interceptors/business-form-data.interceptor';
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
  @ApiOperation({
    summary: 'Create business',
    description:
      'Create a workshop/business. Owner is taken from JWT. Optional: tagline, phone, address, latitude, longitude, image, cover_image, business_hours[].',
  })
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
    description: 'Business created with business_hours',
  })
  @ApiResponse({ status: 400, description: 'Validation error' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
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
}
