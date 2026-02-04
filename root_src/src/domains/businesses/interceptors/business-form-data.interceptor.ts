import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';

/**
 * Removes file field names from request.body so DTO validation
 * does not receive file references for image and cover_image.
 */
@Injectable()
export class BusinessFormDataInterceptor implements NestInterceptor {
  private readonly fieldsToFilter = ['image', 'cover_image'];

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();
    if (request.body) {
      this.fieldsToFilter.forEach((field) => {
        if (field in request.body) delete request.body[field];
      });
    }
    return next.handle();
  }
}
