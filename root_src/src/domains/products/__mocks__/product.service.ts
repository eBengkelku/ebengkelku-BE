/**
 * Mock implementation of ProductService
 * Jest will automatically use this when jest.mock() is called
 */

export const ProductService = jest.fn().mockImplementation(() => ({
  // Mock all methods with default implementations
  create: jest.fn().mockResolvedValue({
    success: true,
    message: 'Product created successfully',
    data: {
      id: 'mock-id-123',
      name: 'Mock Product',
      price: 99.99,
      stock_quantity: 100,
      category: 'Mock Category',
      created_at: new Date(),
      updated_at: new Date(),
    },
  }),

  findAll: jest.fn().mockResolvedValue({
    success: true,
    message: 'Products retrieved successfully',
    data: [
      {
        id: 'mock-id-1',
        name: 'Mock Product 1',
        price: 99.99,
        stock_quantity: 100,
      },
      {
        id: 'mock-id-2',
        name: 'Mock Product 2',
        price: 149.99,
        stock_quantity: 50,
      },
    ],
    meta: {
      current_page: 1,
      per_page: 10,
      total: 2,
      last_page: 1,
    },
  }),

  findById: jest.fn().mockResolvedValue({
    success: true,
    message: 'Product retrieved successfully',
    data: {
      id: 'mock-id-123',
      name: 'Mock Product',
      price: 99.99,
      stock_quantity: 100,
      category: 'Mock Category',
    },
  }),

  update: jest.fn().mockResolvedValue({
    success: true,
    message: 'Product updated successfully',
    data: {
      id: 'mock-id-123',
      name: 'Updated Mock Product',
      price: 149.99,
      stock_quantity: 75,
    },
  }),

  delete: jest.fn().mockResolvedValue({
    success: true,
    message: 'Product deleted successfully',
  }),

  createWithFile: jest.fn().mockResolvedValue({
    success: true,
    message: 'Product created with file successfully',
    data: {
      id: 'mock-id-123',
      name: 'Mock Product with Image',
      price: 99.99,
      file_path: '/mock/path/image.jpg',
      image_original_name: 'mock-image.jpg',
    },
  }),
}));

export default ProductService;
