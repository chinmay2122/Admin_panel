export interface AdminUser {
  id: string;
  name: string;
  email: string;
  role: "super_admin" | "admin" | "curator" | "moderator";
  avatarUrl?: string;
  lastLoginAt?: string;
}

export type UserPlan = "free" | "elite" | "pro" | null;
export type UserRole = "creator" | "collector";
export type UserStatus = "active" | "suspended";

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  plan: UserPlan;
  isCorMember: boolean;
  status: UserStatus;
  createdAt: string;
}

export type CreatorStatus = "active" | "pending" | "suspended";

export interface Creator {
  id: string;
  userId: string;
  name: string;
  discipline: string;
  plan: UserPlan;
  status: CreatorStatus;
  createdAt: string;
}

export type ArtworkStatus = "draft" | "pending" | "published" | "rejected";

export interface Artwork {
  id: string;
  title: string;
  creatorId: string;
  creatorName: string;
  medium: string;
  dimensions: string;
  price: number;
  imageUrl: string;
  status: ArtworkStatus;
  createdAt: string;
}

export type CorMemberStatus = "active" | "expired";

export interface CorMember {
  id: string;
  userId: string;
  name: string;
  joinedAt: string;
  status: CorMemberStatus;
}

export type JobStatus = "open" | "closed";

export interface Job {
  id: string;
  title: string;
  company: string;
  type: string;
  location: string;
  status: JobStatus;
  createdAt: string;
  applicantCount?: number;
}

export type ApplicationStatus = "pending" | "shortlisted" | "accepted" | "rejected";

export interface Application {
  id: string;
  jobId: string;
  jobTitle: string;
  creatorId: string;
  creatorName: string;
  status: ApplicationStatus;
  appliedAt: string;
}

// Filter and query types
export interface UserFilters {
  query?: string;
  role?: UserRole;
  plan?: "free" | "elite" | "pro";
  status?: UserStatus;
  isCorMember?: boolean;
}

export interface CreatorFilters {
  query?: string;
  discipline?: string;
  plan?: "free" | "elite" | "pro";
  status?: CreatorStatus;
}

export interface ArtworkFilters {
  query?: string;
  status?: ArtworkStatus;
  creatorId?: string;
  creatorName?: string;
  medium?: string;
  minPrice?: number;
  maxPrice?: number;
}

export interface CorFilters {
  query?: string;
  status?: CorMemberStatus;
}

export interface JobFilters {
  query?: string;
  status?: JobStatus;
  type?: string;
}

export interface ApplicationFilters {
  query?: string;
  jobId?: string;
  creatorId?: string;
  status?: ApplicationStatus;
}
