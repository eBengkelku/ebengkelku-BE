import { ProductCategoryModel } from '../models/product-category.model';
import { DomainValidationException } from '../../../common/domain/exceptions';
import {
  IProductCategory,
  IProductCategoryCreate,
} from '../interfaces/product-category.interface';

describe('ProductCategoryModel', () => {
  const validCreateData: IProductCategoryCreate = {
    id: 'cat-123',
    name: 'Engine Oil',
    description: 'Various engine oils',
    product_type_id: 'type-123',
    id_creator: 'user-public-id-123',
    created_at: new Date('2026-02-12T00:00:00Z'),
  };

  describe('create', () => {
    it('should create a product category successfully', () => {
      const model = ProductCategoryModel.create(validCreateData);

      expect(model.getId()).toBe('cat-123');
      expect(model.getName()).toBe('Engine Oil');
      expect(model.getDescription()).toBe('Various engine oils');
      expect(model.getProductTypeId()).toBe('type-123');
      expect(model.getCreatorId()).toBe('user-public-id-123');
      expect(model.getCreatedAt()).toEqual(validCreateData.created_at);
      expect(model.getUpdatedAt()).toBeNull();
      expect(model.getDeletedAt()).toBeNull();
    });

    it('should trim the name', () => {
      const model = ProductCategoryModel.create({
        ...validCreateData,
        name: '  Engine Oil  ',
      });

      expect(model.getName()).toBe('Engine Oil');
    });

    it('should trim the description', () => {
      const model = ProductCategoryModel.create({
        ...validCreateData,
        description: '  Various engine oils  ',
      });

      expect(model.getDescription()).toBe('Various engine oils');
    });

    it('should handle null description', () => {
      const model = ProductCategoryModel.create({
        ...validCreateData,
        description: null,
      });

      expect(model.getDescription()).toBeNull();
    });

    it('should throw when name is empty', () => {
      expect(() =>
        ProductCategoryModel.create({ ...validCreateData, name: '' }),
      ).toThrow(DomainValidationException);
    });

    it('should throw when name is whitespace only', () => {
      expect(() =>
        ProductCategoryModel.create({ ...validCreateData, name: '   ' }),
      ).toThrow(DomainValidationException);
    });

    it('should throw when name exceeds 255 characters', () => {
      const longName = 'a'.repeat(256);
      expect(() =>
        ProductCategoryModel.create({
          ...validCreateData,
          name: longName,
        }),
      ).toThrow(DomainValidationException);
    });

    it('should accept name at exactly 255 characters', () => {
      const maxName = 'a'.repeat(255);
      const model = ProductCategoryModel.create({
        ...validCreateData,
        name: maxName,
      });
      expect(model.getName()).toBe(maxName);
    });
  });

  describe('reconstitute', () => {
    it('should reconstitute from database data without validation', () => {
      const dbData: IProductCategory = {
        id: 'cat-123',
        name: 'Brake Pads',
        description: 'Various brake pads',
        product_type_id: 'type-456',
        created_at: new Date('2026-01-01'),
        updated_at: new Date('2026-01-15'),
        deleted_at: null,
        id_creator: 'user-1',
        id_updater: 'user-2',
      };

      const model = ProductCategoryModel.reconstitute(dbData);

      expect(model.getId()).toBe('cat-123');
      expect(model.getName()).toBe('Brake Pads');
      expect(model.getDescription()).toBe('Various brake pads');
      expect(model.getProductTypeId()).toBe('type-456');
      expect(model.getUpdatedAt()).toEqual(new Date('2026-01-15'));
    });

    it('should handle null optional fields', () => {
      const dbData: IProductCategory = {
        id: 'cat-456',
        name: 'Accessories',
        description: null,
        product_type_id: 'type-789',
        created_at: new Date(),
        updated_at: null,
        deleted_at: null,
        id_creator: null,
        id_updater: null,
      };

      const model = ProductCategoryModel.reconstitute(dbData);

      expect(model.getDescription()).toBeNull();
      expect(model.getUpdatedAt()).toBeNull();
      expect(model.getDeletedAt()).toBeNull();
    });
  });

  describe('updateDetails', () => {
    it('should update name and set updater', () => {
      const model = ProductCategoryModel.create(validCreateData);

      model.updateDetails({
        name: 'Brake Pads',
        updaterId: 'updater-123',
      });

      expect(model.getName()).toBe('Brake Pads');
      expect(model.getUpdaterId()).toBe('updater-123');
      expect(model.getUpdatedAt()).not.toBeNull();
    });

    it('should update description', () => {
      const model = ProductCategoryModel.create(validCreateData);

      model.updateDetails({
        description: 'New description',
        updaterId: 'updater-123',
      });

      expect(model.getDescription()).toBe('New description');
    });

    it('should update product type ID', () => {
      const model = ProductCategoryModel.create(validCreateData);

      model.updateDetails({
        productTypeId: 'new-type-id',
        updaterId: 'updater-123',
      });

      expect(model.getProductTypeId()).toBe('new-type-id');
    });

    it('should update multiple fields at once', () => {
      const model = ProductCategoryModel.create(validCreateData);

      model.updateDetails({
        name: 'New Name',
        description: 'New Desc',
        productTypeId: 'new-type-id',
        updaterId: 'updater-123',
      });

      expect(model.getName()).toBe('New Name');
      expect(model.getDescription()).toBe('New Desc');
      expect(model.getProductTypeId()).toBe('new-type-id');
    });

    it('should throw when updating with empty name', () => {
      const model = ProductCategoryModel.create(validCreateData);

      expect(() =>
        model.updateDetails({ name: '', updaterId: 'updater-123' }),
      ).toThrow(DomainValidationException);
    });

    it('should set description to null when updated with empty string', () => {
      const model = ProductCategoryModel.create(validCreateData);

      model.updateDetails({
        description: '',
        updaterId: 'updater-123',
      });

      expect(model.getDescription()).toBeNull();
    });
  });

  describe('toEntity', () => {
    it('should convert to entity with correct snake_case keys', () => {
      const model = ProductCategoryModel.create(validCreateData);
      const entity = model.toEntity();

      expect(entity).toEqual({
        id: 'cat-123',
        name: 'Engine Oil',
        description: 'Various engine oils',
        product_type_id: 'type-123',
        created_at: validCreateData.created_at,
        updated_at: null,
        deleted_at: null,
        id_creator: 'user-public-id-123',
        id_updater: null,
      });
    });

    it('should reflect updates in toEntity output', () => {
      const model = ProductCategoryModel.create(validCreateData);
      model.updateDetails({
        name: 'Updated Name',
        updaterId: 'updater-456',
      });

      const entity = model.toEntity();

      expect(entity.name).toBe('Updated Name');
      expect(entity.id_updater).toBe('updater-456');
      expect(entity.updated_at).not.toBeNull();
    });
  });
});
