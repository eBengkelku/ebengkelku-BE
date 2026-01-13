import { Controller } from '@nestjs/common';
import {
  ApiTags,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { BaseKnexController } from '../../../common/controllers/base-knex.controller';
import { CategoryService } from '../services/category.service';
import { ICategory } from '../interfaces/category.interface';

/**
 * Category Controller
 *
 * HTTP controller for category-related endpoints using BaseKnexController for Auto CRUD.
 * Automatically provides standard CRUD operations (GET, POST, PUT, DELETE) with
 * pagination, search, and i18n support.
 *
 * Auto-generated endpoints:
 * - GET    /api/v1/categories          - List categories with pagination
 * - GET    /api/v1/categories/:id     - Get category by ID
 * - POST   /api/v1/categories          - Create new category
 * - PUT    /api/v1/categories/:id     - Update category
 * - DELETE /api/v1/categories/:id     - Delete category (soft delete)
 * - POST   /api/v1/categories/search   - Advanced search
 * - GET    /api/v1/categories/combo    - Get categories for dropdown
 *
 * @class CategoryController
 * @extends {BaseKnexController<ICategory>}
 * @version 1.0.0
 * @since 2025-01-13
 */
@Controller('v1/categories')
@ApiTags('categories')
@ApiBearerAuth('JWT-auth')
export class CategoryController extends BaseKnexController<ICategory> {
  protected entityName = 'Category';

  constructor(private readonly categoryService: CategoryService) {
    super(categoryService);
  }
}
