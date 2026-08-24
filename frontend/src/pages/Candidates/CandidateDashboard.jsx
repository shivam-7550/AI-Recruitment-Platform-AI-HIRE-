import { useEffect, useMemo, useRef, useState } from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";

import {
  Bookmark,
  BriefcaseBusiness,
  Camera,
  CheckCircle2,
  Clock3,
  FileText,
  LogOut,
  MessageSquare,
  Pencil,
  Search,
  Upload,
  UserRound,
  X,
} from "lucide-react";

import { candidateApi, jobsApi, savedJobsApi } from "../../services/api";

import "../../styles/CandidatesCSS/CandidateDashboard.css";
import CandidateSidebar from "../../components/Candidate/CandidateSidebar";
import NotificationBell from "../../components/notifications/NotificationBell";

/* =========================================================
   FALLBACK JOBS
========================================================= */

const FALLBACK_JOBS = [
  {
    id: "demo-1",
    title: "Senior Software Engineer",
    companyName: "TechNova",
    location: "Bengaluru",
    employmentType: "Full-time",
    experience: "3-5",
    salary: 1200000,
    skills: "C#, ASP.NET Core, SQL Server, Azure",
    description:
      "Build scalable backend services and collaborate with product teams.",
  },
  {
    id: "demo-2",
    title: "Frontend Developer",
    companyName: "PixelCraft",
    location: "Remote",
    employmentType: "Full-time",
    experience: "1-3",
    salary: 900000,
    skills: "React, JavaScript, HTML, CSS",
    description:
      "Create responsive and accessible interfaces for modern products.",
  },
];

/* =========================================================
   CANDIDATE DASHBOARD
========================================================= */

