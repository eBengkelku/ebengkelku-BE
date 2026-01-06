import { ValidationPipe, BadRequestException } from '@nestjs/common';
import { ValidationError } from 'class-validator';
import { I18nService } from 'nestjs-i18n';

export class I18nValidationPipe extends ValidationPipe {
  constructor(private readonly i18n: I18nService) {
    super({
      transform: true,
      whitelist: true,
      forbidNonWhitelisted: true,
      exceptionFactory: (errors: ValidationError[]) => {
        return this.createI18nException(errors);
      },
    });
  }

  private createI18nException(errors: ValidationError[]): BadRequestException {
    const messages = this.mapErrorsToMessages(errors);

    return new BadRequestException({
      statusCode: 400,
      error: 'Bad Request',
      message: messages,
    });
  }

  private mapErrorsToMessages(
    errors: ValidationError[],
    lang = 'en',
  ): string[] {
    const messages: string[] = [];

    for (const error of errors) {
      if (error.constraints) {
        for (const [constraintKey, constraintMessage] of Object.entries(
          error.constraints,
        )) {
          // Map constraint types to i18n keys
          const translatedMessage = this.translateConstraint(
            constraintKey,
            error.property,
            constraintMessage,
            error,
            lang,
          );
          messages.push(translatedMessage);
        }
      }

      // Handle nested validation errors
      if (error.children && error.children.length > 0) {
        messages.push(...this.mapErrorsToMessages(error.children, lang));
      }
    }

    return messages;
  }

  private translateConstraint(
    constraintKey: string,
    property: string,
    originalMessage: string,
    error: ValidationError,
    lang: string,
  ): string {
    const i18nKey = this.getI18nKeyForConstraint(constraintKey);
    const args = this.getArgsForConstraint(constraintKey, error);

    try {
      const translated = this.i18n.translate(i18nKey, {
        lang,
        args: { property, ...args },
      }) as string;

      // If translation returns the key (not found), use original message
      return translated !== i18nKey ? translated : originalMessage;
    } catch {
      // Fallback to original message if translation fails
      return originalMessage;
    }
  }

  private getI18nKeyForConstraint(constraintKey: string): string {
    const keyMap: Record<string, string> = {
      isNotEmpty: 'validation.required',
      isString: 'validation.string',
      isNumber: 'validation.number',
      isInt: 'validation.integer',
      min: 'validation.min',
      max: 'validation.max',
      length: 'validation.length',
      minLength: 'validation.minLength',
      maxLength: 'validation.maxLength',
      isEmail: 'validation.email',
      isUrl: 'validation.url',
      isBoolean: 'validation.boolean',
      isArray: 'validation.array',
      isEnum: 'validation.enum',
    };

    return keyMap[constraintKey] || 'validation.invalid';
  }

  private getArgsForConstraint(
    constraintKey: string,
    error: ValidationError,
  ): Record<string, any> {
    const args: Record<string, any> = {};

    // Extract constraint values based on constraint type
    if (error.constraints) {
      const constraintValue = error.constraints[constraintKey];

      // Parse constraint arguments from the constraint definition
      if (constraintKey === 'min' || constraintKey === 'max') {
        // For @Min(5) or @Max(100), the value is usually in the constraint
        const match = constraintValue.match(/(\d+)/);
        if (match) {
          args[constraintKey] = parseInt(match[1]);
        }
      }

      if (constraintKey === 'length') {
        // For @Length(1, 255), extract min and max
        const matches = constraintValue.match(/(\d+)/g);
        if (matches && matches.length >= 2) {
          args.min = parseInt(matches[0]);
          args.max = parseInt(matches[1]);
        }
      }

      if (constraintKey === 'minLength' || constraintKey === 'maxLength') {
        const match = constraintValue.match(/(\d+)/);
        if (match) {
          args[constraintKey.replace('Length', '')] = parseInt(match[1]);
        }
      }
    }

    return args;
  }
}
