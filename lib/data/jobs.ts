import { Job, JobFilters } from "../types";
import { seedJobs, seedApplications } from "./seed";
import { getSupabaseAdmin } from "../supabase/server";

let jobsStore: Job[] = seedJobs.map((j) => ({
  ...j,
  isProOnly: true,
  applicantCount: seedApplications.filter((a) => a.jobId === j.id).length,
}));

function mapJobFromSupabase(row: any, applicantCount = 0): Job {
  return {
    id: row.id,
    title: row.title || "Untitled Position",
    company: row.company || "Studio",
    type: row.type || "Full-time",
    location: row.location || "Remote",
    description: row.description || "",
    requirements: row.requirements || "",
    status: (row.status?.toLowerCase() as any) || "open",
    isProOnly: row.is_pro_only !== false,
    createdAt: row.created_at || new Date().toISOString(),
    applicantCount,
  };
}

export const jobsRepo = {
  /**
   * List jobs with optional filtering.
   * Connects to Supabase when configured, otherwise uses local in-memory/seed data.
   */
  async list(filters?: JobFilters): Promise<Job[]> {
    const supabase = getSupabaseAdmin();

    if (supabase) {
      try {
        let query = (supabase.from("jobs") as any).select(`
          *,
          job_applications (count)
        `);

        if (filters?.status) {
          query = query.eq("status", filters.status);
        }

        if (filters?.type) {
          query = query.ilike("type", `%${filters.type}%`);
        }

        if (typeof filters?.isProOnly === "boolean") {
          query = query.eq("is_pro_only", filters.isProOnly);
        }

        const { data, error } = await query.order("created_at", { ascending: false });

        if (!error && data) {
          let list = data.map((row: any) => {
            const count = row.job_applications?.[0]?.count ?? 0;
            return mapJobFromSupabase(row, count);
          });

          if (filters?.query) {
            const q = filters.query.toLowerCase().trim();
            list = list.filter(
              (j: Job) =>
                j.title.toLowerCase().includes(q) ||
                j.company.toLowerCase().includes(q) ||
                j.location.toLowerCase().includes(q)
            );
          }

          return list;
        }
      } catch (err) {
        console.warn("Supabase jobs query failed, using fallback:", err);
      }
    }

    let result = [...jobsStore];

    if (!filters) return result;

    if (filters.query) {
      const q = filters.query.toLowerCase().trim();
      result = result.filter(
        (j) =>
          j.title.toLowerCase().includes(q) ||
          j.company.toLowerCase().includes(q) ||
          j.location.toLowerCase().includes(q)
      );
    }

    if (filters.status) {
      result = result.filter((j) => j.status === filters.status);
    }

    if (filters.type) {
      result = result.filter((j) => j.type.toLowerCase() === filters.type?.toLowerCase());
    }

    if (typeof filters.isProOnly === "boolean") {
      result = result.filter((j) => j.isProOnly === filters.isProOnly);
    }

    return result;
  },

  /**
   * Retrieve a job by ID.
   */
  async getById(id: string): Promise<Job | null> {
    const supabase = getSupabaseAdmin();
    if (supabase) {
      try {
        const { data, error } = await (supabase.from("jobs") as any)
          .select("*, job_applications(count)")
          .eq("id", id)
          .maybeSingle();

        if (!error && data) {
          const count = data.job_applications?.[0]?.count ?? 0;
          return mapJobFromSupabase(data, count);
        }
      } catch (err) {
        console.warn("Supabase job getById failed:", err);
      }
    }

    const job = jobsStore.find((j) => j.id === id);
    return job ? { ...job } : null;
  },

  /**
   * Create a new job listing.
   */
  async create(data: Omit<Job, "id" | "createdAt" | "applicantCount">): Promise<Job> {
    const supabase = getSupabaseAdmin();
    if (supabase) {
      try {
        const payload = {
          title: data.title,
          company: data.company,
          type: data.type,
          location: data.location,
          description: data.description || null,
          requirements: data.requirements || null,
          status: data.status,
          is_pro_only: data.isProOnly ?? true,
        };

        const { data: created, error } = await (supabase.from("jobs") as any)
          .insert(payload)
          .select()
          .single();

        if (!error && created) {
          return mapJobFromSupabase(created, 0);
        }
      } catch (err) {
        console.warn("Supabase job create failed, using fallback:", err);
      }
    }

    const newJob: Job = {
      ...data,
      id: `job_${Date.now()}`,
      isProOnly: data.isProOnly ?? true,
      createdAt: new Date().toISOString(),
      applicantCount: 0,
    };
    jobsStore.unshift(newJob);
    return { ...newJob };
  },

  /**
   * Update an existing job.
   */
  async update(id: string, data: Partial<Job>): Promise<Job | null> {
    const supabase = getSupabaseAdmin();
    if (supabase) {
      try {
        const payload: Record<string, any> = {};
        if (data.title !== undefined) payload.title = data.title;
        if (data.company !== undefined) payload.company = data.company;
        if (data.type !== undefined) payload.type = data.type;
        if (data.location !== undefined) payload.location = data.location;
        if (data.description !== undefined) payload.description = data.description;
        if (data.requirements !== undefined) payload.requirements = data.requirements;
        if (data.status !== undefined) payload.status = data.status;
        if (data.isProOnly !== undefined) payload.is_pro_only = data.isProOnly;

        const { data: updated, error } = await (supabase.from("jobs") as any)
          .update(payload)
          .eq("id", id)
          .select("*, job_applications(count)")
          .single();

        if (!error && updated) {
          const count = updated.job_applications?.[0]?.count ?? 0;
          return mapJobFromSupabase(updated, count);
        }
      } catch (err) {
        console.warn("Supabase job update failed:", err);
      }
    }

    const index = jobsStore.findIndex((j) => j.id === id);
    if (index === -1) return null;

    jobsStore[index] = {
      ...jobsStore[index],
      ...data,
      id,
    };

    return { ...jobsStore[index] };
  },

  /**
   * Remove a job by ID.
   */
  async remove(id: string): Promise<boolean> {
    const supabase = getSupabaseAdmin();
    if (supabase) {
      try {
        const { error } = await (supabase.from("jobs") as any).delete().eq("id", id);
        if (!error) return true;
      } catch (err) {
        console.warn("Supabase job remove failed:", err);
      }
    }

    const initialLen = jobsStore.length;
    jobsStore = jobsStore.filter((j) => j.id !== id);
    return jobsStore.length < initialLen;
  },

  /**
   * Aggregate statistics for jobs.
   */
  async stats(): Promise<{
    total: number;
    open: number;
    closed: number;
    proOnly: number;
  }> {
    const all = await this.list();

    const total = all.length;
    const open = all.filter((j) => j.status === "open").length;
    const closed = all.filter((j) => j.status === "closed").length;
    const proOnly = all.filter((j) => j.isProOnly).length;

    return {
      total,
      open,
      closed,
      proOnly,
    };
  },
};
