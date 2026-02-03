export interface IService {
  id: string;
  business_id: string;
  name: string;
  description?: string | null;
  price: number;
  duration_minutes?: number | null;
  daily_quota?: number | null;
  id_creator: string;
  created_at: Date;
  updated_at?: Date | null;
  deleted_at?: Date | null;
}

/**
 * Service creation interface
 */
export interface IServiceCreate {
  id: string;
  business_id: string;
  name: string;
  description?: string | null;
  price: number;
  duration_minutes?: number | null;
  daily_quota?: number | null;
  id_creator: string;
  created_at: Date;
}

/**
 * Service update interface
 */
export interface IServiceUpdate {
  name?: string;
  description?: string | null;
  price?: number;
  duration_minutes?: number | null;
  daily_quota?: number | null;
  updated_at?: Date;
}

/**
 * Service query filters interface
 */
export interface IServiceFilters {
  business_id?: string;
  name?: string;
  price_min?: number;
  price_max?: number;
  duration_min?: number;
  duration_max?: number;
  is_active?: boolean;
}
