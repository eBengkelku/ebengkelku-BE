/**
 * Login Interface
 *
 * Defines the shape of login-related data structures for the login domain.
 *
 * @module LoginInterfaces
 * @version 1.0.0
 * @since 2026-01-28
 */

/**
 * Login response data containing the access token
 */
export interface ILoginResponseData {
  access_token: string;
  type: 'Bearer';
  expiration_time: number;
}

/**
 * Complete login response
 */
export interface ILoginResponse {
  success: boolean;
  message: string;
  data: ILoginResponseData;
}

/**
 * Database row for user (raw from database)
 */
export interface IUserRow {
  id: string;
  public_id: string;
  name: string;
  email: string;
  phone?: string | null;
  password: string | null;
  image?: string | null;
  provider?: string | null;
  provider_id?: string | null;
  email_verified_at?: Date | null;
  created_at: Date;
  updated_at?: Date | null;
  deleted_at?: Date | null;
  id_creator?: string | null;
  id_updater?: string | null;
  is_encrypted: boolean;
}

/**
 * Decrypted user data
 */
export interface IDecryptedUserData {
  name: string;
  email: string;
  phone: string | null;
}
