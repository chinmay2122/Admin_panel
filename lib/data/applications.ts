import { Application, ApplicationFilters } from "../types";
import { seedApplications } from "./seed";
import { getSupabaseAdmin } from "../supabase/server";

let applicationsStore: Application[] = [...seedApplications];

function mapAppFromSupabase(row: any): Application {
  return {
    id: row.id,
    jobId: row.job_id,
    jobTitle: row.jobs?.title || "Role",
    creatorId: row.candidate_id,
    creatorName: row.candidate?.full_name || "Applicant",
    candidateId: row.candidate_id,
    candidateName: row.candidate?.full_name || "Applicant",
    candidatePlan: row.candidate?.plan || (row.candidate?.is_premium ? "pro" : "free"),
    status: (row.status?.toLowerCase() as any) || "pending",
    coverLetter: row.cover_letter || "",
    portfolioUrl: row.portfolio_url || "",
    resumeUrl: row.resume_url || "",
    appliedAt: row.created_at || new Date().toISOString(),
  };
}

export const applicationsRepo = {
  /**
   * List applications with optional filtering.
   * Connects to Supabase job_applications when configured, otherwise uses local in-memory data.
   */
  async list(filters?: ApplicationFilters): Promise<Application[]> {
    const supabase = getSupabaseAdmin();
    if (supabase) {
      try {
        let query = (supabase.from("job_applications") as any).select(`
          *,
          jobs:job_id (title),
          candidate:candidate_id (full_name, plan, is_premium)
        `);

        if (filters?.jobId) {
          query = query.eq("job_id", filters.jobId);
        }

        if (filters?.creatorId) {
          query = query.eq("candidate_id", filters.creatorId);
        }

        if (filters?.status) {
          query = query.eq("status", filters.status);
        }

        const { data, error } = await query.order("created_at", { ascending: false });

        if (!error && data) {
          let list = data.map(mapAppFromSupabase);

          if (filters?.query) {
            const q = filters.query.toLowerCase().trim();
            list = list.filter(
              (a: Application) =>
                a.creatorName.toLowerCase().includes(q) ||
                a.jobTitle.toLowerCase().includes(q)
            );
          }

          return list;
        }
      } catch (err) {
        console.warn("Supabase job_applications query failed, using fallback:", err);
      }
    }

    let result = [...applicationsStore];

    if (!filters) return result;

    if (filters.query) {
      const q = filters.query.toLowerCase().trim();
      result = result.filter(
        (a) =>
          a.creatorName.toLowerCase().includes(q) ||
          a.jobTitle.toLowerCase().includes(q)
      );
    }

    if (filters.jobId) {
      result = result.filter((a) => a.jobId === filters.jobId);
    }

    if (filters.creatorId) {
      result = result.filter((a) => a.creatorId === filters.creatorId);
    }

    if (filters.status) {
      result = result.filter((a) => a.status === filters.status);
    }

    return result;
  },

  /**
   * Retrieve an application by ID.
   */
  async getById(id: string): Promise<Application | null> {
    const supabase = getSupabaseAdmin();
    if (supabase) {
      try {
        const { data, error } = await (supabase.from("job_applications") as any)
          .select(`
            *,
            jobs:job_id (title),
            candidate:candidate_id (full_name, plan, is_premium)
          `)
          .eq("id", id)
          .maybeSingle();

        if (!error && data) {
          return mapAppFromSupabase(data);
        }
      } catch (err) {
        console.warn("Supabase application getById failed:", err);
      }
    }

    const app = applicationsStore.find((a) => a.id === id);
    return app ? { ...app } : null;
  },

  /**
   * Update an existing application (e.g. status).
   */
  async update(id: string, data: Partial<Application>): Promise<Application | null> {
    const supabase = getSupabaseAdmin();
    if (supabase) {
      try {
        const payload: Record<string, any> = {};
        if (data.status !== undefined) payload.status = data.status;

        const { data: updated, error } = await (supabase.from("job_applications") as any)
          .update(payload)
          .eq("id", id)
          .select(`
            *,
            jobs:job_id (title),
            candidate:candidate_id (full_name, plan, is_premium)
          `)
          .single();

        if (!error && updated) {
          return mapAppFromSupabase(updated);
        }
      } catch (err) {
        console.warn("Supabase application update failed:", err);
      }
    }

    const index = applicationsStore.findIndex((a) => a.id === id);
    if (index === -1) return null;

    applicationsStore[index] = {
      ...applicationsStore[index],
      ...data,
      id,
    };

    return { ...applicationsStore[index] };
  },

  /**
   * Remove an application by ID.
   */
  async remove(id: string): Promise<boolean> {
    const supabase = getSupabaseAdmin();
    if (supabase) {
      try {
        const { error } = await (supabase.from("job_applications") as any)
          .delete()
          .eq("id", id);
        if (!error) return true;
      } catch (err) {
        console.warn("Supabase application remove failed:", err);
      }
    }

    const initialLen = applicationsStore.length;
    applicationsStore = applicationsStore.filter((a) => a.id !== id);
    return applicationsStore.length < initialLen;
  },

  /**
   * Aggregate statistics for applications.
   */
  async stats(): Promise<{
    total: number;
    pending: number;
    shortlisted: number;
    accepted: number;
    rejected: number;
  }> {
    const all = await this.list();

    const total = all.length;
    const pending = all.filter((a) => a.status === "pending").length;
    const shortlisted = all.filter((a) => a.status === "shortlisted").length;
    const accepted = all.filter((a) => a.status === "accepted").length;
    const rejected = all.filter((a) => a.status === "rejected").length;

    return {
      total,
      pending,
      shortlisted,
      accepted,
      rejected,
    };
  },
};
