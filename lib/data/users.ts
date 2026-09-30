import { User, UserFilters } from "../types";
import { seedUsers } from "./seed";

// In-memory data store initialized with realistic seed data
let usersStore: User[] = [...seedUsers];

export const usersRepo = {
  /**
   * List users with optional filtering.
   * Future Supabase replacement:
   * const query = supabase.from('users').select('*');
   * if (filters?.role) query.eq('role', filters.role);
   * return await query;
   */
  async list(filters?: UserFilters): Promise<User[]> {
    let result = [...usersStore];

    if (!filters) return result;

    if (filters.query) {
      const q = filters.query.toLowerCase().trim();
      result = result.filter(
        (u) =>
          u.name.toLowerCase().includes(q) ||
          u.email.toLowerCase().includes(q)
      );
    }

    if (filters.role) {
      result = result.filter((u) => u.role === filters.role);
    }

    if (filters.plan) {
      result = result.filter((u) => u.plan === filters.plan);
    }

    if (filters.status) {
      result = result.filter((u) => u.status === filters.status);
    }

    if (typeof filters.isCorMember === "boolean") {
      result = result.filter((u) => u.isCorMember === filters.isCorMember);
    }

    return result;
  },

  /**
   * Retrieve a user by ID.
   */
  async getById(id: string): Promise<User | null> {
    const user = usersStore.find((u) => u.id === id);
    return user ? { ...user } : null;
  },

  /**
   * Update an existing user.
   */
  async update(id: string, data: Partial<User>): Promise<User | null> {
    const index = usersStore.findIndex((u) => u.id === id);
    if (index === -1) return null;

    usersStore[index] = {
      ...usersStore[index],
      ...data,
      id, // Preserve ID
    };

    return { ...usersStore[index] };
  },

  /**
   * Remove a user by ID.
   */
  async remove(id: string): Promise<boolean> {
    const initialLen = usersStore.length;
    usersStore = usersStore.filter((u) => u.id !== id);
    return usersStore.length < initialLen;
  },

  /**
   * Aggregate statistics for users.
   */
  async stats(): Promise<{
    total: number;
    active: number;
    suspended: number;
    creators: number;
    collectors: number;
    corMembers: number;
  }> {
    const total = usersStore.length;
    const active = usersStore.filter((u) => u.status === "active").length;
    const suspended = usersStore.filter((u) => u.status === "suspended").length;
    const creators = usersStore.filter((u) => u.role === "creator").length;
    const collectors = usersStore.filter((u) => u.role === "collector").length;
    const corMembers = usersStore.filter((u) => u.isCorMember).length;

    return {
      total,
      active,
      suspended,
      creators,
      collectors,
      corMembers,
    };
  },
};
