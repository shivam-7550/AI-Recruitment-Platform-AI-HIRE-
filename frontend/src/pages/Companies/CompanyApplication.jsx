/* =========================================================
   COMPANY APPLICATION PAGE
   ========================================================= */

import { useEffect, useMemo, useState } from "react";
import { Navigate, useNavigate } from "react-router-dom";

import {
  Award,
  BriefcaseBusiness,
  CalendarDays,
  ChevronRight,
  Download,
  FileText,
  Mail,
  MapPin,
  MessageCircle,
  Phone,
  RefreshCw,
  Search,
  Sparkles,
  Users,
  X,
} from "lucide-react";

import CompanySidebar from "../../components/Company/CompanySidebar";
import CompanyHeader from "../../components/Company/CompanyHeader";

import {
  companyApi,
  interviewApi,
  jobsApi,
  messageApi,
} from "../../services/api.js";

import "../../styles/CompanyCSS/CompanyApplication.css";

/* =========================================================
   SESSION HELPERS
   ========================================================= */

function tokenUserId(token) {
  try {
    if (!token) return null;

    const payload = token.split(".")[1];

    if (!payload) return null;

    const decoded = JSON.parse(
      atob(payload.replace(/-/g, "+").replace(/_/g, "/")),
    );

    return (
      decoded?.nameid ||
      decoded?.sub ||
      decoded?.[
        "http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier"
      ] ||
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
   APPLICATION HELPERS
   ========================================================= */

function getApplicationId(application) {
  return (
    application?.id ||
    application?.applicationId ||
    application?.Id ||
    application?.ApplicationId ||
    null
  );
}

function getCandidateId(application) {
  return (
    application?.userId ||
    application?.candidateId ||
    application?.UserId ||
    application?.CandidateId ||
    null
  );
}

function getCandidateName(application) {
  return (
    application?.candidateName ||
    application?.name ||
    application?.candidate?.name ||
    application?.user?.name ||
    application?.CandidateName ||
    application?.Name ||
    "Candidate"
  );
}

function getJobTitle(application) {
  return (
    application?.jobTitle ||
    application?.job?.title ||
    application?.JobTitle ||
    application?.Job?.Title ||
    "Job Application"
  );
}

function getApplicationStatus(application) {
  return (
    application?.status ||
    application?.applicationStatus ||
    application?.Status ||
    application?.ApplicationStatus ||
    "Pending"
  );
}

function formatDate(value) {
  if (!value) return "Not available";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "Not available";
  }

  return date.toLocaleDateString(undefined, {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function normalizeList(value) {
  if (Array.isArray(value)) {
    return value.filter(Boolean);
  }

  if (typeof value === "string") {
    return value
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean);
  }

  return [];
}

function getStatusClass(status) {
  const normalized = String(status || "Pending").toLowerCase();

  if (
    normalized.includes("shortlist") ||
    normalized.includes("interview") ||
    normalized.includes("selected")
  ) {
    return "is-success";
  }

  if (normalized.includes("reject") || normalized.includes("cancel")) {
    return "is-danger";
  }

  return "is-pending";
}

/* =========================================================
   COMPANY APPLICATION
   ========================================================= */

function CompanyApplication() {
  const session = getSession();

  const navigate = useNavigate();

  const token = session?.token || session?.accessToken || null;

  const userId = session?.userId || session?.id || tokenUserId(token);

  const role = session?.role || session?.userRole || session?.Role || "";

  /* =======================================================
     STATE
     ======================================================= */

  const [company, setCompany] = useState(null);

  const [jobs, setJobs] = useState([]);

  const [applications, setApplications] = useState([]);

  const [search, setSearch] = useState("");

  const [statusFilter, setStatusFilter] = useState("all");

  const [jobFilter, setJobFilter] = useState("all");

  const [loading, setLoading] = useState(true);

  const [refreshing, setRefreshing] = useState(false);

  const [error, setError] = useState("");

  const [selectedApplication, setSelectedApplication] = useState(null);

  const [resumeLoadingId, setResumeLoadingId] = useState(null);

  const [aiAnalysis, setAiAnalysis] = useState(null);

  const [aiLoading, setAiLoading] = useState(false);

  const [interviewLoading, setInterviewLoading] = useState(false);

  const [interviewModalOpen, setInterviewModalOpen] = useState(false);

  const [interviewForm, setInterviewForm] = useState({
    scheduledAt: "",
    durationMinutes: 30,
    meetingLink: "",
    notes: "",
  });

  const [interviewError, setInterviewError] = useState("");

  const [interviewSuccess, setInterviewSuccess] = useState("");

  /* =======================================================
     LOAD COMPANY + JOBS + APPLICATIONS
     ======================================================= */

  const loadApplications = async (showRefreshing = false) => {
    try {
      if (showRefreshing) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      setError("");

      if (!userId) {
        throw new Error("Company session could not be identified.");
      }

      /* ---------------------------------------------------
         COMPANY
         --------------------------------------------------- */

      const companyResult = await companyApi.byUser(userId);

      const companyData =
        companyResult?.data || companyResult?.company || companyResult;

      if (!companyData) {
        throw new Error("Company profile could not be loaded.");
      }

      setCompany(companyData);

      /* ---------------------------------------------------
         JOBS
         --------------------------------------------------- */

      const jobsResult = await jobsApi.all();

      const allJobs = jobsResult?.data || jobsResult?.jobs || jobsResult || [];

      const companyId =
        companyData?.id ||
        companyData?.companyId ||
        companyData?.Id ||
        companyData?.CompanyId;

      const companyJobs = Array.isArray(allJobs)
        ? allJobs.filter((job) => {
            const jobCompanyId =
              job?.companyId ||
              job?.CompanyId ||
              job?.company?.id ||
              job?.Company?.Id;

            return String(jobCompanyId) === String(companyId);
          })
        : [];

      setJobs(companyJobs);

      /* ---------------------------------------------------
         APPLICATIONS
         --------------------------------------------------- */

      const applicationResponses = await Promise.all(
        companyJobs.map(async (job) => {
          try {
            const jobId = job?.id || job?.jobId || job?.Id || job?.JobId;

            const result = await companyApi.applicants(jobId);

            const data = result?.data || result?.applications || result || [];

            return Array.isArray(data) ? data : [];
          } catch (jobError) {
            console.error(
              `Unable to load applications for job ${job?.id}:`,
              jobError,
            );

            return [];
          }
        }),
      );

      const flattened = applicationResponses.flat();

      /* ---------------------------------------------------
         REMOVE DUPLICATES
         --------------------------------------------------- */

      const uniqueApplications = Array.from(
        new Map(
          flattened.map((application) => [
            String(getApplicationId(application)),
            application,
          ]),
        ).values(),
      );

      /* ---------------------------------------------------
         NEWEST APPLICATION FIRST
         --------------------------------------------------- */

      uniqueApplications.sort((a, b) => {
        const dateA = new Date(
          a?.appliedAt || a?.createdAt || a?.AppliedAt || a?.CreatedAt || 0,
        ).getTime();

        const dateB = new Date(
          b?.appliedAt || b?.createdAt || b?.AppliedAt || b?.CreatedAt || 0,
        ).getTime();

        return dateB - dateA;
      });

      setApplications(uniqueApplications);
    } catch (err) {
      console.error("Unable to load company applications:", err);

      setError(err?.message || "Unable to load applications.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  /* =======================================================
     INITIAL LOAD
     ======================================================= */

  useEffect(() => {
    if (role !== "Company" || !userId) {
      setLoading(false);
      return;
    }

    loadApplications();
  }, [role, userId]);

  /* =======================================================
     FILTER APPLICATIONS
     ======================================================= */

  const filteredApplications = useMemo(() => {
    const query = search.trim().toLowerCase();

    return applications.filter((application) => {
      const candidateName = getCandidateName(application).toLowerCase();

      const jobTitle = getJobTitle(application).toLowerCase();

      const email = String(
        application?.email ||
          application?.candidateEmail ||
          application?.Email ||
          "",
      ).toLowerCase();

      const status = getApplicationStatus(application).toLowerCase();

      const jobId =
        application?.jobId ||
        application?.JobId ||
        application?.job?.id ||
        application?.Job?.Id;

      const matchesSearch =
        !query ||
        candidateName.includes(query) ||
        jobTitle.includes(query) ||
        email.includes(query);

      const matchesStatus =
        statusFilter === "all" || status === statusFilter.toLowerCase();

      const matchesJob =
        jobFilter === "all" || String(jobId) === String(jobFilter);

      return matchesSearch && matchesStatus && matchesJob;
    });
  }, [applications, search, statusFilter, jobFilter]);

  /* =======================================================
     OPEN APPLICATION
     ======================================================= */

  const openApplication = (application) => {
    setSelectedApplication(application);

    setAiAnalysis(null);

    setInterviewError("");

    setInterviewSuccess("");
  };

  /* =======================================================
     CLOSE APPLICATION
     ======================================================= */

  const closeApplication = () => {
    if (aiLoading || interviewLoading) {
      return;
    }

    setSelectedApplication(null);

    setAiAnalysis(null);

    setInterviewError("");

    setInterviewSuccess("");
  };

  /* =======================================================
     DOWNLOAD APPLICATION RESUME
     ======================================================= */

  const handleDownloadResume = async (application) => {
    const applicationId = getApplicationId(application);

    if (!applicationId) {
      setError("Application ID not found.");
      return;
    }

    try {
      setResumeLoadingId(applicationId);

      setError("");

      const response = await companyApi.downloadResume(applicationId);

      const blob = response?.blob || response?.data || response;

      if (blob instanceof Blob) {
        const url = window.URL.createObjectURL(blob);

        const anchor = document.createElement("a");

        anchor.href = url;

        anchor.download =
          application?.resumeFileName ||
          application?.ResumeFileName ||
          `${getCandidateName(application)}-Resume`;

        document.body.appendChild(anchor);

        anchor.click();

        anchor.remove();

        window.URL.revokeObjectURL(url);

        return;
      }

      if (typeof response === "string") {
        window.open(response, "_blank", "noopener,noreferrer");
      }
    } catch (err) {
      console.error("Resume download failed:", err);

      setError(err?.message || "Unable to download resume.");
    } finally {
      setResumeLoadingId(null);
    }
  };

  /* =======================================================
     APPLICATION -> MESSAGE
     ======================================================= */

  const handleOpenCandidateChat = async (application) => {
    const applicationId = getApplicationId(application);

    if (!applicationId) {
      setError("Application ID not found.");
      return;
    }

    const candidateId = getCandidateId(application);

    if (!candidateId) {
      setError("Candidate ID not found for this application.");
      return;
    }

    try {
      setError("");

      const result = await messageApi.createConversation({
        applicationId,
        candidateId,
      });

      const conversation = result?.data || result?.conversation || result;

      const conversationId =
        conversation?.conversationId ||
        conversation?.ConversationId ||
        conversation?.id ||
        conversation?.Id;

      if (!conversationId) {
        throw new Error(
          "Conversation could not be opened because no conversation ID was returned.",
        );
      }

      setSelectedApplication(null);

      setAiAnalysis(null);

      /*
       * IMPORTANT:
       * Existing CompanyMessage route:
       *
       * /company/messages
       *
       * CompanyMessage.jsx reads:
       *
       * ?conversationId=
       */

      navigate(
        `/company/messages?conversationId=${encodeURIComponent(
          conversationId,
        )}`,
      );
    } catch (err) {
      console.error("Unable to open candidate conversation:", err);

      setError(err?.message || "Unable to open candidate conversation.");
    }
  };

  /* =======================================================
     AI CANDIDATE ANALYSIS
     ======================================================= */

  const handleAIAnalysis = async (application) => {
    const applicationId = getApplicationId(application);

    if (!applicationId) {
      setError("Application ID not found.");
      return;
    }

    try {
      setAiLoading(true);

      setAiAnalysis(null);

      setError("");

      const result = await companyApi.analyzeCandidateWithAI(applicationId);

      const analysis = result?.data || result?.analysis || result;

      setAiAnalysis(analysis || null);

      /*
       * Persist the semantic AI Job Match Score
       * in local application state as well.
       *
       * This is NOT the deterministic ATSScore.
       */

      if (analysis && analysis.jobMatchScore !== undefined) {
        const updatedScore = Number(analysis.jobMatchScore);

        setSelectedApplication((current) =>
          current
            ? {
                ...current,

                jobMatchScore: updatedScore,

                JobMatchScore: updatedScore,
              }
            : current,
        );

        setApplications((current) =>
          current.map((item) =>
            String(getApplicationId(item)) === String(applicationId)
              ? {
                  ...item,

                  jobMatchScore: updatedScore,

                  JobMatchScore: updatedScore,
                }
              : item,
          ),
        );
      }
    } catch (err) {
      console.error("AI candidate analysis failed:", err);

      setAiAnalysis(null);

      setError(err?.message || "Unable to analyze candidate with AI.");
    } finally {
      setAiLoading(false);
    }
  };

  /* =======================================================
     INTERVIEW MODAL
     ======================================================= */

  const openInterviewModal = (application) => {
    setSelectedApplication(application);

    setInterviewError("");

    setInterviewSuccess("");

    setInterviewForm({
      scheduledAt: "",
      durationMinutes: 30,
      meetingLink: "",
      notes: "",
    });

    setInterviewModalOpen(true);
  };

  const closeInterviewModal = () => {
    if (interviewLoading) {
      return;
    }

    setInterviewModalOpen(false);

    setInterviewError("");

    setInterviewSuccess("");
  };

  const handleInterviewFormChange = (event) => {
    const { name, value } = event.target;

    setInterviewForm((current) => ({
      ...current,
      [name]: value,
    }));
  };

  /* =======================================================
     SCHEDULE INTERVIEW
     ======================================================= */

  const handleScheduleInterview = async (event) => {
    event.preventDefault();

    const applicationId = getApplicationId(selectedApplication);

    if (!applicationId) {
      setInterviewError("Application ID not found.");

      return;
    }

    if (!interviewForm.scheduledAt) {
      setInterviewError("Please select an interview date and time.");

      return;
    }

    try {
      setInterviewLoading(true);

      setInterviewError("");

      setInterviewSuccess("");

      const payload = {
        applicationId,

        scheduledAt: new Date(interviewForm.scheduledAt).toISOString(),

        durationMinutes: Number(interviewForm.durationMinutes) || 30,

        meetingLink: interviewForm.meetingLink?.trim() || null,

        notes: interviewForm.notes?.trim() || null,
      };

      await interviewApi.create(payload);

      setInterviewSuccess("Interview scheduled successfully.");

      setApplications((current) =>
        current.map((item) =>
          String(getApplicationId(item)) === String(applicationId)
            ? {
                ...item,

                status: "Interview",

                applicationStatus: "Interview",
              }
            : item,
        ),
      );

      setSelectedApplication((current) =>
        current
          ? {
              ...current,

              status: "Interview",

              applicationStatus: "Interview",
            }
          : current,
      );

      setTimeout(() => {
        setInterviewModalOpen(false);

        setInterviewSuccess("");
      }, 1200);
    } catch (err) {
      console.error("Unable to schedule interview:", err);

      setInterviewError(err?.message || "Unable to schedule interview.");
    } finally {
      setInterviewLoading(false);
    }
  };

  /* =======================================================
     AUTH GUARD
     ======================================================= */

  if (!session || role !== "Company") {
    return <Navigate to="/login" replace />;
  }

  /* =======================================================
     RENDER
     ======================================================= */

  return (
    <div className="company-application-page">
      {/* ===================================================
          SIDEBAR
      =================================================== */}

      <CompanySidebar company={company} />

      {/* ===================================================
          MAIN
      =================================================== */}

      <main className="company-application-main">
        {/* =================================================
            HEADER
        ================================================= */}

        <CompanyHeader
          company={company}
          setCompany={setCompany}
          pageTitle="Applications"
          pageSubtitle="Review candidates, analyze applications and manage your hiring process."
        />

        <div className="company-application-content">
          {/* =================================================
              PAGE HEADER
          ================================================= */}

          <section className="company-application-header">
            <div>
              <span className="company-application-eyebrow">
                Candidate Management
              </span>

              <h1>Applications</h1>

              <p>
                Review incoming applications, evaluate candidates and move
                strong profiles forward.
              </p>
            </div>

            <button
              type="button"
              className="company-application-refresh"
              onClick={() => loadApplications(true)}
              disabled={refreshing}
            >
              <RefreshCw
                size={15}
                className={refreshing ? "is-spinning" : ""}
              />

              {refreshing ? "Refreshing..." : "Refresh"}
            </button>
          </section>

          {/* =================================================
              ERROR
          ================================================= */}

          {error && (
            <div className="company-application-error">
              <span>{error}</span>

              <button
                type="button"
                onClick={() => setError("")}
                aria-label="Close error"
              >
                <X size={16} />
              </button>
            </div>
          )}

          {/* =================================================
              STATS
          ================================================= */}

          <section className="company-application-stats">
            {/* TOTAL */}
            <div className="company-application-stat-card">
              <div className="company-application-stat-icon">
                <Users size={18} />
              </div>

              <div>
                <span>Total Applications</span>

                <strong>{applications.length}</strong>
              </div>
            </div>

            {/* PENDING */}
            <div className="company-application-stat-card">
              <div className="company-application-stat-icon">
                <RefreshCw size={18} />
              </div>

              <div>
                <span>Pending Review</span>

                <strong>
                  {
                    applications.filter((application) =>
                      getApplicationStatus(application)
                        .toLowerCase()
                        .includes("pending"),
                    ).length
                  }
                </strong>
              </div>
            </div>

            {/* SHORTLISTED */}
            <div className="company-application-stat-card">
              <div className="company-application-stat-icon">
                <Award size={18} />
              </div>

              <div>
                <span>Shortlisted</span>

                <strong>
                  {
                    applications.filter((application) =>
                      getApplicationStatus(application)
                        .toLowerCase()
                        .includes("shortlist"),
                    ).length
                  }
                </strong>
              </div>
            </div>

            {/* OPEN JOBS */}
            <div className="company-application-stat-card">
              <div className="company-application-stat-icon">
                <BriefcaseBusiness size={18} />
              </div>

              <div>
                <span>Open Jobs</span>

                <strong>{jobs.length}</strong>
              </div>
            </div>
          </section>

          {/* =================================================
              FILTER TOOLBAR
          ================================================= */}

          <section className="company-application-toolbar">
            <div className="company-application-search">
              <Search size={17} />

              <input
                type="text"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search candidate, job or email..."
              />
            </div>

            <div className="company-application-filters">
              <select
                value={statusFilter}
                onChange={(event) => setStatusFilter(event.target.value)}
              >
                <option value="all">All Status</option>

                <option value="pending">Pending</option>

                <option value="shortlisted">Shortlisted</option>

                <option value="interview">Interview</option>

                <option value="rejected">Rejected</option>
              </select>

              <select
                value={jobFilter}
                onChange={(event) => setJobFilter(event.target.value)}
              >
                <option value="all">All Jobs</option>

                {jobs.map((job) => {
                  const jobId = job?.id || job?.jobId || job?.Id || job?.JobId;

                  return (
                    <option key={jobId} value={jobId}>
                      {job?.title || job?.Title || "Untitled Job"}
                    </option>
                  );
                })}
              </select>
            </div>
          </section>

          {/* =================================================
              APPLICATION LIST
          ================================================= */}

          {loading ? (
            <div className="company-application-state">
              <RefreshCw size={22} className="is-spinning" />

              <span>Loading applications...</span>
            </div>
          ) : filteredApplications.length === 0 ? (
            <div className="company-application-empty">
              <div className="company-application-empty-icon">
                <Users size={25} />
              </div>

              <h3>No applications found</h3>

              <p>
                Applications matching your current filters will appear here.
              </p>
            </div>
          ) : (
            <section className="company-application-list">
              {filteredApplications.map((application) => {
                const applicationId = getApplicationId(application);

                const candidateName = getCandidateName(application);

                const jobTitle = getJobTitle(application);

                const status = getApplicationStatus(application);

                const email =
                  application?.email ||
                  application?.candidateEmail ||
                  application?.Email ||
                  "Email not available";

                const contact =
                  application?.contact ||
                  application?.phone ||
                  application?.phoneNumber ||
                  application?.Contact ||
                  application?.Phone ||
                  "Not available";

                const qualification =
                  application?.qualification ||
                  application?.Qualification ||
                  "Not specified";

                const experience =
                  application?.experience ?? application?.Experience ?? 0;

                const skills = normalizeList(
                  application?.skills || application?.Skills,
                );

                const appliedAt =
                  application?.appliedAt ||
                  application?.createdAt ||
                  application?.AppliedAt ||
                  application?.CreatedAt;

                const resumeFileName =
                  application?.resumeFileName ||
                  application?.ResumeFileName ||
                  "Resume";

                return (
                  <article
                    key={applicationId}
                    className="company-application-card"
                    onClick={() => openApplication(application)}
                  >
                    {/* ===================================
                          CANDIDATE ICON
                      =================================== */}

                    <div className="company-application-avatar">
                      {candidateName?.trim()?.charAt(0)?.toUpperCase() || "C"}
                    </div>

                    {/* ===================================
                          CANDIDATE INFORMATION
                      =================================== */}

                    <div className="company-application-info">
                      <div className="company-application-title-row">
                        <div className="company-application-title-info">
                          <h3>{candidateName}</h3>

                          <span>{jobTitle}</span>
                        </div>

                        <span
                          className={`company-application-status ${getStatusClass(
                            status,
                          )}`}
                        >
                          {status}
                        </span>
                      </div>

                      {/* =============================
                            APPLICATION META
                        ============================== */}

                      {/* <div className="company-application-meta">
                        <span>
                          <BriefcaseBusiness size={14} />
                          {experience}{" "}
                          {Number(experience) === 1 ? "year" : "years"}
                        </span>

                        <span>
                          <Mail size={14} />

                          {email}
                        </span>

                        <span>
                          <CalendarDays size={14} />
                          Applied {formatDate(appliedAt)}
                        </span>
                      </div> */}

                      {/* =============================
                            SKILLS
                        ============================== */}

                      {/* {skills.length > 0 && (
                        <div className="company-application-skills">
                          {skills.slice(0, 5).map((skill) => (
                            <span key={skill}>{skill}</span>
                          ))}

                          {skills.length > 5 && (
                            <span>+{skills.length - 5}</span>
                          )}
                        </div>
                      )} */}
                    </div>

                    {/* ===================================
                          ACTIONS
                      =================================== */}

                    <div className="company-application-actions">
                      {/* CHAT */}

                      <button
                        type="button"
                        className="company-application-chat-button"
                        title={`Message ${candidateName || "candidate"}`}
                        aria-label={`Message ${candidateName || "candidate"}`}
                        onClick={(event) => {
                          event.stopPropagation();

                          handleOpenCandidateChat(application);
                        }}
                      >
                        <MessageCircle size={16} />
                      </button>

                      {/* RESUME */}

                      <button
                        type="button"
                        className="company-application-resume-button"
                        title="Download resume"
                        aria-label="Download resume"
                        onClick={(event) => {
                          event.stopPropagation();

                          handleDownloadResume(application);
                        }}
                        disabled={resumeLoadingId === applicationId}
                      >
                        {resumeLoadingId === applicationId ? (
                          <RefreshCw size={15} className="is-spinning" />
                        ) : (
                          <Download size={15} />
                        )}
                      </button>

                      {/* VIEW */}

                      <button
                        type="button"
                        className="company-application-view-button"
                        onClick={(event) => {
                          event.stopPropagation();

                          openApplication(application);
                        }}
                      >
                        View
                        <ChevronRight size={15} />
                      </button>
                    </div>
                  </article>
                );
              })}
            </section>
          )}
        </div>
      </main>

      {/* =====================================================
          APPLICATION DETAILS MODAL
      ===================================================== */}

      {selectedApplication && (
        <div
          className="company-application-modal-overlay"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
              closeApplication();
            }
          }}
        >
          <div className="company-application-modal">
            {/* ===============================================
                MODAL HEADER
            =============================================== */}

            <div className="company-application-modal-header">
              <div>
                <span className="company-application-eyebrow">
                  Candidate Application
                </span>

                <h2>{getCandidateName(selectedApplication)}</h2>

                <p>{getJobTitle(selectedApplication)}</p>
              </div>

              <button
                type="button"
                className="company-application-modal-close"
                onClick={closeApplication}
                aria-label="Close"
              >
                <X size={19} />
              </button>
            </div>

            {/* ===============================================
                MODAL BODY
            =============================================== */}

            <div className="company-application-modal-body">
              {/* =============================================
                  STATUS
              ============================================= */}

              <div className="company-application-modal-status-row">
                <span>Application Status</span>

                <strong
                  className={`company-application-status ${getStatusClass(
                    getApplicationStatus(selectedApplication),
                  )}`}
                >
                  {getApplicationStatus(selectedApplication)}
                </strong>
              </div>

              {/* =============================================
                  CANDIDATE DETAILS
              ============================================= */}

              <section className="company-application-modal-section">
                <div className="company-application-section-heading">
                  <div>
                    <span>Candidate</span>

                    <h4>Candidate Details</h4>
                  </div>
                </div>

                <div className="company-application-detail-grid">
                  <div>
                    <span>Applied For</span>

                    <strong>{getJobTitle(selectedApplication)}</strong>
                  </div>

                  <div>
                    <span>Email</span>

                    <strong>
                      {selectedApplication?.email ||
                        selectedApplication?.candidateEmail ||
                        selectedApplication?.Email ||
                        "Not available"}
                    </strong>
                  </div>

                  <div>
                    <span>Contact</span>

                    <strong>
                      {selectedApplication?.contact ||
                        selectedApplication?.phone ||
                        selectedApplication?.phoneNumber ||
                        selectedApplication?.Contact ||
                        selectedApplication?.Phone ||
                        "Not available"}
                    </strong>
                  </div>

                  <div>
                    <span>Qualification</span>

                    <strong>
                      {selectedApplication?.qualification ||
                        selectedApplication?.Qualification ||
                        "Not specified"}
                    </strong>
                  </div>

                  <div>
                    <span>Course</span>

                    <strong>
                      {selectedApplication?.course ||
                        selectedApplication?.Course ||
                        "Not specified"}
                    </strong>
                  </div>

                  <div>
                    <span>College</span>

                    <strong>
                      {selectedApplication?.collegeName ||
                        selectedApplication?.college ||
                        selectedApplication?.CollegeName ||
                        "Not specified"}
                    </strong>
                  </div>

                  <div>
                    <span>Experience</span>

                    <strong>
                      {selectedApplication?.experience ??
                        selectedApplication?.Experience ??
                        0}{" "}
                      years
                    </strong>
                  </div>

                  <div>
                    <span>Applied On</span>

                    <strong>
                      {formatDate(
                        selectedApplication?.appliedAt ||
                          selectedApplication?.createdAt ||
                          selectedApplication?.AppliedAt ||
                          selectedApplication?.CreatedAt,
                      )}
                    </strong>
                  </div>
                </div>
              </section>

              {/* =============================================
                  SKILLS
              ============================================= */}

              <section className="company-application-modal-section">
                <div className="company-application-section-heading">
                  <div>
                    <span>Skills</span>

                    <h4>Candidate Skills</h4>
                  </div>
                </div>

                <div className="company-application-modal-skills">
                  {normalizeList(
                    selectedApplication?.skills || selectedApplication?.Skills,
                  ).length > 0 ? (
                    normalizeList(
                      selectedApplication?.skills ||
                        selectedApplication?.Skills,
                    ).map((skill) => <span key={skill}>{skill}</span>)
                  ) : (
                    <p>No skills available.</p>
                  )}
                </div>
              </section>

              {/* =============================================
                  RESUME
              ============================================= */}

              <section className="company-application-modal-section">
                <div className="company-application-section-heading">
                  <div>
                    <span>Resume</span>

                    <h4>Application Resume</h4>
                  </div>

                  <button
                    type="button"
                    className="company-application-download"
                    onClick={() => handleDownloadResume(selectedApplication)}
                    disabled={
                      resumeLoadingId === getApplicationId(selectedApplication)
                    }
                  >
                    {resumeLoadingId ===
                    getApplicationId(selectedApplication) ? (
                      <RefreshCw size={15} className="is-spinning" />
                    ) : (
                      <Download size={15} />
                    )}

                    {resumeLoadingId === getApplicationId(selectedApplication)
                      ? "Downloading..."
                      : "Download"}
                  </button>
                </div>
              </section>

              {/* =============================================
                  AI ANALYSIS
              ============================================= */}

              <section className="company-application-modal-section company-application-ai-section">
                <div className="company-application-section-heading">
                  <div>
                    <span>
                      {aiAnalysis?.analysisMode === "Local"
                        ? "Local Job Match Review"
                        : "Gemini AI"}
                    </span>

                    <h4>AI Candidate Analysis</h4>
                  </div>

                  <Sparkles size={19} />
                </div>

                <p className="company-application-ai-description">
                  AI evaluates the candidate against the job requirements using
                  the application details and immutable resume snapshot.
                </p>

                <button
                  type="button"
                  className="company-application-ai-button"
                  onClick={() => handleAIAnalysis(selectedApplication)}
                  disabled={aiLoading}
                >
                  {aiLoading ? (
                    <>
                      <RefreshCw size={16} className="is-spinning" />
                      Analyzing...
                    </>
                  ) : (
                    <>
                      <Sparkles size={16} />
                      Analyze with AI
                    </>
                  )}
                </button>

                {/* =========================================
                    AI RESULT
                ========================================= */}

                {aiAnalysis && (
                  <div className="company-application-ai-result">
                    {/* =======================================
                        AI JOB MATCH SCORE
                    ======================================= */}

                    {aiAnalysis.jobMatchScore !== undefined &&
                      aiAnalysis.jobMatchScore !== null && (
                        <div className="company-application-ai-match-score">
                          <div className="company-application-ai-match-score-circle">
                            {Math.round(
                              Math.min(
                                Math.max(
                                  Number(aiAnalysis.jobMatchScore) || 0,
                                  0,
                                ),
                                100,
                              ),
                            )}

                            <span>%</span>
                          </div>

                          <div>
                            <span>
                              {aiAnalysis.analysisMode === "Local"
                                ? "Local Job Match Score"
                                : "AI Job Match Score"}
                            </span>

                            <strong>
                              {Math.round(
                                Math.min(
                                  Math.max(
                                    Number(aiAnalysis.jobMatchScore) || 0,
                                    0,
                                  ),
                                  100,
                                ),
                              )}
                              %
                            </strong>

                            <small>
                              {aiAnalysis.analysisMode === "Local"
                                ? "Evidence-based requirement comparison"
                                : "Semantic job-fit assessment"}
                            </small>
                          </div>
                        </div>
                      )}

                    {/* =======================================
                        SUMMARY
                    ======================================= */}

                    {aiAnalysis.summary && (
                      <div className="company-application-ai-block">
                        <h5>
                          {aiAnalysis.analysisMode === "Local"
                            ? "Job Match Summary"
                            : "AI Summary"}
                        </h5>

                        <p>{aiAnalysis.summary}</p>
                      </div>
                    )}

                    {/* =======================================
                        STRENGTHS
                    ======================================= */}

                    {normalizeList(aiAnalysis.strengths).length > 0 && (
                      <div className="company-application-ai-block">
                        <h5>Strengths</h5>

                        <ul>
                          {normalizeList(aiAnalysis.strengths).map(
                            (item, index) => (
                              <li key={`${item}-${index}`}>{item}</li>
                            ),
                          )}
                        </ul>
                      </div>
                    )}

                    {/* =======================================
                        MATCHED SKILLS
                    ======================================= */}

                    {normalizeList(aiAnalysis.matchedSkills).length > 0 && (
                      <div className="company-application-ai-block">
                        <h5>Matching Skills</h5>

                        <ul>
                          {normalizeList(aiAnalysis.matchedSkills).map(
                            (item, index) => (
                              <li key={`${item}-${index}`}>{item}</li>
                            ),
                          )}
                        </ul>
                      </div>
                    )}

                    {/* =======================================
                        MISSING SKILLS
                    ======================================= */}

                    {normalizeList(aiAnalysis.missingSkills).length > 0 && (
                      <div className="company-application-ai-block">
                        <h5>Missing Skills</h5>

                        <ul>
                          {normalizeList(aiAnalysis.missingSkills).map(
                            (item, index) => (
                              <li key={`${item}-${index}`}>{item}</li>
                            ),
                          )}
                        </ul>
                      </div>
                    )}

                    {/* =======================================
                        SUGGESTIONS
                    ======================================= */}

                    {normalizeList(aiAnalysis.suggestions).length > 0 && (
                      <div className="company-application-ai-block">
                        <h5>Suggestions / Improvement</h5>

                        <ul>
                          {normalizeList(aiAnalysis.suggestions).map(
                            (item, index) => (
                              <li key={`${item}-${index}`}>{item}</li>
                            ),
                          )}
                        </ul>
                      </div>
                    )}

                    {/* =======================================
                        INTERVIEW FOCUS
                    ======================================= */}

                    {normalizeList(aiAnalysis.interviewFocus).length > 0 && (
                      <div className="company-application-ai-block">
                        <h5>Interview Preparation</h5>

                        <ul>
                          {normalizeList(aiAnalysis.interviewFocus).map(
                            (item, index) => (
                              <li key={`${item}-${index}`}>{item}</li>
                            ),
                          )}
                        </ul>
                      </div>
                    )}
                  </div>
                )}
              </section>

              {/* =============================================
                  INTERVIEW
              ============================================= */}

              <section className="company-application-modal-section">
                <div className="company-application-section-heading">
                  <div>
                    <span>Next Step</span>

                    <h4>Interview</h4>
                  </div>
                </div>

                <div className="company-application-interview-actions">
                  <button
                    type="button"
                    className="company-application-interview-button"
                    onClick={() => openInterviewModal(selectedApplication)}
                  >
                    <CalendarDays size={16} />
                    Schedule Interview
                  </button>

                  <button
                    type="button"
                    className="company-application-chat-secondary-button"
                    onClick={() => handleOpenCandidateChat(selectedApplication)}
                  >
                    <MessageCircle size={16} />
                    Message Candidate
                  </button>
                </div>
              </section>
            </div>
          </div>
        </div>
      )}

      {/* =====================================================
          INTERVIEW MODAL
      ===================================================== */}

      {interviewModalOpen && selectedApplication && (
        <div
          className="company-interview-modal-overlay"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
              closeInterviewModal();
            }
          }}
        >
          <div className="company-interview-modal">
            {/* =============================================
                  INTERVIEW HEADER
              ============================================= */}

            <div className="company-interview-modal-header">
              <div>
                <span>Interview</span>

                <h3>Schedule Interview</h3>

                <p>
                  {getCandidateName(selectedApplication)} ·{" "}
                  {getJobTitle(selectedApplication)}
                </p>
              </div>

              <button
                type="button"
                onClick={closeInterviewModal}
                aria-label="Close"
              >
                <X size={18} />
              </button>
            </div>

            {/* =============================================
                  INTERVIEW FORM
              ============================================= */}

            <form
              className="company-interview-form"
              onSubmit={handleScheduleInterview}
            >
              {interviewError && (
                <div className="company-interview-error">{interviewError}</div>
              )}

              {interviewSuccess && (
                <div className="company-interview-success">
                  {interviewSuccess}
                </div>
              )}

              <label>
                <span>Date & Time</span>

                <input
                  type="datetime-local"
                  name="scheduledAt"
                  value={interviewForm.scheduledAt}
                  onChange={handleInterviewFormChange}
                  required
                />
              </label>

              <label>
                <span>Duration</span>

                <select
                  name="durationMinutes"
                  value={interviewForm.durationMinutes}
                  onChange={handleInterviewFormChange}
                >
                  <option value="15">15 minutes</option>

                  <option value="30">30 minutes</option>

                  <option value="45">45 minutes</option>

                  <option value="60">60 minutes</option>

                  <option value="90">90 minutes</option>
                </select>
              </label>

              <label>
                <span>Meeting Link</span>

                <input
                  type="url"
                  name="meetingLink"
                  value={interviewForm.meetingLink}
                  onChange={handleInterviewFormChange}
                  placeholder="https://meet.google.com/..."
                />
              </label>

              <label>
                <span>Notes</span>

                <textarea
                  name="notes"
                  value={interviewForm.notes}
                  onChange={handleInterviewFormChange}
                  rows="4"
                  placeholder="Add interview instructions or notes..."
                />
              </label>

              <div className="company-interview-form-actions">
                <button
                  type="button"
                  onClick={closeInterviewModal}
                  disabled={interviewLoading}
                >
                  Cancel
                </button>

                <button type="submit" disabled={interviewLoading}>
                  {interviewLoading ? (
                    <>
                      <RefreshCw size={15} className="is-spinning" />
                      Scheduling...
                    </>
                  ) : (
                    <>
                      <CalendarDays size={15} />
                      Schedule Interview
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default CompanyApplication;
