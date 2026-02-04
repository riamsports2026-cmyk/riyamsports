import { Database } from './database';

export type Profile = Database['public']['Tables']['profiles']['Row'];
export type Role = Database['public']['Tables']['roles']['Row'];
export type UserRole = Database['public']['Tables']['user_roles']['Row'];
export type EmployeeLocation = Database['public']['Tables']['employee_locations']['Row'];
export type UserRoleLocation = Database['public']['Tables']['user_role_locations']['Row'];
export type Location = Database['public']['Tables']['locations']['Row'];
export type Service = Database['public']['Tables']['services']['Row'];
export type Turf = Database['public']['Tables']['turfs']['Row'];
export type HourlyPricing = Database['public']['Tables']['hourly_pricing']['Row'];
export type Booking = Database['public']['Tables']['bookings']['Row'];
export type BookingSlot = Database['public']['Tables']['booking_slots']['Row'];
export type Payment = Database['public']['Tables']['payments']['Row'];

export type UserRoleName = Role['name'];

export interface BookingWithDetails extends Booking {
  turf: Turf & {
    location: Location;
    service: Service;
  };
  slots: BookingSlot[];
  payments?: Payment[];
}

export interface TurfWithDetails extends Turf {
  location: Location;
  service: Service;
  pricing: HourlyPricing[];
}

