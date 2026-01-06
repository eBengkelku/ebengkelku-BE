import { Injectable, BadRequestException } from '@nestjs/common';
import { BaseKnexService } from '../../common/services/base-knex.service';
import { CreateFileDto } from './create-file.dto';
import { I18nService } from 'nestjs-i18n';
import { DatabaseService } from '../../database/database.service';
import * as fs from 'fs';
import * as path from 'path';
import * as crypto from 'crypto';
import type { Express } from 'express';

@Injectable()
export class FileService extends BaseKnexService {
  protected tableName = 'files';

  constructor(databaseService: DatabaseService, i18nService: I18nService) {
    super(databaseService, i18nService, {
      tableName: 'files',
      primaryKey: 'id',
      timestampColumns: {
        created: 'created_at',
        updated: 'updated_at',
        deleted: 'deleted_at',
      },
      descColumns: ['original_name', 'file_path'],
      fillable: [
        'file_path',
        'original_name',
        'mime_type',
        'file_size',
        'file_type',
        'extension',
      ],
      rules: {},
    });
  }

  /**
   * Laravel-like doInsert hook for file creation
   * This method is called before the file record is inserted into database
   */
  protected async doInsert(
    createFileDto: CreateFileDto,
    file?: Express.Multer.File,
  ): Promise<CreateFileDto> {
    if (file) {
      // Validate file type and size
      this.validateFile(file);

      // Process and save physical file
      const filePath = await this.savePhysicalFile(file);

      // Update DTO with file information
      createFileDto.file_path = filePath;
      createFileDto.original_name = file.originalname;
      createFileDto.mime_type = file.mimetype;
      createFileDto.file_size = file.size;
      createFileDto.file_type = this.getFileTypeFromMime(file.mimetype);
      createFileDto.extension = this.getFileExtension(file.originalname);
    }

    return createFileDto;
  }

  /**
   * Laravel-like doAfterInsert hook for post-creation actions
   * This method is called after the file record is successfully inserted
   */
  protected async doAfterInsert(
    result: any,
    createFileDto: CreateFileDto,
  ): Promise<any> {
    // Log file upload success
    console.log(`File uploaded successfully: ${createFileDto.file_path}`);

    // Any additional post-insert processing can be added here
    // For example: virus scanning, thumbnail generation, etc.

    return result;
  }

  /**
   * Create file with physical file upload
   */
  async createWithFile(file: Express.Multer.File): Promise<any> {
    try {
      // Initialize DTO
      let createFileDto = new CreateFileDto();

      // Run doInsert hook to process file
      createFileDto = await this.doInsert(createFileDto, file);

      // Insert into database
      const [insertedRecord] = await this.knex(this.tableName)
        .insert(createFileDto)
        .returning('id');

      // Get the inserted record
      const result = await this.knex(this.tableName)
        .where('id', insertedRecord.id)
        .first();

      // Run doAfterInsert hook
      await this.doAfterInsert(result, createFileDto);

      return result;
    } catch (error) {
      // Clean up physical file if database insert fails
      if (error.file_path && fs.existsSync(error.file_path)) {
        fs.unlinkSync(error.file_path);
      }
      throw error;
    }
  }

  /**
   * Find all files with pagination
   */
  async findAllFiles(
    page: number = 1,
    limit: number = 10,
    filters: any = {},
  ): Promise<any> {
    const query = this.knex(this.tableName).whereNull('deleted_at');

    // Apply filters
    if (filters.file_type) {
      query.where('file_type', filters.file_type);
    }
    if (filters.mime_type) {
      query.where('mime_type', filters.mime_type);
    }
    if (filters.original_name) {
      query.where('original_name', 'like', `%${filters.original_name}%`);
    }

    // Get total count
    const totalQuery = query.clone();
    const [{ count }] = await totalQuery.count('* as count');
    const total = parseInt(count as string);

    // Apply pagination
    const offset = (page - 1) * limit;
    const data = await query
      .limit(limit)
      .offset(offset)
      .orderBy('created_at', 'desc');

    return {
      data,
      meta: {
        current_page: page,
        per_page: limit,
        total,
        last_page: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Find file by ID
   */
  async findFileById(id: string): Promise<any> {
    const result = await this.knex(this.tableName)
      .where('id', id)
      .whereNull('deleted_at')
      .first();

    if (!result) {
      throw new BadRequestException(
        this.i18n.t('files.file.not_found', { args: { id } }),
      );
    }

    return result;
  }

  /**
   * Soft delete file
   */
  async deleteFile(id: string): Promise<void> {
    const file = await this.findFileById(id);

    // Soft delete in database
    await this.knex(this.tableName)
      .where('id', id)
      .update({ deleted_at: new Date() });

    // Optionally delete physical file
    if (fs.existsSync(file.file_path)) {
      fs.unlinkSync(file.file_path);
    }
  }

  /**
   * Validate uploaded file
   */
  private validateFile(file: Express.Multer.File): void {
    // Check file size (max 10MB)
    const maxSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSize) {
      throw new BadRequestException(
        this.i18n.t('files.file.size_too_large', { args: { max: '10MB' } }),
      );
    }

    // Check allowed file types for products (images only)
    const allowedMimeTypes = [
      'image/jpeg',
      'image/jpg',
      'image/png',
      'image/gif',
      'image/webp',
    ];

    if (!allowedMimeTypes.includes(file.mimetype)) {
      throw new BadRequestException(
        this.i18n.t('files.file.invalid_type', {
          args: { types: 'JPEG, PNG, GIF, WebP' },
        }),
      );
    }
  }

  /**
   * Save physical file to disk
   */
  private async savePhysicalFile(file: Express.Multer.File): Promise<string> {
    // Create directory structure: /uploads/images/YYYY/MM/
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');

    const uploadDir = path.join(
      '/var/www/files',
      'images',
      String(year),
      month,
    );

    // Ensure directory exists
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }

    // Generate unique filename
    const extension = this.getFileExtension(file.originalname);
    const timestamp = Date.now();
    const random = crypto.randomBytes(8).toString('hex');
    const filename = `${timestamp}-${random}.${extension}`;
    const fullPath = path.join(uploadDir, filename);

    // Write file to disk
    fs.writeFileSync(fullPath, file.buffer);

    return fullPath;
  }

  /**
   * Get file type category from MIME type
   */
  private getFileTypeFromMime(mimeType: string): string {
    if (mimeType.startsWith('image/')) return 'image';
    if (mimeType.startsWith('video/')) return 'video';
    if (mimeType.startsWith('audio/')) return 'audio';
    if (mimeType.includes('pdf') || mimeType.includes('document'))
      return 'document';
    if (mimeType.includes('zip') || mimeType.includes('archive'))
      return 'archive';
    return 'other';
  }

  /**
   * Get file extension from filename
   */
  private getFileExtension(filename: string): string {
    return filename.split('.').pop()?.toLowerCase() || '';
  }
}
