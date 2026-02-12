/**
 * Tool Product Entity Interface
 *
 * Defines the database schema structure for the product.tool_products table.
 * Uses product_id as PK (1:1 relationship with product.products).
 *
 * @interface IToolProduct
 * @version 1.0.0
 * @since 2026-02-12
 */
export interface IToolProduct {
  product_id: string;
  warranty_months: number;
  updated_at?: Date | null;
  deleted_at?: Date | null;
  id_creator?: string | null;
  id_updater?: string | null;
}

/**
 * Tool Product creation interface
 */
export interface IToolProductCreate {
  product_id: string;
  warranty_months: number;
  id_creator: string;
}

/**
 * Tool Product with base product info (from LEFT JOIN)
 */
export interface IToolProductWithBaseProduct extends IToolProduct {
  product?: {
    id: string;
    name: string;
    description?: string | null;
    price: number;
    unit: string;
    status: string;
    business_id: string;
    category_id: string;
  } | null;
}
