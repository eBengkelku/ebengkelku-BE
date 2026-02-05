import {
  Controller,
  Post,
  Get,
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
} from '@nestjs/swagger';
import {
  CreateServiceDto,
  BatchCreateServicesDto,
} from './dto/create-service.dto';
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
