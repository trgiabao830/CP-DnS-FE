
export interface ChatMessage {
  id?: number;
  guestSessionId: string;
  content: string;
  senderType: "GUEST" | "EMPLOYEE" | "SYSTEM";
  senderName?: string;
  createdAt?: string; 

  guestPhone?: string | null;
  guestEmail?: string | null;
  userId?: number | null;
}

export interface SupportSession {
  id: number;
  guestSessionId: string;
  guestName: string;
  status: "PENDING" | "SERVING" | "COMPLETED";
  createdAt: string;
  lastMessage?: string;

  guestPhone?: string | null;
  guestEmail?: string | null;
}

export const SOCKET_URL = "http://localhost:8080/ws-chat";
