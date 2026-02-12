/**
 * Spare Part Product Entity Interface
 *
 * Defines the database schema structure for the product.spare_part_products table.
 * Uses product_id as PK (1:1 relationship with product.products).
 *
 * @interface ISparePartProduct
 * @version 1.0.0
 * @since 2026-02-12
 */
export interface ISparePartProduct {
  product_id: string;
  brand?: string | null;
  grade?: string | null; // 'genuine' | 'aftermarket'
  updated_at?: Date | null;
  deleted_at?: Date | null;
  id_creator?: string | null;
  id_updater?: string | null;
}

/**
 * Spare Part Product creation interface
 */
export interface ISparePartProductCreate {
  product_id: string;
  brand?: string | null;
  grade?: string | null;
  id_creator: string;
}

/**
 * Spare Part Product with base product info (from LEFT JOIN)
 */
export interface ISparePartProductWithBaseProduct extends ISparePartProduct {
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
