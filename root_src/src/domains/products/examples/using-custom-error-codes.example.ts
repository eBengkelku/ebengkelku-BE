/**
 * Examples: Using Domain-Specific Error Codes
 *
 * This file demonstrates how to use custom domain error codes
 * in different scenarios within the Product domain.
 *
 * @module ProductErrorCodeExamples
 * @version 1.0.0
 * @since 2025-10-10
 */

import { ValidationException } from '@/common/exceptions';
import { ProductErrorCodes } from '../errors';
import { HttpStatus } from '@nestjs/common';

/**
 * Example 1: Using Custom Error Code in Validation Exception
 *
 * This is the most common way to use domain-specific error codes.
 */
export class ProductStockValidator {
  /**
   * Validate if product has sufficient stock
   */
  validateStock(availableStock: number, requestedQuantity: number): void {
    if (availableStock === 0) {
      // Using custom error code for out of stock
      throw new ValidationException(
        'Product is out of stock',
        [
          {
            code: ProductErrorCodes.OUT_OF_STOCK,
            message: 'This product is currently out of stock',
            context: {
              availableStock: 0,
              requestedQuantity,
            },
          },
        ],
        'product.validation.out_of_stock', // i18n key
      );
    }

    if (availableStock < requestedQuantity) {
      // Using custom error code for insufficient stock
      throw new ValidationException(
        'Insufficient stock',
        [
          {
            code: ProductErrorCodes.INSUFFICIENT_STOCK,
            message: `Only ${availableStock} items available, but ${requestedQuantity} requested`,
            context: {
              availableStock,
              requestedQuantity,
              shortfall: requestedQuantity - availableStock,
            },
          },
        ],
        'product.validation.insufficient_stock',
      );
    }
  }
}

/**
 * Example 2: Using Custom Error Code with BaseHttpException
 *
 * For more control over HTTP status codes.
 */
export class ProductService {
  /**
   * Check if SKU already exists
   */
  async validateUniqueSKU(sku: string): Promise<void> {
    const exists = await this.checkSKUExists(sku);

    if (exists) {
      throw new ValidationException(
        'SKU already exists',
        [
          {
            property: 'sku',
            value: sku,
            code: ProductErrorCodes.SKU_ALREADY_EXISTS,
            message: `Product with SKU '${sku}' already exists`,
          },
        ],
        'product.validation.sku_exists',
      );
    }
  }

  /**
   * Mock method - replace with actual implementation
   */
  private async checkSKUExists(sku: string): Promise<boolean> {
    return false; // Mock implementation
  }
}

/**
 * Example 3: Multiple Validation Errors with Different Codes
 *
 * When you need to return multiple errors at once.
 */
export class ProductValidator {
  /**
   * Validate product for publishing
   */
  validateForPublishing(product: {
    name: string;
    price: number;
    stock: number;
    images: string[];
    category: string;
  }): void {
    const errors: Array<{
      property?: string;
      value?: any;
      code: string;
      message: string;
      context?: any;
    }> = [];

    // Check price range
    if (product.price < 0.01) {
      errors.push({
        property: 'price',
        value: product.price,
        code: ProductErrorCodes.PRICE_BELOW_MINIMUM,
        message: 'Price must be at least $0.01',
        context: { minimumPrice: 0.01 },
      });
    }

    // Check stock
    if (product.stock === 0) {
      errors.push({
        property: 'stock',
        value: product.stock,
        code: ProductErrorCodes.OUT_OF_STOCK,
        message: 'Cannot publish product with zero stock',
      });
    }

    // Check images
    if (product.images.length === 0) {
      errors.push({
        property: 'images',
        code: ProductErrorCodes.IMAGE_REQUIRED,
        message: 'At least one product image is required',
      });
    }

    if (product.images.length > 10) {
      errors.push({
        property: 'images',
        value: product.images.length,
        code: ProductErrorCodes.TOO_MANY_IMAGES,
        message: 'Maximum 10 images allowed',
        context: { maxImages: 10, currentCount: product.images.length },
      });
    }

    // If any errors, throw validation exception
    if (errors.length > 0) {
      throw new ValidationException(
        'Product validation failed',
        errors,
        'product.validation.publishing_requirements',
      );
    }
  }
}

/**
 * Example 4: Using in Domain Model
 *
 * Best practice: Keep business logic in domain models.
 */
export class ProductModel {
  constructor(
    public id: string,
    public sku: string,
    public price: number,
    public stock: number,
    public status: 'draft' | 'active' | 'discontinued',
  ) {}

