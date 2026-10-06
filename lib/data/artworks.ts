import { Artwork, ArtworkFilters, ArtworkStatus } from "../types";
import { getSupabaseAdmin, isSupabaseConfigured } from "../supabase/server";

let artworksStore: Artwork[] = [];

function toSupabaseStatus(status?: string): "Available" | "For Sale" | "Not for sale" | "Sold" {
  if (!status) return "Available";
  const s = status.toLowerCase().trim();
  if (s === "published" || s === "available") return "Available";
  if (s === "for sale" || s === "forsale") return "For Sale";
  if (s === "sold") return "Sold";
  if (s === "draft" || s === "pending" || s === "rejected" || s === "not for sale") return "Not for sale";
  return "Available";
}

function fromSupabaseStatus(row: any): ArtworkStatus {
  if (row?.is_published === false) return "draft";
  const s = (row?.status || "").toLowerCase().trim();
  if (s === "published" || s === "available" || s === "for sale" || s === "sold") return "published";
  if (s === "not for sale" || s === "draft") return "draft";
  if (s === "pending") return "pending";
  if (s === "rejected") return "rejected";
  return "published";
}

function mapFromSupabase(row: any): Artwork {
  const isFeatured = Boolean(
    row.is_featured ?? (Array.isArray(row.tags) && row.tags.includes("featured"))
  );

  return {
    id: row.id,
    title: row.title || "Untitled",
    creatorId: row.creator_id || "",
    creatorName: row.artist_name || (row.profiles?.full_name ?? "Unknown Artist"),
    medium: row.art_type || row.style || "Mixed Media",
    dimensions: row.dimensions || "Dimensions unavailable",
    price: Number(row.price) || 0,
    imageUrl: row.image_url || "https://images.unsplash.com/photo-1579783902614-a3fb3927b675?w=800",
    status: fromSupabaseStatus(row),
    createdAt: row.created_at || new Date().toISOString(),
    description: row.description || "",
    year: row.year ? String(row.year) : undefined,
    location: row.location || undefined,
    collection: row.collection || undefined,
    availability: row.availability || (row.status === "Sold" ? "Sold" : "Available"),
    isFeatured,
    isFlagged: row.is_flagged ?? (Array.isArray(row.tags) && row.tags.includes("flagged")),
  };
}

