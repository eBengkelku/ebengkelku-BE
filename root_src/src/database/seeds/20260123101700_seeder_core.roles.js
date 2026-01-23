/**
 * Seeder: core.roles
 *
 * Seeds the base roles for E-Bengkelku workshop management system.
 * Roles: Owner, Customer, Admin
 *
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.seed = async function (knex) {
  const roles = [
    {
      key: 'owner',
      name: 'Owner',
      description:
        'Workshop owner, can manage the workshop, manage master data (products, services, employees), access the analytics dashboard (sales reports, stock reports, operations, etc.).',
    },
    {
      key: 'customer',
      name: 'Customer',
      description:
        'Can order workshop products, book workshop services, rate/review workshops, find the nearest workshop.',
    },
    {
      key: 'admin',
      name: 'Admin',
      description:
        'System administrator with all permissions for full system access.',
    },
  ];

  // Insert roles with ON CONFLICT handling for idempotency
  for (const role of roles) {
    await knex.raw(
      `
      INSERT INTO core.roles (key, name, description, created_at)
      VALUES (?, ?, ?, NOW())
      ON CONFLICT (key) DO UPDATE SET
        name = EXCLUDED.name,
        description = EXCLUDED.description,
        updated_at = NOW()
    `,
      [role.key, role.name, role.description],
    );
  }

  console.log(`[Seeder] core.roles: ${roles.length} roles seeded successfully`);
};
