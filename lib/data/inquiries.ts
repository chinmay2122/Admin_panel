import { getSupabaseAdmin, isSupabaseConfigured } from "../supabase/server";
import { CollectorArtworkInterest } from "../types";

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
  status: "Active" | "Closed" | string;
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

function mapInterestFromSupabase(row: any, collectorId: string): CollectorArtworkInterest {
  const art = row.artworks || {};
  const creator = row.creator || {};
  const guest = row.guest || {};
  const rawMessages: any[] = Array.isArray(row.messages) ? row.messages : [];

  const messages = rawMessages
    .slice()
    .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())
    .map((m) => {
      const isCollector = m.sender_id === collectorId || m.sender_id === row.guest_id;
      return {
        id: m.id,
        senderId: m.sender_id,
        senderName: isCollector
          ? guest.full_name || "Collector"
          : creator.full_name || art.artist_name || "Creator",
        content: m.content || "",
        createdAt: m.created_at,
        isCollector,
      };
    });

  const initialMsg = messages.length > 0 ? messages[0].content : undefined;
  const lastMsgObj = messages.length > 0 ? messages[messages.length - 1] : undefined;

  return {
    id: row.id,
    artworkId: row.artwork_id,
    artworkTitle: art.title || "Untitled Artwork",
    artworkImage: art.image_url || "",
    additionalImages: art.additional_images || [],
    artistName: art.artist_name || creator.full_name || "Unknown Artist",
    artType: art.art_type || "Artwork",
    dimensions: art.dimensions || undefined,
    year: art.year || undefined,
    location: art.location || undefined,
    collection: art.collection || undefined,
    description: art.description || undefined,
    price: art.price !== undefined && art.price !== null ? Number(art.price) : null,
    priceVisibility: art.price_visibility || "Show Price",
    artworkStatus: art.status || "Available",
    externalLink: art.external_link || undefined,
    creatorId: row.creator_id,
    creatorName: creator.full_name || art.artist_name || "Creator",
    creatorEmail: creator.email || undefined,
    creatorPhone: creator.phone_number || undefined,
    creatorAvatar: creator.profile_pic_url || undefined,
    collectorId: row.guest_id,
    collectorName: guest.full_name || "Collector",
    collectorEmail: guest.email || undefined,
    status: row.status || "Active",
    createdAt: row.created_at,
    initialMessage: initialMsg,
    lastMessage: lastMsgObj?.content,
    lastMessageAt: lastMsgObj?.createdAt,
    messagesCount: messages.length,
    messages,
  };
}

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
  async updateStatus(chatId: string, status: "Active" | "Closed" | string): Promise<boolean> {
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

  /**
   * List all artworks for which a specific collector has expressed interest
   */
  async listInterestsByCollector(collectorId: string): Promise<CollectorArtworkInterest[]> {
    const supabase = getSupabaseAdmin();
    if (supabase) {
      try {
        const { data, error } = await supabase
          .from("inquiries_chats")
          .select(`
            id,
            artwork_id,
            guest_id,
            creator_id,
            status,
            created_at,
            artworks:artwork_id (*),
            guest:guest_id (*),
            creator:creator_id (*),
            messages:messages (*)
          `)
          .eq("guest_id", collectorId)
          .order("created_at", { ascending: false });

        if (!error && Array.isArray(data)) {
          return data.map((d: any) => mapInterestFromSupabase(d, collectorId));
        } else if (error) {
          console.error("Supabase listInterestsByCollector error:", error);
        }
      } catch (err) {
        console.error("Supabase listInterestsByCollector query failed:", err);
      }
    }

    if (isSupabaseConfigured()) {
      return [];
    }

    return [];
  },

  /**
   * Get count of inquiries/interests per collector
   */
  async getInquiryCountsByCollector(): Promise<Record<string, number>> {
    const supabase = getSupabaseAdmin();
    const counts: Record<string, number> = {};
    if (supabase) {
      try {
        const { data, error } = await supabase
          .from("inquiries_chats")
          .select("id, guest_id");

        if (!error && Array.isArray(data)) {
          data.forEach((row: any) => {
            if (row.guest_id) {
              counts[row.guest_id] = (counts[row.guest_id] || 0) + 1;
            }
          });
          return counts;
        } else if (error) {
          console.error("Supabase getInquiryCountsByCollector error:", error);
        }
      } catch (err) {
        console.error("Supabase getInquiryCountsByCollector failed:", err);
      }
    }

    return counts;
  },
};
