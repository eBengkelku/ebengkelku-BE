import { CategoryModel } from '../category.model';
import { ICategory } from '../../interfaces/category.interface';
import { DomainValidationException } from '../../../../common/domain';
import { CategoryErrorCodes } from '../../constants';

describe('CategoryModel', () => {
  const validCategoryId = '123e4567-e89b-12d3-a456-426614174000';
  const validName = 'Electronics';
  const validDescription = 'Electronic items and gadgets';
  const validSlug = 'electronics';

  describe('create', () => {
    it('should create valid category instance with all fields', () => {
      const category = CategoryModel.create({
        id: validCategoryId,
        name: validName,
        description: validDescription,
        slug: validSlug,
      });

      expect(category).toBeInstanceOf(CategoryModel);
      expect(category.getId()).toBe(validCategoryId);
      expect(category.getName()).toBe(validName);
      expect(category.getDescription()).toBe(validDescription);
      expect(category.getSlug()).toBe(validSlug);
      expect(category.getCreatedAt()).toBeInstanceOf(Date);
      expect(category.getUpdatedAt()).toBeInstanceOf(Date);
      expect(category.getDeletedAt()).toBeNull();
    });

    it('should create valid category instance without description', () => {
      const category = CategoryModel.create({
        id: validCategoryId,
        name: validName,
      });

      expect(category).toBeInstanceOf(CategoryModel);
      expect(category.getId()).toBe(validCategoryId);
      expect(category.getName()).toBe(validName);
      expect(category.getDescription()).toBeUndefined();
    });

    it('should auto-generate slug from name if not provided', () => {
      const category = CategoryModel.create({
        id: validCategoryId,
        name: 'Fashion & Apparel',
      });

      expect(category.getSlug()).toBe('fashion-apparel');
    });

    it('should auto-generate slug and handle special characters', () => {
      const category = CategoryModel.create({
        id: validCategoryId,
        name: 'Home & Garden!!!',
      });

      expect(category.getSlug()).toBe('home-garden');
    });

    it('should auto-generate slug and handle multiple spaces', () => {
      const category = CategoryModel.create({
        id: validCategoryId,
        name: 'Sports   &   Recreation',
      });

      expect(category.getSlug()).toBe('sports-recreation');
    });

    it('should trim name and description whitespace', () => {
      const category = CategoryModel.create({
        id: validCategoryId,
        name: '  Electronics  ',
        description: '  Electronic items  ',
      });

      expect(category.getName()).toBe('Electronics');
      expect(category.getDescription()).toBe('Electronic items');
    });

    it('should throw error if name is empty', () => {
      expect(() => {
        CategoryModel.create({
          id: validCategoryId,
          name: '',
        });
      }).toThrow(DomainValidationException);
    });

    it('should throw error if name is only whitespace', () => {
      expect(() => {
        CategoryModel.create({
          id: validCategoryId,
          name: '   ',
        });
      }).toThrow(DomainValidationException);
    });

    it('should throw error if name is undefined', () => {
      expect(() => {
        CategoryModel.create({
          id: validCategoryId,
          name: undefined as any,
        });
      }).toThrow(DomainValidationException);
    });

    it('should throw error if slug format is invalid (uppercase)', () => {
      expect(() => {
        CategoryModel.create({
          id: validCategoryId,
          name: validName,
          slug: 'INVALID-SLUG',
        });
      }).toThrow(DomainValidationException);
    });

    it('should throw error if slug format is invalid (spaces)', () => {
      expect(() => {
        CategoryModel.create({
          id: validCategoryId,
          name: validName,
          slug: 'invalid slug',
        });
      }).toThrow(DomainValidationException);
    });

    it('should throw error if slug format is invalid (special characters)', () => {
      expect(() => {
        CategoryModel.create({
          id: validCategoryId,
          name: validName,
          slug: 'invalid@slug!',
        });
      }).toThrow(DomainValidationException);
    });

    it('should accept valid slug with numbers', () => {
      const category = CategoryModel.create({
        id: validCategoryId,
        name: validName,
        slug: 'electronics-2024',
      });

      expect(category.getSlug()).toBe('electronics-2024');
    });

    it('should accept valid slug with multiple hyphens', () => {
      const category = CategoryModel.create({
        id: validCategoryId,
        name: validName,
        slug: 'electronics-and-gadgets',
      });

      expect(category.getSlug()).toBe('electronics-and-gadgets');
    });
  });

  describe('reconstitute', () => {
    it('should correctly restore object from database data', () => {
      const dbData: ICategory = {
        id: validCategoryId,
        name: validName,
        slug: validSlug,
        description: validDescription,
        created_at: new Date('2023-01-01'),
        updated_at: new Date('2023-01-02'),
        deleted_at: undefined,
      };

      const category = CategoryModel.reconstitute(dbData);

      expect(category).toBeInstanceOf(CategoryModel);
      expect(category.getId()).toBe(validCategoryId);
      expect(category.getName()).toBe(validName);
      expect(category.getSlug()).toBe(validSlug);
      expect(category.getDescription()).toBe(validDescription);
      expect(category.getCreatedAt()).toEqual(new Date('2023-01-01'));
      expect(category.getUpdatedAt()).toEqual(new Date('2023-01-02'));
      expect(category.getDeletedAt()).toBeNull();
    });

    it('should handle undefined deleted_at', () => {
      const dbData: ICategory = {
        id: validCategoryId,
        name: validName,
        slug: validSlug,
        description: validDescription,
        created_at: new Date('2023-01-01'),
        updated_at: new Date('2023-01-02'),
        deleted_at: undefined,
      };

      const category = CategoryModel.reconstitute(dbData);

      expect(category.getDeletedAt()).toBeNull();
    });

    it('should handle soft deleted category', () => {
      const deletedAt = new Date('2023-01-03');
      const dbData: ICategory = {
        id: validCategoryId,
        name: validName,
        slug: validSlug,
        description: validDescription,
        created_at: new Date('2023-01-01'),
        updated_at: new Date('2023-01-02'),
        deleted_at: deletedAt,
      };

      const category = CategoryModel.reconstitute(dbData);

      expect(category.getDeletedAt()).toEqual(deletedAt);
    });

    it('should handle category without description', () => {
      const dbData: ICategory = {
        id: validCategoryId,
        name: validName,
        slug: validSlug,
        description: undefined,
        created_at: new Date('2023-01-01'),
        updated_at: new Date('2023-01-02'),
        deleted_at: undefined,
      };

      const category = CategoryModel.reconstitute(dbData);

      expect(category.getDescription()).toBeUndefined();
    });
  });

  describe('updateDetails', () => {
    let category: CategoryModel;

    beforeEach(() => {
      category = CategoryModel.create({
        id: validCategoryId,
        name: validName,
        description: validDescription,
      });
    });

    it('should update name and auto-regenerate slug', () => {
      const oldSlug = category.getSlug();
      const newName = 'New Category Name';

      category.updateDetails(newName);

      expect(category.getName()).toBe(newName);
      expect(category.getSlug()).toBe('new-category-name');
      expect(category.getSlug()).not.toBe(oldSlug);
      expect(category.getUpdatedAt()).toBeInstanceOf(Date);
    });

    it('should update description only', () => {
      const newDescription = 'New description';
      const oldName = category.getName();
      const oldSlug = category.getSlug();

      category.updateDetails(undefined, newDescription);

      expect(category.getName()).toBe(oldName);
      expect(category.getSlug()).toBe(oldSlug);
      expect(category.getDescription()).toBe(newDescription);
      expect(category.getUpdatedAt()).toBeInstanceOf(Date);
    });

    it('should update both name and description', () => {
      const newName = 'Updated Category';
      const newDescription = 'Updated description';

      category.updateDetails(newName, newDescription);

      expect(category.getName()).toBe(newName);
      expect(category.getSlug()).toBe('updated-category');
      expect(category.getDescription()).toBe(newDescription);
      expect(category.getUpdatedAt()).toBeInstanceOf(Date);
    });

    it('should trim whitespace from name', () => {
      category.updateDetails('  New Name  ');

      expect(category.getName()).toBe('New Name');
      expect(category.getSlug()).toBe('new-name');
    });

    it('should trim whitespace from description', () => {
      category.updateDetails(undefined, '  New Description  ');

      expect(category.getDescription()).toBe('New Description');
    });

    it('should throw error if name is empty', () => {
      expect(() => {
        category.updateDetails('');
      }).toThrow(DomainValidationException);
    });

    it('should throw error if name is only whitespace', () => {
      expect(() => {
        category.updateDetails('   ');
      }).toThrow(DomainValidationException);
    });

    it('should allow empty description', () => {
      category.updateDetails(undefined, '');

      expect(category.getDescription()).toBe('');
    });

    it('should allow undefined description', () => {
      category.updateDetails(undefined, undefined);

      expect(category.getDescription()).toBe(validDescription);
    });
  });

  describe('changeSlug', () => {
    let category: CategoryModel;

    beforeEach(() => {
      category = CategoryModel.create({
        id: validCategoryId,
        name: validName,
        slug: validSlug,
      });
    });

    it('should change slug to valid new slug', () => {
      const newSlug = 'new-slug-name';
      const oldUpdatedAt = category.getUpdatedAt();

      // Wait a bit to ensure timestamp changes
      setTimeout(() => {
        category.changeSlug(newSlug);

        expect(category.getSlug()).toBe(newSlug);
        expect(category.getUpdatedAt().getTime()).toBeGreaterThan(
          oldUpdatedAt.getTime(),
        );
      }, 10);
    });

    it('should throw error if slug format is invalid (uppercase)', () => {
      expect(() => {
        category.changeSlug('INVALID-SLUG');
      }).toThrow(DomainValidationException);
    });

    it('should throw error if slug format is invalid (spaces)', () => {
      expect(() => {
        category.changeSlug('invalid slug');
      }).toThrow(DomainValidationException);
    });

    it('should throw error if slug format is invalid (special characters)', () => {
      expect(() => {
        category.changeSlug('invalid@slug!');
      }).toThrow(DomainValidationException);
    });

    it('should throw error if slug is empty', () => {
      expect(() => {
        category.changeSlug('');
      }).toThrow(DomainValidationException);
    });

    it('should accept valid slug with numbers', () => {
      category.changeSlug('category-2024');

      expect(category.getSlug()).toBe('category-2024');
    });

    it('should accept valid slug with multiple hyphens', () => {
      category.changeSlug('category-and-subcategory');

      expect(category.getSlug()).toBe('category-and-subcategory');
    });
  });

  describe('toEntity', () => {
    it('should return correct database object structure', () => {
      const category = CategoryModel.create({
        id: validCategoryId,
        name: validName,
        description: validDescription,
        slug: validSlug,
      });

      const entity = category.toEntity();

      expect(entity).toEqual({
        id: validCategoryId,
        name: validName,
        slug: validSlug,
        description: validDescription,
        created_at: category.getCreatedAt(),
        updated_at: category.getUpdatedAt(),
        deleted_at: undefined,
      });
    });

    it('should return undefined for deleted_at when not deleted', () => {
      const category = CategoryModel.create({
        id: validCategoryId,
        name: validName,
      });

      const entity = category.toEntity();

      expect(entity.deleted_at).toBeUndefined();
    });

    it('should return deleted_at when category is soft deleted', () => {
      const dbData: ICategory = {
        id: validCategoryId,
        name: validName,
        slug: validSlug,
        description: validDescription,
        created_at: new Date('2023-01-01'),
        updated_at: new Date('2023-01-02'),
        deleted_at: new Date('2023-01-03'),
      };

      const category = CategoryModel.reconstitute(dbData);
      const entity = category.toEntity();

      expect(entity.deleted_at).toEqual(new Date('2023-01-03'));
    });

    it('should handle undefined description', () => {
      const category = CategoryModel.create({
        id: validCategoryId,
        name: validName,
      });

      const entity = category.toEntity();

      expect(entity.description).toBeUndefined();
    });
  });

  describe('getters', () => {
    let category: CategoryModel;

    beforeEach(() => {
      category = CategoryModel.create({
        id: validCategoryId,
        name: validName,
        description: validDescription,
        slug: validSlug,
      });
    });

    it('should return correct id', () => {
      expect(category.getId()).toBe(validCategoryId);
    });

    it('should return correct name', () => {
      expect(category.getName()).toBe(validName);
    });

    it('should return correct slug', () => {
      expect(category.getSlug()).toBe(validSlug);
    });

    it('should return correct description', () => {
      expect(category.getDescription()).toBe(validDescription);
    });

    it('should return Date instance for createdAt', () => {
      expect(category.getCreatedAt()).toBeInstanceOf(Date);
    });

    it('should return Date instance for updatedAt', () => {
      expect(category.getUpdatedAt()).toBeInstanceOf(Date);
    });

    it('should return null for deletedAt when not deleted', () => {
      expect(category.getDeletedAt()).toBeNull();
    });
  });
});