  /**
   * Decrease stock
   */
  decreaseStock(quantity: number): void {
    if (this.status === 'discontinued') {
      throw new ValidationException('Product is discontinued', [
        {
          code: ProductErrorCodes.DISCONTINUED,
          message: 'Cannot purchase discontinued products',
          context: {
            productId: this.id,
            sku: this.sku,
          },
        },
      ]);
    }

    if (this.stock < quantity) {
      throw new ValidationException('Insufficient stock', [
        {
          code: ProductErrorCodes.INSUFFICIENT_STOCK,
          message: `Requested ${quantity}, but only ${this.stock} available`,
          context: {
            available: this.stock,
            requested: quantity,
          },
        },
      ]);
    }

    this.stock -= quantity;
  }

  /**
   * Mark as discontinued
   */
  markAsDiscontinued(): void {
    if (this.stock > 0) {
      throw new ValidationException(
        'Cannot discontinue product with remaining stock',
        [
          {
            code: ProductErrorCodes.DISCONTINUED,
            message: 'Please clear remaining stock before discontinuing',
            context: {
              remainingStock: this.stock,
            },
          },
        ],
      );
    }

    this.status = 'discontinued';
  }
}

/**
 * Example 5: Conditional Error Codes Based on Context
 *
 * Choose different error codes based on business logic.
 */
export class OrderValidator {
  /**
   * Validate order item
   */
  validateOrderItem(
    product: { minOrderQty?: number; maxOrderQty?: number },
    quantity: number,
  ): void {
    // Check minimum order quantity
    if (product.minOrderQty && quantity < product.minOrderQty) {
      throw new ValidationException('Minimum order quantity not met', [
        {
          code: ProductErrorCodes.MINIMUM_ORDER_NOT_MET,
          message: `Minimum order quantity is ${product.minOrderQty}`,
          context: {
            minimumQuantity: product.minOrderQty,
            requestedQuantity: quantity,
          },
        },
      ]);
    }

    // Check maximum order quantity
    if (product.maxOrderQty && quantity > product.maxOrderQty) {
      throw new ValidationException('Maximum order quantity exceeded', [
        {
          code: ProductErrorCodes.MAXIMUM_ORDER_EXCEEDED,
          message: `Maximum order quantity is ${product.maxOrderQty}`,
          context: {
            maximumQuantity: product.maxOrderQty,
            requestedQuantity: quantity,
          },
        },
      ]);
    }
  }
}

/**
 * Example 6: Checking Error Codes in Exception Handlers
 *
 * How to handle specific error codes differently.
 */
export class ProductErrorHandler {
  /**
   * Handle product error and provide recovery suggestions
   */
  handleProductError(error: ValidationException): {
    canRecover: boolean;
    suggestion: string;
  } {
    // Access errors from the exception
    const errors = error.errors || [];

    // Check for specific error codes
    for (const err of errors) {
      switch (err.code) {
        case ProductErrorCodes.OUT_OF_STOCK:
          return {
            canRecover: true,
            suggestion: 'Check back later or choose a similar product',
          };

        case ProductErrorCodes.INSUFFICIENT_STOCK:
          return {
            canRecover: true,
            suggestion: `Reduce quantity to ${err.context?.availableStock || 0} or less`,
          };

        case ProductErrorCodes.SKU_ALREADY_EXISTS:
          return {
            canRecover: true,
            suggestion: 'Use a different SKU',
          };

        case ProductErrorCodes.DISCONTINUED:
          return {
            canRecover: false,
            suggestion: 'This product is no longer available',
          };

        default:
          return {
            canRecover: false,
            suggestion: 'Please contact support',
          };
      }
    }

    return {
      canRecover: false,
      suggestion: 'Unknown error occurred',
    };
  }
}

/**
 * Example 7: Frontend Integration
 *
 * How frontend can handle domain-specific error codes.
 */
export const FrontendErrorHandling = {
  /**
   * Example response from API
   */
  exampleResponse: {
    success: false,
    statusCode: 409,
    message: 'Product is out of stock',
    errors: {
      stock: {
        code: 'PRODUCT_OUT_OF_STOCK', // Custom domain error code
        message: 'This product is currently out of stock',
        value: 0,
        context: {
          availableStock: 0,
          requestedQuantity: 5,
        },
      },
    },
    timestamp: '2025-10-10T09:00:00.000Z',
    path: '/v1/products/123/purchase',
  },

  /**
   * Frontend handler
   */
  handleError: (errorResponse: any) => {
    const errors = errorResponse.errors || {};

    // Handle domain-specific errors
    for (const [field, error] of Object.entries(errors)) {
      switch ((error as any).code) {
        case 'PRODUCT_OUT_OF_STOCK':
          console.log('Show out of stock UI');
          // Show "Notify me when available" button
          break;

        case 'PRODUCT_INSUFFICIENT_STOCK':
          console.log('Adjust quantity');
          // Suggest reducing quantity
          break;

        case 'PRODUCT_DISCONTINUED':
          console.log('Show discontinued message');
          // Redirect to similar products
          break;

        default:
          console.log('Show generic error');
      }
    }
  },
};
