import {
  Controller,
  Get,
  Post,
  Put,
  Param,
  Query,
  Body,
  Headers,
  ParseIntPipe,
  UseInterceptors,
  UploadedFile,
  Res,
  NotFoundException,
} from '@nestjs/common';
import { ParseUUIDPipe } from '../../src/common/pipes/uuid-validation.pipe';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname } from 'path';
// import * as fs from 'fs';
import type { Response } from 'express';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { BaseKnexController } from '../../src/common/controllers/base-knex.controller';
import { ProductsEnhancedService } from './products-laravel.service';
import { ProductDto } from '../../src/domains/products/dto/product.dto';

@Controller('v1/data/products') // Following Laravel route pattern: /v1/data/{model}
@ApiTags('Products (Laravel Pattern)')
export class ProductsLaravelController extends BaseKnexController<ProductDto> {
  entityName = 'Product';

  constructor(
    private readonly productsEnhancedService: ProductsEnhancedService,
  ) {
    super(productsEnhancedService);
  }

  // All base CRUD operations are inherited from BaseKnexController:
  // GET /v1/data/products/list
  // GET /v1/data/products/detail/:id
  // POST /v1/data/products/search
  // POST /v1/data/products/create
  // PUT /v1/data/products/update/:id
  // DELETE /v1/data/products/delete/:id
  // GET /v1/data/products/combo
  // GET /v1/data/products/rules
  // POST /v1/data/products/data-tabulator
  // etc.

  // Product-specific endpoints (equivalent to Laravel's custom controller methods)

  @Get('category/:category')
  @ApiOperation({ summary: 'Get products by category' })
  async findByCategory(
    @Param('category') category: string,
    @Query() pagination: { page?: number; limit?: number },
    @Headers('x-lang') lang?: string,
  ) {
    return this.productsEnhancedService.findByCategory(
      category,
      pagination,
      lang,
    );
  }

  @Get('low-stock')
  @ApiOperation({ summary: 'Get products with low stock' })
  async findLowStock(
    @Query('threshold', ParseIntPipe) threshold: number = 10,
    @Headers('x-lang') lang?: string,
  ) {
    return this.productsEnhancedService.findLowStock(threshold, lang);
  }

  @Put('update-stock/:id')
  @ApiOperation({ summary: 'Update product stock quantity' })
  async updateStock(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() body: { quantity: number; operation: 'add' | 'subtract' },
    @Headers('x-lang') lang?: string,
  ) {
    return this.productsEnhancedService.updateStock(
      id,
      body.quantity,
      body.operation,
      lang,
    );
  }

  @Get('top-selling')
  @ApiOperation({ summary: 'Get top selling products' })
  async getTopSellingProducts(
    @Query('limit', ParseIntPipe) limit: number = 10,
    @Headers('x-lang') lang?: string,
  ) {
    return this.productsEnhancedService.getTopSellingProducts(limit, lang);
  }

  // File upload endpoint (equivalent to Laravel's file handling)
  @Post('upload/:id')
  @UseInterceptors(
    FileInterceptor('file', {
      storage: diskStorage({
        destination: './uploads/products',
        filename: (req, file, cb) => {
          const randomName = Array(32)
            .fill(null)
            .map(() => Math.round(Math.random() * 16).toString(16))
            .join('');
          cb(null, `${randomName}${extname(file.originalname)}`);
        },
      }),
    }),
  )
  @ApiOperation({ summary: 'Upload product image' })
  async uploadProductImage(
    @Param('id', ParseUUIDPipe) id: string,
    @UploadedFile() file: Express.Multer.File,
    @Headers('x-lang') _lang?: string,
  ) {
    if (!file) {
      throw new NotFoundException('No file uploaded');
    }

    // TODO: Update to use new file upload system with UUID
    // const updatedProduct = await this.productsEnhancedService.update(
    //   id,
    //   { file_id: fileId }, // Need to implement file creation first
    //   undefined,
    //   lang,
    // );

    throw new Error(
      'File upload for Laravel controller needs to be updated for UUID system',
    );

    // return {
    //   message: 'Product image uploaded successfully',
    //   product: updatedProduct,
    //   file: {
    //     filename: file.filename,
    //     originalname: file.originalname,
    //     path: file.path,
    //     size: file.size,
    //   },
    // };
  }

