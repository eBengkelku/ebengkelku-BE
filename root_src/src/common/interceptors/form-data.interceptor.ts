import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';

@Injectable()
export class FormDataInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();

    // Check if this is multipart/form-data
    if (request.headers['content-type']?.includes('multipart/form-data')) {
      // Transform form data fields to proper types for validation
      if (request.body) {
        const body = request.body;

        // Handle numeric fields
        if (body.price !== undefined) {
          body.price = parseFloat(body.price) || undefined;
        }
        if (body.stock_quantity !== undefined) {
          body.stock_quantity = parseInt(body.stock_quantity) || undefined;
        }

        // Handle string fields - remove empty strings, convert to undefined
        ['name', 'description', 'category'].forEach((field) => {
          if (body[field] === '') {
            body[field] = undefined;
          }
        });

        request.body = body;
      }
    }

    return next.handle();
  }
}
