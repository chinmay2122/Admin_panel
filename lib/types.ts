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

export interface CreatorFilters {
  query?: string;
  discipline?: string;
  plan?: UserPlan | "all";
  status?: CreatorStatus | "all";
}

export type CollectorStatus = "active" | "pending" | "suspended";

export interface Collector {
  id: string;
  userId: string;
  name: string;
  email?: string;
  phoneNumber?: string;
  location?: string;
  aboutMe?: string;
  profilePicUrl?: string;
  preferences?: string;
  plan: UserPlan;
  status: CollectorStatus;
  createdAt: string;
}

export interface CollectorFilters {
  query?: string;
  preferences?: string;
  plan?: UserPlan | "all";
  status?: CollectorStatus | "all";
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

export type CorMemberStatus = "active" | "paused" | "completed" | "removed" | "expired";

export interface CorMember {
  id: string;
  creatorId?: string;
  userId?: string;
  name: string;
  creatorName?: string;
  creatorEmail?: string;
  creatorAvatar?: string;
  location?: string;
  desiredRole?: string;
  skills?: string[];
  experienceYears?: string;
  preferredWorkType?: string;
  requestId?: string;
  joinedAt: string;
  status: CorMemberStatus;
  approvedBy?: string;
  approvedAt?: string;
  internalNotes?: string;
  careerStrategy?: string;
  activeApplicationsCount?: number;
  latestApplicationStatus?: CorApplicationStatus;
  lastActivityAt?: string;
}

export type CorRequestStatus = "pending" | "approved" | "declined";

export interface CorRequestEducation {
  degree?: string;
  institution?: string;
  year?: string;
}

export interface CorRequestWorkItem {
  company: string;
  role: string;
  dates: string;
  responsibilities: string;
}

export interface CorRequestLinks {
  portfolio?: string;
  linkedin?: string;
  behance?: string;
  github?: string;
  website?: string;
}

export interface CorRequestDocuments {
  resumeUrl?: string;
  portfolioUrl?: string;
}

export interface CorRequestGoals {
  expectedSalary?: string;
  currentSalary?: string;
  desiredRole?: string;
  opportunityType?: string;
  preferredWorkType?: string;
  additionalNotes?: string;
}

export interface CorRequest {
  id: string;
  creatorId: string;
  creatorName: string;
  creatorEmail: string;
  creatorAvatar?: string;
  location?: string;
  phone?: string;
  currentRole: string;
  currentCompany?: string;
  experienceYears: string;
  employmentStatus?: string;
  desiredRole: string;
  skills: string[];
  secondarySkills?: string[];
  specialization?: string;
  education?: CorRequestEducation;
  experienceSummary?: string;
  workHistory?: CorRequestWorkItem[];
  links?: CorRequestLinks;
  documents?: CorRequestDocuments;
  careerGoals?: CorRequestGoals;
  status: CorRequestStatus;
  adminNotes?: string;
  declineReason?: string;
  approvedBy?: string;
  approvedAt?: string;
  declinedBy?: string;
  declinedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export type CorOpportunityWorkplaceType = "Remote" | "Hybrid" | "Onsite";
export type CorOpportunityStatus = "open" | "paused" | "closed";

export interface CorOpportunity {
  id: string;
  title: string;
  company: string;
  description: string;
  location: string;
  workplaceType: CorOpportunityWorkplaceType;
  salary: string;
  requiredSkills: string[];
  experienceRequirement: string;
  jobUrl?: string;
  recruiterName?: string;
  recruiterEmail?: string;
  recruiterContact?: string;
  applicationDeadline?: string;
  source?: string;
  status: CorOpportunityStatus;
  createdBy?: string;
  createdAt: string;
  updatedAt: string;
  appliedCandidatesCount?: number;
}

export type CorApplicationStatus =
  | "Recommended"
  | "Preparing Application"
  | "Applied"
  | "Screening"
  | "Interview"
  | "Final Round"
  | "Offer"
  | "Rejected";

export interface CorApplication {
  id: string;
  creatorId: string;
  creatorName: string;
  creatorEmail: string;
  creatorAvatar?: string;
  creatorRole?: string;
  creatorSkills?: string[];
  corMemberId: string;
  opportunityId: string;
  opportunityTitle: string;
  company: string;
  location?: string;
  salary?: string;
  workplaceType?: string;
  jobUrl?: string;
  recruiterContact?: string;
  status: CorApplicationStatus;
  appliedDate: string;
  interviewDate?: string;
  consultant: string;
  appliedBy?: string;
  appliedAt: string;
  createdAt: string;
  updatedAt: string;
}

export interface CorApplicationEvent {
  id: string;
  applicationId: string;
  previousStatus?: string;
  newStatus: CorApplicationStatus;
  changedBy?: string;
  changedByName: string;
  note?: string;
  scheduledDate?: string;
  createdAt: string;
}

export interface CorAdminNote {
  id: string;
  corMemberId?: string;
  applicationId?: string;
  authorId?: string;
  authorName: string;
  content: string;
  isInternalOnly: boolean;
  createdAt: string;
}

export interface CorActivity {
  id: string;
  creatorId?: string;
  corMemberId?: string;
  applicationId?: string;
  actionType: string;
  description: string;
  actorId?: string;
  actorName?: string;
  createdAt: string;
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

export type ApplicationStatus =
  | "pending"
  | "shortlisted"
  | "accepted"
  | "rejected"
  | CorApplicationStatus;

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
  status?: CorMemberStatus | "all";
}

export interface CorRequestFilters {
  query?: string;
  status?: CorRequestStatus | "all";
  role?: string;
}

export interface CorOpportunityFilters {
  query?: string;
  status?: CorOpportunityStatus | "all";
  workplaceType?: string;
}

export interface CorApplicationFilters {
  query?: string;
  status?: CorApplicationStatus | "all";
  company?: string;
  candidate?: string;
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
