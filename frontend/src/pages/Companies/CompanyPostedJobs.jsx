import { useEffect, useMemo, useState } from "react";
import { Navigate, Link, useNavigate } from "react-router-dom";

import {
  BriefcaseBusiness,
  CalendarDays,
  ChevronRight,
  Edit3,
  MapPin,
  Plus,
  Search,
  Users,
  Trash2,
  X,
  CheckCircle2,
  XCircle,
} from "lucide-react";

import CompanySidebar from "../../components/Company/CompanySidebar";
import CompanyHeader from "../../components/Company/CompanyHeader";

import { companyApi, jobsApi } from "../../services/api";

import "../../styles/CompanyCSS/CompanyPostedJobs.css";

export default function CompanyPostedJobs() {
  const session = JSON.parse(sessionStorage.getItem("user") || "null");

  const navigate = useNavigate();

  const [company, setCompany] = useState(null);
  const [jobs, setJobs] = useState([]);

  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [actionLoading, setActionLoading] = useState(false);

  // ==========================================
  // VIEW / EDIT MODAL
  // ==========================================

  const [selectedJob, setSelectedJob] = useState(null);
  const [modalMode, setModalMode] = useState(null);

  const [editForm, setEditForm] = useState({
    title: "",
    description: "",
    location: "",
    salary: "",
    experience: 0,
    employmentType: "Full-time",
    skills: "",
    vacancies: 1,
    lastDateToApply: "",
    isActive: true,
  });

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
      return;
    }

    loadPostedJobs();
  }, [userId]);

  async function loadPostedJobs() {
    setLoading(true);
    setError("");

    try {
      const [companyResult, jobsResult] = await Promise.all([
        companyApi.byUser(userId),
        jobsApi.all(),
      ]);

      setCompany(companyResult);

      const allJobs = Array.isArray(jobsResult) ? jobsResult : [];

      // Only logged-in company's jobs
      const companyJobs = companyResult
        ? allJobs.filter((job) => job.companyId === companyResult.id)
        : [];

      setJobs(companyJobs);
    } catch (error) {
      console.error("Posted jobs loading error:", error);

      setError(error?.message || "Unable to load posted jobs.");
    } finally {
      setLoading(false);
    }
  }

  // ==========================================
  // SEARCH
  // ==========================================

  const filteredJobs = useMemo(() => {
    const query = search.trim().toLowerCase();

    if (!query) {
      return jobs;
    }

    return jobs.filter((job) =>
      `
        ${job.title || ""}
        ${job.location || ""}
        ${job.skills || ""}
        ${job.employmentType || ""}
      `
        .toLowerCase()
        .includes(query),
    );
  }, [jobs, search]);

  // ==========================================
  // DELETE JOB
  // ==========================================

  async function handleDelete(jobId) {
    const confirmed = window.confirm(
      "Are you sure you want to delete this job?",
    );

    if (!confirmed) {
      return;
    }

    setActionLoading(true);
    setError("");

    try {
      await jobsApi.remove(jobId);

      setJobs((current) => current.filter((job) => job.id !== jobId));

      if (selectedJob?.id === jobId) {
        closeModal();
      }
    } catch (error) {
      console.error("Delete job error:", error);

      setError(error?.message || "Unable to delete this job.");
    } finally {
      setActionLoading(false);
    }
  }

  // ==========================================
  // ACTIVE / INACTIVE
  // ==========================================

  async function handleToggleStatus(job) {
    setActionLoading(true);
    setError("");

    const nextStatus = !job.isActive;

    try {
      const updatedJob = await jobsApi.update(job.id, {
        title: job.title,
        description: job.description,
        location: job.location,
        salary: Number(job.salary || 0),
        experience: Number(job.experience || 0),
        employmentType: job.employmentType || "Full-time",
        skills: job.skills || "",
        vacancies: Number(job.vacancies || 1),
        lastDateToApply: job.lastDateToApply,
        isActive: nextStatus,
      });

      setJobs((current) =>
        current.map((item) =>
          item.id === job.id
            ? {
                ...item,
                ...(updatedJob && typeof updatedJob === "object"
                  ? updatedJob
                  : {}),
                isActive: nextStatus,
              }
            : item,
        ),
      );

      setSelectedJob((current) =>
        current?.id === job.id
          ? {
              ...current,
              isActive: nextStatus,
            }
          : current,
      );
    } catch (error) {
      console.error("Toggle job status error:", error);

      setError(error?.message || "Unable to update job status.");
    } finally {
      setActionLoading(false);
    }
  }

  // ==========================================
  // VIEW JOB
  // ==========================================

  function handleView(job) {
    setSelectedJob(job);
    setModalMode("view");
  }

  // ==========================================
  // EDIT JOB
  // ==========================================

  function handleEdit(job) {
    setSelectedJob(job);

    setEditForm({
      title: job.title || "",
      description: job.description || "",
      location: job.location || "",
      salary: job.salary || "",
      experience: job.experience || 0,
      employmentType: job.employmentType || "Full-time",
      skills: job.skills || "",
      vacancies: job.vacancies || 1,
      lastDateToApply: formatDateTimeLocal(job.lastDateToApply),
      isActive: job.isActive !== undefined ? job.isActive : true,
    });

    setModalMode("edit");
  }

  // ==========================================
  // CHANGE EDIT FORM
  // ==========================================

  function handleEditChange(event) {
    const { name, value, type, checked } = event.target;

    setEditForm((current) => ({
      ...current,
      [name]: type === "checkbox" ? checked : value,
    }));
  }

  // ==========================================
  // SAVE EDITED JOB
  // ==========================================

  async function handleUpdateJob(event) {
    event.preventDefault();

    if (!selectedJob) {
      return;
    }

    setActionLoading(true);
    setError("");

    try {
      const updated = await jobsApi.update(selectedJob.id, {
        title: editForm.title,
        description: editForm.description,
        location: editForm.location,
        salary: Number(editForm.salary),
        experience: Number(editForm.experience),
        employmentType: editForm.employmentType,
        skills: editForm.skills,
        vacancies: Number(editForm.vacancies),
        lastDateToApply: editForm.lastDateToApply,
        isActive: editForm.isActive,
      });

      setJobs((current) =>
        current.map((job) =>
          job.id === selectedJob.id
            ? {
                ...job,
                ...(updated && typeof updated === "object" ? updated : {}),
                title: editForm.title,
                description: editForm.description,
                location: editForm.location,
                salary: Number(editForm.salary),
                experience: Number(editForm.experience),
                employmentType: editForm.employmentType,
                skills: editForm.skills,
                vacancies: Number(editForm.vacancies),
                lastDateToApply: editForm.lastDateToApply,
                isActive: editForm.isActive,
              }
            : job,
        ),
      );

      closeModal();
    } catch (error) {
      console.error("Update job error:", error);

      setError(error?.message || "Unable to update job.");
    } finally {
      setActionLoading(false);
    }
  }

  // ==========================================
  // CLOSE MODAL
  // ==========================================

  function closeModal() {
    setSelectedJob(null);
    setModalMode(null);
  }

  // ==========================================
  // LOADING
  // ==========================================

  if (!session) {
    return <Navigate to="/login" replace />;
  }

  if (session.role !== "Company") {
    return <Navigate to={`/${session.role.toLowerCase()}/dashboard`} replace />;
  }

  if (loading) {
    return (
      <div className="posted-jobs-loading">
        <div className="posted-jobs-spinner" />
        <span>Loading posted jobs...</span>
      </div>
    );
  }

  // ==========================================
  // UI
  // ==========================================

  return (
    <div className="posted-jobs-page">
      {/* ========================================
          SIDEBAR
      ======================================== */}

      <CompanySidebar company={company} />

      {/* ========================================
          MAIN
      ======================================== */}

      <div className="posted-jobs-main">
        {/* HEADER */}

        <CompanyHeader company={company} setCompany={setCompany} />

        {/* CONTENT */}

        <main className="posted-jobs-content">
          {/* =====================================
              PAGE HEADER
          ===================================== */}

          <section className="posted-jobs-heading">
            <Link
              to="/company/jobs/new?returnTo=/company/posted-jobs"
              className="posted-jobs-create"
            >
              <Plus />
              Post a New Job
            </Link>
          </section>

          {/* =====================================
              STATS
          ===================================== */}

          <section className="posted-jobs-stats">
            <article>
              <div className="posted-jobs-stat-icon">
                <BriefcaseBusiness />
              </div>

              <div>
                <span>Total Jobs</span>

                <strong>{jobs.length}</strong>
              </div>
            </article>

            <article>
              <div className="posted-jobs-stat-icon">
                <Users />
              </div>

              <div>
                <span>Active Positions</span>

                <strong>
                  {jobs.filter((job) => job.isActive !== false).length}
                </strong>
              </div>
            </article>

            <article>
              <div className="posted-jobs-stat-icon">
                <CalendarDays />
              </div>

              <div>
                <span>Latest Posting</span>

                <strong>
                  {jobs.length
                    ? formatDate(jobs[0].createdAt || jobs[0].postedAt)
                    : "-"}
                </strong>
              </div>
            </article>
          </section>

          {/* =====================================
              JOB PANEL
          ===================================== */}

          <section className="posted-jobs-panel">
            <div className="posted-jobs-panel-header">
              <div>
                <h2>Your Posted Jobs</h2>

                <p>
                  {filteredJobs.length}{" "}
                  {filteredJobs.length === 1 ? "job" : "jobs"} found
                </p>
              </div>

              <label className="posted-jobs-search">
                <Search />

                <input
                  type="text"
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="Search jobs, skills or location..."
                />
              </label>
            </div>

            {/* ERROR */}

            {error && <div className="posted-jobs-error">{error}</div>}

            {/* JOB LIST */}

            <div className="posted-jobs-list">
              {filteredJobs.map((job) => {
                const isActive = job.isActive !== false;

                return (
                  <article key={job.id} className="posted-job-card">
                    {/* JOB ICON */}

                    <div className="posted-job-icon">
                      <BriefcaseBusiness />
                    </div>

                    {/* JOB INFORMATION */}

                    <div className="posted-job-info">
                      <div className="posted-job-title-row">
                        <div>
                          <h3>{job.title}</h3>

                          <span>{job.employmentType || "Full-time"}</span>
                        </div>

                        <span
                          className={`posted-job-status ${
                            isActive ? "active" : "closed"
                          }`}
                        >
                          {isActive ? "Active" : "Inactive"}
                        </span>
                      </div>

                      <div className="posted-job-meta">
                        <span>
                          <MapPin />

                          {job.location || "Location not specified"}
                        </span>

                        <span>
                          <Users />
                          {job.vacancies || 1}{" "}
                          {Number(job.vacancies) === 1
                            ? "Vacancy"
                            : "Vacancies"}
                        </span>

                        <span>
                          <CalendarDays />
                          Posted {formatDate(job.createdAt || job.postedAt)}
                        </span>
                      </div>

                      {job.skills && (
                        <div className="posted-job-skills">
                          {String(job.skills)
                            .split(",")
                            .map((skill) => (
                              <span key={skill.trim()}>{skill.trim()}</span>
                            ))}
                        </div>
                      )}
                    </div>

                    {/* ACTIONS */}

                    <div className="posted-job-actions">
                      <button
                        type="button"
                        className="posted-job-view"
                        onClick={() => handleView(job)}
                      >
                        View
                        <ChevronRight />
                      </button>

                      <button
                        type="button"
                        className="posted-job-edit"
                        onClick={() => handleEdit(job)}
                        title="Edit Job"
                      >
                        <Edit3 />
                      </button>

                      <button
                        type="button"
                        className="posted-job-delete"
                        onClick={() => handleDelete(job.id)}
                        disabled={actionLoading}
                        title="Delete Job"
                      >
                        <Trash2 />
                      </button>
                    </div>
                  </article>
                );
              })}

              {/* EMPTY */}

              {!filteredJobs.length && (
                <div className="posted-jobs-empty">
                  <div>
                    <BriefcaseBusiness />
                  </div>

                  <h3>{search ? "No jobs found" : "No jobs posted yet"}</h3>

                  <p>
                    {search
                      ? "Try searching with a different keyword."
                      : "Start hiring by posting your first job."}
                  </p>

                  {!search && (
                    <Link to="/company/jobs/new?returnTo=/company/posted-jobs">
                      <Plus />
                      Post Your First Job
                    </Link>
                  )}
                </div>
              )}
            </div>
          </section>
        </main>
      </div>

      {/* ========================================
          VIEW JOB MODAL
      ======================================== */}

      {modalMode === "view" && selectedJob && (
        <div className="posted-jobs-modal-overlay" onClick={closeModal}>
          <div
            className="posted-jobs-modal"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="posted-jobs-modal-header">
              <div>
                <span>JOB DETAILS</span>

                <h2>{selectedJob.title}</h2>
              </div>

              <button type="button" onClick={closeModal}>
                <X />
              </button>
            </div>

            <div className="posted-jobs-modal-body">
              <div className="posted-jobs-detail-grid">
                <div>
                  <span>Location</span>
                  <strong>{selectedJob.location || "-"}</strong>
                </div>

                <div>
                  <span>Employment</span>
                  <strong>{selectedJob.employmentType || "-"}</strong>
                </div>

                <div>
                  <span>Salary</span>
                  <strong>
                    {selectedJob.salary
                      ? `₹${Number(selectedJob.salary).toLocaleString("en-IN")}`
                      : "-"}
                  </strong>
                </div>

                <div>
                  <span>Experience</span>
                  <strong>{selectedJob.experience ?? 0} years</strong>
                </div>

                <div>
                  <span>Vacancies</span>
                  <strong>{selectedJob.vacancies || 1}</strong>
                </div>

                <div>
                  <span>Status</span>
                  <strong>
                    {selectedJob.isActive !== false ? "Active" : "Inactive"}
                  </strong>
                </div>
              </div>

              <div className="posted-jobs-detail-section">
                <span>Required Skills</span>

                <p>{selectedJob.skills || "No skills specified."}</p>
              </div>

              <div className="posted-jobs-detail-section">
                <span>Description</span>

                <p>{selectedJob.description || "No description available."}</p>
              </div>

              <div className="posted-jobs-detail-section">
                <span>Last Date To Apply</span>

                <p>{formatDate(selectedJob.lastDateToApply)}</p>
              </div>
            </div>

            <div className="posted-jobs-modal-actions">
              <button
                type="button"
                onClick={() => handleToggleStatus(selectedJob)}
                disabled={actionLoading}
              >
                {selectedJob.isActive !== false ? (
                  <>
                    <XCircle />
                    Make Inactive
                  </>
                ) : (
                  <>
                    <CheckCircle2 />
                    Make Active
                  </>
                )}
              </button>

              <button type="button" onClick={() => handleEdit(selectedJob)}>
                <Edit3 />
                Edit Job
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================
          EDIT JOB MODAL
      ======================================== */}

      {modalMode === "edit" && selectedJob && (
        <div className="posted-jobs-modal-overlay" onClick={closeModal}>
          <form
            className="posted-jobs-modal"
            onSubmit={handleUpdateJob}
            onClick={(event) => event.stopPropagation()}
          >
            <div className="posted-jobs-modal-header">
              <div>
                <span>MANAGE JOB</span>

                <h2>Edit Job</h2>
              </div>

              <button type="button" onClick={closeModal}>
                <X />
              </button>
            </div>

            <div className="posted-jobs-modal-body">
              <div className="posted-jobs-edit-grid">
                <label>
                  <span>Job Title</span>

                  <input
                    name="title"
                    value={editForm.title}
                    onChange={handleEditChange}
                    required
                  />
                </label>

                <label>
                  <span>Location</span>

                  <input
                    name="location"
                    value={editForm.location}
                    onChange={handleEditChange}
                    required
                  />
                </label>

                <label>
                  <span>Salary</span>

                  <input
                    type="number"
                    name="salary"
                    value={editForm.salary}
                    onChange={handleEditChange}
                    min="0"
                    required
                  />
                </label>

                <label>
                  <span>Experience</span>

                  <input
                    type="number"
                    name="experience"
                    value={editForm.experience}
                    onChange={handleEditChange}
                    min="0"
                    required
                  />
                </label>

                <label>
                  <span>Employment Type</span>

                  <select
                    name="employmentType"
                    value={editForm.employmentType}
                    onChange={handleEditChange}
                  >
                    <option>Full-time</option>

                    <option>Part-time</option>

                    <option>Contract</option>

                    <option>Internship</option>

                    <option>Remote</option>
                  </select>
                </label>

                <label>
                  <span>Vacancies</span>

                  <input
                    type="number"
                    name="vacancies"
                    value={editForm.vacancies}
                    onChange={handleEditChange}
                    min="1"
                    required
                  />
                </label>

                <label>
                  <span>Required Skills</span>

                  <input
                    name="skills"
                    value={editForm.skills}
                    onChange={handleEditChange}
                    placeholder="C#, React, SQL Server"
                    required
                  />
                </label>

                <label>
                  <span>Last Date To Apply</span>

                  <input
                    type="datetime-local"
                    name="lastDateToApply"
                    value={editForm.lastDateToApply}
                    onChange={handleEditChange}
                    required
                  />
                </label>

                <label className="full">
                  <span>Description</span>

                  <textarea
                    name="description"
                    value={editForm.description}
                    onChange={handleEditChange}
                    rows="6"
                    required
                  />
                </label>

                <label className="posted-jobs-active-toggle">
                  <input
                    type="checkbox"
                    name="isActive"
                    checked={editForm.isActive}
                    onChange={handleEditChange}
                  />

                  <span>Job is Active</span>
                </label>
              </div>

              {error && <div className="posted-jobs-error">{error}</div>}
            </div>

            <div className="posted-jobs-modal-actions">
              <button
                type="button"
                onClick={closeModal}
                disabled={actionLoading}
              >
                Cancel
              </button>

              <button type="submit" disabled={actionLoading}>
                {actionLoading ? "Saving..." : "Save Changes"}
              </button>
            </div>
          </form>
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
// DATETIME LOCAL FORMAT
// ==========================================

function formatDateTimeLocal(value) {
  if (!value) {
    return "";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "";
  }

  const year = date.getFullYear();

  const month = String(date.getMonth() + 1).padStart(2, "0");

  const day = String(date.getDate()).padStart(2, "0");

  const hours = String(date.getHours()).padStart(2, "0");

  const minutes = String(date.getMinutes()).padStart(2, "0");

  return `${year}-${month}-${day}T${hours}:${minutes}`;
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

    const data = JSON.parse(atob(payload));

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
