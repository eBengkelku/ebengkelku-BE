import { ProductTypeModel } from '../models/product-type.model';
import { DomainValidationException } from '../../../common/domain/exceptions';
import {
  IProductType,
  IProductTypeCreate,
} from '../interfaces/product-type.interface';

describe('ProductTypeModel', () => {
  const validCreateData: IProductTypeCreate = {
    id: 'type-123',
    name: 'Tools',
    id_creator: 'user-public-id-123',
    created_at: new Date('2026-02-12T00:00:00Z'),
  };

  describe('create', () => {
    it('should create a product type successfully', () => {
      const model = ProductTypeModel.create(validCreateData);

      expect(model.getId()).toBe('type-123');
      expect(model.getName()).toBe('Tools');
      expect(model.getCreatorId()).toBe('user-public-id-123');
      expect(model.getCreatedAt()).toEqual(validCreateData.created_at);
      expect(model.getUpdatedAt()).toBeNull();
      expect(model.getDeletedAt()).toBeNull();
      expect(model.getUpdaterId()).toBeNull();
    });

    it('should trim the name', () => {
      const model = ProductTypeModel.create({
        ...validCreateData,
        name: '  Tools  ',
      });

      expect(model.getName()).toBe('Tools');
    });

    it('should throw when name is empty', () => {
      expect(() =>
        ProductTypeModel.create({ ...validCreateData, name: '' }),
      ).toThrow(DomainValidationException);
    });

    it('should throw when name is whitespace only', () => {
      expect(() =>
        ProductTypeModel.create({ ...validCreateData, name: '   ' }),
      ).toThrow(DomainValidationException);
    });

    it('should throw when name exceeds 100 characters', () => {
      const longName = 'a'.repeat(101);
      expect(() =>
        ProductTypeModel.create({ ...validCreateData, name: longName }),
      ).toThrow(DomainValidationException);
    });

    it('should accept name at exactly 100 characters', () => {
      const maxName = 'a'.repeat(100);
      const model = ProductTypeModel.create({
        ...validCreateData,
        name: maxName,
      });
      expect(model.getName()).toBe(maxName);
    });
  });

  describe('reconstitute', () => {
    it('should reconstitute from database data without validation', () => {
      const dbData: IProductType = {
        id: 'type-123',
        name: 'Spare Parts',
        created_at: new Date('2026-01-01'),
        updated_at: new Date('2026-01-15'),
        deleted_at: null,
        id_creator: 'user-1',
        id_updater: 'user-2',
      };

      const model = ProductTypeModel.reconstitute(dbData);

      expect(model.getId()).toBe('type-123');
      expect(model.getName()).toBe('Spare Parts');
      expect(model.getUpdatedAt()).toEqual(new Date('2026-01-15'));
      expect(model.getCreatorId()).toBe('user-1');
      expect(model.getUpdaterId()).toBe('user-2');
    });

    it('should handle null optional fields', () => {
      const dbData: IProductType = {
        id: 'type-456',
        name: 'Accessories',
        created_at: new Date(),
        updated_at: null,
        deleted_at: null,
        id_creator: null,
        id_updater: null,
      };

      const model = ProductTypeModel.reconstitute(dbData);

      expect(model.getUpdatedAt()).toBeNull();
      expect(model.getDeletedAt()).toBeNull();
      expect(model.getCreatorId()).toBeNull();
      expect(model.getUpdaterId()).toBeNull();
    });
  });

  describe('updateName', () => {
    it('should update name and set updater', () => {
      const model = ProductTypeModel.create(validCreateData);

      model.updateName('Spare Parts', 'updater-123');

      expect(model.getName()).toBe('Spare Parts');
      expect(model.getUpdaterId()).toBe('updater-123');
      expect(model.getUpdatedAt()).not.toBeNull();
    });

    it('should trim the updated name', () => {
      const model = ProductTypeModel.create(validCreateData);

      model.updateName('  Spare Parts  ', 'updater-123');

      expect(model.getName()).toBe('Spare Parts');
    });

    it('should throw when updating with empty name', () => {
      const model = ProductTypeModel.create(validCreateData);

      expect(() => model.updateName('', 'updater-123')).toThrow(
        DomainValidationException,
      );
    });

    it('should throw when updating with name exceeding 100 chars', () => {
      const model = ProductTypeModel.create(validCreateData);
      const longName = 'a'.repeat(101);

      expect(() => model.updateName(longName, 'updater-123')).toThrow(
        DomainValidationException,
      );
    });
  });

  describe('toEntity', () => {
    it('should convert to entity with correct snake_case keys', () => {
      const model = ProductTypeModel.create(validCreateData);
      const entity = model.toEntity();

      expect(entity).toEqual({
        id: 'type-123',
        name: 'Tools',
        created_at: validCreateData.created_at,
        updated_at: null,
        deleted_at: null,
        id_creator: 'user-public-id-123',
        id_updater: null,
      });
    });

    it('should reflect updates in toEntity output', () => {
      const model = ProductTypeModel.create(validCreateData);
      model.updateName('Updated Name', 'updater-456');
      const entity = model.toEntity();

      expect(entity.name).toBe('Updated Name');
      expect(entity.id_updater).toBe('updater-456');
      expect(entity.updated_at).not.toBeNull();
    });
  });
});
