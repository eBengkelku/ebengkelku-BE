import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { I18nValidationPipe } from 'nestjs-i18n';
import { Logger } from 'nestjs-pino';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    bufferLogs: true,
    snapshot: true,
  });
  const logger = app.get(Logger);
  app.useLogger(logger);

  // Multer configuration handled by FileInterceptor in controllers
  // app.use(multer().any()); // Commented  out to avoid conflicts with FileInterceptor
  // Enable i18n validation pipes globally
  app.useGlobalPipes(
    new I18nValidationPipe({
      transform: true, // Automatically transforms request data to DTO instances
      whitelist: true, // Strips properties that are not defined in the DTO
      forbidNonWhitelisted: true, // Throws an error if non-whitelisted properties are present
    }),
  );

  // Note: Global interceptors and filters are registered in common.module.ts
  // using APP_INTERCEPTOR and APP_FILTER tokens for proper dependency injection

  // Setup Swagger API Documentation
  const config = new DocumentBuilder()
    .setTitle('Auto-CRUD API')
    .setDescription(
      'Laravel-inspired Auto-CRUD system with NestJS - Complete API documentation for all endpoints including standard CRUD operations, custom business logic, and utility endpoints',
    )
    .setVersion('1.0')
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        name: 'JWT',
        description: 'Enter JWT token',
        in: 'header',
      },
      'JWT-auth',
    )
    .addTag('products', 'Product management endpoints')
    .addTag('categories', 'Category management endpoints')
    .addTag('tags', 'Tag management endpoints')
    .addTag('Auth', 'Authentication endpoints')
    .addServer('http://localhost:3004', 'Development server')
    .addServer('http://my.upnvj-api.local', 'Local Domain server')
    .build();

  const document = SwaggerModule.createDocument(app, config);

  // Fix for multipart/form-data display in Swagger UI
  if (
    document.paths &&
    document.paths['/v1/products'] &&
    document.paths['/v1/products']['post']
  ) {
    const postEndpoint = document.paths['/v1/products']['post'];

    // Add x-lang header parameter
    if (!postEndpoint.parameters) postEndpoint.parameters = [];

    postEndpoint.requestBody = {
      required: true,
      content: {
        'multipart/form-data': {
          schema: {
            type: 'object',
            properties: {
              name: {
                type: 'string',
                description: 'Product name',
                example: 'iPhone 15 Pro',
              },
              description: {
                type: 'string',
                description: 'Product description (optional)',
                example: 'Latest iPhone with advanced camera',
              },
              price: {
                type: 'number',
                description: 'Product price',
                example: 1199.99,
                minimum: 0,
              },
              stock_quantity: {
                type: 'number',
                description: 'Stock quantity',
                example: 50,
                minimum: 0,
              },
              category: {
                type: 'string',
                description: 'Product category (optional)',
                example: 'Electronics',
              },
              image: {
                type: 'string',
                format: 'binary',
                description: 'Product image file (REQUIRED)',
              },
            },
            required: ['name', 'price', 'stock_quantity', 'image'],
          },
        },
      },
    };
  }

  // Fix for PUT /v1/products/{id} multipart/form-data display
  if (
    document.paths &&
    document.paths['/v1/products/{id}'] &&
    document.paths['/v1/products/{id}']['put']
  ) {
    const putEndpoint = document.paths['/v1/products/{id}']['put'];

    putEndpoint.requestBody = {
      required: true,
      content: {
        'multipart/form-data': {
          schema: {
            type: 'object',
            properties: {
              name: {
                type: 'string',
                description: 'Product name (optional)',
                example: 'iPhone 15 Pro Updated',
              },
              description: {
                type: 'string',
                description: 'Product description (optional)',
                example: 'Updated iPhone with enhanced features',
              },
              price: {
                type: 'number',
                description: 'Product price (optional)',
                example: 1299.99,
                minimum: 0,
              },
              stock_quantity: {
                type: 'number',
                description: 'Stock quantity (optional)',
                example: 45,
                minimum: 0,
              },
              category: {
                type: 'string',
                description: 'Product category (optional)',
                example: 'Electronics',
              },
              image: {
                type: 'string',
                format: 'binary',
                description:
                  'Product image file (optional - replaces existing image)',
              },
            },
            required: [],
          },
        },
      },
    };
  }

  // Fix for GET /v1/products query parameters display
  if (
    document.paths &&
    document.paths['/v1/products'] &&
    document.paths['/v1/products']['get']
  ) {
    const getEndpoint = document.paths['/v1/products']['get'];

    // Ensure query parameters are properly defined
    getEndpoint.parameters = [
      {
        name: 'page',
        in: 'query',
        required: false,
        description: 'Page number for pagination',
        schema: {
          type: 'integer',
          minimum: 1,
          default: 1,
          example: 1,
        },
      },
      {
        name: 'limit',
        in: 'query',
        required: false,
        description: 'Number of items per page',
        schema: {
          type: 'integer',
          minimum: 1,
          maximum: 100,
          default: 10,
          example: 10,
        },
      },
      {
        name: 'category',
        in: 'query',
        required: false,
        description: 'Filter products by category (exact match)',
        schema: {
          type: 'string',
          example: 'Electronics',
        },
      },
      {
        name: 'name',
        in: 'query',
        required: false,
        description:
          'Search products by name (partial match, case-insensitive)',
        schema: {
          type: 'string',
          example: 'iPhone',
        },
      },
      {
        name: 'minPrice',
        in: 'query',
        required: false,
        description: 'Minimum price filter (inclusive)',
        schema: {
          type: 'number',
          minimum: 0,
          example: 100.0,
        },
      },
      {
        name: 'maxPrice',
        in: 'query',
        required: false,
        description: 'Maximum price filter (inclusive)',
        schema: {
          type: 'number',
          minimum: 0,
          example: 2000.0,
        },
      },
      {
        name: 'x-lang',
        in: 'header',
        required: false,
        description: 'Language preference (en or id)',
        schema: {
          type: 'string',
          enum: ['en', 'id'],
          default: 'en',
          example: 'en',
        },
      },
    ];
  }

  SwaggerModule.setup('api-docs', app, document, {
    customSiteTitle: 'Auto-CRUD API Documentation',
    customfavIcon: 'https://nestjs.com/img/logo_text.svg',
    customCss: `
      .topbar-wrapper .link {
        content: url('https://nestjs.com/img/logo_text.svg');
        width: 120px;
        height: auto;
      }
      .swagger-ui .topbar { background-color: #e10e49; }
    `,
    swaggerOptions: {
      persistAuthorization: true,
      displayRequestDuration: true,
      filter: true,
      showExtensions: true,
      showCommonExtensions: true,
    },
  });

  await app.listen(process.env.PORT ?? 3004);
  logger.log(
    `🚀 Application is running on: http://localhost:${process.env.PORT ?? 3004}`,
  );
  logger.log(
    `📚 Swagger API Documentation available at: http://localhost:${
      process.env.PORT ?? 3004
    }/api-docs`,
  );
}

void bootstrap();
