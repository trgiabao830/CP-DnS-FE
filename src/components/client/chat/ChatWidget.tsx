import React, { useState, useEffect, useRef } from "react";
import { Client } from "@stomp/stompjs";
import SockJS from "sockjs-client";
import {
  MessageCircle,
  X,
  Send,
  Bot,
  Headset,
  ChevronLeft,
  Loader2,
  Info,
} from "lucide-react";
import { v4 as uuidv4 } from "uuid";
import { useClientAuth } from "../../../context/client/ClientAuthContext";
import { format } from "date-fns";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Link } from "react-router-dom";

const ChatWidget: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [mode, setMode] = useState<"MENU" | "GUEST_FORM" | "AI" | "SUPPORT">(
    "MENU",
  );
  const [messages, setMessages] = useState<any[]>([]);
  const [input, setInput] = useState("");
  const [guestSessionId, setGuestSessionId] = useState("");
  const [isAiTyping, setIsAiTyping] = useState(false);
  const [guestInfo, setGuestInfo] = useState({
    name: "",
    phone: "",
    email: "",
  });
  const [isFormValid, setIsFormValid] = useState(false);
  const stompClient = useRef<Client | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { user } = useClientAuth();

  useEffect(() => {
    // @ts-ignore
    const currentUserId = user ? user.userId || user.id : null;
    const currentIdentity = currentUserId ? `user_${currentUserId}` : "guest";
    const storedIdentity = localStorage.getItem("chat_identity");
    let sid = localStorage.getItem("chat_sid");

    if (currentIdentity !== storedIdentity || !sid) {
      sid = uuidv4();
      localStorage.setItem("chat_sid", sid);
      localStorage.setItem("chat_identity", currentIdentity);
      setMessages([]);
      setMode("MENU");
    }
    setGuestSessionId(sid);
  }, [user]);

  useEffect(() => {
    const isNameValid = guestInfo.name.trim().length > 0;
    const isPhoneValid = guestInfo.phone.trim().length > 0;
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const isEmailValid =
      guestInfo.email.trim().length > 0 && emailRegex.test(guestInfo.email);
    setIsFormValid(isNameValid && isPhoneValid && isEmailValid);
  }, [guestInfo]);

  useEffect(() => {
    if (mode === "SUPPORT" && guestSessionId) {
      const socket = new SockJS("http://localhost:8080/ws-chat");
      const client = new Client({
        webSocketFactory: () => socket,
        onConnect: () => {
          client.subscribe(`/topic/chat/${guestSessionId}`, (msg) => {
            const body = JSON.parse(msg.body);
            setMessages((prev) => [
              ...prev,
              {
                ...body,
                msgId: body.msgId || body.id,
                message: body.content || body.message,
                createdAt: body.createdAt || new Date().toISOString(),
              },
            ]);
          });
        },
      });
      client.activate();
      stompClient.current = client;
      return () => {
        if (client.active) client.deactivate();
      };
    }
  }, [mode, guestSessionId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isAiTyping]);

  const sendMessage = async () => {
    if (!input.trim()) return;

    if (mode === "AI") {
      const userMsg = {
        senderType: "GUEST",
        message: input,
        createdAt: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, userMsg]);
      const msgToSend = input;
      setInput("");
      setIsAiTyping(true);

      try {
        const res = await fetch("http://localhost:8080/api/chatbot/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            message: msgToSend,
            sessionId: guestSessionId,
          }),
        });

        if (res.ok) {
          const data = await res.json();
          setMessages((prev) => [
            ...prev,
            {
              senderType: "AI",
              senderName: "Trợ lý ảo",
              message: data.reply,
              createdAt: new Date().toISOString(),
            },
          ]);
        }
      } catch (error) {
        setMessages((prev) => [
          ...prev,
          { senderType: "SYSTEM", message: "Lỗi kết nối máy chủ." },
        ]);
      } finally {
        setIsAiTyping(false);
      }
      return;
    }

    if (!stompClient.current?.connected) return;
    // @ts-ignore
    const userId = user ? user.userId || user.id : null;
    const payload = {
      guestSessionId,
      content: input,
      senderType: "GUEST",
      senderName: user ? user.name || user.fullName : guestInfo.name,
      guestPhone: user ? user.phone : guestInfo.phone,
      guestEmail: user ? user.email : guestInfo.email,
      userId,
      createdAt: new Date().toISOString(),
    };
    stompClient.current.publish({
      destination: "/app/chat.sendMessage",
      body: JSON.stringify(payload),
    });
    setInput("");
  };

  const handleSwitchToAI = () => {
    setMessages([]);
    setMode("AI");
  };
  const handleStartChatSupport = () =>
    user ? setMode("SUPPORT") : setMode("GUEST_FORM");
  const handleGuestFormSubmit = () => isFormValid && setMode("SUPPORT");
  const formatTime = (dateString?: string) =>
    dateString ? format(new Date(dateString), "dd/MM/yyyy HH:mm") : "";

  return (
    <div className="fixed bottom-5 right-5 z-50 flex flex-col items-end">
      {isOpen && (
        <div className="animate-in slide-in-from-bottom-5 mb-4 flex h-[600px] w-80 flex-col overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-2xl duration-200 md:w-[450px]">
          <div className="flex items-center justify-between bg-blue-600 p-4 text-white">
            <div className="flex items-center gap-2">
              {mode !== "MENU" && (
                <button
                  onClick={() => setMode("MENU")}
                  className="mr-1 rounded-full p-1 transition hover:bg-blue-700"
                >
                  <ChevronLeft size={20} />
                </button>
              )}
              <span className="font-bold">
                {mode === "MENU"
                  ? "Hỗ trợ CP-DNS"
                  : mode === "AI"
                    ? "Trợ lý AI"
                    : "Hỗ trợ viên"}
              </span>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="rounded-full p-1 transition hover:bg-blue-700"
            >
              <X size={20} />
            </button>
          </div>

          <div className="custom-scrollbar flex-1 overflow-y-auto bg-gray-50 p-4">
            {mode === "MENU" && (
              <div className="animate-in fade-in flex h-full flex-col justify-center space-y-4">
                <button
                  onClick={handleSwitchToAI}
                  className="group flex items-center gap-3 rounded-xl border border-gray-200 bg-white p-4 transition hover:bg-blue-50"
                >
                  <div className="rounded-full bg-purple-100 p-2 text-purple-600">
                    <Bot size={24} />
                  </div>
                  <div className="text-left">
                    <p className="text-sm font-bold">Chatbot AI</p>
                    <p className="text-xs text-gray-400">
                      Đặt phòng/bàn tự động
                    </p>
                  </div>
                </button>
                <button
                  onClick={handleStartChatSupport}
                  className="group flex items-center gap-3 rounded-xl border border-gray-200 bg-white p-4 transition hover:bg-blue-50"
                >
                  <div className="rounded-full bg-blue-100 p-2 text-blue-600">
                    <Headset size={24} />
                  </div>
                  <div className="text-left">
                    <p className="text-sm font-bold">Nhân viên hỗ trợ</p>
                    <p className="text-xs text-gray-400">
                      Gặp trực tiếp tư vấn viên
                    </p>
                  </div>
                </button>
              </div>
            )}

            {mode === "GUEST_FORM" && (
              <div className="space-y-3 pt-10">
                <h3 className="text-center font-bold">Để lại thông tin</h3>
                <input
                  type="text"
                  className="w-full rounded-lg border p-2.5 text-sm"
                  placeholder="Họ và tên *"
                  value={guestInfo.name}
                  onChange={(e) =>
                    setGuestInfo({ ...guestInfo, name: e.target.value })
                  }
                />
                <input
                  type="text"
                  className="w-full rounded-lg border p-2.5 text-sm"
                  placeholder="SĐT *"
                  value={guestInfo.phone}
                  onChange={(e) =>
                    setGuestInfo({ ...guestInfo, phone: e.target.value })
                  }
                />
                <input
                  type="email"
                  className="w-full rounded-lg border p-2.5 text-sm"
                  placeholder="Email *"
                  value={guestInfo.email}
                  onChange={(e) =>
                    setGuestInfo({ ...guestInfo, email: e.target.value })
                  }
                />
                <button
                  onClick={handleGuestFormSubmit}
                  disabled={!isFormValid}
                  className="w-full rounded-lg bg-blue-600 py-2.5 text-white disabled:bg-gray-300"
                >
                  Bắt đầu chat
                </button>
              </div>
            )}

            {(mode === "SUPPORT" || mode === "AI") && (
              <div className="space-y-4">
                {messages.map((m, i) => {
                  if (m.senderType === "SYSTEM") {
                    return (
                      <div key={i} className="flex w-full justify-center py-2">
                        <span className="flex items-center gap-2 rounded-full bg-gray-200 px-4 py-1.5 text-xs font-medium text-gray-600 shadow-sm">
                          <Info size={14} /> {m.message}
                        </span>
                      </div>
                    );
                  }

                  return (
                    <div
                      key={i}
                      className={`flex flex-col ${m.senderType === "GUEST" ? "items-end" : "items-start"}`}
                    >
                      <span className="mb-1 text-[10px] text-gray-400">
                        {m.senderName ||
                          (m.senderType === "GUEST" ? "Bạn" : "AI")}
                      </span>

                      <div
                        className={`max-w-[95%] overflow-hidden rounded-2xl px-3 py-2 text-sm shadow-sm ${m.senderType === "GUEST" ? "bg-blue-600 text-white" : "bg-white text-gray-800"}`}
                      >
                        <ReactMarkdown
                          remarkPlugins={[remarkGfm]}
                          components={{
                            a: ({ node, ...props }) => {
                              const href = props.href || "";
                              if (href.startsWith("/")) {
                                return (
                                  <Link
                                    to={href}
                                    className="mt-2 block w-full rounded-lg border border-blue-200 bg-blue-50 p-2.5 text-center text-xs font-bold text-blue-700 transition-colors hover:bg-blue-100 hover:text-blue-800 hover:shadow-sm"
                                  >
                                    {props.children}
                                  </Link>
                                );
                              }
                              if (href.startsWith("mailto:")) {
                                return (
                                  <a
                                    {...props}
                                    className="underline hover:text-blue-500"
                                    title="Gửi email"
                                  >
                                    {props.children}
                                  </a>
                                );
                              }
                              return (
                                <a
                                  {...props}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="underline hover:text-blue-500"
                                >
                                  {props.children}
                                </a>
                              );
                            },
                            ul: ({ node, ...props }) => (
                              <ul className="ml-4 mt-1 list-disc" {...props} />
                            ),
                            table: ({ node, ...props }) => (
                              <div className="my-2 overflow-x-auto rounded-lg border border-gray-200 bg-white">
                                <table
                                  className="w-full min-w-[300px] text-left text-xs text-gray-700"
                                  {...props}
                                />
                              </div>
                            ),
                            thead: ({ node, ...props }) => (
                              <thead
                                className="bg-gray-100 font-bold text-gray-700"
                                {...props}
                              />
                            ),
                            th: ({ node, ...props }) => (
                              <th
                                className="whitespace-nowrap border-b border-r border-gray-200 px-2 py-2 last:border-r-0"
                                {...props}
                              />
                            ),
                            td: ({ node, ...props }) => (
                              <td
                                className="border-b border-r border-gray-100 px-2 py-2 last:border-r-0"
                                {...props}
                              />
                            ),
                          }}
                        >
                          {m.message}
                        </ReactMarkdown>
                      </div>
                      <span className="mt-1 text-[9px] text-gray-400">
                        {formatTime(m.createdAt)}
                      </span>
                    </div>
                  );
                })}
                {isAiTyping && (
                  <div className="flex w-fit animate-pulse gap-1 rounded-lg bg-white p-2">
                    <Loader2 size={16} className="animate-spin text-blue-600" />
                    <span className="text-xs text-gray-400">
                      AI đang xử lý...
                    </span>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>
            )}
          </div>

          {(mode === "SUPPORT" || mode === "AI") && (
            <div className="border-t bg-white p-3">
              <div className="flex gap-2 rounded-full bg-gray-100 px-4 py-1">
                <input
                  type="text"
                  className="flex-1 bg-transparent py-2 text-sm outline-none"
                  placeholder="Nhập tin nhắn..."
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && sendMessage()}
                />
                <button
                  onClick={sendMessage}
                  className="text-blue-600 transition-transform hover:scale-110"
                >
                  <Send size={20} />
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex h-14 w-14 items-center justify-center rounded-full bg-blue-600 text-white shadow-xl transition-all hover:scale-110"
      >
        {isOpen ? <X size={28} /> : <MessageCircle size={28} />}
      </button>
    </div>
  );
};

export default ChatWidget;