export default function CandidateDashboard() {
  const navigate = useNavigate();

  const session = JSON.parse(sessionStorage.getItem("user") || "null");

  /* =======================================================
     REFS
  ======================================================= */

  const profileRef = useRef(null);

  /* =======================================================
     DASHBOARD STATE
  ======================================================= */

  const [profile, setProfile] = useState({});

  const [jobs, setJobs] = useState([]);
  const [applications, setApplications] = useState([]);
  const [resume, setResume] = useState(null);
  const [saved, setSaved] = useState([]);

  const [query, setQuery] = useState("");

  const [message, setMessage] = useState("");

  const [loading, setLoading] = useState(true);

  const [savingJobId, setSavingJobId] = useState(null);

  /* =======================================================
     PROFILE POPOVER STATE
  ======================================================= */

  const [showProfileMenu, setShowProfileMenu] = useState(false);

  const [editingProfile, setEditingProfile] = useState(false);

  const [profileName, setProfileName] = useState("");

  const [profileDesignation, setProfileDesignation] = useState("");

  const [profileImage, setProfileImage] = useState(null);

  const [profileImagePreview, setProfileImagePreview] = useState("");

  const [savingProfile, setSavingProfile] = useState(false);

  const [uploadingPhoto, setUploadingPhoto] = useState(false);

  /* =========================================================
     LOAD DASHBOARD
  ========================================================= */

  useEffect(() => {
    if (session?.role !== "User") {
      return;
    }

    loadDashboard();
  }, [session?.role]);

  /* =========================================================
     CLOSE PROFILE POPOVER ON OUTSIDE CLICK
  ========================================================= */

  useEffect(() => {
    function handleProfileOutsideClick(event) {
      if (profileRef.current && !profileRef.current.contains(event.target)) {
        setShowProfileMenu(false);
        setEditingProfile(false);
      }
    }

    document.addEventListener("mousedown", handleProfileOutsideClick);

    return () => {
      document.removeEventListener("mousedown", handleProfileOutsideClick);
    };
  }, []);

  /* =========================================================
     LOAD DASHBOARD DATA
  ========================================================= */

  async function loadDashboard() {
    setLoading(true);
    setMessage("");

    try {
      const results = await Promise.allSettled([
        candidateApi.profile(),
        jobsApi.all(),
        candidateApi.applications(),
        candidateApi.resume(),
        savedJobsApi.mine(),
      ]);

      const [
        profileResult,
        jobsResult,
        applicationsResult,
        resumeResult,
        savedJobsResult,
      ] = results;

      /* =====================================================
         PROFILE
      ===================================================== */

      if (profileResult.status === "fulfilled") {
        const profileData = profileResult.value || {};

        setProfile(profileData);

        setProfileName(profileData.name || session?.name || "Candidate");

        setProfileDesignation(profileData.professionalHeadline || "Candidate");

        setProfileImagePreview(profileData.photoUrl || "");
      }

      /* =====================================================
         JOBS
      ===================================================== */

      if (jobsResult.status === "fulfilled") {
        const jobsData = Array.isArray(jobsResult.value)
          ? jobsResult.value
          : [];

        setJobs(jobsData);
      }

      /* =====================================================
         APPLICATIONS
      ===================================================== */

      if (applicationsResult.status === "fulfilled") {
        const applicationsData = Array.isArray(applicationsResult.value)
          ? applicationsResult.value
          : [];

        setApplications(applicationsData);
      }

      /* =====================================================
         RESUME
      ===================================================== */

      if (resumeResult.status === "fulfilled") {
        setResume(resumeResult.value || null);
      }

      /* =====================================================
         SAVED JOBS
      ===================================================== */

      if (savedJobsResult.status === "fulfilled") {
        const savedItems = Array.isArray(savedJobsResult.value)
          ? savedJobsResult.value
          : [];

        const savedJobIds = savedItems
          .map((item) => item.jobId)
          .filter(Boolean);

        setSaved(savedJobIds);
      }
    } catch (error) {
      console.error("Dashboard loading error:", error);

      setMessage(error?.message || "Unable to load dashboard data.");
    } finally {
      setLoading(false);
    }
  }

  /* =========================================================
     PROFILE IMAGE CHANGE
  ========================================================= */

  function handleProfileImageChange(event) {
    const file = event.target.files?.[0];

    if (!file) {
      return;
    }

    setMessage("");

    if (!file.type.startsWith("image/")) {
      setMessage("Please select a valid image.");

      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      setMessage("Profile image must be 2 MB or smaller.");

      return;
    }

    setProfileImage(file);

    const previewUrl = URL.createObjectURL(file);

    setProfileImagePreview(previewUrl);

    setProfile((current) => ({
      ...current,
      photoUrl: previewUrl,
    }));
  }

  /* =========================================================
     SAVE PROFILE
  ========================================================= */

  async function handleSaveProfile() {
    if (!profileName.trim()) {
      setMessage("Name is required.");

      return;
    }

    try {
      setSavingProfile(true);
      setMessage("");

      const updatedProfile = {
        ...profile,

        name: profileName.trim(),

        professionalHeadline: profileDesignation.trim() || "Candidate",
      };

      /* =====================================================
         UPDATE PROFILE DATA
      ===================================================== */

      if (typeof candidateApi.updateProfile === "function") {
        const result = await candidateApi.updateProfile(updatedProfile);

        setProfile(result || updatedProfile);
      } else {
        setProfile(updatedProfile);
      }

      /* =====================================================
         UPLOAD PROFILE PHOTO
      ===================================================== */

      if (profileImage && typeof candidateApi.uploadPhoto === "function") {
        setUploadingPhoto(true);

        const uploadedPhoto = await candidateApi.uploadPhoto(profileImage);

        const photoUrl =
          typeof uploadedPhoto === "string"
            ? uploadedPhoto
            : uploadedPhoto?.photoUrl ||
              uploadedPhoto?.PhotoUrl ||
              uploadedPhoto?.url ||
              uploadedPhoto?.Url;

        if (photoUrl) {
          setProfile((current) => ({
            ...current,
            photoUrl,
          }));

          setProfileImagePreview(photoUrl);
        }
      }

      /* =====================================================
         UPDATE SESSION USER NAME
      ===================================================== */

      const currentSession = JSON.parse(
        sessionStorage.getItem("user") || "null",
      );

      if (currentSession) {
        const updatedSession = {
          ...currentSession,
          name: profileName.trim(),
        };

        sessionStorage.setItem("user", JSON.stringify(updatedSession));
      }

      setProfileImage(null);

      setEditingProfile(false);

      setMessage("Profile updated successfully.");
    } catch (error) {
      console.error("Profile update error:", error);

      setMessage(error?.message || "Unable to update profile.");
    } finally {
      setSavingProfile(false);
      setUploadingPhoto(false);
    }
  }

  /* =========================================================
     CANCEL PROFILE EDIT
  ========================================================= */

  function handleCancelProfileEdit() {
    setProfileName(profile.name || session?.name || "Candidate");

    setProfileDesignation(profile.professionalHeadline || "Candidate");

    setProfileImage(null);

    setProfileImagePreview(profile.photoUrl || "");

    setEditingProfile(false);
  }

  /* =========================================================
     SAVE / REMOVE JOB
  ========================================================= */

  async function toggleSaved(jobId) {
    if (!jobId) {
      return;
    }

    const isSaved = saved.includes(jobId);

    try {
      setSavingJobId(jobId);
      setMessage("");

      if (isSaved) {
        await savedJobsApi.remove(jobId);

        setSaved((current) => current.filter((id) => id !== jobId));

        setMessage("Job removed from saved jobs.");
      } else {
        await savedJobsApi.save(jobId);

        setSaved((current) => {
          if (current.includes(jobId)) {
            return current;
          }

          return [...current, jobId];
        });

        setMessage("Job saved successfully.");
      }
    } catch (error) {
      console.error("Save job error:", error);

      setMessage(
        error?.message ||
          (isSaved ? "Unable to remove saved job." : "Unable to save job."),
      );
    } finally {
      setSavingJobId(null);
    }
  }

  /* =========================================================
     LOGOUT
  ========================================================= */

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

  /* =========================================================
     SEARCH
  ========================================================= */

  const visibleJobs = useMemo(() => {
    const source = jobs.length > 0 ? jobs : FALLBACK_JOBS;

    const normalizedQuery = query.trim().toLowerCase();

    if (!normalizedQuery) {
      return source;
    }

    return source.filter((job) => {
      const searchableText = `
        ${job.title || ""}
        ${job.companyName || ""}
        ${job.company?.companyName || ""}
        ${job.location || ""}
        ${job.skills || ""}
        ${job.description || ""}
      `.toLowerCase();

      return searchableText.includes(normalizedQuery);
    });
  }, [jobs, query]);

  /* =========================================================
     STATS
  ========================================================= */

  const averageAtsScore = applications.length
    ? Math.round(
        applications.reduce(
          (sum, item) => sum + Number(item.atsScore || 0),
          0,
        ) / applications.length,
      )
    : 0;

  const shortlistedCount = applications.filter((item) =>
    item.status?.toLowerCase().includes("shortlist"),
  ).length;

  const interviewCount = applications.filter((item) =>
    item.status?.toLowerCase().includes("interview"),
  ).length;

  /* =========================================================
     SESSION GUARD
  ========================================================= */

  if (!session) {
    return <Navigate to="/login" replace />;
  }

  if (session.role !== "User") {
    return <Navigate to={`/${session.role.toLowerCase()}/dashboard`} replace />;
  }

  /* =========================================================
     DISPLAY PROFILE DATA
  ========================================================= */

  const displayName = profile.name || session.name || "Candidate";

  const displayDesignation = profile.professionalHeadline || "Candidate";

  const displayEmail = profile.email || session.email || "Email not available";

  const displayPhoto = profileImagePreview || profile.photoUrl || "";

  /* =========================================================
     RENDER
  ========================================================= */

  return (
    <div className="candidate-dashboard">
      {/* =====================================================
          SIDEBAR
      ===================================================== */}

      <CandidateSidebar />

      {/* =====================================================
          MAIN CONTENT
      ===================================================== */}

      <main className="candidate-dashboard-main">
        {/* ===================================================
            TOPBAR
        =================================================== */}

        <header className="candidate-dashboard-topbar">
          <div>
            <h1>Welcome back, {displayName}</h1>

            <p>
              Find your next opportunity and keep track of your applications.
            </p>
          </div>

          <div className="candidate-dashboard-topbar-actions">
            {/* ===============================================
                NOTIFICATIONS
            =============================================== */}

            <NotificationBell
              portalRole="User"
              maxItems={8}
              onOpen={() => setShowProfileMenu(false)}
              resolveRoute={(notification) =>
                notification?.type === "ApplicationStatusChanged"
                  ? "/user/applications"
                  : "/user/browse-jobs"
              }
            />

            {/* ===============================================
                PROFILE
            =============================================== */}

            <div
              className="candidate-dashboard-profile-wrapper"
              ref={profileRef}
            >
              {/* =========================================
                  HEADER PROFILE BUTTON
              ========================================= */}

              <button
                type="button"
                className={`candidate-dashboard-user ${
                  showProfileMenu ? "candidate-dashboard-user-active" : ""
                }`}
                onClick={() => {
                  setShowProfileMenu((current) => !current);
                }}
              >
                <span className="candidate-dashboard-user-avatar">
                  {displayPhoto ? (
                    <img src={displayPhoto} alt={displayName} />
                  ) : (
                    displayName.slice(0, 1).toUpperCase()
                  )}
                </span>

                <div className="candidate-dashboard-user-info">
                  <strong>{displayName}</strong>

                  <small>{displayDesignation}</small>
                </div>
              </button>

              {/* =========================================
                  PROFILE POPOVER
              ========================================= */}

              {showProfileMenu && (
                <div className="candidate-dashboard-profile-popover">
                  {/* HEADER */}

                  <div className="candidate-dashboard-profile-popover-header">
                    <div>
                      <strong>My Profile</strong>

                      <span>Manage your profile information</span>
                    </div>

                    <button
                      type="button"
                      onClick={() => {
                        setShowProfileMenu(false);

                        setEditingProfile(false);
                      }}
                      aria-label="Close profile"
                    >
                      <X size={17} />
                    </button>
                  </div>

                  {/* PROFILE IMAGE */}

                  <div className="candidate-dashboard-profile-preview">
                    <div className="candidate-dashboard-profile-large-avatar">
                      {displayPhoto ? (
                        <img src={displayPhoto} alt={displayName} />
                      ) : (
                        <UserRound size={30} />
                      )}

                      <label
                        htmlFor="candidate-profile-image"
                        className="candidate-dashboard-profile-camera"
                        title="Change profile photo"
                      >
                        <Camera size={14} />

                        <input
                          id="candidate-profile-image"
                          type="file"
                          accept="image/png,image/jpeg,image/webp"
                          onChange={handleProfileImageChange}
                        />
                      </label>
                    </div>

                    <div className="candidate-dashboard-profile-preview-info">
                      <strong>{displayName}</strong>

                      <span>{displayDesignation}</span>
                    </div>
                  </div>

                  {/* =======================================
                      PROFILE DETAILS
                  ======================================= */}

                  {!editingProfile ? (
                    <div className="candidate-dashboard-profile-details">
                      <div className="candidate-dashboard-profile-detail">
                        <span>Name</span>

                        <strong>{displayName}</strong>
                      </div>

                      <div className="candidate-dashboard-profile-detail">
                        <span>Designation</span>

                        <strong>{displayDesignation}</strong>
                      </div>

                      <div className="candidate-dashboard-profile-detail">
                        <span>Email</span>

                        <strong>{displayEmail}</strong>
                      </div>

                      <button
                        type="button"
                        className="candidate-dashboard-profile-edit-button"
                        onClick={() => {
                          setProfileName(displayName);

                          setProfileDesignation(
                            displayDesignation === "Candidate"
                              ? ""
                              : displayDesignation,
                          );

                          setEditingProfile(true);
                        }}
                      >
                        <Pencil size={14} />
                        Edit Profile
                      </button>
                    </div>
                  ) : (
                    /* =====================================
                       EDIT FORM
                    ===================================== */

                    <div className="candidate-dashboard-profile-edit-form">
                      <label>
                        <span>Name</span>

                        <input
                          type="text"
                          value={profileName}
                          onChange={(event) =>
                            setProfileName(event.target.value)
                          }
                          placeholder="Enter your name"
                        />
                      </label>

                      <label>
                        <span>Designation</span>

                        <input
                          type="text"
                          value={profileDesignation}
                          onChange={(event) =>
                            setProfileDesignation(event.target.value)
                          }
                          placeholder="e.g. Software Engineer"
                        />
                      </label>

                      <div className="candidate-dashboard-profile-edit-actions">
                        <button
                          type="button"
                          className="candidate-dashboard-profile-cancel"
                          onClick={handleCancelProfileEdit}
                          disabled={savingProfile}
                        >
                          Cancel
                        </button>

                        <button
                          type="button"
                          className="candidate-dashboard-profile-save"
                          onClick={handleSaveProfile}
                          disabled={savingProfile}
                        >
                          {savingProfile
                            ? uploadingPhoto
                              ? "Uploading..."
                              : "Saving..."
                            : "Save Changes"}
                        </button>
                      </div>
                    </div>
                  )}

                  {/* =======================================
                      FOOTER
                  ======================================= */}

                  <div className="candidate-dashboard-profile-footer">
                    <button
                      type="button"
                      onClick={() => {
                        setShowProfileMenu(false);

                        navigate("/user/profile");
                      }}
                    >
                      <UserRound size={14} />
                      View Full Profile
                    </button>

                    <button type="button" onClick={logout}>
                      <LogOut size={14} />
                      Logout
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* ===================================================
            CONTENT
        =================================================== */}

        <section className="candidate-dashboard-content">
          {/* MESSAGE */}

          {message && (
            <div className="candidate-dashboard-message">{message}</div>
          )}

          {/* =================================================
              STATS
          ================================================= */}

          <section className="candidate-dashboard-stats">
            <DashboardMetric
              icon={BriefcaseBusiness}
              label="Applications"
              value={applications.length}
              link="/user/applications"
            />

            <DashboardMetric
              icon={CheckCircle2}
              label="Average ATS"
              value={`${averageAtsScore}%`}
              link="/user/applications"
            />

            <DashboardMetric
              icon={Clock3}
              label="Shortlisted"
              value={shortlistedCount}
              link="/user/applications"
            />

            <DashboardMetric
              icon={MessageSquare}
              label="Interviews"
              value={interviewCount}
              link="/user/applications"
            />
          </section>

          {/* =================================================
              SEARCH
          ================================================= */}

          <section className="candidate-dashboard-search-section">
            <div>
              <span>Discover opportunities</span>

              <h2>Find the right job for you.</h2>

              <p>Search jobs by title, company, location or skills.</p>
            </div>

            <label className="candidate-dashboard-search">
              <Search />

              <input
                type="text"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search jobs, companies or skills..."
              />
            </label>
          </section>

          {/* =================================================
              JOB SECTION
          ================================================= */}

          <section className="candidate-dashboard-jobs-section">
            <div className="candidate-dashboard-section-heading">
              <div>
                <span>Recommended opportunities</span>

                <h2>Latest Jobs</h2>

                <p>Explore active jobs posted by companies.</p>
              </div>

              <Link to="/user/browse-jobs">View all jobs</Link>
            </div>

            {loading ? (
              <div className="candidate-dashboard-loading">Loading jobs...</div>
            ) : (
              <div className="candidate-dashboard-job-grid">
                {visibleJobs.map((job) => {
                  const jobId = job.id;

                  const companyName =
                    job.companyName || job.company?.companyName || "Company";

                  const isSaved = saved.includes(jobId);

                  const isSaving = savingJobId === jobId;

                  return (
                    <article
                      className="candidate-dashboard-job-card"
                      key={jobId}
                    >
                      <header className="candidate-dashboard-job-card-header">
                        <div className="candidate-dashboard-company-avatar">
                          {companyName?.slice(0, 1).toUpperCase()}
                        </div>

                        <button
                          type="button"
                          className={
                            isSaved
                              ? "candidate-dashboard-save-button candidate-dashboard-save-button-active"
                              : "candidate-dashboard-save-button"
                          }
                          onClick={() => toggleSaved(jobId)}
                          disabled={isSaving}
                          aria-label={isSaved ? "Remove saved job" : "Save job"}
                        >
                          <Bookmark fill={isSaved ? "currentColor" : "none"} />
                        </button>
                      </header>

                      <span className="candidate-dashboard-job-company">
                        {companyName}
                      </span>

                      <h3>{job.title || "Untitled Job"}</h3>

                      <p className="candidate-dashboard-job-description">
                        {job.description
                          ? job.description.slice(0, 130) +
                            (job.description.length > 130 ? "..." : "")
                          : "No job description available."}
                      </p>

                      <div className="candidate-dashboard-job-tags">
                        {job.employmentType && (
                          <span>{job.employmentType}</span>
                        )}

                        {job.experience !== undefined &&
                          job.experience !== null && (
                            <span>{job.experience} years</span>
                          )}
                      </div>

                      <div className="candidate-dashboard-job-meta">
                        <span>{job.location || "Location not specified"}</span>

                        {job.salary && (
                          <strong>
                            ₹{Number(job.salary).toLocaleString("en-IN")}
                          </strong>
                        )}
                      </div>

                      {job.skills && (
                        <div className="candidate-dashboard-job-skills">
                          {String(job.skills)
                            .split(",")
                            .map((skill) => (
                              <span key={skill.trim()}>{skill.trim()}</span>
                            ))
                            .filter(Boolean)
                            .slice(0, 4)}
                        </div>
                      )}

                      <footer className="candidate-dashboard-job-card-footer">
                        <Link to="/user/browse-jobs">View & Apply</Link>

                        <button
                          type="button"
                          onClick={() => toggleSaved(jobId)}
                          disabled={isSaving}
                        >
                          {isSaving
                            ? "Saving..."
                            : isSaved
                              ? "Saved"
                              : "Save Job"}
                        </button>
                      </footer>
                    </article>
                  );
                })}
              </div>
            )}

            {!loading && !visibleJobs.length && (
              <div className="candidate-dashboard-empty">
                <Search />

                <h3>No jobs found</h3>

                <p>Try another job title, company or skill.</p>
              </div>
            )}
          </section>

          {/* =================================================
              QUICK ACTIONS
          ================================================= */}

          <section className="candidate-dashboard-quick-actions">
            <div>
              <span>Candidate workspace</span>

              <h2>Manage your career profile.</h2>

              <p>
                Keep your resume and profile updated to improve your chances.
              </p>
            </div>

            <div className="candidate-dashboard-action-grid">
              <Link to="/user/resume">
                <Upload />

                <span>
                  <strong>Resume</strong>

                  <small>
                    {resume ? "Resume uploaded" : "Upload your resume"}
                  </small>
                </span>
              </Link>

              <Link to="/user/profile">
                <UserRound />

                <span>
                  <strong>Profile</strong>

                  <small>Complete your profile</small>
                </span>
              </Link>

              <Link to="/user/applications">
                <FileText />

                <span>
                  <strong>Applications</strong>

                  <small>Track your applications</small>
                </span>
              </Link>

              <Link to="/user/saved-jobs">
                <Bookmark />

                <span>
                  <strong>Saved Jobs</strong>

                  <small>{saved.length} saved</small>
                </span>
              </Link>
            </div>
          </section>
        </section>
      </main>
    </div>
  );
}

/* =========================================================
   DASHBOARD METRIC
========================================================= */

function DashboardMetric({ icon: Icon, label, value, link }) {
  return (
    <Link to={link} className="candidate-dashboard-metric">
      <div>
        <Icon />
      </div>

      <span>
        <small>{label}</small>

        <strong>{value}</strong>
      </span>
    </Link>
  );
}