  // File download endpoint
  @Get('download/:id')
  @ApiOperation({ summary: 'Download product image' })
  async downloadProductImage(
    @Param('id', ParseUUIDPipe) id: string,
    @Res() res: Response,
    @Headers('x-lang') lang?: string,
  ) {
    const _product = await this.productsEnhancedService.findOne(id, lang);

    // TODO: Update for new file upload system with UUID
    // if (!product.file_path || !fs.existsSync(product.file_path)) {
    //   throw new NotFoundException('Product image not found');
    // }
    // const filePath = join(process.cwd(), product.file_path);
    // res.download(filePath);

    throw new Error(
      'Download endpoint needs to be updated for new file system',
    );
  }

  // Preview endpoint (equivalent to Laravel's preview methods)
  @Get('preview/:id')
  @ApiOperation({ summary: 'Preview product image' })
  async previewProductImage(
    @Param('id', ParseUUIDPipe) id: string,
    @Res() res: Response,
    @Headers('x-lang') lang?: string,
  ) {
    const _product = await this.productsEnhancedService.findOne(id, lang);

    // TODO: Update for new file upload system with UUID
    // if (!product.file_path || !fs.existsSync(product.file_path)) {
    //   throw new NotFoundException('Product image not found');
    // }
    // const filePath = join(process.cwd(), product.file_path);
    // res.sendFile(filePath);

    throw new Error('Preview endpoint needs to be updated for new file system');
  }

  // Custom search with advanced filters
  @Post('advanced-search')
  @ApiOperation({ summary: 'Advanced product search with multiple filters' })
  async advancedSearch(
    @Body()
    body: {
      name?: string;
      category?: string;
      priceMin?: number;
      priceMax?: number;
      stockMin?: number;
      stockMax?: number;
      sortBy?: string;
      sortOrder?: 'asc' | 'desc';
    },
    @Query() pagination: { page?: number; limit?: number },
    @Headers('x-lang') lang?: string,
  ) {
    const filters: [string, string, any][] = [];

    if (body.name) {
      filters.push(['name', 'like', body.name]);
    }
    if (body.category) {
      filters.push(['category', 'like', body.category]);
    }
    if (body.priceMin !== undefined) {
      filters.push(['price', '>=', body.priceMin]);
    }
    if (body.priceMax !== undefined) {
      filters.push(['price', '<=', body.priceMax]);
    }
    if (body.stockMin !== undefined) {
      filters.push(['stock_quantity', '>=', body.stockMin]);
    }
    if (body.stockMax !== undefined) {
      filters.push(['stock_quantity', '<=', body.stockMax]);
    }

    const searchDto = {
      filters,
      sort: body.sortBy
        ? ([[body.sortBy, body.sortOrder || 'asc']] as [
            string,
            'asc' | 'desc',
          ][])
        : undefined,
    };

    return this.productsEnhancedService.search(searchDto, pagination, lang);
  }

  // Bulk operations (equivalent to Laravel's bulk methods)
  @Put('bulk-update-category')
  @ApiOperation({ summary: 'Bulk update product categories' })
  async bulkUpdateCategory(
    @Body() body: { productIds: number[]; category: string },
    @Headers('x-lang') lang?: string,
  ) {
    const results = [];

    for (const id of body.productIds) {
      try {
        const updated = await this.productsEnhancedService.update(
          id,
          { category: body.category },
          undefined,
          lang,
        );
        results.push({ id, success: true, product: updated });
      } catch (error) {
        results.push({ id, success: false, error: error.message });
      }
    }

    return {
      message: 'Bulk category update completed',
      results,
      totalProcessed: body.productIds.length,
      successful: results.filter((r) => r.success).length,
      failed: results.filter((r) => !r.success).length,
    };
  }
}
