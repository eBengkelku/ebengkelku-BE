import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { TagService } from './tag.service';
import { CreateTagDto } from './dto/create-tag.dto';
import { UpdateTagDto } from './dto/update-tag.dto';
import { ResponseMessage } from '../../common/decorators/response-message.decorator';

/**
 * Tag Controller
 *
 * HTTP controller for tag-related endpoints using Rich Domain Model pattern.
 * This controller handles HTTP requests, validates DTOs, and delegates business
 * operations to the TagService.
 *
 * @class TagController
 * @version 1.0.0
 * @since 2025-01-13
 */
@Controller('v1/tags')
@ApiTags('tags')
@ApiBearerAuth('JWT-auth')
export class TagController {
  constructor(private readonly tagService: TagService) {}

  /**
   * Create a new tag
   *
   * @param {CreateTagDto} createDto - Tag creation data
   * @returns {Promise<any>} Created tag
   */
  @Post()
  @ResponseMessage('tags.created')
  @ApiOperation({ summary: 'Create new tag' })
  @ApiResponse({ status: 201, description: 'Tag created successfully' })
  @ApiResponse({ status: 400, description: 'Invalid tag data' })
  async create(@Body() createDto: CreateTagDto) {
    return this.tagService.create(createDto);
  }

  /**
   * Get all tags with pagination
   *
   * @param {number} page - Page number
   * @param {number} limit - Items per page
   * @returns {Promise<any>} Paginated tags
   */
  @Get()
  @ResponseMessage('tags.listed')
  @ApiOperation({ summary: 'Get all tags with pagination' })
  @ApiResponse({ status: 200, description: 'Tags retrieved successfully' })
  async findAll(
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 10,
  ) {
    return this.tagService.findAll({
      page: Number(page),
      limit: Number(limit),
    });
  }

  /**
   * Get a tag by ID
   *
   * @param {string} id - Tag ID
   * @returns {Promise<any>} Tag details
   */
  @Get(':id')
  @ResponseMessage('tags.found')
  @ApiOperation({ summary: 'Get tag by ID' })
  @ApiResponse({ status: 200, description: 'Tag found' })
  @ApiResponse({ status: 404, description: 'Tag not found' })
  async findOne(@Param('id') id: string) {
    return this.tagService.findById(id);
  }

  /**
   * Update a tag
   *
   * @param {string} id - Tag ID
   * @param {UpdateTagDto} updateDto - Tag update data
   * @returns {Promise<any>} Updated tag
   */
  @Put(':id')
  @ResponseMessage('tags.updated')
  @ApiOperation({ summary: 'Update tag' })
  @ApiResponse({ status: 200, description: 'Tag updated successfully' })
  @ApiResponse({ status: 404, description: 'Tag not found' })
  async update(@Param('id') id: string, @Body() updateDto: UpdateTagDto) {
    return this.tagService.update(id, updateDto);
  }

  /**
   * Delete a tag (soft delete)
   *
   * @param {string} id - Tag ID
   * @returns {Promise<any>} Deletion confirmation
   */
  @Delete(':id')
  @ResponseMessage('tags.deleted')
  @ApiOperation({ summary: 'Delete tag' })
  @ApiResponse({ status: 200, description: 'Tag deleted successfully' })
  @ApiResponse({ status: 404, description: 'Tag not found' })
  async remove(@Param('id') id: string) {
    return this.tagService.delete(id);
  }
}
