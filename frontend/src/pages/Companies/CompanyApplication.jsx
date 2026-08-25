import { useEffect, useMemo, useState } from "react";
import { Link, Navigate } from "react-router-dom";
import {
  Award,
  BriefcaseBusiness,
  CalendarDays,
  ChevronRight,
  Clock3,
  Download,
  FileText,
  GraduationCap,
  Mail,
  Phone,
  RefreshCw,
  Search,
  UserRound,
  Users,
  X,
} from "lucide-react";

import CompanySidebar from "../../components/Company/CompanySidebar";
import CompanyHeader from "../../components/Company/CompanyHeader";

import { companyApi, jobsApi } from "../../services/api.js";

import "../../styles/CompanyCSS/CompanyApplication.css";

export default function CompanyApplication() {
  const session = JSON.parse(sessionStorage.getItem("user") || "null");

  const [company, setCompany] = useState(null);
  const [jobs, setJobs] = useState([]);
  const [applications, setApplications] = useState([]);

  const [selectedJob, setSelectedJob] = useState("all");
  const [search, setSearch] = useState("");

  const [loading, setLoading] = useState(true);
  const [applicationsLoading, setApplicationsLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const [error, setError] = useState("");
  const [selectedApplication, setSelectedApplication] = useState(null);

  const [downloadingResumeId, setDownloadingResumeId] = useState(null);

  // ==========================================
  // AUTH
  // ==========================================

  const userId = session?.userId || tokenUserId(session?.token);

  // ==========================================
  // LOAD COMPANY + JOBS
  // ==========================================

  useEffect(() => {
    if (!userId) {
      setLoading(false);
      setError("Unable to identify the logged-in company.");
      return;
    }

    loadCompanyData();
  }, [userId]);

  async function loadCompanyData() {
    setLoading(true);
    setError("");

    try {
      const [companyResult, jobsResult] = await Promise.all([
        companyApi.byUser(userId),
        jobsApi.all(),
      ]);

      setCompany(companyResult);

      const allJobs = Array.isArray(jobsResult) ? jobsResult : [];

      const companyJobs = companyResult
        ? allJobs.filter(
            (job) =>
              String(job.companyId).toLowerCase() ===
              String(companyResult.id).toLowerCase(),
          )
        : [];

      setJobs(companyJobs);

      if (companyJobs.length > 0) {
        await loadApplications(companyJobs);
      } else {
        setApplications([]);
      }
    } catch (err) {
      console.error("Company applications loading error:", err);

      setError(err?.message || "Unable to load company applications.");
    } finally {
      setLoading(false);
    }
  }

  // ==========================================
  // LOAD APPLICATIONS
  // ==========================================

  async function loadApplications(companyJobs = jobs) {
    if (!companyJobs.length) {
      setApplications([]);
      return;
    }

    setApplicationsLoading(true);
    setError("");

    try {
      const results = await Promise.all(
        companyJobs.map(async (job) => {
          try {
            const result = await companyApi.applicants(job.id);

            return Array.isArray(result) ? result : [];
          } catch (err) {
            console.error(
              `Applications loading failed for job ${job.id}:`,
              err,
            );

            return [];
          }
        }),
      );

      const combined = results
        .flat()
        .sort(
          (a, b) => new Date(b.appliedAt || 0) - new Date(a.appliedAt || 0),
        );

      setApplications(combined);
    } catch (err) {
      console.error("Applications loading error:", err);

      setError(err?.message || "Unable to load applications.");
    } finally {
      setApplicationsLoading(false);
    }
  }

  // ==========================================
  // REFRESH
  // ==========================================

  async function handleRefresh() {
    if (!jobs.length) {
      await loadCompanyData();
      return;
    }

    setRefreshing(true);

    try {
      await loadApplications(jobs);
    } finally {
      setRefreshing(false);
    }
  }

  // ==========================================
  // FILTER APPLICATIONS
  // ==========================================

  const filteredApplications = useMemo(() => {
    const query = search.trim().toLowerCase();

    return applications.filter((application) => {
      const matchesJob =
        selectedJob === "all" ||
        String(application.jobId).toLowerCase() ===
          String(selectedJob).toLowerCase();

      if (!matchesJob) {
        return false;
      }

      if (!query) {
        return true;
      }

      const searchableText = `
        ${application.name || ""}
        ${application.email || ""}
        ${application.contact || ""}
        ${application.jobTitle || ""}
        ${application.companyName || ""}
        ${application.qualification || ""}
        ${application.course || ""}
        ${application.collegeName || ""}
        ${
          Array.isArray(application.skills)
            ? application.skills.join(" ")
            : application.skills || ""
        }
        ${application.experience || ""}
        ${application.status || ""}
        ${application.resumeFileName || ""}
      `.toLowerCase();

      return searchableText.includes(query);
    });
  }, [applications, selectedJob, search]);

  // ==========================================
  // STATS
  // ==========================================

  const totalApplications = applications.length;

  const pendingApplications = applications.filter((application) =>
    ["applied", "pending", "reviewing"].includes(
      String(application.status || "Applied").toLowerCase(),
    ),
  ).length;

  const shortlistedApplications = applications.filter((application) =>
    String(application.status || "")
      .toLowerCase()
      .includes("short"),
  ).length;

  const averageATS =
    applications.length > 0
      ? (
          applications.reduce(
            (total, application) => total + Number(application.atsScore || 0),
            0,
          ) / applications.length
        ).toFixed(1)
      : "0";

  // ==========================================
  // JOB TITLE
  // ==========================================

  function getJobTitle(jobId) {
    const job = jobs.find(
      (item) => String(item.id).toLowerCase() === String(jobId).toLowerCase(),
    );

    return job?.title || "Unknown Position";
  }

  // ==========================================
  // STATUS CLASS
  // ==========================================

  function getStatusClass(status) {
    const normalized = String(status || "Applied").toLowerCase();

    if (normalized.includes("short")) {
      return "shortlisted";
    }

    if (normalized.includes("reject")) {
      return "rejected";
    }

    if (normalized.includes("review") || normalized.includes("pending")) {
      return "reviewing";
    }

    if (normalized.includes("interview")) {
      return "shortlisted";
    }

    return "applied";
  }

  // ==========================================
  // RESUME HELPERS
  // ==========================================

  function hasResume(application) {
    return Boolean(
      application?.resumeId ||
      application?.resumeFileName ||
      application?.resumeUrl ||
      application?.resumePath,
    );
  }

  function getResumeName(application) {
    if (application?.resumeFileName) {
      return application.resumeFileName;
    }

    if (application?.resumeName) {
      return application.resumeName;
    }

    if (application?.resumePath) {
      return application.resumePath.split(/[\\/]/).pop();
    }

    return "Candidate Resume";
  }

  // ==========================================
  // DOWNLOAD RESUME
  // ==========================================

  async function handleDownloadResume(application) {
    if (!application) {
      return;
    }

    try {
      setDownloadingResumeId(application.id);
      const token = session?.token;
      const response = await fetch(
        `/api/Application/${application.id}/resume`,
        { headers: token ? { Authorization: `Bearer ${token}` } : {} },
      );

      if (!response.ok) {
        const body = await response.json().catch(() => ({}));
        throw new Error(
          body?.message || "Unable to download candidate resume.",
        );
      }

      const file = await response.blob();
      const downloadUrl = URL.createObjectURL(file);
      const link = document.createElement("a");

      link.href = downloadUrl;
      link.download = getResumeName(application);
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(downloadUrl);
    } catch (err) {
      console.error("Resume download failed:", err);

      setError(err?.message || "Unable to download candidate resume.");
    } finally {
      setDownloadingResumeId(null);
    }
  }

  // ==========================================
  // LOADING
  // ==========================================

  if (!session) {
    return <Navigate to="/login" replace />;
  }

  if (session.role !== "Company") {
    return (
      <Navigate
        to={`/${String(session.role || "").toLowerCase()}/dashboard`}
        replace
      />
    );
  }

  if (loading) {
    return (
      <div className="company-applications-loading">
        <div className="company-applications-spinner" />
        <span>Loading applications...</span>
      </div>
    );
  }

  // ==========================================
  // UI
  // ==========================================

  return (
    <div className="company-applications-page">
      {/* ========================================
          SIDEBAR
      ======================================== */}

      <CompanySidebar company={company} />

      {/* ========================================
          MAIN
      ======================================== */}

      <div className="company-applications-main">
        {/* ========================================
            HEADER
        ======================================== */}

        <CompanyHeader
          company={company}
          setCompany={setCompany}
          pageTitle="Applications"
          pageSubtitle="Review and manage candidates who applied to your posted jobs."
        />

        {/* ========================================
            CONTENT
        ======================================== */}

        <main className="company-applications-content">
          {/* ====================================
              PAGE ACTION
          ==================================== */}

          <div className="company-applications-heading-action">
            <Link
              to="/company/posted-jobs"
              className="company-applications-refresh-btn"
            >
              <BriefcaseBusiness />
              View Posted Jobs
            </Link>

            <button
              type="button"
              className="company-applications-refresh-btn"
              onClick={handleRefresh}
              disabled={refreshing}
            >
              <RefreshCw
                className={
                  refreshing ? "company-applications-refresh-icon" : ""
                }
              />

              {refreshing ? "Refreshing..." : "Refresh"}
            </button>
          </div>

          {/* ====================================
              ERROR
          ==================================== */}

          {error && <div className="company-applications-error">{error}</div>}

          {/* ====================================
              STATS
          ==================================== */}

          <section className="company-applications-stats">
            <article className="company-applications-stat-card">
              <div className="company-applications-stat-icon">
                <Users />
              </div>

              <div className="company-applications-stat-info">
                <span>Total Applications</span>
                <strong>{totalApplications}</strong>
              </div>
            </article>

            <article className="company-applications-stat-card">
              <div className="company-applications-stat-icon">
                <Clock3 />
              </div>

              <div className="company-applications-stat-info">
                <span>Pending Review</span>
                <strong>{pendingApplications}</strong>
              </div>
            </article>

            <article className="company-applications-stat-card">
              <div className="company-applications-stat-icon">
                <Award />
              </div>

              <div className="company-applications-stat-info">
                <span>Shortlisted</span>
                <strong>{shortlistedApplications}</strong>
              </div>
            </article>

            <article className="company-applications-stat-card">
              <div className="company-applications-stat-icon">
                <BriefcaseBusiness />
              </div>

              <div className="company-applications-stat-info">
                <span>Average ATS</span>
                <strong>{averageATS}%</strong>
              </div>
            </article>
          </section>

          {/* ====================================
              TOOLBAR
          ==================================== */}

          <section className="company-applications-toolbar">
            <div className="company-applications-results-header">
              <div>
                <h2>Candidate Applications</h2>

                <span className="company-applications-results-count">
                  {filteredApplications.length}{" "}
                  {filteredApplications.length === 1
                    ? "application"
                    : "applications"}{" "}
                  found
                </span>
              </div>
            </div>

            <div className="company-applications-toolbar-row">
              {/* JOB FILTER */}

              <select
                className="company-applications-filter-select"
                value={selectedJob}
                onChange={(event) => setSelectedJob(event.target.value)}
              >
                <option value="all">All Jobs</option>

                {jobs.map((job) => (
                  <option key={job.id} value={job.id}>
                    {job.title}
                  </option>
                ))}
              </select>

              {/* SEARCH */}

              <label className="company-applications-search-box">
                <Search />

                <input
                  type="text"
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="Search candidates, skills, email..."
                />
              </label>
            </div>
          </section>

          {/* ====================================
              APPLICATIONS
          ==================================== */}

          {applicationsLoading ? (
            <div className="company-applications-loading">
              <div className="company-applications-spinner" />
              <span>Loading candidate applications...</span>
            </div>
          ) : (
            <div className="company-applications-list">
              {filteredApplications.map((application) => {
                const atsScore = Number(application.atsScore || 0);

                const candidateInitial =
                  application.name?.trim()?.charAt(0)?.toUpperCase() || "C";

                const resumeAvailable = hasResume(application);

                return (
                  <article
                    key={application.id}
                    className="company-application-card"
                  >
                    {/* CARD TOP */}

                    <div className="company-application-card-top">
                      <div className="company-application-candidate">
                        <div className="company-application-avatar">
                          {candidateInitial}
                        </div>

                        <div className="company-application-candidate-info">
                          <h3>{application.name || "Candidate"}</h3>

                          <p>
                            {application.jobTitle ||
                              getJobTitle(application.jobId)}
                          </p>

                          <p className="company-application-candidate-email">
                            {application.email || "Email not available"}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* JOB */}

                    <div className="company-application-job-info">
                      <span className="company-application-job-info-label">
                        Applied Position
                      </span>

                      <strong>
                        {application.jobTitle || getJobTitle(application.jobId)}
                      </strong>
                    </div>

                    {/* META */}

                    <div className="company-application-meta">
                      <div className="company-application-meta-item">
                        <span>Email</span>
                        <strong>{application.email || "-"}</strong>
                      </div>

                      <div className="company-application-meta-item">
                        <span>Contact</span>
                        <strong>{application.contact || "-"}</strong>
                      </div>

                      <div className="company-application-meta-item">
                        <span>Qualification</span>
                        <strong>{application.qualification || "-"}</strong>
                      </div>

                      <div className="company-application-meta-item">
                        <span>Experience</span>
                        <strong>
                          {Number(application.experience || 0)} years
                        </strong>
                      </div>
                    </div>

                    {/* RESUME */}

                    <div className="company-application-resume-row">
                      <div className="company-application-resume-info">
                        <div className="company-application-resume-icon">
                          <FileText />
                        </div>

                        <div>
                          <span>Resume</span>

                          <strong>
                            {resumeAvailable
                              ? getResumeName(application)
                              : "Resume not uploaded"}
                          </strong>
                        </div>
                      </div>

                      {resumeAvailable && (
                        <button
                          type="button"
                          className="company-application-download-btn"
                          onClick={() => handleDownloadResume(application)}
                          disabled={downloadingResumeId === application.id}
                          title="Download Resume"
                          aria-label="Download Resume"
                        >
                          <Download />
                        </button>
                      )}
                    </div>

                    {/* ATS */}

                    <div className="company-application-card-bottom">
                      <div className="company-application-ats">
                        <div className="company-application-ats-circle">
                          {Math.round(Math.min(Math.max(atsScore, 0), 100))}
                        </div>

                        <div className="company-application-ats-details">
                          <span>ATS Match Score</span>

                          <strong>{atsScore}%</strong>
                        </div>
                      </div>

                      <div className="company-application-applied-date">
                        <CalendarDays />
                        Applied {formatDate(application.appliedAt)}
                      </div>
                    </div>

                    {/* SKILLS */}

                    {Array.isArray(application.skills) &&
                      application.skills.length > 0 && (
                        <div className="company-application-skills">
                          {application.skills.slice(0, 8).map((skill) => (
                            <span
                              className="company-application-skill"
                              key={skill}
                            >
                              {skill}
                            </span>
                          ))}

                          {application.skills.length > 8 && (
                            <span className="company-application-skill">
                              +{application.skills.length - 8}
                            </span>
                          )}
                        </div>
                      )}
                  </article>
                );
              })}

              {/* EMPTY */}

              {!filteredApplications.length && (
                <div className="company-applications-empty">
                  <div className="company-applications-empty-icon">
                    <Users />
                  </div>

                  <h3>
                    {search || selectedJob !== "all"
                      ? "No applications found"
                      : "No applications yet"}
                  </h3>

                  <p>
                    {search || selectedJob !== "all"
                      ? "Try changing your search keyword or selected job."
                      : "Applications from candidates will appear here when they apply to your posted jobs."}
                  </p>
                </div>
              )}
            </div>
          )}
        </main>
      </div>

      {/* ========================================
          APPLICATION DETAIL MODAL
      ======================================== */}

      {selectedApplication && (
        <div
          className="company-application-modal-overlay"
          onClick={() => setSelectedApplication(null)}
        >
          <div
            className="company-application-modal"
            onClick={(event) => event.stopPropagation()}
          >
            {/* MODAL HEADER */}

            <div className="company-application-modal-header">
              <div>
                <span>CANDIDATE PROFILE</span>

                <h2>{selectedApplication.name || "Candidate"}</h2>
              </div>

              <button
                type="button"
                className="company-application-modal-close"
                onClick={() => setSelectedApplication(null)}
                aria-label="Close candidate profile"
              >
                <X />
              </button>
            </div>

            {/* MODAL BODY */}

            <div className="company-application-modal-body">
              {/* POSITION */}

              <section className="company-application-modal-section">
                <h4>Applied For</h4>

                <div className="company-application-modal-field">
                  <strong>
                    {selectedApplication.jobTitle ||
                      getJobTitle(selectedApplication.jobId)}
                  </strong>
                </div>
              </section>

              {/* CONTACT */}

              <section className="company-application-modal-section">
                <h4>Contact Information</h4>

                <div className="company-application-modal-grid">
                  <div className="company-application-modal-field">
                    <span>Email</span>
                    <strong>{selectedApplication.email || "-"}</strong>
                  </div>

                  <div className="company-application-modal-field">
                    <span>Phone</span>
                    <strong>{selectedApplication.contact || "-"}</strong>
                  </div>
                </div>
              </section>

              {/* EDUCATION */}

              <section className="company-application-modal-section">
                <h4>Education</h4>

                <div className="company-application-modal-grid">
                  <div className="company-application-modal-field">
                    <span>Qualification</span>
                    <strong>{selectedApplication.qualification || "-"}</strong>
                  </div>

                  <div className="company-application-modal-field">
                    <span>Course</span>
                    <strong>{selectedApplication.course || "-"}</strong>
                  </div>

                  <div className="company-application-modal-field">
                    <span>College / University</span>
                    <strong>{selectedApplication.collegeName || "-"}</strong>
                  </div>

                  <div className="company-application-modal-field">
                    <span>Experience</span>
                    <strong>
                      {Number(selectedApplication.experience || 0)} years
                    </strong>
                  </div>
                </div>
              </section>

              {/* SKILLS */}

              <section className="company-application-modal-section">
                <h4>Skills</h4>

                <div className="company-application-skills">
                  {Array.isArray(selectedApplication.skills) &&
                  selectedApplication.skills.length > 0 ? (
                    selectedApplication.skills.map((skill) => (
                      <span className="company-application-skill" key={skill}>
                        {skill}
                      </span>
                    ))
                  ) : (
                    <span className="company-application-skill">
                      No skills provided
                    </span>
                  )}
                </div>
              </section>

              {/* RESUME */}

              <section className="company-application-modal-section">
                <h4>Candidate Resume</h4>

                <div className="company-application-modal-resume">
                  <div className="company-application-modal-resume-info">
                    <div className="company-application-modal-resume-icon">
                      <FileText />
                    </div>

                    <div>
                      <span>Resume File</span>

                      <strong>
                        {hasResume(selectedApplication)
                          ? getResumeName(selectedApplication)
                          : "Resume not available"}
                      </strong>
                    </div>
                  </div>

                  {hasResume(selectedApplication) && (
                    <button
                      type="button"
                      className="company-application-download-btn"
                      onClick={() => handleDownloadResume(selectedApplication)}
                      disabled={downloadingResumeId === selectedApplication.id}
                    >
                      <Download />

                      {downloadingResumeId === selectedApplication.id
                        ? "Downloading..."
                        : "Download"}
                    </button>
                  )}
                </div>
              </section>

              {/* ATS */}

              <section className="company-application-modal-section">
                <h4>ATS Score</h4>

                <div className="company-application-ats">
                  <div className="company-application-ats-circle">
                    {Math.round(Number(selectedApplication.atsScore || 0))}
                  </div>

                  <div className="company-application-ats-details">
                    <span>Resume / Job Match</span>

                    <strong>
                      {Number(selectedApplication.atsScore || 0)}%
                    </strong>
                  </div>
                </div>
              </section>

              {/* APPLICATION */}

              <section className="company-application-modal-section">
                <h4>Application Details</h4>

                <div className="company-application-modal-grid">
                  <div className="company-application-modal-field">
                    <span>Status</span>
                    <strong>{selectedApplication.status || "Applied"}</strong>
                  </div>

                  <div className="company-application-modal-field">
                    <span>Applied On</span>
                    <strong>{formatDate(selectedApplication.appliedAt)}</strong>
                  </div>
                </div>
              </section>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ==========================================
// DATE FORMAT
// ==========================================

function formatDate(value) {
  if (!value) {
    return "-";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "-";
  }

  return date.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

// ==========================================
// TOKEN USER ID
// ==========================================

function tokenUserId(token) {
  try {
    if (!token) {
      return null;
    }

    const payload = token.split(".")[1].replace(/-/g, "+").replace(/_/g, "/");

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
