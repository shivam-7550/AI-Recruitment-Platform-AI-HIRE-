import { useEffect, useMemo, useState } from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";
import {
  Bell,
  Bookmark,
  BriefcaseBusiness,
  CheckCircle2,
  FileText,
  Grid2X2,
  LogOut,
  MailOpen,
  MessageSquare,
  Search,
  Settings,
  UserRound,
  Upload,
} from "lucide-react";

import { candidateApi, notificationApi } from "../../services/api";
import CandidateHeader from "../../components/CandidateHeader";
import "../../styles/CandidatesCSS/CandidateMessage.css";
import CandidateSidebar from "../../components/CandidateSidebar";

export default function CandidateMessages() {
  const navigate = useNavigate();

  const session = JSON.parse(sessionStorage.getItem("user") || "null");

  const [profile, setProfile] = useState({});
  const [items, setItems] = useState([]);
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState("All");
  const [error, setError] = useState("");

  useEffect(() => {
    if (session?.role !== "User") return;

    Promise.allSettled([candidateApi.profile(), notificationApi.mine()]).then(
      ([profileResult, notificationResult]) => {
        if (profileResult.status === "fulfilled") {
          setProfile(profileResult.value);
        }

        if (notificationResult.status === "fulfilled") {
          setItems(notificationResult.value || []);
        } else {
          setError(
            notificationResult.reason?.message ||
              "Messages and updates could not be loaded.",
          );
        }
      },
    );
  }, [session?.role]);

  const unreadCount = useMemo(
    () => items.filter((item) => !item.isRead).length,
    [items],
  );

  const filteredItems = useMemo(() => {
    const searchText = query.trim().toLowerCase();

    return items.filter((item) => {
      const matchesSearch =
        !searchText ||
        `${item.title || ""} ${item.message || ""}`
          .toLowerCase()
          .includes(searchText);

      const matchesFilter =
        filter === "All" ||
        (filter === "Unread" && !item.isRead) ||
        (filter === "Read" && item.isRead);

      return matchesSearch && matchesFilter;
    });
  }, [items, query, filter]);

  if (!session) {
    return <Navigate to="/login" replace />;
  }

  if (session.role !== "User") {
    return <Navigate to={`/${session.role.toLowerCase()}/dashboard`} replace />;
  }

  async function openMessage(item) {
    try {
      if (!item.isRead) {
        await notificationApi.read(item.id);

        setItems((current) =>
          current.map((notification) =>
            notification.id === item.id
              ? {
                  ...notification,
                  isRead: true,
                }
              : notification,
          ),
        );
      }

      if (item.jobId) {
        navigate("/user/browse-jobs");
      }
    } catch (error) {
      setError(error.message || "Unable to open this update.");
    }
  }

  async function markAllAsRead() {
    const unreadItems = items.filter((item) => !item.isRead);

    if (!unreadItems.length) return;

    try {
      await Promise.allSettled(
        unreadItems.map((item) => notificationApi.read(item.id)),
      );

      setItems((current) =>
        current.map((item) => ({
          ...item,
          isRead: true,
        })),
      );
    } catch (error) {
      setError(error.message || "Unable to mark messages as read.");
    }
  }

  function logout() {
    fetch("/api/Auth/logout", {
      method: "POST",
    }).catch(() => {});

    sessionStorage.removeItem("user");
    sessionStorage.removeItem("accessToken");
    sessionStorage.removeItem("refreshToken");

    navigate("/login", {
      replace: true,
    });
  }

  return (
    <div className="candidate-messages-page">
      <CandidateUtilityShell
        active="messages"
        title="Messages"
        subtitle="Stay updated with your recruitment activity."
        profile={profile}
        unread={unreadCount}
        logout={logout}
      >
        {/* =====================================================
            PAGE HEADER
            ===================================================== */}
        <section className="candidate-messages-header">
          <div>
            <span className="candidate-messages-eyebrow">Candidate inbox</span>

            <h2>Messages & Updates</h2>

            <p>
              Important updates about your applications, jobs and recruitment
              activity.
            </p>
          </div>

          {unreadCount > 0 && (
            <button
              type="button"
              className="candidate-messages-mark-read"
              onClick={markAllAsRead}
            >
              <CheckCircle2 />
              Mark all as read
            </button>
          )}
        </section>

        {/* =====================================================
            MESSAGE TOOLBAR
            ===================================================== */}
        <section className="candidate-messages-toolbar">
          <label className="candidate-messages-search">
            <Search />

            <input
              type="text"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search messages or updates"
            />
          </label>

          <div className="candidate-messages-filters">
            <button
              type="button"
              className={filter === "All" ? "active" : ""}
              onClick={() => setFilter("All")}
            >
              All
            </button>

            <button
              type="button"
              className={filter === "Unread" ? "active" : ""}
              onClick={() => setFilter("Unread")}
            >
              Unread
              {unreadCount > 0 && <span>{unreadCount}</span>}
            </button>

            <button
              type="button"
              className={filter === "Read" ? "active" : ""}
              onClick={() => setFilter("Read")}
            >
              Read
            </button>
          </div>
        </section>

        {/* =====================================================
            ERROR
            ===================================================== */}
        {error && (
          <div className="candidate-messages-error">
            <strong>Unable to load updates</strong>
            <span>{error}</span>
          </div>
        )}

        {/* =====================================================
            SUMMARY
            ===================================================== */}
        <section className="candidate-messages-summary">
          <div>
            <MessageSquare />
            <span>
              <strong>{items.length}</strong>
              Total updates
            </span>
          </div>

          <div>
            <MailOpen />
            <span>
              <strong>{unreadCount}</strong>
              Unread
            </span>
          </div>

          <div>
            <CheckCircle2 />
            <span>
              <strong>{items.length - unreadCount}</strong>
              Read
            </span>
          </div>
        </section>

        {/* =====================================================
            MESSAGE LIST
            ===================================================== */}
        <section className="candidate-messages-panel">
          <div className="candidate-messages-panel-header">
            <div>
              <span>Inbox</span>
              <h3>Recent activity</h3>
            </div>

            <small>
              {filteredItems.length}{" "}
              {filteredItems.length === 1 ? "update" : "updates"}
            </small>
          </div>

          <div className="candidate-messages-list">
            {filteredItems.map((item) => (
              <button
                type="button"
                key={item.id}
                className={`candidate-message-item ${
                  item.isRead
                    ? "candidate-message-item-read"
                    : "candidate-message-item-unread"
                }`}
                onClick={() => openMessage(item)}
              >
                <div className="candidate-message-item-icon">
                  <MessageSquare />
                </div>

                <div className="candidate-message-item-content">
                  <div className="candidate-message-item-top">
                    <strong>{item.title || "Recruitment Update"}</strong>

                    {!item.isRead && (
                      <span className="candidate-message-new">New</span>
                    )}
                  </div>

                  <p>{item.message}</p>

                  <div className="candidate-message-item-meta">
                    <span>
                      {item.createdAt
                        ? new Date(item.createdAt).toLocaleString("en-IN", {
                            day: "2-digit",
                            month: "short",
                            year: "numeric",
                            hour: "2-digit",
                            minute: "2-digit",
                          })
                        : "Recently"}
                    </span>

                    {item.jobId && (
                      <span className="candidate-message-job">Job related</span>
                    )}
                  </div>
                </div>

                <div className="candidate-message-item-arrow">→</div>
              </button>
            ))}

            {!filteredItems.length && (
              <div className="candidate-messages-empty">
                <div className="candidate-messages-empty-icon">
                  <MailOpen />
                </div>

                <h3>
                  {items.length ? "No matching updates" : "No messages yet"}
                </h3>

                <p>
                  {items.length
                    ? "Try changing your search or filter."
                    : "Application and recruitment updates will appear here."}
                </p>

                {!items.length && (
                  <Link to="/user/browse-jobs">Browse Jobs</Link>
                )}
              </div>
            )}
          </div>
        </section>

        {/* =====================================================
            FUTURE CHAT INFORMATION
            ===================================================== */}
        <section className="candidate-messages-chat-info">
          <div className="candidate-messages-chat-icon">
            <MessageSquare />
          </div>

          <div>
            <span>Coming soon</span>

            <h3>Direct company messaging</h3>

            <p>
              Candidate-to-company chat will be available once conversation and
              messaging APIs are implemented. For now, this inbox displays
              verified recruitment notifications and application updates.
            </p>
          </div>
        </section>
      </CandidateUtilityShell>
    </div>
  );
}

