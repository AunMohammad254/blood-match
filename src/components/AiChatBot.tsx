"use client";

import React, { useState, useRef, useEffect, useCallback } from "react";
import Link from "next/link";
import { MessageCircle, X, Send, Bot, User, Loader2, ChevronDown, Sparkles, RotateCcw, History, Trash2, Clock, Search, PlusCircle, Activity } from "lucide-react";
import { getToken, isLoggedIn } from "@/lib/auth";

interface Message {
  role: "user" | "assistant";
  content: string;
  model?: string;
  isError?: boolean;
  action?: {
    type: string;
    parameters: any;
  };
}

const QUICK_PROMPTS = [
  "What blood types are compatible with O-?",
  "How do I register as a donor?",
  "What should I do in a blood emergency?",
  "Explain the urgency levels",
];

function TypingDots() {
  return (
    <div className="flex items-center gap-1.5 py-1">
      <span className="w-2 h-2 rounded-full bg-red-400 animate-bounce [animation-delay:0ms]" />
      <span className="w-2 h-2 rounded-full bg-red-400 animate-bounce [animation-delay:150ms]" />
      <span className="w-2 h-2 rounded-full bg-red-400 animate-bounce [animation-delay:300ms]" />
    </div>
  );
}

export default function AiChatBot() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "assistant",
      content:
        "Hi! I'm **BloodBot** 🩸 — your AI assistant for BloodMatch.\n\nI can help with blood type compatibility, how to use the platform, or emergency guidance. How can I help you today?",
    },
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [hasNewMessage, setHasNewMessage] = useState(false);
  const [chatSessionId, setChatSessionId] = useState<string | null>(null);
  const [showHistory, setShowHistory] = useState(false);
  const [historyList, setHistoryList] = useState<any[]>([]);
  const [isUserLoggedIn, setIsUserLoggedIn] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  const resetChat = useCallback(() => {
    setMessages([
      {
        role: "assistant",
        content:
          "Hi! I'm **BloodBot** 🩸 — your AI assistant for BloodMatch.\n\nI can help with blood type compatibility, how to use the platform, or emergency guidance. How can I help you today?",
      },
    ]);
    setChatSessionId(null);
    setInput("");
    setShowHistory(false);
  }, []);

  const fetchHistory = useCallback(async () => {
    if (!isLoggedIn()) return;
    try {
      const res = await fetch("/api/chat/history", {
        headers: {
          Authorization: `Bearer ${getToken()}`,
        },
      });
      if (res.ok) {
        const data = await res.json();
        setHistoryList(data.histories || []);
      }
    } catch (err) {
      console.error("Failed to fetch chat history:", err);
    }
  }, []);

  const loadSession = async (sessionId: string) => {
    setIsLoading(true);
    setShowHistory(false);
    try {
      const res = await fetch(`/api/chat/history?id=${sessionId}`, {
        headers: {
          Authorization: `Bearer ${getToken()}`,
        },
      });
      if (res.ok) {
        const data = await res.json();
        if (data.session) {
          setChatSessionId(sessionId);
          const loadedMessages = data.session.messages.map((m: any) => ({
            role: m.role,
            content: m.content,
            model: m.model,
          }));
          setMessages(loadedMessages);
        }
      }
    } catch (err) {
      console.error("Failed to load chat session:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const deleteSession = async (e: React.MouseEvent, sessionId: string) => {
    e.stopPropagation();
    try {
      const res = await fetch(`/api/chat/history?id=${sessionId}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${getToken()}`,
        },
      });
      if (res.ok) {
        if (chatSessionId === sessionId) {
          resetChat();
        }
        fetchHistory();
      }
    } catch (err) {
      console.error("Failed to delete chat session:", err);
    }
  };

  useEffect(() => {
    const loggedIn = isLoggedIn();
    setIsUserLoggedIn(loggedIn);
    if (isOpen) {
      scrollToBottom();
      inputRef.current?.focus();
      setHasNewMessage(false);
      if (loggedIn) {
        fetchHistory();
      }
    }
  }, [isOpen, scrollToBottom, fetchHistory]);

  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  const sendMessage = useCallback(
    async (text: string) => {
      if (!text.trim() || isLoading) return;

      const userMessage: Message = { role: "user", content: text.trim() };
      const updatedMessages = [...messages, userMessage];
      setMessages(updatedMessages);
      setInput("");
      setIsLoading(true);

      try {
        const headers: Record<string, string> = {
          "Content-Type": "application/json",
        };
        const token = getToken();
        if (token) {
          headers["Authorization"] = `Bearer ${token}`;
        }

        const res = await fetch("/api/chat", {
          method: "POST",
          headers,
          body: JSON.stringify({
            messages: updatedMessages,
            chatSessionId,
          }),
        });

        const data = await res.json();
        
        if (res.ok) {
          const reply = data.reply || "Sorry, I couldn't process that.";
          setMessages((prev) => [
            ...prev,
            { role: "assistant", content: reply, model: data.model, action: data.action }
          ]);
          if (data.chatSessionId) {
            setChatSessionId(data.chatSessionId);
            if (isUserLoggedIn && !chatSessionId) {
              fetchHistory();
            }
          }
        } else {
          const errorMsg = data.error || "Sorry, I encountered an error.";
          setMessages((prev) => [
            ...prev,
            { 
              role: "assistant", 
              content: errorMsg, 
              isError: true,
              model: data.model 
            }
          ]);
        }

        if (!isOpen) setHasNewMessage(true);
      } catch {
        setMessages((prev) => [
          ...prev,
          { 
            role: "assistant", 
            content: "Connection error. Please check your connection and try again.", 
            isError: true 
          },
        ]);
      } finally {
        setIsLoading(false);
      }
    },
    [messages, isLoading, isOpen, chatSessionId, isUserLoggedIn, fetchHistory]
  );

  const handleToggleAvailabilityAction = async (targetState: boolean) => {
    setIsLoading(true);
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
        // Update user availability in localStorage
        const userStr = localStorage.getItem("user");
        if (userStr) {
          const user = JSON.parse(userStr);
          user.isAvailable = targetState;
          localStorage.setItem("user", JSON.stringify(user));
          // Dispatch storage event to update dashboard/navbar
          window.dispatchEvent(new Event("storage"));
        }
        
        setMessages((prev) => [
          ...prev,
          {
            role: "assistant",
            content: `✅ Done! I've set your availability status to **${targetState ? "Available" : "Unavailable"}**.`
          }
        ]);
      } else {
        const errData = await res.json().catch(() => ({}));
        alert(errData.error || "Failed to update availability status.");
      }
    } catch (err) {
      console.error("Error toggling availability:", err);
      alert("Connection error. Failed to toggle status.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    sendMessage(input);
  };

  // Simple markdown-like renderer supporting bold, list items, and paragraph breaks
  const renderContent = (text: string) => {
    const lines = text.split("\n");
    return lines.map((line, lineIdx) => {
      const isBullet = line.trim().startsWith("- ") || line.trim().startsWith("* ");
      const isNumbered = /^\d+\.\s/.test(line.trim());
      
      let cleanLine = line;
      if (isBullet) {
        cleanLine = line.trim().replace(/^[-*]\s+/, "");
      } else if (isNumbered) {
        cleanLine = line.trim().replace(/^\d+\.\s+/, "");
      }

      const parts = cleanLine.split(/(\*\*[^*]+\*\*)/g);
      const parsedText = parts.map((part, i) =>
        part.startsWith("**") && part.endsWith("**") ? (
          <strong key={i} className="font-semibold text-white">{part.slice(2, -2)}</strong>
        ) : (
          <span key={i}>{part}</span>
        )
      );

      if (isBullet) {
        return (
          <div key={lineIdx} className="flex items-start gap-1.5 ml-2 my-0.5">
            <span className="text-red-400 mt-1 select-none flex-shrink-0">•</span>
            <div className="flex-1 text-gray-100">{parsedText}</div>
          </div>
        );
      }

      if (isNumbered) {
        const match = line.trim().match(/^(\d+)\.\s+/);
        const num = match ? match[1] : "1";
        return (
          <div key={lineIdx} className="flex items-start gap-1.5 ml-2 my-0.5">
            <span className="text-red-400 font-bold select-none flex-shrink-0">{num}.</span>
            <div className="flex-1 text-gray-100">{parsedText}</div>
          </div>
        );
      }

      return (
        <p key={lineIdx} className={lineIdx > 0 ? "mt-1.5" : ""}>
          {parsedText}
        </p>
      );
    });
  };

  return (
    <>
      {/* Floating Button */}
      <button
        id="chatbot-toggle-btn"
        onClick={() => setIsOpen((o) => !o)}
        aria-label="Open BloodBot AI Chat"
        className={`fixed bottom-6 right-6 z-50 w-14 h-14 rounded-full flex items-center justify-center shadow-2xl transition-all duration-300 ${
          isOpen
            ? "bg-gray-800 scale-95"
            : "bg-gradient-to-br from-red-600 to-rose-700 hover:scale-110 hover:shadow-red-500/50"
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

      {/* Chat Window */}
      <div
        id="chatbot-window"
        className={`fixed bottom-24 right-6 z-50 w-[360px] max-w-[calc(100vw-1.5rem)] rounded-2xl shadow-2xl border border-gray-700/60 overflow-hidden transition-all duration-300 origin-bottom-right ${
          isOpen
            ? "opacity-100 scale-100 pointer-events-auto"
            : "opacity-0 scale-90 pointer-events-none"
        }`}
        style={{
          background: "linear-gradient(160deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)",
        }}
      >
        {/* Header */}
        <div className="flex items-center gap-2.5 px-4 py-3 border-b border-white/10 bg-white/5 backdrop-blur-sm">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-red-600 to-rose-700 flex items-center justify-center flex-shrink-0 shadow-lg">
            <Bot className="w-5 h-5 text-white" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5">
              <span className="text-sm font-bold text-white">BloodBot</span>
              <Sparkles className="w-3 h-3 text-yellow-400" />
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
              <span className="text-xs text-gray-400">Powered by Gemini AI</span>
            </div>
          </div>
          
          {/* Actions */}
          <div className="flex items-center gap-1">
            {isUserLoggedIn && (
              <button
                type="button"
                onClick={() => setShowHistory((s) => !s)}
                aria-label="View chat history"
                title="View chat history"
                className={`w-7 h-7 rounded-lg flex items-center justify-center transition-colors ${
                  showHistory
                    ? "text-red-400 bg-white/10"
                    : "text-gray-400 hover:text-white hover:bg-white/10"
                }`}
              >
                <History className="w-4 h-4" />
              </button>
            )}
            
            <button
              type="button"
              onClick={resetChat}
              aria-label="Reset chat"
              title="Reset chat"
              className="w-7 h-7 rounded-lg flex items-center justify-center text-gray-400 hover:text-white hover:bg-white/10 transition-colors"
            >
              <RotateCcw className="w-4 h-4" />
            </button>

            <button
              type="button"
              onClick={() => setIsOpen(false)}
              aria-label="Close chat"
              className="w-7 h-7 rounded-lg flex items-center justify-center text-gray-400 hover:text-white hover:bg-white/10 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Messages & History Drawer Overlay */}
        <div className="relative h-72">
          {/* Messages List */}
          <div className="h-full overflow-y-auto p-4 space-y-3 scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent">
            {messages.map((msg, i) => (
              <div key={i} className={`flex gap-2 ${msg.role === "user" ? "flex-row-reverse" : ""}`}>
                {/* Avatar */}
                <div
                  className={`w-6 h-6 rounded-full flex-shrink-0 flex items-center justify-center text-[10px] font-bold mt-0.5 ${
                    msg.role === "user"
                      ? "bg-red-600 text-white"
                      : msg.isError
                      ? "bg-red-900/40 text-red-300 border border-red-800/40"
                      : "bg-white/10 text-gray-300"
                  }`}
                >
                  {msg.role === "user" ? <User className="w-3.5 h-3.5" /> : <Bot className="w-3.5 h-3.5" />}
                </div>
                {/* Bubble */}
                <div
                  className={`max-w-[80%] rounded-2xl px-3 py-2 text-sm leading-relaxed ${
                    msg.role === "user"
                      ? "bg-gradient-to-br from-red-600 to-rose-700 text-white rounded-tr-sm"
                      : msg.isError
                      ? "bg-red-950/40 border border-red-800/50 text-red-200 rounded-tl-sm"
                      : "bg-white/10 text-gray-100 rounded-tl-sm"
                  }`}
                >
                  <div className="flex items-start gap-1.5">
                    {msg.isError && <X className="w-4 h-4 text-red-500 mt-0.5 flex-shrink-0" />}
                    <div className="flex-1">
                       {renderContent(msg.content)}

                      {msg.action && (() => {
                        const act = msg.action;
                        return (
                          <div className="mt-3 pt-3 border-t border-white/10 flex flex-col gap-2">
                            {act.type === "searchDonors" && (
                              <Link
                                href={`/dashboard/match?bloodType=${encodeURIComponent(act.parameters.bloodType)}&city=${encodeURIComponent(act.parameters.city || "")}`}
                                className="inline-flex items-center justify-center gap-1.5 bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-3.5 rounded-xl text-xs transition shadow-md hover:scale-[1.02] active:scale-95"
                              >
                                <Search className="w-3.5 h-3.5" />
                                <span>View Matching {act.parameters.bloodType} Donors</span>
                              </Link>
                            )}
                            
                            {act.type === "createRequest" && (
                              <Link
                                href={`/dashboard/request/new?bloodType=${encodeURIComponent(act.parameters.bloodType || "")}&city=${encodeURIComponent(act.parameters.city || "")}&patientName=${encodeURIComponent(act.parameters.patientName || "")}&units=${encodeURIComponent(act.parameters.units || "")}&hospital=${encodeURIComponent(act.parameters.hospital || "")}&urgency=${encodeURIComponent(act.parameters.urgency || "")}&contactPhone=${encodeURIComponent(act.parameters.contactPhone || "")}`}
                                className="inline-flex items-center justify-center gap-1.5 bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-700 hover:to-rose-700 text-white font-bold py-2 px-3.5 rounded-xl text-xs transition shadow-md hover:scale-[1.02] active:scale-95"
                              >
                                <PlusCircle className="w-3.5 h-3.5" />
                                <span>Create Request Form</span>
                              </Link>
                            )}
                            
                            {act.type === "toggleAvailability" && (
                              <button
                                type="button"
                                onClick={() => handleToggleAvailabilityAction(act.parameters.isAvailable)}
                                className="inline-flex items-center justify-center gap-1.5 bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-3.5 rounded-xl text-xs transition shadow-md hover:scale-[1.02] active:scale-95"
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

            {isLoading && (
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

          {/* History Drawer Overlay */}
          {showHistory && (
            <div className="absolute inset-0 bg-[#16213e]/95 backdrop-blur-md z-10 p-4 flex flex-col transition-all duration-200">
              <div className="flex items-center justify-between pb-2 border-b border-white/10">
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Saved Chats (Max 5)</span>
                <button
                  type="button"
                  onClick={() => setShowHistory(false)}
                  className="text-gray-400 hover:text-white text-xs font-semibold"
                >
                  Close
                </button>
              </div>

              {historyList.length === 0 ? (
                <div className="flex-1 flex flex-col items-center justify-center text-center p-4 select-none">
                  <Clock className="w-8 h-8 text-gray-500 mb-2" />
                  <p className="text-xs text-gray-400 font-medium">No saved chats yet.</p>
                  <p className="text-[10px] text-gray-500 mt-1 max-w-[200px]">Your conversations are saved automatically when logged in.</p>
                </div>
              ) : (
                <div className="flex-1 overflow-y-auto mt-2 space-y-1.5 pr-1 scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent">
                  {historyList.map((session) => (
                    <div
                      key={session._id}
                      onClick={() => loadSession(session._id)}
                      className={`group flex items-center justify-between p-2.5 rounded-xl cursor-pointer transition-all border ${
                        chatSessionId === session._id
                          ? "bg-red-600/20 border-red-500/35"
                          : "bg-white/5 border-transparent hover:bg-white/10"
                      }`}
                    >
                      <div className="flex-1 min-w-0 pr-2 select-none">
                        <p className="text-xs font-bold text-gray-100 truncate">
                          {session.title || "Untitled Chat"}
                        </p>
                        <p className="text-[9px] text-gray-400 mt-0.5 font-medium">
                          {new Date(session.updatedAt).toLocaleDateString(undefined, {
                            month: "short",
                            day: "numeric",
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={(e) => deleteSession(e, session._id)}
                        className="text-gray-500 hover:text-red-400 transition-colors p-1 hover:bg-white/5 rounded-lg flex-shrink-0"
                        aria-label="Delete saved chat"
                        title="Delete saved chat"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Quick prompts */}
        {messages.length === 1 && (
          <div className="px-4 pb-2 flex flex-wrap gap-1.5">
            {QUICK_PROMPTS.map((prompt) => (
              <button
                key={prompt}
                onClick={() => sendMessage(prompt)}
                disabled={isLoading}
                className="text-xs px-2.5 py-1 rounded-full bg-white/10 text-gray-300 hover:bg-red-600/30 hover:text-white border border-white/10 hover:border-red-500/40 transition-all duration-200 disabled:opacity-50"
              >
                {prompt}
              </button>
            ))}
          </div>
        )}

        {/* Input */}
        <form
          onSubmit={handleSubmit}
          className="flex items-center gap-2 px-3 py-3 border-t border-white/10 bg-white/5"
        >
          <input
            id="chatbot-input"
            ref={inputRef}
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask me about blood types..."
            disabled={isLoading}
            className="flex-1 bg-white/10 text-white placeholder-gray-500 text-sm rounded-xl px-3 py-2 border border-white/10 focus:outline-none focus:border-red-500/50 focus:bg-white/15 transition-all disabled:opacity-50"
          />
          <button
            id="chatbot-send-btn"
            type="submit"
            disabled={!input.trim() || isLoading}
            className="w-9 h-9 rounded-xl bg-gradient-to-br from-red-600 to-rose-700 flex items-center justify-center text-white disabled:opacity-40 hover:from-red-500 hover:to-rose-600 transition-all duration-200 flex-shrink-0 shadow-md"
            aria-label="Send message"
          >
            {isLoading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Send className="w-4 h-4" />
            )}
          </button>
        </form>
      </div>
    </>
  );
}
