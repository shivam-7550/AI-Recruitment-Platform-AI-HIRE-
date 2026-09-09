// import { useEffect, useMemo, useState } from "react";
// import { Link, Navigate, useNavigate } from "react-router-dom";
// import {
//   Bell,
//   Bookmark,
//   BriefcaseBusiness,
//   CheckCircle2,
//   FileText,
//   Grid2X2,
//   LogOut,
//   MailOpen,
//   MessageSquare,
//   Search,
//   Settings,
//   UserRound,
//   Upload,
// } from "lucide-react";

// import { candidateApi, notificationApi } from "../../services/api";
// import CandidateHeader from "../../components/Candidate/CandidateHeader";
// import "../../styles/CandidatesCSS/CandidateMessage.css";
// import CandidateSidebar from "../../components/Candidate/CandidateSidebar";

// export default function CandidateMessages() {
//   const navigate = useNavigate();

//   const session = JSON.parse(sessionStorage.getItem("user") || "null");

//   const [profile, setProfile] = useState({});
//   const [items, setItems] = useState([]);
//   const [query, setQuery] = useState("");
//   const [filter, setFilter] = useState("All");
//   const [error, setError] = useState("");

//   useEffect(() => {
//     if (session?.role !== "User") return;

//     Promise.allSettled([candidateApi.profile(), notificationApi.mine()]).then(
//       ([profileResult, notificationResult]) => {
//         if (profileResult.status === "fulfilled") {
//           setProfile(profileResult.value);
//         }

//         if (notificationResult.status === "fulfilled") {
//           setItems(notificationResult.value || []);
//         } else {
//           setError(
//             notificationResult.reason?.message ||
//               "Messages and updates could not be loaded.",
//           );
//         }
//       },
//     );
//   }, [session?.role]);

//   const unreadCount = useMemo(
//     () => items.filter((item) => !item.isRead).length,
//     [items],
//   );

//   const filteredItems = useMemo(() => {
//     const searchText = query.trim().toLowerCase();

//     return items.filter((item) => {
//       const matchesSearch =
//         !searchText ||
//         `${item.title || ""} ${item.message || ""}`
//           .toLowerCase()
//           .includes(searchText);

//       const matchesFilter =
//         filter === "All" ||
//         (filter === "Unread" && !item.isRead) ||
//         (filter === "Read" && item.isRead);

//       return matchesSearch && matchesFilter;
//     });
//   }, [items, query, filter]);

//   if (!session) {
//     return <Navigate to="/login" replace />;
//   }

//   if (session.role !== "User") {
//     return <Navigate to={`/${session.role.toLowerCase()}/dashboard`} replace />;
//   }

//   async function openMessage(item) {
//     try {
//       if (!item.isRead) {
//         await notificationApi.read(item.id);

//         setItems((current) =>
//           current.map((notification) =>
//             notification.id === item.id
//               ? {
//                   ...notification,
//                   isRead: true,
//                 }
//               : notification,
//           ),
//         );
//       }

//       if (item.jobId) {
//         navigate("/user/browse-jobs");
//       }
//     } catch (error) {
//       setError(error.message || "Unable to open this update.");
//     }
//   }

//   async function markAllAsRead() {
//     const unreadItems = items.filter((item) => !item.isRead);

//     if (!unreadItems.length) return;

//     try {
//       await Promise.allSettled(
//         unreadItems.map((item) => notificationApi.read(item.id)),
//       );

//       setItems((current) =>
//         current.map((item) => ({
//           ...item,
//           isRead: true,
//         })),
//       );
//     } catch (error) {
//       setError(error.message || "Unable to mark messages as read.");
//     }
//   }

//   function logout() {
//     fetch("/api/Auth/logout", {
//       method: "POST",
//     }).catch(() => {});

//     sessionStorage.removeItem("user");
//     sessionStorage.removeItem("accessToken");
//     sessionStorage.removeItem("refreshToken");

//     navigate("/login", {
//       replace: true,
//     });
//   }

//   return (
//     <div className="candidate-messages-page">
//       <CandidateUtilityShell
//         active="messages"
//         title="Messages"
//         subtitle="Stay updated with your recruitment activity."
//         profile={profile}
//         unread={unreadCount}
//         logout={logout}
//       >
//         {/* =====================================================
//             PAGE HEADER
//             ===================================================== */}
//         <section className="candidate-messages-header">
//           <div>
//             <span className="candidate-messages-eyebrow">Candidate inbox</span>

