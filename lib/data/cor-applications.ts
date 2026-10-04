import { CorApplication, CorApplicationFilters, CorApplicationStatus } from "../types";
import { getSupabaseAdmin, isSupabaseConfigured } from "../supabase/server";
import { corEventsRepo } from "./cor-events";
import { corActivityRepo } from "./cor-activity";

let applicationsStore: CorApplication[] = [];

function mapApplicationFromSupabase(row: any): CorApplication {
  const profile = row.profiles || {};
  const opp = row.cor_opportunities || {};

  return {
    id: row.id,
    creatorId: row.candidate_id || row.creator_id,
    creatorName: profile.full_name || row.candidate_name || "Candidate",
    creatorEmail: profile.email || "",
    creatorAvatar: profile.profile_pic_url || "",
    creatorRole: profile.primary_medium || undefined,
    creatorSkills: [],
    corMemberId: row.cor_member_id || row.candidate_id,
    opportunityId: row.opportunity_id,
    opportunityTitle: opp.title || opp.role || "Role",
    company: opp.company || "Company",
    location: opp.location || "Remote",
    salary: opp.salary_range || opp.salary || "",
    workplaceType: opp.workplace_type || "Hybrid",
    jobUrl: opp.external_url || opp.job_url || undefined,
    recruiterContact: opp.recruiter_contact || undefined,
    status: (row.current_stage || row.status || "Recommended") as CorApplicationStatus,
    appliedDate: row.applied_date
      ? row.applied_date.split("T")[0]
      : row.created_at
      ? row.created_at.split("T")[0]
      : new Date().toISOString().split("T")[0],
    interviewDate: row.interview_date || undefined,
    consultant: row.consultant || "Career Operations",
    appliedBy: row.applied_by || undefined,
    appliedAt: row.applied_date || row.created_at || new Date().toISOString(),
    createdAt: row.created_at || new Date().toISOString(),
    updatedAt: row.updated_at || new Date().toISOString(),
  };
}

