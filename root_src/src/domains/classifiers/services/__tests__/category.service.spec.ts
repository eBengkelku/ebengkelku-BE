import { Test, TestingModule } from '@nestjs/testing';
import { CategoryService } from '../category.service';
import { DatabaseService } from '../../../../database/database.service';
import { I18nService } from 'nestjs-i18n';
import { CategoryModel } from '../../models/category.model';
import { CreateCategoryDto } from '../../dto/create-category.dto';
import { UpdateCategoryDto } from '../../dto/update-category.dto';
import { ICategory } from '../../interfaces/category.interface';
import { DomainValidationException } from '../../../../common/domain';

describe('CategoryService', () => {
  let service: CategoryService;
  let mockDatabaseService: Partial<DatabaseService>;
  let mockI18nService: Partial<I18nService>;
  let mockKnex: any;

  const validCategoryId = '123e4567-e89b-12d3-a456-426614174000';
  const mockCategory: ICategory = {
    id: validCategoryId,
    name: 'Electronics',
    slug: 'electronics',
    description: 'Electronic items and gadgets',
    created_at: new Date('2023-01-01'),
    updated_at: new Date('2023-01-01'),
    deleted_at: undefined,
  };

  const mockCategories = [
    mockCategory,
    {
      id: '123e4567-e89b-12d3-a456-426614174001',
      name: 'Fashion',
      slug: 'fashion',
      description: 'Fashion items',
      created_at: new Date('2023-01-01'),
      updated_at: new Date('2023-01-01'),
      deleted_at: undefined,
    },
  ];

  beforeEach(async () => {
    // Create mock knex query builder
    const mockQueryBuilder = {
      select: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      whereNull: jest.fn().mockReturnThis(),
      whereNotNull: jest.fn().mockReturnThis(),
      orderBy: jest.fn().mockReturnThis(),
      limit: jest.fn().mockReturnThis(),
      offset: jest.fn().mockReturnThis(),
      first: jest.fn().mockResolvedValue(mockCategory),
      insert: jest.fn().mockReturnThis(),
      update: jest.fn().mockReturnThis(),
      returning: jest.fn().mockResolvedValue([mockCategory]),
      count: jest.fn().mockReturnThis(),
      then: (resolve: any) => resolve(mockCategories),
    };

    // Create mockKnex as a Jest mock function that returns the query builder
    mockKnex = jest.fn().mockImplementation((tableName: string) => {
      if (tableName === 'categories') {
        return {
          ...mockQueryBuilder,
          then: (resolve: any) => resolve(mockCategories),
        };
      }
      return mockQueryBuilder;
    });

    // Add raw method to mockKnex for SQL functions
    mockKnex.raw = jest.fn().mockImplementation((sql: string) => sql);

    mockDatabaseService = {
      getKnex: jest.fn().mockReturnValue(mockKnex),
    };

    mockI18nService = {
      translate: jest
        .fn()
        .mockImplementation((key: string) => `Translated: ${key}`),
      t: jest
        .fn()
        .mockImplementation((key: string) => `Translated: ${key}`),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CategoryService,
        {
          provide: DatabaseService,
          useValue: mockDatabaseService,
        },
        {
          provide: I18nService,
          useValue: mockI18nService,
        },
      ],
    }).compile();

    service = module.get<CategoryService>(CategoryService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('create', () => {
    it('should create a category using CategoryModel', async () => {
      const createDto: CreateCategoryDto = {
        name: 'Electronics',
        description: 'Electronic items and gadgets',
      };

      const result = await service.create(createDto);

      expect(result.success).toBe(true);
      expect(result.message).toBe('Translated: categories.created');
      expect(result.data).toBeDefined();
      expect(mockKnex).toHaveBeenCalledWith('categories');
      expect(mockKnex('categories').insert).toHaveBeenCalled();
    });

    it('should auto-generate slug if not provided', async () => {
      const createDto: CreateCategoryDto = {
        name: 'Fashion & Apparel',
        description: 'Fashion items',
      };

      const result = await service.create(createDto);

      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
      // Verify that slug was auto-generated
      const insertCall = (mockKnex('categories').insert as jest.Mock).mock
        .calls[0][0];
      expect(insertCall.slug).toBe('fashion-apparel');
    });

    it('should use provided slug if given', async () => {
      const createDto: CreateCategoryDto = {
        name: 'Electronics',
        slug: 'custom-slug',
        description: 'Electronic items',
      };

      const result = await service.create(createDto);

      expect(result.success).toBe(true);
      const insertCall = (mockKnex('categories').insert as jest.Mock).mock
        .calls[0][0];
      expect(insertCall.slug).toBe('custom-slug');
    });

    it('should throw error if name is empty', async () => {
      const createDto: CreateCategoryDto = {
        name: '',
        description: 'Test',
      };

      // Suppress console.error for expected validation errors
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

      await expect(service.create(createDto)).rejects.toThrow(
        DomainValidationException,
      );

      consoleSpy.mockRestore();
    });

    it('should throw error if slug format is invalid', async () => {
      const createDto: CreateCategoryDto = {
        name: 'Electronics',
        slug: 'INVALID SLUG',
        description: 'Test',
      };

      // Suppress console.error for expected validation errors
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

      await expect(service.create(createDto)).rejects.toThrow(
        DomainValidationException,
      );

      consoleSpy.mockRestore();
    });

    it('should trim whitespace from name and description', async () => {
      const createDto: CreateCategoryDto = {
        name: '  Electronics  ',
        description: '  Electronic items  ',
      };

      await service.create(createDto);

      const insertCall = (mockKnex('categories').insert as jest.Mock).mock
        .calls[0][0];
      expect(insertCall.name).toBe('Electronics');
      expect(insertCall.description).toBe('Electronic items');
    });
  });

  describe('findAll', () => {
    it('should return paginated categories', async () => {
      const pagination = {
        page: 1,
        limit: 10,
      };

      const result = await service.findAll(pagination);

      expect(result).toBeDefined();
      expect(mockKnex).toHaveBeenCalledWith('categories');
    });

    it('should handle pagination parameters', async () => {
      const pagination = {
        page: 2,
        limit: 5,
      };

      await service.findAll(pagination);

      expect(mockKnex('categories').limit).toHaveBeenCalled();
      expect(mockKnex('categories').offset).toHaveBeenCalled();
    });
  });

  describe('findOne', () => {
    it('should return a category by id', async () => {
      const result = await service.findOne(validCategoryId);

      expect(result).toBeDefined();
      expect(mockKnex).toHaveBeenCalledWith('categories');
      expect(mockKnex('categories').where).toHaveBeenCalledWith(
        'categories.id',
        validCategoryId,
      );
    });

    it('should throw NotFoundException if category not found', async () => {
      (mockKnex('categories').first as jest.Mock).mockResolvedValueOnce(null);

      await expect(service.findOne('non-existent-id')).rejects.toThrow(
        'Translated: common.errors.notFound',
      );
    });
  });

  describe('update', () => {
    it('should update category using CategoryModel', async () => {
      const updateDto: UpdateCategoryDto = {
        name: 'Updated Electronics',
        description: 'Updated description',
      };

      const result = await service.update(validCategoryId, updateDto);

      expect(result).toBeDefined();
      expect(mockKnex('categories').update).toHaveBeenCalled();
    });

    it('should auto-regenerate slug when name is updated', async () => {
      const updateDto: UpdateCategoryDto = {
        name: 'New Category Name',
      };

      await service.update(validCategoryId, updateDto);

      const updateCall = (mockKnex('categories').update as jest.Mock).mock
        .calls[0][0];
      expect(updateCall.slug).toBe('new-category-name');
      expect(updateCall.name).toBe('New Category Name');
    });

    it('should update slug if provided', async () => {
      const updateDto: UpdateCategoryDto = {
        slug: 'new-slug',
      };

      await service.update(validCategoryId, updateDto);

      const updateCall = (mockKnex('categories').update as jest.Mock).mock
        .calls[0][0];
      expect(updateCall.slug).toBe('new-slug');
    });

    it('should update description only', async () => {
      const updateDto: UpdateCategoryDto = {
        description: 'New description',
      };

      await service.update(validCategoryId, updateDto);

      const updateCall = (mockKnex('categories').update as jest.Mock).mock
        .calls[0][0];
      expect(updateCall.description).toBe('New description');
    });

    it('should throw error if name is empty', async () => {
      const updateDto: UpdateCategoryDto = {
        name: '',
      };

      await expect(
        service.update(validCategoryId, updateDto),
      ).rejects.toThrow(DomainValidationException);
    });

    it('should throw error if slug format is invalid', async () => {
      const updateDto: UpdateCategoryDto = {
        slug: 'INVALID SLUG',
      };

      await expect(
        service.update(validCategoryId, updateDto),
      ).rejects.toThrow(DomainValidationException);
    });

    it('should throw error if category not found', async () => {
      (mockKnex('categories').first as jest.Mock).mockResolvedValueOnce(null);

      const updateDto: UpdateCategoryDto = {
        name: 'Updated Name',
      };

      await expect(
        service.update('non-existent-id', updateDto),
      ).rejects.toThrow();
    });
  });

  describe('remove', () => {
    it('should soft delete a category', async () => {
      await service.remove(validCategoryId);

      expect(mockKnex('categories').update).toHaveBeenCalled();
      const updateCall = (mockKnex('categories').update as jest.Mock).mock
        .calls[0][0];
      expect(updateCall.deleted_at).toBeDefined();
    });
  });

  describe('search', () => {
    it('should search categories by keyword', async () => {
      const searchDto = {
        filters: [['name', 'like', '%electronics%']] as [string, string, any][],
      };
      const pagination = {
        page: 1,
        limit: 10,
      };

      const result = await service.search(searchDto, pagination);

      expect(result).toBeDefined();
      expect(mockKnex('categories').where).toHaveBeenCalled();
    });
  });
});
