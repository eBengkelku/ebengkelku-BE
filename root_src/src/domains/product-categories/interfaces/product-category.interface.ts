/**
 * Product Category Entity Interface
 *
 * Defines the database schema structure for the product.product_categories table.
 *
 * @interface IProductCategory
 * @version 1.0.0
 * @since 2026-02-12
 */
export interface IProductCategory {
  id: string;
  name: string;
  description?: string | null;
  product_type_id: string;
  created_at: Date;
  updated_at?: Date | null;
  deleted_at?: Date | null;
  id_creator?: string | null;
  id_updater?: string | null;
}

/**
 * Product Category creation interface
 */
export interface IProductCategoryCreate {
  id: string;
  name: string;
  description?: string | null;
  product_type_id: string;
  id_creator: string;
  created_at: Date;
}

/**
 * Product Category with type info (from LEFT JOIN)
 */
export interface IProductCategoryWithType extends IProductCategory {
  product_type?: {
    id: string;
    name: string;
  } | null;
}
