import { applyDecorators, Type } from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
  ApiParam,
  ApiHeader,
  ApiConsumes,
  ApiExtraModels,
} from '@nestjs/swagger';

export function BaseCrudSwagger(options: {
  tag: string;
  entityName: string;
  createDto?: Type<any>;
  updateDto?: Type<any>;
}) {
  const { tag, entityName: _entityName, createDto, updateDto } = options;

  const decorators = [ApiTags(tag), ApiBearerAuth('JWT-auth')];

  if (createDto) decorators.push(ApiExtraModels(createDto));
  if (updateDto) decorators.push(ApiExtraModels(updateDto));

  return applyDecorators(...decorators);
}

// Method decorators for individual endpoints
export function SwaggerFindAll(entityName: string) {
  return applyDecorators(
    ApiOperation({
      summary: `Get paginated list of ${entityName.toLowerCase()}s`,
    }),
    ApiHeader({
      name: 'x-lang',
      description: 'Language code for internationalization',
      required: false,
      example: 'en',
    }),
  );
}

export function SwaggerFindOne(entityName: string) {
  return applyDecorators(
    ApiOperation({ summary: `Get ${entityName.toLowerCase()} by ID` }),
    ApiParam({
      name: 'id',
      type: 'string',
      format: 'uuid',
      description: `UUID of the ${entityName.toLowerCase()}`,
      example: '123e4567-e89b-12d3-a456-426614174000',
    }),
    ApiHeader({
      name: 'x-lang',
      description: 'Language code for internationalization',
      required: false,
      example: 'en',
    }),
  );
}

export function SwaggerCreate(entityName: string) {
  return applyDecorators(
    ApiOperation({
      summary: `Create new ${entityName.toLowerCase()}`,
      description: `Create a new ${entityName.toLowerCase()}. Supports both JSON and multipart/form-data requests.
    
**JSON Request**: Use Content-Type: application/json for entities without files
**Form Data**: Use Content-Type: multipart/form-data for entities with file uploads

File requirements are determined by business logic in child controllers.`,
    }),
    ApiConsumes('application/json', 'multipart/form-data'),
    ApiHeader({
      name: 'x-lang',
      description: 'Language code for internationalization',
      required: false,
      example: 'en',
    }),
  );
}

export function SwaggerUpdate(entityName: string) {
  return applyDecorators(
    ApiOperation({
      summary: `Update ${entityName.toLowerCase()}`,
      description: `Update a ${entityName.toLowerCase()}. Supports both JSON and multipart/form-data requests.
    
**JSON Request**: Use Content-Type: application/json for updates without files
**Form Data**: Use Content-Type: multipart/form-data for updates with file uploads`,
    }),
    ApiConsumes('application/json', 'multipart/form-data'),
    ApiParam({
      name: 'id',
      type: 'string',
      format: 'uuid',
      description: `UUID of the ${entityName.toLowerCase()} to update`,
      example: '123e4567-e89b-12d3-a456-426614174000',
    }),
    ApiHeader({
      name: 'x-lang',
      description: 'Language code for internationalization',
      required: false,
      example: 'en',
    }),
  );
}

export function SwaggerDelete(entityName: string) {
  return applyDecorators(
    ApiOperation({ summary: `Delete ${entityName.toLowerCase()}` }),
    ApiParam({
      name: 'id',
      type: 'string',
      format: 'uuid',
      description: `UUID of the ${entityName.toLowerCase()} to delete`,
      example: '123e4567-e89b-12d3-a456-426614174000',
    }),
    ApiHeader({
      name: 'x-lang',
      description: 'Language code for internationalization',
      required: false,
      example: 'en',
    }),
  );
}

export function SwaggerSearch(entityName: string) {
  return applyDecorators(
    ApiOperation({ summary: `Search ${entityName.toLowerCase()}s` }),
    ApiHeader({
      name: 'x-lang',
      description: 'Language code for internationalization',
      required: false,
      example: 'en',
    }),
  );
}

export function SwaggerCombo(entityName: string) {
  return applyDecorators(
    ApiOperation({ summary: `Get ${entityName.toLowerCase()} combo data` }),
    ApiHeader({
      name: 'x-lang',
      description: 'Language code for internationalization',
      required: false,
      example: 'en',
    }),
  );
}

export function SwaggerRules(entityName: string) {
  return applyDecorators(
    ApiOperation({
      summary: `Get validation rules for ${entityName.toLowerCase()}`,
    }),
  );
}

export function SwaggerSearchTable(entityName: string) {
  return applyDecorators(
    ApiOperation({
      summary: `Search ${entityName.toLowerCase()}s for data tables`,
    }),
    ApiHeader({
      name: 'x-lang',
      description: 'Language code for internationalization',
      required: false,
      example: 'en',
    }),
  );
}

export function SwaggerDataTabulator(entityName: string) {
  return applyDecorators(
    ApiOperation({
      summary: `Get ${entityName.toLowerCase()} data for tabulator`,
    }),
    ApiHeader({
      name: 'x-lang',
      description: 'Language code for internationalization',
      required: false,
      example: 'en',
    }),
  );
}

export function SwaggerDeleteAll(entityName: string) {
  return applyDecorators(
    ApiOperation({ summary: `Bulk delete ${entityName.toLowerCase()}s` }),
    ApiHeader({
      name: 'x-lang',
      description: 'Language code for internationalization',
      required: false,
      example: 'en',
    }),
  );
}

export function SwaggerComboWithKeyword(entityName: string) {
  return applyDecorators(
    ApiOperation({
      summary: `Get ${entityName.toLowerCase()} combo data with keyword`,
    }),
    ApiParam({
      name: 'keyword',
      type: 'string',
      description: 'Search keyword for filtering combo data',
      example: 'search-term',
    }),
    ApiHeader({
      name: 'x-lang',
      description: 'Language code for internationalization',
      required: false,
      example: 'en',
    }),
  );
}

export function SwaggerComboPost(entityName: string) {
  return applyDecorators(
    ApiOperation({
      summary: `Get ${entityName.toLowerCase()} combo data via POST`,
    }),
    ApiHeader({
      name: 'x-lang',
      description: 'Language code for internationalization',
      required: false,
      example: 'en',
    }),
  );
}
