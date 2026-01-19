import { Test, TestingModule } from '@nestjs/testing';
import { I18nService } from 'nestjs-i18n';
import { CategoryService } from '../category.service';
import { CategoryRepository } from '../repository/category.repository';
import { CategoryModel } from '../models/category.model';
import { CreateCategoryDto } from '../dto/create-category.dto';
import { UpdateCategoryDto } from '../dto/update-category.dto';
import { ICategory } from '../interfaces/category.interface';

describe('CategoryService', () => {
  let service: CategoryService;
  let repository: jest.Mocked<CategoryRepository>;
  let i18n: jest.Mocked<I18nService>;

  const categoryEntity: ICategory = {
    id: '123e4567-e89b-12d3-a456-426614174000',
    name: 'Electronics',
    slug: 'electronics',
    description: 'Electronic items',
    created_at: new Date('2025-01-01'),
    updated_at: new Date('2025-01-01'),
    deleted_at: undefined,
  };

  const categoryModel = CategoryModel.reconstitute(categoryEntity);

  beforeEach(async () => {
    const repositoryMock: Partial<jest.Mocked<CategoryRepository>> = {
      save: jest.fn().mockResolvedValue(undefined),
      findByIdOrThrow: jest.fn().mockResolvedValue(categoryModel),
      findAll: jest.fn().mockResolvedValue({
        data: [categoryModel],
        total: 1,
      }),
      delete: jest.fn().mockResolvedValue(undefined),
    };

    const i18nMock: Partial<jest.Mocked<I18nService>> = {
      translate: jest.fn().mockImplementation((key: string) => key),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CategoryService,
        {
          provide: CategoryRepository,
          useValue: repositoryMock,
        },
        {
          provide: I18nService,
          useValue: i18nMock,
        },
      ],
    }).compile();

    service = module.get(CategoryService);
    repository = module.get(
      CategoryRepository,
    ) as jest.Mocked<CategoryRepository>;
    i18n = module.get(I18nService) as jest.Mocked<I18nService>;
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('create', () => {
    it('should create a category and return wrapped response', async () => {
      const dto: CreateCategoryDto = {
        name: 'Electronics',
        description: 'Electronic items',
        slug: undefined as any,
      };

      const result = await service.create(dto);

      expect(repository.save).toHaveBeenCalledTimes(1);
      expect(i18n.translate).toHaveBeenCalledWith('categories.created');
      expect(result.success).toBe(true);
      expect(result.data.name).toBe('Electronics');
      expect(result.data.slug).toBeDefined();
    });
  });

  describe('findById', () => {
    it('should return category entity', async () => {
      const result = await service.findById(categoryEntity.id);

      expect(repository.findByIdOrThrow).toHaveBeenCalledWith(
        categoryEntity.id,
      );
      expect(result.id).toBe(categoryEntity.id);
      expect(result.name).toBe(categoryEntity.name);
      expect(result.slug).toBe(categoryEntity.slug);
      expect(result.description).toBe(categoryEntity.description);
      expect(result.deleted_at).toBeUndefined();
    });
  });

  describe('findAll', () => {
    it('should return paginated categories', async () => {
      const result = await service.findAll({ page: 1, limit: 10 });

      expect(repository.findAll).toHaveBeenCalledWith({ page: 1, limit: 10 });
      expect(result.total).toBe(1);
      expect(result.data[0].id).toBe(categoryEntity.id);
    });
  });

  describe('update', () => {
    it('should update a category and return updated entity', async () => {
      const dto: UpdateCategoryDto = {
        name: 'Updated Electronics',
        description: 'Updated description',
        slug: 'updated-electronics',
      };

      const result = await service.update(categoryEntity.id, dto);

      expect(repository.findByIdOrThrow).toHaveBeenCalledWith(
        categoryEntity.id,
      );
      expect(repository.save).toHaveBeenCalledTimes(1);
      expect(result.id).toBe(categoryEntity.id);
    });
  });

  describe('delete', () => {
    it('should delete a category', async () => {
      await service.delete(categoryEntity.id);

      expect(repository.delete).toHaveBeenCalledWith(categoryEntity.id);
    });
  });
});
