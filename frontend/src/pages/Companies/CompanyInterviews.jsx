import { useEffect, useMemo, useState } from "react";

import { Link, Navigate } from "react-router-dom";

import {
  CalendarDays,
  CheckCircle2,
  Clock3,
  ExternalLink,
  Filter,
  Mail,
  MapPin,
  MessageSquare,
  Plus,
  RefreshCw,
  Search,
  UserRound,
  Users,
  Video,
  X,
  XCircle,
  Phone,
} from "lucide-react";

import CompanySidebar from "../../components/Company/CompanySidebar";
import CompanyHeader from "../../components/Company/CompanyHeader";

import { companyApi, jobsApi, interviewApi } from "../../services/api.js";

import "../../styles/CompanyCSS/CompanyInterviews.css";

export default function CompanyInterviews() {
  // =======================================================
  // SESSION
  // =======================================================

  const session = JSON.parse(sessionStorage.getItem("user") || "null");

  const userId = session?.userId || tokenUserId(session?.token);

  // =======================================================
  // STATE
  // =======================================================

  const [company, setCompany] = useState(null);

  const [jobs, setJobs] = useState([]);

  const [applications, setApplications] = useState([]);

  const [interviews, setInterviews] = useState([]);

  const [selectedStatus, setSelectedStatus] = useState("all");

  const [selectedJob, setSelectedJob] = useState("all");

  const [search, setSearch] = useState("");

  const [loading, setLoading] = useState(true);

  const [refreshing, setRefreshing] = useState(false);

  const [applicationsLoading, setApplicationsLoading] = useState(false);

  const [error, setError] = useState("");

  const [showScheduleModal, setShowScheduleModal] = useState(false);

  const [selectedInterview, setSelectedInterview] = useState(null);

  const [scheduleLoading, setScheduleLoading] = useState(false);

  const [interviewForm, setInterviewForm] = useState({
    applicationId: "",
    round: "Technical",
    interviewType: "Online",
    scheduledAt: "",
    durationMinutes: 30,
    meetingLink: "",
    location: "",
    instructions: "",
  });

  // =======================================================
  // INITIAL LOAD
  // =======================================================

  useEffect(() => {
    if (!userId) {
      setLoading(false);

      setError("Unable to identify the logged-in company.");

      return;
    }

    loadInterviewData();
  }, [userId]);

  // =======================================================
  // LOAD ALL DATA
  // =======================================================

  async function loadInterviewData() {
    setLoading(true);
    setError("");

    try {
      const [companyResult, jobsResult] = await Promise.all([
        companyApi.byUser(userId),
        jobsApi.all(),
      ]);

      setCompany(companyResult);

      const allJobs = Array.isArray(jobsResult)
        ? jobsResult
        : Array.isArray(jobsResult?.data)
          ? jobsResult.data
          : [];

      // ---------------------------------------------------
      // Company jobs
      // ---------------------------------------------------

      const companyId = companyResult?.id;

      const companyJobs = companyId
        ? allJobs.filter(
            (job) =>
              String(job?.companyId).toLowerCase() ===
              String(companyId).toLowerCase(),
          )
        : [];

      setJobs(companyJobs);

      // ---------------------------------------------------
      // IMPORTANT:
      // Applications are loaded ONLY after company jobs
      // are known.
      // ---------------------------------------------------

      await Promise.all([
        loadApplications(companyJobs),

        loadInterviews(companyJobs),
      ]);
    } catch (err) {
      console.error("Company interview loading error:", err);

      setError(err?.message || "Unable to load company interview information.");
    } finally {
      setLoading(false);
    }
  }

  // =======================================================
  // LOAD COMPANY APPLICATIONS
  // =======================================================

  async function loadApplications(companyJobs = jobs) {
    setApplicationsLoading(true);

    try {
      // ---------------------------------------------------
      // No jobs
      // ---------------------------------------------------

      if (!Array.isArray(companyJobs) || companyJobs.length === 0) {
        setApplications([]);

        return;
      }

      // ---------------------------------------------------
      // Extract job IDs
      // ---------------------------------------------------

      const companyJobIds = companyJobs.map((job) => job?.id).filter(Boolean);

      if (companyJobIds.length === 0) {
        setApplications([]);

        return;
      }

      console.log("Loading applications for company jobs:", companyJobIds);

      // ---------------------------------------------------
      // IMPORTANT FIX
      //
      // Do NOT call applicationApi.all()
      //
      // Your backend currently exposes:
      //
      // GET /api/Application/job/{jobId}
      //
      // companyApi.applications() calls that endpoint
      // for every company job and combines the results.
      // ---------------------------------------------------

      const result = await companyApi.applications(companyJobIds);

      const data = Array.isArray(result)
        ? result
        : Array.isArray(result?.data)
          ? result.data
          : [];

      console.log("Company applications loaded:", data);

      setApplications(data);
    } catch (err) {
      console.error("Application loading error:", err);

      setApplications([]);

      setError(err?.message || "Unable to load candidate applications.");
    } finally {
      setApplicationsLoading(false);
    }
  }

  // =======================================================
  // LOAD INTERVIEWS
  // =======================================================

  async function loadInterviews(companyJobs = jobs) {
    try {
      const result = await interviewApi.company();

      const data = Array.isArray(result)
        ? result
        : Array.isArray(result?.data)
          ? result.data
          : [];

      const companyJobIds = new Set(
        companyJobs.map((job) => String(job.id).toLowerCase()),
      );

      const filtered = data.filter((interview) => {
        if (!interview?.jobId) {
          return true;
        }

        return companyJobIds.has(String(interview.jobId).toLowerCase());
      });

      setInterviews(
        filtered.sort(
          (a, b) => new Date(a.scheduledAt || 0) - new Date(b.scheduledAt || 0),
        ),
      );
    } catch (err) {
      console.error("Interview loading error:", err);

      setError(err?.message || "Unable to load interviews.");
    }
  }

  // =======================================================
  // REFRESH
  // =======================================================

  async function handleRefresh() {
    setRefreshing(true);
    setError("");

    try {
      await Promise.all([loadApplications(jobs), loadInterviews(jobs)]);
    } finally {
      setRefreshing(false);
    }
  }

  // =======================================================
  // APPLICATION HELPERS
  // =======================================================

  function getApplicationId(application) {
    return (
      application?.id ||
      application?.applicationId ||
      application?.application?.id ||
      null
    );
  }

  function getApplicationJobId(application) {
    return (
      application?.jobId ||
      application?.job?.id ||
      application?.application?.jobId ||
      null
    );
  }

  function getApplicationCandidateName(application) {
    return (
      application?.candidateName ||
      application?.name ||
      application?.candidate?.name ||
      application?.userName ||
      application?.user?.name ||
      "Candidate"
    );
  }

  function getApplicationCandidateEmail(application) {
    return (
      application?.candidateEmail ||
      application?.email ||
      application?.candidate?.email ||
      application?.user?.email ||
      "-"
    );
  }

  function getApplicationContact(application) {
    return (
      application?.contact ||
      application?.phone ||
      application?.candidate?.contact ||
      application?.candidate?.phone ||
      application?.user?.phone ||
      "-"
    );
  }

  function getApplicationJobTitle(application) {
    const jobId = getApplicationJobId(application);

    return (
      application?.jobTitle || application?.job?.title || getJobTitle(jobId)
    );
  }

  function getApplicationStatus(application) {
    return application?.status || application?.applicationStatus || "Applied";
  }

  // =======================================================
  // SCHEDULED APPLICATION IDS
  // =======================================================

  const scheduledApplicationIds = useMemo(() => {
    return new Set(
      interviews
        .map(
          (interview) => interview?.applicationId || interview?.application?.id,
        )
        .filter(Boolean)
        .map((id) => String(id).toLowerCase()),
    );
  }, [interviews]);

  // =======================================================
  // FILTER APPLICATIONS
  // =======================================================

  const schedulableApplications = useMemo(() => {
    return applications.filter((application) => {
      const status = String(getApplicationStatus(application)).toLowerCase();

      // Rejected/Hired candidates
      // should not normally be scheduled.
      return status !== "rejected" && status !== "hired";
    });
  }, [applications]);

  // =======================================================
  // FILTER INTERVIEWS
  // =======================================================

  const filteredInterviews = useMemo(() => {
    const query = search.trim().toLowerCase();

    return interviews.filter((interview) => {
      const status = normalizeStatus(interview.status);

      const matchesStatus =
        selectedStatus === "all" || status === selectedStatus;

      const matchesJob =
        selectedJob === "all" ||
        String(interview.jobId).toLowerCase() ===
          String(selectedJob).toLowerCase();

      if (!matchesStatus || !matchesJob) {
        return false;
      }

      if (!query) {
        return true;
      }

      const searchableText = `
            ${interview.candidateName || ""}
            ${interview.name || ""}
            ${interview.email || ""}
            ${interview.contact || ""}
            ${interview.jobTitle || ""}
            ${interview.round || ""}
            ${interview.interviewType || ""}
            ${interview.status || ""}
          `.toLowerCase();

      return searchableText.includes(query);
    });
  }, [interviews, selectedStatus, selectedJob, search]);

  // =======================================================
  // STATS
  // =======================================================

  const totalInterviews = interviews.length;

  const scheduledInterviews = interviews.filter(
    (interview) => normalizeStatus(interview.status) === "scheduled",
  ).length;

  const completedInterviews = interviews.filter(
    (interview) => normalizeStatus(interview.status) === "completed",
  ).length;

  const cancelledInterviews = interviews.filter((interview) => {
    const status = normalizeStatus(interview.status);

    return status === "cancelled" || status === "canceled";
  }).length;

  // =======================================================
  // JOB HELPERS
  // =======================================================

  function getJobTitle(jobId) {
    const job = jobs.find(
      (item) => String(item.id).toLowerCase() === String(jobId).toLowerCase(),
    );

    return job?.title || "Unknown Position";
  }

  // =======================================================
  // INTERVIEW HELPERS
  // =======================================================

  function getCandidateName(interview) {
    return (
      interview?.candidateName ||
      interview?.name ||
      interview?.candidate?.name ||
      "Candidate"
    );
  }

  function getCandidateEmail(interview) {
    return (
      interview?.candidateEmail ||
      interview?.email ||
      interview?.candidate?.email ||
      "-"
    );
  }

  function getInterviewType(interview) {
    return interview?.interviewType || interview?.type || "Online";
  }

  function normalizeStatus(status) {
    return String(status || "Scheduled")
      .trim()
      .toLowerCase();
  }

  function getStatusClass(status) {
    const normalized = normalizeStatus(status);

    if (normalized === "completed") {
      return "completed";
    }

    if (normalized === "cancelled" || normalized === "canceled") {
      return "cancelled";
    }

    if (normalized === "rescheduled") {
      return "rescheduled";
    }

    return "scheduled";
  }

  function formatDateTime(value) {
    if (!value) {
      return {
        date: "-",
        time: "-",
      };
    }

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
      return {
        date: "-",
        time: "-",
      };
    }

    return {
      date: date.toLocaleDateString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      }),

      time: date.toLocaleTimeString("en-IN", {
        hour: "2-digit",
        minute: "2-digit",
      }),
    };
  }

  // =======================================================
  // OPEN SCHEDULE MODAL
  // =======================================================

  async function openScheduleModal() {
    setSelectedInterview(null);

    setInterviewForm({
      applicationId: "",
      round: "Technical",
      interviewType: "Online",
      scheduledAt: "",
      durationMinutes: 30,
      meetingLink: "",
      location: "",
      instructions: "",
    });

    setShowScheduleModal(true);

    setError("");

    // Refresh applications every time
    // the modal is opened.

    await loadApplications(jobs);
  }

  // =======================================================
  // CLOSE MODAL
  // =======================================================

  function closeScheduleModal() {
    if (scheduleLoading) {
      return;
    }

    setShowScheduleModal(false);

    setSelectedInterview(null);
  }

  // =======================================================
  // FORM CHANGE
  // =======================================================

  function handleFormChange(event) {
    const { name, value } = event.target;

    setInterviewForm((previous) => ({
      ...previous,
      [name]: value,
    }));
  }

  // =======================================================
  // SCHEDULE INTERVIEW
  // =======================================================

  async function handleScheduleInterview(event) {
    event.preventDefault();

    setError("");

    if (!interviewForm.applicationId) {
      setError("Please select an application.");

      return;
    }

    if (!interviewForm.scheduledAt) {
      setError("Please select interview date and time.");

      return;
    }

    const selectedDate = new Date(interviewForm.scheduledAt);

    if (Number.isNaN(selectedDate.getTime()) || selectedDate <= new Date()) {
      setError("Interview must be scheduled for a future date and time.");

      return;
    }

    if (
      interviewForm.interviewType === "Online" &&
      !interviewForm.meetingLink.trim()
    ) {
      setError("Meeting link is required for online interviews.");

      return;
    }

    if (
      interviewForm.interviewType === "InPerson" &&
      !interviewForm.location.trim()
    ) {
      setError("Location is required for in-person interviews.");

      return;
    }

    // -----------------------------------------------------
    // Prevent duplicate interview
    // -----------------------------------------------------

    if (
      scheduledApplicationIds.has(
        String(interviewForm.applicationId).toLowerCase(),
      )
    ) {
      setError("An interview is already scheduled for this application.");

      return;
    }

    try {
      setScheduleLoading(true);

      const payload = {
        applicationId: interviewForm.applicationId,

        round: interviewForm.round,

        interviewType: interviewForm.interviewType,

        scheduledAt: selectedDate.toISOString(),

        durationMinutes: Number(interviewForm.durationMinutes),

        meetingLink:
          interviewForm.interviewType === "Online"
            ? interviewForm.meetingLink.trim()
            : null,

        location:
          interviewForm.interviewType === "InPerson"
            ? interviewForm.location.trim()
            : null,

        instructions: interviewForm.instructions.trim() || null,
      };

      console.log("Creating interview:", payload);

      await interviewApi.create(payload);

      setShowScheduleModal(false);

      setInterviewForm({
        applicationId: "",
        round: "Technical",
        interviewType: "Online",
        scheduledAt: "",
        durationMinutes: 30,
        meetingLink: "",
        location: "",
        instructions: "",
      });

      await loadInterviews(jobs);

      // Refresh applications too
      await loadApplications(jobs);
    } catch (err) {
      console.error("Schedule interview failed:", err);

      setError(err?.message || "Unable to schedule interview.");
    } finally {
      setScheduleLoading(false);
    }
  }

  // =======================================================
  // UPDATE INTERVIEW STATUS
  // =======================================================

  async function handleStatusChange(interview, status) {
    if (!interview?.id) {
      return;
    }

    try {
      setError("");

      await interviewApi.updateStatus(interview.id, status);

      await loadInterviews(jobs);

      if (
        selectedInterview &&
        String(selectedInterview.id) === String(interview.id)
      ) {
        setSelectedInterview({
          ...selectedInterview,
          status,
        });
      }
    } catch (err) {
      console.error("Interview status update failed:", err);

      setError(err?.message || "Unable to update interview status.");
    }
  }

  // =======================================================
  // AUTH
  // =======================================================

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

  // =======================================================
  // LOADING
  // =======================================================

  if (loading) {
    return (
      <div className="company-interviews-loading">
        <div className="company-interviews-spinner" />

        <span>Loading interviews...</span>
      </div>
    );
  }

  // =======================================================
  // UI
  // =======================================================

  return (
    <div className="company-interviews-page">
      <CompanySidebar company={company} />

      <div className="company-interviews-main">
        <CompanyHeader
          company={company}
          setCompany={setCompany}
          pageTitle="Interviews"
          pageSubtitle="Schedule, manage and track candidate interviews."
        />

        <main className="company-interviews-content">
          {/* =================================================
              ACTIONS
          ================================================= */}

          <div className="company-interviews-heading-action">
            <Link
              to="/company/applications"
              className="company-interviews-secondary-btn"
            >
              <Users />
              View Applications
            </Link>

            <button
              type="button"
              className="company-interviews-secondary-btn"
              onClick={handleRefresh}
              disabled={refreshing}
            >
              <RefreshCw
                className={refreshing ? "company-interviews-refresh-icon" : ""}
              />

              {refreshing ? "Refreshing..." : "Refresh"}
            </button>

            <button
              type="button"
              className="company-interviews-primary-btn"
              onClick={openScheduleModal}
            >
              <Plus />
              Schedule Interview
            </button>
          </div>

          {/* =================================================
              ERROR
          ================================================= */}

          {error && <div className="company-interviews-error">{error}</div>}

          {/* =================================================
              STATS
          ================================================= */}

          <section className="company-interviews-stats">
            <article className="company-interviews-stat-card">
              <div className="company-interviews-stat-icon">
                <CalendarDays />
              </div>

              <div>
                <span>Total Interviews</span>

                <strong>{totalInterviews}</strong>
              </div>
            </article>

            <article className="company-interviews-stat-card">
              <div className="company-interviews-stat-icon">
                <Clock3 />
              </div>

              <div>
                <span>Scheduled</span>

                <strong>{scheduledInterviews}</strong>
              </div>
            </article>

            <article className="company-interviews-stat-card">
              <div className="company-interviews-stat-icon">
                <CheckCircle2 />
              </div>

              <div>
                <span>Completed</span>

                <strong>{completedInterviews}</strong>
              </div>
            </article>

            <article className="company-interviews-stat-card">
              <div className="company-interviews-stat-icon">
                <XCircle />
              </div>

              <div>
                <span>Cancelled</span>

                <strong>{cancelledInterviews}</strong>
              </div>
            </article>
          </section>

          {/* =================================================
              TOOLBAR
          ================================================= */}

          <section className="company-interviews-toolbar">
            <div className="company-interviews-toolbar-title">
              <div>
                <h2>Interview Schedule</h2>

                <span>
                  {filteredInterviews.length}{" "}
                  {filteredInterviews.length === 1 ? "interview" : "interviews"}{" "}
                  found
                </span>
              </div>
            </div>

            <div className="company-interviews-toolbar-row">
              <div className="company-interviews-filter">
                <Filter />

                <select
                  value={selectedStatus}
                  onChange={(event) => setSelectedStatus(event.target.value)}
                >
                  <option value="all">All Status</option>

                  <option value="scheduled">Scheduled</option>

                  <option value="completed">Completed</option>

                  <option value="cancelled">Cancelled</option>

                  <option value="rescheduled">Rescheduled</option>
                </select>
              </div>

              <select
                className="company-interviews-job-filter"
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

              <label className="company-interviews-search">
                <Search />

                <input
                  type="text"
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="Search candidate, email..."
                />
              </label>
            </div>
          </section>

          {/* =================================================
              INTERVIEW LIST
          ================================================= */}

          <section className="company-interviews-list">
            {filteredInterviews.map((interview) => {
              const dateTime = formatDateTime(interview.scheduledAt);

              const statusClass = getStatusClass(interview.status);

              const candidateName = getCandidateName(interview);

              const interviewType = getInterviewType(interview);

              return (
                <article
                  key={interview.id}
                  className="company-interview-card"
                  onClick={() => setSelectedInterview(interview)}
                >
                  <div className="company-interview-card-header">
                    <div className="company-interview-candidate">
                      <div className="company-interview-avatar">
                        {candidateName.trim().charAt(0).toUpperCase() || "C"}
                      </div>

                      <div>
                        <h3>{candidateName}</h3>

                        <p>
                          {interview.jobTitle || getJobTitle(interview.jobId)}
                        </p>

                        <span>{getCandidateEmail(interview)}</span>
                      </div>
                    </div>

                    <span className={`company-interview-status ${statusClass}`}>
                      {interview.status || "Scheduled"}
                    </span>
                  </div>

                  <div className="company-interview-details">
                    <div className="company-interview-detail">
                      <CalendarDays />

                      <div>
                        <span>Date</span>

                        <strong>{dateTime.date}</strong>
                      </div>
                    </div>

                    <div className="company-interview-detail">
                      <Clock3 />

                      <div>
                        <span>Time</span>

                        <strong>{dateTime.time}</strong>
                      </div>
                    </div>

                    <div className="company-interview-detail">
                      {interviewType === "Online" ? <Video /> : <MapPin />}

                      <div>
                        <span>Type</span>

                        <strong>
                          {interviewType === "InPerson"
                            ? "In Person"
                            : interviewType}
                        </strong>
                      </div>
                    </div>

                    <div className="company-interview-detail">
                      <MessageSquare />

                      <div>
                        <span>Round</span>

                        <strong>{interview.round || "Technical"}</strong>
                      </div>
                    </div>
                  </div>

                  <div className="company-interview-card-footer">
                    <span>{interview.durationMinutes || 30} minutes</span>

                    <button
                      type="button"
                      onClick={(event) => {
                        event.stopPropagation();

                        setSelectedInterview(interview);
                      }}
                    >
                      View Details
                      <ExternalLink />
                    </button>
                  </div>
                </article>
              );
            })}

            {!filteredInterviews.length && (
              <div className="company-interviews-empty">
                <div className="company-interviews-empty-icon">
                  <CalendarDays />
                </div>

                <h3>
                  {search || selectedJob !== "all" || selectedStatus !== "all"
                    ? "No interviews found"
                    : "No interviews scheduled yet"}
                </h3>

                <p>
                  {search || selectedJob !== "all" || selectedStatus !== "all"
                    ? "Try changing your search or filters."
                    : "Schedule an interview with a candidate to see it here."}
                </p>

                {!search &&
                  selectedJob === "all" &&
                  selectedStatus === "all" && (
                    <button
                      type="button"
                      className="company-interviews-primary-btn"
                      onClick={openScheduleModal}
                    >
                      <Plus />
                      Schedule Interview
                    </button>
                  )}
              </div>
            )}
          </section>
        </main>
      </div>

      {/* =====================================================
          INTERVIEW DETAIL MODAL
      ===================================================== */}

      {selectedInterview && (
        <div
          className="company-interview-modal-overlay"
          onClick={() => setSelectedInterview(null)}
        >
          <div
            className="company-interview-modal"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="company-interview-modal-header">
              <div>
                <span>INTERVIEW DETAILS</span>

                <h2>{getCandidateName(selectedInterview)}</h2>

                <p>
                  {selectedInterview.jobTitle ||
                    getJobTitle(selectedInterview.jobId)}
                </p>
              </div>

              <button
                type="button"
                className="company-interview-modal-close"
                onClick={() => setSelectedInterview(null)}
              >
                <X />
              </button>
            </div>

            <div className="company-interview-modal-body">
              <section className="company-interview-modal-section">
                <h4>Schedule</h4>

                <div className="company-interview-modal-grid">
                  <div className="company-interview-modal-field">
                    <CalendarDays />

                    <div>
                      <span>Date</span>

                      <strong>
                        {formatDateTime(selectedInterview.scheduledAt).date}
                      </strong>
                    </div>
                  </div>

                  <div className="company-interview-modal-field">
                    <Clock3 />

                    <div>
                      <span>Time</span>

                      <strong>
                        {formatDateTime(selectedInterview.scheduledAt).time}
                      </strong>
                    </div>
                  </div>

                  <div className="company-interview-modal-field">
                    <MessageSquare />

                    <div>
                      <span>Round</span>

                      <strong>{selectedInterview.round || "Technical"}</strong>
                    </div>
                  </div>

                  <div className="company-interview-modal-field">
                    <Clock3 />

                    <div>
                      <span>Duration</span>

                      <strong>
                        {selectedInterview.durationMinutes || 30} minutes
                      </strong>
                    </div>
                  </div>
                </div>
              </section>

              <section className="company-interview-modal-section">
                <h4>Candidate Information</h4>

                <div className="company-interview-contact-list">
                  <div>
                    <UserRound />

                    <span>{getCandidateName(selectedInterview)}</span>
                  </div>

                  <div>
                    <Mail />

                    <span>{getCandidateEmail(selectedInterview)}</span>
                  </div>

                  <div>
                    <Phone />

                    <span>
                      {selectedInterview.contact ||
                        selectedInterview.candidate?.contact ||
                        "-"}
                    </span>
                  </div>
                </div>
              </section>

              <section className="company-interview-modal-section">
                <h4>Interview Information</h4>

                <div className="company-interview-info-box">
                  <div>
                    {getInterviewType(selectedInterview) === "Online" ? (
                      <Video />
                    ) : (
                      <MapPin />
                    )}

                    <div>
                      <span>Interview Type</span>

                      <strong>
                        {getInterviewType(selectedInterview) === "InPerson"
                          ? "In Person"
                          : getInterviewType(selectedInterview)}
                      </strong>
                    </div>
                  </div>

                  {getInterviewType(selectedInterview) === "Online" &&
                    selectedInterview.meetingLink && (
                      <a
                        href={selectedInterview.meetingLink}
                        target="_blank"
                        rel="noreferrer"
                        className="company-interview-meeting-link"
                      >
                        <Video />
                        Join Meeting
                        <ExternalLink />
                      </a>
                    )}

                  {getInterviewType(selectedInterview) === "InPerson" &&
                    selectedInterview.location && (
                      <div className="company-interview-location">
                        <MapPin />

                        <span>{selectedInterview.location}</span>
                      </div>
                    )}
                </div>
              </section>

              {selectedInterview.instructions && (
                <section className="company-interview-modal-section">
                  <h4>Instructions</h4>

                  <div className="company-interview-instructions">
                    {selectedInterview.instructions}
                  </div>
                </section>
              )}

              <section className="company-interview-modal-section">
                <h4>Interview Status</h4>

                <div className="company-interview-status-actions">
                  <button
                    type="button"
                    className="company-interview-status-btn scheduled"
                    onClick={() =>
                      handleStatusChange(selectedInterview, "Scheduled")
                    }
                  >
                    <Clock3 />
                    Scheduled
                  </button>

                  <button
                    type="button"
                    className="company-interview-status-btn completed"
                    onClick={() =>
                      handleStatusChange(selectedInterview, "Completed")
                    }
                  >
                    <CheckCircle2 />
                    Completed
                  </button>

                  <button
                    type="button"
                    className="company-interview-status-btn cancelled"
                    onClick={() =>
                      handleStatusChange(selectedInterview, "Cancelled")
                    }
                  >
                    <XCircle />
                    Cancel
                  </button>
                </div>
              </section>
            </div>
          </div>
        </div>
      )}

      {/* =====================================================
          SCHEDULE MODAL
      ===================================================== */}

      {showScheduleModal && (
        <div
          className="company-interview-modal-overlay"
          onClick={closeScheduleModal}
        >
          <div
            className="company-interview-modal company-interview-schedule-modal"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="company-interview-modal-header">
              <div>
                <span>SCHEDULE INTERVIEW</span>

                <h2>Schedule Candidate Interview</h2>

                <p>Set the interview details and notify the candidate.</p>
              </div>

              <button
                type="button"
                className="company-interview-modal-close"
                onClick={closeScheduleModal}
                disabled={scheduleLoading}
              >
                <X />
              </button>
            </div>

            <form
              className="company-interview-form"
              onSubmit={handleScheduleInterview}
            >
              {/* =================================================
                  APPLICATION
              ================================================= */}

              <div className="company-interview-form-group full">
                <label>
                  Candidate Application
                  <span>*</span>
                </label>

                <select
                  name="applicationId"
                  value={interviewForm.applicationId}
                  onChange={handleFormChange}
                  required
                  disabled={applicationsLoading || scheduleLoading}
                >
                  <option value="">
                    {applicationsLoading
                      ? "Loading applications..."
                      : schedulableApplications.length === 0
                        ? "No applications found"
                        : "Select candidate application"}
                  </option>

                  {schedulableApplications.map((application) => {
                    const applicationId = getApplicationId(application);

                    if (!applicationId) {
                      return null;
                    }

                    const candidateName =
                      getApplicationCandidateName(application);

                    const candidateEmail =
                      getApplicationCandidateEmail(application);

                    const jobTitle = getApplicationJobTitle(application);

                    const status = getApplicationStatus(application);

                    const alreadyScheduled = scheduledApplicationIds.has(
                      String(applicationId).toLowerCase(),
                    );

                    return (
                      <option
                        key={applicationId}
                        value={applicationId}
                        disabled={alreadyScheduled}
                      >
                        {candidateName} — {jobTitle} — {candidateEmail}{" "}
                        {alreadyScheduled
                          ? "(Interview already scheduled)"
                          : `(${status})`}
                      </option>
                    );
                  })}
                </select>

                <small>
                  {applicationsLoading
                    ? "Loading applications received for your jobs..."
                    : applications.length > 0
                      ? `${applications.length} application(s) received for your company's jobs.`
                      : "No applications have been received for your company's jobs yet."}
                </small>
              </div>

              {/* =================================================
                  ROUND + TYPE
              ================================================= */}

              <div className="company-interview-form-grid">
                <div className="company-interview-form-group">
                  <label>
                    Interview Round
                    <span>*</span>
                  </label>

                  <select
                    name="round"
                    value={interviewForm.round}
                    onChange={handleFormChange}
                  >
                    <option value="HR">HR</option>

                    <option value="Technical">Technical</option>

                    <option value="Managerial">Managerial</option>

                    <option value="Final">Final</option>

                    <option value="Other">Other</option>
                  </select>
                </div>

                <div className="company-interview-form-group">
                  <label>
                    Interview Type
                    <span>*</span>
                  </label>

                  <select
                    name="interviewType"
                    value={interviewForm.interviewType}
                    onChange={handleFormChange}
                  >
                    <option value="Online">Online</option>

                    <option value="InPerson">In Person</option>
                  </select>
                </div>
              </div>

              {/* =================================================
                  DATE + DURATION
              ================================================= */}

              <div className="company-interview-form-grid">
                <div className="company-interview-form-group">
                  <label>
                    Date & Time
                    <span>*</span>
                  </label>

                  <input
                    type="datetime-local"
                    name="scheduledAt"
                    value={interviewForm.scheduledAt}
                    onChange={handleFormChange}
                    required
                  />
                </div>

                <div className="company-interview-form-group">
                  <label>
                    Duration
                    <span>*</span>
                  </label>

                  <select
                    name="durationMinutes"
                    value={interviewForm.durationMinutes}
                    onChange={handleFormChange}
                  >
                    <option value={15}>15 minutes</option>

                    <option value={30}>30 minutes</option>

                    <option value={45}>45 minutes</option>

                    <option value={60}>1 hour</option>

                    <option value={90}>1 hour 30 minutes</option>
                  </select>
                </div>
              </div>

              {/* =================================================
                  ONLINE
              ================================================= */}

              {interviewForm.interviewType === "Online" && (
                <div className="company-interview-form-group full">
                  <label>
                    Meeting Link
                    <span>*</span>
                  </label>

                  <div className="company-interview-input-icon">
                    <Video />

                    <input
                      type="url"
                      name="meetingLink"
                      value={interviewForm.meetingLink}
                      onChange={handleFormChange}
                      placeholder="https://meet.google.com/..."
                      required
                    />
                  </div>
                </div>
              )}

              {/* =================================================
                  IN PERSON
              ================================================= */}

              {interviewForm.interviewType === "InPerson" && (
                <div className="company-interview-form-group full">
                  <label>
                    Location
                    <span>*</span>
                  </label>

                  <div className="company-interview-input-icon">
                    <MapPin />

                    <input
                      type="text"
                      name="location"
                      value={interviewForm.location}
                      onChange={handleFormChange}
                      placeholder="Office location / meeting room"
                      required
                    />
                  </div>
                </div>
              )}

              {/* =================================================
                  INSTRUCTIONS
              ================================================= */}

              <div className="company-interview-form-group full">
                <label>Instructions / Notes</label>

                <textarea
                  name="instructions"
                  value={interviewForm.instructions}
                  onChange={handleFormChange}
                  rows="4"
                  placeholder="Add interview instructions or notes for the candidate..."
                />
              </div>

              {/* =================================================
                  ACTIONS
              ================================================= */}

              <div className="company-interview-form-actions">
                <button
                  type="button"
                  className="company-interview-cancel-btn"
                  onClick={closeScheduleModal}
                  disabled={scheduleLoading}
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  className="company-interviews-primary-btn"
                  disabled={
                    scheduleLoading ||
                    applicationsLoading ||
                    schedulableApplications.length === 0
                  }
                >
                  {scheduleLoading ? (
                    <>
                      <RefreshCw className="company-interviews-refresh-icon" />
                      Scheduling...
                    </>
                  ) : (
                    <>
                      <CalendarDays />
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

// =========================================================
// TOKEN USER ID
// =========================================================

function tokenUserId(token) {
  try {
    if (!token) {
      return null;
    }

    const parts = token.split(".");

    if (parts.length !== 3) {
      return null;
    }

    const payload = parts[1].replace(/-/g, "+").replace(/_/g, "/");

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