/* =============================================================
   CANDIDATE UTILITY SHELL
   ============================================================= */

export function CandidateUtilityShell({
  active,
  title,
  subtitle,
  profile,
  unread,
  logout,
  children,
}) {
  return (
    <div className="candidate-utility">
      {/* =====================================================
          SIDEBAR
          ===================================================== */}
      {/* <aside className="candidate-utility-sidebar">
        <Link className="candidate-utility-logo" to="/user/dashboard">
          <strong>HireLine</strong>
          <small>Find Your Dream Job</small>
        </Link>

        <nav className="candidate-utility-navigation">
          <Link
            className={
              active === "dashboard"
                ? "candidate-utility-navigation-active"
                : ""
            }
            to="/user/dashboard"
          >
            <Grid2X2 />
            <span>Dashboard</span>
          </Link>

          <Link
            className={
              active === "browse" ? "candidate-utility-navigation-active" : ""
            }
            to="/user/browse-jobs"
          >
            <BriefcaseBusiness />
            <span>Browse Jobs</span>
          </Link>

          <Link
            className={
              active === "applications"
                ? "candidate-utility-navigation-active"
                : ""
            }
            to="/user/applications"
          >
            <FileText />
            <span>My Applications</span>
          </Link>

          <Link
            className={
              active === "resume" ? "candidate-utility-navigation-active" : ""
            }
            to="/user/resume"
          >
            <Upload />
            <span>Resume</span>
          </Link>

          <Link
            className={
              active === "saved" ? "candidate-utility-navigation-active" : ""
            }
            to="/user/saved-jobs"
          >
            <Bookmark />
            <span>Saved Jobs</span>
          </Link>

          <Link
            className={
              active === "messages" ? "candidate-utility-navigation-active" : ""
            }
            to="/user/messages"
          >
            <MessageSquare />
            <span>Messages</span>

            {unread > 0 && (
              <small className="candidate-utility-navigation-badge">
                {unread > 9 ? "9+" : unread}
              </small>
            )}
          </Link>

          <Link
            className={
              active === "profile" ? "candidate-utility-navigation-active" : ""
            }
            to="/user/profile"
          >
            <UserRound />
            <span>Profile</span>
          </Link>

          <Link
            className={
              active === "settings" ? "candidate-utility-navigation-active" : ""
            }
            to="/user/settings"
          >
            <Settings />
            <span>Settings</span>
          </Link>
        </nav>

        <button
          type="button"
          className="candidate-utility-logout"
          onClick={logout}
        >
          <LogOut />
          <span>Logout</span>
        </button>
      </aside> */}

      <CandidateSidebar />

      {/* =====================================================
          MAIN
          ===================================================== */}
      <main className="candidate-utility-main">
        <CandidateHeader title={title} subtitle={subtitle} />

        <section className="candidate-utility-content">{children}</section>
      </main>
    </div>
  );
}
