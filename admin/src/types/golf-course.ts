export interface GolfCourse {
  id: string;
  name: string;
  city: string | null;
  postal_code: string | null;
  department: string | null;
  phone: string | null;
  email: string | null;
  website: string | null;
  latitude: number | null;
  longitude: number | null;
  holes_count: number | null;
  description: string | null;
  created_at: string;
  updated_at: string;
}