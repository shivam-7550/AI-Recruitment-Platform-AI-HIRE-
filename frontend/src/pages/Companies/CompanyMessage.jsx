import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Navigate, useSearchParams } from "react-router-dom";
import {
  ArrowLeft,
  Check,
  CheckCheck,
  LoaderCircle,
  Mail,
  MessageSquare,
  Search,
  Send,
  X,
} from "lucide-react";

import CompanySidebar from "../../components/Company/CompanySidebar";
import CompanyHeader from "../../components/Company/CompanyHeader";
import { companyApi, messageApi } from "../../services/api";
import "../../styles/CompanyCSS/CompanyMessage.css";

/* =========================================================
   AUTH HELPERS
   ========================================================= */

function tokenUserId(token) {
  try {
    if (!token) {
      return null;
    }

    const payload = token.split(".")[1];

    if (!payload) {
      return null;
    }

    const normalized = payload.replace(/-/g, "+").replace(/_/g, "/");

    const padded = normalized + "=".repeat((4 - (normalized.length % 4)) % 4);

    const data = JSON.parse(atob(padded));

    return (
      data[
        "http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier"
      ] ||
      data.sub ||
      null
    );
  } catch {
    return null;
  }
}

function getSession() {
  try {
    return JSON.parse(sessionStorage.getItem("user") || "null");
  } catch {
    return null;
  }
}

/* =========================================================
   RESPONSE HELPERS
   ========================================================= */

function getArrayResponse(result, keys = []) {
  if (Array.isArray(result)) {
    return result;
  }

  if (Array.isArray(result?.data)) {
    return result.data;
  }

  for (const key of keys) {
    if (Array.isArray(result?.[key])) {
      return result[key];
    }
  }

  return [];
}

function getUnreadValue(result) {
  if (typeof result === "number") {
    return result;
  }

  if (typeof result?.unreadCount === "number") {
    return result.unreadCount;
  }

  if (typeof result?.data === "number") {
    return result.data;
  }

  if (typeof result?.data?.unreadCount === "number") {
    return result.data.unreadCount;
  }

  return 0;
}

/* =========================================================
   DISPLAY HELPERS
   ========================================================= */

function getInitials(name = "") {
  const parts = String(name).trim().split(/\s+/).filter(Boolean);

  if (!parts.length) {
    return "C";
  }

  if (parts.length === 1) {
    return parts[0].slice(0, 2).toUpperCase();
  }

  return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
}

function formatConversationTime(value) {
  if (!value) {
    return "";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "";
  }

  const now = new Date();

  const startOfToday = new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate(),
  );

  const startOfDate = new Date(
    date.getFullYear(),
    date.getMonth(),
    date.getDate(),
  );

  const difference = startOfToday.getTime() - startOfDate.getTime();

  if (difference === 0) {
    return date.toLocaleTimeString([], {
      hour: "numeric",
      minute: "2-digit",
    });
  }

  if (difference === 24 * 60 * 60 * 1000) {
    return "Yesterday";
  }

  return date.toLocaleDateString([], {
    day: "2-digit",
    month: "short",
    year: date.getFullYear() === now.getFullYear() ? undefined : "numeric",
  });
}

function formatMessageTime(value) {
  if (!value) {
    return "";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "";
  }

  const now = new Date();

  const startOfToday = new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate(),
  );

  const startOfDate = new Date(
    date.getFullYear(),
    date.getMonth(),
    date.getDate(),
  );

  const difference = startOfToday.getTime() - startOfDate.getTime();

  const time = date.toLocaleTimeString([], {
    hour: "numeric",
    minute: "2-digit",
  });

  if (difference === 0) {
    return `Today, ${time}`;
  }

  if (difference === 24 * 60 * 60 * 1000) {
    return `Yesterday, ${time}`;
  }

  return `${date.toLocaleDateString([], {
    day: "2-digit",
    month: "short",
    year: "numeric",
  })}, ${time}`;
}

