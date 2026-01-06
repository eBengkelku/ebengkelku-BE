#!/usr/bin/env node

/**
 * Simple test script to validate pagination implementation
 * Run this after starting the NestJS server to test the pagination endpoints
 */

const BASE_URL = 'http://localhost:3000';

async function testPaginationEndpoint(endpoint, description) {
  try {
    console.log(`\n🧪 Testing: ${description}`);
    console.log(`📡 URL: ${BASE_URL}${endpoint}`);

    const response = await fetch(`${BASE_URL}${endpoint}`, {
      headers: {
        Authorization: 'Bearer YOUR_JWT_TOKEN_HERE', // Replace with actual token
        'x-lang': 'en',
      },
    });

    if (!response.ok) {
      console.log(`❌ Failed: ${response.status} ${response.statusText}`);
      return;
    }

    const data = await response.json();

    console.log(`✅ Success: ${response.status}`);
    console.log(`📊 Results: ${data.data?.length || 0} items`);

    if (data.pagination) {
      console.log(`📄 Pagination:`, {
        currentPage: data.pagination.currentPage,
        totalPages: data.pagination.totalPages,
        totalItems: data.pagination.totalItems,
        hasNext: data.pagination.hasNext,
        hasPrevious: data.pagination.hasPrevious,
      });
    }

    console.log(`💬 Message: ${data.message}`);
  } catch (error) {
    console.log(`❌ Error: ${error.message}`);
  }
}

async function runPaginationTests() {
  console.log('🚀 Starting Pagination API Tests');
  console.log('=====================================');

  // Test cases
  const testCases = [
    {
      endpoint: '/products',
      description: 'Default pagination (page 1, limit 10)',
    },
    {
      endpoint: '/products?page=1&limit=5',
      description: 'Custom limit (5 items per page)',
    },
    {
      endpoint: '/products?page=2&limit=3',
      description: 'Second page with 3 items',
    },
    {
      endpoint: '/products?sortBy=name&sortOrder=ASC',
      description: 'Sort by name ascending',
    },
    {
      endpoint: '/products?sortBy=price&sortOrder=DESC&limit=5',
      description: 'Sort by price descending',
    },
    {
      endpoint: '/products?search=product',
      description: 'Search for "product" in name/description',
    },
    {
      endpoint: '/products?category=electronics',
      description: 'Filter by electronics category',
    },
    {
      endpoint:
        '/products?search=test&category=electronics&sortBy=price&sortOrder=ASC&page=1&limit=5',
      description: 'Combined filters (search + category + sort + pagination)',
    },
    {
      endpoint: '/products?page=999&limit=10',
      description: 'Test pagination beyond available pages',
    },
    {
      endpoint: '/products?limit=1',
      description: 'Minimum limit (1 item per page)',
    },
  ];

  for (const testCase of testCases) {
    await testPaginationEndpoint(testCase.endpoint, testCase.description);
    await new Promise((resolve) => setTimeout(resolve, 500)); // Small delay between tests
  }

  console.log('\n🏁 Pagination tests completed!');
  console.log('\n📝 Notes:');
  console.log('- Make sure your server is running on http://localhost:3000');
  console.log(
    '- Update the JWT token in the script for authenticated requests',
  );
  console.log('- Add some test data to your products table for better results');
}

// Validation tests for query parameters
function validateQueryParameterSchema() {
  console.log('\n🔍 Query Parameter Validation Schema:');
  console.log('=====================================');

  const schema = {
    page: {
      type: 'number',
      minimum: 1,
      default: 1,
      description: 'Page number',
    },
    limit: {
      type: 'number',
      minimum: 1,
      maximum: 100,
      default: 10,
      description: 'Items per page',
    },
    sortBy: {
      type: 'string',
      default: 'id',
      description: 'Field to sort by',
    },
    sortOrder: {
      type: 'string',
      enum: ['ASC', 'DESC'],
      default: 'DESC',
      description: 'Sort direction',
    },
    search: {
      type: 'string',
      optional: true,
      description: 'Search in name and description',
    },
    category: {
      type: 'string',
      optional: true,
      description: 'Filter by category',
    },
  };

  console.log(JSON.stringify(schema, null, 2));
}

// Sample curl commands
function printCurlExamples() {
  console.log('\n📋 Sample CURL Commands:');
  console.log('=========================');

  const examples = [
    'curl -H "Authorization: Bearer YOUR_TOKEN" "http://localhost:3000/products?page=1&limit=5"',
    'curl -H "Authorization: Bearer YOUR_TOKEN" "http://localhost:3000/products?search=laptop&category=electronics"',
    'curl -H "Authorization: Bearer YOUR_TOKEN" "http://localhost:3000/products?sortBy=price&sortOrder=ASC&limit=10"',
    'curl -H "Authorization: Bearer YOUR_TOKEN" -H "x-lang: id" "http://localhost:3000/products?page=2"',
  ];

  examples.forEach((example, index) => {
    console.log(`${index + 1}. ${example}`);
  });
}

// Run the tests if this script is executed directly
if (require.main === module) {
  console.log('🔧 Pagination Implementation Test Suite');
  console.log('========================================');

  validateQueryParameterSchema();
  printCurlExamples();

  // Uncomment the line below to run actual API tests
  // runPaginationTests();

  console.log(
    '\n💡 To run live API tests, uncomment the runPaginationTests() call and ensure:',
  );
  console.log('   1. Your NestJS server is running');
  console.log('   2. You have valid JWT token');
  console.log('   3. Your database has some product data');
}

module.exports = {
  testPaginationEndpoint,
  runPaginationTests,
  validateQueryParameterSchema,
  printCurlExamples,
};
