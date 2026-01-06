import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';

@Injectable()
export class FilterFormDataInterceptor implements NestInterceptor {
  private readonly fieldsToFilter: string[] = ['image'];

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();

    if (request.body) {
      // Filter out specified fields from the request body
      this.fieldsToFilter.forEach((field) => {
        if (field in request.body) {
          delete request.body[field];
        }
      });
    }

    return next.handle();
  }
}
