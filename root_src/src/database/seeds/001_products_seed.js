/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.seed = async function (knex) {
  // Deletes ALL existing entries
  await knex('products').del();

  // Inserts seed entries
  await knex('products').insert([
    {
      name: 'Laptop',
      description: 'High-performance laptop for work and gaming',
      price: 999.99,
      stock_quantity: 50,
      category: 'Electronics',
      created_at: new Date(),
      updated_at: new Date(),
    },
    {
      name: 'Wireless Mouse',
      description: 'Ergonomic wireless mouse with long battery life',
      price: 29.99,
      stock_quantity: 100,
      category: 'Electronics',
      created_at: new Date(),
      updated_at: new Date(),
    },
    {
      name: 'Office Chair',
      description: 'Comfortable office chair with lumbar support',
      price: 199.99,
      stock_quantity: 25,
      category: 'Furniture',
      created_at: new Date(),
      updated_at: new Date(),
    },
    {
      name: 'Coffee Mug',
      description: 'Ceramic coffee mug with company logo',
      price: 12.99,
      stock_quantity: 200,
      category: 'Accessories',
      created_at: new Date(),
      updated_at: new Date(),
    },
  ]);
};
