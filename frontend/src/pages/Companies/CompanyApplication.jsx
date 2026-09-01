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
  Mail,
  Phone,
  RefreshCw,
  Search,
  Sparkles,
  Users,
  X,
  Video,
  MapPin,
} from "lucide-react";

import CompanySidebar from "../../components/Company/CompanySidebar";
import CompanyHeader from "../../components/Company/CompanyHeader";

import { companyApi, jobsApi, interviewApi } from "../../services/api.js";

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
  const [success, setSuccess] = useState("");

  const [selectedApplication, setSelectedApplication] = useState(null);

  const [downloadingResumeId, setDownloadingResumeId] = useState(null);

  const [aiAnalysis, setAiAnalysis] = useState(null);
  const [aiLoading, setAiLoading] = useState(false);

  // =========================================================
  // INTERVIEW STATE
  // =========================================================

  const [showInterviewModal, setShowInterviewModal] = useState(false);

  const [interviewLoading, setInterviewLoading] = useState(false);

  const [interviewForm, setInterviewForm] = useState({
    round: "Technical",
    interviewType: "Online",
    scheduledAt: "",
    durationMinutes: 30,
    meetingLink: "",
    location: "",
    instructions: "",
  });

  // =========================================================
  // AUTH
  // =========================================================

  const userId = session?.userId || tokenUserId(session?.token);

  // =========================================================
  // LOAD COMPANY + JOBS
  // =========================================================

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

  // =========================================================
  // LOAD APPLICATIONS
  // =========================================================

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

  // =========================================================
  // REFRESH
  // =========================================================

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

  // =========================================================
  // FILTER APPLICATIONS
  // =========================================================

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

  // =========================================================
  // STATS
  // =========================================================

  const totalApplications = applications.length;

  const pendingApplications = applications.filter((application) =>
    ["applied", "pending", "reviewing", "underreview"].includes(
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

  // =========================================================
  // JOB TITLE
  // =========================================================

  function getJobTitle(jobId) {
    const job = jobs.find(
      (item) => String(item.id).toLowerCase() === String(jobId).toLowerCase(),
    );

    return job?.title || "Unknown Position";
  }

  // =========================================================
  // STATUS CLASS
  // =========================================================

  function getStatusClass(status) {
    const normalized = String(status || "Applied").toLowerCase();

    if (normalized.includes("short")) {
      return "shortlisted";
    }

    if (normalized.includes("reject")) {
      return "rejected";
    }

    if (normalized.includes("interview")) {
      return "interview";
    }

    if (normalized.includes("review") || normalized.includes("pending")) {
      return "reviewing";
    }

    return "applied";
  }

  // =========================================================
  // RESUME HELPERS
  // =========================================================

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

  // =========================================================
  // DOWNLOAD RESUME
  // =========================================================

  async function handleDownloadResume(application) {
    if (!application) {
      return;
    }

    try {
      setDownloadingResumeId(application.id);

      const token = session?.token;

      const response = await fetch(
        `/api/Application/${application.id}/resume`,
        {
          headers: token
            ? {
                Authorization: `Bearer ${token}`,
              }
            : {},
        },
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

  // =========================================================
  // AI CANDIDATE ANALYSIS
  // =========================================================

  async function handleAIAnalysis(application) {
    if (!application?.id) {
      return;
    }

    try {
      setAiLoading(true);
      setAiAnalysis(null);
      setError("");

      const result = await companyApi.analyzeCandidateWithAI(application.id);

      setAiAnalysis(result);
    } catch (err) {
      console.error("AI candidate analysis failed:", err);

      setError(err?.message || "Unable to analyze candidate with AI.");
    } finally {
      setAiLoading(false);
    }
  }

  // =========================================================
  // OPEN INTERVIEW MODAL
  // =========================================================

  function openInterviewModal() {
    if (!selectedApplication?.id) {
      return;
    }

    setError("");
    setSuccess("");

    setInterviewForm({
      round: "Technical",
      interviewType: "Online",
      scheduledAt: "",
      durationMinutes: 30,
      meetingLink: "",
      location: "",
      instructions: "",
    });

    setShowInterviewModal(true);
  }

  // =========================================================
  // CLOSE INTERVIEW MODAL
  // =========================================================

  function closeInterviewModal() {
    if (interviewLoading) {
      return;
    }

    setShowInterviewModal(false);
  }

  // =========================================================
  // INTERVIEW FORM CHANGE
  // =========================================================

  function handleInterviewChange(event) {
    const { name, value } = event.target;

    setInterviewForm((previous) => ({
      ...previous,
      [name]: name === "durationMinutes" ? Number(value) : value,
    }));
  }

  // =========================================================
  // CREATE INTERVIEW
  // =========================================================

  async function handleScheduleInterview(event) {
    event.preventDefault();

    if (!selectedApplication?.id) {
      setError("No application selected.");
      return;
    }

    if (!interviewForm.scheduledAt) {
      setError("Please select an interview date and time.");
      return;
    }

    if (
      interviewForm.interviewType === "Online" &&
      !interviewForm.meetingLink.trim()
    ) {
      setError("Meeting link is required for an online interview.");
      return;
    }

    if (
      interviewForm.interviewType === "InPerson" &&
      !interviewForm.location.trim()
    ) {
      setError("Location is required for an in-person interview.");
      return;
    }

    try {
      setInterviewLoading(true);
      setError("");
      setSuccess("");

      const payload = {
        applicationId: selectedApplication.id,

        round: interviewForm.round,

        interviewType: interviewForm.interviewType,

        scheduledAt: new Date(interviewForm.scheduledAt).toISOString(),

        durationMinutes: Number(interviewForm.durationMinutes),

        meetingLink: interviewForm.meetingLink.trim() || null,

        location: interviewForm.location.trim() || null,

        instructions: interviewForm.instructions.trim() || null,
      };

      await interviewApi.create(payload);

      // =====================================================
      // Update local application status
      // =====================================================

      const updatedApplication = {
        ...selectedApplication,
        status: "Interview",
      };

      setSelectedApplication(updatedApplication);

      setApplications((previous) =>
        previous.map((application) =>
          application.id === selectedApplication.id
            ? {
                ...application,
                status: "Interview",
              }
            : application,
        ),
      );

      setShowInterviewModal(false);

      setSuccess("Interview scheduled successfully.");
    } catch (err) {
      console.error("Interview scheduling failed:", err);

      setError(err?.message || "Unable to schedule interview.");
    } finally {
      setInterviewLoading(false);
    }
  }

  // =========================================================
  // AUTH REDIRECT
  // =========================================================

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

  // =========================================================
  // LOADING
  // =========================================================

  if (loading) {
    return (
      <div className="company-applications-loading">
        <div className="company-applications-spinner" />

        <span>Loading applications...</span>
      </div>
    );
  }

  // =========================================================
  // UI
  // =========================================================

  return (
    <div className="company-applications-page">
      {/* =====================================================
          SIDEBAR
      ===================================================== */}

      <CompanySidebar company={company} />

      {/* =====================================================
          MAIN
      ===================================================== */}

      <div className="company-applications-main">
        {/* ===================================================
            HEADER
        =================================================== */}

        <CompanyHeader
          company={company}
          setCompany={setCompany}
          pageTitle="Applications"
          pageSubtitle="Review and manage candidates who applied to your posted jobs."
        />

        {/* ===================================================
            CONTENT
        =================================================== */}

        <main className="company-applications-content">
          {/* =================================================
              PAGE ACTION
          ================================================= */}

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

          {/* =================================================
              ERROR
          ================================================= */}

          {error && <div className="company-applications-error">{error}</div>}

          {/* =================================================
              SUCCESS
          ================================================= */}

          {success && (
            <div className="company-applications-success">{success}</div>
          )}

          {/* =================================================
              STATS
          ================================================= */}

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

          {/* =================================================
              TOOLBAR
          ================================================= */}

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

          {/* =================================================
              APPLICATIONS
          ================================================= */}

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
                    onClick={() => {
                      setSelectedApplication(application);

                      setAiAnalysis(null);
                      setError("");
                      setSuccess("");
                    }}
                    role="button"
                    tabIndex={0}
                    onKeyDown={(event) => {
                      if (event.key === "Enter" || event.key === " ") {
                        event.preventDefault();

                        setSelectedApplication(application);

                        setAiAnalysis(null);
                        setError("");
                        setSuccess("");
                      }
                    }}
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
                          onClick={(event) => {
                            event.stopPropagation();

                            handleDownloadResume(application);
                          }}
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

                    {/* VIEW */}

                    <button
                      type="button"
                      className="company-application-view-btn"
                      onClick={(event) => {
                        event.stopPropagation();

                        setSelectedApplication(application);

                        setAiAnalysis(null);
                        setError("");
                        setSuccess("");
                      }}
                    >
                      View Candidate Details
                      <ChevronRight />
                    </button>
                  </article>
                );
              })}

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

      {/* =====================================================
          APPLICATION DETAIL MODAL
      ===================================================== */}

      {selectedApplication && (
        <div
          className="company-application-modal-overlay"
          onClick={() => {
            setSelectedApplication(null);
            setAiAnalysis(null);
            setError("");
          }}
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
                onClick={() => {
                  setSelectedApplication(null);
                  setAiAnalysis(null);
                  setError("");
                }}
                aria-label="Close candidate profile"
              >
                <X />
              </button>
            </div>

            {/* MODAL BODY */}

            <div className="company-application-modal-body">
              {/* =================================================
                  APPLICATION STATUS
              ================================================= */}

              <section className="company-application-modal-section">
                <h4>Application Status</h4>

                <div className="company-application-status-row">
                  <span
                    className={`company-application-status ${getStatusClass(
                      selectedApplication.status,
                    )}`}
                  >
                    {selectedApplication.status || "Applied"}
                  </span>

                  <span>
                    Applied {formatDate(selectedApplication.appliedAt)}
                  </span>
                </div>
              </section>

              {/* =================================================
                  POSITION
              ================================================= */}

              <section className="company-application-modal-section">
                <h4>Applied For</h4>

                <div className="company-application-modal-field">
                  <strong>
                    {selectedApplication.jobTitle ||
                      getJobTitle(selectedApplication.jobId)}
                  </strong>
                </div>
              </section>

              {/* =================================================
                  CONTACT
              ================================================= */}

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

              {/* =================================================
                  EDUCATION
              ================================================= */}

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

              {/* =================================================
                  SKILLS
              ================================================= */}

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

              {/* =================================================
                  RESUME
              ================================================= */}

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

              {/* =================================================
                  ATS
              ================================================= */}

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

              {/* =================================================
                  AI ANALYSIS
              ================================================= */}

              <section className="company-application-modal-section company-application-ai-section">
                <div className="company-application-ai-header">
                  <div>
                    <h4>AI Candidate Analysis</h4>

                    <p>
                      AI helps the company understand this candidate; ATS score
                      remains keyword-based.
                    </p>
                  </div>

                  <button
                    type="button"
                    className="company-application-ai-btn"
                    onClick={() => handleAIAnalysis(selectedApplication)}
                    disabled={aiLoading}
                  >
                    <Sparkles />

                    {aiLoading ? "Analyzing..." : "Analyze with AI"}
                  </button>
                </div>

                {aiAnalysis && (
                  <div className="company-application-ai-result">
                    <div className="company-application-ai-block">
                      <span>Summary</span>

                      <p>{aiAnalysis.summary || "No summary returned."}</p>
                    </div>

                    <div className="company-application-ai-columns">
                      <div className="company-application-ai-block">
                        <span>Strengths</span>

                        {aiAnalysis.strengths?.length ? (
                          <ul>
                            {aiAnalysis.strengths.map((item, index) => (
                              <li key={`strength-${index}`}>{item}</li>
                            ))}
                          </ul>
                        ) : (
                          <p>No specific strengths returned.</p>
                        )}
                      </div>

                      <div className="company-application-ai-block">
                        <span>Missing Job Skills</span>

                        {aiAnalysis.missingSkills?.length ? (
                          <ul>
                            {aiAnalysis.missingSkills.map((item, index) => (
                              <li key={`missing-${index}`}>{item}</li>
                            ))}
                          </ul>
                        ) : (
                          <p>No important missing skills identified.</p>
                        )}
                      </div>
                    </div>

                    <div className="company-application-ai-columns">
                      <div className="company-application-ai-block">
                        <span>Suggestions</span>

                        {aiAnalysis.suggestions?.length ? (
                          <ul>
                            {aiAnalysis.suggestions.map((item, index) => (
                              <li key={`suggestion-${index}`}>{item}</li>
                            ))}
                          </ul>
                        ) : (
                          <p>No suggestions returned.</p>
                        )}
                      </div>

                      <div className="company-application-ai-block">
                        <span>Interview Focus</span>

                        {aiAnalysis.interviewFocus?.length ? (
                          <ul>
                            {aiAnalysis.interviewFocus.map((item, index) => (
                              <li key={`focus-${index}`}>{item}</li>
                            ))}
                          </ul>
                        ) : (
                          <p>No interview focus returned.</p>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </section>

              {/* =================================================
                  INTERVIEW ACTION
              ================================================= */}

              <section className="company-application-modal-section">
                <h4>Interview</h4>

                <div className="company-application-interview-action">
                  <div>
                    <span>
                      {String(
                        selectedApplication.status || "",
                      ).toLowerCase() === "interview"
                        ? "Interview has been scheduled for this candidate."
                        : "Ready to move this candidate to the interview stage?"}
                    </span>
                  </div>

                  <button
                    type="button"
                    className="company-application-interview-btn"
                    onClick={openInterviewModal}
                  >
                    <CalendarDays />

                    {String(selectedApplication.status || "").toLowerCase() ===
                    "interview"
                      ? "Schedule Another Round"
                      : "Schedule Interview"}
                  </button>
                </div>
              </section>
            </div>
          </div>
        </div>
      )}

      {/* =====================================================
          SCHEDULE INTERVIEW MODAL
      ===================================================== */}

      {showInterviewModal && selectedApplication && (
        <div
          className="company-interview-modal-overlay"
          onClick={closeInterviewModal}
        >
          <div
            className="company-interview-modal"
            onClick={(event) => event.stopPropagation()}
          >
            {/* HEADER */}

            <div className="company-interview-modal-header">
              <div>
                <span>INTERVIEW SCHEDULING</span>

                <h2>Schedule Interview</h2>

                <p>
                  {selectedApplication.name || "Candidate"}
                  {" • "}
                  {selectedApplication.jobTitle ||
                    getJobTitle(selectedApplication.jobId)}
                </p>
              </div>

              <button
                type="button"
                className="company-interview-modal-close"
                onClick={closeInterviewModal}
                disabled={interviewLoading}
              >
                <X />
              </button>
            </div>

            {/* FORM */}

            <form
              className="company-interview-form"
              onSubmit={handleScheduleInterview}
            >
              {/* ROUND */}

              <div className="company-interview-form-group">
                <label htmlFor="round">Interview Round</label>

                <select
                  id="round"
                  name="round"
                  value={interviewForm.round}
                  onChange={handleInterviewChange}
                  required
                >
                  <option value="HR">HR</option>

                  <option value="Technical">Technical</option>

                  <option value="Managerial">Managerial</option>

                  <option value="Final">Final</option>
                </select>
              </div>

              {/* INTERVIEW TYPE */}

              <div className="company-interview-form-group">
                <label htmlFor="interviewType">Interview Type</label>

                <select
                  id="interviewType"
                  name="interviewType"
                  value={interviewForm.interviewType}
                  onChange={handleInterviewChange}
                  required
                >
                  <option value="Online">Online</option>

                  <option value="InPerson">In Person</option>

                  <option value="Phone">Phone</option>
                </select>
              </div>

              {/* DATE TIME */}

              <div className="company-interview-form-row">
                <div className="company-interview-form-group">
                  <label htmlFor="scheduledAt">Date & Time</label>

                  <div className="company-interview-input-icon">
                    <CalendarDays />

                    <input
                      id="scheduledAt"
                      type="datetime-local"
                      name="scheduledAt"
                      value={interviewForm.scheduledAt}
                      onChange={handleInterviewChange}
                      required
                    />
                  </div>
                </div>

                {/* DURATION */}

                <div className="company-interview-form-group">
                  <label htmlFor="durationMinutes">Duration</label>

                  <select
                    id="durationMinutes"
                    name="durationMinutes"
                    value={interviewForm.durationMinutes}
                    onChange={handleInterviewChange}
                    required
                  >
                    <option value={15}>15 minutes</option>

                    <option value={30}>30 minutes</option>

                    <option value={45}>45 minutes</option>

                    <option value={60}>60 minutes</option>

                    <option value={90}>90 minutes</option>

                    <option value={120}>120 minutes</option>
                  </select>
                </div>
              </div>

              {/* ONLINE */}

              {interviewForm.interviewType === "Online" && (
                <div className="company-interview-form-group">
                  <label htmlFor="meetingLink">Meeting Link</label>

                  <div className="company-interview-input-icon">
                    <Video />

                    <input
                      id="meetingLink"
                      type="url"
                      name="meetingLink"
                      value={interviewForm.meetingLink}
                      onChange={handleInterviewChange}
                      placeholder="https://meet.google.com/..."
                      required
                    />
                  </div>
                </div>
              )}

              {/* LOCATION */}

              {interviewForm.interviewType === "InPerson" && (
                <div className="company-interview-form-group">
                  <label htmlFor="location">Location</label>

                  <div className="company-interview-input-icon">
                    <MapPin />

                    <input
                      id="location"
                      type="text"
                      name="location"
                      value={interviewForm.location}
                      onChange={handleInterviewChange}
                      placeholder="Office address / meeting room"
                      required
                    />
                  </div>
                </div>
              )}

              {/* INSTRUCTIONS */}

              <div className="company-interview-form-group">
                <label htmlFor="instructions">Instructions</label>

                <textarea
                  id="instructions"
                  name="instructions"
                  value={interviewForm.instructions}
                  onChange={handleInterviewChange}
                  placeholder="Add instructions for the candidate..."
                  rows={4}
                />
              </div>

              {/* ERROR */}

              {error && (
                <div className="company-interview-form-error">{error}</div>
              )}

              {/* ACTIONS */}

              <div className="company-interview-form-actions">
                <button
                  type="button"
                  className="company-interview-cancel-btn"
                  onClick={closeInterviewModal}
                  disabled={interviewLoading}
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  className="company-interview-submit-btn"
                  disabled={interviewLoading}
                >
                  <CalendarDays />

                  {interviewLoading ? "Scheduling..." : "Schedule Interview"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
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
    day: "2-digit",
    month: "short",
    year: "numeric",
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
