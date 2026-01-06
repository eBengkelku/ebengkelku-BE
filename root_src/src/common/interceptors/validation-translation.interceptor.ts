import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  BadRequestException,
} from '@nestjs/common';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { I18nService } from 'nestjs-i18n';

@Injectable()
export class ValidationTranslationInterceptor implements NestInterceptor {
  constructor(private readonly i18n: I18nService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    return next.handle().pipe(
      catchError((error) => {
        if (error instanceof BadRequestException) {
          const response = error.getResponse() as any;

          if (response.message && Array.isArray(response.message)) {
            const request = context.switchToHttp().getRequest();
            const lang =
              request.headers['x-lang'] ||
              request.headers['accept-language'] ||
              'en';

            // Translate validation messages
            const translatedMessages = response.message.map(
              (message: string) => {
                if (message.includes('validation.')) {
                  // Parse message with parameters: "validation.min|{"min":0}"
                  const [key, paramsStr] = message.split('|');
                  let params = {};

                  try {
                    if (paramsStr) {
                      params = JSON.parse(paramsStr);
                    }
                  } catch {
                    // If parsing fails, use empty params
                  }

                  // Add property name from context
                  const property = this.extractPropertyFromContext(
                    context,
                    key,
                  );
                  if (property) {
                    params = { ...params, property };
                  }

                  return this.i18n.translate(key, { lang, args: params });
                }
                return message;
              },
            );

            // Create new error with translated messages
            const translatedResponse = {
              ...response,
              message: translatedMessages,
            };

            return throwError(
              () => new BadRequestException(translatedResponse),
            );
          }
        }

        return throwError(() => error);
      }),
    );
  }

  private extractPropertyFromContext(
    context: ExecutionContext,
    validationKey: string,
  ): string | undefined {
    // This is a simplified property extraction - in practice, you might need
    // more sophisticated logic to map validation keys to property names
    const request = context.switchToHttp().getRequest();
    const body = request.body;

    // For now, we'll try to infer the property from common patterns
    if (validationKey.includes('required') && body) {
      // Find missing required fields
      const requiredFields = ['name']; // You can make this dynamic
      const missingField = requiredFields.find((field) => !body[field]);
      return missingField;
    }

    return undefined;
  }
}