//             <h2>Messages & Updates</h2>

//             <p>
//               Important updates about your applications, jobs and recruitment
//               activity.
//             </p>
//           </div>

//           {unreadCount > 0 && (
//             <button
//               type="button"
//               className="candidate-messages-mark-read"
//               onClick={markAllAsRead}
//             >
//               <CheckCircle2 />
//               Mark all as read
//             </button>
//           )}
//         </section>

//         {/* =====================================================
//             MESSAGE TOOLBAR
//             ===================================================== */}
//         <section className="candidate-messages-toolbar">
//           <label className="candidate-messages-search">
//             <Search />

//             <input
//               type="text"
//               value={query}
//               onChange={(event) => setQuery(event.target.value)}
//               placeholder="Search messages or updates"
//             />
//           </label>

//           <div className="candidate-messages-filters">
//             <button
//               type="button"
//               className={filter === "All" ? "active" : ""}
//               onClick={() => setFilter("All")}
//             >
//               All
//             </button>

//             <button
//               type="button"
//               className={filter === "Unread" ? "active" : ""}
//               onClick={() => setFilter("Unread")}
//             >
//               Unread
//               {unreadCount > 0 && <span>{unreadCount}</span>}
//             </button>

//             <button
//               type="button"
//               className={filter === "Read" ? "active" : ""}
//               onClick={() => setFilter("Read")}
//             >
//               Read
//             </button>
//           </div>
//         </section>

//         {/* =====================================================
//             ERROR
//             ===================================================== */}
//         {error && (
//           <div className="candidate-messages-error">
//             <strong>Unable to load updates</strong>
//             <span>{error}</span>
//           </div>
//         )}

//         {/* =====================================================
//             SUMMARY
//             ===================================================== */}
//         <section className="candidate-messages-summary">
//           <div>
//             <MessageSquare />
//             <span>
//               <strong>{items.length}</strong>
//               Total updates
//             </span>
//           </div>

//           <div>
//             <MailOpen />
//             <span>
//               <strong>{unreadCount}</strong>
//               Unread
//             </span>
//           </div>

//           <div>
//             <CheckCircle2 />
//             <span>
//               <strong>{items.length - unreadCount}</strong>
//               Read
//             </span>
//           </div>
//         </section>

//         {/* =====================================================
//             MESSAGE LIST
//             ===================================================== */}
//         <section className="candidate-messages-panel">
//           <div className="candidate-messages-panel-header">
//             <div>
//               <span>Inbox</span>
//               <h3>Recent activity</h3>
//             </div>

//             <small>
//               {filteredItems.length}{" "}
//               {filteredItems.length === 1 ? "update" : "updates"}
//             </small>
//           </div>

//           <div className="candidate-messages-list">
//             {filteredItems.map((item) => (
//               <button
//                 type="button"
//                 key={item.id}
//                 className={`candidate-message-item ${
//                   item.isRead
//                     ? "candidate-message-item-read"
//                     : "candidate-message-item-unread"
//                 }`}
//                 onClick={() => openMessage(item)}
//               >
//                 <div className="candidate-message-item-icon">
//                   <MessageSquare />
//                 </div>

//                 <div className="candidate-message-item-content">
//                   <div className="candidate-message-item-top">
//                     <strong>{item.title || "Recruitment Update"}</strong>

//                     {!item.isRead && (
//                       <span className="candidate-message-new">New</span>
//                     )}
//                   </div>

//                   <p>{item.message}</p>

//                   <div className="candidate-message-item-meta">
//                     <span>
//                       {item.createdAt
//                         ? new Date(item.createdAt).toLocaleString("en-IN", {
//                             day: "2-digit",
//                             month: "short",
//                             year: "numeric",
//                             hour: "2-digit",
//                             minute: "2-digit",
//                           })
//                         : "Recently"}
//                     </span>

//                     {item.jobId && (
//                       <span className="candidate-message-job">Job related</span>
//                     )}
//                   </div>
//                 </div>

//                 <div className="candidate-message-item-arrow">→</div>
//               </button>
//             ))}

//             {!filteredItems.length && (
//               <div className="candidate-messages-empty">
//                 <div className="candidate-messages-empty-icon">
//                   <MailOpen />
//                 </div>

//                 <h3>
//                   {items.length ? "No matching updates" : "No messages yet"}
//                 </h3>

