import { CorMember, CorFilters } from "../types";
import { seedCorMembers } from "./seed";

let corStore: CorMember[] = [...seedCorMembers];

export const corRepo = {
  /**
   * List COR members with optional filtering.
   * Future Supabase replacement:
   * const query = supabase.from('cor_members').select('*');
   * if (filters?.status) query.eq('status', filters.status);
   * return await query;
   */
  async list(filters?: CorFilters): Promise<CorMember[]> {
    let result = [...corStore];

    if (!filters) return result;

    if (filters.query) {
      const q = filters.query.toLowerCase().trim();
      result = result.filter((m) => m.name.toLowerCase().includes(q));
    }

    if (filters.status) {
      result = result.filter((m) => m.status === filters.status);
    }

    return result;
  },

  /**
   * Retrieve a COR member by ID.
   */
  async getById(id: string): Promise<CorMember | null> {
    const member = corStore.find((m) => m.id === id);
    return member ? { ...member } : null;
  },

  /**
   * Add a new member to COR.
   */
  async create(data: Omit<CorMember, "id">): Promise<CorMember> {
    const newMember: CorMember = {
      ...data,
      id: `cor_${Date.now()}`,
    };
    corStore.unshift(newMember);
    return { ...newMember };
  },

  /**
   * Update an existing COR member.
   */
  async update(id: string, data: Partial<CorMember>): Promise<CorMember | null> {
    const index = corStore.findIndex((m) => m.id === id);
    if (index === -1) return null;

    corStore[index] = {
      ...corStore[index],
      ...data,
      id,
    };

    return { ...corStore[index] };
  },

  /**
   * Remove a COR member by ID.
   */
  async remove(id: string): Promise<boolean> {
    const initialLen = corStore.length;
    corStore = corStore.filter((m) => m.id !== id);
    return corStore.length < initialLen;
  },

  /**
   * Aggregate statistics for COR members.
   */
  async stats(): Promise<{
    total: number;
    active: number;
    expired: number;
  }> {
    const total = corStore.length;
    const active = corStore.filter((m) => m.status === "active").length;
    const expired = corStore.filter((m) => m.status === "expired").length;

    return {
      total,
      active,
      expired,
    };
  },
};
