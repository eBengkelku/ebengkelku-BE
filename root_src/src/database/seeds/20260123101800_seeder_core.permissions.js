/**
 * Seeder: core.permissions
 *
 * Seeds the base permissions for E-Bengkelku workshop management system.
 * Permissions are organized by category:
 * - Workshop Management
 * - Products (CRUD)
 * - Services (CRUD)
 * - Employees (CRUD)
 * - Analytics (Sales, Stock, Operations)
 * - Customer Operations (Orders, Bookings, Reviews, Workshop Search)
 * - Admin Operations (Users, Roles, Permissions, System Settings)
 *
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.seed = async function (knex) {
  const permissions = [
    // Workshop Management
    {
      key: 'workshop.manage',
      name: 'Manage Workshop',
      description:
        'Full workshop management access including settings and configuration.',
    },

    // Products CRUD
    {
      key: 'product.create',
      name: 'Create Product',
      description: 'Create new products in the inventory.',
    },
    {
      key: 'product.read',
      name: 'View Products',
      description: 'View product listings and details.',
    },
    {
      key: 'product.update',
      name: 'Update Product',
      description: 'Edit existing product information.',
    },
    {
      key: 'product.delete',
      name: 'Delete Product',
      description: 'Remove products from the inventory.',
    },

    // Services CRUD
    {
      key: 'service.create',
      name: 'Create Service',
      description: 'Create new services offered by the workshop.',
    },
    {
      key: 'service.read',
      name: 'View Services',
      description: 'View service listings and details.',
    },
    {
      key: 'service.update',
      name: 'Update Service',
      description: 'Edit existing service information.',
    },
    {
      key: 'service.delete',
      name: 'Delete Service',
      description: 'Remove services from the workshop offerings.',
    },

    // Employees CRUD
    {
      key: 'employee.create',
      name: 'Create Employee',
      description: 'Add new employees to the workshop.',
    },
    {
      key: 'employee.read',
      name: 'View Employees',
      description: 'View employee listings and profiles.',
    },
    {
      key: 'employee.update',
      name: 'Update Employee',
      description: 'Edit existing employee data.',
    },
    {
      key: 'employee.delete',
      name: 'Delete Employee',
      description: 'Remove employees from the workshop.',
    },

    // Analytics
    {
      key: 'analytics.sales',
      name: 'View Sales Analytics',
      description: 'Access sales reports and revenue analytics.',
    },
    {
      key: 'analytics.stock',
      name: 'View Stock Analytics',
      description: 'Access stock reports and inventory analytics.',
    },
    {
      key: 'analytics.operations',
      name: 'View Operations Analytics',
      description: 'Access operations dashboard and performance metrics.',
    },

    // Customer Operations
    {
      key: 'order.create',
      name: 'Create Order',
      description: 'Place product orders from the workshop.',
    },
    {
      key: 'order.read',
      name: 'View Orders',
      description: 'View order history and details.',
    },
    {
      key: 'booking.create',
      name: 'Create Booking',
      description: 'Book workshop services.',
    },
    {
      key: 'booking.read',
      name: 'View Bookings',
      description: 'View booking history and details.',
    },
    {
      key: 'review.create',
      name: 'Create Review',
      description: 'Rate and review workshops.',
    },
    {
      key: 'review.read',
      name: 'View Reviews',
      description: 'View workshop reviews and ratings.',
    },
    {
      key: 'workshop.find',
      name: 'Find Workshop',
      description: 'Search for nearest workshops based on location.',
    },

    // Admin Operations
    {
      key: 'user.manage',
      name: 'Manage Users',
      description:
        'Full user management access including create, update, and delete.',
    },
    {
      key: 'role.manage',
      name: 'Manage Roles',
      description:
        'Full role management access including create, update, and delete.',
    },
    {
      key: 'permission.manage',
      name: 'Manage Permissions',
      description:
        'Full permission management access including create, update, and delete.',
    },
    {
      key: 'system.settings',
      name: 'System Settings',
      description: 'Access and modify system configuration and settings.',
    },
  ];

  // Insert permissions with ON CONFLICT handling for idempotency
  for (const permission of permissions) {
    await knex.raw(
      `
      INSERT INTO core.permissions (key, name, description, created_at)
      VALUES (?, ?, ?, NOW())
      ON CONFLICT (key) DO UPDATE SET
        name = EXCLUDED.name,
        description = EXCLUDED.description,
        updated_at = NOW()
    `,
      [permission.key, permission.name, permission.description],
    );
  }

  console.log(
    `[Seeder] core.permissions: ${permissions.length} permissions seeded successfully`,
  );
};