//                 <p>
//                   {items.length
//                     ? "Try changing your search or filter."
//                     : "Application and recruitment updates will appear here."}
//                 </p>

//                 {!items.length && (
//                   <Link to="/user/browse-jobs">Browse Jobs</Link>
//                 )}
//               </div>
//             )}
//           </div>
//         </section>

//         {/* =====================================================
//             FUTURE CHAT INFORMATION
//             ===================================================== */}
//         <section className="candidate-messages-chat-info">
//           <div className="candidate-messages-chat-icon">
//             <MessageSquare />
//           </div>

//           <div>
//             <span>Coming soon</span>

//             <h3>Direct company messaging</h3>

//             <p>
//               Candidate-to-company chat will be available once conversation and
//               messaging APIs are implemented. For now, this inbox displays
//               verified recruitment notifications and application updates.
//             </p>
//           </div>
//         </section>
//       </CandidateUtilityShell>
//     </div>
//   );
// }

// /* =============================================================
//    CANDIDATE UTILITY SHELL
//    ============================================================= */

// export function CandidateUtilityShell({
//   active,
//   title,
//   subtitle,
//   profile,
//   unread,
//   logout,
//   children,
// }) {
//   return (
//     <div className="candidate-utility">
//       {/* =====================================================
//           SIDEBAR
//           ===================================================== */}
//       {/* <aside className="candidate-utility-sidebar">
//         <Link className="candidate-utility-logo" to="/user/dashboard">
//           <strong>HireLine</strong>
//           <small>Find Your Dream Job</small>
//         </Link>

//         <nav className="candidate-utility-navigation">
//           <Link
//             className={
//               active === "dashboard"
//                 ? "candidate-utility-navigation-active"
//                 : ""
//             }
//             to="/user/dashboard"
//           >
//             <Grid2X2 />
//             <span>Dashboard</span>
//           </Link>

//           <Link
//             className={
//               active === "browse" ? "candidate-utility-navigation-active" : ""
//             }
//             to="/user/browse-jobs"
//           >
//             <BriefcaseBusiness />
//             <span>Browse Jobs</span>
//           </Link>

//           <Link
//             className={
//               active === "applications"
//                 ? "candidate-utility-navigation-active"
//                 : ""
//             }
//             to="/user/applications"
//           >
//             <FileText />
//             <span>My Applications</span>
//           </Link>

//           <Link
//             className={
//               active === "resume" ? "candidate-utility-navigation-active" : ""
//             }
//             to="/user/resume"
//           >
//             <Upload />
//             <span>Resume</span>
//           </Link>

//           <Link
//             className={
//               active === "saved" ? "candidate-utility-navigation-active" : ""
//             }
//             to="/user/saved-jobs"
//           >
//             <Bookmark />
//             <span>Saved Jobs</span>
//           </Link>

//           <Link
//             className={
//               active === "messages" ? "candidate-utility-navigation-active" : ""
//             }
//             to="/user/messages"
//           >
//             <MessageSquare />
//             <span>Messages</span>

//             {unread > 0 && (
//               <small className="candidate-utility-navigation-badge">
//                 {unread > 9 ? "9+" : unread}
//               </small>
//             )}
//           </Link>

//           <Link
//             className={
//               active === "profile" ? "candidate-utility-navigation-active" : ""
//             }
//             to="/user/profile"
//           >
//             <UserRound />
//             <span>Profile</span>
//           </Link>

//           <Link
//             className={
//               active === "settings" ? "candidate-utility-navigation-active" : ""
//             }
//             to="/user/settings"
//           >
//             <Settings />
//             <span>Settings</span>
//           </Link>
//         </nav>

//         <button
//           type="button"
//           className="candidate-utility-logout"
//           onClick={logout}
//         >
//           <LogOut />
//           <span>Logout</span>
//         </button>
//       </aside> */}

//       <CandidateSidebar />

//       {/* =====================================================
//           MAIN
//           ===================================================== */}
//       <main className="candidate-utility-main">
//         <CandidateHeader title={title} subtitle={subtitle} />

//         <section className="candidate-utility-content">{children}</section>
//       </main>
//     </div>
//   );
// }

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ArrowLeft,
  CheckCheck,
  MessageCircle,
  Search,
  Send,
  UserRound,
} from "lucide-react";
import { Navigate, useLocation, useNavigate } from "react-router-dom";

