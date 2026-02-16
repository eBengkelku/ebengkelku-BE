/**
 * Business Entity Interface
 *
 * Defines the database schema structure for business.businesses table.
 * Uses snake_case to match the database.
 *
 * @interface IBusiness
 */

import { BusinessStatus } from '../contracts/business-status.enum';

export interface IBusiness {
  id: string;
  owner_id: string;
  name: string;
  tagline?: string | null;
  status: BusinessStatus;
  phone?: string | null;
  image?: string | null;
  cover_image?: string | null;
  latitude?: string | null;
  longitude?: string | null;
  address?: string | null;
  created_at: Date;
  updated_at?: Date | null;
  deleted_at?: Date | null;
  id_creator?: string | null;
  id_updater?: string | null;
}
