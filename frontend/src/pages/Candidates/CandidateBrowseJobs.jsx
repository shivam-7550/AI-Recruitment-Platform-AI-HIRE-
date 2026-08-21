import { useEffect, useMemo, useState } from "react";
import { Navigate } from "react-router-dom";
import {
  Bookmark,
  BriefcaseBusiness,
  MapPin,
  Search,
  SlidersHorizontal,
  X,
} from "lucide-react";

import CandidateSidebar from "../../components/CandidateSidebar";
import CandidateHeader from "../../components/CandidateHeader";
import ApplicationForm from "../../components/ApplicationForm";

import { candidateApi, jobsApi, savedJobsApi } from "../../services/api";

import "../../styles/CandidatesCSS/CandidateBrowseJobs.css";

export default function CandidateBrowseJobs() {
  // ==========================================
  // Session
  // ==========================================

  const session = JSON.parse(sessionStorage.getItem("user") || "null");

  // ==========================================
  // State
  // ==========================================

  const [jobs, setJobs] = useState([]);

  const [applications, setApplications] = useState([]);

  const [profile, setProfile] = useState(null);

  const [resume, setResume] = useState(null);

  const [savedJobIds, setSavedJobIds] = useState([]);

  const [loading, setLoading] = useState(true);

  const [message, setMessage] = useState("");

  // ==========================================
  // Search
  // ==========================================

  const [search, setSearch] = useState("");

  const [location, setLocation] = useState("");

  const [employmentType, setEmploymentType] = useState("");

  // ==========================================
  // Application Form
  // ==========================================

  const [selectedJob, setSelectedJob] = useState(null);

  const [showApplicationForm, setShowApplicationForm] = useState(false);

  const [submittingApplication, setSubmittingApplication] = useState(false);

  // ==========================================
  // Authentication
  // ==========================================

  if (!session) {
    return <Navigate to="/login" replace />;
  }

  if (session.role !== "User") {
    return <Navigate to={`/${session.role.toLowerCase()}/dashboard`} replace />;
  }

  // ==========================================
  // Load Data
  // ==========================================

  useEffect(() => {
    let mounted = true;

    async function loadData() {
      try {
        setLoading(true);
        setMessage("");

        const results = await Promise.allSettled([
          jobsApi.all(),
          candidateApi.applications(),
          candidateApi.profile(),
          candidateApi.resume(),
          savedJobsApi.mine(),
        ]);

        if (!mounted) {
          return;
        }

        const [
          jobsResult,
          applicationsResult,
          profileResult,
          resumeResult,
          savedResult,
        ] = results;

        // Jobs
        if (jobsResult.status === "fulfilled") {
          setJobs(Array.isArray(jobsResult.value) ? jobsResult.value : []);
        }

        // Applications
        if (applicationsResult.status === "fulfilled") {
          setApplications(
            Array.isArray(applicationsResult.value)
              ? applicationsResult.value
              : [],
          );
        }

        // Profile
        if (profileResult.status === "fulfilled") {
          setProfile(profileResult.value || null);
        }

        // Resume
        if (resumeResult.status === "fulfilled") {
          setResume(resumeResult.value || null);
        }

        // Saved Jobs
        if (savedResult.status === "fulfilled") {
          const serverSaved = Array.isArray(savedResult.value)
            ? savedResult.value
            : [];

          setSavedJobIds(serverSaved.map((item) => item.jobId).filter(Boolean));
        }
      } catch (error) {
        if (mounted) {
          setMessage(error?.message || "Unable to load jobs.");
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    }

    loadData();

    return () => {
      mounted = false;
    };
  }, []);

  // ==========================================
  // Employment Types
  // ==========================================

  const employmentTypes = useMemo(() => {
    const values = jobs.map((job) => job.employmentType).filter(Boolean);

    return [...new Set(values)];
  }, [jobs]);

  // ==========================================
  // Filter Jobs
  // ==========================================

  const filteredJobs = useMemo(() => {
    const searchValue = search.trim().toLowerCase();

    const locationValue = location.trim().toLowerCase();

    return jobs.filter((job) => {
      const searchableText = `
        ${job.title || ""}
        ${job.companyName || ""}
        ${job.skills || ""}
        ${job.description || ""}
      `.toLowerCase();

      const jobLocation = String(job.location || "").toLowerCase();

      const jobEmploymentType = String(job.employmentType || "").toLowerCase();

      const matchesSearch =
        !searchValue || searchableText.includes(searchValue);

      const matchesLocation =
        !locationValue || jobLocation.includes(locationValue);

      const matchesEmploymentType =
        !employmentType || jobEmploymentType === employmentType.toLowerCase();

      return matchesSearch && matchesLocation && matchesEmploymentType;
    });
  }, [jobs, search, location, employmentType]);

  // ==========================================
  // Application Check
  // ==========================================

  function hasApplied(jobId) {
    return applications.some(
      (application) =>
        String(application.jobId).toLowerCase() === String(jobId).toLowerCase(),
    );
  }

  // ==========================================
  // Saved Check
  // ==========================================

  function isSaved(jobId) {
    return savedJobIds.some(
      (id) => String(id).toLowerCase() === String(jobId).toLowerCase(),
    );
  }

  // ==========================================
  // Toggle Saved Job
  // ==========================================

  async function toggleSavedJob(jobId) {
    try {
      setMessage("");

      if (isSaved(jobId)) {
        await savedJobsApi.remove(jobId);

        setSavedJobIds((current) =>
          current.filter(
            (id) => String(id).toLowerCase() !== String(jobId).toLowerCase(),
          ),
        );

        setMessage("Job removed from saved jobs.");
      } else {
        await savedJobsApi.save(jobId);

        setSavedJobIds((current) => [...current, jobId]);

        setMessage("Job saved successfully.");
      }
    } catch (error) {
      setMessage(error?.message || "Unable to update saved job.");
    }
  }

  // ==========================================
  // Open Application Form
  // ==========================================

  function openApplicationForm(job) {
    if (!resume) {
      setMessage("Please upload your resume before applying for a job.");

      return;
    }

    if (hasApplied(job.id)) {
      setMessage("You have already applied for this job.");

      return;
    }

    setMessage("");

    setSelectedJob(job);

    setShowApplicationForm(true);
  }

  // ==========================================
  // Close Application Form
  // ==========================================

  function closeApplicationForm() {
    if (submittingApplication) {
      return;
    }

    setShowApplicationForm(false);

    setSelectedJob(null);
  }

  // ==========================================
  // Submit Application
  // ==========================================

  async function submitApplication(applicationData) {
    if (!selectedJob) {
      throw new Error("No job selected.");
    }

    if (!resume?.id) {
      throw new Error("Please upload a resume before applying.");
    }

    try {
      setSubmittingApplication(true);

      setMessage("");

      /*
       * IMPORTANT:
       *
       * candidateApi.apply expects:
       *
       * apply(jobId, resumeId, applicationData)
       */

      const response = await candidateApi.apply(
        selectedJob.id,
        resume.id,
        applicationData,
      );

      const updatedApplications = await candidateApi.applications();

      setApplications(
        Array.isArray(updatedApplications) ? updatedApplications : [],
      );

      setShowApplicationForm(false);

      setSelectedJob(null);

      setMessage(response?.message || "Application submitted successfully.");
    } catch (error) {
      setMessage(error?.message || "Unable to submit application.");

      throw error;
    } finally {
      setSubmittingApplication(false);
    }
  }

  // ==========================================
  // Clear Filters
  // ==========================================

  function clearFilters() {
    setSearch("");
    setLocation("");
    setEmploymentType("");
  }

  const hasFilters = search || location || employmentType;

  // ==========================================
  // Render
  // ==========================================

  return (
    <div className="candidate-browse-layout">
      {/* ======================================
          SHARED SIDEBAR
          ====================================== */}

      <CandidateSidebar />

      {/* ======================================
          PAGE
          ====================================== */}

      <main className="candidate-browse-page">
        {/* ====================================
            HEADER
            ==================================== */}

        <CandidateHeader
          title="Browse Jobs"
          subtitle="Find the right opportunity for your skills and experience."
        />

        {/* ====================================
            MESSAGE
            ==================================== */}

        {message && (
          <div className="candidate-browse-message">
            <span>{message}</span>

            <button
              type="button"
              onClick={() => setMessage("")}
              aria-label="Close message"
            >
              <X />
            </button>
          </div>
        )}

        {/* ====================================
            SEARCH / FILTERS
            ==================================== */}

        <section className="candidate-browse-filters">
          <div className="candidate-browse-search">
            <Search />

            <input
              type="text"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search jobs, companies, skills..."
            />
          </div>

          <div className="candidate-browse-location">
            <MapPin />

            <input
              type="text"
              value={location}
              onChange={(event) => setLocation(event.target.value)}
              placeholder="Location"
            />
          </div>

          <div className="candidate-browse-type">
            <SlidersHorizontal />

            <select
              value={employmentType}
              onChange={(event) => setEmploymentType(event.target.value)}
            >
              <option value="">All Employment Types</option>

              {employmentTypes.map((type) => (
                <option key={type} value={type}>
                  {type}
                </option>
              ))}
            </select>
          </div>

          {hasFilters && (
            <button
              type="button"
              className="candidate-browse-clear"
              onClick={clearFilters}
            >
              Clear
            </button>
          )}
        </section>

        {/* ====================================
            JOB LIST
            ==================================== */}

        <section className="candidate-browse-results">
          {loading ? (
            <div className="candidate-browse-empty">
              <div className="candidate-browse-loader" />

              <p>Loading available jobs...</p>
            </div>
          ) : filteredJobs.length === 0 ? (
            <div className="candidate-browse-empty">
              <BriefcaseBusiness />

              <h2>No jobs found</h2>

              <p>Try changing your search or filters.</p>

              {hasFilters && (
                <button type="button" onClick={clearFilters}>
                  Clear Filters
                </button>
              )}
            </div>
          ) : (
            <div className="candidate-browse-grid">
              {filteredJobs.map((job) => {
                const applied = hasApplied(job.id);

                const saved = isSaved(job.id);

                return (
                  <article key={job.id} className="candidate-browse-card">
                    {/* Company */}

                    <div className="candidate-browse-company">
                      <div className="candidate-browse-company-logo">
                        {(job.companyName || "C").slice(0, 1).toUpperCase()}
                      </div>

                      <div>
                        <strong>{job.companyName || "Company"}</strong>

                        <span>{job.title || "Job Position"}</span>
                      </div>
                    </div>

                    {/* Job title */}

                    <h2>{job.title || "Job Position"}</h2>

                    {/* Description */}

                    <p className="candidate-browse-description">
                      {job.description || "No job description available."}
                    </p>

                    {/* Meta */}

                    <div className="candidate-browse-meta">
                      <span>
                        <MapPin />

                        {job.location || "Remote"}
                      </span>

                      <span>{job.employmentType || "Full Time"}</span>
                    </div>

                    {/* Skills */}

                    {job.skills && (
                      <div className="candidate-browse-skills">
                        {String(job.skills)
                          .split(",")
                          .map((skill) => skill.trim())
                          .filter(Boolean)
                          .slice(0, 5)
                          .map((skill) => (
                            <span key={skill}>{skill}</span>
                          ))}
                      </div>
                    )}

                    {/* Salary */}

                    <div className="candidate-browse-bottom">
                      <strong className="candidate-browse-salary">
                        ₹{Number(job.salary || 0).toLocaleString("en-IN")}
                      </strong>

                      <span>
                        {job.experienceRequired
                          ? `${job.experienceRequired} experience`
                          : "Experience flexible"}
                      </span>
                    </div>

                    {/* Actions */}

                    <div className="candidate-browse-actions">
                      <button
                        type="button"
                        className={`candidate-browse-save ${
                          saved ? "is-saved" : ""
                        }`}
                        onClick={() => toggleSavedJob(job.id)}
                        aria-label={saved ? "Remove saved job" : "Save job"}
                      >
                        <Bookmark />

                        {saved ? "Saved" : "Save"}
                      </button>

                      <button
                        type="button"
                        className="candidate-browse-apply"
                        disabled={applied}
                        onClick={() => openApplicationForm(job)}
                      >
                        {applied ? "Applied" : "Apply Now"}
                      </button>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </section>
      </main>

      {/* ======================================
          APPLICATION FORM
          ====================================== */}

      {showApplicationForm && selectedJob && (
        <ApplicationForm
          job={selectedJob}
          profile={profile}
          resume={resume}
          onClose={closeApplicationForm}
          onSubmit={submitApplication}
          submitting={submittingApplication}
        />
      )}
    </div>
  );
}
