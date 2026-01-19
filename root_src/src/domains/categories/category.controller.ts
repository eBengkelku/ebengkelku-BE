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
import { CategoryService } from './category.service';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';
import { ResponseMessage } from '../../common/decorators/response-message.decorator';

/**
 * Category Controller
 *
 * HTTP controller for category-related endpoints using Rich Domain Model pattern.
 * This controller handles HTTP requests, validates DTOs, and delegates business
 * operations to the CategoryService.
 *
 * @class CategoryController
 * @version 1.0.0
 * @since 2025-01-13
 */
@Controller('v1/categories')
@ApiTags('categories')
@ApiBearerAuth('JWT-auth')
export class CategoryController {
  constructor(private readonly categoryService: CategoryService) {}

  /**
   * Create a new category
   *
   * @param {CreateCategoryDto} createDto - Category creation data
   * @returns {Promise<any>} Created category
   */
  @Post()
  @ResponseMessage('categories.created')
  @ApiOperation({ summary: 'Create new category' })
  @ApiResponse({ status: 201, description: 'Category created successfully' })
  @ApiResponse({ status: 400, description: 'Invalid category data' })
  async create(@Body() createDto: CreateCategoryDto) {
    return this.categoryService.create(createDto);
  }

  /**
   * Get all categories with pagination
   *
   * @param {number} page - Page number
   * @param {number} limit - Items per page
   * @returns {Promise<any>} Paginated categories
   */
  @Get()
  @ResponseMessage('categories.listed')
  @ApiOperation({ summary: 'Get all categories with pagination' })
  @ApiResponse({
    status: 200,
    description: 'Categories retrieved successfully',
  })
  async findAll(
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 10,
  ) {
    return this.categoryService.findAll({
      page: Number(page),
      limit: Number(limit),
    });
  }

  /**
   * Get a category by ID
   *
   * @param {string} id - Category ID
   * @returns {Promise<any>} Category details
   */
  @Get(':id')
  @ResponseMessage('categories.found')
  @ApiOperation({ summary: 'Get category by ID' })
  @ApiResponse({ status: 200, description: 'Category found' })
  @ApiResponse({ status: 404, description: 'Category not found' })
  async findOne(@Param('id') id: string) {
    return this.categoryService.findById(id);
  }

  /**
   * Update a category
   *
   * @param {string} id - Category ID
   * @param {UpdateCategoryDto} updateDto - Category update data
   * @returns {Promise<any>} Updated category
   */
  @Put(':id')
  @ResponseMessage('categories.updated')
  @ApiOperation({ summary: 'Update category' })
  @ApiResponse({ status: 200, description: 'Category updated successfully' })
  @ApiResponse({ status: 404, description: 'Category not found' })
  async update(@Param('id') id: string, @Body() updateDto: UpdateCategoryDto) {
    return this.categoryService.update(id, updateDto);
  }

  /**
   * Delete a category (soft delete)
   *
   * @param {string} id - Category ID
   * @returns {Promise<any>} Deletion confirmation
   */
  @Delete(':id')
  @ResponseMessage('categories.deleted')
  @ApiOperation({ summary: 'Delete category' })
  @ApiResponse({ status: 200, description: 'Category deleted successfully' })
  @ApiResponse({ status: 404, description: 'Category not found' })
  async remove(@Param('id') id: string) {
    return this.categoryService.delete(id);
  }
}
