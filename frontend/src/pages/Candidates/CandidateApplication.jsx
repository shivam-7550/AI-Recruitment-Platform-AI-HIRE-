import { useEffect, useMemo, useState } from "react";
import { Link, Navigate } from "react-router-dom";
import {
  Bell,
  BriefcaseBusiness,
  CalendarDays,
  CheckCircle2,
  FileText,
  Search,
  TrendingUp,
} from "lucide-react";

import { candidateApi, notificationApi } from "../../services/api";
import CandidateSidebar from "../../components/CandidateSidebar";
import CandidateHeader from "../../components/CandidateHeader";

import "../../styles/CandidatesCSS/CandidateApplications.css";

export default function CandidateApplication() {
  const session = JSON.parse(sessionStorage.getItem("user") || "null");

  const [profile, setProfile] = useState({});
  const [applications, setApplications] = useState([]);
  const [notifications, setNotifications] = useState([]);

  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("All statuses");

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // =========================================================
  // LOAD DATA
  // =========================================================

  useEffect(() => {
    if (session?.role !== "User") return;

    let mounted = true;

    async function loadData() {
      setLoading(true);
      setError("");

      const [applicationsResult, profileResult, notificationsResult] =
        await Promise.allSettled([
          candidateApi.applications(),
          candidateApi.profile(),
          notificationApi.mine(),
        ]);

      if (!mounted) return;

      // Applications
      if (applicationsResult.status === "fulfilled") {
        setApplications(
          Array.isArray(applicationsResult.value)
            ? applicationsResult.value
            : [],
        );
      } else {
        setApplications([]);
        setError(
          applicationsResult.reason?.message ||
            "Applications could not be loaded.",
        );
      }

      // Profile
      if (profileResult.status === "fulfilled") {
        setProfile(profileResult.value || {});
      }

      // Notifications
      if (notificationsResult.status === "fulfilled") {
        setNotifications(
          Array.isArray(notificationsResult.value)
            ? notificationsResult.value
            : [],
        );
      }

      setLoading(false);
    }

    loadData();

    return () => {
      mounted = false;
    };
  }, [session?.role]);

  // =========================================================
  // STATUS FILTER
  // =========================================================

  const statuses = useMemo(() => {
    const uniqueStatuses = [
      ...new Set(applications.map((item) => item?.status).filter(Boolean)),
    ];

    return ["All statuses", ...uniqueStatuses];
  }, [applications]);

  // =========================================================
  // FILTER APPLICATIONS
  // =========================================================

  const visibleApplications = useMemo(() => {
    const searchText = query.trim().toLowerCase();

    return applications.filter((item) => {
      const jobTitle = item?.jobTitle || "";
      const companyName = item?.companyName || "";

      const searchableText = `${jobTitle} ${companyName}`.toLowerCase();

      const matchesSearch = !searchText || searchableText.includes(searchText);

      const matchesStatus =
        status === "All statuses" || item?.status === status;

      return matchesSearch && matchesStatus;
    });
  }, [applications, query, status]);

  // =========================================================
  // STATISTICS
  // =========================================================

  const interviewCount = applications.filter((item) =>
    String(item?.status || "")
      .toLowerCase()
      .includes("interview"),
  ).length;

  const shortlistedCount = applications.filter((item) =>
    String(item?.status || "")
      .toLowerCase()
      .includes("shortlist"),
  ).length;

  const validScores = applications
    .map((item) => Number(item?.atsScore))
    .filter((score) => Number.isFinite(score));

  const averageScore =
    validScores.length > 0
      ? Math.round(
          validScores.reduce((sum, score) => sum + score, 0) /
            validScores.length,
        )
      : 0;

  const unreadCount = notifications.filter((item) => !item?.isRead).length;

  // =========================================================
  // AUTH
  // =========================================================

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

  // =========================================================
  // RENDER
  // =========================================================

  return (
    <div className="candidate-applications-page">
      {/* =====================================================
          SIDEBAR
          ===================================================== */}

      <CandidateSidebar />

      {/* =====================================================
          MAIN CONTENT
          ===================================================== */}

      <main className="candidate-applications-main">
        <CandidateHeader
          title="My Applications"
          subtitle="Track every opportunity you have applied for."
        />
        {/* ===================================================
            TOP BAR
            =================================================== */}

        {/* <header className="candidate-applications-topbar"> */}
        {/* <div className="candidate-applications-topbar-title">
            <h1>My Applications</h1>

            <p>Track every opportunity you have applied for.</p>
          </div> */}

        {/* <div className="candidate-applications-topbar-actions"> */}
        {/* Notifications */}

        {/* <button
              type="button"
              className="candidate-applications-notification-button"
              aria-label="Notifications"
            >
              <Bell />

              {unreadCount > 0 && (
                <span className="candidate-applications-notification-badge">
                  {unreadCount > 9 ? "9+" : unreadCount}
                </span>
              )}
            </button> */}

        {/* User */}

        {/* <div className="candidate-applications-user"> */}
        {/* <div className="candidate-applications-user-avatar">
                {profile?.photoUrl ? (
                  <img src={profile.photoUrl} alt="Candidate profile" />
                ) : (
                  <span>
                    {(profile?.name || session?.name || "U")
                      .slice(0, 1)
                      .toUpperCase()}
                  </span>
                )}
              </div> */}

        {/* <div className="candidate-applications-user-info">
                <strong>{profile?.name || session?.name || "Candidate"}</strong>

                <small>Candidate</small>
              </div> */}
        {/* </div> */}
        {/* </div> */}
        {/* </header> */}

        {/* ===================================================
            PAGE CONTENT
            =================================================== */}

        <section className="candidate-applications-content">
          {/* Page heading */}

          <div className="candidate-applications-heading">
            <div>
              <span>Application centre</span>

              <h2>Your career pipeline</h2>

              <p>
                All applications shown here belong only to your authenticated
                account.
              </p>
            </div>

            <Link
              to="/user/explore-jobs"
              className="candidate-applications-browse-link"
            >
              Browse more jobs
            </Link>
          </div>

          {/* =================================================
              METRICS
              ================================================= */}

          <section className="candidate-applications-metrics">
            <ApplicationMetric
              icon={BriefcaseBusiness}
              label="Total Applied"
              value={applications.length}
            />

            <ApplicationMetric
              icon={TrendingUp}
              label="Average ATS"
              value={`${averageScore}%`}
            />

            <ApplicationMetric
              icon={CheckCircle2}
              label="Shortlisted"
              value={shortlistedCount}
            />

            <ApplicationMetric
              icon={CalendarDays}
              label="Interviews"
              value={interviewCount}
            />
          </section>

          {/* =================================================
              APPLICATION PANEL
              ================================================= */}

          <section className="candidate-applications-panel">
            {/* Filter bar */}

            <div className="candidate-applications-filterbar">
              <label className="candidate-applications-search">
                <Search />

                <input
                  type="text"
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder="Search company or job title"
                />
              </label>

              <select
                className="candidate-applications-status-filter"
                value={status}
                onChange={(event) => setStatus(event.target.value)}
              >
                {statuses.map((item) => (
                  <option key={item} value={item}>
                    {item}
                  </option>
                ))}
              </select>

              <span className="candidate-applications-count">
                {visibleApplications.length}{" "}
                {visibleApplications.length === 1
                  ? "application"
                  : "applications"}
              </span>
            </div>

            {/* Error */}

            {error && (
              <div className="candidate-applications-error">{error}</div>
            )}

            {/* =================================================
                TABLE HEADER
                ================================================= */}

            {!loading && visibleApplications.length > 0 && (
              <div className="candidate-applications-table-head">
                <span>Company & Role</span>

                <span>Applied On</span>

                <span>ATS Match</span>

                <span>Status</span>

                <span>Progress</span>
              </div>
            )}

            {/* =================================================
                APPLICATION LIST
                ================================================= */}

            <div className="candidate-applications-list">
              {/* Loading */}

              {loading && (
                <div className="candidate-applications-loading">
                  <div className="candidate-applications-spinner" />
                  <p>Loading your applications...</p>
                </div>
              )}

              {/* Applications */}

              {!loading &&
                visibleApplications.map((item) => {
                  const score = normalizeScore(item?.atsScore);

                  const progress = statusProgress(item?.status);

                  return (
                    <article
                      key={item.id}
                      className="candidate-applications-item"
                    >
                      {/* Company & Role */}

                      <div className="candidate-applications-role">
                        <div className="candidate-applications-company-icon">
                          {(item?.companyName || "C").slice(0, 1).toUpperCase()}
                        </div>

                        <div className="candidate-applications-role-info">
                          <strong>{item?.jobTitle || "Job position"}</strong>

                          <small>{item?.companyName || "Company"}</small>
                        </div>
                      </div>

                      {/* Applied date */}

                      <time className="candidate-applications-date">
                        {item?.appliedAt
                          ? new Date(item.appliedAt).toLocaleDateString(
                              "en-IN",
                              {
                                day: "2-digit",
                                month: "short",
                                year: "numeric",
                              },
                            )
                          : "—"}
                      </time>

                      {/* ATS score */}

                      <div className="candidate-applications-score">
                        <strong>{score}%</strong>

                        <div className="candidate-applications-score-bar">
                          <span
                            style={{
                              width: `${score}%`,
                            }}
                          />
                        </div>
                      </div>

                      {/* Status */}

                      <span
                        className={`candidate-applications-status ${statusClass(
                          item?.status,
                        )}`}
                      >
                        {item?.status || "Applied"}
                      </span>

                      {/* Progress */}

                      <div className="candidate-applications-progress">
                        <span className="candidate-applications-progress-step done">
                          Applied
                        </span>

                        <i className={progress >= 2 ? "active" : ""} />

                        <span className={progress >= 2 ? "done" : ""}>
                          Review
                        </span>

                        <i className={progress >= 3 ? "active" : ""} />

                        <span className={progress >= 3 ? "done" : ""}>
                          Decision
                        </span>
                      </div>
                    </article>
                  );
                })}

              {/* Empty */}

              {!loading && !error && visibleApplications.length === 0 && (
                <div className="candidate-applications-empty">
                  <FileText />

                  <h3>
                    {applications.length > 0
                      ? "No matching applications"
                      : "No applications yet"}
                  </h3>

                  <p>
                    {applications.length > 0
                      ? "Try a different company, job title or status."
                      : "Browse company jobs and submit your first application."}
                  </p>

                  <Link to="/user/explore-jobs">Explore jobs</Link>
                </div>
              )}
            </div>
          </section>
        </section>
      </main>
    </div>
  );
}

