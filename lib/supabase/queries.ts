import { getSupabaseAdmin } from "./server";
import { Database } from "./types";

/**
 * ==============================================================================
 * SUPABASE QUERY EXAMPLES & HELPER FUNCTIONS
 * ==============================================================================
 * Use this file as a blueprint whenever you or your team want to add new queries.
 *
 * HOW TO ADD A NEW QUERY:
 * 1. Simple Select:
 *    const { data, error } = await supabase.from('table_name').select('*');
 *
 * 2. Select with Join / Foreign Relations:
 *    const { data, error } = await supabase.from('artworks').select('*, profiles(*)');
 *
 * 3. Filters:
 *    .eq('column', value)
 *    .ilike('column', `%${search}%`)
 *    .in('status', ['published', 'pending'])
 *    .order('created_at', { ascending: false })
 *    .range(0, 19) // pagination
 *
 * 4. Insert:
 *    const { data, error } = await supabase.from('artworks').insert(newArtwork).select().single();
 *
 * 5. Update:
 *    const { data, error } = await supabase.from('artworks').update({ price: 5000 }).eq('id', id);
 *
 * 6. Delete:
 *    const { error } = await supabase.from('artworks').delete().eq('id', id);
 *
 * 7. Call a custom PostgreSQL function (RPC):
 *    const { data, error } = await supabase.rpc('my_custom_function', { param1: 'val' });
 * ==============================================================================
 */

type ProfileRow = Database["public"]["Tables"]["profiles"]["Row"];
type ArtworkRow = Database["public"]["Tables"]["artworks"]["Row"];
type ChatRow = Database["public"]["Tables"]["inquiries_chats"]["Row"];
type MessageRow = Database["public"]["Tables"]["messages"]["Row"];

export const supabaseQueries = {
  /**
   * Fetch artworks with creator profile joined
   */
  async getArtworksWithCreators() {
    const supabase = getSupabaseAdmin();
    if (!supabase) return null;

    const { data, error } = await supabase
      .from("artworks")
      .select("*, profiles(*)")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching artworks with creators:", error);
      throw error;
    }
    return data;
  },

  /**
   * Fetch chat threads for a specific artwork or creator
   */
  async getChatsForCreator(creatorId: string) {
    const supabase = getSupabaseAdmin();
    if (!supabase) return null;

    const { data, error } = await supabase
      .from("inquiries_chats")
      .select(`
        *,
        artworks (id, title, image_url, price),
        guest:guest_id (id, full_name, email, profile_pic_url)
      `)
      .eq("creator_id", creatorId)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching chats:", error);
      throw error;
    }
    return data;
  },

  /**
   * Fetch all messages in a chat thread
   */
  async getChatMessages(chatId: string) {
    const supabase = getSupabaseAdmin();
    if (!supabase) return null;

    const { data, error } = await supabase
      .from("messages")
      .select(`
        *,
        sender:sender_id (id, full_name, profile_pic_url, role)
      `)
      .eq("chat_id", chatId)
      .order("created_at", { ascending: true });

    if (error) {
      console.error("Error fetching messages:", error);
      throw error;
    }
    return data;
  },

  /**
   * Send a new message in an inquiry chat
   */
  async sendMessage(chatId: string, senderId: string, content: string) {
    const supabase = getSupabaseAdmin();
    if (!supabase) return null;

    const { data, error } = await (supabase.from("messages") as any)
      .insert({
        chat_id: chatId,
        sender_id: senderId,
        content: content.trim(),
      })
      .select()
      .single();

    if (error) {
      console.error("Error sending message:", error);
      throw error;
    }
    return data;
  },

  /**
   * Update chat status (e.g. 'Active' -> 'Closed')
   */
  async updateChatStatus(chatId: string, status: "Active" | "Closed") {
    const supabase = getSupabaseAdmin();
    if (!supabase) return null;

    const { data, error } = await (supabase.from("inquiries_chats") as any)
      .update({ status })
      .eq("id", chatId)
      .select()
      .single();

    if (error) {
      console.error("Error updating chat status:", error);
      throw error;
    }
    return data;
  },
};
