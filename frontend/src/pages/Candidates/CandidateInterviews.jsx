import { useEffect, useMemo, useState } from "react";
import { Navigate } from "react-router-dom";
import {
  CalendarDays,
  Clock3,
  Video,
  MapPin,
  UserRound,
  BriefcaseBusiness,
  RefreshCw,
  ExternalLink,
  FileText,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";

import CandidateSidebar from "../../components/Candidate/CandidateSidebar";
import CandidateHeader from "../../components/Candidate/CandidateHeader";

import { interviewApi } from "../../services/api.js";

import "../../styles/CandidatesCSS/CandidateInterviews.css";

export default function CandidateInterviews() {
  const session = JSON.parse(sessionStorage.getItem("user") || "null");

  // =========================================================
  // USER ID
  // =========================================================

  const userId = session?.userId || session?.id || tokenUserId(session?.token);

  const [interviews, setInterviews] = useState([]);

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const [error, setError] = useState("");

  // =========================================================
  // LOAD INTERVIEWS
  // =========================================================

  useEffect(() => {
    if (!userId) {
      setLoading(false);
      setError("Unable to identify the logged-in candidate.");
      return;
    }

    loadInterviews();
  }, [userId]);

  async function loadInterviews() {
    try {
      setError("");

      /*
       * IMPORTANT
       *
       * api.js me candidate interview endpoint:
       *
       * interviewApi.candidate()
       *
       * hai.
       *
       * UserId manually bhejne ki zarurat nahi hai because
       * backend JWT se logged-in user identify karega.
       */

      const result = await interviewApi.candidate();

      const data = Array.isArray(result)
        ? result
        : Array.isArray(result?.data)
          ? result.data
          : [];

      setInterviews(data);
    } catch (err) {
      console.error("Candidate interviews loading error:", err);

      setError(err?.message || "Unable to load your scheduled interviews.");
    } finally {
      setLoading(false);
    }
  }

  // =========================================================
  // REFRESH
  // =========================================================

  async function handleRefresh() {
    setRefreshing(true);
    setError("");

    try {
      await loadInterviews();
    } finally {
      setRefreshing(false);
    }
  }

  // =========================================================
  // SORT
  // =========================================================

  const sortedInterviews = useMemo(() => {
    return [...interviews].sort(
      (a, b) => new Date(a.scheduledAt || 0) - new Date(b.scheduledAt || 0),
    );
  }, [interviews]);

  // =========================================================
  // UPCOMING
  // =========================================================

  const upcomingInterviews = useMemo(() => {
    const now = new Date();

    return sortedInterviews.filter((interview) => {
      const date = new Date(interview.scheduledAt);

      return (
        !Number.isNaN(date.getTime()) &&
        date >= now &&
        !isCancelled(interview.status)
      );
    });
  }, [sortedInterviews]);

  // =========================================================
  // PAST
  // =========================================================

  const pastInterviews = useMemo(() => {
    const now = new Date();

    return sortedInterviews
      .filter((interview) => {
        const date = new Date(interview.scheduledAt);

        return (
          !Number.isNaN(date.getTime()) &&
          (date < now || isCancelled(interview.status))
        );
      })
      .sort(
        (a, b) => new Date(b.scheduledAt || 0) - new Date(a.scheduledAt || 0),
      );
  }, [sortedInterviews]);

  // =========================================================
  // AUTH
  // =========================================================

  if (!session) {
    return <Navigate to="/login" replace />;
  }

  /*
   * IMPORTANT
   *
   * App.jsx candidate RoleGuard is:
   *
   * <RoleGuard role="User" />
   *
   * Therefore candidate session role can be "User".
   *
   * We allow both "User" and "Candidate".
   */

  const normalizedRole = String(session.role || "").toLowerCase();

  const isCandidate =
    normalizedRole === "user" || normalizedRole === "candidate";

  if (!isCandidate) {
    return <Navigate to={`/${normalizedRole}/dashboard`} replace />;
  }

  // =========================================================
  // LOADING
  // =========================================================

  if (loading) {
    return (
      <div className="candidate-interviews-loading">
        <div className="candidate-interviews-spinner" />
        <span>Loading interviews...</span>
      </div>
    );
  }

  // =========================================================
  // UI
  // =========================================================

  return (
    <div className="candidate-interviews-page">
      {/* ========================================
          SIDEBAR
      ======================================== */}

      <CandidateSidebar />

      {/* ========================================
          MAIN
      ======================================== */}

      <div className="candidate-interviews-main">
        {/* ========================================
            HEADER
        ======================================== */}

        <CandidateHeader
          title="Interviews"
          subtitle="View and manage your scheduled interviews."
        />

        {/* ========================================
            CONTENT
        ======================================== */}

        <main className="candidate-interviews-content">
          {/* ====================================
              PAGE HEADER
          ==================================== */}

          <div className="candidate-interviews-page-header">
            <div>
              <span className="candidate-interviews-eyebrow">
                INTERVIEW SCHEDULE
              </span>

              <h1>Your Interviews</h1>

              <p>
                Keep track of upcoming interviews and review your previous
                interview schedules.
              </p>
            </div>

            <button
              type="button"
              className="candidate-interviews-refresh-btn"
              onClick={handleRefresh}
              disabled={refreshing}
            >
              <RefreshCw
                className={
                  refreshing ? "candidate-interviews-refresh-icon" : ""
                }
              />

              {refreshing ? "Refreshing..." : "Refresh"}
            </button>
          </div>

          {/* ====================================
              ERROR
          ==================================== */}

          {error && (
            <div className="candidate-interviews-error">
              <AlertCircle />
              <span>{error}</span>
            </div>
          )}

          {/* ====================================
              STATS
          ==================================== */}

          <section className="candidate-interviews-stats">
            <article className="candidate-interviews-stat-card">
              <div className="candidate-interviews-stat-icon">
                <CalendarDays />
              </div>

              <div>
                <span>Upcoming</span>
                <strong>{upcomingInterviews.length}</strong>
              </div>
            </article>

            <article className="candidate-interviews-stat-card">
              <div className="candidate-interviews-stat-icon">
                <Clock3 />
              </div>

              <div>
                <span>Completed</span>
                <strong>
                  {
                    pastInterviews.filter(
                      (item) => getStatusClass(item.status) === "completed",
                    ).length
                  }
                </strong>
              </div>
            </article>

            <article className="candidate-interviews-stat-card">
              <div className="candidate-interviews-stat-icon">
                <Video />
              </div>

              <div>
                <span>Online</span>

                <strong>
                  {
                    interviews.filter(
                      (item) =>
                        String(item.interviewType || "").toLowerCase() ===
                        "online",
                    ).length
                  }
                </strong>
              </div>
            </article>

            <article className="candidate-interviews-stat-card">
              <div className="candidate-interviews-stat-icon">
                <BriefcaseBusiness />
              </div>

              <div>
                <span>Total Interviews</span>
                <strong>{interviews.length}</strong>
              </div>
            </article>
          </section>

          {/* ====================================
              UPCOMING
          ==================================== */}

          <section className="candidate-interviews-section">
            <div className="candidate-interviews-section-heading">
              <div>
                <span>UPCOMING</span>
                <h2>Upcoming Interviews</h2>
              </div>

              <span className="candidate-interviews-count">
                {upcomingInterviews.length}
              </span>
            </div>

            {upcomingInterviews.length > 0 ? (
              <div className="candidate-interviews-list">
                {upcomingInterviews.map((interview) => (
                  <InterviewCard
                    key={interview.id}
                    interview={interview}
                    upcoming
                  />
                ))}
              </div>
            ) : (
              <EmptyState
                title="No upcoming interviews"
                description="When a company schedules an interview for you, it will appear here."
              />
            )}
          </section>

          {/* ====================================
              PAST
          ==================================== */}

          <section className="candidate-interviews-section candidate-interviews-past-section">
            <div className="candidate-interviews-section-heading">
              <div>
                <span>HISTORY</span>
                <h2>Previous Interviews</h2>
              </div>

              <span className="candidate-interviews-count">
                {pastInterviews.length}
              </span>
            </div>

            {pastInterviews.length > 0 ? (
              <div className="candidate-interviews-list">
                {pastInterviews.map((interview) => (
                  <InterviewCard key={interview.id} interview={interview} />
                ))}
              </div>
            ) : (
              <EmptyState
                title="No interview history"
                description="Your completed interview schedules will appear here."
              />
            )}
          </section>
        </main>
      </div>
    </div>
  );
}

// =========================================================
// INTERVIEW CARD
// =========================================================

function InterviewCard({ interview, upcoming = false }) {
  const interviewType = String(
    interview.interviewType || "Online",
  ).toLowerCase();

  const isOnline = interviewType === "online";

  const duration = Number(interview.durationMinutes || 30);

  const status = interview.status || (upcoming ? "Scheduled" : "Completed");

  return (
    <article
      className={`candidate-interview-card ${
        upcoming ? "candidate-interview-card-upcoming" : ""
      }`}
    >
      {/* ====================================
          CARD HEADER
      ==================================== */}

      <div className="candidate-interview-card-header">
        <div className="candidate-interview-card-title">
          <div className="candidate-interview-icon">
            {isOnline ? <Video /> : <MapPin />}
          </div>

          <div>
            <span className="candidate-interview-round">
              {interview.round || "Interview"}
            </span>

            <h3>
              {interview.jobTitle || interview.position || "Job Interview"}
            </h3>
          </div>
        </div>

        <span
          className={`candidate-interview-status ${getStatusClass(status)}`}
        >
          {status}
        </span>
      </div>

      {/* ====================================
          DATE + TIME
      ==================================== */}

      <div className="candidate-interview-schedule">
        <div className="candidate-interview-schedule-item">
          <CalendarDays />

          <div>
            <span>Date</span>
            <strong>{formatDate(interview.scheduledAt)}</strong>
          </div>
        </div>

        <div className="candidate-interview-schedule-item">
          <Clock3 />

          <div>
            <span>Time</span>
            <strong>{formatTime(interview.scheduledAt)}</strong>
          </div>
        </div>

        <div className="candidate-interview-schedule-item">
          <Clock3 />

          <div>
            <span>Duration</span>
            <strong>{duration} minutes</strong>
          </div>
        </div>
      </div>

      {/* ====================================
          INTERVIEW TYPE
      ==================================== */}

      <div className="candidate-interview-details">
        <div className="candidate-interview-detail">
          <span>Interview Type</span>

          <strong>
            {isOnline ? (
              <>
                <Video />
                Online
              </>
            ) : (
              <>
                <MapPin />
                {interview.interviewType || "In Person"}
              </>
            )}
          </strong>
        </div>

        {interview.companyName && (
          <div className="candidate-interview-detail">
            <span>Company</span>

            <strong>
              <BriefcaseBusiness />
              {interview.companyName}
            </strong>
          </div>
        )}

        {interview.interviewerName && (
          <div className="candidate-interview-detail">
            <span>Interviewer</span>

            <strong>
              <UserRound />
              {interview.interviewerName}
            </strong>
          </div>
        )}
      </div>

      {/* ====================================
          LOCATION / MEETING
      ==================================== */}

      {isOnline && interview.meetingLink ? (
        <div className="candidate-interview-location candidate-interview-online">
          <div>
            <Video />

            <div>
              <span>Online Meeting</span>
              <strong>Meeting link available</strong>
            </div>
          </div>

          {upcoming && (
            <a
              href={interview.meetingLink}
              target="_blank"
              rel="noreferrer"
              className="candidate-interview-join-btn"
            >
              Join Interview
              <ExternalLink />
            </a>
          )}
        </div>
      ) : (
        interview.location && (
          <div className="candidate-interview-location">
            <MapPin />

            <div>
              <span>Location</span>
              <strong>{interview.location}</strong>
            </div>
          </div>
        )
      )}

      {/* ====================================
          INSTRUCTIONS
      ==================================== */}

      {interview.instructions && (
        <div className="candidate-interview-instructions">
          <div className="candidate-interview-instructions-icon">
            <FileText />
          </div>

          <div>
            <span>Instructions</span>
            <p>{interview.instructions}</p>
          </div>
        </div>
      )}

      {/* ====================================
          FOOTER
      ==================================== */}

      <div className="candidate-interview-card-footer">
        <span>
          {upcoming
            ? "Please be available before the scheduled time."
            : "Interview schedule completed."}
        </span>

        {upcoming && (
          <span className="candidate-interview-ready">
            <CheckCircle2 />
            Scheduled
          </span>
        )}
      </div>
    </article>
  );
}

// =========================================================
// EMPTY STATE
// =========================================================

function EmptyState({ title, description }) {
  return (
    <div className="candidate-interviews-empty">
      <div className="candidate-interviews-empty-icon">
        <CalendarDays />
      </div>

      <h3>{title}</h3>

      <p>{description}</p>
    </div>
  );
}

// =========================================================
// STATUS CLASS
// =========================================================

function getStatusClass(status) {
  const normalized = String(status || "Scheduled").toLowerCase();

  if (normalized.includes("cancel") || normalized.includes("reject")) {
    return "cancelled";
  }

  if (normalized.includes("complete") || normalized.includes("conduct")) {
    return "completed";
  }

  if (normalized.includes("reschedule")) {
    return "rescheduled";
  }

  return "scheduled";
}

// =========================================================
// CANCELLED
// =========================================================

function isCancelled(status) {
  const normalized = String(status || "").toLowerCase();

  return normalized.includes("cancel") || normalized.includes("reject");
}

// =========================================================
// DATE FORMAT
// =========================================================

function formatDate(value) {
  if (!value) {
    return "-";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "-";
  }

  return date.toLocaleDateString("en-IN", {
    weekday: "short",
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

// =========================================================
// TIME FORMAT
// =========================================================

function formatTime(value) {
  if (!value) {
    return "-";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "-";
  }

  return date.toLocaleTimeString("en-IN", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

// =========================================================
// TOKEN USER ID
// =========================================================

function tokenUserId(token) {
  try {
    if (!token) {
      return null;
    }

    const tokenParts = token.split(".");

    if (tokenParts.length < 2) {
      return null;
    }

    const payload = tokenParts[1].replace(/-/g, "+").replace(/_/g, "/");

    const paddedPayload = payload + "=".repeat((4 - (payload.length % 4)) % 4);

    const data = JSON.parse(atob(paddedPayload));

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
