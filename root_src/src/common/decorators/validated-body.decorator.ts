import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { plainToClass } from 'class-transformer';
import { validate } from 'class-validator';

/**
 * Custom parameter decorator for dynamic DTO validation
 * Usage: @ValidatedBody(CreateProductDto) createDto: CreateProductDto
 */
export const ValidatedBody = createParamDecorator(
  async (dtoClass: any, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    const body = request.body;

    if (!dtoClass) {
      return body; // Return raw body if no DTO specified
    }

    // Transform plain object to DTO instance
    const dto = plainToClass(dtoClass, body);

    // Validate the DTO
    const errors = await validate(dto);

    if (errors.length > 0) {
      // Format validation errors
      const formattedErrors = errors.map((error) => ({
        property: error.property,
        value: error.value,
        constraints: error.constraints,
      }));

      throw new Error(
        JSON.stringify({
          success: false,
          message: 'Validation failed',
          errors: formattedErrors,
          statusCode: 400,
        }),
      );
    }

    return dto;
  },
);
