import { useEffect, useMemo, useState } from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";
import { Bell, Bookmark, MapPin, Search } from "lucide-react";

import {
  candidateApi,
  notificationApi,
  savedJobsApi,
} from "../../services/api";

import CandidateSidebar from "../../components/Candidate/CandidateSidebar";
import CandidateHeader from "../../components/Candidate/CandidateHeader";

import "../../styles/CandidatesCSS/CandidateSavedJobs.css";

export default function UserSavedJobs() {
  const navigate = useNavigate();

  const session = JSON.parse(sessionStorage.getItem("user") || "null");

  const [items, setItems] = useState([]);
  const [profile, setProfile] = useState({});
  const [notifications, setNotifications] = useState([]);

  const [query, setQuery] = useState("");
  const [message, setMessage] = useState("");

  const [loading, setLoading] = useState(true);
  const [removingJobId, setRemovingJobId] = useState(null);

  // =========================================================
  // Load Saved Jobs
  // =========================================================

  useEffect(() => {
    if (session?.role !== "User") return;

    let mounted = true;

    async function loadData() {
      setLoading(true);
      setMessage("");

      const [savedResult, profileResult, notificationResult] =
        await Promise.allSettled([
          savedJobsApi.mine(),
          candidateApi.profile(),
          notificationApi.mine(),
        ]);

      if (!mounted) return;

      // Saved jobs
      if (savedResult.status === "fulfilled") {
        setItems(Array.isArray(savedResult.value) ? savedResult.value : []);
      } else {
        setMessage(savedResult.reason?.message || "Unable to load saved jobs.");
      }

      // Profile
      if (profileResult.status === "fulfilled") {
        setProfile(profileResult.value || {});
      }

      // Notifications
      if (notificationResult.status === "fulfilled") {
        setNotifications(
          Array.isArray(notificationResult.value)
            ? notificationResult.value
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
  // Search
  // =========================================================

  const visible = useMemo(() => {
    const search = query.trim().toLowerCase();

    if (!search) {
      return items;
    }

    return items.filter((item) => {
      const searchableText = [
        item.title,
        item.jobTitle,
        item.companyName,
        item.location,
        item.skills,
        item.employmentType,
        item.experience,
        item.description,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      return searchableText.includes(search);
    });
  }, [items, query]);

  // =========================================================
  // Unread Notifications
  // =========================================================

  const unreadCount = notifications.filter(
    (notification) => !notification.isRead,
  ).length;

  // =========================================================
  // Authentication
  // =========================================================

  if (!session) {
    return <Navigate to="/login" replace />;
  }

  if (session.role !== "User") {
    return <Navigate to={`/${session.role.toLowerCase()}/dashboard`} replace />;
  }

  // =========================================================
  // Remove Saved Job
  // =========================================================

  async function remove(jobId) {
    if (!jobId || removingJobId) return;

    try {
      setRemovingJobId(jobId);
      setMessage("");

      await savedJobsApi.remove(jobId);

      setItems((current) => current.filter((item) => item.jobId !== jobId));

      setMessage("Job removed from saved jobs.");
    } catch (error) {
      setMessage(error?.message || "Unable to remove the saved job.");
    } finally {
      setRemovingJobId(null);
    }
  }

  // =========================================================
  // Logout
  // =========================================================

  function logout() {
    sessionStorage.removeItem("user");
    sessionStorage.removeItem("accessToken");
    sessionStorage.removeItem("refreshToken");

    navigate("/login", {
      replace: true,
    });
  }

  // =========================================================
  // Render
  // =========================================================

  return (
    <div className="saved-jobs-page">
      {/* =====================================================
          SIDEBAR
          ===================================================== */}

      <CandidateSidebar />

      {/* =====================================================
          MAIN
          ===================================================== */}

      <main className="saved-jobs-main">
        {/* ===================================================
            TOP BAR
            =================================================== */}

        <CandidateHeader
          title="Saved Jobs"
          subtitle="Your shortlist of opportunities to revisit."
        />

        {/* ===================================================
            CONTENT
            =================================================== */}

        <section className="saved-jobs-content">
          {/* =================================================
              PAGE HEADING
              ================================================= */}

          <div className="saved-jobs-heading">
            <div className="saved-jobs-heading-text">
              <span>Personal shortlist</span>

              <h2>Jobs worth coming back to.</h2>

              <p>Saved jobs are stored securely with your account.</p>
            </div>

            {/* Search */}

            <div className="saved-jobs-search">
              <Search />

              <input
                type="search"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search saved jobs"
                aria-label="Search saved jobs"
              />

              {query && (
                <button
                  type="button"
                  className="saved-jobs-search-clear"
                  onClick={() => setQuery("")}
                  aria-label="Clear search"
                >
                  ×
                </button>
              )}
            </div>
          </div>

          {/* =================================================
              MESSAGE
              ================================================= */}

          {message && <div className="saved-jobs-message">{message}</div>}

          {/* =================================================
              LOADING
              ================================================= */}

          {loading ? (
            <div className="saved-jobs-loading">
              <div className="saved-jobs-spinner" />

              <p>Loading your saved jobs...</p>
            </div>
          ) : (
            <div className="saved-jobs-grid">
              {/* =================================================
                  SAVED JOB CARDS
                  ================================================= */}

              {visible.map((item) => {
                const jobId = item.jobId;

                const title = item.title || item.jobTitle || "Untitled Job";

                const companyName = item.companyName || "Company";

                const description = item.description || "";

                const skills =
                  typeof item.skills === "string" ? item.skills : "";

                const employmentType = item.employmentType || "Not specified";

                const experience =
                  item.experience !== null && item.experience !== undefined
                    ? `${item.experience} years`
                    : "Experience not specified";

                const salary = Number(item.salary || 0);

                return (
                  <article key={item.id || jobId} className="saved-jobs-card">
                    {/* Card Header */}

                    <div className="saved-jobs-card-header">
                      <div className="saved-jobs-company-avatar">
                        {companyName.charAt(0).toUpperCase()}
                      </div>

                      <button
                        type="button"
                        className="saved-jobs-remove-button"
                        onClick={() => remove(jobId)}
                        disabled={removingJobId === jobId}
                        aria-label={`Remove ${title} from saved jobs`}
                        title="Remove from saved jobs"
                      >
                        <Bookmark size={19} fill="currentColor" />
                      </button>
                    </div>

                    {/* Company */}

                    <span className="saved-jobs-company-name">
                      {companyName}
                    </span>

                    {/* Job Title */}

                    <h3 className="saved-jobs-job-title">{title}</h3>

                    {/* Description */}

                    <p className="saved-jobs-description">
                      {description
                        ? description.slice(0, 150)
                        : "No job description available."}

                      {description.length > 150 ? "…" : ""}
                    </p>

                    {/* Skills */}

                    {skills && (
                      <div className="saved-jobs-skills">
                        {skills
                          .split(",")
                          .map((skill) => skill.trim())
                          .filter(Boolean)
                          .slice(0, 5)
                          .map((skill) => (
                            <span key={skill}>{skill}</span>
                          ))}
                      </div>
                    )}

                    {/* Job Tags */}

                    <div className="saved-jobs-tags">
                      <span>{employmentType}</span>

                      <span>{experience}</span>
                    </div>

                    {/* Footer */}

                    <footer className="saved-jobs-card-footer">
                      <div className="saved-jobs-location">
                        <MapPin />

                        <div>
                          <span>
                            {item.location || "Location not specified"}
                          </span>

                          <small>
                            {salary > 0
                              ? `₹${salary.toLocaleString("en-IN")}`
                              : "Salary not specified"}
                          </small>
                        </div>
                      </div>

                      <Link
                        to="/user/candidateBrowseJobs"
                        className="saved-jobs-open-button"
                      >
                        Open & Apply
                      </Link>
                    </footer>
                  </article>
                );
              })}

              {/* =================================================
                  EMPTY STATE
                  ================================================= */}

              {!visible.length && !loading && (
                <div className="saved-jobs-empty">
                  <div className="saved-jobs-empty-icon">
                    <Bookmark />
                  </div>

                  <h3>
                    {items.length
                      ? "No matching saved jobs"
                      : "No saved jobs yet"}
                  </h3>

                  <p>
                    {items.length
                      ? "Try a different job title, company, location or skill."
                      : "Save interesting company jobs while browsing and they will appear here."}
                  </p>

                  <Link
                    to="/user/browse-jobs"
                    className="saved-jobs-empty-button"
                  >
                    Browse Jobs
                  </Link>
                </div>
              )}
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
