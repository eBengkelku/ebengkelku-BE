/**
 * Inventory Entity Interface
 *
 * Defines the database schema structure for the product.inventories table.
 * Has its own UUID PK with 1:1 relationship to product.products via product_id.
 *
 * @interface IInventory
 * @version 1.0.0
 * @since 2026-02-12
 */
export interface IInventory {
  id: string;
  product_id: string;
  quantity: number;
  min_stock: number;
  updated_at?: Date | null;
  deleted_at?: Date | null;
  id_creator?: string | null;
  id_updater?: string | null;
}

/**
 * Inventory creation interface
 */
export interface IInventoryCreate {
  id: string;
  product_id: string;
  quantity: number;
  min_stock: number;
  id_creator: string;
}

/**
 * Inventory with base product info (from LEFT JOIN)
 */
export interface IInventoryWithProduct extends IInventory {
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
