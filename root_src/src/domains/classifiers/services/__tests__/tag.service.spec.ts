import { Test, TestingModule } from '@nestjs/testing';
import { TagService } from '../tag.service';
import { DatabaseService } from '../../../../database/database.service';
import { I18nService } from 'nestjs-i18n';
import { TagModel } from '../../models/tag.model';
import { CreateTagDto } from '../../dto/create-tag.dto';
import { UpdateTagDto } from '../../dto/update-tag.dto';
import { ITag } from '../../interfaces/tag.interface';
import { DomainValidationException } from '../../../../common/domain';

describe('TagService', () => {
  let service: TagService;
  let mockDatabaseService: Partial<DatabaseService>;
  let mockI18nService: Partial<I18nService>;
  let mockKnex: any;

  const validTagId = '123e4567-e89b-12d3-a456-426614174000';
  const mockTag: ITag = {
    id: validTagId,
    name: 'Hot Item',
    color: '#FF0000',
    created_at: new Date('2023-01-01'),
    updated_at: new Date('2023-01-01'),
    deleted_at: undefined,
  };

  const mockTags = [
    mockTag,
    {
      id: '123e4567-e89b-12d3-a456-426614174001',
      name: 'Promo',
      color: '#00FF00',
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
      first: jest.fn().mockResolvedValue(mockTag),
      insert: jest.fn().mockReturnThis(),
      update: jest.fn().mockReturnThis(),
      returning: jest.fn().mockResolvedValue([mockTag]),
      count: jest.fn().mockReturnThis(),
      then: (resolve: any) => resolve(mockTags),
    };

    // Create mockKnex as a Jest mock function that returns the query builder
    mockKnex = jest.fn().mockImplementation((tableName: string) => {
      if (tableName === 'tags') {
        return {
          ...mockQueryBuilder,
          then: (resolve: any) => resolve(mockTags),
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
        TagService,
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

    service = module.get<TagService>(TagService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('create', () => {
    it('should create a tag using TagModel', async () => {
      const createDto: CreateTagDto = {
        name: 'Hot Item',
        color: '#FF0000',
      };

      const result = await service.create(createDto);

      expect(result.success).toBe(true);
      expect(result.message).toBe('Translated: tags.created');
      expect(result.data).toBeDefined();
      expect(mockKnex).toHaveBeenCalledWith('tags');
      expect(mockKnex('tags').insert).toHaveBeenCalled();
    });

    it('should normalize color to uppercase', async () => {
      const createDto: CreateTagDto = {
        name: 'Hot Item',
        color: '#ff0000',
      };

      await service.create(createDto);

      const insertCall = (mockKnex('tags').insert as jest.Mock).mock
        .calls[0][0];
      expect(insertCall.color).toBe('#FF0000');
    });

    it('should throw error if name is empty', async () => {
      const createDto: CreateTagDto = {
        name: '',
        color: '#FF0000',
      };

      // Suppress console.error for expected validation errors
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

      await expect(service.create(createDto)).rejects.toThrow(
        DomainValidationException,
      );

      consoleSpy.mockRestore();
    });

    it('should throw error if name exceeds 20 characters', async () => {
      const createDto: CreateTagDto = {
        name: 'A'.repeat(21), // 21 characters
        color: '#FF0000',
      };

      // Suppress console.error for expected validation errors
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

      await expect(service.create(createDto)).rejects.toThrow(
        DomainValidationException,
      );

      consoleSpy.mockRestore();
    });

    it('should accept name with exactly 20 characters', async () => {
      const createDto: CreateTagDto = {
        name: 'A'.repeat(20), // Exactly 20 characters
        color: '#FF0000',
      };

      const result = await service.create(createDto);

      expect(result.success).toBe(true);
      const insertCall = (mockKnex('tags').insert as jest.Mock).mock
        .calls[0][0];
      expect(insertCall.name).toBe('A'.repeat(20));
    });

    it('should throw error if hex color is invalid', async () => {
      const createDto: CreateTagDto = {
        name: 'Hot Item',
        color: 'invalid-color',
      };

      // Suppress console.error for expected validation errors
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

      await expect(service.create(createDto)).rejects.toThrow(
        DomainValidationException,
      );

      consoleSpy.mockRestore();
    });

    it('should throw error if color is missing #', async () => {
      const createDto: CreateTagDto = {
        name: 'Hot Item',
        color: 'FF0000',
      };

      // Suppress console.error for expected validation errors
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

      await expect(service.create(createDto)).rejects.toThrow(
        DomainValidationException,
      );

      consoleSpy.mockRestore();
    });

    it('should accept 3-digit hex color', async () => {
      const createDto: CreateTagDto = {
        name: 'Hot Item',
        color: '#F00',
      };

      const result = await service.create(createDto);

      expect(result.success).toBe(true);
      const insertCall = (mockKnex('tags').insert as jest.Mock).mock
        .calls[0][0];
      expect(insertCall.color).toBe('#F00');
    });

    it('should accept 6-digit hex color', async () => {
      const createDto: CreateTagDto = {
        name: 'Hot Item',
        color: '#FF5733',
      };

      const result = await service.create(createDto);

      expect(result.success).toBe(true);
      const insertCall = (mockKnex('tags').insert as jest.Mock).mock
        .calls[0][0];
      expect(insertCall.color).toBe('#FF5733');
    });

    it('should trim whitespace from name', async () => {
      const createDto: CreateTagDto = {
        name: '  Hot Item  ',
        color: '#FF0000',
      };

      await service.create(createDto);

      const insertCall = (mockKnex('tags').insert as jest.Mock).mock
        .calls[0][0];
      expect(insertCall.name).toBe('Hot Item');
    });
  });

  describe('findAll', () => {
    it('should return paginated tags', async () => {
      const pagination = {
        page: 1,
        limit: 10,
      };

      const result = await service.findAll(pagination);

      expect(result).toBeDefined();
      expect(mockKnex).toHaveBeenCalledWith('tags');
    });

    it('should handle pagination parameters', async () => {
      const pagination = {
        page: 2,
        limit: 5,
      };

      await service.findAll(pagination);

      expect(mockKnex('tags').limit).toHaveBeenCalled();
      expect(mockKnex('tags').offset).toHaveBeenCalled();
    });
  });

  describe('findOne', () => {
    it('should return a tag by id', async () => {
      const result = await service.findOne(validTagId);

      expect(result).toBeDefined();
      expect(mockKnex).toHaveBeenCalledWith('tags');
      expect(mockKnex('tags').where).toHaveBeenCalledWith('tags.id', validTagId);
    });

    it('should throw NotFoundException if tag not found', async () => {
      (mockKnex('tags').first as jest.Mock).mockResolvedValueOnce(null);

      await expect(service.findOne('non-existent-id')).rejects.toThrow(
        'Translated: common.errors.notFound',
      );
    });
  });

  describe('update', () => {
    it('should update tag using TagModel', async () => {
      const updateDto: UpdateTagDto = {
        name: 'Updated Tag',
        color: '#00FF00',
      };

      const result = await service.update(validTagId, updateDto);

      expect(result).toBeDefined();
      expect(mockKnex('tags').update).toHaveBeenCalled();
    });

    it('should update name with validation', async () => {
      const updateDto: UpdateTagDto = {
        name: 'New Tag Name',
      };

      await service.update(validTagId, updateDto);

      const updateCall = (mockKnex('tags').update as jest.Mock).mock
        .calls[0][0];
      expect(updateCall.name).toBe('New Tag Name');
    });

    it('should update color with validation', async () => {
      const updateDto: UpdateTagDto = {
        color: '#0000FF',
      };

      await service.update(validTagId, updateDto);

      const updateCall = (mockKnex('tags').update as jest.Mock).mock
        .calls[0][0];
      expect(updateCall.color).toBe('#0000FF');
    });

    it('should normalize color to uppercase', async () => {
      const updateDto: UpdateTagDto = {
        color: '#00ff00',
      };

      await service.update(validTagId, updateDto);

      const updateCall = (mockKnex('tags').update as jest.Mock).mock
        .calls[0][0];
      expect(updateCall.color).toBe('#00FF00');
    });

    it('should throw error if name is empty', async () => {
      const updateDto: UpdateTagDto = {
        name: '',
      };

      await expect(service.update(validTagId, updateDto)).rejects.toThrow(
        DomainValidationException,
      );
    });

    it('should throw error if name exceeds 20 characters', async () => {
      const updateDto: UpdateTagDto = {
        name: 'A'.repeat(21), // 21 characters
      };

      await expect(service.update(validTagId, updateDto)).rejects.toThrow(
        DomainValidationException,
      );
    });

    it('should throw error if color format is invalid', async () => {
      const updateDto: UpdateTagDto = {
        color: 'invalid-color',
      };

      await expect(service.update(validTagId, updateDto)).rejects.toThrow(
        DomainValidationException,
      );
    });

    it('should throw error if tag not found', async () => {
      (mockKnex('tags').first as jest.Mock).mockResolvedValueOnce(null);

      const updateDto: UpdateTagDto = {
        name: 'Updated Name',
      };

      await expect(
        service.update('non-existent-id', updateDto),
      ).rejects.toThrow();
    });
  });

  describe('remove', () => {
    it('should soft delete a tag', async () => {
      await service.remove(validTagId);

      expect(mockKnex('tags').update).toHaveBeenCalled();
      const updateCall = (mockKnex('tags').update as jest.Mock).mock
        .calls[0][0];
      expect(updateCall.deleted_at).toBeDefined();
    });
  });

  describe('search', () => {
    it('should search tags by keyword', async () => {
      const searchDto = {
        filters: [['name', 'like', '%hot%']] as [string, string, any][],
      };
      const pagination = {
        page: 1,
        limit: 10,
      };

      const result = await service.search(searchDto, pagination);

      expect(result).toBeDefined();
      expect(mockKnex('tags').where).toHaveBeenCalled();
    });
  });
});