export const artworksRepo = {
  /**
   * List artworks with optional filtering.
   * Connects to Supabase when configured, otherwise uses local in-memory/seed data.
   */
  async list(filters?: ArtworkFilters): Promise<Artwork[]> {
    const supabase = getSupabaseAdmin();

    if (supabase) {
      try {
        let query = supabase.from("artworks").select("*, profiles(*)");

        if (filters?.status) {
          query = query.ilike("status", filters.status);
        }
        if (filters?.creatorId) {
          query = query.eq("creator_id", filters.creatorId);
        }
        if (filters?.creatorName) {
          query = query.ilike("artist_name", `%${filters.creatorName}%`);
        }
        if (filters?.medium) {
          query = query.ilike("art_type", `%${filters.medium}%`);
        }
        if (typeof filters?.minPrice === "number") {
          query = query.gte("price", filters.minPrice);
        }
        if (typeof filters?.maxPrice === "number") {
          query = query.lte("price", filters.maxPrice);
        }

        const { data, error } = await query.order("created_at", { ascending: false });

        if (!error && data) {
          let list = data.map(mapFromSupabase);

          if (filters?.query) {
            const q = filters.query.toLowerCase().trim();
            list = list.filter(
              (a) =>
                a.title.toLowerCase().includes(q) ||
                a.creatorName.toLowerCase().includes(q) ||
                a.medium.toLowerCase().includes(q)
            );
          }

          return list;
        }
      } catch (err) {
        console.warn("Supabase query failed, falling back to local dataset:", err);
      }
    }

    if (isSupabaseConfigured()) {
      return [];
    }

    // Fallback to in-memory store
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
    const supabase = getSupabaseAdmin();
    if (supabase) {
      try {
        const { data, error } = await supabase
          .from("artworks")
          .select("*, profiles(*)")
          .eq("id", id)
          .maybeSingle();

        if (!error && data) {
          return mapFromSupabase(data);
        }
      } catch (err) {
        console.warn("Supabase getById failed, using fallback:", err);
      }
    }

    if (isSupabaseConfigured()) {
      return null;
    }

    const artwork = artworksStore.find((a) => a.id === id);
    return artwork ? { ...artwork } : null;
  },

  /**
   * Create a new artwork.
   */
  async create(data: {
    title: string;
    creatorId?: string;
    creatorName: string;
    medium?: string;
    dimensions?: string;
    price?: number;
    imageUrl?: string;
    status?: ArtworkStatus;
  }): Promise<Artwork> {
    const supabase = getSupabaseAdmin();
    if (supabase && data.creatorId) {
      try {
        const payload: Record<string, any> = {
          title: data.title,
          creator_id: data.creatorId,
          artist_name: data.creatorName,
          art_type: data.medium || "Mixed Media",
          dimensions: data.dimensions || "Dimensions unavailable",
          price: data.price || 0,
          image_url: data.imageUrl || "https://images.unsplash.com/photo-1579783902614-a3fb3927b675?w=800",
          status: toSupabaseStatus(data.status),
          is_published: data.status === "published",
        };

        const { data: created, error } = await (supabase.from("artworks") as any)
          .insert(payload)
          .select("*, profiles(*)")
          .single();

        if (!error && created) {
          return mapFromSupabase(created);
        }
      } catch (err) {
        console.warn("Supabase create artwork failed, using local fallback:", err);
      }
    }

    const newArtwork: Artwork = {
      id: `art_${Date.now().toString(36)}`,
      title: data.title,
      creatorId: data.creatorId || `crt_${Date.now().toString(36)}`,
      creatorName: data.creatorName,
      medium: data.medium || "Mixed Media",
      dimensions: data.dimensions || "Dimensions unavailable",
      price: data.price || 0,
      imageUrl: data.imageUrl || "https://images.unsplash.com/photo-1579783902614-a3fb3927b675?w=800",
      status: data.status || "published",
      createdAt: new Date().toISOString(),
    };

    artworksStore.unshift(newArtwork);
    return { ...newArtwork };
  },

  /**
   * Update an existing artwork.
   */
  async update(id: string, data: Partial<Artwork>): Promise<Artwork | null> {
    const supabase = getSupabaseAdmin();
    if (supabase) {
      try {
        const payload: Record<string, any> = {};
        if (data.title !== undefined) payload.title = data.title;
        if (data.price !== undefined) payload.price = data.price;
        if (data.status !== undefined) {
          payload.status = toSupabaseStatus(data.status);
          payload.is_published = !(data.status === "draft" || data.status === "rejected" || (data.status as string) === "Not for sale");
        }
        if (data.imageUrl !== undefined) payload.image_url = data.imageUrl;
        if (data.dimensions !== undefined) payload.dimensions = data.dimensions;
        if (data.medium !== undefined) payload.art_type = data.medium;

        if (data.isFeatured !== undefined) {
          const { data: existing } = await supabase.from("artworks").select("tags").eq("id", id).maybeSingle();
          let currentTags: string[] = Array.isArray(existing?.tags) ? [...existing.tags] : [];
          if (data.isFeatured) {
            if (!currentTags.includes("featured")) currentTags.push("featured");
          } else {
            currentTags = currentTags.filter((t) => t !== "featured");
          }
          payload.tags = currentTags;
        }

        const { data: updated, error } = await (supabase.from("artworks") as any)
          .update(payload)
          .eq("id", id)
          .select("*, profiles(*)")
          .single();

        if (!error && updated) {
          return mapFromSupabase(updated);
        }
      } catch (err) {
        console.warn("Supabase update failed, using fallback:", err);
      }
    }

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
    const supabase = getSupabaseAdmin();
    if (supabase) {
      try {
        const payload: Record<string, any> = {};
        if (data.status !== undefined) {
          payload.status = toSupabaseStatus(data.status);
          payload.is_published = !(data.status === "draft" || data.status === "rejected" || (data.status as string) === "Not for sale");
        }

        const { error, count } = await (supabase.from("artworks") as any)
          .update(payload)
          .in("id", ids);

        if (!error && typeof count === "number") {
          return count;
        }
      } catch (err) {
        console.warn("Supabase bulkUpdate failed, using fallback:", err);
      }
    }

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
    const supabase = getSupabaseAdmin();
    if (supabase) {
      try {
        const { error } = await supabase.from("artworks").delete().eq("id", id);
        if (!error) return true;
      } catch (err) {
        console.warn("Supabase remove failed, using fallback:", err);
      }
    }

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
    const all = await this.list();

    const total = all.length;
    const published = all.filter((a) => a.status === "published" || a.status === "available" as any).length;
    const pending = all.filter((a) => a.status === "pending").length;
    const draft = all.filter((a) => a.status === "draft").length;
    const rejected = all.filter((a) => a.status === "rejected").length;
    const totalValue = all.reduce((sum, a) => sum + (a.price || 0), 0);

    const distinctCreators = Array.from(new Set(all.map((a) => a.creatorName))).sort();
    const distinctMedia = Array.from(new Set(all.map((a) => a.medium))).sort();

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
