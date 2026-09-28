export interface User {
  id: number;
  name: string;
  email: string;
  role: 'customer' | 'provider' | 'admin';
  phone?: string | null;
  created_at?: string;
}

export interface Vehicle {
  id: number;
  user_id: number;
  make: string;
  model: string;
  year: number;
  license_plate: string;
  fuel_type: string;
  image_url?: string | null;
  created_at: string;
  owner_name?: string;
  owner_email?: string;
}

export interface ServiceItem {
  id: number;
  name: string;
  description: string;
  base_price: number;
  estimated_duration_mins: number;
  is_active: boolean;
  created_at: string;
}

export type BookingStatus = 'Pending' | 'Confirmed' | 'In Progress' | 'Completed' | 'Cancelled';

export interface Booking {
  id: number;
  customer_id: number;
  vehicle_id: number;
  service_id: number;
  provider_id?: number | null;
  scheduled_date: string;
  time_slot: string;
  status: BookingStatus;
  notes?: string | null;
  created_at: string;
  updated_at: string;
  customer_name?: string;
  customer_email?: string;
  customer_phone?: string;
  provider_name?: string;
  vehicle_make?: string;
  vehicle_model?: string;
  vehicle_plate?: string;
  service_name?: string;
  service_price?: number;
}

export interface AWSArchitectureInfo {
  projectTitle: string;
  academicContext: string;
  awsServices: Array<{
    service: string;
    type: string;
    role: string;
    configured: boolean;
    activeDriver?: string;
    details: any;
  }>;
  environmentSummary: {
    nodeEnv: string;
    port: number | string;
    awsRegion: string;
    s3Bucket: string;
    databaseEngine: string;
  };
}
