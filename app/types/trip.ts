export type TripStatus = 'available' | 'full' | 'completed';

export interface Trip {
  id: string;
  title: string;
  country: string;
  image_url: string;
  status: TripStatus;
  created_at: string;
  updated_at: string;
}

export interface UserTravelAlert {
  id: string;
  user_id: string;
  alerts_enabled: boolean;
  created_at: string;
  updated_at: string;
}