export const corApplicationsRepo = {
  /**
   * List COR applications from live database
   */
  async list(filters?: CorApplicationFilters): Promise<CorApplication[]> {
    const supabase = getSupabaseAdmin();
    if (supabase) {
      try {
        let query = (supabase.from("cor_applications") as any).select(`
          *,
          profiles:candidate_id (
            id, full_name, email, profile_pic_url
          ),
          cor_opportunities:opportunity_id (
            id, title, role, company, location, salary_range, workplace_type, external_url, recruiter_contact
          )
        `);

        if (filters?.status && filters.status !== "all") {
          query = query.eq("current_stage", filters.status);
        }

        const { data, error } = await query.order("created_at", { ascending: false });

        if (!error && Array.isArray(data)) {
          let list = data.map(mapApplicationFromSupabase);

          if (filters?.company) {
            const comp = filters.company.toLowerCase();
            list = list.filter((a: CorApplication) => a.company.toLowerCase().includes(comp));
          }

          if (filters?.candidate) {
            const cand = filters.candidate.toLowerCase();
            list = list.filter((a: CorApplication) => a.creatorName.toLowerCase().includes(cand));
          }

          if (filters?.query) {
            const q = filters.query.toLowerCase().trim();
            list = list.filter(
              (a: CorApplication) =>
                a.creatorName.toLowerCase().includes(q) ||
                a.company.toLowerCase().includes(q) ||
                a.opportunityTitle.toLowerCase().includes(q) ||
                a.consultant.toLowerCase().includes(q) ||
                (a.location && a.location.toLowerCase().includes(q))
            );
          }

          return list;
        } else if (error) {
          console.error("Supabase cor_applications fetch error:", error);
        }
      } catch (err) {
        console.error("Supabase cor_applications query failed:", err);
      }
    }

    if (isSupabaseConfigured()) {
      return [];
    }

    let result = [...applicationsStore];
    if (filters?.status && filters.status !== "all") {
      result = result.filter((a) => a.status === filters.status);
    }
    return result;
  },

  /**
   * Retrieve a single application by ID
   */
  async getById(id: string): Promise<CorApplication | null> {
    const supabase = getSupabaseAdmin();
    if (supabase) {
      try {
        const { data, error } = await (supabase.from("cor_applications") as any)
          .select(`
            *,
            profiles:candidate_id (
              id, full_name, email, profile_pic_url
            ),
            cor_opportunities:opportunity_id (
              id, title, role, company, location, salary_range, workplace_type, external_url, recruiter_contact
            )
          `)
          .eq("id", id)
          .maybeSingle();

        if (!error && data) {
          return mapApplicationFromSupabase(data);
        }
      } catch (err) {
        console.error("Supabase cor_applications getById failed:", err);
      }
    }

    if (isSupabaseConfigured()) {
      return null;
    }

    const app = applicationsStore.find((a) => a.id === id);
    return app ? { ...app } : null;
  },

  /**
   * List applications for a specific creator
   */
  async getByCreatorId(creatorId: string): Promise<CorApplication[]> {
    const list = await this.list();
    return list.filter((a) => a.creatorId === creatorId);
  },

  /**
   * List applications for a specific COR member
   */
  async getByMemberId(memberId: string): Promise<CorApplication[]> {
    const list = await this.list();
    return list.filter((a) => a.corMemberId === memberId || a.creatorId === memberId);
  },

  /**
   * Helper alias to create application resolving member and opportunity details automatically
   */
  async create(data: {
    creatorId: string;
    corMemberId: string;
    opportunityId: string;
    status?: CorApplicationStatus;
    consultant?: string;
    appliedBy?: string;
    notes?: string;
    adminNote?: string;
  }): Promise<CorApplication> {
    const { corMembersRepo } = await import("./cor-members");
    const { corOpportunitiesRepo } = await import("./cor-opportunities");

    const [member, opp] = await Promise.all([
      corMembersRepo.getById(data.corMemberId) || corMembersRepo.getByCreatorId(data.creatorId),
      corOpportunitiesRepo.getById(data.opportunityId),
    ]);

    return this.createApplication({
      creatorId: data.creatorId,
      creatorName: member?.name || member?.creatorName || "Candidate",
      creatorEmail: member?.creatorEmail,
      creatorAvatar: member?.creatorAvatar,
      corMemberId: data.corMemberId,
      opportunityId: data.opportunityId,
      opportunityTitle: opp?.title || "Role",
      company: opp?.company || "Company",
      location: opp?.location,
      salary: opp?.salary,
      workplaceType: opp?.workplaceType,
      jobUrl: opp?.jobUrl,
      recruiterContact: opp?.recruiterContact,
      initialStatus: data.status || "Recommended",
      consultant: data.consultant || "Career Operations",
      appliedBy: data.appliedBy,
      adminNote: data.notes || data.adminNote,
    });
  },

  /**
   * Admin applies for a member to an opportunity
   */
  async createApplication(data: {
    creatorId: string;
    creatorName: string;
    creatorEmail?: string;
    creatorAvatar?: string;
    corMemberId: string;
    opportunityId: string;
    opportunityTitle: string;
    company: string;
    location?: string;
    salary?: string;
    workplaceType?: string;
    jobUrl?: string;
    recruiterContact?: string;
    initialStatus?: CorApplicationStatus;
    appliedDate?: string;
    interviewDate?: string;
    consultant?: string;
    appliedBy?: string;
    appliedByName?: string;
    adminNote?: string;
  }): Promise<CorApplication> {
    const now = new Date().toISOString();
    const today = data.appliedDate || now.split("T")[0];
    const status: CorApplicationStatus = data.initialStatus || "Recommended";
    const consultant = data.consultant || data.appliedByName || "Career Operations";

    const newApp: CorApplication = {
      id: `cor_app_${Date.now()}`,
      creatorId: data.creatorId,
      creatorName: data.creatorName,
      creatorEmail: data.creatorEmail || "",
      creatorAvatar: data.creatorAvatar || "",
      corMemberId: data.corMemberId,
      opportunityId: data.opportunityId,
      opportunityTitle: data.opportunityTitle,
      company: data.company,
      location: data.location || "",
      salary: data.salary || "",
      workplaceType: data.workplaceType || "Remote",
      jobUrl: data.jobUrl || undefined,
      recruiterContact: data.recruiterContact || undefined,
      status,
      appliedDate: today,
      interviewDate: data.interviewDate || undefined,
      consultant,
      appliedBy: data.appliedBy || undefined,
      appliedAt: now,
      createdAt: now,
      updatedAt: now,
    };

    const supabase = getSupabaseAdmin();
    if (supabase) {
      try {
        const { data: inserted, error } = await (supabase.from("cor_applications") as any).insert({
          candidate_id: data.creatorId,
          opportunity_id: data.opportunityId,
          current_stage: status,
          applied_date: today,
          interview_date: data.interviewDate || null,
          applied_by: data.appliedBy || null,
          consultant,
          internal_notes: data.adminNote || null,
        }).select().single();

        if (!error && inserted) {
          newApp.id = inserted.id;
        }
      } catch (err) {
        console.error("Supabase cor_applications insert failed:", err);
      }
    }

    applicationsStore.unshift(newApp);

    // Automatically create initial timeline event
    await corEventsRepo.create({
      applicationId: newApp.id,
      previousStatus: undefined,
      newStatus: status,
      changedBy: data.appliedBy,
      changedByName: consultant,
      note: data.adminNote || `Opportunity matched and application initiated for ${data.creatorName} at ${data.company}.`,
      scheduledDate: data.interviewDate,
    });

    // Automatically create activity record
    await corActivityRepo.log({
      creatorId: data.creatorId,
      corMemberId: data.corMemberId,
      applicationId: newApp.id,
      actionType: "application_created",
      description: `Application initiated for ${data.creatorName} at ${data.company} (${data.opportunityTitle}).`,
      actorId: data.appliedBy,
      actorName: consultant,
    });

    return newApp;
  },

  /**
   * Update Application Status (Interactive Dropdown & Workflow)
   */
  async updateStatus(
    id: string,
    newStatus: CorApplicationStatus,
    adminId?: string,
    adminName = "Career Operations",
    note?: string,
    scheduledDate?: string
  ): Promise<CorApplication | null> {
    const current = await this.getById(id);
    if (!current) return null;

    const previousStatus = current.status;
    const now = new Date().toISOString();

    const supabase = getSupabaseAdmin();
    if (supabase) {
      try {
        await (supabase.from("cor_applications") as any)
          .update({
            current_stage: newStatus,
            interview_date: scheduledDate || current.interviewDate || null,
            updated_at: now,
          })
          .eq("id", id);
      } catch (err) {
        console.error("Supabase cor_applications updateStatus failed:", err);
      }
    }

    const idx = applicationsStore.findIndex((a) => a.id === id);
    if (idx !== -1) {
      applicationsStore[idx] = {
        ...applicationsStore[idx],
        status: newStatus,
        interviewDate: scheduledDate || applicationsStore[idx].interviewDate,
        updatedAt: now,
      };
    }

    // Record immutable timeline event
    await corEventsRepo.create({
      applicationId: id,
      previousStatus,
      newStatus,
      changedBy: adminId,
      changedByName: adminName,
      note: note || `Application status changed from ${previousStatus} to ${newStatus}.`,
      scheduledDate,
    });

    // Log Activity
    await corActivityRepo.log({
      creatorId: current.creatorId,
      corMemberId: current.corMemberId,
      applicationId: id,
      actionType: "status_changed",
      description: `Application for ${current.creatorName} at ${current.company} moved to '${newStatus}'.`,
      actorId: adminId,
      actorName: adminName,
    });

    return {
      ...current,
      status: newStatus,
      interviewDate: scheduledDate || current.interviewDate,
      updatedAt: now,
    };
  },
};
