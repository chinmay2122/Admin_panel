import { CorRequest, CorRequestFilters } from "../types";
import { getSupabaseAdmin, isSupabaseConfigured } from "../supabase/server";
import { corActivityRepo } from "./cor-activity";

let requestsStore: CorRequest[] = [];

function mapRequestFromSupabase(row: any): CorRequest {
  const profile = row.profiles || {};
  let status: "pending" | "approved" | "declined" = "pending";
  if (row.status === "active" || row.status === "approved") {
    status = "approved";
  } else if (row.status === "declined") {
    status = "declined";
  } else {
    status = "pending"; // draft, under_review, pending
  }

  const skills = Array.isArray(row.primary_skills) && row.primary_skills.length > 0
    ? row.primary_skills
    : Array.isArray(row.skills)
    ? row.skills
    : [];

  const secondarySkills = Array.isArray(row.secondary_skills) ? row.secondary_skills : [];
  const edu = Array.isArray(row.education) && row.education.length > 0 ? row.education[0] : row.education;

  return {
    id: row.id,
    creatorId: row.creator_id,
    creatorName: profile.full_name || "Creator",
    creatorEmail: profile.email || "",
    creatorAvatar: profile.profile_pic_url || "",
    location: profile.location_city
      ? `${profile.location_city}, ${profile.location_country || ""}`
      : profile.location_country || "Remote",
    phone: profile.phone_number || "",
    currentRole: row.current_role || "",
    currentCompany: row.current_company || undefined,
    experienceYears: row.years_of_experience || "",
    employmentStatus: row.employment_status || undefined,
    desiredRole: row.desired_role || "Creative Professional",
    skills,
    secondarySkills,
    specialization: row.specialization || undefined,
    education: edu
      ? {
          degree: edu.degree || "",
          institution: edu.institute || edu.institution || "",
          year: edu.year || "",
        }
      : undefined,
    workHistory: Array.isArray(row.experience)
      ? row.experience
      : Array.isArray(row.work_history)
      ? row.work_history
      : [],
    links: row.links
      ? {
          portfolio: row.links.portfolio_url || row.links.portfolio || undefined,
          linkedin: row.links.linkedin_url || row.links.linkedin || undefined,
          behance: row.links.behance_url || row.links.behance || undefined,
          github: row.links.github_url || row.links.github || undefined,
          website: row.links.personal_website || row.links.website || undefined,
        }
      : undefined,
    documents: {
      resumeUrl: row.documents?.[0]?.file_url || undefined,
      portfolioUrl: row.documents?.[1]?.file_url || undefined,
    },
    careerGoals: {
      expectedSalary: row.expected_salary || undefined,
      currentSalary: row.current_salary || undefined,
      desiredRole: row.desired_role || undefined,
      opportunityType: row.opportunity_type || undefined,
      preferredWorkType: row.remote_preference || row.preferred_work_type || "Hybrid",
      additionalNotes: row.career_goal || row.additional_notes || undefined,
    },
    status,
    approvedBy: row.approved_by || undefined,
    approvedAt: row.approved_at || undefined,
    declinedBy: row.declined_by || undefined,
    declinedAt: row.declined_at || undefined,
    declineReason: row.decline_reason || undefined,
    adminNotes: row.admin_review_notes || undefined,
    createdAt: row.submitted_at || row.created_at || new Date().toISOString(),
    updatedAt: row.updated_at || new Date().toISOString(),
  };
}

