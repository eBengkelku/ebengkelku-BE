import {
  Controller,
  Post,
  Get,
  Put,
  Delete,
  Body,
  Param,
  Headers,
  UseGuards,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiHeader,
  ApiParam,
} from '@nestjs/swagger';
import {
  CreateServiceDto,
  BatchCreateServicesDto,
  UpdateServiceDto,
  DeleteServiceDto,
} from './dto';
import { ServiceService } from './service.service';
import { JwtAuthGuard } from '../../auth/jwt.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { ResponseMessage } from '../../common/decorators/response-message.decorator';
import { IService } from './interfaces/service.interface';

/**
 * Service Controller - HTTP endpoints for workshop services (layanan).
 */
@Controller('v1')
@ApiTags('Services')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard)
export class ServiceController {
  constructor(private readonly serviceService: ServiceService) {}

  // ─── GLOBAL SERVICE ROUTES ─────────────────────

  /** Create a single service */
  @Post('services')
  @ApiOperation({ summary: 'Create a single service' })
  @ApiHeader({
    name: 'x-lang',
    required: false,
    schema: { enum: ['en', 'id'], default: 'en' },
  })
  @ApiResponse({ status: 201, description: 'Service created successfully' })
  @ApiResponse({ status: 400, description: 'Validation error' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({
    status: 403,
    description: 'Access denied or business inactive',
  })
  @ApiResponse({ status: 404, description: 'Business not found' })
  @ApiResponse({ status: 409, description: 'Service name already exists' })
  @ResponseMessage('services.success.created')
  async create(
    @Body() dto: CreateServiceDto,
    @Headers('x-lang') lang = 'en',
    @CurrentUser() user: { sub: string },
  ): Promise<IService> {
    return this.serviceService.createSingle(dto, user.sub, lang);
  }

  /** Create multiple services in batch (max 20) */
  @Post('services/batch')
  @ApiOperation({ summary: 'Create multiple services (max 20)' })
  @ApiHeader({
    name: 'x-lang',
    required: false,
    schema: { enum: ['en', 'id'], default: 'en' },
  })
  @ApiResponse({ status: 201, description: 'Services created successfully' })
  @ApiResponse({
    status: 400,
    description: 'Validation error or batch too large',
  })
  @ApiResponse({
    status: 409,
    description: 'Duplicate names in batch or database',
  })
  @ResponseMessage('services.success.batchCreated')
  async createBatch(
    @Body() dto: BatchCreateServicesDto,
    @Headers('x-lang') lang = 'en',
    @CurrentUser() user: { sub: string },
  ): Promise<IService[]> {
    return this.serviceService.createBatch(dto, user.sub, lang);
  }

  /** Get service by ID */
  @Get('services/:id')
  @ApiOperation({ summary: 'Get service by ID' })
  @ApiResponse({ status: 200, description: 'Service found' })
  @ApiResponse({ status: 404, description: 'Service not found' })
  @ResponseMessage('services.success.found')
  async findById(
    @Param('id') id: string,
    @Headers('x-lang') lang = 'en',
  ): Promise<IService> {
    return this.serviceService.findById(id, lang);
  }

  /** Update service by ID */
  @Put('services/:id')
  @ApiOperation({
    summary: 'Update service by ID',
    description: `
      Update a service. Requires business ownership or association.
      
      **Authorization:**
      - User must be the owner of the business
      - OR user must be associated with the business
      
      **Validation:**
      - business_id is required in request body
      - Service must belong to the specified business
      - If name is updated, it must be unique within the business
    `,
  })
  @ApiParam({
    name: 'id',
    description: 'Service ID (UUID)',
    example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
  })
  @ApiHeader({
    name: 'x-lang',
    required: false,
    schema: { enum: ['en', 'id'], default: 'en' },
  })
  @ApiResponse({
    status: 200,
    description: 'Service updated successfully',
    schema: {
      example: {
        success: true,
        message: 'Service updated successfully',
        data: {
          id: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
          business_id: 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
          name: 'Premium Oil Change Service',
          description: 'High-quality oil change with filter replacement',
          price: 200000,
          duration_minutes: 45,
          daily_quota: 15,
          id_creator: 'user-uuid-123',
          created_at: '2026-02-10T10:00:00.000Z',
          updated_at: '2026-02-11T14:30:00.000Z',
          deleted_at: null,
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
            field: 'business_id',
            message: 'Business ID is required',
          },
        ],
      },
    },
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - Invalid or missing JWT token',
    schema: {
      example: {
        statusCode: 401,
        message: 'Unauthorized',
      },
    },
  })
  @ApiResponse({
    status: 403,
    description: 'Access denied - Not business owner or inactive business',
    schema: {
      example: {
        statusCode: 403,
        message: 'Access denied to this business',
      },
    },
  })
  @ApiResponse({
    status: 404,
    description: 'Business or service not found',
    schema: {
      examples: {
        businessNotFound: {
          summary: 'Business not found',
          value: {
            statusCode: 404,
            message: 'Business not found',
          },
        },
        serviceNotFound: {
          summary: 'Service not found',
          value: {
            statusCode: 404,
            message: 'Service not found',
          },
        },
      },
    },
  })
  @ApiResponse({
    status: 409,
    description: 'Service name already exists',
    schema: {
      example: {
        statusCode: 409,
        message: 'Service name "Oil Change Service" already exists',
      },
    },
  })
  @ResponseMessage('services.success.updated')
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateServiceDto,
    @Headers('x-lang') lang = 'en',
    @CurrentUser() user: { sub: string },
  ): Promise<IService> {
    return this.serviceService.update(id, dto, user.sub, lang);
  }

