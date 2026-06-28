"use client";

import React, { useState, useRef, useEffect, useCallback } from "react";
import Link from "next/link";
import {
  MessageCircle, X, Send, Bot, User, Loader2, ChevronDown,
  Sparkles, RotateCcw, History, Trash2, Clock, Search,
  PlusCircle, Activity, ArrowLeft,
} from "lucide-react";
import { getToken, isLoggedIn } from "@/lib/auth";
import { logger } from "@/lib/logger";

/* ─── Types ─────────────────────────────────────────────────────── */
interface Message {
  role: "user" | "assistant";
  content: string;
  model?: string;
  isError?: boolean;
  action?: { type: string; parameters: any };
}

interface ChatSession {
  _id: string;
  title: string;
  updatedAt: string;
  messages: { role: string; content: string }[];
}

/* ─── Quick prompts ──────────────────────────────────────────────── */
const QUICK_PROMPTS = [
  "What blood types are compatible with O-?",
  "How do I register as a donor?",
  "What should I do in a blood emergency?",
  "Explain the urgency levels",
];

const WELCOME: Message = {
  role: "assistant",
  content:
    "Hi! I'm **BloodBot** 🩸 — your AI assistant for BloodMatch.\n\nI can help with blood type compatibility, how to use the platform, or emergency guidance. How can I help you today?",
};

/* ─── Sub-components ─────────────────────────────────────────────── */
function TypingDots() {
  return (
    <div className="flex items-center gap-1.5 py-1">
      <span className="w-2 h-2 rounded-full bg-red-400 animate-bounce [animation-delay:0ms]" />
      <span className="w-2 h-2 rounded-full bg-red-400 animate-bounce [animation-delay:150ms]" />
      <span className="w-2 h-2 rounded-full bg-red-400 animate-bounce [animation-delay:300ms]" />
    </div>
  );
}

function MessageSkeleton() {
  return (
    <div className="space-y-3 animate-pulse px-4 py-3">
      <div className="flex gap-2">
        <div className="w-6 h-6 rounded-full bg-white/10 flex-shrink-0" />
        <div className="space-y-1.5 flex-1">
          <div className="h-3 bg-white/10 rounded w-3/4" />
          <div className="h-3 bg-white/10 rounded w-1/2" />
        </div>
      </div>
      <div className="flex gap-2 flex-row-reverse">
        <div className="w-6 h-6 rounded-full bg-red-900/30 flex-shrink-0" />
        <div className="h-8 bg-red-900/20 rounded-2xl w-1/2" />
      </div>
      <div className="flex gap-2">
        <div className="w-6 h-6 rounded-full bg-white/10 flex-shrink-0" />
        <div className="space-y-1.5 flex-1">
          <div className="h-3 bg-white/10 rounded w-full" />
          <div className="h-3 bg-white/10 rounded w-2/3" />
          <div className="h-3 bg-white/10 rounded w-4/5" />
        </div>
      </div>
    </div>
  );
}

