/**
 * Business Hours Entity Interface
 *
 * Defines the structure for business.business_hours table.
 *
 * @interface IBusinessHours
 */

export interface IBusinessHours {
  id: string;
  business_id: string;
  day_of_week: number;
  open_time: string;
  close_time: string;
  updated_at?: Date | null;
  deleted_at?: Date | null;
  id_creator?: string | null;
  id_updater?: string | null;
}