  /** Delete service by ID */
  @Delete('services/:id')
  @ApiOperation({
    summary: 'Delete service by ID',
    description: `
      Soft delete a service. Requires business ownership or association.
      
      **Authorization:**
      - User must be the owner of the business
      - OR user must be associated with the business
      
      **Validation:**
      - business_id is required in request body
      - Service must belong to the specified business
      
      **Note:** This is a soft delete. The service will be marked as deleted but not removed from the database.
    `,
  })
  @ApiParam({
    name: 'id',
    description: 'Service ID (UUID)',
    example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
  })
  @ApiHeader({
    name: 'x-lang',
    required: false,
    schema: { enum: ['en', 'id'], default: 'en' },
  })
  @ApiResponse({
    status: 200,
    description: 'Service deleted successfully',
    schema: {
      example: {
        success: true,
        message: 'Service deleted successfully',
        data: null,
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
            field: 'business_id',
            message: 'Business ID is required',
          },
        ],
      },
    },
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - Invalid or missing JWT token',
    schema: {
      example: {
        statusCode: 401,
        message: 'Unauthorized',
      },
    },
  })
  @ApiResponse({
    status: 403,
    description: 'Access denied - Not business owner or inactive business',
    schema: {
      example: {
        statusCode: 403,
        message: 'Access denied to this business',
      },
    },
  })
  @ApiResponse({
    status: 404,
    description: 'Business or service not found',
    schema: {
      examples: {
        businessNotFound: {
          summary: 'Business not found',
          value: {
            statusCode: 404,
            message: 'Business not found',
          },
        },
        serviceNotFound: {
          summary: 'Service not found',
          value: {
            statusCode: 404,
            message: 'Service not found',
          },
        },
      },
    },
  })
  @ResponseMessage('services.success.deleted')
  async delete(
    @Param('id') id: string,
    @Body() dto: DeleteServiceDto,
    @Headers('x-lang') lang = 'en',
    @CurrentUser() user: { sub: string },
  ): Promise<void> {
    return this.serviceService.delete(id, dto, user.sub, lang);
  }

  // ─── BUSINESS-SCOPED ROUTES ────────────────────

  /** Get all services for a business */
  @Get('businesses/:businessId/services')
  @ApiOperation({ summary: 'Get services by business ID' })
  @ApiResponse({ status: 200, description: 'Services found' })
  @ApiResponse({ status: 403, description: 'Access denied' })
  @ResponseMessage('services.success.listed')
  async findByBusinessId(
    @Param('businessId') businessId: string,
    @Headers('x-lang') lang = 'en',
    @CurrentUser() user: { sub: string },
  ): Promise<IService[]> {
    return this.serviceService.findByBusinessId(businessId, user.sub, lang);
  }
}
