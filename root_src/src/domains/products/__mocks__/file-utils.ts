/**
 * Mock implementation for file upload utilities
 * Simulates multer and file system operations
 */

export const multer = {
  diskStorage: jest.fn().mockReturnValue({
    destination: jest.fn((_req, _file, cb) => cb(null, '/mock/uploads')),
    filename: jest.fn((_req, file, cb) =>
      cb(null, `mock-${Date.now()}-${file.originalname}`),
    ),
  }),

  memoryStorage: jest.fn().mockReturnValue({}),

  // Mock multer middleware
  single: jest.fn().mockReturnValue((req: any, _res: any, next: any) => {
    req.file = {
      fieldname: 'image',
      originalname: 'mock-image.jpg',
      encoding: '7bit',
      mimetype: 'image/jpeg',
      size: 1024000,
      destination: '/mock/uploads',
      filename: 'mock-1234567890-image.jpg',
      path: '/mock/uploads/mock-1234567890-image.jpg',
      buffer: Buffer.from('mock-file-content'),
    };
    next();
  }),
};

// Mock fs operations
export const fs = {
  promises: {
    access: jest.fn().mockResolvedValue(undefined),
    unlink: jest.fn().mockResolvedValue(undefined),
    mkdir: jest.fn().mockResolvedValue(undefined),
    readFile: jest.fn().mockResolvedValue(Buffer.from('mock-file-content')),
    writeFile: jest.fn().mockResolvedValue(undefined),
  },

  existsSync: jest.fn().mockReturnValue(true),
  createReadStream: jest.fn().mockReturnValue({
    pipe: jest.fn(),
    on: jest.fn(),
  }),
};

// Mock path operations
export const path = {
  join: jest.fn((...args) => args.join('/')),
  extname: jest.fn((_filename) => '.jpg'),
  basename: jest.fn((_filename) => 'mock-image.jpg'),
};
