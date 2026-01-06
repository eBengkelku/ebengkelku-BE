/**
 * Mock implementation of DatabaseService
 * Simulates database operations without actual database calls
 */

export const DatabaseService = jest.fn().mockImplementation(() => ({
  getKnex: jest.fn().mockReturnValue({
    // Mock Knex query builder
    select: jest.fn().mockReturnThis(),
    from: jest.fn().mockReturnThis(),
    where: jest.fn().mockReturnThis(),
    whereIn: jest.fn().mockReturnThis(),
    orderBy: jest.fn().mockReturnThis(),
    limit: jest.fn().mockReturnThis(),
    offset: jest.fn().mockReturnThis(),
    insert: jest.fn().mockResolvedValue([{ id: 'new-mock-id' }]),
    update: jest.fn().mockResolvedValue(1),
    del: jest.fn().mockResolvedValue(1),
    first: jest.fn().mockResolvedValue({
      id: 'mock-id',
      name: 'Mock Product',
      price: 99.99,
    }),
    // Mock transaction support
    transaction: jest.fn().mockImplementation((callback) => {
      const trx = {
        commit: jest.fn(),
        rollback: jest.fn(),
        select: jest.fn().mockReturnThis(),
        insert: jest.fn().mockResolvedValue([{ id: 'trx-mock-id' }]),
        update: jest.fn().mockResolvedValue(1),
        del: jest.fn().mockResolvedValue(1),
      };
      return callback(trx);
    }),
  }),

  // Mock connection health check
  checkConnection: jest.fn().mockResolvedValue(true),

  // Mock migration methods
  runMigrations: jest.fn().mockResolvedValue('Migrations completed'),
}));

export default DatabaseService;
