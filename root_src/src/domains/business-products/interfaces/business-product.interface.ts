/**
 * Business Product Entity Interface
 *
 * Defines the database schema structure for the product.products table.
 *
 * @interface IBusinessProduct
 * @version 1.0.0
 * @since 2026-02-12
 */
export interface IBusinessProduct {
  id: string;
  name: string;
  description?: string | null;
  price: number;
  unit: string;
  status: string;
  business_id: string;
  category_id: string;
  created_at: Date;
  updated_at?: Date | null;
  deleted_at?: Date | null;
  id_creator?: string | null;
  id_updater?: string | null;
}

/**
 * Business Product creation interface
 */
export interface IBusinessProductCreate {
  id: string;
  name: string;
  description?: string | null;
  price: number;
  unit: string;
  status: string;
  business_id: string;
  category_id: string;
  id_creator: string;
  created_at: Date;
}

/**
 * Business Product with category info (from LEFT JOIN)
 */
export interface IBusinessProductWithCategory extends IBusinessProduct {
  category?: {
    id: string;
    name: string;
  } | null;
}
