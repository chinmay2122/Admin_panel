import { CorOpportunity, CorOpportunityFilters, CorOpportunityStatus } from "../types";
import { getSupabaseAdmin, isSupabaseConfigured } from "../supabase/server";

let opportunitiesStore: CorOpportunity[] = [];

function mapOpportunityFromSupabase(row: any): CorOpportunity {
  const skills = Array.isArray(row.skills) && row.skills.length > 0
    ? row.skills
    : Array.isArray(row.required_skills)
    ? row.required_skills
    : [];

  return {
    id: row.id,
    title: row.title || row.role || "Untitled Role",
    company: row.company || "Company",
    description: row.description || "",
    location: row.location || "Remote",
    workplaceType: row.workplace_type || "Hybrid",
    salary: row.salary_range || row.salary || "Competitive",
    requiredSkills: skills,
    experienceRequirement: row.requirements || "",
    jobUrl: row.external_url || row.job_url || undefined,
    recruiterContact: row.recruiter_contact || undefined,
    applicationDeadline: row.deadline || undefined,
    source: "COR Curated Partner",
    status: (row.status || "open") as CorOpportunityStatus,
    createdAt: row.created_at || new Date().toISOString(),
    updatedAt: row.updated_at || new Date().toISOString(),
  };
}

export const corOpportunitiesRepo = {
  /**
   * List all COR opportunities from live database
   */
  async list(filters?: CorOpportunityFilters): Promise<CorOpportunity[]> {
    const supabase = getSupabaseAdmin();
    if (supabase) {
      try {
        let query = (supabase.from("cor_opportunities") as any).select("*");

        if (filters?.status && filters.status !== "all") {
          query = query.eq("status", filters.status);
        }

        const { data, error } = await query.order("created_at", { ascending: false });

        if (!error && Array.isArray(data)) {
          let list = data.map(mapOpportunityFromSupabase);

          if (filters?.query) {
            const q = filters.query.toLowerCase().trim();
            list = list.filter(
              (o: CorOpportunity) =>
                o.title.toLowerCase().includes(q) ||
                o.company.toLowerCase().includes(q) ||
                o.location.toLowerCase().includes(q) ||
                o.requiredSkills.some((s) => s.toLowerCase().includes(q))
            );
          }

          return list;
        } else if (error) {
          console.error("Supabase cor_opportunities fetch error:", error);
        }
      } catch (err) {
        console.error("Supabase cor_opportunities query failed:", err);
      }
    }

    if (isSupabaseConfigured()) {
      return [];
    }

    let result = [...opportunitiesStore];
    if (filters?.status && filters.status !== "all") {
      result = result.filter((o) => o.status === filters.status);
    }
    return result;
  },

  /**
   * Retrieve a single opportunity by ID
   */
  async getById(id: string): Promise<CorOpportunity | null> {
    const supabase = getSupabaseAdmin();
    if (supabase) {
      try {
        const { data, error } = await (supabase.from("cor_opportunities") as any)
          .select("*")
          .eq("id", id)
          .maybeSingle();

        if (!error && data) {
          return mapOpportunityFromSupabase(data);
        }
      } catch (err) {
        console.error("Supabase cor_opportunities getById failed:", err);
      }
    }

    if (isSupabaseConfigured()) {
      return null;
    }

    const opp = opportunitiesStore.find((o) => o.id === id);
    return opp ? { ...opp } : null;
  },

  /**
   * Create a new opportunity
   */
  async create(data: Omit<CorOpportunity, "id" | "createdAt" | "updatedAt">): Promise<CorOpportunity> {
    const now = new Date().toISOString();
    const newOpp: CorOpportunity = {
      ...data,
      id: `opp_${Date.now()}`,
      createdAt: now,
      updatedAt: now,
    };

    const supabase = getSupabaseAdmin();
    if (supabase) {
      try {
        const { data: inserted, error } = await (supabase.from("cor_opportunities") as any).insert({
          title: data.title,
          role: data.title,
          company: data.company,
          description: data.description || null,
          location: data.location || "Remote",
          workplace_type: data.workplaceType || "Hybrid",
          salary_range: data.salary || null,
          skills: data.requiredSkills || [],
          requirements: data.experienceRequirement || null,
          external_url: data.jobUrl || null,
          recruiter_contact: data.recruiterContact || null,
          deadline: data.applicationDeadline || null,
          status: data.status || "open",
        }).select().single();

        if (!error && inserted) {
          return mapOpportunityFromSupabase(inserted);
        }
      } catch (err) {
        console.error("Supabase cor_opportunities insert failed:", err);
      }
    }

    opportunitiesStore.unshift(newOpp);
    return { ...newOpp };
  },

  /**
   * Update an existing opportunity
   */
  async update(id: string, data: Partial<CorOpportunity>): Promise<CorOpportunity | null> {
    const now = new Date().toISOString();
    const supabase = getSupabaseAdmin();
    if (supabase) {
      try {
        const payload: any = { updated_at: now };
        if (data.title) {
          payload.title = data.title;
          payload.role = data.title;
        }
        if (data.company) payload.company = data.company;
        if (data.description !== undefined) payload.description = data.description;
        if (data.location) payload.location = data.location;
        if (data.workplaceType) payload.workplace_type = data.workplaceType;
        if (data.salary !== undefined) payload.salary_range = data.salary;
        if (data.requiredSkills) payload.skills = data.requiredSkills;
        if (data.experienceRequirement !== undefined) payload.requirements = data.experienceRequirement;
        if (data.jobUrl !== undefined) payload.external_url = data.jobUrl;
        if (data.recruiterContact !== undefined) payload.recruiter_contact = data.recruiterContact;
        if (data.applicationDeadline !== undefined) payload.deadline = data.applicationDeadline;
        if (data.status) payload.status = data.status;

        const { data: updated, error } = await (supabase.from("cor_opportunities") as any)
          .update(payload)
          .eq("id", id)
          .select()
          .single();

        if (!error && updated) {
          return mapOpportunityFromSupabase(updated);
        }
      } catch (err) {
        console.error("Supabase cor_opportunities update failed:", err);
      }
    }

    const idx = opportunitiesStore.findIndex((o) => o.id === id);
    if (idx === -1) return null;

    opportunitiesStore[idx] = { ...opportunitiesStore[idx], ...data, updatedAt: now };
    return { ...opportunitiesStore[idx] };
  },

  /**
   * Delete or archive an opportunity
   */
  async delete(id: string): Promise<boolean> {
    const supabase = getSupabaseAdmin();
    if (supabase) {
      try {
        const { error } = await (supabase.from("cor_opportunities") as any)
          .delete()
          .eq("id", id);
        if (!error) return true;
      } catch (err) {
        console.error("Supabase cor_opportunities delete failed:", err);
      }
    }

    const idx = opportunitiesStore.findIndex((o) => o.id === id);
    if (idx === -1) return false;
    opportunitiesStore.splice(idx, 1);
    return true;
  },

  async remove(id: string): Promise<boolean> {
    return this.delete(id);
  },
};