import CandidateSidebar from "../../components/Candidate/CandidateSidebar";
import CandidateHeader from "../../components/Candidate/CandidateHeader";
import { candidateApi, messageApi } from "../../services/api";

import "../../styles/CandidatesCSS/CandidateMessage.css";

// ============================================================
// HELPERS
// ============================================================

function getSession() {
  try {
    return JSON.parse(sessionStorage.getItem("user") || "null");
  } catch {
    return null;
  }
}

function tokenUserId(token) {
  if (!token) {
    return null;
  }

  try {
    const payload = token.split(".")[1];

    if (!payload) {
      return null;
    }

    const decoded = JSON.parse(
      atob(payload.replace(/-/g, "+").replace(/_/g, "/")),
    );

    return (
      decoded[
        "http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier"
      ] ||
      decoded.sub ||
      decoded.userId ||
      null
    );
  } catch {
    return null;
  }
}

function getDateValue(value) {
  if (!value) {
    return null;
  }

  const date = new Date(value);

  return Number.isNaN(date.getTime()) ? null : date;
}

function formatConversationTime(value) {
  const date = getDateValue(value);

  if (!date) {
    return "";
  }

  const now = new Date();

  const sameDay =
    date.getFullYear() === now.getFullYear() &&
    date.getMonth() === now.getMonth() &&
    date.getDate() === now.getDate();

  if (sameDay) {
    return date.toLocaleTimeString([], {
      hour: "numeric",
      minute: "2-digit",
    });
  }

  const yesterday = new Date(now);

  yesterday.setDate(now.getDate() - 1);

  const isYesterday =
    date.getFullYear() === yesterday.getFullYear() &&
    date.getMonth() === yesterday.getMonth() &&
    date.getDate() === yesterday.getDate();

  if (isYesterday) {
    return "Yesterday";
  }

  return date.toLocaleDateString([], {
    day: "numeric",
    month: "short",
  });
}

function formatMessageTime(value) {
  const date = getDateValue(value);

  if (!date) {
    return "";
  }

  const now = new Date();

  const sameDay =
    date.getFullYear() === now.getFullYear() &&
    date.getMonth() === now.getMonth() &&
    date.getDate() === now.getDate();

  if (sameDay) {
    return date.toLocaleTimeString([], {
      hour: "numeric",
      minute: "2-digit",
    });
  }

  return date.toLocaleDateString([], {
    day: "numeric",
    month: "short",
    year: date.getFullYear() === now.getFullYear() ? undefined : "numeric",
  });
}

function getDisplayName(conversation) {
  return (
    conversation?.companyName ||
    conversation?.CompanyName ||
    conversation?.company?.companyName ||
    conversation?.company?.name ||
    conversation?.senderName ||
    "Company"
  );
}

function getCompanyImage(conversation) {
  return (
    conversation?.companyLogoUrl ||
    conversation?.CompanyLogoUrl ||
    conversation?.company?.logoUrl ||
    conversation?.logoUrl ||
    ""
  );
}

function getApplicationStatus(conversation) {
  return (
    conversation?.applicationStatus ||
    conversation?.ApplicationStatus ||
    "Application"
  );
}

// ============================================================
// COMPONENT
// ============================================================

