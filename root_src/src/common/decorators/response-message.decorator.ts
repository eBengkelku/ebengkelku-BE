import { SetMetadata } from '@nestjs/common';
import {
  RESPONSE_MESSAGE_KEY,
  SKIP_TRANSFORM_KEY,
} from '../interceptors/response-transform.interceptor';

/**
 * Response Message Decorator
 *
 * Sets a custom success message for the response.
 * Used with ResponseTransformInterceptor to override default success messages.
 *
 * @param message - Custom success message
 * @returns Method decorator
 *
 * @example
 * ```typescript
 * @ResponseMessage('Product created successfully')
 * @Post()
 * async create(@Body() dto: CreateProductDto) {
 *   return this.productService.create(dto);
 * }
 * ```
 *
 * @example With multiple decorators
 * ```typescript
 * @ResponseMessage('Product updated')
 * @ApiOperation({ summary: 'Update product' })
 * @Put(':id')
 * async update(@Param('id') id: string, @Body() dto: UpdateProductDto) {
 *   return this.productService.update(id, dto);
 * }
 * ```
 */
export const ResponseMessage = (message: string) =>
  SetMetadata(RESPONSE_MESSAGE_KEY, message);

/**
 * Skip Transform Decorator
 *
 * Bypasses the ResponseTransformInterceptor for a specific endpoint.
 * Useful for endpoints that need to return raw data or custom formats.
 *
 * @returns Method decorator
 *
 * @example
 * ```typescript
 * @SkipTransform()
 * @Get('health')
 * async healthCheck() {
 *   return { status: 'ok', uptime: process.uptime() };
 * }
 * ```
 *
 * @example Download endpoint
 * ```typescript
 * @SkipTransform()
 * @Get('download/:id')
 * async downloadFile(@Param('id') id: string, @Res() res: Response) {
 *   const file = await this.fileService.getFile(id);
 *   res.download(file.path);
 * }
 * ```
 */
export const SkipTransform = () => SetMetadata(SKIP_TRANSFORM_KEY, true);
