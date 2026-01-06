import {
  registerDecorator,
  ValidationOptions,
  ValidationArguments,
} from 'class-validator';
import { I18nContext } from 'nestjs-i18n';

export function IsNotEmptyI18n(validationOptions?: ValidationOptions) {
  return function (object: object, propertyName: string) {
    registerDecorator({
      name: 'isNotEmptyI18n',
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      validator: {
        validate(value: any, _args: ValidationArguments) {
          return value !== null && value !== undefined && value !== '';
        },
        defaultMessage(_args: ValidationArguments) {
          const i18n = I18nContext.current();
          return (
            i18n?.translate('validation.required', {
              args: { property: _args.property },
            }) || `${_args.property} is required`
          );
        },
      },
    });
  };
}

export function IsStringI18n(validationOptions?: ValidationOptions) {
  return function (object: object, propertyName: string) {
    registerDecorator({
      name: 'isStringI18n',
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      validator: {
        validate(value: any, _args: ValidationArguments) {
          return typeof value === 'string';
        },
        defaultMessage(_args: ValidationArguments) {
          const i18n = I18nContext.current();
          return (
            i18n?.translate('validation.string', {
              args: { property: _args.property },
            }) || `${_args.property} must be a string`
          );
        },
      },
    });
  };
}

export function LengthI18n(
  min: number,
  max?: number,
  validationOptions?: ValidationOptions,
) {
  return function (object: object, propertyName: string) {
    registerDecorator({
      name: 'lengthI18n',
      target: object.constructor,
      propertyName: propertyName,
      constraints: [min, max],
      options: validationOptions,
      validator: {
        validate(value: any, args: ValidationArguments) {
          if (typeof value !== 'string') return false;
          const [minLength, maxLength] = args.constraints;
          return (
            value.length >= minLength &&
            (!maxLength || value.length <= maxLength)
          );
        },
        defaultMessage(args: ValidationArguments) {
          const i18n = I18nContext.current();
          const [minLength, maxLength] = args.constraints;

          if (maxLength) {
            return (
              i18n?.translate('validation.length', {
                args: {
                  property: args.property,
                  min: minLength,
                  max: maxLength,
                },
              }) ||
              `${args.property} must be between ${minLength} and ${maxLength} characters`
            );
          } else {
            return (
              i18n?.translate('validation.minLength', {
                args: { property: args.property, min: minLength },
              }) || `${args.property} must be at least ${minLength} characters`
            );
          }
        },
      },
    });
  };
}

export function IsNumberI18n(validationOptions?: ValidationOptions) {
  return function (object: object, propertyName: string) {
    registerDecorator({
      name: 'isNumberI18n',
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      validator: {
        validate(value: any, _args: ValidationArguments) {
          return typeof value === 'number' && !isNaN(value);
        },
        defaultMessage(_args: ValidationArguments) {
          const i18n = I18nContext.current();
          return (
            i18n?.translate('validation.number', {
              args: { property: _args.property },
            }) || `${_args.property} must be a valid number`
          );
        },
      },
    });
  };
}

export function MinI18n(min: number, validationOptions?: ValidationOptions) {
  return function (object: object, propertyName: string) {
    registerDecorator({
      name: 'minI18n',
      target: object.constructor,
      propertyName: propertyName,
      constraints: [min],
      options: validationOptions,
      validator: {
        validate(value: any, args: ValidationArguments) {
          const [minValue] = args.constraints;
          return typeof value === 'number' && value >= minValue;
        },
        defaultMessage(args: ValidationArguments) {
          const i18n = I18nContext.current();
          const [minValue] = args.constraints;
          return (
            i18n?.translate('validation.min', {
              args: { property: args.property, min: minValue },
            }) || `${args.property} must be at least ${minValue}`
          );
        },
      },
    });
  };
}
