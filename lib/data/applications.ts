import { Application, ApplicationFilters } from "../types";
import { seedApplications } from "./seed";

let applicationsStore: Application[] = [...seedApplications];

export const applicationsRepo = {
  /**
   * List applications with optional filtering.
   * Future Supabase replacement:
   * const query = supabase.from('applications').select('*');
   * if (filters?.status) query.eq('status', filters.status);
   * return await query;
   */
  async list(filters?: ApplicationFilters): Promise<Application[]> {
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
    const app = applicationsStore.find((a) => a.id === id);
    return app ? { ...app } : null;
  },

  /**
   * Update an existing application.
   */
  async update(id: string, data: Partial<Application>): Promise<Application | null> {
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
    const total = applicationsStore.length;
    const pending = applicationsStore.filter((a) => a.status === "pending").length;
    const shortlisted = applicationsStore.filter((a) => a.status === "shortlisted").length;
    const accepted = applicationsStore.filter((a) => a.status === "accepted").length;
    const rejected = applicationsStore.filter((a) => a.status === "rejected").length;

    return {
      total,
      pending,
      shortlisted,
      accepted,
      rejected,
    };
  },
};
