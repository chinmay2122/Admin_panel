import { CorAdminNote } from "../types";
import { getSupabaseAdmin, isSupabaseConfigured } from "../supabase/server";

let notesStore: CorAdminNote[] = [];

function mapNoteFromSupabase(row: any): CorAdminNote {
  return {
    id: row.id,
    corMemberId: row.creator_id || undefined,
    applicationId: row.application_id || undefined,
    authorId: row.author_id || undefined,
    authorName: row.author_name || "Admin",
    content: row.content,
    isInternalOnly: true,
    createdAt: row.created_at || new Date().toISOString(),
  };
}

export const corNotesRepo = {
  /**
   * List internal notes for a member
   */
  async listForMember(memberId: string): Promise<CorAdminNote[]> {
    const supabase = getSupabaseAdmin();
    if (supabase) {
      try {
        const { data, error } = await (supabase.from("cor_admin_notes") as any)
          .select("*")
          .eq("creator_id", memberId)
          .order("created_at", { ascending: false });

        if (!error && Array.isArray(data)) {
          return data.map(mapNoteFromSupabase);
        } else if (error) {
          console.error("Supabase cor_admin_notes listForMember error:", error);
        }
      } catch (err) {
        console.error("Supabase cor_admin_notes query failed:", err);
      }
    }

    if (isSupabaseConfigured()) {
      return [];
    }

    return notesStore
      .filter((n) => n.corMemberId === memberId)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  },

  /**
   * List internal notes for a specific application
   */
  async listForApplication(applicationId: string): Promise<CorAdminNote[]> {
    const supabase = getSupabaseAdmin();
    if (supabase) {
      try {
        const { data, error } = await (supabase.from("cor_admin_notes") as any)
          .select("*")
          .eq("application_id", applicationId)
          .order("created_at", { ascending: false });

        if (!error && Array.isArray(data)) {
          return data.map(mapNoteFromSupabase);
        } else if (error) {
          console.error("Supabase cor_admin_notes listForApplication error:", error);
        }
      } catch (err) {
        console.error("Supabase cor_admin_notes query failed:", err);
      }
    }

    if (isSupabaseConfigured()) {
      return [];
    }

    return notesStore
      .filter((n) => n.applicationId === applicationId)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  },

  /**
   * Create an internal note
   */
  async create(data: Omit<CorAdminNote, "id" | "createdAt" | "isInternalOnly">): Promise<CorAdminNote> {
    const now = new Date().toISOString();
    const newNote: CorAdminNote = {
      ...data,
      id: `note_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
      isInternalOnly: true,
      createdAt: now,
    };

    const supabase = getSupabaseAdmin();
    if (supabase) {
      try {
        const { data: inserted, error } = await (supabase.from("cor_admin_notes") as any).insert({
          creator_id: data.corMemberId || null,
          application_id: data.applicationId || null,
          author_id: data.authorId || null,
          author_name: data.authorName || "Admin",
          content: data.content,
          is_internal_only: true,
        }).select().single();

        if (!error && inserted) {
          return mapNoteFromSupabase(inserted);
        }
      } catch (err) {
        console.error("Supabase cor_admin_notes insert failed:", err);
      }
    }

    notesStore.unshift(newNote);
    return newNote;
  },

  /**
   * Delete an internal note
   */
  async remove(id: string): Promise<boolean> {
    const supabase = getSupabaseAdmin();
    if (supabase) {
      try {
        const { error } = await (supabase.from("cor_admin_notes") as any)
          .delete()
          .eq("id", id);
        if (!error) return true;
      } catch (err) {
        console.error("Supabase cor_admin_notes delete failed:", err);
      }
    }

    const idx = notesStore.findIndex((n) => n.id === id);
    if (idx === -1) return false;
    notesStore.splice(idx, 1);
    return true;
  },
};