/* =========================================================
   NORMALIZERS
   ========================================================= */

function normalizeConversation(item) {
  return {
    ...item,

    conversationId:
      item?.conversationId || item?.id || item?.ConversationId || item?.Id,

    candidateId: item?.candidateId || item?.CandidateId || null,

    candidateName: item?.candidateName || item?.CandidateName || "Candidate",

    candidateProfileImage:
      item?.candidateProfileImage || item?.CandidateProfileImage || null,

    applicationId: item?.applicationId || item?.ApplicationId || null,

    jobTitle: item?.jobTitle || item?.JobTitle || "Application",

    applicationStatus: item?.applicationStatus || item?.ApplicationStatus || "",

    lastMessage: item?.lastMessage || item?.LastMessage || "",

    lastMessageAt: item?.lastMessageAt || item?.LastMessageAt || null,

    unreadCount: Number(item?.unreadCount ?? item?.UnreadCount ?? 0),

    isArchived: Boolean(item?.isArchived ?? item?.IsArchived ?? false),
  };
}

function normalizeMessage(item) {
  return {
    ...item,

    id: item?.id || item?.Id,

    conversationId: item?.conversationId || item?.ConversationId,

    senderId: item?.senderId || item?.SenderId,

    senderName: item?.senderName || item?.SenderName || "User",

    content: item?.content || item?.Content || "",

    isRead: Boolean(item?.isRead ?? item?.IsRead ?? false),

    sentAt:
      item?.sentAt ||
      item?.SentAt ||
      item?.createdAt ||
      item?.CreatedAt ||
      null,

    isMine: Boolean(item?.isMine ?? item?.IsMine ?? false),
  };
}

/* =========================================================
   COMPONENT
   ========================================================= */

