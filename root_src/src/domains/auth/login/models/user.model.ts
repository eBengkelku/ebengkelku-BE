import { IUserRow } from '../interfaces';

/**
 * User Model for Login
 *
 * Domain model for user entity used in login operations.
 * Provides factory methods for reconstituting user instances from database
 * and business logic for authentication checks.
 *
 * @class UserModel
 * @version 1.0.0
 * @since 2026-01-28
 */
export class UserModel {
  private constructor(
    private readonly _id: string,
    private readonly _publicId: string,
    private _name: string,
    private _email: string,
    private readonly _password: string | null,
    private _phone: string | null,
    private readonly _image: string | null,
    private readonly _provider: string | null,
    private readonly _providerId: string | null,
    private readonly _emailVerifiedAt: Date | null,
    private readonly _createdAt: Date,
    private readonly _updatedAt: Date | null,
    private readonly _deletedAt: Date | null,
    private readonly _idCreator: string | null,
    private readonly _idUpdater: string | null,
    private readonly _isEncrypted: boolean,
  ) {}

  /**
   * Factory method for reconstituting user from database row
   *
   * @param data - Raw user data from database
   * @returns UserModel instance
   */
  static reconstitute(data: IUserRow): UserModel {
    return new UserModel(
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
    );
  }

  // ============================================================================
  // QUERY METHODS - Business logic for authentication
  // ============================================================================

  /**
   * Checks if the user account is active (not deleted)
   *
   * @returns True if account is not deleted
   */
  isActive(): boolean {
    return this._deletedAt === null;
  }

  /**
   * Checks if the user's email is verified
   *
   * @returns True if email_verified_at is set
   */
  isEmailVerified(): boolean {
    return this._emailVerifiedAt !== null;
  }

  /**
   * Checks if user has password authentication (not OAuth-only)
   *
   * @returns True if password is set
   */
  hasPasswordAuth(): boolean {
    return this._password !== null;
  }

  /**
   * Checks if the user can authenticate via password
   * User must be active, have verified email, and have password set
   *
   * @returns True if user can login with password
   */
  canLoginWithPassword(): boolean {
    return this.isActive() && this.isEmailVerified() && this.hasPasswordAuth();
  }

  // ============================================================================
  // CONVERSION METHODS
  // ============================================================================

  /**
   * Converts model to database entity format
   */
  toEntity(): IUserRow {
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

  // ============================================================================
  // GETTERS
  // ============================================================================

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

  get password(): string | null {
    return this._password;
  }

  get phone(): string | null {
    return this._phone;
  }

  get image(): string | null {
    return this._image;
  }

  get isEncrypted(): boolean {
    return this._isEncrypted;
  }

  get emailVerifiedAt(): Date | null {
    return this._emailVerifiedAt;
  }

  get deletedAt(): Date | null {
    return this._deletedAt;
  }

  // ============================================================================
  // SETTERS (for decrypted data)
  // ============================================================================

  /**
   * Updates decrypted name
   */
  setDecryptedName(name: string): void {
    this._name = name;
  }

  /**
   * Updates decrypted email
   */
  setDecryptedEmail(email: string): void {
    this._email = email;
  }

  /**
   * Updates decrypted phone
   */
  setDecryptedPhone(phone: string | null): void {
    this._phone = phone;
  }
}
