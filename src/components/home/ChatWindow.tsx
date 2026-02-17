import React, { useEffect, useState, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Send, Headset } from "lucide-react";
import { useUser } from "../../context/UserContext";
import api from "@/services/api";

// ─── Types ────────────────────────────────────────────────────────────────────

interface Message {
  messageContent: string;
  messageType: "sent" | "recieved";
  timeStamp: string;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatTime(iso: string): string {
  return new Date(iso).toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatDateGroup(iso: string): string {
  const d = new Date(iso);
  const today = new Date();
  const yesterday = new Date();
  yesterday.setDate(today.getDate() - 1);
  if (d.toDateString() === today.toDateString()) return "Today";
  if (d.toDateString() === yesterday.toDateString()) return "Yesterday";
  return d.toLocaleDateString([], { month: "short", day: "numeric", year: "numeric" });
}

function cleanToken(raw: string | undefined | null): string {
  if (!raw) return "";
  return raw.replace(/^"|"$/g, "").trim();
}

function groupByDate(messages: Message[]): { date: string; items: Message[] }[] {
  const map = new Map<string, Message[]>();
  for (const m of messages) {
    const key = new Date(m.timeStamp).toDateString();
    if (!map.has(key)) map.set(key, []);
    map.get(key)!.push(m);
  }
  return Array.from(map.entries()).map(([, items]) => ({
    date: formatDateGroup(items[0].timeStamp),
    items,
  }));
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function ChatWindow() {
  const navigate = useNavigate();
  const { user, admin, isLoading: contextLoading } = useUser();
  const [inputContent, setInputContent] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [isSending, setIsSending] = useState(false);
  const [isFetching, setIsFetching] = useState(true);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // ── FIX: store the adminToken sourced from the conversation record ─────────
  // The GET /searchConversation response contains the adminToken that owns this
  // conversation. We capture it here so users who have NO admin context can
  // still send messages — the token comes from the data, not from a login.
  const conversationAdminTokenRef = useRef<string>("");

  // ── Auto-scroll ──────────────────────────────────────────────────────────
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  // ── Fetch messages ───────────────────────────────────────────────────────
  const fetchMessages = useCallback(async () => {
    if (contextLoading || !user?.token) return;

    const token = cleanToken(user.token);
    if (!token) return;

    try {
      const res = await api.get(`/searchConversation?personConvoWithToken=${token}`);
      const data = res.data;

      // ── FIX: capture adminToken from the conversation record ─────────────
      // The API returns { adminToken, personConvoWithToken, messages: [...] }
      // Prefer the conversation's adminToken over the context admin (users
      // typically won't have an admin session; the conversation always does).
      if (data?.adminToken) {
        conversationAdminTokenRef.current = cleanToken(data.adminToken);
      }

      setMessages(data?.messages || []);
    } catch (err) {
      console.error("Failed to fetch messages", err);
    } finally {
      setIsFetching(false);
    }
  }, [user, contextLoading]);

  useEffect(() => {
    fetchMessages();
    const interval = setInterval(fetchMessages, 5000);
    return () => clearInterval(interval);
  }, [fetchMessages]);

  // ── Send message ─────────────────────────────────────────────────────────
  const handleSend = async () => {
    if (!inputContent.trim() || isSending || contextLoading) return;
    if (!user?.token) return;

    const userToken = cleanToken(user.token);

    // ── FIX: resolve adminToken from multiple fallbacks ───────────────────
    // Priority: conversation record → context admin → user.adminToken field
    const adminToken =
      conversationAdminTokenRef.current ||
      cleanToken(admin?.token) ||
      cleanToken(user.adminToken);

    if (!userToken || !adminToken) {
      console.error("Cannot send — token(s) are empty", { userToken, adminToken });
      return;
    }

    const optimistic: Message = {
      messageContent: inputContent.trim(),
      messageType: "sent",
      timeStamp: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, optimistic]);
    setInputContent("");
    setIsSending(true);

    try {
      await api.post(
        `/addMessageToPerson?adminToken=${adminToken}&personToken=${userToken}`,
        {
          messageContent: optimistic.messageContent,
          messageType: "sent",
          timeStamp: optimistic.timeStamp,
        }
      );
      await fetchMessages();
    } catch (err) {
      console.error("Failed to send message", err);
      setMessages((prev) => prev.filter((m) => m !== optimistic));
      setInputContent(optimistic.messageContent);
    } finally {
      setIsSending(false);
      inputRef.current?.focus();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  // ── FIX: send button should not require admin context ─────────────────────
  // It only needs the conversation adminToken, which arrives via fetchMessages.
  // We disable until we've fetched at least once (isFetching) so we know the
  // adminToken is populated — but we don't block on the admin login state.
  const isAdminTokenReady =
    !!conversationAdminTokenRef.current ||
    !!admin?.token ||
    !!user?.adminToken;

  const showSkeleton = contextLoading || isFetching;
  const grouped = groupByDate(messages);

  // ── Render ───────────────────────────────────────────────────────────────
  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600;700&family=JetBrains+Mono:wght@400;500&display=swap');

        .cw-root * { box-sizing: border-box; }

        .cw-root {
          font-family: 'DM Sans', sans-serif;
          --sb-green: #6aad64;
          --sb-green-dark: #4c8a46;
          --sb-green-light: #e8f5e7;
          --sb-leaf: #2d5a27;
          --sb-stone: #f7f6f3;
          --sb-border: #e2e0da;
          --sb-muted: #9b978d;
          --sb-text: #1c1c1b;
          --sb-white: #ffffff;
          --sb-sent-bg: #2d5a27;
          --sb-sent-txt: #ffffff;
          --sb-recv-bg: #ffffff;
          --sb-recv-txt: #1c1c1b;
          --radius: 18px;
        }

        .cw-shell {
          display: flex;
          flex-direction: column;
          height: 88vh;
          max-width: 680px;
          width: 100%;
          margin: 24px auto;
          background: var(--sb-white);
          border: 1.5px solid var(--sb-border);
          border-radius: 20px;
          overflow: hidden;
          box-shadow: 0 8px 40px rgba(44,90,39,0.10), 0 2px 8px rgba(0,0,0,0.06);
        }

        .cw-header {
          background: var(--sb-leaf);
          padding: 14px 20px;
          display: flex;
          align-items: center;
          gap: 14px;
          flex-shrink: 0;
          position: relative;
        }
        .cw-header::after {
          content: '';
          position: absolute;
          bottom: 0; left: 0; right: 0;
          height: 3px;
          background: linear-gradient(90deg, var(--sb-green), var(--sb-green-dark), var(--sb-green));
        }
        .cw-back-btn {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 36px; height: 36px;
          border-radius: 10px;
          background: rgba(255,255,255,0.10);
          border: 1px solid rgba(255,255,255,0.15);
          color: #fff;
          cursor: pointer;
          transition: background 0.15s, transform 0.15s;
          flex-shrink: 0;
        }
        .cw-back-btn:hover { background: rgba(255,255,255,0.18); transform: translateX(-2px); }
        .cw-avatar {
          width: 42px; height: 42px;
          border-radius: 12px;
          background: rgba(106,173,100,0.25);
          border: 2px solid rgba(106,173,100,0.5);
          display: flex; align-items: center; justify-content: center;
          flex-shrink: 0;
        }
        .cw-header-info { flex: 1; min-width: 0; }
        .cw-header-name {
          font-size: 15px;
          font-weight: 700;
          color: #fff;
          white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
        }
        .cw-header-status {
          display: flex; align-items: center; gap: 5px;
          font-size: 11px;
          color: rgba(255,255,255,0.65);
          letter-spacing: 0.03em;
          margin-top: 2px;
        }
        .cw-online-dot {
          width: 7px; height: 7px;
          border-radius: 50%;
          background: #7ee87a;
          box-shadow: 0 0 0 2px rgba(126,232,122,0.3);
          animation: pulse-dot 2s infinite;
        }
        @keyframes pulse-dot {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }

        .cw-body {
          flex: 1;
          overflow-y: auto;
          padding: 20px 20px 8px;
          background: var(--sb-stone);
          display: flex;
          flex-direction: column;
          gap: 2px;
          scroll-behavior: smooth;
        }
        .cw-body::-webkit-scrollbar { width: 4px; }
        .cw-body::-webkit-scrollbar-thumb { background: var(--sb-border); border-radius: 4px; }

        .cw-date-sep {
          display: flex;
          align-items: center;
          gap: 10px;
          margin: 12px 0 8px;
        }
        .cw-date-sep::before, .cw-date-sep::after {
          content: ''; flex: 1;
          height: 1px;
          background: var(--sb-border);
        }
        .cw-date-sep span {
          font-size: 11px;
          color: var(--sb-muted);
          font-weight: 500;
          letter-spacing: 0.04em;
          white-space: nowrap;
        }

        .cw-msg-row {
          display: flex;
          margin-bottom: 3px;
        }
        .cw-msg-row.sent { justify-content: flex-end; }
        .cw-msg-row.recv { justify-content: flex-start; }

        .cw-bubble-wrap {
          max-width: 72%;
          display: flex;
          flex-direction: column;
        }
        .cw-msg-row.sent .cw-bubble-wrap { align-items: flex-end; }
        .cw-msg-row.recv .cw-bubble-wrap { align-items: flex-start; }

        .cw-bubble {
          padding: 10px 15px;
          border-radius: 18px;
          font-size: 14px;
          line-height: 1.55;
          word-break: break-word;
        }
        .cw-bubble.sent {
          background: var(--sb-sent-bg);
          color: var(--sb-sent-txt);
          border-bottom-right-radius: 5px;
        }
        .cw-bubble.recv {
          background: var(--sb-recv-bg);
          color: var(--sb-recv-txt);
          border: 1px solid var(--sb-border);
          border-bottom-left-radius: 5px;
        }

        .cw-timestamp {
          font-size: 10px;
          color: var(--sb-muted);
          margin-top: 3px;
          padding: 0 3px;
        }

        .cw-skeleton-row {
          display: flex;
          margin-bottom: 10px;
        }
        .cw-skeleton-row:nth-child(even) { justify-content: flex-end; }
        .cw-skeleton-bubble {
          height: 36px;
          border-radius: 14px;
          background: linear-gradient(90deg, #e8e6e0 25%, #f0ede8 50%, #e8e6e0 75%);
          background-size: 200% 100%;
          animation: shimmer 1.4s infinite;
        }
        .cw-skeleton-row:nth-child(odd) .cw-skeleton-bubble { width: 180px; }
        .cw-skeleton-row:nth-child(even) .cw-skeleton-bubble { width: 140px; }
        @keyframes shimmer {
          0% { background-position: 200% 0; }
          100% { background-position: -200% 0; }
        }

        .cw-empty {
          flex: 1;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 10px;
          color: var(--sb-muted);
          padding: 40px;
          text-align: center;
        }
        .cw-empty-icon {
          width: 52px; height: 52px;
          border-radius: 14px;
          background: var(--sb-green-light);
          display: flex; align-items: center; justify-content: center;
          margin-bottom: 4px;
        }
        .cw-empty p { font-size: 14px; }

        .cw-footer {
          padding: 14px 16px;
          background: var(--sb-white);
          border-top: 1.5px solid var(--sb-border);
          display: flex;
          align-items: flex-end;
          gap: 10px;
          flex-shrink: 0;
        }
        .cw-input-wrap { flex: 1; position: relative; }
        .cw-textarea {
          width: 100%;
          resize: none;
          border: 1.5px solid var(--sb-border);
          border-radius: 14px;
          padding: 11px 14px;
          font-family: 'DM Sans', sans-serif;
          font-size: 14px;
          color: var(--sb-text);
          background: var(--sb-stone);
          outline: none;
          line-height: 1.5;
          max-height: 120px;
          overflow-y: auto;
          transition: border-color 0.15s, box-shadow 0.15s;
        }
        .cw-textarea::placeholder { color: var(--sb-muted); }
        .cw-textarea:focus {
          border-color: var(--sb-green);
          box-shadow: 0 0 0 3px rgba(106,173,100,0.12);
          background: #fff;
        }

        .cw-send-btn {
          width: 44px; height: 44px;
          border-radius: 12px;
          background: var(--sb-leaf);
          border: none;
          display: flex; align-items: center; justify-content: center;
          cursor: pointer;
          color: #fff;
          flex-shrink: 0;
          transition: background 0.15s, transform 0.12s, opacity 0.15s;
          box-shadow: 0 2px 8px rgba(44,90,39,0.25);
        }
        .cw-send-btn:hover:not(:disabled) { background: var(--sb-green-dark); transform: scale(1.04); }
        .cw-send-btn:active:not(:disabled) { transform: scale(0.96); }
        .cw-send-btn:disabled { opacity: 0.45; cursor: not-allowed; }

        .cw-footer-hint {
          text-align: center;
          font-size: 10.5px;
          color: var(--sb-muted);
          padding: 4px 0 0;
          letter-spacing: 0.02em;
        }
      `}</style>

      <div className="cw-root">
        <div className="cw-shell">

          {/* ── Header ── */}
          <header className="cw-header">
            <button className="cw-back-btn" onClick={() => navigate("/user")} aria-label="Back">
              <ArrowLeft size={18} />
            </button>
            <div className="cw-avatar">
              <Headset size={20} color="rgba(106,173,100,0.9)" />
            </div>
            <div className="cw-header-info">
              <div className="cw-header-name">{admin?.name || "Admin"}</div>
              <div className="cw-header-status">
                <span className="cw-online-dot" />
                Online · Help &amp; Support
              </div>
            </div>
          </header>

          {/* ── Messages ── */}
          <main className="cw-body" ref={scrollRef}>
            {showSkeleton ? (
              Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="cw-skeleton-row">
                  <div className="cw-skeleton-bubble" />
                </div>
              ))
            ) : messages.length === 0 ? (
              <div className="cw-empty">
                <div className="cw-empty-icon">
                  <Headset size={24} color="#6aad64" />
                </div>
                <strong style={{ fontSize: 15 }}>No messages yet</strong>
                <p>Send a message to start the conversation with the support team.</p>
              </div>
            ) : (
              grouped.map((group) => (
                <React.Fragment key={group.date}>
                  <div className="cw-date-sep">
                    <span>{group.date}</span>
                  </div>
                  {group.items.map((msg, idx) => (
                    <div
                      key={idx}
                      className={`cw-msg-row ${msg.messageType === "sent" ? "sent" : "recv"}`}
                    >
                      <div className="cw-bubble-wrap">
                        <div className={`cw-bubble ${msg.messageType === "sent" ? "sent" : "recv"}`}>
                          {msg.messageContent}
                        </div>
                        <span className="cw-timestamp">{formatTime(msg.timeStamp)}</span>
                      </div>
                    </div>
                  ))}
                </React.Fragment>
              ))
            )}
          </main>

          {/* ── Footer ── */}
          <footer className="cw-footer">
            <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 4 }}>
              <div className="cw-input-wrap">
                <textarea
                  ref={inputRef}
                  className="cw-textarea"
                  rows={1}
                  value={inputContent}
                  onChange={(e) => {
                    setInputContent(e.target.value);
                    e.target.style.height = "auto";
                    e.target.style.height = Math.min(e.target.scrollHeight, 120) + "px";
                  }}
                  onKeyDown={handleKeyDown}
                  placeholder="Type your message… (Enter to send)"
                  aria-label="Message input"
                  disabled={contextLoading}
                />
              </div>
              <div className="cw-footer-hint">Shift+Enter for new line</div>
            </div>

            <button
              className="cw-send-btn"
              onClick={handleSend}
              // ── FIX: removed `|| !admin` guard — admin is not required for
              // users to send. We wait for the first fetch to resolve so we
              // know the conversation adminToken is available.
              disabled={!inputContent.trim() || isSending || contextLoading || isFetching}
              aria-label="Send message"
            >
              <Send size={18} />
            </button>
          </footer>

        </div>
      </div>
    </>
  );
}