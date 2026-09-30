import { Artwork, ArtworkFilters } from "../types";
import { seedArtworks } from "./seed";

let artworksStore: Artwork[] = [...seedArtworks];

export const artworksRepo = {
  /**
   * List artworks with optional filtering.
   * Future Supabase replacement:
   * const query = supabase.from('artworks').select('*');
   * if (filters?.status) query.eq('status', filters.status);
   * return await query;
   */
  async list(filters?: ArtworkFilters): Promise<Artwork[]> {
    let result = [...artworksStore];

    if (!filters) return result;

    if (filters.query) {
      const q = filters.query.toLowerCase().trim();
      result = result.filter(
        (a) =>
          a.title.toLowerCase().includes(q) ||
          a.creatorName.toLowerCase().includes(q) ||
          a.medium.toLowerCase().includes(q)
      );
    }

    if (filters.status) {
      result = result.filter((a) => a.status === filters.status);
    }

    if (filters.creatorId) {
      result = result.filter((a) => a.creatorId === filters.creatorId);
    }

    if (filters.creatorName) {
      result = result.filter((a) => a.creatorName === filters.creatorName);
    }

    if (filters.medium) {
      result = result.filter((a) => a.medium.toLowerCase().includes(filters.medium!.toLowerCase()));
    }

    if (typeof filters.minPrice === "number") {
      result = result.filter((a) => a.price >= (filters.minPrice ?? 0));
    }

    if (typeof filters.maxPrice === "number") {
      result = result.filter((a) => a.price <= (filters.maxPrice ?? Infinity));
    }

    return result;
  },

  /**
   * Retrieve an artwork by ID.
   */
  async getById(id: string): Promise<Artwork | null> {
    const artwork = artworksStore.find((a) => a.id === id);
    return artwork ? { ...artwork } : null;
  },

  /**
   * Update an existing artwork.
   */
  async update(id: string, data: Partial<Artwork>): Promise<Artwork | null> {
    const index = artworksStore.findIndex((a) => a.id === id);
    if (index === -1) return null;

    artworksStore[index] = {
      ...artworksStore[index],
      ...data,
      id,
    };

    return { ...artworksStore[index] };
  },

  /**
   * Bulk update artworks by IDs.
   */
  async bulkUpdate(ids: string[], data: Partial<Artwork>): Promise<number> {
    const idSet = new Set(ids);
    let count = 0;
    for (let i = 0; i < artworksStore.length; i++) {
      if (idSet.has(artworksStore[i].id)) {
        artworksStore[i] = {
          ...artworksStore[i],
          ...data,
          id: artworksStore[i].id,
        };
        count++;
      }
    }
    return count;
  },

  /**
   * Remove an artwork by ID.
   */
  async remove(id: string): Promise<boolean> {
    const initialLen = artworksStore.length;
    artworksStore = artworksStore.filter((a) => a.id !== id);
    return artworksStore.length < initialLen;
  },

  /**
   * Aggregate statistics for artworks.
   */
  async stats(): Promise<{
    total: number;
    published: number;
    pending: number;
    draft: number;
    rejected: number;
    totalValue: number;
    distinctCreators: string[];
    distinctMedia: string[];
  }> {
    const total = artworksStore.length;
    const published = artworksStore.filter((a) => a.status === "published").length;
    const pending = artworksStore.filter((a) => a.status === "pending").length;
    const draft = artworksStore.filter((a) => a.status === "draft").length;
    const rejected = artworksStore.filter((a) => a.status === "rejected").length;
    const totalValue = artworksStore.reduce((sum, a) => sum + (a.price || 0), 0);

    const distinctCreators = Array.from(new Set(artworksStore.map((a) => a.creatorName))).sort();
    const distinctMedia = Array.from(new Set(artworksStore.map((a) => a.medium))).sort();

    return {
      total,
      published,
      pending,
      draft,
      rejected,
      totalValue,
      distinctCreators,
      distinctMedia,
    };
  },
};
