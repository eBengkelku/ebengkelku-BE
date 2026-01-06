import {
  Controller,
  Get,
  Post,
  Delete,
  Param,
  Query,
  UploadedFile,
  UseInterceptors,
  ParseIntPipe,
  DefaultValuePipe,
} from '@nestjs/common';
import { ParseUUIDPipe } from '../../common/pipes/uuid-validation.pipe';
import { FileInterceptor } from '@nestjs/platform-express';
import { FileService } from './file.service';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiConsumes,
  ApiBody,
  ApiQuery,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { ResponseMessage } from '../../common/decorators/response-message.decorator';
import type { Express } from 'express';

@ApiTags('Files')
@ApiBearerAuth()
@Controller('files')
export class FileController {
  constructor(private readonly fileService: FileService) {}

  @Post('upload')
  @ResponseMessage('File uploaded successfully')
  @ApiOperation({
    summary: 'Upload a file',
    description:
      'Upload a single file and create a file record in the database',
  })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: {
          type: 'string',
          format: 'binary',
          description:
            'File to upload (max 10MB, images only: JPEG, PNG, GIF, WebP)',
        },
      },
    },
  })
  @ApiResponse({
    status: 201,
    description: 'File uploaded successfully',
    schema: {
      type: 'object',
      properties: {
        id: { type: 'number', example: 1 },
        file_path: {
          type: 'string',
          example: '/var/www/files/images/2025/01/uuid.jpg',
        },
        original_name: { type: 'string', example: 'product-image.jpg' },
        mime_type: { type: 'string', example: 'image/jpeg' },
        file_size: { type: 'number', example: 1024000 },
        file_type: { type: 'string', example: 'image' },
        extension: { type: 'string', example: 'jpg' },
        created_at: { type: 'string', format: 'date-time' },
        updated_at: { type: 'string', format: 'date-time' },
      },
    },
  })
  @ApiResponse({
    status: 400,
    description: 'Bad request - Invalid file or validation error',
  })
  @UseInterceptors(FileInterceptor('file'))
  async uploadFile(@UploadedFile() file: Express.Multer.File) {
    return this.fileService.createWithFile(file);
  }

  @Get()
  @ResponseMessage('Files retrieved successfully')
  @ApiOperation({
    summary: 'Get all files',
    description: 'Retrieve all files with pagination and optional filtering',
  })
  @ApiQuery({
    name: 'page',
    required: false,
    type: Number,
    description: 'Page number (default: 1)',
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    type: Number,
    description: 'Items per page (default: 10)',
  })
  @ApiQuery({
    name: 'file_type',
    required: false,
    type: String,
    description: 'Filter by file type',
  })
  @ApiQuery({
    name: 'mime_type',
    required: false,
    type: String,
    description: 'Filter by MIME type',
  })
  @ApiQuery({
    name: 'original_name',
    required: false,
    type: String,
    description: 'Search by original filename',
  })
  @ApiResponse({
    status: 200,
    description: 'Files retrieved successfully',
    schema: {
      type: 'object',
      properties: {
        data: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              id: { type: 'number' },
              file_path: { type: 'string' },
              original_name: { type: 'string' },
              mime_type: { type: 'string' },
              file_size: { type: 'number' },
              file_type: { type: 'string' },
              extension: { type: 'string' },
              created_at: { type: 'string', format: 'date-time' },
              updated_at: { type: 'string', format: 'date-time' },
            },
          },
        },
        meta: {
          type: 'object',
          properties: {
            current_page: { type: 'number' },
            per_page: { type: 'number' },
            total: { type: 'number' },
            last_page: { type: 'number' },
          },
        },
      },
    },
  })
  async findAll(
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(10), ParseIntPipe) limit: number,
    @Query('file_type') fileType?: string,
    @Query('mime_type') mimeType?: string,
    @Query('original_name') originalName?: string,
  ) {
    const filters: Record<string, any> = {
      file_type: fileType,
      mime_type: mimeType,
      original_name: originalName,
    };

    // Remove undefined filters
    Object.keys(filters).forEach(
      (key) => filters[key] === undefined && delete filters[key],
    );

    return this.fileService.findAllFiles(page, limit, filters);
  }

  @Get(':id')
  @ResponseMessage('File details retrieved successfully')
  @ApiOperation({
    summary: 'Get file details',
    description: 'Retrieve metadata for a specific file',
  })
  @ApiResponse({
    status: 200,
    description: 'File details retrieved successfully',
    schema: {
      type: 'object',
      properties: {
        id: { type: 'string', format: 'uuid' },
        filename: { type: 'string' },
        mimetype: { type: 'string' },
        size: { type: 'integer' },
        created_at: { type: 'string', format: 'date-time' },
        updated_at: { type: 'string', format: 'date-time' },
      },
    },
  })
  @ApiResponse({ status: 404, description: 'File not found' })
  async findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.fileService.findFileById(id);
  }

  @Delete(':id')
  @ResponseMessage('File deleted successfully')
  @ApiOperation({
    summary: 'Delete file',
    description:
      'Soft delete a file record and optionally remove the physical file',
  })
  @ApiResponse({ status: 200, description: 'File deleted successfully' })
  @ApiResponse({ status: 404, description: 'File not found' })
  async remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.fileService.deleteFile(id);
  }
}
