/**
 * Product Type Entity Interface
 *
 * Defines the database schema structure for the product.product_types table.
 *
 * @interface IProductType
 * @version 1.0.0
 * @since 2026-02-12
 */
export interface IProductType {
  id: string;
  name: string;
  created_at: Date;
  updated_at?: Date | null;
  deleted_at?: Date | null;
  id_creator?: string | null;
  id_updater?: string | null;
}

/**
 * Product Type creation interface
 */
export interface IProductTypeCreate {
  id: string;
  name: string;
  id_creator: string;
  created_at: Date;
}
