import { IsString, IsNotEmpty, Length, IsNumber, Min } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

export class CreateFileDto {
  @ApiProperty({
    description: 'Physical file path on server',
    example: '/uploads/images/2025/01/product-123-1642086400.jpg',
    maxLength: 500,
  })
  @IsString({ message: 'files.file.file_path.is_string' })
  @IsNotEmpty({ message: 'files.file.file_path.not_empty' })
  @Length(1, 500, { message: 'files.file.file_path.length' })
  file_path: string;

  @ApiProperty({
    description: 'Original filename from upload',
    example: 'product-image.jpg',
    maxLength: 255,
  })
  @IsString({ message: 'files.file.original_name.is_string' })
  @IsNotEmpty({ message: 'files.file.original_name.not_empty' })
  @Length(1, 255, { message: 'files.file.original_name.length' })
  original_name: string;

  @ApiProperty({
    description: 'MIME type of the file',
    example: 'image/jpeg',
    maxLength: 100,
  })
  @IsString({ message: 'files.file.mime_type.is_string' })
  @IsNotEmpty({ message: 'files.file.mime_type.not_empty' })
  @Length(1, 100, { message: 'files.file.mime_type.length' })
  mime_type: string;

  @ApiProperty({
    description: 'File size in bytes',
    example: 1024000,
    minimum: 1,
  })
  @IsNumber({}, { message: 'files.file.file_size.is_number' })
  @Min(1, { message: 'files.file.file_size.min' })
  @Type(() => Number)
  file_size: number;

  @ApiProperty({
    description: 'General file type category',
    example: 'image',
    maxLength: 50,
    enum: ['image', 'document', 'video', 'audio', 'archive', 'other'],
  })
  @IsString({ message: 'files.file.file_type.is_string' })
  @IsNotEmpty({ message: 'files.file.file_type.not_empty' })
  @Length(1, 50, { message: 'files.file.file_type.length' })
  file_type: string;

  @ApiProperty({
    description: 'File extension',
    example: 'jpg',
    maxLength: 10,
  })
  @IsString({ message: 'files.file.extension.is_string' })
  @IsNotEmpty({ message: 'files.file.extension.not_empty' })
  @Length(1, 10, { message: 'files.file.extension.length' })
  extension: string;
}
