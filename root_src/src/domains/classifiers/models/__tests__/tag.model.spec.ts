import { TagModel } from '../tag.model';
import { ITag } from '../../interfaces/tag.interface';
import { DomainValidationException } from '../../../../common/domain';
import { TagErrorCodes } from '../../constants';

describe('TagModel', () => {
  const validTagId = '123e4567-e89b-12d3-a456-426614174000';
  const validName = 'Hot Item';
  const validColor = '#FF0000';

  describe('create', () => {
    it('should create valid tag instance with all fields', () => {
      const tag = TagModel.create({
        id: validTagId,
        name: validName,
        color: validColor,
      });

      expect(tag).toBeInstanceOf(TagModel);
      expect(tag.getId()).toBe(validTagId);
      expect(tag.getName()).toBe(validName);
      expect(tag.getColor()).toBe('#FF0000'); // Normalized to uppercase
      expect(tag.getCreatedAt()).toBeInstanceOf(Date);
      expect(tag.getUpdatedAt()).toBeInstanceOf(Date);
      expect(tag.getDeletedAt()).toBeNull();
    });

    it('should normalize color to uppercase', () => {
      const tag = TagModel.create({
        id: validTagId,
        name: validName,
        color: '#ff0000',
      });

      expect(tag.getColor()).toBe('#FF0000');
    });

    it('should accept 3-digit hex color', () => {
      const tag = TagModel.create({
        id: validTagId,
        name: validName,
        color: '#F00',
      });

      expect(tag.getColor()).toBe('#F00');
    });

    it('should accept 6-digit hex color', () => {
      const tag = TagModel.create({
        id: validTagId,
        name: validName,
        color: '#FF5733',
      });

      expect(tag.getColor()).toBe('#FF5733');
    });

    it('should trim name whitespace', () => {
      const tag = TagModel.create({
        id: validTagId,
        name: '  Hot Item  ',
        color: validColor,
      });

      expect(tag.getName()).toBe('Hot Item');
    });

    it('should throw error if name is empty', () => {
      expect(() => {
        TagModel.create({
          id: validTagId,
          name: '',
          color: validColor,
        });
      }).toThrow(DomainValidationException);
    });

    it('should throw error if name is only whitespace', () => {
      expect(() => {
        TagModel.create({
          id: validTagId,
          name: '   ',
          color: validColor,
        });
      }).toThrow(DomainValidationException);
    });

    it('should throw error if name is undefined', () => {
      expect(() => {
        TagModel.create({
          id: validTagId,
          name: undefined as any,
          color: validColor,
        });
      }).toThrow(DomainValidationException);
    });

    it('should throw error if name exceeds 20 characters', () => {
      expect(() => {
        TagModel.create({
          id: validTagId,
          name: 'A'.repeat(21), // 21 characters
          color: validColor,
        });
      }).toThrow(DomainValidationException);
    });

    it('should accept name with exactly 20 characters', () => {
      const tag = TagModel.create({
        id: validTagId,
        name: 'A'.repeat(20), // Exactly 20 characters
        color: validColor,
      });

      expect(tag.getName()).toBe('A'.repeat(20));
    });

    it('should throw error if hex color is invalid (missing #)', () => {
      expect(() => {
        TagModel.create({
          id: validTagId,
          name: validName,
          color: 'FF0000',
        });
      }).toThrow(DomainValidationException);
    });

    it('should throw error if hex color is invalid (wrong format)', () => {
      expect(() => {
        TagModel.create({
          id: validTagId,
          name: validName,
          color: '#GG0000',
        });
      }).toThrow(DomainValidationException);
    });

    it('should throw error if hex color is invalid (too short)', () => {
      expect(() => {
        TagModel.create({
          id: validTagId,
          name: validName,
          color: '#FF',
        });
      }).toThrow(DomainValidationException);
    });

    it('should throw error if hex color is invalid (too long)', () => {
      expect(() => {
        TagModel.create({
          id: validTagId,
          name: validName,
          color: '#FF00000',
        });
      }).toThrow(DomainValidationException);
    });

    it('should throw error if hex color is empty', () => {
      expect(() => {
        TagModel.create({
          id: validTagId,
          name: validName,
          color: '',
        });
      }).toThrow(DomainValidationException);
    });

    it('should accept various valid hex colors', () => {
      const colors = ['#000000', '#FFFFFF', '#FF0000', '#00FF00', '#0000FF'];

      colors.forEach((color) => {
        const tag = TagModel.create({
          id: validTagId,
          name: validName,
          color,
        });

        expect(tag.getColor()).toBe(color.toUpperCase());
      });
    });
  });

  describe('reconstitute', () => {
    it('should correctly restore object from database data', () => {
      const dbData: ITag = {
        id: validTagId,
        name: validName,
        color: validColor,
        created_at: new Date('2023-01-01'),
        updated_at: new Date('2023-01-02'),
        deleted_at: undefined,
      };

      const tag = TagModel.reconstitute(dbData);

      expect(tag).toBeInstanceOf(TagModel);
      expect(tag.getId()).toBe(validTagId);
      expect(tag.getName()).toBe(validName);
      expect(tag.getColor()).toBe(validColor);
      expect(tag.getCreatedAt()).toEqual(new Date('2023-01-01'));
      expect(tag.getUpdatedAt()).toEqual(new Date('2023-01-02'));
      expect(tag.getDeletedAt()).toBeNull();
    });

    it('should handle undefined deleted_at', () => {
      const dbData: ITag = {
        id: validTagId,
        name: validName,
        color: validColor,
        created_at: new Date('2023-01-01'),
        updated_at: new Date('2023-01-02'),
        deleted_at: undefined,
      };

      const tag = TagModel.reconstitute(dbData);

      expect(tag.getDeletedAt()).toBeNull();
    });

    it('should handle soft deleted tag', () => {
      const deletedAt = new Date('2023-01-03');
      const dbData: ITag = {
        id: validTagId,
        name: validName,
        color: validColor,
        created_at: new Date('2023-01-01'),
        updated_at: new Date('2023-01-02'),
        deleted_at: deletedAt,
      };

      const tag = TagModel.reconstitute(dbData);

      expect(tag.getDeletedAt()).toEqual(deletedAt);
    });
  });

  describe('updateColor', () => {
    let tag: TagModel;

    beforeEach(() => {
      tag = TagModel.create({
        id: validTagId,
        name: validName,
        color: validColor,
      });
    });

    it('should update color to valid new color', () => {
      const newColor = '#00FF00';
      const oldUpdatedAt = tag.getUpdatedAt();

      // Wait a bit to ensure timestamp changes
      setTimeout(() => {
        tag.updateColor(newColor);

        expect(tag.getColor()).toBe('#00FF00');
        expect(tag.getUpdatedAt().getTime()).toBeGreaterThan(
          oldUpdatedAt.getTime(),
        );
      }, 10);
    });

    it('should normalize color to uppercase', () => {
      tag.updateColor('#00ff00');

      expect(tag.getColor()).toBe('#00FF00');
    });

    it('should accept 3-digit hex color', () => {
      tag.updateColor('#F00');

      expect(tag.getColor()).toBe('#F00');
    });

    it('should accept 6-digit hex color', () => {
      tag.updateColor('#FF5733');

      expect(tag.getColor()).toBe('#FF5733');
    });

    it('should throw error if color format is invalid (missing #)', () => {
      expect(() => {
        tag.updateColor('FF0000');
      }).toThrow(DomainValidationException);
    });

    it('should throw error if color format is invalid (wrong format)', () => {
      expect(() => {
        tag.updateColor('#GG0000');
      }).toThrow(DomainValidationException);
    });

    it('should throw error if color format is invalid (too short)', () => {
      expect(() => {
        tag.updateColor('#FF');
      }).toThrow(DomainValidationException);
    });

    it('should throw error if color format is invalid (too long)', () => {
      expect(() => {
        tag.updateColor('#FF00000');
      }).toThrow(DomainValidationException);
    });

    it('should throw error if color is empty', () => {
      expect(() => {
        tag.updateColor('');
      }).toThrow(DomainValidationException);
    });
  });

  describe('renameWithValidation', () => {
    let tag: TagModel;

    beforeEach(() => {
      tag = TagModel.create({
        id: validTagId,
        name: validName,
        color: validColor,
      });
    });

    it('should rename tag with valid name', () => {
      const newName = 'New Tag Name';
      const oldUpdatedAt = tag.getUpdatedAt();

      // Wait a bit to ensure timestamp changes
      setTimeout(() => {
        tag.renameWithValidation(newName);

        expect(tag.getName()).toBe(newName);
        expect(tag.getUpdatedAt().getTime()).toBeGreaterThan(
          oldUpdatedAt.getTime(),
        );
      }, 10);
    });

    it('should trim whitespace from name', () => {
      tag.renameWithValidation('  New Name  ');

      expect(tag.getName()).toBe('New Name');
    });

    it('should throw error if name is empty', () => {
      expect(() => {
        tag.renameWithValidation('');
      }).toThrow(DomainValidationException);
    });

    it('should throw error if name is only whitespace', () => {
      expect(() => {
        tag.renameWithValidation('   ');
      }).toThrow(DomainValidationException);
    });

    it('should throw error if name exceeds 20 characters', () => {
      expect(() => {
        tag.renameWithValidation('A'.repeat(21)); // 21 characters
      }).toThrow(DomainValidationException);
    });

    it('should accept name with exactly 20 characters', () => {
      tag.renameWithValidation('A'.repeat(20)); // Exactly 20 characters

      expect(tag.getName()).toBe('A'.repeat(20));
    });

    it('should accept name with less than 20 characters', () => {
      tag.renameWithValidation('Short Name');

      expect(tag.getName()).toBe('Short Name');
    });
  });

  describe('toEntity', () => {
    it('should return correct database object structure', () => {
      const tag = TagModel.create({
        id: validTagId,
        name: validName,
        color: validColor,
      });

      const entity = tag.toEntity();

      expect(entity).toEqual({
        id: validTagId,
        name: validName,
        color: '#FF0000', // Normalized to uppercase
        created_at: tag.getCreatedAt(),
        updated_at: tag.getUpdatedAt(),
        deleted_at: undefined,
      });
    });

    it('should return undefined for deleted_at when not deleted', () => {
      const tag = TagModel.create({
        id: validTagId,
        name: validName,
        color: validColor,
      });

      const entity = tag.toEntity();

      expect(entity.deleted_at).toBeUndefined();
    });

    it('should return deleted_at when tag is soft deleted', () => {
      const deletedAt = new Date('2023-01-03');
      const dbData: ITag = {
        id: validTagId,
        name: validName,
        color: validColor,
        created_at: new Date('2023-01-01'),
        updated_at: new Date('2023-01-02'),
        deleted_at: deletedAt,
      };

      const tag = TagModel.reconstitute(dbData);
      const entity = tag.toEntity();

      expect(entity.deleted_at).toEqual(deletedAt);
    });
  });

  describe('getters', () => {
    let tag: TagModel;

    beforeEach(() => {
      tag = TagModel.create({
        id: validTagId,
        name: validName,
        color: validColor,
      });
    });

    it('should return correct id', () => {
      expect(tag.getId()).toBe(validTagId);
    });

    it('should return correct name', () => {
      expect(tag.getName()).toBe(validName);
    });

    it('should return correct color', () => {
      expect(tag.getColor()).toBe('#FF0000');
    });

    it('should return Date instance for createdAt', () => {
      expect(tag.getCreatedAt()).toBeInstanceOf(Date);
    });

    it('should return Date instance for updatedAt', () => {
      expect(tag.getUpdatedAt()).toBeInstanceOf(Date);
    });

    it('should return null for deletedAt when not deleted', () => {
      expect(tag.getDeletedAt()).toBeNull();
    });
  });
});