export const corRequestsRepo = {
  /**
   * List creator intake questionnaires directly from real database
   */
  async list(filters?: CorRequestFilters): Promise<CorRequest[]> {
    const supabase = getSupabaseAdmin();
    if (supabase) {
      try {
        let query = (supabase.from("cor_members") as any).select(`
          *,
          profiles:creator_id (
            id, full_name, email, profile_pic_url, location_city, location_country, phone_number
          )
        `);

        if (filters?.status && filters.status !== "all") {
          if (filters.status === "pending") {
            query = query.in("status", ["under_review", "pending", "draft"]);
          } else if (filters.status === "approved") {
            query = query.in("status", ["active", "approved"]);
          } else if (filters.status === "declined") {
            query = query.eq("status", "declined");
          }
        }

        const { data, error } = await query.order("created_at", { ascending: false });

        if (!error && Array.isArray(data)) {
          let list = data.map(mapRequestFromSupabase);

          if (filters?.query) {
            const q = filters.query.toLowerCase().trim();
            list = list.filter(
              (r: CorRequest) =>
                r.creatorName.toLowerCase().includes(q) ||
                r.creatorEmail.toLowerCase().includes(q) ||
                (r.desiredRole && r.desiredRole.toLowerCase().includes(q)) ||
                (r.currentRole && r.currentRole.toLowerCase().includes(q)) ||
                r.skills.some((s) => s.toLowerCase().includes(q))
            );
          }

          return list;
        } else if (error) {
          console.error("Supabase cor_members fetch error:", error);
        }
      } catch (err) {
        console.error("Supabase cor_members query failed:", err);
      }
    }

    if (isSupabaseConfigured()) {
      return [];
    }

    let result = [...requestsStore];
    if (filters?.status && filters.status !== "all") {
      result = result.filter((r) => r.status === filters.status);
    }
    return result;
  },

  /**
   * Retrieve a single COR request by ID
   */
  async getById(id: string): Promise<CorRequest | null> {
    const supabase = getSupabaseAdmin();
    if (supabase) {
      try {
        const { data, error } = await (supabase.from("cor_members") as any)
          .select(`
            *,
            profiles:creator_id (
              id, full_name, email, profile_pic_url, location_city, location_country, phone_number
            )
          `)
          .eq("id", id)
          .maybeSingle();

        if (!error && data) {
          return mapRequestFromSupabase(data);
        }
      } catch (err) {
        console.error("Supabase cor_members getById failed:", err);
      }
    }

    if (isSupabaseConfigured()) {
      return null;
    }

    const req = requestsStore.find((r) => r.id === id);
    return req ? { ...req } : null;
  },

  /**
   * Retrieve questionnaire by creatorId
   */
  async getByCreatorId(creatorId: string): Promise<CorRequest | null> {
    const supabase = getSupabaseAdmin();
    if (supabase) {
      try {
        const { data, error } = await (supabase.from("cor_members") as any)
          .select(`
            *,
            profiles:creator_id (
              id, full_name, email, profile_pic_url, location_city, location_country, phone_number
            )
          `)
          .eq("creator_id", creatorId)
          .maybeSingle();

        if (!error && data) {
          return mapRequestFromSupabase(data);
        }
      } catch (err) {
        console.error("Supabase cor_members getByCreatorId failed:", err);
      }
    }

    if (isSupabaseConfigured()) {
      return null;
    }

    const req = requestsStore.find((r) => r.creatorId === creatorId);
    return req ? { ...req } : null;
  },

  /**
   * Approve a COR Request -> sets status to active
   */
  async approve(id: string, adminId: string): Promise<CorRequest | null> {
    const now = new Date().toISOString();
    const supabase = getSupabaseAdmin();
    if (supabase) {
      try {
        const { data, error } = await (supabase.from("cor_members") as any)
          .update({
            status: "active",
            approved_by: adminId,
            approved_at: now,
            updated_at: now,
          })
          .eq("id", id)
          .select(`
            *,
            profiles:creator_id (
              id, full_name, email, profile_pic_url, location_city, location_country, phone_number
            )
          `)
          .single();

        if (!error && data) {
          const mapped = mapRequestFromSupabase(data);

          await corActivityRepo.log({
            creatorId: mapped.creatorId,
            actionType: "request_approved",
            description: `COR application approved for ${mapped.creatorName}. Member enrolled as active.`,
            actorId: adminId,
            actorName: "Admin",
          });

          return mapped;
        }
      } catch (err) {
        console.error("Supabase cor_members approve failed:", err);
      }
    }

    const idx = requestsStore.findIndex((r) => r.id === id);
    if (idx === -1) return null;

    requestsStore[idx] = {
      ...requestsStore[idx],
      status: "approved",
      approvedBy: adminId,
      approvedAt: now,
      updatedAt: now,
    };

    return { ...requestsStore[idx] };
  },

  /**
   * Decline a COR Request -> sets status to declined with reason
   */
  async decline(id: string, adminId: string, reason?: string, note?: string): Promise<CorRequest | null> {
    const now = new Date().toISOString();
    const supabase = getSupabaseAdmin();
    if (supabase) {
      try {
        const { data, error } = await (supabase.from("cor_members") as any)
          .update({
            status: "declined",
            declined_by: adminId,
            declined_at: now,
            decline_reason: reason || null,
            admin_review_notes: note || null,
            updated_at: now,
          })
          .eq("id", id)
          .select(`
            *,
            profiles:creator_id (
              id, full_name, email, profile_pic_url, location_city, location_country, phone_number
            )
          `)
          .single();

        if (!error && data) {
          const mapped = mapRequestFromSupabase(data);

          await corActivityRepo.log({
            creatorId: mapped.creatorId,
            actionType: "request_declined",
            description: `COR application declined for ${mapped.creatorName}. Reason: ${reason || "Not specified"}`,
            actorId: adminId,
            actorName: "Admin",
          });

          return mapped;
        }
      } catch (err) {
        console.error("Supabase cor_members decline failed:", err);
      }
    }

    const idx = requestsStore.findIndex((r) => r.id === id);
    if (idx === -1) return null;

    requestsStore[idx] = {
      ...requestsStore[idx],
      status: "declined",
      declinedBy: adminId,
      declinedAt: now,
      declineReason: reason,
      adminNotes: note,
      updatedAt: now,
    };

    return { ...requestsStore[idx] };
  },
};