// ============================================================
// METRIC COMPONENT
// ============================================================

function ApplicationMetric({ icon: Icon, label, value }) {
  return (
    <article className="candidate-applications-metric">
      <div className="candidate-applications-metric-icon">
        <Icon />
      </div>

      <div className="candidate-applications-metric-content">
        <span>{label}</span>

        <strong>{value}</strong>

        <small>Live account data</small>
      </div>
    </article>
  );
}

// ============================================================
// SCORE NORMALIZER
// ============================================================

function normalizeScore(value) {
  const score = Number(value);

  if (!Number.isFinite(score)) {
    return 0;
  }

  return Math.max(0, Math.min(100, Math.round(score)));
}

// ============================================================
// STATUS CLASS
// ============================================================

function statusClass(value = "") {
  const text = String(value).toLowerCase();

  if (text.includes("reject")) {
    return "rejected";
  }

  if (text.includes("interview") || text.includes("shortlist")) {
    return "progress";
  }

  if (text.includes("hire") || text.includes("offer")) {
    return "success";
  }

  return "applied";
}

// ============================================================
// STATUS PROGRESS
// ============================================================

function statusProgress(value = "") {
  const text = String(value).toLowerCase();

  if (
    text.includes("hire") ||
    text.includes("offer") ||
    text.includes("reject")
  ) {
    return 3;
  }

  if (
    text.includes("interview") ||
    text.includes("shortlist") ||
    text.includes("review")
  ) {
    return 2;
  }

  return 1;
}
