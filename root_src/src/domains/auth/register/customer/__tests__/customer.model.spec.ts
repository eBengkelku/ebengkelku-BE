import { CustomerModel } from '../models/customer.model';
import { ICustomer, IRole } from '../interfaces';

describe('CustomerModel', () => {
  const validUserId = '123e4567-e89b-12d3-a456-426614174000';
  const validPublicId = '987fcdeb-51a2-3d4e-b567-890123456789';
  const validName = 'John Doe';
  const validEmail = 'john.doe@example.com';
  const validPassword = '$2b$10$hashedPasswordMock';
  const validPhone = '+6281234567890';
  const validImage = 'https://example.com/photo.jpg';

  const mockRole: IRole = {
    id: 'role-uuid-123',
    key: 'customer',
    name: 'Customer',
    description: 'Customer role',
  };

  describe('create', () => {
    it('should create valid customer instance with all required fields', () => {
      const customer = CustomerModel.create({
        id: validUserId,
        publicId: validPublicId,
        name: validName,
        email: validEmail,
        password: validPassword,
      });

      expect(customer).toBeInstanceOf(CustomerModel);
      expect(customer.id).toBe(validUserId);
      expect(customer.publicId).toBe(validPublicId);
      expect(customer.name).toBe(validName);
      expect(customer.email).toBe(validEmail);
      expect(customer.password).toBe(validPassword);
    });

    it('should create customer with optional phone', () => {
      const customer = CustomerModel.create({
        id: validUserId,
        publicId: validPublicId,
        name: validName,
        email: validEmail,
        password: validPassword,
        phone: validPhone,
      });

      expect(customer.phone).toBe(validPhone);
    });

    it('should create customer with optional image', () => {
      const customer = CustomerModel.create({
        id: validUserId,
        publicId: validPublicId,
        name: validName,
        email: validEmail,
        password: validPassword,
        image: validImage,
      });

      expect(customer.image).toBe(validImage);
    });

    it('should create customer with all optional fields', () => {
      const customer = CustomerModel.create({
        id: validUserId,
        publicId: validPublicId,
        name: validName,
        email: validEmail,
        password: validPassword,
        phone: validPhone,
        image: validImage,
        emailVerifiedAt: new Date('2026-01-27T15:00:00.000Z'),
        isEncrypted: true,
      });

      expect(customer.phone).toBe(validPhone);
      expect(customer.image).toBe(validImage);
      expect(customer.isEncrypted).toBe(true);
    });

    it('should default phone and image to null when not provided', () => {
      const customer = CustomerModel.create({
        id: validUserId,
        publicId: validPublicId,
        name: validName,
        email: validEmail,
        password: validPassword,
      });

      expect(customer.phone).toBeNull();
      expect(customer.image).toBeNull();
    });

    it('should default isEncrypted to true when not provided', () => {
      const customer = CustomerModel.create({
        id: validUserId,
        publicId: validPublicId,
        name: validName,
        email: validEmail,
        password: validPassword,
      });

      expect(customer.isEncrypted).toBe(true);
    });

    it('should set isEncrypted to false when explicitly specified', () => {
      const customer = CustomerModel.create({
        id: validUserId,
        publicId: validPublicId,
        name: validName,
        email: validEmail,
        password: validPassword,
        isEncrypted: false,
      });

      expect(customer.isEncrypted).toBe(false);
    });

    it('should initialize with empty roles array', () => {
      const customer = CustomerModel.create({
        id: validUserId,
        publicId: validPublicId,
        name: validName,
        email: validEmail,
        password: validPassword,
      });

      expect(customer.roles).toEqual([]);
    });

    it('should set emailVerifiedAt to current date when not provided', () => {
      const beforeCreate = new Date();
      const customer = CustomerModel.create({
        id: validUserId,
        publicId: validPublicId,
        name: validName,
        email: validEmail,
        password: validPassword,
      });

      const entity = customer.toEntity();
      expect(entity.email_verified_at).toBeInstanceOf(Date);
      expect(entity.email_verified_at!.getTime()).toBeGreaterThanOrEqual(
        beforeCreate.getTime(),
      );
    });

    it('should use provided emailVerifiedAt when specified', () => {
      const customDate = new Date('2026-01-01T00:00:00.000Z');
      const customer = CustomerModel.create({
        id: validUserId,
        publicId: validPublicId,
        name: validName,
        email: validEmail,
        password: validPassword,
        emailVerifiedAt: customDate,
      });

      const entity = customer.toEntity();
      expect(entity.email_verified_at).toEqual(customDate);
    });
  });

  describe('reconstitute', () => {
    it('should correctly restore object from database data', () => {
      const dbData: ICustomer = {
        id: validUserId,
        public_id: validPublicId,
        name: validName,
        email: validEmail,
        password: validPassword,
        phone: validPhone,
        image: validImage,
        provider: 'google',
        provider_id: 'google-123',
        email_verified_at: new Date('2026-01-27T15:00:00.000Z'),
        created_at: new Date('2026-01-01T00:00:00.000Z'),
        updated_at: new Date('2026-01-15T00:00:00.000Z'),
        deleted_at: null,
        id_creator: 'creator-123',
        id_updater: 'updater-456',
        is_encrypted: true,
      };

      const customer = CustomerModel.reconstitute(dbData);

      expect(customer).toBeInstanceOf(CustomerModel);
      expect(customer.id).toBe(validUserId);
      expect(customer.publicId).toBe(validPublicId);
      expect(customer.name).toBe(validName);
      expect(customer.email).toBe(validEmail);
      expect(customer.password).toBe(validPassword);
      expect(customer.phone).toBe(validPhone);
      expect(customer.image).toBe(validImage);
      expect(customer.isEncrypted).toBe(true);
    });

    it('should reconstitute with roles array', () => {
      const dbData: ICustomer = {
        id: validUserId,
        public_id: validPublicId,
        name: validName,
        email: validEmail,
        password: validPassword,
        created_at: new Date(),
        is_encrypted: true,
      };

      const customer = CustomerModel.reconstitute(dbData, [mockRole]);

      expect(customer.roles).toHaveLength(1);
      expect(customer.roles[0].key).toBe('customer');
    });

    it('should handle undefined optional fields', () => {
      const dbData: ICustomer = {
        id: validUserId,
        public_id: validPublicId,
        name: validName,
        email: validEmail,
        password: validPassword,
        phone: undefined,
        image: undefined,
        provider: undefined,
        provider_id: undefined,
        email_verified_at: undefined,
        created_at: new Date(),
        updated_at: undefined,
        deleted_at: undefined,
        id_creator: undefined,
        id_updater: undefined,
        is_encrypted: false,
      };

      const customer = CustomerModel.reconstitute(dbData);

      expect(customer.phone).toBeNull();
      expect(customer.image).toBeNull();
      expect(customer.isEncrypted).toBe(false);
    });

    it('should handle null optional fields', () => {
      const dbData: ICustomer = {
        id: validUserId,
        public_id: validPublicId,
        name: validName,
        email: validEmail,
        password: validPassword,
        phone: null,
        image: null,
        provider: null,
        provider_id: null,
        email_verified_at: null,
        created_at: new Date(),
        updated_at: null,
        deleted_at: null,
        id_creator: null,
        id_updater: null,
        is_encrypted: true,
      };

      const customer = CustomerModel.reconstitute(dbData);

      expect(customer.phone).toBeNull();
      expect(customer.image).toBeNull();
    });

    it('should default roles to empty array when not provided', () => {
      const dbData: ICustomer = {
        id: validUserId,
        public_id: validPublicId,
        name: validName,
        email: validEmail,
        password: validPassword,
        created_at: new Date(),
        is_encrypted: true,
      };

      const customer = CustomerModel.reconstitute(dbData);

      expect(customer.roles).toEqual([]);
    });
  });

  describe('toEntity', () => {
    it('should return correct database entity format', () => {
      const customer = CustomerModel.create({
        id: validUserId,
        publicId: validPublicId,
        name: validName,
        email: validEmail,
        password: validPassword,
        phone: validPhone,
        image: validImage,
        isEncrypted: true,
      });

      const entity = customer.toEntity();

      expect(entity.id).toBe(validUserId);
      expect(entity.public_id).toBe(validPublicId);
      expect(entity.name).toBe(validName);
      expect(entity.email).toBe(validEmail);
      expect(entity.password).toBe(validPassword);
      expect(entity.phone).toBe(validPhone);
      expect(entity.image).toBe(validImage);
      expect(entity.is_encrypted).toBe(true);
    });

    it('should include all required fields in entity', () => {
      const customer = CustomerModel.create({
        id: validUserId,
        publicId: validPublicId,
        name: validName,
        email: validEmail,
        password: validPassword,
      });

      const entity = customer.toEntity();

      expect(entity).toHaveProperty('id');
      expect(entity).toHaveProperty('public_id');
      expect(entity).toHaveProperty('name');
      expect(entity).toHaveProperty('email');
      expect(entity).toHaveProperty('password');
      expect(entity).toHaveProperty('phone');
      expect(entity).toHaveProperty('image');
      expect(entity).toHaveProperty('provider');
      expect(entity).toHaveProperty('provider_id');
      expect(entity).toHaveProperty('email_verified_at');
      expect(entity).toHaveProperty('created_at');
      expect(entity).toHaveProperty('updated_at');
      expect(entity).toHaveProperty('deleted_at');
      expect(entity).toHaveProperty('id_creator');
      expect(entity).toHaveProperty('id_updater');
      expect(entity).toHaveProperty('is_encrypted');
    });

    it('should return null for provider fields from create', () => {
      const customer = CustomerModel.create({
        id: validUserId,
        publicId: validPublicId,
        name: validName,
        email: validEmail,
        password: validPassword,
      });

      const entity = customer.toEntity();

      expect(entity.provider).toBeNull();
      expect(entity.provider_id).toBeNull();
    });

    it('should return null for updated_at and deleted_at from create', () => {
      const customer = CustomerModel.create({
        id: validUserId,
        publicId: validPublicId,
        name: validName,
        email: validEmail,
        password: validPassword,
      });

      const entity = customer.toEntity();

      expect(entity.updated_at).toBeNull();
      expect(entity.deleted_at).toBeNull();
    });

    it('should preserve timestamps from reconstituted entity', () => {
      const createdAt = new Date('2026-01-01T00:00:00.000Z');
      const updatedAt = new Date('2026-01-15T00:00:00.000Z');
      const deletedAt = new Date('2026-01-20T00:00:00.000Z');

      const dbData: ICustomer = {
        id: validUserId,
        public_id: validPublicId,
        name: validName,
        email: validEmail,
        password: validPassword,
        created_at: createdAt,
        updated_at: updatedAt,
        deleted_at: deletedAt,
        is_encrypted: true,
      };

      const customer = CustomerModel.reconstitute(dbData);
      const entity = customer.toEntity();

      expect(entity.created_at).toEqual(createdAt);
      expect(entity.updated_at).toEqual(updatedAt);
      expect(entity.deleted_at).toEqual(deletedAt);
    });
  });

  describe('toResponse', () => {
    it('should exclude password from response', () => {
      const customer = CustomerModel.create({
        id: validUserId,
        publicId: validPublicId,
        name: validName,
        email: validEmail,
        password: validPassword,
      });

      const response = customer.toResponse();

      expect(response).not.toHaveProperty('password');
    });

    it('should include roles in response', () => {
      const dbData: ICustomer = {
        id: validUserId,
        public_id: validPublicId,
        name: validName,
        email: validEmail,
        password: validPassword,
        created_at: new Date(),
        is_encrypted: true,
      };

      const customer = CustomerModel.reconstitute(dbData, [mockRole]);
      const response = customer.toResponse();

      expect(response.roles).toHaveLength(1);
      expect(response.roles[0].key).toBe('customer');
    });

    it('should include all non-sensitive fields in response', () => {
      const customer = CustomerModel.create({
        id: validUserId,
        publicId: validPublicId,
        name: validName,
        email: validEmail,
        password: validPassword,
        phone: validPhone,
        image: validImage,
      });

      const response = customer.toResponse();

      expect(response.id).toBe(validUserId);
      expect(response.public_id).toBe(validPublicId);
      expect(response.name).toBe(validName);
      expect(response.email).toBe(validEmail);
      expect(response.phone).toBe(validPhone);
      expect(response.image).toBe(validImage);
      expect(response.roles).toEqual([]);
    });

    it('should exclude is_encrypted from response', () => {
      const customer = CustomerModel.create({
        id: validUserId,
        publicId: validPublicId,
        name: validName,
        email: validEmail,
        password: validPassword,
      });

      const response = customer.toResponse();

      expect(response).not.toHaveProperty('is_encrypted');
    });

    it('should include timestamps in response', () => {
      const customer = CustomerModel.create({
        id: validUserId,
        publicId: validPublicId,
        name: validName,
        email: validEmail,
        password: validPassword,
      });

      const response = customer.toResponse();

      expect(response).toHaveProperty('created_at');
      expect(response).toHaveProperty('updated_at');
      expect(response).toHaveProperty('deleted_at');
    });
  });

  describe('getters', () => {
    let customer: CustomerModel;

    beforeEach(() => {
      customer = CustomerModel.create({
        id: validUserId,
        publicId: validPublicId,
        name: validName,
        email: validEmail,
        password: validPassword,
        phone: validPhone,
        image: validImage,
        isEncrypted: true,
      });
    });

    it('should return correct id', () => {
      expect(customer.id).toBe(validUserId);
    });

    it('should return correct publicId', () => {
      expect(customer.publicId).toBe(validPublicId);
    });

    it('should return correct name', () => {
      expect(customer.name).toBe(validName);
    });

    it('should return correct email', () => {
      expect(customer.email).toBe(validEmail);
    });

    it('should return correct password', () => {
      expect(customer.password).toBe(validPassword);
    });

    it('should return correct phone', () => {
      expect(customer.phone).toBe(validPhone);
    });

    it('should return correct image', () => {
      expect(customer.image).toBe(validImage);
    });

    it('should return correct isEncrypted', () => {
      expect(customer.isEncrypted).toBe(true);
    });

    it('should return empty roles array initially', () => {
      expect(customer.roles).toEqual([]);
    });
  });

  describe('setRoles', () => {
    it('should set roles after creation', () => {
      const customer = CustomerModel.create({
        id: validUserId,
        publicId: validPublicId,
        name: validName,
        email: validEmail,
        password: validPassword,
      });

      expect(customer.roles).toEqual([]);

      customer.setRoles([mockRole]);

      expect(customer.roles).toHaveLength(1);
      expect(customer.roles[0].key).toBe('customer');
    });

    it('should replace existing roles', () => {
      const dbData: ICustomer = {
        id: validUserId,
        public_id: validPublicId,
        name: validName,
        email: validEmail,
        password: validPassword,
        created_at: new Date(),
        is_encrypted: true,
      };

      const customer = CustomerModel.reconstitute(dbData, [mockRole]);
      expect(customer.roles).toHaveLength(1);

      const newRole: IRole = {
        id: 'role-uuid-456',
        key: 'admin',
        name: 'Admin',
        description: 'Admin role',
      };

      customer.setRoles([newRole]);

      expect(customer.roles).toHaveLength(1);
      expect(customer.roles[0].key).toBe('admin');
    });

    it('should allow setting multiple roles', () => {
      const customer = CustomerModel.create({
        id: validUserId,
        publicId: validPublicId,
        name: validName,
        email: validEmail,
        password: validPassword,
      });

      const adminRole: IRole = {
        id: 'role-uuid-456',
        key: 'admin',
        name: 'Admin',
        description: 'Admin role',
      };

      customer.setRoles([mockRole, adminRole]);

      expect(customer.roles).toHaveLength(2);
    });

    it('should allow setting empty roles array', () => {
      const dbData: ICustomer = {
        id: validUserId,
        public_id: validPublicId,
        name: validName,
        email: validEmail,
        password: validPassword,
        created_at: new Date(),
        is_encrypted: true,
      };

      const customer = CustomerModel.reconstitute(dbData, [mockRole]);
      expect(customer.roles).toHaveLength(1);

      customer.setRoles([]);

      expect(customer.roles).toEqual([]);
    });
  });
});
