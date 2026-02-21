import { Controller, Get, Res } from '@nestjs/common';
import { PrometheusController } from '@willsoto/nestjs-prometheus';
import { Response } from 'express';
import { Public } from '@/common/decorators/public.decorator';
import { SkipTransform } from '@/common/decorators/response-message.decorator';

/**
 * Metrics Controller
 *
 * Custom Prometheus controller that extends the default PrometheusController
 * with @Public() and @SkipTransform() decorators:
 * - @Public() bypasses the global JwtAuthGuard
 * - @SkipTransform() bypasses the ResponseTransformInterceptor
 *   so Prometheus receives plain text metrics, not wrapped JSON
 *
 * Note: The route path is set by PrometheusModule via Reflect.defineMetadata,
 * not by the @Get() decorator. The @Get() must have an empty path.
 *
 * @class MetricsController
 * @extends PrometheusController
 * @version 1.2.0
 * @since 2026-02-22
 */
@Controller()
export class MetricsController extends PrometheusController {
  @Public()
  @SkipTransform()
  @Get()
  async index(@Res({ passthrough: true }) response: Response) {
    return super.index(response);
  }
}