export default function CompanyMessage() {
  /*
   * IMPORTANT:
   * Keep session stable between renders.
   * This prevents the initial data-loading effect
   * from executing repeatedly.
   */
  const session = useMemo(() => getSession(), []);

  const role = session?.role;

  const userId =
    session?.userId ||
    tokenUserId(session?.token || session?.accessToken || session?.jwtToken);

  const [searchParams, setSearchParams] = useSearchParams();

  const requestedConversationId = searchParams.get("conversationId");

  /* =======================================================
     STATE
     ======================================================= */

  const [company, setCompany] = useState(null);

  const [conversations, setConversations] = useState([]);

  const [selectedConversationId, setSelectedConversationId] = useState(
    requestedConversationId || null,
  );

  const [selectedConversation, setSelectedConversation] = useState(null);

  const [messages, setMessages] = useState([]);

  const [search, setSearch] = useState("");

  const [filter, setFilter] = useState("all");

  const [messageText, setMessageText] = useState("");

  const [loadingConversations, setLoadingConversations] = useState(true);

  const [loadingConversation, setLoadingConversation] = useState(false);

  const [sending, setSending] = useState(false);

  const [error, setError] = useState("");

  const [conversationError, setConversationError] = useState("");

  const [unreadCount, setUnreadCount] = useState(0);

  const [mobileChatOpen, setMobileChatOpen] = useState(
    Boolean(requestedConversationId),
  );

  const [isNearBottom, setIsNearBottom] = useState(true);

  /* =======================================================
     REFS
     ======================================================= */

  const messagesEndRef = useRef(null);

  const messagesContainerRef = useRef(null);

  const sendLockRef = useRef(false);

  /*
   * Prevents the same conversation from being loaded
   * repeatedly when the conversation list changes.
   */
  const loadedConversationRef = useRef(null);

  /* =======================================================
     LOAD COMPANY
     ======================================================= */

  const loadCompany = useCallback(async () => {
    if (!userId) {
      return;
    }

    try {
      const result = await companyApi.byUser(userId);

      setCompany(result);
    } catch {
      /*
       * CompanyHeader can still render
       * without company profile data.
       */
    }
  }, [userId]);

  /* =======================================================
     LOAD UNREAD COUNT
     ======================================================= */

  const loadUnreadCount = useCallback(async () => {
    try {
      const result = await messageApi.unreadCount();

      setUnreadCount(getUnreadValue(result));
    } catch {
      /*
       * Do not block the messaging page
       * if unread count fails.
       */
    }
  }, []);

  /* =======================================================
     LOAD CONVERSATIONS
     ======================================================= */

  const loadConversations = useCallback(async () => {
    setLoadingConversations(true);
    setError("");

    try {
      const result = await messageApi.conversations();

      const list = getArrayResponse(result, ["conversations", "items"])
        .map(normalizeConversation)
        .filter((item) => item.conversationId);

      setConversations(list);
    } catch (err) {
      setError(err?.message || "Unable to load conversations.");
    } finally {
      setLoadingConversations(false);
    }
  }, []);

  /* =======================================================
     LOAD SELECTED CONVERSATION
     ======================================================= */

  const loadMessages = useCallback(
    async (conversationId) => {
      if (!conversationId) {
        return;
      }

      /*
       * Avoid duplicate loading for the same
       * conversation caused by React state changes.
       */
      if (
        loadedConversationRef.current === String(conversationId) &&
        selectedConversation?.conversationId &&
        String(selectedConversation.conversationId) === String(conversationId)
      ) {
        return;
      }

      loadedConversationRef.current = String(conversationId);

      setLoadingConversation(true);
      setConversationError("");

      try {
        const [conversationResult, messagesResult] = await Promise.all([
          messageApi.conversation(conversationId),
          messageApi.messages(conversationId),
        ]);

        const conversation = normalizeConversation(conversationResult);

        const messageList = getArrayResponse(messagesResult, [
          "messages",
          "items",
        ])
          .map(normalizeMessage)
          .sort((a, b) => new Date(a.sentAt || 0) - new Date(b.sentAt || 0));

        setSelectedConversation(conversation);

        setMessages(messageList);

        /*
         * Update the selected conversation
         * inside the left-side list.
         */
        setConversations((current) =>
          current.map((item) =>
            String(item.conversationId) === String(conversationId)
              ? {
                  ...item,
                  ...conversation,
                }
              : item,
          ),
        );

        /*
         * Mark candidate messages as read.
         */
        try {
          await messageApi.markAsRead(conversationId);

          setConversations((current) =>
            current.map((item) =>
              String(item.conversationId) === String(conversationId)
                ? {
                    ...item,
                    unreadCount: 0,
                  }
                : item,
            ),
          );

          setSelectedConversation((current) =>
            current
              ? {
                  ...current,
                  unreadCount: 0,
                }
              : current,
          );

          await loadUnreadCount();
        } catch {
          /*
           * Reading the conversation should
           * not prevent messages from displaying.
           */
        }
      } catch (err) {
        /*
         * Allow retry after a failed request.
         */
        loadedConversationRef.current = null;

        setConversationError(
          err?.message || "Unable to load this conversation.",
        );

        setSelectedConversation(null);
        setMessages([]);
      } finally {
        setLoadingConversation(false);
      }
    },
    [loadUnreadCount, selectedConversation?.conversationId],
  );

  /* =======================================================
     INITIAL DATA LOAD
     ======================================================= */

  useEffect(() => {
    if (!session) {
      return;
    }

    loadCompany();
    loadConversations();
    loadUnreadCount();
  }, [session, loadCompany, loadConversations, loadUnreadCount]);

  /* =======================================================
     URL → SELECTED CONVERSATION
     ======================================================= */

  useEffect(() => {
    if (!requestedConversationId) {
      return;
    }

    if (String(requestedConversationId) !== String(selectedConversationId)) {
      /*
       * New URL conversation:
       * allow it to load again.
       */
      loadedConversationRef.current = null;

      setSelectedConversationId(requestedConversationId);

      setMobileChatOpen(true);
    }
  }, [requestedConversationId, selectedConversationId]);

  /* =======================================================
     LOAD WHEN SELECTED CONVERSATION CHANGES
     ======================================================= */

  useEffect(() => {
    if (!selectedConversationId) {
      return;
    }

    /*
     * If conversations haven't loaded yet,
     * wait for them.
     */
    if (loadingConversations) {
      return;
    }

    const exists = conversations.some(
      (conversation) =>
        String(conversation.conversationId) === String(selectedConversationId),
    );

    if (!exists) {
      setConversationError("This conversation could not be found.");

      return;
    }

    loadMessages(selectedConversationId);
  }, [
    selectedConversationId,
    loadingConversations,
    conversations,
    loadMessages,
  ]);

  /* =======================================================
     FILTERED CONVERSATIONS
     ======================================================= */

  const filteredConversations = useMemo(() => {
    const query = search.trim().toLowerCase();

    return conversations
      .filter((conversation) => {
        if (filter === "unread") {
          return conversation.unreadCount > 0;
        }

        if (filter === "read") {
          return conversation.unreadCount === 0;
        }

        return true;
      })
      .filter((conversation) => {
        if (!query) {
          return true;
        }

        const searchable = [
          conversation.candidateName,
          conversation.jobTitle,
          conversation.lastMessage,
        ]
          .filter(Boolean)
          .join(" ")
          .toLowerCase();

        return searchable.includes(query);
      })
      .sort((a, b) => {
        const dateA = new Date(a.lastMessageAt || 0).getTime();

        const dateB = new Date(b.lastMessageAt || 0).getTime();

        return dateB - dateA;
      });
  }, [conversations, filter, search]);

  /* =======================================================
     SELECT CONVERSATION
     ======================================================= */

  const selectConversation = useCallback(
    (conversationId) => {
      if (!conversationId) {
        return;
      }

      /*
       * If the user manually selects another
       * conversation, allow it to load.
       */
      if (String(conversationId) !== String(selectedConversationId)) {
        loadedConversationRef.current = null;
      }

      setSelectedConversationId(conversationId);

      setConversationError("");

      setMobileChatOpen(true);

      setSearchParams(
        {
          conversationId,
        },
        {
          replace: true,
        },
      );
    },
    [selectedConversationId, setSearchParams],
  );

  /* =======================================================
     MOBILE BACK
     ======================================================= */

  const handleBackToList = useCallback(() => {
    setMobileChatOpen(false);

    setSearchParams(
      {},
      {
        replace: true,
      },
    );
  }, [setSearchParams]);

  /* =======================================================
     MESSAGE SCROLL
     ======================================================= */

  const handleScroll = useCallback(() => {
    const container = messagesContainerRef.current;

    if (!container) {
      return;
    }

    const distanceFromBottom =
      container.scrollHeight - container.scrollTop - container.clientHeight;

    setIsNearBottom(distanceFromBottom < 120);
  }, []);

  /* =======================================================
     AUTO SCROLL
     ======================================================= */

  useEffect(() => {
    if (!isNearBottom) {
      return;
    }

    messagesEndRef.current?.scrollIntoView({
      behavior: "smooth",
    });
  }, [messages, isNearBottom]);

  /* =======================================================
     SEND MESSAGE
     ======================================================= */

  const handleSend = useCallback(async () => {
    const content = messageText.trim();

    if (!content || !selectedConversationId || sending || sendLockRef.current) {
      return;
    }

    sendLockRef.current = true;
    setSending(true);
    setConversationError("");

    try {
      const result = await messageApi.send({
        conversationId: selectedConversationId,
        content,
      });

      const createdMessage = normalizeMessage(
        result?.data || result?.message || result,
      );

      if (createdMessage.content) {
        setMessages((current) => [
          ...current,
          {
            ...createdMessage,
            isMine: true,
          },
        ]);
      } else {
        /*
         * Fallback if the API does not return
         * the created message.
         */
        loadedConversationRef.current = null;

        await loadMessages(selectedConversationId);
      }

      setMessageText("");

      const now = new Date().toISOString();

      setConversations((current) =>
        current.map((conversation) =>
          String(conversation.conversationId) === String(selectedConversationId)
            ? {
                ...conversation,
                lastMessage: content,
                lastMessageAt: now,
              }
            : conversation,
        ),
      );
    } catch (err) {
      setConversationError(err?.message || "Unable to send the message.");
    } finally {
      setSending(false);

      window.setTimeout(() => {
        sendLockRef.current = false;
      }, 300);
    }
  }, [messageText, selectedConversationId, sending, loadMessages]);

  /* =======================================================
     COMPOSER KEYBOARD
     ======================================================= */

  const handleComposerKeyDown = useCallback(
    (event) => {
      if (event.key === "Enter" && !event.shiftKey) {
        event.preventDefault();

        handleSend();
      }
    },
    [handleSend],
  );

  /* =======================================================
     SELECTED CANDIDATE
     ======================================================= */

  const selectedCandidateName =
    selectedConversation?.candidateName || "Candidate";

  /* =======================================================
     AUTH REDIRECTS
     ======================================================= */

  if (!session) {
    return <Navigate to="/login" replace />;
  }

  if (role && role !== "Company") {
    return <Navigate to={`/${String(role).toLowerCase()}/dashboard`} replace />;
  }

  /* =======================================================
     UI
     ======================================================= */

  return (
    <div className="company-message-page">
      <CompanySidebar />

      <div className="company-message-main">
        <CompanyHeader
          company={company}
          setCompany={setCompany}
          title="Messages"
          subtitle="View and manage your recruitment conversations."
          pageTitle="Messages"
          pageSubtitle="Connect with candidates and manage recruitment conversations."
        />

        <main className="company-message-content">
          <div className="company-message-shell">
            {/* =================================================
                LEFT — CONVERSATION LIST
               ================================================= */}

            <aside
              className={`company-message-list ${
                mobileChatOpen ? "mobile-hidden" : ""
              }`}
            >
              <div className="company-message-list-header">
                <div>
                  <h2>Conversations</h2>

                  <span>
                    {conversations.length}{" "}
                    {conversations.length === 1
                      ? "conversation"
                      : "conversations"}
                  </span>
                </div>

                <div className="company-message-unread-total">
                  <Mail size={16} />

                  <span>{unreadCount}</span>
                </div>
              </div>

              {/* SEARCH */}

              <div className="company-message-search">
                <Search size={17} />

                <input
                  type="search"
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="Search conversations..."
                  aria-label="Search conversations"
                />

                {search && (
                  <button
                    type="button"
                    className="company-message-search-clear"
                    onClick={() => setSearch("")}
                    aria-label="Clear search"
                  >
                    <X size={15} />
                  </button>
                )}
              </div>

              {/* FILTERS */}

              <div
                className="company-message-filters"
                role="tablist"
                aria-label="Conversation filters"
              >
                <button
                  type="button"
                  className={filter === "all" ? "active" : ""}
                  onClick={() => setFilter("all")}
                >
                  All
                </button>

                <button
                  type="button"
                  className={filter === "unread" ? "active" : ""}
                  onClick={() => setFilter("unread")}
                >
                  Unread
                </button>

                <button
                  type="button"
                  className={filter === "read" ? "active" : ""}
                  onClick={() => setFilter("read")}
                >
                  Read
                </button>
              </div>

              {/* CONVERSATIONS */}

              <div className="company-message-conversation-list">
                {loadingConversations ? (
                  <div className="company-message-state">
                    <LoaderCircle size={24} className="spin" />

                    <p>Loading conversations...</p>
                  </div>
                ) : error ? (
                  <div className="company-message-state error">
                    <MessageSquare size={28} />

                    <p>{error}</p>

                    <button type="button" onClick={loadConversations}>
                      Try again
                    </button>
                  </div>
                ) : filteredConversations.length === 0 ? (
                  <div className="company-message-state">
                    <MessageSquare size={32} />

                    <h3>
                      {search
                        ? "No matches found"
                        : filter === "unread"
                          ? "No unread conversations"
                          : "No conversations yet"}
                    </h3>

                    <p>
                      {search
                        ? "Try a different candidate name, job title, or message."
                        : "Candidate conversations will appear here when you start messaging applicants."}
                    </p>
                  </div>
                ) : (
                  filteredConversations.map((conversation) => {
                    const isActive =
                      String(conversation.conversationId) ===
                      String(selectedConversationId);

                    return (
                      <button
                        type="button"
                        key={conversation.conversationId}
                        className={`company-message-conversation ${
                          isActive ? "active" : ""
                        } ${conversation.unreadCount > 0 ? "unread" : ""}`}
                        onClick={() =>
                          selectConversation(conversation.conversationId)
                        }
                      >
                        {/* AVATAR */}

                        <div className="company-message-avatar">
                          {conversation.candidateProfileImage ? (
                            <img
                              src={conversation.candidateProfileImage}
                              alt=""
                            />
                          ) : (
                            getInitials(conversation.candidateName)
                          )}
                        </div>

                        <div className="company-message-conversation-body">
                          <div className="company-message-conversation-top">
                            <strong>{conversation.candidateName}</strong>

                            <span>
                              {formatConversationTime(
                                conversation.lastMessageAt,
                              )}
                            </span>
                          </div>

                          <div className="company-message-job">
                            {conversation.jobTitle}
                          </div>

                          <div className="company-message-preview-row">
                            <p>
                              {conversation.lastMessage || "No messages yet"}
                            </p>

                            {conversation.unreadCount > 0 && (
                              <span className="company-message-unread-badge">
                                {conversation.unreadCount}
                              </span>
                            )}
                          </div>
                        </div>
                      </button>
                    );
                  })
                )}
              </div>
            </aside>

            {/* =================================================
                RIGHT — CHAT
               ================================================= */}

            <section
              className={`company-message-chat ${
                mobileChatOpen ? "mobile-visible" : ""
              }`}
            >
              {/* NO CONVERSATION */}

              {!selectedConversationId ? (
                <div className="company-message-chat-empty">
                  <div className="company-message-empty-icon">
                    <MessageSquare size={34} />
                  </div>

                  <h2>Select a conversation</h2>

                  <p>
                    Choose a candidate from the conversation list to view
                    messages.
                  </p>
                </div>
              ) : loadingConversation ? (
                /* LOADING */

                <div className="company-message-chat-loading">
                  <LoaderCircle size={30} className="spin" />

                  <p>Loading conversation...</p>
                </div>
              ) : conversationError && !selectedConversation ? (
                /* ERROR */

                <div className="company-message-chat-empty error">
                  <MessageSquare size={34} />

                  <h2>Unable to load conversation</h2>

                  <p>{conversationError}</p>

                  <button
                    type="button"
                    onClick={() => {
                      loadedConversationRef.current = null;

                      loadMessages(selectedConversationId);
                    }}
                  >
                    Try again
                  </button>
                </div>
              ) : (
                <>
                  {/* CHAT HEADER */}

                  <header className="company-message-chat-header">
                    <button
                      type="button"
                      className="company-message-mobile-back"
                      onClick={handleBackToList}
                      aria-label="Back to conversations"
                    >
                      <ArrowLeft size={20} />
                    </button>

                    <div className="company-message-chat-person">
                      <div className="company-message-avatar large">
                        {selectedConversation?.candidateProfileImage ? (
                          <img
                            src={selectedConversation.candidateProfileImage}
                            alt=""
                          />
                        ) : (
                          getInitials(selectedCandidateName)
                        )}
                      </div>

                      <div>
                        <h2>{selectedCandidateName}</h2>

                        <div className="company-message-chat-meta">
                          <span>
                            {selectedConversation?.jobTitle || "Application"}
                          </span>

                          {selectedConversation?.applicationStatus && (
                            <>
                              <span className="dot">•</span>

                              <span
                                className={`company-message-status ${String(
                                  selectedConversation.applicationStatus,
                                )
                                  .toLowerCase()
                                  .replace(/\s+/g, "-")}`}
                              >
                                {selectedConversation.applicationStatus}
                              </span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  </header>

                  {/* MESSAGE THREAD */}

                  <div
                    ref={messagesContainerRef}
                    className="company-message-thread"
                    onScroll={handleScroll}
                  >
                    {messages.length === 0 ? (
                      <div className="company-message-thread-empty">
                        <div>
                          <MessageSquare size={26} />
                        </div>

                        <h3>Start the conversation</h3>

                        <p>
                          Send a message to {selectedCandidateName} about their
                          application.
                        </p>
                      </div>
                    ) : (
                      <div className="company-message-thread-inner">
                        {messages.map((message, index) => {
                          const previous = messages[index - 1];

                          const currentDate = message.sentAt
                            ? new Date(message.sentAt).toDateString()
                            : "";

                          const previousDate = previous?.sentAt
                            ? new Date(previous.sentAt).toDateString()
                            : "";

                          const showDate =
                            index === 0 || currentDate !== previousDate;

                          return (
                            <div
                              key={
                                message.id ||
                                `${message.conversationId}-${index}`
                              }
                            >
                              {showDate && (
                                <div className="company-message-date-divider">
                                  <span>
                                    {message.sentAt
                                      ? new Date(
                                          message.sentAt,
                                        ).toLocaleDateString([], {
                                          weekday: "short",
                                          day: "2-digit",
                                          month: "short",
                                          year: "numeric",
                                        })
                                      : ""}
                                  </span>
                                </div>
                              )}

                              <div
                                className={`company-message-row ${
                                  message.isMine ? "mine" : "theirs"
                                }`}
                              >
                                {!message.isMine && (
                                  <div className="company-message-small-avatar">
                                    {getInitials(
                                      message.senderName ||
                                        selectedCandidateName,
                                    )}
                                  </div>
                                )}

                                <div className="company-message-bubble-wrap">
                                  <div className="company-message-bubble">
                                    {message.content}
                                  </div>

                                  <div className="company-message-bubble-meta">
                                    <span>
                                      {formatMessageTime(message.sentAt)}
                                    </span>

                                    {message.isMine && (
                                      <span
                                        className={message.isRead ? "read" : ""}
                                        title={message.isRead ? "Read" : "Sent"}
                                      >
                                        {message.isRead ? (
                                          <CheckCheck size={14} />
                                        ) : (
                                          <Check size={14} />
                                        )}
                                      </span>
                                    )}
                                  </div>
                                </div>
                              </div>
                            </div>
                          );
                        })}

                        <div ref={messagesEndRef} />
                      </div>
                    )}
                  </div>

                  {/* ERROR */}

                  {conversationError && (
                    <div className="company-message-composer-error">
                      {conversationError}
                    </div>
                  )}

                  {/* COMPOSER */}

                  <div className="company-message-composer">
                    <textarea
                      value={messageText}
                      onChange={(event) => setMessageText(event.target.value)}
                      onKeyDown={handleComposerKeyDown}
                      placeholder={`Message ${selectedCandidateName}...`}
                      rows={1}
                      aria-label="Message"
                      disabled={sending}
                    />

                    <button
                      type="button"
                      className="company-message-send"
                      onClick={handleSend}
                      disabled={sending || !messageText.trim()}
                      aria-label="Send message"
                    >
                      {sending ? (
                        <LoaderCircle size={18} className="spin" />
                      ) : (
                        <Send size={18} />
                      )}

                      <span>{sending ? "Sending..." : "Send"}</span>
                    </button>
                  </div>
                </>
              )}
            </section>
          </div>
        </main>
      </div>
    </div>
  );
}
