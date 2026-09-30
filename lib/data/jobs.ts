import { Job, JobFilters } from "../types";
import { seedJobs, seedApplications } from "./seed";

let jobsStore: Job[] = seedJobs.map((j) => ({
  ...j,
  applicantCount: seedApplications.filter((a) => a.jobId === j.id).length,
}));

export const jobsRepo = {
  /**
   * List jobs with optional filtering.
   * Future Supabase replacement:
   * const query = supabase.from('jobs').select('*, applications(count)');
   * if (filters?.status) query.eq('status', filters.status);
   * return await query;
   */
  async list(filters?: JobFilters): Promise<Job[]> {
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

    return result;
  },

  /**
   * Retrieve a job by ID.
   */
  async getById(id: string): Promise<Job | null> {
    const job = jobsStore.find((j) => j.id === id);
    return job ? { ...job } : null;
  },

  /**
   * Create a new job listing.
   */
  async create(data: Omit<Job, "id" | "createdAt" | "applicantCount">): Promise<Job> {
    const newJob: Job = {
      ...data,
      id: `job_${Date.now()}`,
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
  }> {
    const total = jobsStore.length;
    const open = jobsStore.filter((j) => j.status === "open").length;
    const closed = jobsStore.filter((j) => j.status === "closed").length;

    return {
      total,
      open,
      closed,
    };
  },
};
