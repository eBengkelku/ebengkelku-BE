import { IOwner, IOwnerWithRoles, IRole } from '../interfaces';

/**
 * Owner Model
 *
 * Domain model for owner entity. Provides factory methods for creating
 * and reconstituting owner instances.
 *
 * @class OwnerModel
 * @version 1.0.0
 * @since 2026-01-29
 */
export class OwnerModel {
  private constructor(
    private readonly _id: string,
    private readonly _publicId: string,
    private _name: string,
    private _email: string,
    private _password: string,
    private _phone: string | null,
    private _image: string | null,
    private readonly _provider: string | null,
    private readonly _providerId: string | null,
    private _emailVerifiedAt: Date | null,
    private readonly _createdAt: Date,
    private _updatedAt: Date | null,
    private _deletedAt: Date | null,
    private readonly _idCreator: string | null,
    private _idUpdater: string | null,
    private _isEncrypted: boolean,
    private _roles: IRole[] = [],
  ) {}

  /**
   * Factory method for creating a new owner instance
   */
  static create(data: {
    id: string;
    publicId: string;
    name: string;
    email: string;
    password: string;
    phone?: string | null;
    image?: string | null;
    emailVerifiedAt?: Date | null;
    isEncrypted?: boolean;
  }): OwnerModel {
    return new OwnerModel(
      data.id,
      data.publicId,
      data.name,
      data.email,
      data.password,
      data.phone ?? null,
      data.image ?? null,
      null, // provider
      null, // provider_id
      data.emailVerifiedAt ?? new Date(),
      new Date(), // created_at
      null, // updated_at
      null, // deleted_at
      null, // id_creator
      null, // id_updater
      data.isEncrypted ?? true,
      [],
    );
  }

  /**
   * Factory method for reconstituting owner from database row
   */
  static reconstitute(data: IOwner, roles: IRole[] = []): OwnerModel {
    return new OwnerModel(
      data.id,
      data.public_id,
      data.name,
      data.email,
      data.password,
      data.phone ?? null,
      data.image ?? null,
      data.provider ?? null,
      data.provider_id ?? null,
      data.email_verified_at ?? null,
      data.created_at,
      data.updated_at ?? null,
      data.deleted_at ?? null,
      data.id_creator ?? null,
      data.id_updater ?? null,
      data.is_encrypted,
      roles,
    );
  }

  /**
   * Converts model to database entity format
   */
  toEntity(): IOwner {
    return {
      id: this._id,
      public_id: this._publicId,
      name: this._name,
      email: this._email,
      password: this._password,
      phone: this._phone,
      image: this._image,
      provider: this._provider,
      provider_id: this._providerId,
      email_verified_at: this._emailVerifiedAt,
      created_at: this._createdAt,
      updated_at: this._updatedAt,
      deleted_at: this._deletedAt,
      id_creator: this._idCreator,
      id_updater: this._idUpdater,
      is_encrypted: this._isEncrypted,
    };
  }

  /**
   * Converts model to response format (excludes password)
   */
  toResponse(): IOwnerWithRoles {
    return {
      id: this._id,
      public_id: this._publicId,
      name: this._name,
      email: this._email,
      phone: this._phone,
      image: this._image,
      provider: this._provider,
      provider_id: this._providerId,
      email_verified_at: this._emailVerifiedAt,
      created_at: this._createdAt,
      updated_at: this._updatedAt,
      deleted_at: this._deletedAt,
      id_creator: this._idCreator,
      id_updater: this._idUpdater,
      roles: this._roles,
    };
  }

  // Getters
  get id(): string {
    return this._id;
  }
  get publicId(): string {
    return this._publicId;
  }
  get name(): string {
    return this._name;
  }
  get email(): string {
    return this._email;
  }
  get password(): string {
    return this._password;
  }
  get phone(): string | null {
    return this._phone;
  }
  get image(): string | null {
    return this._image;
  }
  get roles(): IRole[] {
    return this._roles;
  }
  get isEncrypted(): boolean {
    return this._isEncrypted;
  }

  // Methods
  setRoles(roles: IRole[]): void {
    this._roles = roles;
  }
}
