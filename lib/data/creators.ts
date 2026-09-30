import { Creator, CreatorFilters } from "../types";
import { seedCreators } from "./seed";

let creatorsStore: Creator[] = [...seedCreators];

export const creatorsRepo = {
  /**
   * List creators with optional filtering.
   * Future Supabase replacement:
   * const query = supabase.from('creators').select('*');
   * if (filters?.discipline) query.ilike('discipline', `%${filters.discipline}%`);
   * return await query;
   */
  async list(filters?: CreatorFilters): Promise<Creator[]> {
    let result = [...creatorsStore];

    if (!filters) return result;

    if (filters.query) {
      const q = filters.query.toLowerCase().trim();
      result = result.filter(
        (c) =>
          c.name.toLowerCase().includes(q) ||
          c.discipline.toLowerCase().includes(q)
      );
    }

    if (filters.discipline) {
      const d = filters.discipline.toLowerCase().trim();
      result = result.filter((c) => c.discipline.toLowerCase().includes(d));
    }

    if (filters.plan) {
      result = result.filter((c) => c.plan === filters.plan);
    }

    if (filters.status) {
      result = result.filter((c) => c.status === filters.status);
    }

    return result;
  },

  /**
   * Retrieve a creator by ID.
   */
  async getById(id: string): Promise<Creator | null> {
    const creator = creatorsStore.find((c) => c.id === id);
    return creator ? { ...creator } : null;
  },

  /**
   * Update an existing creator.
   */
  async update(id: string, data: Partial<Creator>): Promise<Creator | null> {
    const index = creatorsStore.findIndex((c) => c.id === id);
    if (index === -1) return null;

    creatorsStore[index] = {
      ...creatorsStore[index],
      ...data,
      id,
    };

    return { ...creatorsStore[index] };
  },

  /**
   * Remove a creator by ID.
   */
  async remove(id: string): Promise<boolean> {
    const initialLen = creatorsStore.length;
    creatorsStore = creatorsStore.filter((c) => c.id !== id);
    return creatorsStore.length < initialLen;
  },

  /**
   * Aggregate statistics for creators.
   */
  async stats(): Promise<{
    total: number;
    active: number;
    pending: number;
    suspended: number;
    free: number;
    elite: number;
    pro: number;
    disciplines: string[];
  }> {
    const total = creatorsStore.length;
    const active = creatorsStore.filter((c) => c.status === "active").length;
    const pending = creatorsStore.filter((c) => c.status === "pending").length;
    const suspended = creatorsStore.filter((c) => c.status === "suspended").length;
    const free = creatorsStore.filter((c) => c.plan === "free").length;
    const elite = creatorsStore.filter((c) => c.plan === "elite").length;
    const pro = creatorsStore.filter((c) => c.plan === "pro").length;

    const uniqueDisciplines = Array.from(
      new Set(creatorsStore.map((c) => c.discipline))
    );

    return {
      total,
      active,
      pending,
      suspended,
      free,
      elite,
      pro,
      disciplines: uniqueDisciplines,
    };
  },
};
