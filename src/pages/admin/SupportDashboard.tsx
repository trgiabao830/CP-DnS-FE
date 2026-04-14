import React, { useState, useEffect, useRef } from "react";
import { Client } from "@stomp/stompjs";
import SockJS from "sockjs-client";
import {
  Search,
  Send,
  User,
  MessageSquare,
  Phone,
  Mail,
  Info,
} from "lucide-react";
import { format } from "date-fns";
import { toast } from "react-toastify";

interface Session {
  sessionId: number;
  guestSessionId: string;
  guestName: string;
  guestPhone?: string;
  guestEmail?: string;
  status: string;
  createdAt: string;
}

interface Message {
  msgId: number;
  message: string;
  senderType: string;
  senderName?: string;
  createdAt?: string;
}

const SupportDashboard: React.FC = () => {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [selectedSession, setSelectedSession] = useState<Session | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [filterStatus, setFilterStatus] = useState("ALL");

  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState("");

  const [isConnected, setIsConnected] = useState(false);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const stompClient = useRef<Client | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const subscriptionRef = useRef<any>(null);

  useEffect(() => {
    const handler = setTimeout(() => setDebouncedSearchTerm(searchTerm), 500);
    return () => clearTimeout(handler);
  }, [searchTerm]);

  useEffect(() => {
    const socket = new SockJS("http://localhost:8080/ws-chat");
    const client = new Client({
      webSocketFactory: () => socket,
      reconnectDelay: 5000,
      debug: (str) => console.log("[WS]", str),
      onConnect: () => {
        setIsConnected(true);

        client.subscribe("/topic/admin/sessions", () => {
          console.log(">>> Socket: List updated");
          setRefreshTrigger((prev) => prev + 1);
        });

        if (selectedSession)
          subscribeToSessionChat(client, selectedSession.guestSessionId);
      },
      onDisconnect: () => setIsConnected(false),
    });

    client.activate();
    stompClient.current = client;
    fetchSessions();

    return () => {
      if (client.active) client.deactivate();
    };
  }, []);

  const subscribeToSessionChat = (client: Client, guestSessionId: string) => {
    if (subscriptionRef.current) subscriptionRef.current.unsubscribe();

    subscriptionRef.current = client.subscribe(
      `/topic/chat/${guestSessionId}`,
      (msg) => {
        const body = JSON.parse(msg.body);
        const newMessage: Message = {
          msgId: body.msgId || body.id,
          message: body.content || body.message,
          senderType: body.senderType,
          senderName: body.senderName,
          createdAt: body.createdAt || new Date().toISOString(),
        };

        setMessages((prev) => {
          if (newMessage.msgId) {
            const exists = prev.some((m) => m.msgId === newMessage.msgId);
            if (exists) return prev;
          }
          return [...prev, newMessage];
        });
      },
    );
  };

  useEffect(() => {
    if (selectedSession?.sessionId) {
      fetchMessages(selectedSession.sessionId);
      if (stompClient.current && isConnected) {
        subscribeToSessionChat(
          stompClient.current,
          selectedSession.guestSessionId,
        );
      }
    }
  }, [selectedSession?.sessionId, isConnected]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const fetchSessions = async () => {
    try {
      const res = await fetch(
        `/api/admin/support/sessions${filterStatus !== "ALL" ? `?status=${filterStatus}` : ""}`,
      );
      if (res.ok) setSessions(await res.json());
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    fetchSessions();
  }, [filterStatus, refreshTrigger]);

  useEffect(() => {
    if (selectedSession && sessions.length > 0) {
      const updatedSession = sessions.find(
        (s) => s.sessionId === selectedSession.sessionId,
      );
      if (updatedSession && updatedSession.status !== selectedSession.status) {
        setSelectedSession(updatedSession);
      }
    }
  }, [sessions]);

  const fetchMessages = async (sid: number) => {
    try {
      setMessages([]);
      const res = await fetch(`/api/admin/support/sessions/${sid}/messages`);
      if (res.ok) setMessages(await res.json());
    } catch (e) {
      console.error(e);
    }
  };

  const handleAction = async (action: "ACCEPT" | "COMPLETE") => {
    if (!selectedSession?.sessionId) return;
    try {
      const res = await fetch("/api/admin/support/action", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionId: selectedSession.sessionId, action }),
      });
      if (res.ok) {
        const updatedData = await res.json();

        setSelectedSession(updatedData);
        setSessions((prev) =>
          prev.map((s) =>
            s.sessionId === selectedSession.sessionId ? updatedData : s,
          ),
        );

        if (action === "COMPLETE") setInput("");
        toast.success(
          action === "ACCEPT"
            ? "Đã tiếp nhận hỗ trợ!"
            : "Đã kết thúc phiên chat!",
        );
      }
    } catch (e) {
      toast.error("Lỗi kết nối máy chủ!");
    }
  };

  const sendMessage = () => {
    if (
      !input.trim() ||
      !selectedSession ||
      selectedSession.status !== "SERVING" ||
      !stompClient.current?.connected
    )
      return;

    const payload = {
      guestSessionId: selectedSession.guestSessionId,
      content: input,
      senderType: "EMPLOYEE",
      senderName: "Nhân viên hỗ trợ",
    };

    stompClient.current.publish({
      destination: "/app/chat.sendMessage",
      body: JSON.stringify(payload),
    });
    setInput("");
  };

  const filteredSessions = sessions.filter(
    (s) =>
      (s.guestName || "")
        .toLowerCase()
        .includes(debouncedSearchTerm.toLowerCase()) ||
      (s.guestPhone || "").includes(debouncedSearchTerm),
  );

  const formatFullTime = (dateString?: string) => {
    if (!dateString) return "";
    try {
      return format(new Date(dateString), "dd/MM/yyyy HH:mm");
    } catch {
      return dateString;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "PENDING":
        return (
          <span className="rounded bg-orange-100 px-2 py-0.5 text-[10px] font-bold uppercase text-orange-600">
            Chờ xử lý
          </span>
        );
      case "SERVING":
        return (
          <span className="rounded bg-blue-100 px-2 py-0.5 text-[10px] font-bold uppercase text-blue-600">
            Đang hỗ trợ
          </span>
        );
      case "COMPLETED":
        return (
          <span className="rounded bg-gray-100 px-2 py-0.5 text-[10px] font-bold uppercase text-gray-500">
            Hoàn thành
          </span>
        );
      default:
        return (
          <span className="rounded bg-gray-100 px-2 py-0.5 text-[10px] font-bold uppercase">
            {status}
          </span>
        );
    }
  };

  return (
    <div className="flex h-[calc(100vh-120px)] w-full overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
      {/* --- CỘT TRÁI: DANH SÁCH --- */}
      <div className="w-84 flex h-full flex-shrink-0 flex-col border-r border-gray-200 bg-white">
        <div className="flex-shrink-0 border-b border-gray-100 p-4">
          <h2 className="mb-4 flex items-center justify-between text-xl font-bold text-gray-800">
            Danh sách
            <span
              className={`flex items-center gap-1 text-[10px] font-normal ${isConnected ? "text-green-600" : "text-red-500"}`}
            >
              <span
                className={`h-2 w-2 rounded-full ${isConnected ? "bg-green-500" : "bg-red-500"}`}
              ></span>
              {isConnected ? "Trực tuyến" : "Mất kết nối"}
            </span>
          </h2>

          <div className="relative mb-4">
            <Search
              className="absolute left-3 top-2.5 text-gray-400"
              size={18}
            />
            <input
              type="text"
              placeholder="Tìm tên hoặc SĐT..."
              className="w-full rounded-lg border border-transparent bg-gray-50 py-2 pl-10 pr-4 text-sm outline-none transition focus:bg-white focus:ring-2 focus:ring-blue-500"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <div className="scrollbar-hide flex gap-2 overflow-x-auto pb-2 text-xs font-semibold">
            {["ALL", "PENDING", "SERVING", "COMPLETED"].map((st) => (
              <button
                key={st}
                onClick={() => setFilterStatus(st)}
                className={`whitespace-nowrap rounded-full px-3 py-1.5 transition ${filterStatus === st ? "bg-blue-600 text-white shadow-md" : "bg-gray-100 text-gray-500 hover:bg-gray-200"}`}
              >
                {st === "ALL"
                  ? "Tất cả"
                  : st === "PENDING"
                    ? "Chờ"
                    : st === "SERVING"
                      ? "Đang chat"
                      : "Hoàn thành"}
              </button>
            ))}
          </div>
        </div>

        <div className="custom-scrollbar flex-1 overflow-y-auto">
          {filteredSessions.map((s) => (
            <div
              key={s.sessionId}
              onClick={() => setSelectedSession(s)}
              className={`flex cursor-pointer items-start gap-3 border-b border-gray-50 p-4 transition hover:bg-gray-50 ${selectedSession?.sessionId === s.sessionId ? "border-l-4 border-l-blue-600 bg-blue-50" : ""}`}
            >
              <div className="relative shrink-0">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-blue-100 text-blue-600">
                  <User size={24} />
                </div>
                {s.status === "PENDING" && (
                  <span className="absolute -right-1 -top-1 h-3 w-3 animate-pulse rounded-full border-2 border-white bg-red-500"></span>
                )}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between">
                  <p className="truncate text-sm font-bold text-gray-800">
                    {s.guestName}
                  </p>
                  <span className="text-[10px] text-gray-400">
                    {s.createdAt
                      ? format(new Date(s.createdAt), "dd/MM/yyyy HH:mm")
                      : ""}
                  </span>
                </div>
                <p className="mt-0.5 truncate text-xs text-gray-500">
                  {s.guestPhone || "Khách vãng lai"}
                </p>
                <div className="mt-2">{getStatusBadge(s.status)}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* --- CỘT PHẢI: CHAT --- */}
      <div className="flex h-full flex-1 flex-col overflow-hidden bg-[#F5F7FA]">
        {selectedSession ? (
          <>
            {/* Header Chat */}
            <div className="z-10 flex flex-shrink-0 items-center justify-between border-b bg-white px-6 py-3 shadow-sm">
              <div className="flex items-center gap-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-100 text-blue-600">
                  <User size={20} />
                </div>
                <div>
                  <h3 className="font-bold text-gray-800">
                    {selectedSession.guestName}
                  </h3>
                  {/* 👇 RESPONSIVE: Thêm flex-wrap để xuống dòng khi màn hình nhỏ */}
                  <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-gray-500">
                    <span className="flex items-center gap-1">
                      <Phone size={14} />{" "}
                      {selectedSession.guestPhone || "Chưa có SĐT"}
                    </span>
                    <span className="flex items-center gap-1">
                      <Mail size={14} />{" "}
                      {selectedSession.guestEmail || "Chưa có Email"}
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex gap-2">
                {selectedSession.status === "PENDING" && (
                  <button
                    onClick={() => handleAction("ACCEPT")}
                    className="flex items-center gap-2 whitespace-nowrap rounded-lg bg-blue-600 px-4 py-2 text-sm font-bold text-white shadow-md transition hover:bg-blue-700"
                  >
                    Tiếp nhận
                  </button>
                )}
                {selectedSession.status === "SERVING" && (
                  <button
                    onClick={() => handleAction("COMPLETE")}
                    className="flex items-center gap-2 whitespace-nowrap rounded-lg border border-red-200 bg-white px-4 py-2 text-sm font-bold text-red-600 transition hover:bg-red-50"
                  >
                    Kết thúc
                  </button>
                )}
                {selectedSession.status === "COMPLETED" && (
                  <span className="flex cursor-not-allowed items-center gap-2 whitespace-nowrap rounded-lg bg-gray-100 px-4 py-2 text-sm font-bold text-gray-500">
                    Đã hoàn thành
                  </span>
                )}
              </div>
            </div>

            {/* Nội dung Chat */}
            <div className="custom-scrollbar flex-1 space-y-4 overflow-y-auto p-6">
              {messages.length === 0 ? (
                <div className="flex h-full flex-col items-center justify-center text-gray-400">
                  <div className="mb-4 rounded-full bg-gray-100 p-6">
                    <MessageSquare size={48} className="opacity-20" />
                  </div>
                  <p>Chưa có tin nhắn nào</p>
                </div>
              ) : (
                messages.map((m, i) => (
                  <div
                    key={m.msgId || i}
                    className={`flex flex-col ${m.senderType === "EMPLOYEE" ? "items-end" : "items-start"}`}
                  >
                    {m.senderType === "SYSTEM" ? (
                      <div className="flex w-full justify-center py-4">
                        <span className="flex items-center gap-2 rounded-full bg-gray-200 px-4 py-1.5 text-xs font-medium text-gray-600 shadow-sm">
                          <Info size={14} /> {m.message}
                        </span>
                      </div>
                    ) : (
                      <div
                        className={`flex max-w-[75%] flex-col gap-1 ${m.senderType === "EMPLOYEE" ? "items-end" : "items-start"}`}
                      >
                        <span className="ml-1 text-[11px] font-semibold text-gray-500">
                          {m.senderName ||
                            (m.senderType === "EMPLOYEE"
                              ? "Nhân viên"
                              : "Khách")}
                        </span>
                        <div
                          className={`px-4 py-2.5 text-sm leading-relaxed shadow-sm ${m.senderType === "EMPLOYEE" ? "rounded-2xl rounded-tr-none bg-blue-600 text-white" : "rounded-2xl rounded-tl-none border border-gray-200 bg-white text-gray-800"}`}
                        >
                          {m.message}
                        </div>
                        <span className="mt-0.5 flex items-center gap-1 text-[10px] text-gray-400">
                          {formatFullTime(m.createdAt)}
                        </span>
                      </div>
                    )}
                  </div>
                ))
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input Chat - Full Width */}
            <div className="flex-shrink-0 border-t border-gray-200 bg-white p-4">
              {/* 👇 XÓA max-w-4xl để input giãn full width */}
              <div className="flex w-full items-center gap-3 rounded-full border border-gray-200 bg-gray-50 p-1.5 transition-all focus-within:border-blue-400 focus-within:ring-2 focus-within:ring-blue-100">
                <input
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && sendMessage()}
                  disabled={selectedSession.status !== "SERVING"}
                  placeholder={
                    selectedSession.status === "SERVING"
                      ? "Nhập tin nhắn..."
                      : "Phiên chat chưa sẵn sàng..."
                  }
                  className="min-w-0 flex-1 bg-transparent px-4 py-2 text-sm placeholder-gray-400 outline-none disabled:cursor-not-allowed"
                />
                <button
                  onClick={sendMessage}
                  disabled={
                    !input.trim() || selectedSession.status !== "SERVING"
                  }
                  className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-blue-600 text-white shadow-md transition hover:scale-105 hover:bg-blue-700 active:scale-95 disabled:scale-100 disabled:bg-gray-300 disabled:shadow-none"
                >
                  <Send size={18} />
                </button>
              </div>
            </div>
          </>
        ) : (
          <div className="flex h-full flex-col items-center justify-center text-gray-400">
            <div className="mb-6 rounded-full bg-blue-50 p-8 shadow-sm">
              <MessageSquare size={64} className="text-blue-300" />
            </div>
            <h3 className="text-lg font-bold text-gray-600">
              Hỗ trợ khách hàng
            </h3>
            <p className="mt-2 text-sm opacity-60">
              Chọn một hội thoại từ danh sách bên trái để bắt đầu.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default SupportDashboard;