export default function CandidateMessage() {
  const navigate = useNavigate();
  const location = useLocation();

  const session = useMemo(() => getSession(), []);

  const userId = session?.userId || tokenUserId(session?.token);

  const requestedConversationId = useMemo(() => {
    const params = new URLSearchParams(location.search);

    return params.get("conversationId");
  }, [location.search]);

  // ==========================================================
  // STATE
  // ==========================================================

  const [profile, setProfile] = useState(null);

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

  const [loadingMessages, setLoadingMessages] = useState(false);

  const [sending, setSending] = useState(false);

  const [error, setError] = useState("");

  const [conversationError, setConversationError] = useState("");

  const [unreadCount, setUnreadCount] = useState(0);

  const [mobileChatOpen, setMobileChatOpen] = useState(
    Boolean(requestedConversationId),
  );

  // ==========================================================
  // REFS
  // ==========================================================

  const messagesContainerRef = useRef(null);

  const loadedConversationRef = useRef(null);

  const sendLockRef = useRef(false);

  // ==========================================================
  // LOAD PROFILE
  // ==========================================================

  const loadProfile = useCallback(async () => {
    try {
      const result = await candidateApi.profile();

      setProfile(result || null);
    } catch (err) {
      console.error("Candidate profile loading error:", err);
    }
  }, []);

  // ==========================================================
  // LOAD CONVERSATIONS
  // ==========================================================

  const loadConversations = useCallback(async () => {
    setLoadingConversations(true);
    setConversationError("");

    try {
      const result = await messageApi.conversations();

      const items = Array.isArray(result) ? result : [];

      setConversations(items);

      if (requestedConversationId) {
        const requestedExists = items.some(
          (item) =>
            String(item.conversationId) === String(requestedConversationId),
        );

        if (!requestedExists) {
          setConversationError("This conversation could not be found.");
        }
      }
    } catch (err) {
      console.error("Candidate conversations loading error:", err);

      setConversationError(
        err?.message || "Unable to load your conversations.",
      );
    } finally {
      setLoadingConversations(false);
    }
  }, [requestedConversationId]);

  // ==========================================================
  // LOAD UNREAD COUNT
  // ==========================================================

  const loadUnreadCount = useCallback(async () => {
    try {
      const result = await messageApi.unreadCount();

      const count =
        typeof result === "number"
          ? result
          : Number(result?.count ?? result?.unreadCount ?? 0);

      setUnreadCount(Number.isFinite(count) ? count : 0);
    } catch (err) {
      console.error("Candidate unread count error:", err);

      setUnreadCount(0);
    }
  }, []);

  // ==========================================================
  // INITIAL LOAD
  // ==========================================================

  useEffect(() => {
    if (!session || session.role !== "User") {
      return;
    }

    loadProfile();
    loadConversations();
    loadUnreadCount();
  }, [session, loadProfile, loadConversations, loadUnreadCount]);

  // ==========================================================
  // SYNC URL -> SELECTED CONVERSATION
  // ==========================================================

  useEffect(() => {
    if (!requestedConversationId) {
      setSelectedConversationId(null);
      setSelectedConversation(null);
      setMessages([]);
      setMobileChatOpen(false);

      return;
    }

    setSelectedConversationId(requestedConversationId);

    setMobileChatOpen(true);
  }, [requestedConversationId]);

  // ==========================================================
  // UPDATE URL WHEN CONVERSATION CHANGES
  // ==========================================================

  function openConversation(conversationId) {
    if (!conversationId) {
      return;
    }

    setSelectedConversationId(conversationId);
    setMobileChatOpen(true);

    navigate(`/user/messages?conversationId=${conversationId}`, {
      replace: true,
    });
  }

  // ==========================================================
  // LOAD SELECTED CONVERSATION
  // ==========================================================

  const loadMessages = useCallback(
    async (conversationId) => {
      if (!conversationId) {
        return;
      }

      if (loadedConversationRef.current === conversationId) {
        return;
      }

      loadedConversationRef.current = conversationId;

      setLoadingMessages(true);
      setConversationError("");
      setMessages([]);

      try {
        const [conversationResult, messagesResult] = await Promise.all([
          messageApi.conversation(conversationId),
          messageApi.messages(conversationId),
        ]);

        setSelectedConversation(conversationResult || null);

        const messageItems = Array.isArray(messagesResult)
          ? messagesResult
          : [];

        setMessages(messageItems);

        // ------------------------------------------------------
        // Mark as read
        // ------------------------------------------------------

        try {
          await messageApi.markAsRead(conversationId);
        } catch (readError) {
          console.error("Mark conversation as read failed:", readError);
        }

        // ------------------------------------------------------
        // Update local conversation unread count
        // ------------------------------------------------------

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

        await loadUnreadCount();
      } catch (err) {
        console.error("Candidate messages loading error:", err);

        setConversationError(
          err?.message || "Unable to load this conversation.",
        );

        loadedConversationRef.current = null;
      } finally {
        setLoadingMessages(false);
      }
    },
    [loadUnreadCount],
  );

  // ==========================================================
  // SELECTED CONVERSATION EFFECT
  // ==========================================================

  useEffect(() => {
    if (!selectedConversationId) {
      return;
    }

    if (loadingConversations) {
      return;
    }

    const exists = conversations.some(
      (item) => String(item.conversationId) === String(selectedConversationId),
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

  // ==========================================================
  // FILTER CONVERSATIONS
  // ==========================================================

  const filteredConversations = useMemo(() => {
    const query = search.trim().toLowerCase();

    return conversations.filter((conversation) => {
      const companyName = getDisplayName(conversation);

      const jobTitle = conversation?.jobTitle || conversation?.JobTitle || "";

      const lastMessage = conversation?.lastMessage || "";

      const searchableText = `
          ${companyName}
          ${jobTitle}
          ${lastMessage}
        `.toLowerCase();

      const matchesSearch = !query || searchableText.includes(query);

      const unread = Number(conversation?.unreadCount || 0) > 0;

      const matchesFilter =
        filter === "all" ||
        (filter === "unread" && unread) ||
        (filter === "read" && !unread);

      return matchesSearch && matchesFilter;
    });
  }, [conversations, search, filter]);

  // ==========================================================
  // MESSAGE SCROLL
  // ==========================================================

  useEffect(() => {
    const container = messagesContainerRef.current;

    if (!container) {
      return;
    }

    const distanceFromBottom =
      container.scrollHeight - container.scrollTop - container.clientHeight;

    const nearBottom = distanceFromBottom < 180;

    if (nearBottom) {
      container.scrollTop = container.scrollHeight;
    }
  }, [messages]);

  // ==========================================================
  // SEND MESSAGE
  // ==========================================================

  async function handleSend(event) {
    event?.preventDefault();

    const content = messageText.trim();

    if (!content || !selectedConversationId || sending || sendLockRef.current) {
      return;
    }

    sendLockRef.current = true;
    setSending(true);
    setError("");

    try {
      const result = await messageApi.send({
        conversationId: selectedConversationId,
        content,
      });

      setMessageText("");

      // ------------------------------------------------------
      // Add returned message if backend returns it
      // ------------------------------------------------------

      if (result) {
        const newMessage = result?.message || result;

        if (newMessage && typeof newMessage === "object" && newMessage.id) {
          setMessages((current) => [...current, newMessage]);
        } else {
          // Fallback: reload messages
          loadedConversationRef.current = null;

          await loadMessages(selectedConversationId);
        }
      } else {
        loadedConversationRef.current = null;

        await loadMessages(selectedConversationId);
      }

      // ------------------------------------------------------
      // Refresh conversation list
      // ------------------------------------------------------

      try {
        const refreshed = await messageApi.conversations();

        setConversations(Array.isArray(refreshed) ? refreshed : []);
      } catch (refreshError) {
        console.error("Conversation refresh failed:", refreshError);
      }

      await loadUnreadCount();
    } catch (err) {
      console.error("Candidate send message error:", err);

      setError(err?.message || "Unable to send your message.");
    } finally {
      setSending(false);

      window.setTimeout(() => {
        sendLockRef.current = false;
      }, 250);
    }
  }

  // ==========================================================
  // ENTER KEY
  // ==========================================================

  function handleComposerKeyDown(event) {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();

      handleSend();
    }
  }

  // ==========================================================
  // BACK TO CONVERSATIONS - MOBILE
  // ==========================================================

  function handleBackToList() {
    setMobileChatOpen(false);

    navigate("/user/messages", {
      replace: true,
    });
  }

  // ==========================================================
  // PROFILE DATA FOR HEADER
  // ==========================================================

  const headerProfile = useMemo(() => {
    return (
      profile || {
        name: session?.name || session?.userName || "Candidate",
        email: session?.email || "",
      }
    );
  }, [profile, session]);

  // ==========================================================
  // AUTHENTICATION
  // ==========================================================

  if (!session) {
    return <Navigate to="/login" replace />;
  }

  if (session.role !== "User") {
    return (
      <Navigate
        to={`/${String(session.role || "").toLowerCase()}/dashboard`}
        replace
      />
    );
  }

  // ==========================================================
  // RENDER
  // ==========================================================

  return (
    <div className="candidate-message-page">
      <CandidateSidebar unread={unreadCount} />

      <div className="candidate-message-main">
        <CandidateHeader
          profile={headerProfile}
          title="Messages"
          subtitle="Communicate directly with companies about your applications."
          pageTitle="Messages"
          pageSubtitle="Manage your recruitment conversations."
        />

        <main className="candidate-message-content">
          {/* ====================================================
              PAGE HEADER
          ==================================================== */}

          <section className="candidate-message-heading">
            <div>
              <span className="candidate-message-eyebrow">
                Recruitment communication
              </span>

              <h1>Messages</h1>

              <p>
                Connect with companies about your applications and recruitment
                process.
              </p>
            </div>

            <div className="candidate-message-total">
              <MessageCircle size={18} />

              <span>{conversations.length}</span>

              <small>
                conversation
                {conversations.length === 1 ? "" : "s"}
              </small>
            </div>
          </section>

          {/* ====================================================
              MESSAGE WORKSPACE
          ==================================================== */}

          <section
            className={`candidate-message-workspace ${
              mobileChatOpen ? "mobile-chat-open" : ""
            }`}
          >
            {/* ==================================================
                CONVERSATION LIST
            ================================================== */}

            <aside className="candidate-conversation-panel">
              <div className="candidate-conversation-header">
                <div>
                  <h2>Conversations</h2>

                  <span>{conversations.length} total</span>
                </div>

                {unreadCount > 0 && (
                  <strong className="candidate-unread-total">
                    {unreadCount > 99 ? "99+" : unreadCount}
                  </strong>
                )}
              </div>

              {/* SEARCH */}

              <div className="candidate-message-search">
                <Search size={17} />

                <input
                  type="search"
                  placeholder="Search conversations..."
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  aria-label="Search conversations"
                />
              </div>

              {/* FILTERS */}

              <div className="candidate-message-filters">
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

              {/* LIST */}

              <div className="candidate-conversation-list">
                {loadingConversations ? (
                  <ConversationListLoading />
                ) : conversationError && !conversations.length ? (
                  <div className="candidate-message-list-state error">
                    <MessageCircle size={28} />

                    <strong>Unable to load messages</strong>

                    <p>{conversationError}</p>

                    <button
                      type="button"
                      onClick={() => {
                        loadConversations();
                        loadUnreadCount();
                      }}
                    >
                      Try again
                    </button>
                  </div>
                ) : filteredConversations.length === 0 ? (
                  <div className="candidate-message-list-state">
                    <MessageCircle size={30} />

                    <strong>
                      {conversations.length
                        ? "No conversations found"
                        : "No messages yet"}
                    </strong>

                    <p>
                      {conversations.length
                        ? "Try a different search or filter."
                        : "Companies can contact you regarding your applications."}
                    </p>
                  </div>
                ) : (
                  filteredConversations.map((conversation) => {
                    const companyName = getDisplayName(conversation);

                    const companyImage = getCompanyImage(conversation);

                    const jobTitle =
                      conversation?.jobTitle ||
                      conversation?.JobTitle ||
                      "Application";

                    const unread = Number(conversation?.unreadCount || 0) > 0;

                    const isActive =
                      String(conversation.conversationId) ===
                      String(selectedConversationId);

                    return (
                      <button
                        type="button"
                        key={conversation.conversationId}
                        className={`candidate-conversation-item ${
                          isActive ? "active" : ""
                        }`}
                        onClick={() =>
                          openConversation(conversation.conversationId)
                        }
                      >
                        <Avatar name={companyName} image={companyImage} />

                        <span className="candidate-conversation-copy">
                          <span className="candidate-conversation-top">
                            <strong>{companyName}</strong>

                            <time>
                              {formatConversationTime(
                                conversation.lastMessageAt,
                              )}
                            </time>
                          </span>

                          <small>{jobTitle}</small>

                          <span className="candidate-conversation-bottom">
                            <em>
                              {conversation.lastMessage || "No messages yet"}
                            </em>

                            {unread && (
                              <b>
                                {Number(conversation.unreadCount) > 99
                                  ? "99+"
                                  : conversation.unreadCount}
                              </b>
                            )}
                          </span>
                        </span>
                      </button>
                    );
                  })
                )}
              </div>
            </aside>

            {/* ==================================================
                CHAT PANEL
            ================================================== */}

            <section className="candidate-chat-panel">
              {!selectedConversationId ? (
                <EmptyChatState />
              ) : loadingMessages ? (
                <ChatLoadingState />
              ) : (
                <>
                  {/* CHAT HEADER */}

                  <header className="candidate-chat-header">
                    <button
                      type="button"
                      className="candidate-chat-back"
                      onClick={handleBackToList}
                      aria-label="Back to conversations"
                    >
                      <ArrowLeft size={19} />
                    </button>

                    <Avatar
                      name={getDisplayName(selectedConversation)}
                      image={getCompanyImage(selectedConversation)}
                    />

                    <div className="candidate-chat-identity">
                      <strong>{getDisplayName(selectedConversation)}</strong>

                      <span>
                        {selectedConversation?.jobTitle ||
                          "Recruitment conversation"}
                      </span>
                    </div>

                    <div className="candidate-chat-status">
                      <span>Application</span>

                      <strong>
                        {getApplicationStatus(selectedConversation)}
                      </strong>
                    </div>
                  </header>

                  {/* ERROR */}

                  {conversationError && (
                    <div className="candidate-chat-error">
                      {conversationError}
                    </div>
                  )}

                  {error && <div className="candidate-chat-error">{error}</div>}

                  {/* MESSAGES */}

                  <div
                    className="candidate-chat-messages"
                    ref={messagesContainerRef}
                    aria-live="polite"
                  >
                    {messages.length === 0 ? (
                      <div className="candidate-chat-empty">
                        <div>
                          <MessageCircle size={30} />
                        </div>

                        <strong>Start the conversation</strong>

                        <p>Send a message to communicate with the company.</p>
                      </div>
                    ) : (
                      <div className="candidate-message-thread">
                        {messages.map((message) => {
                          const mine = Boolean(message?.isMine);

                          return (
                            <div
                              key={message.id}
                              className={`candidate-message-row ${
                                mine ? "mine" : "theirs"
                              }`}
                            >
                              <div className="candidate-message-bubble">
                                <p>{message.content}</p>

                                <span>
                                  {formatMessageTime(
                                    message.sentAt || message.createdAt,
                                  )}

                                  {mine && <CheckCheck size={14} />}
                                </span>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>

                  {/* COMPOSER */}

                  <form
                    className="candidate-chat-composer"
                    onSubmit={handleSend}
                  >
                    <textarea
                      value={messageText}
                      onChange={(event) => setMessageText(event.target.value)}
                      onKeyDown={handleComposerKeyDown}
                      placeholder="Write a message..."
                      rows={1}
                      maxLength={4000}
                      disabled={sending}
                      aria-label="Write a message"
                    />

                    <button
                      type="submit"
                      disabled={!messageText.trim() || sending}
                      aria-label="Send message"
                    >
                      {sending ? (
                        <span className="candidate-send-spinner" />
                      ) : (
                        <Send size={18} />
                      )}

                      <span>{sending ? "Sending" : "Send"}</span>
                    </button>
                  </form>

                  <div className="candidate-chat-composer-hint">
                    Press Enter to send · Shift + Enter for a new line
                  </div>
                </>
              )}
            </section>
          </section>
        </main>
      </div>
    </div>
  );
}

// ============================================================
// AVATAR
// ============================================================

function Avatar({ name, image }) {
  const firstLetter =
    String(name || "C")
      .trim()
      .charAt(0)
      .toUpperCase() || "C";

  if (image) {
    return (
      <div className="candidate-message-avatar">
        <img
          src={image}
          alt={`${name || "Company"} profile`}
          onError={(event) => {
            event.currentTarget.style.display = "none";
          }}
        />

        <span>{firstLetter}</span>
      </div>
    );
  }

  return (
    <div className="candidate-message-avatar candidate-message-avatar-fallback">
      {firstLetter}
    </div>
  );
}

// ============================================================
// EMPTY CHAT
// ============================================================

function EmptyChatState() {
  return (
    <div className="candidate-chat-state">
      <div className="candidate-chat-state-icon">
        <MessageCircle size={32} />
      </div>

      <h2>Select a conversation</h2>

      <p>Choose a company conversation from the left to view your messages.</p>
    </div>
  );
}

// ============================================================
// CHAT LOADING
// ============================================================

function ChatLoadingState() {
  return (
    <div className="candidate-chat-loading">
      <div className="candidate-chat-loading-header">
        <span />
        <div>
          <i />
          <b />
        </div>
      </div>

      <div className="candidate-chat-loading-messages">
        <span className="left" />
        <span className="right" />
        <span className="left short" />
        <span className="right medium" />
      </div>

      <div className="candidate-chat-loading-composer" />
    </div>
  );
}

// ============================================================
// CONVERSATION LIST LOADING
// ============================================================

function ConversationListLoading() {
  return (
    <div className="candidate-conversation-loading">
      {[1, 2, 3, 4].map((item) => (
        <div key={item} className="candidate-conversation-skeleton">
          <span />

          <div>
            <i />
            <b />
            <em />
          </div>
        </div>
      ))}
    </div>
  );
}
