"use client";

import { useState, useEffect, useRef, useCallback, useTransition } from "react";
import { createClient } from "@/lib/supabase/client";
import Image from "next/image";
import Link from "next/link";
import { sendMessage, markMessagesRead, searchUsers } from "@/app/actions/messages";
import type { Message } from "@/lib/types";

type Partner = {
  id: string;
  username: string;
  full_name: string | null;
  avatar_url: string | null;
  trade: string | null;
  experience_level: "apprentice" | "journeyman" | "master" | null;
};

type Conversation = {
  partner: Partner;
  lastMessage: Message;
  unreadCount: number;
};

type Props = {
  currentUser: Partner;
  initialPartner: Partner | null;
};

const LEVEL_LABEL: Record<string, string> = {
  apprentice: "Apprentice",
  journeyman: "Journeyman",
  master: "Master",
};

function formatConvTime(iso: string) {
  const d = new Date(iso);
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const mins = Math.floor(diffMs / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h`;
  if (hrs < 24 * 7) return d.toLocaleDateString("en-US", { weekday: "short" });
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function formatMsgTimestamp(iso: string) {
  const d = new Date(iso);
  const now = new Date();
  const isToday = d.toDateString() === now.toDateString();
  const yesterday = new Date(now);
  yesterday.setDate(yesterday.getDate() - 1);
  const isYesterday = d.toDateString() === yesterday.toDateString();
  const time = d.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
  if (isToday) return time;
  if (isYesterday) return `Yesterday ${time}`;
  return `${d.toLocaleDateString("en-US", { month: "short", day: "numeric" })} ${time}`;
}

function shouldShowTimestamp(msgs: Message[], i: number) {
  if (i === 0) return true;
  const prev = new Date(msgs[i - 1].created_at).getTime();
  const curr = new Date(msgs[i].created_at).getTime();
  return curr - prev > 5 * 60 * 1000;
}

function Avatar({ url, name, size = "md" }: { url: string | null; name: string; size?: "sm" | "md" | "lg" }) {
  const cls = size === "sm" ? "w-8 h-8 text-xs" : size === "lg" ? "w-12 h-12 text-base" : "w-10 h-10 text-sm";
  return (
    <div className={`${cls} rounded-full bg-navy-mid overflow-hidden flex items-center justify-center shrink-0 relative`}>
      {url ? (
        <Image src={url} alt={name} fill className="object-cover" />
      ) : (
        <span className="font-bold text-white select-none">{name.charAt(0).toUpperCase()}</span>
      )}
    </div>
  );
}

export default function MessagesClient({ currentUser, initialPartner }: Props) {
  const supabase = createClient();

  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activePartner, setActivePartner] = useState<Partner | null>(initialPartner);
  const [messages, setMessages] = useState<Message[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [inputText, setInputText] = useState("");
  const [sending, startSendTransition] = useTransition();
  const [loadingConvs, setLoadingConvs] = useState(true);
  const [loadingMsgs, setLoadingMsgs] = useState(false);
  const [sendError, setSendError] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [modalQuery, setModalQuery] = useState("");
  const [modalResults, setModalResults] = useState<Partner[]>([]);
  const [searchingUsers, setSearchingUsers] = useState(false);
  const [mobileView, setMobileView] = useState<"list" | "thread">(
    initialPartner ? "thread" : "list"
  );

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const activePartnerIdRef = useRef<string | null>(initialPartner?.id ?? null);

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  // ── Load all conversations ──────────────────────────────────────────────

  const loadConversations = useCallback(async () => {
    const { data: allMsgs } = await supabase
      .from("messages")
      .select("*")
      .or(`sender_id.eq.${currentUser.id},recipient_id.eq.${currentUser.id}`)
      .order("created_at", { ascending: false });

    if (!allMsgs) { setLoadingConvs(false); return; }

    const partnerMap = new Map<string, { lastMsg: Message; unread: number }>();
    for (const msg of allMsgs) {
      const pid = msg.sender_id === currentUser.id ? msg.recipient_id : msg.sender_id;
      if (!partnerMap.has(pid)) {
        partnerMap.set(pid, { lastMsg: msg, unread: 0 });
      }
      if (msg.sender_id !== currentUser.id && !msg.read_at) {
        partnerMap.get(pid)!.unread++;
      }
    }

    if (partnerMap.size === 0) { setLoadingConvs(false); return; }

    const { data: profiles } = await supabase
      .from("profiles")
      .select("id, username, full_name, avatar_url, trade, experience_level")
      .in("id", [...partnerMap.keys()]);

    const convs: Conversation[] = (profiles ?? []).map((p) => ({
      partner: p as Partner,
      lastMessage: partnerMap.get(p.id)!.lastMsg,
      unreadCount: partnerMap.get(p.id)!.unread,
    }));

    convs.sort(
      (a, b) =>
        new Date(b.lastMessage.created_at).getTime() -
        new Date(a.lastMessage.created_at).getTime()
    );

    setConversations(convs);
    setLoadingConvs(false);
  }, [currentUser.id, supabase]);

  // ── Load messages for a conversation ───────────────────────────────────

  const loadMessages = useCallback(
    async (partnerId: string) => {
      setLoadingMsgs(true);
      const { data } = await supabase
        .from("messages")
        .select("*")
        .or(
          `and(sender_id.eq.${currentUser.id},recipient_id.eq.${partnerId}),and(sender_id.eq.${partnerId},recipient_id.eq.${currentUser.id})`
        )
        .order("created_at", { ascending: true });
      setMessages(data ?? []);
      setLoadingMsgs(false);
      setTimeout(scrollToBottom, 50);
    },
    [currentUser.id, supabase, scrollToBottom]
  );

  // ── Open a conversation ─────────────────────────────────────────────────

  const openConversation = useCallback(
    (partner: Partner) => {
      setActivePartner(partner);
      activePartnerIdRef.current = partner.id;
      setMessages([]);
      setSendError(null);
      loadMessages(partner.id);
      markMessagesRead(partner.id);
      setConversations((prev) =>
        prev.map((c) =>
          c.partner.id === partner.id ? { ...c, unreadCount: 0 } : c
        )
      );
      setMobileView("thread");
      setTimeout(() => inputRef.current?.focus(), 100);
    },
    [loadMessages]
  );

  // ── Send message ────────────────────────────────────────────────────────

  const handleSend = useCallback(() => {
    if (!activePartner || !inputText.trim() || sending) return;
    const content = inputText.trim();
    setInputText("");
    setSendError(null);

    startSendTransition(async () => {
      const result = await sendMessage(activePartner.id, content);
      if (result.error) {
        setSendError(result.error);
        setInputText(content);
        return;
      }
      const newMsg = result.message as Message;
      setMessages((prev) => {
        if (prev.some((m) => m.id === newMsg.id)) return prev;
        return [...prev, newMsg];
      });
      setConversations((prev) => {
        const exists = prev.find((c) => c.partner.id === activePartner.id);
        if (exists) {
          return [
            { ...exists, lastMessage: newMsg },
            ...prev.filter((c) => c.partner.id !== activePartner.id),
          ];
        }
        return [
          { partner: activePartner, lastMessage: newMsg, unreadCount: 0 },
          ...prev,
        ];
      });
      setTimeout(scrollToBottom, 50);
    });
  }, [activePartner, inputText, sending, scrollToBottom]);

  // ── Real-time subscription ──────────────────────────────────────────────

  useEffect(() => {
    loadConversations();
    if (initialPartner) loadMessages(initialPartner.id);

    const channel = supabase
      .channel(`inbox-${currentUser.id}`)
      .on(
        "postgres_changes" as any,
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
          filter: `recipient_id=eq.${currentUser.id}`,
        },
        async (payload: any) => {
          const msg = payload.new as Message;
          const senderId = msg.sender_id;

          if (activePartnerIdRef.current === senderId) {
            setMessages((prev) => {
              if (prev.some((m) => m.id === msg.id)) return prev;
              return [...prev, msg];
            });
            markMessagesRead(senderId);
            setTimeout(scrollToBottom, 50);
          }

          setConversations((prev) => {
            const existing = prev.find((c) => c.partner.id === senderId);
            const isActive = activePartnerIdRef.current === senderId;
            if (existing) {
              return [
                {
                  ...existing,
                  lastMessage: msg,
                  unreadCount: isActive ? 0 : existing.unreadCount + 1,
                },
                ...prev.filter((c) => c.partner.id !== senderId),
              ];
            }
            // New sender — fetch their profile then prepend
            supabase
              .from("profiles")
              .select("id, username, full_name, avatar_url, trade, experience_level")
              .eq("id", senderId)
              .single()
              .then(({ data }) => {
                if (!data) return;
                setConversations((p) => [
                  {
                    partner: data as Partner,
                    lastMessage: msg,
                    unreadCount: isActive ? 0 : 1,
                  },
                  ...p,
                ]);
              });
            return prev;
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [currentUser.id]); // eslint-disable-line react-hooks/exhaustive-deps

  // Keep ref in sync
  useEffect(() => {
    activePartnerIdRef.current = activePartner?.id ?? null;
  }, [activePartner]);

  // ── Modal user search ───────────────────────────────────────────────────

  useEffect(() => {
    if (!showModal) { setModalQuery(""); setModalResults([]); return; }
  }, [showModal]);

  useEffect(() => {
    if (!modalQuery.trim()) { setModalResults([]); return; }
    setSearchingUsers(true);
    const timer = setTimeout(async () => {
      const results = await searchUsers(modalQuery);
      setModalResults(results as Partner[]);
      setSearchingUsers(false);
    }, 300);
    return () => clearTimeout(timer);
  }, [modalQuery]);

  // ── Filtered conversations ──────────────────────────────────────────────

  const filtered = conversations.filter((c) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      c.partner.username.includes(q) ||
      (c.partner.full_name?.toLowerCase().includes(q) ?? false)
    );
  });

  const totalUnread = conversations.reduce((sum, c) => sum + c.unreadCount, 0);

  // ── Render ──────────────────────────────────────────────────────────────

  return (
    <div className="h-[calc(100vh-3.5rem)] flex bg-sm-bg overflow-hidden">

      {/* ── Left panel: Conversation list ────────────────────────────── */}
      <div
        className={`${
          mobileView === "list" ? "flex" : "hidden"
        } sm:flex w-full sm:w-80 xl:w-96 flex-col bg-white border-r border-border shrink-0`}
      >
        {/* Header */}
        <div className="px-4 py-3 border-b border-border flex items-center justify-between gap-2 shrink-0">
          <h1 className="font-serif text-lg font-bold text-navy">
            Messages
            {totalUnread > 0 && (
              <span className="ml-2 text-xs font-semibold bg-accent text-white rounded-full px-1.5 py-0.5">
                {totalUnread}
              </span>
            )}
          </h1>
          <button
            onClick={() => setShowModal(true)}
            className="flex items-center gap-1.5 text-xs font-semibold text-white bg-navy px-3 py-1.5 rounded-md hover:bg-navy-mid transition-colors"
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
            </svg>
            New
          </button>
        </div>

        {/* Search */}
        <div className="px-3 py-2 border-b border-border shrink-0">
          <div className="relative">
            <svg className="absolute left-2.5 top-1/2 -translate-y-1/2 text-text-dim" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
            </svg>
            <input
              type="text"
              placeholder="Search conversations…"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-sm-bg border border-border rounded-md pl-8 pr-3 py-2 text-sm text-navy placeholder:text-text-dim focus:outline-none focus:border-accent transition-colors"
            />
          </div>
        </div>

        {/* List */}
        <div className="flex-1 overflow-y-auto">
          {loadingConvs ? (
            <div className="flex items-center justify-center h-32">
              <div className="w-5 h-5 border-2 border-border border-t-accent rounded-full animate-spin" />
            </div>
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-48 text-center px-6">
              <svg className="text-text-dim mb-3" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
              </svg>
              <p className="text-sm font-semibold text-navy">
                {searchQuery ? "No results" : "No messages yet"}
              </p>
              <p className="text-xs text-text-dim mt-1">
                {searchQuery ? "Try a different name" : "Start a conversation with a trade worker"}
              </p>
            </div>
          ) : (
            filtered.map((conv) => {
              const isActive = activePartner?.id === conv.partner.id;
              const displayName = conv.partner.full_name || conv.partner.username;
              return (
                <button
                  key={conv.partner.id}
                  onClick={() => openConversation(conv.partner)}
                  className={`w-full flex items-center gap-3 px-4 py-3.5 text-left hover:bg-sm-bg transition-colors border-b border-border/50 ${
                    isActive ? "bg-accent/5 border-l-2 border-l-accent" : ""
                  }`}
                >
                  <Avatar url={conv.partner.avatar_url} name={displayName} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-1">
                      <p className={`text-sm truncate ${conv.unreadCount > 0 ? "font-bold text-navy" : "font-semibold text-navy"}`}>
                        {displayName}
                      </p>
                      <span className="text-[11px] text-text-dim shrink-0">
                        {formatConvTime(conv.lastMessage.created_at)}
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      <p className={`text-xs truncate ${conv.unreadCount > 0 ? "text-navy font-medium" : "text-text-dim"}`}>
                        {conv.lastMessage.sender_id === currentUser.id ? "You: " : ""}
                        {conv.lastMessage.content}
                      </p>
                      {conv.unreadCount > 0 && (
                        <span className="w-2 h-2 bg-accent rounded-full shrink-0" />
                      )}
                    </div>
                  </div>
                </button>
              );
            })
          )}
        </div>
      </div>

      {/* ── Right panel: Message thread ───────────────────────────────── */}
      <div
        className={`${
          mobileView === "thread" ? "flex" : "hidden"
        } sm:flex flex-1 flex-col min-w-0`}
      >
        {activePartner ? (
          <>
            {/* Thread header */}
            <div className="bg-white border-b border-border px-4 py-3 flex items-center gap-3 shrink-0">
              {/* Mobile back button */}
              <button
                onClick={() => setMobileView("list")}
                className="sm:hidden text-text-dim hover:text-navy transition-colors mr-1"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="15 18 9 12 15 6"/>
                </svg>
              </button>

              <Link href={`/${activePartner.username}`} className="flex items-center gap-3 hover:opacity-80 transition-opacity flex-1 min-w-0">
                <Avatar url={activePartner.avatar_url} name={activePartner.full_name || activePartner.username} />
                <div className="min-w-0">
                  <p className="text-sm font-bold text-navy truncate">
                    {activePartner.full_name || activePartner.username}
                  </p>
                  <p className="text-xs text-text-dim truncate">
                    {[
                      activePartner.experience_level ? LEVEL_LABEL[activePartner.experience_level] : null,
                      activePartner.trade,
                    ]
                      .filter(Boolean)
                      .join(" · ") || `@${activePartner.username}`}
                  </p>
                </div>
              </Link>

              <Link
                href={`/${activePartner.username}`}
                className="shrink-0 text-xs font-semibold text-accent border border-accent rounded-md px-3 py-1.5 hover:bg-accent hover:text-white transition-colors"
              >
                View Profile
              </Link>
            </div>

            {/* Messages area */}
            <div className="flex-1 overflow-y-auto px-4 py-4 space-y-1">
              {loadingMsgs ? (
                <div className="flex items-center justify-center h-32">
                  <div className="w-5 h-5 border-2 border-border border-t-accent rounded-full animate-spin" />
                </div>
              ) : messages.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-center py-16">
                  <Avatar
                    url={activePartner.avatar_url}
                    name={activePartner.full_name || activePartner.username}
                    size="lg"
                  />
                  <p className="text-sm font-semibold text-navy mt-3">
                    {activePartner.full_name || activePartner.username}
                  </p>
                  <p className="text-xs text-text-dim mt-1 mb-1">@{activePartner.username}</p>
                  {activePartner.trade && (
                    <p className="text-xs text-text-dim">{activePartner.trade}</p>
                  )}
                  <p className="text-xs text-text-dim mt-4">
                    Start the conversation below.
                  </p>
                </div>
              ) : (
                messages.map((msg, i) => {
                  const isMe = msg.sender_id === currentUser.id;
                  const showTs = shouldShowTimestamp(messages, i);
                  return (
                    <div key={msg.id}>
                      {showTs && (
                        <div className="flex justify-center my-3">
                          <span className="text-[11px] text-text-dim bg-sm-bg px-2 py-0.5 rounded-full">
                            {formatMsgTimestamp(msg.created_at)}
                          </span>
                        </div>
                      )}
                      <div className={`flex ${isMe ? "justify-end" : "justify-start"} mb-1`}>
                        <div
                          className={`max-w-[72%] sm:max-w-[60%] px-3.5 py-2 rounded-2xl text-sm leading-relaxed break-words ${
                            isMe
                              ? "bg-navy text-white rounded-br-sm"
                              : "bg-white border border-border text-navy rounded-bl-sm"
                          }`}
                        >
                          {msg.content}
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input area */}
            <div className="bg-white border-t border-border px-4 py-3 shrink-0">
              {sendError && (
                <p className="text-xs text-red-600 mb-2">{sendError}</p>
              )}
              <div className="flex items-end gap-2">
                <textarea
                  ref={inputRef}
                  value={inputText}
                  onChange={(e) => {
                    setInputText(e.target.value);
                    e.target.style.height = "auto";
                    e.target.style.height = `${Math.min(e.target.scrollHeight, 120)}px`;
                  }}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      handleSend();
                    }
                  }}
                  placeholder={`Message ${activePartner.full_name || activePartner.username}…`}
                  rows={1}
                  className="flex-1 resize-none bg-sm-bg border border-border rounded-xl px-3.5 py-2.5 text-sm text-navy placeholder:text-text-dim focus:outline-none focus:border-accent transition-colors overflow-hidden"
                  style={{ minHeight: "42px", maxHeight: "120px" }}
                />
                <button
                  onClick={handleSend}
                  disabled={!inputText.trim() || sending}
                  className="w-10 h-10 bg-navy text-white rounded-xl flex items-center justify-center hover:bg-navy-mid transition-colors disabled:opacity-40 disabled:cursor-not-allowed shrink-0"
                >
                  {sending ? (
                    <div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                  ) : (
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/>
                    </svg>
                  )}
                </button>
              </div>
            </div>
          </>
        ) : (
          /* No conversation selected */
          <div className="flex-1 flex flex-col items-center justify-center text-center p-8">
            <div className="w-16 h-16 bg-white border border-border rounded-2xl flex items-center justify-center mb-4">
              <svg className="text-text-dim" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
              </svg>
            </div>
            <p className="text-sm font-semibold text-navy">Your messages</p>
            <p className="text-xs text-text-dim mt-1 max-w-xs">
              Select a conversation or start a new one to connect with trade workers.
            </p>
            <button
              onClick={() => setShowModal(true)}
              className="mt-4 text-sm font-semibold text-white bg-navy px-4 py-2 rounded-md hover:bg-navy-mid transition-colors"
            >
              New Message
            </button>
          </div>
        )}
      </div>

      {/* ── New Message Modal ─────────────────────────────────────────── */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-navy/40 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden">
            {/* Modal header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-border">
              <h2 className="font-semibold text-navy text-sm">New Message</h2>
              <button
                onClick={() => setShowModal(false)}
                className="w-7 h-7 flex items-center justify-center text-text-dim hover:text-navy hover:bg-sm-bg rounded-md transition-colors"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                </svg>
              </button>
            </div>

            {/* Search */}
            <div className="px-4 pt-3 pb-2">
              <div className="relative">
                <svg className="absolute left-3 top-1/2 -translate-y-1/2 text-text-dim" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
                </svg>
                <input
                  autoFocus
                  type="text"
                  placeholder="Search by name or username…"
                  value={modalQuery}
                  onChange={(e) => setModalQuery(e.target.value)}
                  className="w-full bg-sm-bg border border-border rounded-lg pl-9 pr-3 py-2.5 text-sm text-navy placeholder:text-text-dim focus:outline-none focus:border-accent transition-colors"
                />
              </div>
            </div>

            {/* Results */}
            <div className="min-h-[200px] max-h-72 overflow-y-auto px-2 pb-3">
              {searchingUsers ? (
                <div className="flex items-center justify-center h-24">
                  <div className="w-5 h-5 border-2 border-border border-t-accent rounded-full animate-spin" />
                </div>
              ) : modalResults.length > 0 ? (
                modalResults.map((user) => {
                  const name = user.full_name || user.username;
                  return (
                    <button
                      key={user.id}
                      onClick={() => {
                        setShowModal(false);
                        openConversation(user);
                      }}
                      className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-sm-bg transition-colors text-left"
                    >
                      <Avatar url={user.avatar_url} name={name} size="sm" />
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-navy truncate">{name}</p>
                        <p className="text-xs text-text-dim truncate">
                          @{user.username}
                          {user.trade ? ` · ${user.trade}` : ""}
                        </p>
                      </div>
                    </button>
                  );
                })
              ) : modalQuery.length >= 2 ? (
                <div className="flex flex-col items-center justify-center h-24 text-center">
                  <p className="text-sm text-text-dim">No users found</p>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center h-24 text-center">
                  <p className="text-xs text-text-dim">Type at least 2 characters to search</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
