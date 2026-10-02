import { getSupabaseAdmin } from "../supabase/server";

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

// In-memory fallback if Supabase is not connected
let mockChats: InquiryChat[] = [
  {
    id: "chat_01",
    artworkId: "art_01",
    artworkTitle: "Resonance in Ochre IV",
    artworkImage: "https://images.unsplash.com/photo-1579783902614-a3fb3927b675?w=800",
    guestId: "usr_04",
    guestName: "Elena Rostova",
    guestEmail: "elena@rostova.gallery",
    creatorId: "crt_01",
    creatorName: "Sora Takahashi",
    status: "Active",
    createdAt: new Date().toISOString(),
    lastMessage: "Is this piece available for international shipping?",
  },
];

let mockMessages: InquiryMessage[] = [
  {
    id: "msg_01",
    chatId: "chat_01",
    senderId: "usr_04",
    senderName: "Elena Rostova",
    content: "Hello Sora, is this piece available for international shipping?",
    createdAt: new Date(Date.now() - 3600000).toISOString(),
  },
  {
    id: "msg_02",
    chatId: "chat_01",
    senderId: "crt_01",
    senderName: "Sora Takahashi",
    content: "Yes Elena, we can crate and insure it for gallery delivery worldwide.",
    createdAt: new Date().toISOString(),
  },
];

export const inquiriesRepo = {
  /**
   * List all inquiry chats
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
        if (!error && data && data.length > 0) {
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
        }
      } catch (err) {
        console.warn("Supabase chats query failed, using mock data:", err);
      }
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

        if (!error && data) {
          return data.map((m: any) => ({
            id: m.id,
            chatId: m.chat_id,
            senderId: m.sender_id,
            senderName: m.sender?.full_name ?? "User",
            content: m.content,
            createdAt: m.created_at,
          }));
        }
      } catch (err) {
        console.warn("Supabase messages query failed, using mock data:", err);
      }
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
        console.warn("Supabase send message failed, using mock:", err);
      }
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
        console.warn("Supabase update chat status failed:", err);
      }
    }

    const chat = mockChats.find((c) => c.id === chatId);
    if (chat) {
      chat.status = status;
      return true;
    }
    return false;
  },
};
