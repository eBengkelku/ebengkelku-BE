import { DynamicModule, Type, Inject, Controller } from '@nestjs/common';
import { BaseKnexService } from '../services/base-knex.service';
import { BaseKnexController } from '../controllers/base-knex.controller';
import { DatabaseModule } from '../../database/database.module';
import { DatabaseService } from '../../database/database.service';
import { I18nService } from 'nestjs-i18n';
import { AuthModule } from '../../auth/auth.module';
import { CreateProductDto } from '../../domains/products/dto/create-product.dto';
import { ProductService } from '../../domains/products/product.service';
import { ApiBearerAuth } from '@nestjs/swagger';
import 'reflect-metadata';

export interface AutoCrudOptions {
  entityName: string;
  tableName: string;
  serviceClass?: Type<BaseKnexService>;
  controllerClass?: Type<BaseKnexController>;
  dtoClass?: Type<any>; // DTO class for validation
  routePrefix?: string;
  primaryKey?: string;
  softDeletes?: boolean;
  timestampColumns?: {
    created?: string;
    updated?: string;
    deleted?: string;
  };
  descColumns?: string[];
  fillable?: string[];
  rules?: Record<string, any>;
}

/**
 * Auto-CRUD Module Generator
 * Equivalent to Laravel's dynamic route generation
 *
 * Usage:
 * AutoCrudModule.forFeature({
 *   entityName: 'Product',
 *   tableName: 'products',
 *   routePrefix: 'v1/data/products'
 * })
 */
export class AutoCrudModule {
  static forFeature(options: AutoCrudOptions): DynamicModule {
    const {
      entityName,
      tableName,
      routePrefix = `v1/${tableName}`,
      serviceClass,
      controllerClass,
    } = options;

    // Create a configuration token
    const CONFIG_TOKEN = `${entityName.toUpperCase()}_CONFIG`;

    // Create config provider
    const configProvider = {
      provide: CONFIG_TOKEN,
      useValue: {
        tableName,
        primaryKey: options.primaryKey || 'id',
        timestampColumns: {
          created: options.timestampColumns?.created || 'created_at',
          updated: options.timestampColumns?.updated || 'updated_at',
          deleted:
            options.timestampColumns?.deleted ||
            (options.softDeletes ? 'deleted_at' : undefined),
        },
        descColumns: options.descColumns || ['name'],
        fillable: options.fillable || [],
        rules: options.rules || {},
      },
    };

    // If no custom service provided, create a generic one
    const ServiceClass =
      serviceClass || this.createGenericService(options, CONFIG_TOKEN);
    const ControllerClass =
      controllerClass ||
      this.createGenericController(options, ServiceClass, routePrefix);

    return {
      module: AutoCrudModule,
      imports: [DatabaseModule, AuthModule], // Import AuthModule for JwtAuthGuard
      providers: [configProvider, ServiceClass],
      controllers: [ControllerClass],
      exports: [ServiceClass],
    };
  }

  /**
   * Generate multiple CRUD modules at once
   * Equivalent to Laravel's $models array processing
   */
  static forMultiple(optionsArray: AutoCrudOptions[]): DynamicModule[] {
    return optionsArray.map((options) => this.forFeature(options));
  }

  private static createGenericService(
    options: AutoCrudOptions,
    configToken: string,
  ) {
    const { entityName } = options;

    class GenericService extends BaseKnexService {
      constructor(
        databaseService: DatabaseService,
        i18n: I18nService,
        @Inject(configToken) config: any,
      ) {
        super(databaseService, i18n, config);
      }
    }

    // Set the service name for better debugging
    Object.defineProperty(GenericService, 'name', {
      value: `${entityName}Service`,
    });

    return GenericService;
  }

  private static createGenericController(
    options: AutoCrudOptions,
    ServiceClass: any,
    routePrefix?: string,
  ) {
    const { entityName, dtoClass } = options;

    const finalRoutePrefix = routePrefix || `v1/${options.tableName}`;

    @Controller(finalRoutePrefix) // Add @Controller decorator with route prefix
    @ApiBearerAuth('JWT-auth') // Ensure JWT token is included in Swagger requests
    class GenericController extends BaseKnexController {
      entityName: string = entityName;
      dtoClass = dtoClass; // Store DTO class for potential use

      constructor(service: BaseKnexService) {
        super(service);
      }
    }

    // Inject the specific service by reference
    Reflect.defineMetadata(
      'design:paramtypes',
      [ServiceClass],
      GenericController,
    );

    // Set the controller name and route
    Object.defineProperty(GenericController, 'name', {
      value: `${entityName}Controller`,
    });

    return GenericController;
  }
}

/**
 * Laravel-style model configuration
 * Similar to Laravel's $models array
 */
export const AUTO_CRUD_MODELS: AutoCrudOptions[] = [
  // Products domain now uses Rich Domain Model Pattern
  // See: src/domains/products/ for domain model implementation
  // {
  //   entityName: 'Product',
  //   tableName: 'products',
  //   dtoClass: CreateProductDto,
  //   serviceClass: ProductService, // ProductService no longer extends BaseKnexService
  //   descColumns: ['name', 'description'],
  //   fillable: [
  //     'name',
  //     'description',
  //     'price',
  //     'category',
  //     'stock_quantity',
  //     'file_id',
  //   ],
  //   softDeletes: true,
  //   rules: {
  //     name: 'required|string|max:255',
  //     price: 'required|numeric|min:0',
  //     description: 'nullable|string',
  //     category: 'nullable|string|max:100',
  //     stock_quantity: 'nullable|integer|min:0',
  //     file_id: 'nullable|uuid',
  //   },
  // },
  // Files domain removed - file upload is integrated into ProductController only
  // Add more models as needed (only for Anemic Model pattern with BaseKnexService)
];

/**
 * Helper function to generate all CRUD modules
 * Usage in app.module.ts:
 *
 * @Module({
 *   imports: [
 *     ...generateAllCrudModules(),
 *     // other modules
 *   ],
 * })
 * export class AppModule {}
 */
export function generateAllCrudModules(): DynamicModule[] {
  return AutoCrudModule.forMultiple(AUTO_CRUD_MODELS);
}
