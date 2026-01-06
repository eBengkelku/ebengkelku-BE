import {
  Get,
  Post,
  Put,
  Delete,
  Param,
  Body,
  Query,
  Headers,
  UseGuards,
  UsePipes,
  ValidationPipe,
  UploadedFile,
  BadRequestException,
} from '@nestjs/common';
import { ParseUUIDPipe } from '../pipes/uuid-validation.pipe';
import { BaseKnexService } from '../services/base-knex.service';
import type { SearchDto } from '../services/base-knex.service';
import { JwtAuthGuard } from '../../auth/jwt.guard';
import { BasePaginationQueryDto } from '../dto/pagination.dto';
import { ResponseMessage } from '../decorators/response-message.decorator';
import type { Express } from 'express';

export interface BasePaginationQuery {
  page?: number;
  limit?: number;
}

export interface BaseSearchQuery extends BasePaginationQuery {
  search?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

@UseGuards(JwtAuthGuard) // Equivalent to Laravel's auth.service middleware
export abstract class BaseKnexController<T = any> {
  protected abstract entityName: string;

  constructor(protected readonly service: BaseKnexService<T>) {}

  // 🚀 OPTIONAL HOOKS FOR FILE HANDLING - Override in child controllers

  /**
   * Override this method in child controllers to define when a file is required
   * @param createDto - The DTO being validated
   * @returns boolean - true if file is required, false if optional
   */
  protected isFileRequired?(createDto: any): boolean;

  /**
   * Override this method in child controllers to handle creation with file
   * @param createDto - The creation DTO
   * @param file - The uploaded file
   * @returns Promise<any> - The created entity with file information
   */
  protected createWithFile?(
    createDto: any,
    file: Express.Multer.File,
  ): Promise<any>;

  /**
   * Override this method in child controllers to handle updates with file
   * @param id - Entity ID
   * @param updateDto - The update DTO
   * @param file - The uploaded file (optional for updates)
   * @returns Promise<any> - The updated entity with file information
   */
  protected updateWithFile?(
    id: string,
    updateDto: any,
    file?: Express.Multer.File,
  ): Promise<any>;

  /**
   * Override this method in child controllers to get entity with file information
   * @param id - Entity ID
   * @returns Promise<any> - The entity with complete file details
   */
  protected findOneWithFile?(id: string): Promise<any>;

  /**
   * Override this method in child controllers to get entities with file information
   * @param pagination - Pagination parameters
   * @param filters - Additional filters
   * @returns Promise<any> - Paginated entities with file details
   */
  protected findAllWithFiles?(pagination: any, filters?: any): Promise<any>;

  // GET / - RESTful: Get paginated list of entities
  @Get()
  async findAll(
    @Query() pagination: BasePaginationQueryDto,
    @Headers('x-lang') lang?: string,
  ) {
    return this.service.findAll(pagination, lang);
  }

  // GET /:id - RESTful: Get entity by ID
  @Get(':id')
  async findOne(
    @Param('id', ParseUUIDPipe) id: string,
    @Headers('x-lang') lang?: string,
  ) {
    return this.service.findOne(id, lang);
  }

  // POST / - RESTful: Create new entity (Enhanced with dynamic file handling)
  @Post()
  @UsePipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: { enableImplicitConversion: true },
    }),
  )
  async create(
    @Body() createDto: any,
    @Headers('x-lang') lang?: string,
    @UploadedFile() file?: Express.Multer.File,
  ) {
    // Check if file is required (if method is implemented in child controller)
    if (this.isFileRequired && this.isFileRequired(createDto) && !file) {
      throw new BadRequestException(`File is required for ${this.entityName}`);
    }

    // Handle file upload if file is provided and method exists
    if (file && this.createWithFile) {
      return this.createWithFile(createDto, file);
    }

    // Default: use base service create for JSON requests
    return this.service.create(createDto);
  }

  // PUT /:id - RESTful: Update entity (Enhanced with dynamic file handling)
  @Put(':id')
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateDto: any,
    @Headers('x-lang') lang?: string,
    @UploadedFile() file?: Express.Multer.File,
  ) {
    // Handle file upload if file is provided and method exists
    if (file && this.updateWithFile) {
      return this.updateWithFile(id, updateDto, file);
    }

    // Default: use base service update for JSON requests
    return this.service.update(id, updateDto, undefined, lang);
  }

  // DELETE /:id - RESTful: Delete entity
  @Delete(':id')
  @ResponseMessage('Entity deleted successfully')
  async remove(
    @Param('id', ParseUUIDPipe) id: string,
    @Headers('x-lang') lang?: string,
  ) {
    return this.service.remove(id, lang);
  }

  // POST /search - Search entities
  @Post('search')
  async search(
    @Body() searchDto: SearchDto,
    @Query() pagination: BasePaginationQueryDto,
    @Headers('x-lang') lang?: string,
  ) {
    return this.service.search(searchDto, pagination, lang);
  }

  // GET /combo - Equivalent to Laravel's combo()
  @Get('combo')
  async getCombo(
    @Query('keyword') keyword?: string,
    @Headers('x-lang') lang?: string,
  ) {
    return this.service.getCombo(keyword, lang);
  }

  // GET /rules - Equivalent to Laravel's getRules()
  @Get('rules')
  async getRules() {
    return this.service.getValidationRules();
  }

  // POST /search-table - Equivalent to Laravel's searchTable()
  @Post('search-table')
  async searchTable(
    @Body() searchDto: SearchDto,
    @Query() pagination: BasePaginationQueryDto,
    @Headers('x-lang') lang?: string,
  ) {
    return this.service.search(searchDto, pagination, lang);
  }

  // POST /data-tabulator - Equivalent to Laravel's getDataTabulator()
  @Post('data-tabulator')
  async getDataTabulator(
    @Body()
    body: { filters?: any; sort?: any; pagination?: BasePaginationQueryDto },
    @Headers('x-lang') lang?: string,
  ) {
    const searchDto: SearchDto = {
      filters: body.filters,
      sort: body.sort,
    };
    return this.service.search(searchDto, body.pagination || {}, lang);
  }

  // DELETE /delete-all - Bulk delete (equivalent to Laravel's deleteAll)
  @Delete('delete-all')
  @ResponseMessage('Bulk delete completed')
  async deleteAll(
    @Body() body: { ids: string[] },
    @Headers('x-lang') lang?: string,
  ) {
    const results = [];
    for (const id of body.ids) {
      try {
        await this.service.remove(id, lang);
        results.push({ id, success: true });
      } catch (error) {
        results.push({ id, success: false, error: error.message });
      }
    }
    return results;
  }

  // GET /combo/:keyword - Alternative combo endpoint
  @Get('combo/:keyword')
  async getComboWithKeyword(
    @Param('keyword') keyword: string,
    @Headers('x-lang') lang?: string,
  ) {
    return this.service.getCombo(keyword, lang);
  }

  // POST /combo - POST version of combo (for complex searches)
  @Post('combo')
  async getComboPost(
    @Body() body: { keyword?: string; filters?: any },
    @Headers('x-lang') lang?: string,
  ) {
    return this.service.getCombo(body.keyword, lang);
  }
}
