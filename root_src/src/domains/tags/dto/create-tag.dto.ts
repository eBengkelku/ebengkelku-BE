import {
  IsNotEmpty,
  IsString,
  Length,
  Matches,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateTagDto {
  @ApiProperty({
    description: 'Tag name',
    example: 'Hot Item',
    minLength: 1,
    maxLength: 20,
  })
  @IsNotEmpty({ message: 'tags.validation.name.required' })
  @IsString({ message: 'tags.validation.name.string' })
  @Length(1, 20, { message: 'tags.validation.name.length' })
  name: string;

  @ApiProperty({
    description: 'Hex color code',
    example: '#FF0000',
    pattern: '^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$',
  })
  @IsNotEmpty({ message: 'tags.validation.color.required' })
  @IsString({ message: 'tags.validation.color.string' })
  @Matches(/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/, {
    message: 'tags.validation.color.format',
  })
  color: string;
}
