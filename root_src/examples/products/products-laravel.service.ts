import { Injectable } from '@nestjs/common';
import { I18nService } from 'nestjs-i18n';
import { DatabaseService } from '../../src/database/database.service';

import {
  BaseKnexService,
  BaseKnexServiceConfig,
} from '../../src/common/services/base-knex.service';
import { ProductDto } from '../../src/domains/products/dto/product.dto';

@Injectable()
export class ProductsEnhancedService extends BaseKnexService<ProductDto> {
  constructor(
    protected readonly databaseService: DatabaseService,
    protected readonly i18n: I18nService,
  ) {
    const config: BaseKnexServiceConfig = {
      tableName: 'products',
      primaryKey: 'id',
      timestampColumns: {
        created: 'created_at',
        updated: 'updated_at',
        deleted: 'deleted_at', // Enable soft deletes
      },
      descColumns: ['name', 'category'], // Used for combo/dropdown descriptions
      fillable: ['name', 'description', 'price', 'stock_quantity', 'category'],
      rules: {
        name: { required: true, type: 'string', maxLength: 255 },
        description: { required: false, type: 'string' },
        price: { required: true, type: 'number', min: 0 },
        stock_quantity: { required: true, type: 'number', min: 0 },
        category: { required: false, type: 'string', maxLength: 100 },
      },
      hasFiles: false,
      multipleFiles: false,
    };

    super(databaseService, i18n, config);
  }

  // Override baseListQuery for any custom joins or selections
  protected baseListQuery() {
    return super.baseListQuery().select([
      'products.*',
      // You can add calculated fields or joins here
      // For example: this.knex.raw('(products.price * products.stock_quantity) as total_value')
    ]);
  }

  // Custom business logic - equivalent to Laravel's doAfterInsert
  protected async afterCreate(product: ProductDto): Promise<void> {
    // Custom logic after product creation
    // For example: update search index, send notifications, etc.
    console.log(`Product created: ${product.name}`);

    // Example: Auto-categorize if no category provided
    if (!product.category && product.name) {
      await this.autoCategorizeProduct(product);
    }
  }

  // Custom business logic - equivalent to Laravel's doAfterUpdate
  protected async afterUpdate(product: ProductDto): Promise<void> {
    // Custom logic after product update
    console.log(`Product updated: ${product.name}`);

    // Example: Clear cache, update related records, etc.
  }

  // Custom business logic - equivalent to Laravel's doBeforeDelete
  protected async beforeDelete(product: ProductDto): Promise<void> {
    // Check if product can be deleted
    // For example: check if product has pending orders
    if (product.id) {
      const hasOrders = await this.checkProductHasOrders(product.id);
      if (hasOrders) {
        throw new Error('Cannot delete product with pending orders');
      }
    }
  }

  // Product-specific methods (equivalent to custom methods in Laravel models)
  async findByCategory(
    category: string,
    pagination: { page?: number; limit?: number },
    lang?: string,
  ) {
    const searchDto = {
      filters: [['category', 'like', category]] as [string, string, any][],
    };
    return this.search(searchDto, pagination, lang);
  }

  async findLowStock(threshold: number = 10, lang?: string) {
    const searchDto = {
      filters: [['stock_quantity', '<', threshold]] as [string, string, any][],
      sort: [['stock_quantity', 'asc']] as [string, 'asc' | 'desc'][],
    };
    return this.search(searchDto, { page: 1, limit: 100 }, lang);
  }

  async updateStock(
    productId: string,
    quantity: number,
    operation: 'add' | 'subtract',
    lang?: string,
  ) {
    const product = await this.findOne(productId, lang);

    let newQuantity: number;
    if (operation === 'add') {
      newQuantity = product.stock_quantity + quantity;
    } else {
      newQuantity = Math.max(0, product.stock_quantity - quantity);
    }

    return this.update(
      productId,
      { stock_quantity: newQuantity },
      undefined,
      lang,
    );
  }

  async getTopSellingProducts(limit: number = 10, lang?: string) {
    // This would require additional tables (orders, order_items)
    // For now, return products ordered by some criteria
    const searchDto = {
      sort: [['created_at', 'desc']] as [string, 'asc' | 'desc'][],
    };
    return this.search(searchDto, { page: 1, limit }, lang);
  }

  // Private helper methods
  private async autoCategorizeProduct(product: ProductDto): Promise<void> {
    // Simple auto-categorization logic
    const name = product.name?.toLowerCase() || '';
    let category = 'General';

    if (
      name.includes('electronic') ||
      name.includes('phone') ||
      name.includes('computer')
    ) {
      category = 'Electronics';
    } else if (name.includes('book') || name.includes('magazine')) {
      category = 'Books';
    } else if (
      name.includes('cloth') ||
      name.includes('shirt') ||
      name.includes('dress')
    ) {
      category = 'Clothing';
    }

    if (category !== 'General' && product.id) {
      await this.update(product.id, { category });
    }
  }

  private async checkProductHasOrders(_productId: string): Promise<boolean> {
    // This would check if product has pending orders
    // For now, return false (no orders)
    return false;
  }

  // Override combo method for custom product combo display
  async getCombo(
    keyword?: string,
    _lang?: string,
  ): Promise<Array<{ id: any; text: string }>> {
    let query = this.knex(this.config.tableName).select([
      'id',
      'name',
      'category',
      'price',
      'stock_quantity',
    ]);

    // Apply soft delete check
    if (this.config.timestampColumns.deleted) {
      query = query.whereNull(this.config.timestampColumns.deleted);
    }

    if (keyword) {
      query = query.where((builder: any) => {
        builder
          .where('name', 'ilike', `%${keyword}%`)
          .orWhere('category', 'ilike', `%${keyword}%`);
      });
    }

    const results = await query.limit(50);

    return results.map((item: any) => ({
      id: item.id,
      text: `${item.name} (${item.category || 'No Category'}) - $${item.price} - Stock: ${item.stock_quantity}`,
    }));
  }
}
