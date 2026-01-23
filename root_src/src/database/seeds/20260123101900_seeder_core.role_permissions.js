/**
 * Seeder: core.role_permissions
 *
 * Seeds the role-permission mappings for E-Bengkelku workshop management system.
 *
 * Mappings:
 * - Owner: Workshop management, Products CRUD, Services CRUD, Employees CRUD, Analytics
 * - Customer: Orders, Bookings, Reviews, Workshop Search
 * - Admin: ALL permissions
 *
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.seed = async function (knex) {
  // Define role-permission mappings using permission keys
  const rolePermissionMappings = {
    owner: [
      // Workshop Management
      'workshop.manage',
      // Products CRUD
      'product.create',
      'product.read',
      'product.update',
      'product.delete',
      // Services CRUD
      'service.create',
      'service.read',
      'service.update',
      'service.delete',
      // Employees CRUD
      'employee.create',
      'employee.read',
      'employee.update',
      'employee.delete',
      // Analytics
      'analytics.sales',
      'analytics.stock',
      'analytics.operations',
    ],
    customer: [
      // Customer Operations
      'order.create',
      'order.read',
      'booking.create',
      'booking.read',
      'review.create',
      'review.read',
      'workshop.find',
    ],
    admin: [], // Will be populated with ALL permissions
  };

  // Fetch all roles
  const roles = await knex('core.roles').select('id', 'key');
  const roleMap = {};
  for (const role of roles) {
    roleMap[role.key] = role.id;
  }

  // Fetch all permissions
  const permissions = await knex('core.permissions').select('id', 'key');
  const permissionMap = {};
  for (const permission of permissions) {
    permissionMap[permission.key] = permission.id;
  }

  // Admin gets ALL permissions
  rolePermissionMappings.admin = Object.keys(permissionMap);

  let insertedCount = 0;

  // Insert role-permission mappings
  for (const [roleKey, permissionKeys] of Object.entries(
    rolePermissionMappings,
  )) {
    const roleId = roleMap[roleKey];

    if (!roleId) {
      console.warn(
        `[Seeder] Warning: Role '${roleKey}' not found, skipping...`,
      );
      continue;
    }

    for (const permissionKey of permissionKeys) {
      const permissionId = permissionMap[permissionKey];

      if (!permissionId) {
        console.warn(
          `[Seeder] Warning: Permission '${permissionKey}' not found, skipping...`,
        );
        continue;
      }

      // Insert with ON CONFLICT DO NOTHING for idempotency
      await knex.raw(
        `
        INSERT INTO core.role_permissions (role_id, permission_id, created_at)
        VALUES (?, ?, NOW())
        ON CONFLICT (role_id, permission_id) DO NOTHING
      `,
        [roleId, permissionId],
      );

      insertedCount++;
    }
  }

  console.log(
    `[Seeder] core.role_permissions: ${insertedCount} mappings processed successfully`,
  );
  console.log(`[Seeder] Role mappings:`);
  console.log(`  - Owner: ${rolePermissionMappings.owner.length} permissions`);
  console.log(
    `  - Customer: ${rolePermissionMappings.customer.length} permissions`,
  );
  console.log(
    `  - Admin: ${rolePermissionMappings.admin.length} permissions (ALL)`,
  );
};
