export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          full_name: string | null;
          mobile_number: string | null;
          profile_image: string | null;
          created_at: string;
        };
        Insert: {
          id: string;
          full_name?: string | null;
          mobile_number?: string | null;
          profile_image?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          full_name?: string | null;
          mobile_number?: string | null;
          profile_image?: string | null;
          created_at?: string;
        };
      };
      roles: {
        Row: {
          id: string;
          name: string;
          description: string | null;
          is_system_role: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          description?: string | null;
          is_system_role?: boolean;
          created_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          description?: string | null;
          is_system_role?: boolean;
          created_at?: string;
        };
      };
      user_roles: {
        Row: {
          id: string;
          user_id: string;
          role_id: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          role_id: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          role_id?: string;
          created_at?: string;
        };
      };
      employee_locations: {
        Row: {
          id: string;
          employee_id: string;
          location_id: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          employee_id: string;
          location_id: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          employee_id?: string;
          location_id?: string;
          created_at?: string;
        };
      };
      user_role_locations: {
        Row: {
          id: string;
          user_id: string;
          role_id: string;
          location_id: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          role_id: string;
          location_id: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          role_id?: string;
          location_id?: string;
          created_at?: string;
        };
      };
      locations: {
        Row: {
          id: string;
          name: string;
          address: string;
          city: string;
          state: string;
          pincode: string;
          is_active: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          address: string;
          city: string;
          state: string;
          pincode: string;
          is_active?: boolean;
          created_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          address?: string;
          city?: string;
          state?: string;
          pincode?: string;
          is_active?: boolean;
          created_at?: string;
        };
      };
      services: {
        Row: {
          id: string;
          name: string;
          description: string | null;
          image_url: string | null;
          is_active: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          description?: string | null;
          image_url?: string | null;
          is_active?: boolean;
          created_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          description?: string | null;
          image_url?: string | null;
          is_active?: boolean;
          created_at?: string;
        };
      };
      turfs: {
        Row: {
          id: string;
          location_id: string;
          service_id: string;
          name: string;
          is_available: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          location_id: string;
          service_id: string;
          name: string;
          is_available?: boolean;
          created_at?: string;
        };
        Update: {
          id?: string;
          location_id?: string;
          service_id?: string;
          name?: string;
          is_available?: boolean;
          created_at?: string;
        };
      };
      hourly_pricing: {
        Row: {
          id: string;
          turf_id: string;
          hour: number;
          price: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          turf_id: string;
          hour: number;
          price: number;
          created_at?: string;
        };
        Update: {
          id?: string;
          turf_id?: string;
          hour?: number;
          price?: number;
          created_at?: string;
        };
      };
      service_hourly_pricing: {
        Row: {
          id: string;
          service_id: string;
          hour: number;
          price: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          service_id: string;
          hour: number;
          price: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          service_id?: string;
          hour?: number;
          price?: number;
          created_at?: string;
          updated_at?: string;
        };
      };
      bookings: {
        Row: {
          id: string;
          booking_id: string;
          user_id: string;
          turf_id: string;
          booking_date: string;
          total_amount: number;
          advance_amount: number;
          received_amount: number;
          payment_status: 'pending_payment' | 'partial' | 'paid' | 'refunded';
          booking_status: 'pending_payment' | 'confirmed' | 'completed' | 'cancelled';
          payment_gateway: 'razorpay' | 'payglobal' | null;
          payment_gateway_order_id: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          booking_id?: string;
          user_id: string;
          turf_id: string;
          booking_date: string;
          total_amount: number;
          advance_amount: number;
          received_amount?: number;
          payment_status?: 'pending_payment' | 'partial' | 'paid' | 'refunded';
          booking_status?: 'pending_payment' | 'confirmed' | 'completed' | 'cancelled';
          payment_gateway?: 'razorpay' | 'payglobal' | null;
          payment_gateway_order_id?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          booking_id?: string;
          user_id?: string;
          turf_id?: string;
          booking_date?: string;
          total_amount?: number;
          advance_amount?: number;
          received_amount?: number;
          payment_status?: 'pending_payment' | 'partial' | 'paid' | 'refunded';
          booking_status?: 'pending_payment' | 'confirmed' | 'completed' | 'cancelled';
          payment_gateway?: 'razorpay' | 'payglobal' | null;
          payment_gateway_order_id?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      booking_slots: {
        Row: {
          id: string;
          booking_id: string;
          hour: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          booking_id: string;
          hour: number;
          created_at?: string;
        };
        Update: {
          id?: string;
          booking_id?: string;
          hour?: number;
          created_at?: string;
        };
      };
      payments: {
        Row: {
          id: string;
          booking_id: string;
          amount: number;
          payment_type: 'advance' | 'full' | 'remaining' | 'manual';
          payment_gateway: 'razorpay' | 'payglobal' | 'manual';
          gateway_order_id: string;
          gateway_payment_id: string | null;
          payment_method: 'online' | 'cash' | 'manual';
          notes: string | null;
          status: 'pending' | 'success' | 'failed' | 'refunded';
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          booking_id: string;
          amount: number;
          payment_type: 'advance' | 'full' | 'remaining' | 'manual';
          payment_gateway: 'razorpay' | 'payglobal' | 'manual';
          gateway_order_id: string;
          gateway_payment_id?: string | null;
          payment_method?: 'online' | 'cash' | 'manual';
          notes?: string | null;
          status?: 'pending' | 'success' | 'failed' | 'refunded';
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          booking_id?: string;
          amount?: number;
          payment_type?: 'advance' | 'full' | 'remaining' | 'manual';
          payment_gateway?: 'razorpay' | 'payglobal' | 'manual';
          gateway_order_id?: string;
          gateway_payment_id?: string | null;
          payment_method?: 'online' | 'cash' | 'manual';
          notes?: string | null;
          status?: 'pending' | 'success' | 'failed' | 'refunded';
          created_at?: string;
          updated_at?: string;
        };
      };
    };
  };
};

