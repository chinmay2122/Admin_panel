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
  year?: string;
  location?: string;
  collection?: string;
  description?: string;
  isFeatured?: boolean;
  isFlagged?: boolean;
  availability?: string;
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
  description?: string;
  requirements?: string;
  status: JobStatus;
  isProOnly?: boolean;
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
  candidateId?: string;
  candidateName?: string;
  candidatePlan?: UserPlan;
  status: ApplicationStatus;
  coverLetter?: string;
  portfolioUrl?: string;
  resumeUrl?: string;
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
  isProOnly?: boolean;
}

export interface ApplicationFilters {
  query?: string;
  jobId?: string;
  creatorId?: string;
  status?: ApplicationStatus;
}

export type ReportStatus = "pending" | "resolved" | "dismissed";

export type ReportReason =
  | "Inappropriate content"
  | "Copyright infringement"
  | "Possible copyright infringement"
  | "Incorrect artwork information"
  | "Harassment or offensive content"
  | "Spam or misleading content"
  | "Fraud or scam"
  | "Stolen artwork"
  | "Other";

export interface Report {
  id: string;
  artworkId: string;
  reporterUserId: string;
  artworkOwnerId?: string;
  reason: string;
  details?: string;
  status: ReportStatus;
  createdAt: string;
  updatedAt?: string;
  resolvedAt?: string;
  resolvedBy?: string;
  moderationAction?: string;
  moderationNote?: string;

  // Joined / resolved presentation fields
  artworkTitle?: string;
  artworkImageUrl?: string;
  artworkMedium?: string;
  artworkDimensions?: string;
  artworkStatus?: ArtworkStatus;
  artworkPrice?: number;
  ownerName?: string;
  ownerEmail?: string;
  reporterName?: string;
  reporterEmail?: string;
}

export interface ReportFilters {
  query?: string;
  status?: ReportStatus | "all";
}

export interface ModerationAuditLog {
  id: string;
  reportId?: string;
  artworkId?: string;
  targetUserId?: string;
  adminId?: string;
  action: "report_created" | "report_dismissed" | "report_resolved" | "artwork_hidden" | "artwork_removed" | "user_suspended";
  note?: string;
  createdAt: string;
}

export interface PlatformSettings {
  id: string;
  freeArtworkLimit: number;
  liteArtworkLimit: number;
  proArtworkLimit: number;
  inviteRequestLimit: number;
  corEnabled: boolean;
  featuredCreatorControlsEnabled: boolean;
  moderationSettingsEnabled: boolean;
  platformAnnouncement: string;
  defaultProfileVisibility: "public" | "private";
  updatedAt?: string;
  updatedBy?: string;
}

export interface SettingsAuditLog {
  id: string;
  adminId: string;
  changedSettings: Record<string, { previous: any; current: any }>;
  createdAt: string;
}
