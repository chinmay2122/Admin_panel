import { getSupabaseAdmin, isSupabaseConfigured } from "../supabase/server";

export interface InquiryChat {
  id: string;
  artworkId: string;
  artworkTitle?: string;
  artworkImage?: string;
  guestId: string;
  guestName?: string;
  guestEmail?: string;
  creatorId: string;
  creatorName?: string;
  status: "Active" | "Closed";
  createdAt: string;
  lastMessage?: string;
}

export interface InquiryMessage {
  id: string;
  chatId: string;
  senderId: string;
  senderName?: string;
  content: string;
  createdAt: string;
}

let mockChats: InquiryChat[] = [];
let mockMessages: InquiryMessage[] = [];

export const inquiriesRepo = {
  /**
   * List all inquiry chats directly from live database
   */
  async listChats(status?: "Active" | "Closed"): Promise<InquiryChat[]> {
    const supabase = getSupabaseAdmin();
    if (supabase) {
      try {
        let query = supabase
          .from("inquiries_chats")
          .select(`
            id,
            artwork_id,
            guest_id,
            creator_id,
            status,
            created_at,
            artworks:artwork_id (title, image_url),
            guest:guest_id (full_name, email),
            creator:creator_id (full_name)
          `)
          .order("created_at", { ascending: false });

        if (status) {
          query = query.eq("status", status);
        }

        const { data, error } = await query;
        if (!error && Array.isArray(data)) {
          return data.map((d: any) => ({
            id: d.id,
            artworkId: d.artwork_id,
            artworkTitle: d.artworks?.title ?? "Artwork",
            artworkImage: d.artworks?.image_url ?? "",
            guestId: d.guest_id,
            guestName: d.guest?.full_name ?? "Guest User",
            guestEmail: d.guest?.email ?? "",
            creatorId: d.creator_id,
            creatorName: d.creator?.full_name ?? "Creator",
            status: d.status,
            createdAt: d.created_at,
          }));
        } else if (error) {
          console.error("Supabase inquiries_chats error:", error);
        }
      } catch (err) {
        console.error("Supabase chats query failed:", err);
      }
    }

    if (isSupabaseConfigured()) {
      return [];
    }

    if (status) {
      return mockChats.filter((c) => c.status === status);
    }
    return [...mockChats];
  },

  /**
   * Get messages for a chat thread
   */
  async getMessages(chatId: string): Promise<InquiryMessage[]> {
    const supabase = getSupabaseAdmin();
    if (supabase) {
      try {
        const { data, error } = await supabase
          .from("messages")
          .select(`
            id,
            chat_id,
            sender_id,
            content,
            created_at,
            sender:sender_id (full_name)
          `)
          .eq("chat_id", chatId)
          .order("created_at", { ascending: true });

        if (!error && Array.isArray(data)) {
          return data.map((m: any) => ({
            id: m.id,
            chatId: m.chat_id,
            senderId: m.sender_id,
            senderName: m.sender?.full_name ?? "User",
            content: m.content,
            createdAt: m.created_at,
          }));
        } else if (error) {
          console.error("Supabase messages query error:", error);
        }
      } catch (err) {
        console.error("Supabase messages query failed:", err);
      }
    }

    if (isSupabaseConfigured()) {
      return [];
    }

    return mockMessages.filter((m) => m.chatId === chatId);
  },

  /**
   * Send a new message
   */
  async sendMessage(chatId: string, senderId: string, content: string): Promise<InquiryMessage | null> {
    const supabase = getSupabaseAdmin();
    if (supabase) {
      try {
        const { data, error } = await (supabase.from("messages") as any)
          .insert({
            chat_id: chatId,
            sender_id: senderId,
            content,
          })
          .select("*, sender:sender_id(full_name)")
          .single();

        if (!error && data) {
          return {
            id: (data as any).id,
            chatId: (data as any).chat_id,
            senderId: (data as any).sender_id,
            senderName: (data as any).sender?.full_name ?? "User",
            content: (data as any).content,
            createdAt: (data as any).created_at,
          };
        }
      } catch (err) {
        console.error("Supabase send message failed:", err);
      }
    }

    if (isSupabaseConfigured()) {
      return null;
    }

    const newMsg: InquiryMessage = {
      id: `msg_${Date.now()}`,
      chatId,
      senderId,
      content,
      createdAt: new Date().toISOString(),
    };
    mockMessages.push(newMsg);
    return newMsg;
  },

  /**
   * Update chat status
   */
  async updateStatus(chatId: string, status: "Active" | "Closed"): Promise<boolean> {
    const supabase = getSupabaseAdmin();
    if (supabase) {
      try {
        const { error } = await (supabase.from("inquiries_chats") as any)
          .update({ status })
          .eq("id", chatId);
        if (!error) return true;
      } catch (err) {
        console.error("Supabase update chat status failed:", err);
      }
    }

    if (isSupabaseConfigured()) {
      return false;
    }

    const chat = mockChats.find((c) => c.id === chatId);
    if (chat) {
      chat.status = status;
      return true;
    }
    return false;
  },
};
