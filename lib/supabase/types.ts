export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          full_name: string;
          email: string;
          phone_number: string | null;
          role: "Admin" | "User" | "Creator";
          plan: "free" | "pro" | "elite";
          location_country: string | null;
          location_city: string | null;
          portfolio_url: string | null;
          about_me: string | null;
          profile_pic_url: string | null;
          social_links: Json | null;
          is_premium: boolean;
          created_at: string;
          cover_image_url: string | null;
          primary_medium: string | null;
          artist_statement: string | null;
          art_forms: string | null;
          awards: string | null;
          other_links: string | null;
        };
        Insert: {
          id: string;
          full_name: string;
          email: string;
          phone_number?: string | null;
          role?: "Admin" | "User" | "Creator";
          plan?: "free" | "pro" | "elite";
          location_country?: string | null;
          location_city?: string | null;
          portfolio_url?: string | null;
          about_me?: string | null;
          profile_pic_url?: string | null;
          social_links?: Json | null;
          is_premium?: boolean;
          created_at?: string;
          cover_image_url?: string | null;
          primary_medium?: string | null;
          artist_statement?: string | null;
          art_forms?: string | null;
          awards?: string | null;
          other_links?: string | null;
        };
        Update: {
          id?: string;
          full_name?: string;
          email?: string;
          phone_number?: string | null;
          role?: "Admin" | "User" | "Creator";
          plan?: "free" | "pro" | "elite";
          location_country?: string | null;
          location_city?: string | null;
          portfolio_url?: string | null;
          about_me?: string | null;
          profile_pic_url?: string | null;
          social_links?: Json | null;
          is_premium?: boolean;
          created_at?: string;
          cover_image_url?: string | null;
          primary_medium?: string | null;
          artist_statement?: string | null;
          art_forms?: string | null;
          awards?: string | null;
          other_links?: string | null;
        };
        Relationships: [];
      };
      artworks: {
        Row: {
          id: string;
          creator_id: string;
          title: string;
          art_type: string;
          artist_name: string;
          description: string | null;
          external_link: string | null;
          image_url: string;
          price: number | null;
          status: string;
          created_at: string;
          additional_images: string[] | null;
          year: string | null;
          dimensions: string | null;
          location: string | null;
          style: string | null;
          tags: string[] | null;
          collection: string | null;
          price_visibility: string | null;
          is_published: boolean;
        };
        Insert: {
          id?: string;
          creator_id: string;
          title: string;
          art_type?: string;
          artist_name: string;
          description?: string | null;
          external_link?: string | null;
          image_url: string;
          price?: number | null;
          status?: string;
          created_at?: string;
          additional_images?: string[] | null;
          year?: string | null;
          dimensions?: string | null;
          location?: string | null;
          style?: string | null;
          tags?: string[] | null;
          collection?: string | null;
          price_visibility?: string | null;
          is_published?: boolean;
        };
        Update: {
          id?: string;
          creator_id?: string;
          title?: string;
          art_type?: string;
          artist_name?: string;
          description?: string | null;
          external_link?: string | null;
          image_url?: string;
          price?: number | null;
          status?: string;
          created_at?: string;
          additional_images?: string[] | null;
          year?: string | null;
          dimensions?: string | null;
          location?: string | null;
          style?: string | null;
          tags?: string[] | null;
          collection?: string | null;
          price_visibility?: string | null;
          is_published?: boolean;
        };
        Relationships: [];
      };
      inquiries_chats: {
        Row: {
          id: string;
          artwork_id: string;
          guest_id: string;
          creator_id: string;
          status: "Active" | "Closed";
          created_at: string;
        };
        Insert: {
          id?: string;
          artwork_id: string;
          guest_id: string;
          creator_id: string;
          status?: "Active" | "Closed";
          created_at?: string;
        };
        Update: {
          id?: string;
          artwork_id?: string;
          guest_id?: string;
          creator_id?: string;
          status?: "Active" | "Closed";
          created_at?: string;
        };
        Relationships: [];
      };
      messages: {
        Row: {
          id: string;
          chat_id: string;
          sender_id: string;
          content: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          chat_id: string;
          sender_id: string;
          content: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          chat_id?: string;
          sender_id?: string;
          content?: string;
          created_at?: string;
        };
        Relationships: [];
      };
      cor_members: {
        Row: {
          id: string;
          user_id: string | null;
          name: string;
          status: "active" | "expired";
          joined_at: string;
        };
        Insert: {
          id?: string;
          user_id?: string | null;
          name: string;
          status?: "active" | "expired";
          joined_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string | null;
          name?: string;
          status?: "active" | "expired";
          joined_at?: string;
        };
        Relationships: [];
      };
      jobs: {
        Row: {
          id: string;
          title: string;
          company: string;
          type: string;
          location: string;
          description: string | null;
          requirements: string | null;
          status: "open" | "closed";
          is_pro_only: boolean;
          created_by: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          title: string;
          company: string;
          type?: string;
          location: string;
          description?: string | null;
          requirements?: string | null;
          status?: "open" | "closed";
          is_pro_only?: boolean;
          created_by?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          title?: string;
          company?: string;
          type?: string;
          location?: string;
          description?: string | null;
          requirements?: string | null;
          status?: "open" | "closed";
          is_pro_only?: boolean;
          created_by?: string | null;
          created_at?: string;
        };
        Relationships: [];
      };
      job_applications: {
        Row: {
          id: string;
          job_id: string;
          candidate_id: string;
          status: "pending" | "shortlisted" | "accepted" | "rejected";
          cover_letter: string | null;
          portfolio_url: string | null;
          resume_url: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          job_id: string;
          candidate_id: string;
          status?: "pending" | "shortlisted" | "accepted" | "rejected";
          cover_letter?: string | null;
          portfolio_url?: string | null;
          resume_url?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          job_id?: string;
          candidate_id?: string;
          status?: "pending" | "shortlisted" | "accepted" | "rejected";
          cover_letter?: string | null;
          portfolio_url?: string | null;
          resume_url?: string | null;
          created_at?: string;
        };
        Relationships: [];
      };
      applications: {
        Row: {
          id: string;
          job_id: string;
          job_title: string;
          creator_id: string | null;
          creator_name: string;
          status: "pending" | "shortlisted" | "accepted" | "rejected";
          applied_at: string;
        };
        Insert: {
          id?: string;
          job_id: string;
          job_title: string;
          creator_id?: string | null;
          creator_name: string;
          status?: "pending" | "shortlisted" | "accepted" | "rejected";
          applied_at?: string;
        };
        Update: {
          id?: string;
          job_id?: string;
          job_title?: string;
          creator_id?: string | null;
          creator_name?: string;
          status?: "pending" | "shortlisted" | "accepted" | "rejected";
          applied_at?: string;
        };
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
};
