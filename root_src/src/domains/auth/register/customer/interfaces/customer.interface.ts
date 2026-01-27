/**
 * Customer Interface
 *
 * Defines the shape of customer-related data structures for the registration domain.
 *
 * @module CustomerInterfaces
 * @version 1.0.0
 * @since 2026-01-27
 */

/**
 * Customer entity interface matching core.users table
 */
export interface ICustomer {
  id: string;
  public_id: string;
  name: string;
  email: string;
  phone?: string | null;
  password: string;
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
 * Role entity interface matching core.roles table
 */
export interface IRole {
  id: string;
  key: string;
  name: string;
  description?: string | null;
}

/**
 * Customer with roles (used in response, excludes password)
 */
export interface ICustomerWithRoles {
  id: string;
  public_id: string;
  name: string;
  email: string;
  phone?: string | null;
  image?: string | null;
  provider?: string | null;
  provider_id?: string | null;
  email_verified_at?: Date | null;
  created_at: Date;
  updated_at?: Date | null;
  deleted_at?: Date | null;
  id_creator?: string | null;
  id_updater?: string | null;
  roles: IRole[];
}

/**
 * Input for creating a new customer
 */
export interface ICreateCustomerInput {
  name: string;
  email: string;
  password: string;
  phone?: string;
  image?: string;
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
  password: string;
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
 * Registration response
 */
export interface IRegistrationResponse {
  success: boolean;
  message: string;
  data: ICustomerWithRoles;
}