/* ─── Main component ─────────────────────────────────────────────── */
export default function AiChatBot() {
  // Panel open/close
  const [isOpen, setIsOpen] = useState(false);
  // "chat" = chat view, "history" = history list view
  const [view, setView] = useState<"chat" | "history">("chat");

  // Chat state
  const [messages, setMessages] = useState<Message[]>([WELCOME]);
  const [input, setInput] = useState("");
  const [isAiLoading, setIsAiLoading] = useState(false);      // AI response in-flight
  const [isSessionLoading, setIsSessionLoading] = useState(false); // session fetch in-flight
  const [chatSessionId, setChatSessionId] = useState<string | null>(null);
  const [hasNewMessage, setHasNewMessage] = useState(false);

  // History state
  const [historyList, setHistoryList] = useState<ChatSession[]>([]);
  const [isHistoryLoading, setIsHistoryLoading] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const [isUserLoggedIn, setIsUserLoggedIn] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  /* ── Helpers ── */
  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  const startNewChat = useCallback(() => {
    setMessages([WELCOME]);
    setChatSessionId(null);
    setInput("");
    setView("chat");
  }, []);

  /* ── Fetch history list ── */
  const fetchHistory = useCallback(async () => {
    if (!isLoggedIn()) return;
    setIsHistoryLoading(true);
    try {
      const res = await fetch("/api/chat/history", {
        headers: { Authorization: `Bearer ${getToken()}` },
      });
      if (res.ok) {
        const data = await res.json();
        setHistoryList(data.histories || []);
      }
    } catch (err: any) {
      logger.error("Failed to fetch chat history:", err);
    } finally {
      setIsHistoryLoading(false);
    }
  }, []);

  /* ── Switch to history view ── */
  const openHistory = useCallback(() => {
    setView("history");
    fetchHistory();
  }, [fetchHistory]);

  /* ── Load a specific session ──
     Key design: switch to chat view immediately, show skeleton while loading.
     Input is NEVER disabled during this — user can type straight away.
  ── */
  const loadSession = useCallback(async (sessionId: string) => {
    // Switch to chat view right away so user sees the panel
    setView("chat");
    setIsSessionLoading(true);
    setMessages([]); // clear optimistically so skeleton shows

    try {
      const res = await fetch(`/api/chat/history?id=${sessionId}`, {
        headers: { Authorization: `Bearer ${getToken()}` },
      });

      if (res.ok) {
        const data = await res.json();
        if (data.session?.messages?.length) {
          const loaded: Message[] = data.session.messages.map((m: any) => ({
            role: m.role as "user" | "assistant",
            content: m.content,
            model: m.model,
          }));
          setMessages(loaded);
          setChatSessionId(sessionId);
        } else {
          // Session empty or not found — fall back to welcome
          setMessages([WELCOME]);
          setChatSessionId(null);
        }
      } else {
        setMessages([WELCOME]);
        setChatSessionId(null);
      }
    } catch (err: any) {
      logger.error("Failed to load session:", err);
      setMessages([WELCOME]);
      setChatSessionId(null);
    } finally {
      setIsSessionLoading(false);
    }
  }, []);

  /* ── Delete a session ── */
  const deleteSession = useCallback(async (e: React.MouseEvent, sessionId: string) => {
    e.stopPropagation();
    setDeletingId(sessionId);
    try {
      const res = await fetch(`/api/chat/history?id=${sessionId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${getToken()}` },
      });
      if (res.ok) {
        setHistoryList((prev) => prev.filter((s) => s._id !== sessionId));
        if (chatSessionId === sessionId) startNewChat();
      }
    } catch (err: any) {
      logger.error("Failed to delete session:", err);
    } finally {
      setDeletingId(null);
    }
  }, [chatSessionId, startNewChat]);

  /* ── Effects ── */
  useEffect(() => {
    const loggedIn = isLoggedIn();
    setIsUserLoggedIn(loggedIn);
    if (isOpen) {
      setHasNewMessage(false);
      inputRef.current?.focus();
    }
  }, [isOpen]);

  useEffect(() => {
    if (view === "chat") scrollToBottom();
  }, [messages, view, scrollToBottom]);

  /* ── Send message ── */
  const sendMessage = useCallback(async (text: string) => {
    const trimmed = text.trim();
    if (!trimmed || isAiLoading) return;

    const userMsg: Message = { role: "user", content: trimmed };
    const updatedMessages = [...messages, userMsg];
    setMessages(updatedMessages);
    setInput("");
    setIsAiLoading(true);

    try {
      const headers: Record<string, string> = { "Content-Type": "application/json" };
      const token = getToken();
      if (token) headers["Authorization"] = `Bearer ${token}`;

      const res = await fetch("/api/chat", {
        method: "POST",
        headers,
        body: JSON.stringify({ messages: updatedMessages, chatSessionId }),
      });

      const data = await res.json();

      if (res.ok) {
        setMessages((prev) => [
          ...prev,
          {
            role: "assistant",
            content: data.reply || "Sorry, I couldn't process that.",
            model: data.model,
            action: data.action,
          },
        ]);
        if (data.chatSessionId) {
          setChatSessionId(data.chatSessionId);
          if (isUserLoggedIn && !chatSessionId) fetchHistory();
        }
      } else {
        setMessages((prev) => [
          ...prev,
          {
            role: "assistant",
            content: data.error || "Sorry, I encountered an error.",
            isError: true,
            model: data.model,
          },
        ]);
      }

      if (!isOpen) setHasNewMessage(true);
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: "Connection error. Please check your connection and try again.",
          isError: true,
        },
      ]);
    } finally {
      setIsAiLoading(false);
    }
  }, [messages, isAiLoading, isOpen, chatSessionId, isUserLoggedIn, fetchHistory]);

  /* ── Toggle availability via AI action ── */
  const handleToggleAvailability = useCallback(async (targetState: boolean) => {
    try {
      const res = await fetch("/api/donors/availability", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${getToken()}`,
        },
        body: JSON.stringify({ isAvailable: targetState }),
      });
      if (res.ok) {
        const userStr = localStorage.getItem("user");
        if (userStr) {
          const user = JSON.parse(userStr);
          user.isAvailable = targetState;
          localStorage.setItem("user", JSON.stringify(user));
          window.dispatchEvent(new Event("storage"));
        }
        setMessages((prev) => [
          ...prev,
          {
            role: "assistant",
            content: `✅ Done! Your status is now **${targetState ? "Available" : "Unavailable"}**.`,
          },
        ]);
      }
    } catch {
      alert("Connection error. Failed to toggle status.");
    }
  }, []);

  /* ── Markdown renderer ── */
  const renderContent = (text: string) => {
    return text.split("\n").map((line, lineIdx) => {
      const isBullet = line.trim().startsWith("- ") || line.trim().startsWith("* ");
      const isNumbered = /^\d+\.\s/.test(line.trim());

      let cleanLine = line;
      if (isBullet) cleanLine = line.trim().replace(/^[-*]\s+/, "");
      else if (isNumbered) cleanLine = line.trim().replace(/^\d+\.\s+/, "");

      const parts = cleanLine.split(/(\*\*[^*]+\*\*)/g);
      const parsed = parts.map((part, i) =>
        part.startsWith("**") && part.endsWith("**") ? (
          <strong key={i} className="font-semibold text-white">{part.slice(2, -2)}</strong>
        ) : (
          <span key={i}>{part}</span>
        )
      );

      if (isBullet) return (
        <div key={lineIdx} className="flex items-start gap-1.5 ml-2 my-0.5">
          <span className="text-red-400 mt-1 select-none flex-shrink-0">•</span>
          <div className="flex-1 text-gray-100">{parsed}</div>
        </div>
      );

      if (isNumbered) {
        const num = line.trim().match(/^(\d+)\.\s+/)?.[1] ?? "1";
        return (
          <div key={lineIdx} className="flex items-start gap-1.5 ml-2 my-0.5">
            <span className="text-red-400 font-bold select-none flex-shrink-0">{num}.</span>
            <div className="flex-1 text-gray-100">{parsed}</div>
          </div>
        );
      }

      return <p key={lineIdx} className={lineIdx > 0 ? "mt-1.5" : ""}>{parsed}</p>;
    });
  };

  /* ─────────────────────────── RENDER ───────────────────────────── */
  return (
    <>
      {/* ── FAB ── */}
      <button
        id="chatbot-toggle-btn"
        onClick={() => setIsOpen((o) => !o)}
        aria-label={isOpen ? "Close BloodBot" : "Open BloodBot AI Chat"}
        className={`fixed bottom-5 right-5 z-50 w-14 h-14 rounded-full flex items-center justify-center shadow-2xl transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-red-500/50 ${
          isOpen
            ? "bg-slate-800 scale-95"
            : "bg-gradient-to-br from-red-600 to-rose-700 hover:scale-110 hover:shadow-red-500/40"
        }`}
      >
        {isOpen ? (
          <ChevronDown className="w-6 h-6 text-white" />
        ) : (
          <>
            <MessageCircle className="w-6 h-6 text-white" />
            {hasNewMessage && (
              <span className="absolute -top-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-white animate-pulse" />
            )}
          </>
        )}
      </button>

      {/* ── Panel ── */}
      <div
        id="chatbot-window"
        role="dialog"
        aria-label="BloodBot AI Chat"
        aria-modal="true"
        className={`fixed z-50 flex flex-col overflow-hidden border border-gray-700/60 shadow-2xl rounded-2xl transition-all duration-300 bottom-24 right-5 w-[360px] max-w-[calc(100vw-2.5rem)] ${
          isOpen
            ? "opacity-100 translate-y-0 scale-100 pointer-events-auto"
            : "opacity-0 translate-y-3 scale-95 pointer-events-none"
        }`}
        style={{
          background: "linear-gradient(160deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)",
          maxHeight: "min(600px, calc(100dvh - 120px))",
        }}
      >
        {/* ── Header ── */}
        <div className="flex items-center gap-2.5 px-4 py-3 border-b border-white/10 bg-white/5 backdrop-blur-sm flex-shrink-0">
          {/* Back button when in history view */}
          {view === "history" ? (
            <button
              type="button"
              onClick={() => setView("chat")}
              aria-label="Back to chat"
              className="w-8 h-8 rounded-lg flex items-center justify-center text-gray-400 hover:text-white hover:bg-white/10 transition-colors flex-shrink-0"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
          ) : (
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-red-600 to-rose-700 flex items-center justify-center flex-shrink-0 shadow-lg">
              <Bot className="w-5 h-5 text-white" />
            </div>
          )}

          <div className="flex-1 min-w-0">
            {view === "history" ? (
              <span className="text-sm font-bold text-white">Chat History</span>
            ) : (
              <>
                <div className="flex items-center gap-1.5">
                  <span className="text-sm font-bold text-white">BloodBot</span>
                  <Sparkles className="w-3 h-3 text-yellow-400" />
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
                  <span className="text-xs text-gray-400">Powered by Gemini AI</span>
                </div>
              </>
            )}
          </div>

          <div className="flex items-center gap-1">
            {/* New chat */}
            {view === "chat" && (
              <button
                type="button"
                onClick={startNewChat}
                aria-label="New chat"
                title="New chat"
                className="w-8 h-8 rounded-lg flex items-center justify-center text-gray-400 hover:text-white hover:bg-white/10 transition-colors"
              >
                <RotateCcw className="w-4 h-4" />
              </button>
            )}

            {/* History */}
            {isUserLoggedIn && view === "chat" && (
              <button
                type="button"
                onClick={openHistory}
                aria-label="View chat history"
                title="View chat history"
                className="w-8 h-8 rounded-lg flex items-center justify-center text-gray-400 hover:text-white hover:bg-white/10 transition-colors"
              >
                <History className="w-4 h-4" />
              </button>
            )}

            {/* Close */}
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              aria-label="Close chat"
              className="w-8 h-8 rounded-lg flex items-center justify-center text-gray-400 hover:text-white hover:bg-white/10 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* ══════════════════════════════════════════════════
            VIEW: HISTORY
            Full list of past sessions, no overlay.
            Clicking a session instantly switches to chat view
            and loads in the background — input is always usable.
        ══════════════════════════════════════════════════ */}
        {view === "history" && (
          <div className="flex-1 min-h-0 overflow-y-auto scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent">
            {/* Header row */}
            <div className="flex items-center justify-between px-4 py-2.5 border-b border-white/5">
              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                Saved Chats (up to 5)
              </span>
              <button
                type="button"
                onClick={startNewChat}
                className="text-[10px] text-red-400 hover:text-red-300 font-bold transition-colors"
              >
                + New Chat
              </button>
            </div>

            {isHistoryLoading ? (
              /* Loading skeleton for history list */
              <div className="p-3 space-y-2">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="animate-pulse flex items-center gap-3 p-2.5 rounded-xl bg-white/5">
                    <div className="flex-1 space-y-1.5">
                      <div className="h-3 bg-white/10 rounded w-3/4" />
                      <div className="h-2.5 bg-white/5 rounded w-1/2" />
                    </div>
                    <div className="w-6 h-6 rounded-lg bg-white/5 flex-shrink-0" />
                  </div>
                ))}
              </div>
            ) : historyList.length === 0 ? (
              <div className="flex-1 flex flex-col items-center justify-center text-center p-8 select-none">
                <Clock className="w-10 h-10 text-gray-600 mb-3" />
                <p className="text-sm text-gray-400 font-semibold">No saved chats yet</p>
                <p className="text-xs text-gray-500 mt-1 max-w-[200px] leading-relaxed">
                  Conversations are auto-saved when you&apos;re logged in.
                </p>
              </div>
            ) : (
              <div className="p-3 space-y-1.5">
                {historyList.map((session) => {
                  const isActive = chatSessionId === session._id;
                  const isDeleting = deletingId === session._id;

                  return (
                    <button
                      key={session._id}
                      type="button"
                      onClick={() => loadSession(session._id)}
                      disabled={isDeleting}
                      className={`w-full text-left flex items-center gap-3 p-3 rounded-xl transition-all border group ${
                        isActive
                          ? "bg-red-600/20 border-red-500/30"
                          : "bg-white/5 border-transparent hover:bg-white/10 hover:border-white/10"
                      }`}
                    >
                      {/* Session info */}
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-bold text-gray-100 truncate leading-tight">
                          {session.title || "Untitled Chat"}
                        </p>
                        <p className="text-[10px] text-gray-500 mt-0.5 font-medium">
                          {new Date(session.updatedAt).toLocaleDateString(undefined, {
                            month: "short",
                            day: "numeric",
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </p>
                        {/* Preview of last message */}
                        {session.messages?.length > 0 && (
                          <p className="text-[10px] text-gray-600 mt-0.5 truncate">
                            {session.messages[session.messages.length - 1]?.content?.slice(0, 60)}…
                          </p>
                        )}
                      </div>

                      {/* Delete button */}
                      <button
                        type="button"
                        onClick={(e) => deleteSession(e, session._id)}
                        disabled={isDeleting}
                        className="w-7 h-7 flex items-center justify-center text-gray-600 hover:text-red-400 hover:bg-white/5 rounded-lg transition-colors flex-shrink-0 opacity-0 group-hover:opacity-100 focus:opacity-100"
                        aria-label="Delete this chat"
                      >
                        {isDeleting ? (
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        ) : (
                          <Trash2 className="w-3.5 h-3.5" />
                        )}
                      </button>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* ══════════════════════════════════════════════════
            VIEW: CHAT
            Messages + input. Session loading shows a skeleton
            inside the message area — the input bar stays active.
        ══════════════════════════════════════════════════ */}
        {view === "chat" && (
          <>
            {/* Messages */}
            <div className="flex-1 min-h-0 overflow-y-auto scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent">
              {isSessionLoading ? (
                <MessageSkeleton />
              ) : (
                <div className="p-4 space-y-3">
                  {messages.map((msg, i) => (
                    <div key={i} className={`flex gap-2 ${msg.role === "user" ? "flex-row-reverse" : ""}`}>
                      {/* Avatar */}
                      <div
                        className={`w-6 h-6 rounded-full flex-shrink-0 flex items-center justify-center mt-0.5 ${
                          msg.role === "user"
                            ? "bg-red-600"
                            : msg.isError
                            ? "bg-red-900/40 border border-red-800/40"
                            : "bg-white/10"
                        }`}
                      >
                        {msg.role === "user" ? (
                          <User className="w-3.5 h-3.5 text-white" />
                        ) : (
                          <Bot className="w-3.5 h-3.5 text-gray-300" />
                        )}
                      </div>

                      {/* Bubble */}
                      <div
                        className={`max-w-[82%] rounded-2xl px-3 py-2 text-sm leading-relaxed ${
                          msg.role === "user"
                            ? "bg-gradient-to-br from-red-600 to-rose-700 text-white rounded-tr-sm"
                            : msg.isError
                            ? "bg-red-950/40 border border-red-800/50 text-red-200 rounded-tl-sm"
                            : "bg-white/10 text-gray-100 rounded-tl-sm"
                        }`}
                      >
                        <div className="flex items-start gap-1.5">
                          {msg.isError && <X className="w-4 h-4 text-red-500 mt-0.5 flex-shrink-0" />}
                          <div className="flex-1 min-w-0">
                            {renderContent(msg.content)}

                            {/* AI action buttons */}
                            {msg.action && (() => {
                              const act = msg.action;
                              return (
                                <div className="mt-3 pt-3 border-t border-white/10 flex flex-col gap-2">
                                  {act.type === "searchDonors" && (
                                    <Link
                                      href={`/dashboard/match?bloodType=${encodeURIComponent(act.parameters.bloodType)}&city=${encodeURIComponent(act.parameters.city || "")}`}
                                      className="inline-flex items-center justify-center gap-1.5 bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-3.5 rounded-xl text-xs transition shadow-md active:scale-95"
                                    >
                                      <Search className="w-3.5 h-3.5" />
                                      <span>View Matching {act.parameters.bloodType} Donors</span>
                                    </Link>
                                  )}
                                  {act.type === "createRequest" && (
                                    <Link
                                      href={`/dashboard/request/new?bloodType=${encodeURIComponent(act.parameters.bloodType || "")}&city=${encodeURIComponent(act.parameters.city || "")}&patientName=${encodeURIComponent(act.parameters.patientName || "")}&units=${encodeURIComponent(act.parameters.units || "")}&hospital=${encodeURIComponent(act.parameters.hospital || "")}&urgency=${encodeURIComponent(act.parameters.urgency || "")}&contactPhone=${encodeURIComponent(act.parameters.contactPhone || "")}`}
                                      className="inline-flex items-center justify-center gap-1.5 bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-700 hover:to-rose-700 text-white font-bold py-2 px-3.5 rounded-xl text-xs transition shadow-md active:scale-95"
                                    >
                                      <PlusCircle className="w-3.5 h-3.5" />
                                      <span>Create Request Form</span>
                                    </Link>
                                  )}
                                  {act.type === "toggleAvailability" && (
                                    <button
                                      type="button"
                                      onClick={() => handleToggleAvailability(act.parameters.isAvailable)}
                                      className="inline-flex items-center justify-center gap-1.5 bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-3.5 rounded-xl text-xs transition shadow-md active:scale-95"
                                    >
                                      <Activity className="w-3.5 h-3.5 animate-pulse" />
                                      <span>Set Status to {act.parameters.isAvailable ? "Available" : "Unavailable"}</span>
                                    </button>
                                  )}
                                </div>
                              );
                            })()}

                            {msg.role === "assistant" && msg.model && !msg.isError && (
                              <div className="flex items-center justify-end gap-1 mt-1 text-[9px] text-white/40 font-semibold select-none">
                                <Sparkles className="w-2.5 h-2.5 text-yellow-400/80" />
                                <span>{msg.model}</span>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}

                  {isAiLoading && (
                    <div className="flex gap-2">
                      <div className="w-6 h-6 rounded-full bg-white/10 flex items-center justify-center flex-shrink-0">
                        <Bot className="w-3 h-3 text-gray-300" />
                      </div>
                      <div className="bg-white/10 rounded-2xl rounded-tl-sm px-3 py-2">
                        <TypingDots />
                      </div>
                    </div>
                  )}

                  <div ref={messagesEndRef} />
                </div>
              )}
            </div>

            {/* Quick prompts — only on fresh chat */}
            {messages.length === 1 && !isSessionLoading && (
              <div className="px-4 pt-2 pb-3 flex flex-wrap gap-1.5 flex-shrink-0 border-t border-white/5">
                {QUICK_PROMPTS.map((prompt) => (
                  <button
                    key={prompt}
                    onClick={() => sendMessage(prompt)}
                    disabled={isAiLoading}
                    className="text-xs px-2.5 py-1.5 rounded-full bg-white/10 text-gray-300 hover:bg-red-600/30 hover:text-white border border-white/10 hover:border-red-500/40 transition-all duration-200 disabled:opacity-50"
                  >
                    {prompt}
                  </button>
                ))}
              </div>
            )}

            {/* Input — always enabled (never disabled by session loading) */}
            <form
              onSubmit={(e) => { e.preventDefault(); sendMessage(input); }}
              className="flex items-center gap-2 px-3 py-3 border-t border-white/10 bg-white/5 flex-shrink-0"
            >
              <input
                id="chatbot-input"
                ref={inputRef}
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder={isSessionLoading ? "Loading chat…" : "Ask me about blood types…"}
                disabled={isAiLoading}   // ← ONLY disabled during AI response, never during session load
                className="flex-1 min-w-0 bg-white/10 text-white placeholder-gray-500 text-sm rounded-xl px-3 py-2.5 border border-white/10 focus:outline-none focus:border-red-500/50 focus:bg-white/15 transition-all disabled:opacity-50"
              />
              <button
                id="chatbot-send-btn"
                type="submit"
                disabled={!input.trim() || isAiLoading}
                className="w-10 h-10 rounded-xl bg-gradient-to-br from-red-600 to-rose-700 flex items-center justify-center text-white disabled:opacity-40 hover:from-red-500 hover:to-rose-600 transition-all duration-200 flex-shrink-0 shadow-md"
                aria-label="Send message"
              >
                {isAiLoading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Send className="w-4 h-4" />
                )}
              </button>
            </form>
          </>
        )}
      </div>
    </>
  );
}
