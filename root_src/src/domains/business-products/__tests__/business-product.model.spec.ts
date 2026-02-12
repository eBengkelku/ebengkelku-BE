import { BusinessProductModel } from '../models/business-product.model';
import { DomainValidationException } from '../../../common/domain';
import { IBusinessProductCreate } from '../interfaces/business-product.interface';

describe('BusinessProductModel', () => {
  const validCreateData: IBusinessProductCreate = {
    id: 'prod-001',
    name: 'Oli Mesin Toyota 10W-40',
    description: 'Oli mesin berkualitas tinggi',
    price: 85000,
    unit: 'liter',
    status: 'active',
    business_id: 'biz-001',
    category_id: 'cat-001',
    id_creator: 'user-001',
    created_at: new Date(),
  };

  // ============================================================================
  // CREATE
  // ============================================================================

  describe('create', () => {
    it('should create a valid business product model', () => {
      const product = BusinessProductModel.create(validCreateData);

      expect(product.getId()).toBe('prod-001');
      expect(product.getName()).toBe('Oli Mesin Toyota 10W-40');
      expect(product.getDescription()).toBe('Oli mesin berkualitas tinggi');
      expect(product.getPrice()).toBe(85000);
      expect(product.getUnit()).toBe('liter');
      expect(product.getStatus()).toBe('active');
      expect(product.getBusinessId()).toBe('biz-001');
      expect(product.getCategoryId()).toBe('cat-001');
      expect(product.getCreatorId()).toBe('user-001');
      expect(product.getDeletedAt()).toBeNull();
    });

    it('should default unit to pcs when not provided', () => {
      const product = BusinessProductModel.create({
        ...validCreateData,
        unit: '',
      });
      expect(product.getUnit()).toBe('pcs');
    });

    it('should trim name whitespace', () => {
      const product = BusinessProductModel.create({
        ...validCreateData,
        name: '  Oli Mesin  ',
      });
      expect(product.getName()).toBe('Oli Mesin');
    });

    it('should trim description whitespace', () => {
      const product = BusinessProductModel.create({
        ...validCreateData,
        description: '  Some description  ',
      });
      expect(product.getDescription()).toBe('Some description');
    });

    it('should throw DomainValidationException when name is empty', () => {
      expect(() =>
        BusinessProductModel.create({ ...validCreateData, name: '' }),
      ).toThrow(DomainValidationException);
    });

    it('should throw DomainValidationException when name is only whitespace', () => {
      expect(() =>
        BusinessProductModel.create({ ...validCreateData, name: '   ' }),
      ).toThrow(DomainValidationException);
    });

    it('should throw DomainValidationException when name exceeds 255 chars', () => {
      expect(() =>
        BusinessProductModel.create({
          ...validCreateData,
          name: 'a'.repeat(256),
        }),
      ).toThrow(DomainValidationException);
    });

    it('should throw DomainValidationException when price is 0', () => {
      expect(() =>
        BusinessProductModel.create({ ...validCreateData, price: 0 }),
      ).toThrow(DomainValidationException);
    });

    it('should throw DomainValidationException when price is negative', () => {
      expect(() =>
        BusinessProductModel.create({ ...validCreateData, price: -100 }),
      ).toThrow(DomainValidationException);
    });

    it('should throw DomainValidationException when price is a float', () => {
      expect(() =>
        BusinessProductModel.create({ ...validCreateData, price: 99.99 }),
      ).toThrow(DomainValidationException);
    });

    it('should throw DomainValidationException when status is invalid', () => {
      expect(() =>
        BusinessProductModel.create({
          ...validCreateData,
          status: 'invalid_status',
        }),
      ).toThrow(DomainValidationException);
    });

    it('should accept valid statuses: active, draft, archived', () => {
      for (const status of ['active', 'draft', 'archived']) {
        const product = BusinessProductModel.create({
          ...validCreateData,
          status,
        });
        expect(product.getStatus()).toBe(status);
      }
    });
  });

  // ============================================================================
  // RECONSTITUTE
  // ============================================================================

  describe('reconstitute', () => {
    it('should reconstitute from database entity', () => {
      const now = new Date();
      const product = BusinessProductModel.reconstitute({
        id: 'prod-001',
        name: 'Oli Mesin',
        description: 'Description',
        price: 85000,
        unit: 'liter',
        status: 'active',
        business_id: 'biz-001',
        category_id: 'cat-001',
        created_at: now,
        updated_at: now,
        deleted_at: null,
        id_creator: 'user-001',
        id_updater: 'user-002',
      });

      expect(product.getId()).toBe('prod-001');
      expect(product.getName()).toBe('Oli Mesin');
      expect(product.getPrice()).toBe(85000);
      expect(product.getCreatedAt()).toBe(now);
      expect(product.getUpdatedAt()).toBe(now);
      expect(product.getDeletedAt()).toBeNull();
      expect(product.getUpdaterId()).toBe('user-002');
    });

    it('should handle null description', () => {
      const product = BusinessProductModel.reconstitute({
        id: 'prod-001',
        name: 'Oli',
        price: 85000,
        unit: 'pcs',
        status: 'active',
        business_id: 'biz-001',
        category_id: 'cat-001',
        created_at: new Date(),
      });
      expect(product.getDescription()).toBeNull();
    });
  });

  // ============================================================================
  // UPDATE DETAILS
  // ============================================================================

  describe('updateDetails', () => {
    let product: BusinessProductModel;

    beforeEach(() => {
      product = BusinessProductModel.create(validCreateData);
    });

    it('should update name', () => {
      product.updateDetails({ name: 'New Name', updaterId: 'user-002' });
      expect(product.getName()).toBe('New Name');
      expect(product.getUpdaterId()).toBe('user-002');
    });

    it('should update price', () => {
      product.updateDetails({ price: 100000, updaterId: 'user-002' });
      expect(product.getPrice()).toBe(100000);
    });

    it('should update unit', () => {
      product.updateDetails({ unit: 'bottle', updaterId: 'user-002' });
      expect(product.getUnit()).toBe('bottle');
    });

    it('should update status', () => {
      product.updateDetails({ status: 'archived', updaterId: 'user-002' });
      expect(product.getStatus()).toBe('archived');
    });

    it('should update category', () => {
      product.updateDetails({
        categoryId: 'cat-002',
        updaterId: 'user-002',
      });
      expect(product.getCategoryId()).toBe('cat-002');
    });

    it('should update description to null', () => {
      product.updateDetails({
        description: null,
        updaterId: 'user-002',
      });
      expect(product.getDescription()).toBeNull();
    });

    it('should set updatedAt on any change', () => {
      const beforeUpdate = product.getUpdatedAt();
      product.updateDetails({ name: 'Changed', updaterId: 'user-002' });
      expect(product.getUpdatedAt()).not.toBe(beforeUpdate);
    });

    it('should throw on empty name update', () => {
      expect(() =>
        product.updateDetails({ name: '', updaterId: 'user-002' }),
      ).toThrow(DomainValidationException);
    });

    it('should throw on negative price update', () => {
      expect(() =>
        product.updateDetails({ price: -1, updaterId: 'user-002' }),
      ).toThrow(DomainValidationException);
    });

    it('should throw on invalid status update', () => {
      expect(() =>
        product.updateDetails({
          status: 'invalid',
          updaterId: 'user-002',
        }),
      ).toThrow(DomainValidationException);
    });
  });

  // ============================================================================
  // TO ENTITY
  // ============================================================================

  describe('toEntity', () => {
    it('should convert to database entity format', () => {
      const product = BusinessProductModel.create(validCreateData);
      const entity = product.toEntity();

      expect(entity.id).toBe('prod-001');
      expect(entity.name).toBe('Oli Mesin Toyota 10W-40');
      expect(entity.description).toBe('Oli mesin berkualitas tinggi');
      expect(entity.price).toBe(85000);
      expect(entity.unit).toBe('liter');
      expect(entity.status).toBe('active');
      expect(entity.business_id).toBe('biz-001');
      expect(entity.category_id).toBe('cat-001');
      expect(entity.id_creator).toBe('user-001');
      expect(entity.deleted_at).toBeNull();
    });
  });
});
