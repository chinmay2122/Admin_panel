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
      cor_requests: {
        Row: {
          id: string;
          creator_id: string;
          status: "pending" | "approved" | "declined";
          current_role: string;
          current_company: string | null;
          experience_years: string | null;
          employment_status: string | null;
          desired_role: string;
          skills: string[];
          secondary_skills: string[] | null;
          specialization: string | null;
          education_degree: string | null;
          education_institution: string | null;
          education_year: string | null;
          experience_summary: string | null;
          work_history: Json | null;
          portfolio_url: string | null;
          linkedin_url: string | null;
          behance_url: string | null;
          github_url: string | null;
          website_url: string | null;
          resume_url: string | null;
          portfolio_docs: string[] | null;
          expected_salary: string | null;
          current_salary: string | null;
          opportunity_type: string | null;
          preferred_work_type: string | null;
          career_goals: string | null;
          additional_notes: string | null;
          admin_notes: string | null;
          decline_reason: string | null;
          approved_by: string | null;
          approved_at: string | null;
          declined_by: string | null;
          declined_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          creator_id: string;
          status?: "pending" | "approved" | "declined";
          current_role: string;
          current_company?: string | null;
          experience_years?: string | null;
          employment_status?: string | null;
          desired_role: string;
          skills?: string[];
          secondary_skills?: string[] | null;
          specialization?: string | null;
          education_degree?: string | null;
          education_institution?: string | null;
          education_year?: string | null;
          experience_summary?: string | null;
          work_history?: Json | null;
          portfolio_url?: string | null;
          linkedin_url?: string | null;
          behance_url?: string | null;
          github_url?: string | null;
          website_url?: string | null;
          resume_url?: string | null;
          portfolio_docs?: string[] | null;
          expected_salary?: string | null;
          current_salary?: string | null;
          opportunity_type?: string | null;
          preferred_work_type?: string | null;
          career_goals?: string | null;
          additional_notes?: string | null;
          admin_notes?: string | null;
          decline_reason?: string | null;
          approved_by?: string | null;
          approved_at?: string | null;
          declined_by?: string | null;
          declined_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          creator_id?: string;
          status?: "pending" | "approved" | "declined";
          current_role?: string;
          current_company?: string | null;
          experience_years?: string | null;
          employment_status?: string | null;
          desired_role?: string;
          skills?: string[];
          secondary_skills?: string[] | null;
          specialization?: string | null;
          education_degree?: string | null;
          education_institution?: string | null;
          education_year?: string | null;
          experience_summary?: string | null;
          work_history?: Json | null;
          portfolio_url?: string | null;
          linkedin_url?: string | null;
          behance_url?: string | null;
          github_url?: string | null;
          website_url?: string | null;
          resume_url?: string | null;
          portfolio_docs?: string[] | null;
          expected_salary?: string | null;
          current_salary?: string | null;
          opportunity_type?: string | null;
          preferred_work_type?: string | null;
          career_goals?: string | null;
          additional_notes?: string | null;
          admin_notes?: string | null;
          decline_reason?: string | null;
          approved_by?: string | null;
          approved_at?: string | null;
          declined_by?: string | null;
          declined_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      cor_members: {
        Row: {
          id: string;
          creator_id: string;
          user_id?: string | null;
          name?: string | null;
          request_id: string | null;
          status: "active" | "paused" | "completed" | "removed" | "expired";
          desired_role: string | null;
          skills: string[] | null;
          experience_years: string | null;
          preferred_work_type: string | null;
          internal_notes: string | null;
          career_strategy: string | null;
          approved_by: string | null;
          approved_at: string | null;
          joined_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          creator_id: string;
          user_id?: string | null;
          name?: string | null;
          request_id?: string | null;
          status?: "active" | "paused" | "completed" | "removed" | "expired";
          desired_role?: string | null;
          skills?: string[] | null;
          experience_years?: string | null;
          preferred_work_type?: string | null;
          internal_notes?: string | null;
          career_strategy?: string | null;
          approved_by?: string | null;
          approved_at?: string | null;
          joined_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          creator_id?: string;
          user_id?: string | null;
          name?: string | null;
          request_id?: string | null;
          status?: "active" | "paused" | "completed" | "removed" | "expired";
          desired_role?: string | null;
          skills?: string[] | null;
          experience_years?: string | null;
          preferred_work_type?: string | null;
          internal_notes?: string | null;
          career_strategy?: string | null;
          approved_by?: string | null;
          approved_at?: string | null;
          joined_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      cor_opportunities: {
        Row: {
          id: string;
          title: string;
          company: string;
          description: string | null;
          location: string;
          workplace_type: "Remote" | "Hybrid" | "Onsite";
          salary: string | null;
          required_skills: string[];
          experience_requirement: string | null;
          job_url: string | null;
          recruiter_name: string | null;
          recruiter_email: string | null;
          recruiter_contact: string | null;
          application_deadline: string | null;
          source: string | null;
          status: "open" | "paused" | "closed";
          created_by: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          title: string;
          company: string;
          description?: string | null;
          location: string;
          workplace_type?: "Remote" | "Hybrid" | "Onsite";
          salary?: string | null;
          required_skills?: string[];
          experience_requirement?: string | null;
          job_url?: string | null;
          recruiter_name?: string | null;
          recruiter_email?: string | null;
          recruiter_contact?: string | null;
          application_deadline?: string | null;
          source?: string | null;
          status?: "open" | "paused" | "closed";
          created_by?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          title?: string;
          company?: string;
          description?: string | null;
          location?: string;
          workplace_type?: "Remote" | "Hybrid" | "Onsite";
          salary?: string | null;
          required_skills?: string[];
          experience_requirement?: string | null;
          job_url?: string | null;
          recruiter_name?: string | null;
          recruiter_email?: string | null;
          recruiter_contact?: string | null;
          application_deadline?: string | null;
          source?: string | null;
          status?: "open" | "paused" | "closed";
          created_by?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      cor_applications: {
        Row: {
          id: string;
          creator_id: string;
          cor_member_id: string;
          opportunity_id: string;
          status:
            | "Recommended"
            | "Preparing Application"
            | "Applied"
            | "Screening"
            | "Interview"
            | "Final Round"
            | "Offer"
            | "Rejected";
          applied_date: string | null;
          interview_date: string | null;
          consultant: string;
          applied_by: string | null;
          applied_at: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          creator_id: string;
          cor_member_id: string;
          opportunity_id: string;
          status?:
            | "Recommended"
            | "Preparing Application"
            | "Applied"
            | "Screening"
            | "Interview"
            | "Final Round"
            | "Offer"
            | "Rejected";
          applied_date?: string | null;
          interview_date?: string | null;
          consultant?: string;
          applied_by?: string | null;
          applied_at?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          creator_id?: string;
          cor_member_id?: string;
          opportunity_id?: string;
          status?:
            | "Recommended"
            | "Preparing Application"
            | "Applied"
            | "Screening"
            | "Interview"
            | "Final Round"
            | "Offer"
            | "Rejected";
          applied_date?: string | null;
          interview_date?: string | null;
          consultant?: string;
          applied_by?: string | null;
          applied_at?: string;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      cor_application_events: {
        Row: {
          id: string;
          application_id: string;
          previous_status: string | null;
          new_status: string;
          changed_by: string | null;
          changed_by_name: string;
          note: string | null;
          scheduled_date: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          application_id: string;
          previous_status?: string | null;
          new_status: string;
          changed_by?: string | null;
          changed_by_name?: string;
          note?: string | null;
          scheduled_date?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          application_id?: string;
          previous_status?: string | null;
          new_status?: string;
          changed_by?: string | null;
          changed_by_name?: string;
          note?: string | null;
          scheduled_date?: string | null;
          created_at?: string;
        };
        Relationships: [];
      };
      cor_admin_notes: {
        Row: {
          id: string;
          cor_member_id: string | null;
          application_id: string | null;
          author_id: string | null;
          author_name: string;
          content: string;
          is_internal_only: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          cor_member_id?: string | null;
          application_id?: string | null;
          author_id?: string | null;
          author_name: string;
          content: string;
          is_internal_only?: boolean;
          created_at?: string;
        };
        Update: {
          id?: string;
          cor_member_id?: string | null;
          application_id?: string | null;
          author_id?: string | null;
          author_name?: string;
          content?: string;
          is_internal_only?: boolean;
          created_at?: string;
        };
        Relationships: [];
      };
      cor_activity: {
        Row: {
          id: string;
          creator_id: string | null;
          cor_member_id: string | null;
          application_id: string | null;
          action_type: string;
          description: string;
          actor_id: string | null;
          actor_name: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          creator_id?: string | null;
          cor_member_id?: string | null;
          application_id?: string | null;
          action_type: string;
          description: string;
          actor_id?: string | null;
          actor_name?: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          creator_id?: string | null;
          cor_member_id?: string | null;
          application_id?: string | null;
          action_type?: string;
          description?: string;
          actor_id?: string | null;
          actor_name?: string;
          created_at?: string;
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
