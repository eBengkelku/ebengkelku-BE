import { Controller } from '@nestjs/common';
import {
  ApiTags,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { BaseKnexController } from '../../../common/controllers/base-knex.controller';
import { TagService } from '../services/tag.service';
import { ITag } from '../interfaces/tag.interface';

/**
 * Tag Controller
 *
 * HTTP controller for tag-related endpoints using BaseKnexController for Auto CRUD.
 * Automatically provides standard CRUD operations (GET, POST, PUT, DELETE) with
 * pagination, search, and i18n support.
 *
 * Auto-generated endpoints:
 * - GET    /api/v1/tags          - List tags with pagination
 * - GET    /api/v1/tags/:id      - Get tag by ID
 * - POST   /api/v1/tags          - Create new tag
 * - PUT    /api/v1/tags/:id      - Update tag
 * - DELETE /api/v1/tags/:id      - Delete tag (soft delete)
 * - POST   /api/v1/tags/search   - Advanced search
 * - GET    /api/v1/tags/combo    - Get tags for dropdown
 *
 * @class TagController
 * @extends {BaseKnexController<ITag>}
 * @version 1.0.0
 * @since 2025-01-13
 */
@Controller('v1/tags')
@ApiTags('tags')
@ApiBearerAuth('JWT-auth')
export class TagController extends BaseKnexController<ITag> {
  protected entityName = 'Tag';

  constructor(private readonly tagService: TagService) {
    super(tagService);
  }
}
