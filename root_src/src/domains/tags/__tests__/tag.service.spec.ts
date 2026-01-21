import { Test, TestingModule } from '@nestjs/testing';
import { I18nService } from 'nestjs-i18n';
import { TagService } from '../tag.service';
import { TagRepository } from '../repository/tag.repository';
import { TagModel } from '../models/tag.model';
import { CreateTagDto } from '../dto/create-tag.dto';
import { UpdateTagDto } from '../dto/update-tag.dto';
import { ITag } from '../interfaces/tag.interface';

describe('TagService', () => {
  let service: TagService;
  let repository: jest.Mocked<TagRepository>;
  let i18n: jest.Mocked<I18nService>;

  const tagEntity: ITag = {
    id: '223e4567-e89b-12d3-a456-426614174000',
    name: 'Hot Item',
    color: '#FF0000',
    created_at: new Date('2025-01-01'),
    updated_at: new Date('2025-01-01'),
    deleted_at: undefined,
  };

  const tagModel = TagModel.reconstitute(tagEntity);

  beforeEach(async () => {
    const repositoryMock: Partial<jest.Mocked<TagRepository>> = {
      save: jest.fn().mockResolvedValue(undefined),
      findByIdOrThrow: jest.fn().mockResolvedValue(tagModel),
      findAll: jest.fn().mockResolvedValue({
        data: [tagModel],
        total: 1,
      }),
      delete: jest.fn().mockResolvedValue(undefined),
    };

    const i18nMock: Partial<jest.Mocked<I18nService>> = {
      translate: jest.fn().mockImplementation((key: string) => key),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TagService,
        {
          provide: TagRepository,
          useValue: repositoryMock,
        },
        {
          provide: I18nService,
          useValue: i18nMock,
        },
      ],
    }).compile();

    service = module.get(TagService);
    repository = module.get(TagRepository) as jest.Mocked<TagRepository>;
    i18n = module.get(I18nService) as jest.Mocked<I18nService>;
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('create', () => {
    it('should create a tag and return wrapped response', async () => {
      const dto: CreateTagDto = {
        name: 'Hot Item',
        color: '#FF0000',
      };

      const result = await service.create(dto);

      expect(repository.save).toHaveBeenCalledTimes(1);
      expect(i18n.translate).toHaveBeenCalledWith('tags.created');
      expect(result.success).toBe(true);
      expect(result.data.name).toBe('Hot Item');
      expect(result.data.color).toBe('#FF0000');
    });
  });

  describe('findById', () => {
    it('should return tag entity', async () => {
      const result = await service.findById(tagEntity.id);

      expect(repository.findByIdOrThrow).toHaveBeenCalledWith(tagEntity.id);
      expect(result.id).toBe(tagEntity.id);
      expect(result.name).toBe(tagEntity.name);
      expect(result.color).toBe(tagEntity.color);
      expect(result.deleted_at).toBeUndefined();
    });
  });

  describe('findAll', () => {
    it('should return paginated tags', async () => {
      const result = await service.findAll({ page: 1, limit: 10 });

      expect(repository.findAll).toHaveBeenCalledWith({ page: 1, limit: 10 });
      expect(result.total).toBe(1);
      expect(result.data[0].id).toBe(tagEntity.id);
    });
  });

  describe('update', () => {
    it('should update a tag and return updated entity', async () => {
      const dto: UpdateTagDto = {
        name: 'Updated Tag',
        color: '#00FF00',
      };

      const result = await service.update(tagEntity.id, dto);

      expect(repository.findByIdOrThrow).toHaveBeenCalledWith(tagEntity.id);
      expect(repository.save).toHaveBeenCalledTimes(1);
      expect(result.id).toBe(tagEntity.id);
    });
  });

  describe('delete', () => {
    it('should delete a tag', async () => {
      await service.delete(tagEntity.id);

      expect(repository.delete).toHaveBeenCalledWith(tagEntity.id);
    });
  });
});

