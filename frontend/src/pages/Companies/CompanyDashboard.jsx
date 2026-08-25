import { useEffect, useMemo, useRef, useState } from "react";
import { Link, Navigate, useLocation, useNavigate } from "react-router-dom";

import {
  BarChart3,
  Bell,
  BriefcaseBusiness,
  CalendarDays,
  CheckCircle2,
  ChevronRight,
  FileText,
  Plus,
  Search,
  ShieldCheck,
  TrendingUp,
  UserCheck,
  UserRound,
  Users,
  X,
} from "lucide-react";

import RoleDashboard from "../../components/RoleDashboard";
import CompanySidebar from "../../components/Company/CompanySidebar";
import { CompanyWorkspace } from "../WorkspaceModules";

import { companyApi, jobsApi, notificationApi } from "../../services/api";

import "../../styles/CompanyCSS/CompanyDashboard.css";
import CompanyHeader from "../../components/Company/CompanyHeader";

export default function CompanyDashboard() {
  const { pathname } = useLocation();
  const navigate = useNavigate();

  const session = JSON.parse(sessionStorage.getItem("user") || "null");

  const notificationRef = useRef(null);
  const profileRef = useRef(null);

  const [company, setCompany] = useState(null);
  const [jobs, setJobs] = useState([]);
  const [applications, setApplications] = useState([]);
  const [notifications, setNotifications] = useState([]);

  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [postMessage, setPostMessage] = useState("");

  const [showNotifications, setShowNotifications] = useState(false);
  const [showProfile, setShowProfile] = useState(false);

  const [jobForm, setJobForm] = useState({
    title: "",
    description: "",
    location: "",
    salary: "",
    experience: 0,
    employmentType: "Full-time",
    skills: "",
    vacancies: 1,
    lastDateToApply: "",
  });

  const [profileForm, setProfileForm] = useState({
    companyName: "",
    email: "",
    phone: "",
    website: "",
    industry: "",
    description: "",
    address: "",
    city: "",
    state: "",
    country: "",
  });

  const view = pathname.endsWith("/jobs/new")
    ? "post"
    : pathname.endsWith("/jobs")
      ? "jobs"
      : pathname.endsWith("/profile")
        ? "profile"
        : "overview";

  const userId = session?.userId || tokenUserId(session?.token);

  // ==========================================
  // LOAD DASHBOARD
  // ==========================================

  useEffect(() => {
    if (!userId || session?.role !== "Company") {
      return;
    }

    loadDashboard();
  }, [userId, session?.role]);

  async function loadDashboard() {
    setLoading(true);

    try {
      const [companyResult, jobsResult, notificationsResult] =
        await Promise.allSettled([
          companyApi.byUser(userId),
          jobsApi.all(),
          notificationApi.mine(),
        ]);

      const companyData =
        companyResult.status === "fulfilled" ? companyResult.value : null;

      setCompany(companyData);

      if (companyData) {
        setProfileForm({
          companyName: companyData.companyName || "",
          email: companyData.email || session?.email || "",
          phone: companyData.phone || "",
          website: companyData.website || "",
          industry: companyData.industry || "",
          description: companyData.description || "",
          address: companyData.address || "",
          city: companyData.city || "",
          state: companyData.state || "",
          country: companyData.country || "",
        });
      }

      const allJobs = jobsResult.status === "fulfilled" ? jobsResult.value : [];

      const ownJobs = companyData
        ? allJobs.filter((job) => job.companyId === companyData.id)
        : [];

      setJobs(ownJobs);

      if (notificationsResult.status === "fulfilled") {
        setNotifications(
          Array.isArray(notificationsResult.value)
            ? notificationsResult.value
            : [],
        );
      }

      const applicationResults = await Promise.allSettled(
        ownJobs.map((job) => companyApi.applicants(job.id)),
      );

      const applicationData = applicationResults.flatMap((result) =>
        result.status === "fulfilled"
          ? Array.isArray(result.value)
            ? result.value
            : []
          : [],
      );

      setApplications(applicationData);
    } catch (error) {
      console.error("Company dashboard loading error:", error);
    } finally {
      setLoading(false);
    }
  }

  // ==========================================
  // CLOSE DROPDOWNS ON OUTSIDE CLICK
  // ==========================================

  useEffect(() => {
    function handleOutsideClick(event) {
      if (
        notificationRef.current &&
        !notificationRef.current.contains(event.target)
      ) {
        setShowNotifications(false);
      }

      if (profileRef.current && !profileRef.current.contains(event.target)) {
        setShowProfile(false);
      }
    }

    document.addEventListener("mousedown", handleOutsideClick);

    return () => {
      document.removeEventListener("mousedown", handleOutsideClick);
    };
  }, []);

  // ==========================================
  // FILTER JOBS
  // ==========================================

  const filteredJobs = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    if (!normalizedQuery) {
      return jobs;
    }

    return jobs.filter((job) =>
      `
        ${job.title || ""}
        ${job.location || ""}
        ${job.skills || ""}
      `
        .toLowerCase()
        .includes(normalizedQuery),
    );
  }, [jobs, query]);

  // ==========================================
  // STATS
  // ==========================================

  const shortlisted = applications.filter((item) =>
    item.status?.toLowerCase().includes("shortlist"),
  );

  const interviews = applications.filter((item) =>
    item.status?.toLowerCase().includes("interview"),
  );

  const hires = applications.filter((item) =>
    item.status?.toLowerCase().includes("hire"),
  );

  const unread = notifications.filter((item) => !item.isRead).length;

  const recentNotifications = useMemo(() => {
    return [...notifications]
      .sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0))
      .slice(0, 5);
  }, [notifications]);

  // ==========================================
  // NOTIFICATION
  // ==========================================

  async function handleNotificationClick(notification) {
    try {
      if (notification && !notification.isRead) {
        await notificationApi.read(notification.id);

        setNotifications((current) =>
          current.map((item) =>
            item.id === notification.id
              ? {
                  ...item,
                  isRead: true,
                }
              : item,
          ),
        );
      }

      if (notification?.jobId) {
        setShowNotifications(false);
        navigate("/company/posted-jobs");
      }
    } catch (error) {
      console.error("Notification error:", error);

      setPostMessage(error?.message || "Unable to open notification.");
    }
  }

  async function markAllNotificationsAsRead() {
    const unreadItems = notifications.filter((item) => !item.isRead);

    if (!unreadItems.length) {
      return;
    }

    await Promise.allSettled(
      unreadItems.map((item) => notificationApi.read(item.id)),
    );

    setNotifications((current) =>
      current.map((item) => ({
        ...item,
        isRead: true,
      })),
    );
  }

  // ==========================================
  // JOB FORM
  // ==========================================

  function changeJob(event) {
    setJobForm((current) => ({
      ...current,
      [event.target.name]: event.target.value,
    }));
  }

  async function publishJob(event) {
    event.preventDefault();

    try {
      const created = await jobsApi.create({
        ...jobForm,
        salary: Number(jobForm.salary),
        experience: Number(jobForm.experience),
        vacancies: Number(jobForm.vacancies),
      });

      setJobs((current) => [created, ...current]);

      setPostMessage("Job successfully published.");

      window.setTimeout(() => {
        navigate("/company/dashboard");
      }, 700);
    } catch (error) {
      setPostMessage(error?.message || "Unable to publish job.");
    }
  }

  // ==========================================
  // PROFILE
  // ==========================================

  function changeProfile(event) {
    setProfileForm((current) => ({
      ...current,
      [event.target.name]: event.target.value,
    }));
  }

  async function saveProfile(event) {
    event.preventDefault();

    try {
      await companyApi.update(company.id, profileForm);

      setCompany((current) => ({
        ...current,
        ...profileForm,
      }));

      setPostMessage("Company profile updated successfully.");

      window.setTimeout(() => {
        navigate("/company/dashboard");
      }, 700);
    } catch (error) {
      setPostMessage(error?.message || "Unable to update company profile.");
    }
  }

  // ==========================================
  // LOGOUT
  // ==========================================

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

  // ==========================================
  // AUTH
  // ==========================================

  if (!session) {
    return <Navigate to="/login" replace />;
  }

  if (session.role !== "Company") {
    return <Navigate to={`/${session.role.toLowerCase()}/dashboard`} replace />;
  }

  if (loading) {
    return <div className="company-loading">Loading company workspace…</div>;
  }

  if (
    !company ||
    view === "jobs" ||
    (view === "post" && company.approvalStatus !== "Approved")
  ) {
    // return (
    //   <RoleDashboard role="Company" title="Build your team. Shape the future.">
    //     <CompanyWorkspace view={view} />
    //   </RoleDashboard>
    // );
  }

  const companyInitial = company.companyName?.slice(0, 1)?.toUpperCase() || "C";

  return (
    <div className="company-dashboard">
      {/* ==========================================
          SIDEBAR
          ========================================== */}

      <CompanySidebar company={company} />

      {/* ==========================================
          MAIN
          ========================================== */}

      <div className="company-main">
        {/* ========================================
            TOPBAR
            ======================================== */}

        <CompanyHeader company={company} setCompany={setCompany} />

        {/* ========================================
            CONTENT
            ======================================== */}

        <div className="company-content">
          <div className="company-center">
            {company.approvalStatus !== "Approved" && (
              <div className="company-approval-banner">
                <ShieldCheck />

                <div>
                  <strong>
                    Company verification: {company.approvalStatus}
                  </strong>

                  <p>
                    Dashboard and profile are available. Job posting unlocks
                    after Admin approval.
                  </p>
                </div>

                <Link to="/company/profile">Complete profile</Link>
              </div>
            )}

            <section className="company-welcome">
              <div>
                <h1>Welcome back, {company.companyName}! 👋</h1>

                <p>Here&apos;s what&apos;s happening with your hiring today.</p>

                <div>
                  <Link to="/company/jobs/new">
                    <Plus />
                    Post a New Job
                  </Link>

                  <Link to="/company/posted-jobs">View All Jobs</Link>
                </div>
              </div>

              <div className="company-welcome-art">
                <Users />
                <Search />
                <TrendingUp />
              </div>
            </section>

            <section className="company-metrics">
              <CompanyMetric
                icon={BriefcaseBusiness}
                label="Total Jobs"
                value={jobs.length}
                detail="Published positions"
              />

              <CompanyMetric
                icon={FileText}
                label="Total Applications"
                value={applications.length}
                detail="Across all jobs"
              />

              <CompanyMetric
                icon={UserCheck}
                label="Shortlisted"
                value={shortlisted.length}
                detail="Selected profiles"
              />

              <CompanyMetric
                icon={CalendarDays}
                label="Interviews"
                value={interviews.length}
                detail="Interview stage"
              />

              <CompanyMetric
                icon={Users}
                label="Hires"
                value={hires.length}
                detail="Successful hires"
              />
            </section>

            <section className="company-panel">
              <div className="company-panel-head">
                <div>
                  <h2>Active Jobs</h2>

                  <label className="company-job-search">
                    <Search />

                    <input
                      value={query}
                      onChange={(event) => setQuery(event.target.value)}
                      placeholder="Search jobs or skills..."
                    />
                  </label>
                </div>

                <Link to="/company/posted-jobs">
                  View All Jobs
                  <ChevronRight />
                </Link>
              </div>

              <div className="active-job-list">
                {filteredJobs.slice(0, 5).map((job) => {
                  const jobApps = applications.filter(
                    (a) => a.jobId === job.id,
                  );

                  return (
                    <article key={job.id}>
                      <span>{job.title?.slice(0, 2).toUpperCase()}</span>

                      <div>
                        <strong>{job.title}</strong>

                        <small>
                          {job.employmentType} · {job.location}
                        </small>
                      </div>

                      <p>
                        Applications
                        <b>{jobApps.length}</b>
                      </p>

                      <p>
                        Shortlisted
                        <b>
                          {
                            jobApps.filter((a) =>
                              a.status?.toLowerCase().includes("shortlist"),
                            ).length
                          }
                        </b>
                      </p>

                      <p>
                        Interviews
                        <b>
                          {
                            jobApps.filter((a) =>
                              a.status?.toLowerCase().includes("interview"),
                            ).length
                          }
                        </b>
                      </p>

                      <button type="button">•••</button>
                    </article>
                  );
                })}

                {!filteredJobs.length && (
                  <div className="company-empty">No matching active jobs.</div>
                )}
              </div>
            </section>

            <section className="company-panel" id="applications">
              <div className="company-panel-head">
                <h2>Recent Applications</h2>

                <span>Latest candidates</span>
              </div>

              <div className="company-application-list">
                <div className="company-table-head">
                  <span>Candidate</span>
                  <span>Job</span>
                  <span>Applied On</span>
                  <span>Status</span>
                  <span>Match Score</span>
                </div>

                {applications.slice(0, 5).map((item) => (
                  <article key={item.id}>
                    <div>
                      <i>{item.userId?.slice(0, 2).toUpperCase()}</i>

                      <strong>Candidate</strong>
                    </div>

                    <span>{item.jobTitle}</span>

                    <span>
                      {item.appliedAt
                        ? new Date(item.appliedAt).toLocaleDateString()
                        : "-"}
                    </span>

                    <em>{item.status}</em>

                    <b>
                      {Math.round(Number(item.atsScore || 0))}%
                      <i>
                        <small
                          style={{
                            width: `${Math.min(
                              Number(item.atsScore || 0),
                              100,
                            )}%`,
                          }}
                        />
                      </i>
                    </b>
                  </article>
                ))}

                {!applications.length && (
                  <div className="company-empty">
                    Applications will appear here.
                  </div>
                )}
              </div>
            </section>
          </div>

          {/* RIGHT SIDEBAR */}

          <aside className="company-rightbar">
            <section className="company-side-card">
              <h2>Quick Actions</h2>

              {[
                [Plus, "Post a New Job", "/company/jobs/new"],
                [Users, "Browse Candidates", "/company/candidates"],
                [CalendarDays, "Schedule Interview", "/company/interviews"],
                [FileText, "View All Applications", "/company/applications"],
              ].map(([Icon, label, to]) => (
                <Link to={to} key={label}>
                  <Icon />
                  {label}
                  <ChevronRight />
                </Link>
              ))}
            </section>

            <section
              className="company-side-card analytics-card"
              id="analytics"
            >
              <div>
                <h2>Applications Overview</h2>

                <span>This month</span>
              </div>

              <div className="company-chart">
                <svg viewBox="0 0 260 130" preserveAspectRatio="none">
                  <polyline points="0,105 35,87 70,91 105,65 140,76 175,42 210,50 260,15" />
                </svg>

                <i>100</i>
                <i>75</i>
                <i>50</i>
                <i>25</i>
              </div>

              <footer>
                <span>1 May</span>
                <span>8 May</span>
                <span>15 May</span>
                <span>22 May</span>
                <span>29 May</span>
              </footer>
            </section>

            <section className="company-side-card activity-card" id="activity">
              <h2>Recent Activity</h2>

              {applications.slice(0, 4).map((item) => (
                <div key={item.id}>
                  <UserCheck />

                  <p>
                    New application received for{" "}
                    <strong>{item.jobTitle}</strong>
                  </p>

                  <small>
                    {item.appliedAt
                      ? new Date(item.appliedAt).toLocaleDateString()
                      : "-"}
                  </small>
                </div>
              ))}

              {!applications.length && (
                <p className="company-empty">No recent activity.</p>
              )}
            </section>
          </aside>
        </div>

        {/* ========================================
            POST JOB MODAL
            ======================================== */}

        {view === "post" && (
          <div className="company-post-overlay" role="dialog" aria-modal="true">
            <form className="company-post-form" onSubmit={publishJob}>
              <div className="company-post-head">
                <div>
                  <span>New opportunity</span>

                  <h2>Post a Job</h2>

                  <p>Add clear details to attract the right candidates.</p>
                </div>

                <button
                  type="button"
                  onClick={() => navigate("/company/dashboard")}
                >
                  ×
                </button>
              </div>

              <div className="company-form-grid">
                <JobField
                  label="Job title"
                  name="title"
                  value={jobForm.title}
                  onChange={changeJob}
                />

                <JobField
                  label="Location"
                  name="location"
                  value={jobForm.location}
                  onChange={changeJob}
                />

                <JobField
                  label="Annual salary"
                  name="salary"
                  type="number"
                  value={jobForm.salary}
                  onChange={changeJob}
                />

                <JobField
                  label="Experience (years)"
                  name="experience"
                  type="number"
                  min="0"
                  value={jobForm.experience}
                  onChange={changeJob}
                />

                <label>
                  <span>Employment type</span>

                  <select
                    name="employmentType"
                    value={jobForm.employmentType}
                    onChange={changeJob}
                  >
                    <option>Full-time</option>
                    <option>Part-time</option>
                    <option>Contract</option>
                    <option>Internship</option>
                    <option>Remote</option>
                  </select>
                </label>

                <JobField
                  label="Vacancies"
                  name="vacancies"
                  type="number"
                  min="1"
                  value={jobForm.vacancies}
                  onChange={changeJob}
                />

                <JobField
                  label="Required skills"
                  name="skills"
                  value={jobForm.skills}
                  onChange={changeJob}
                  full
                />

                <JobField
                  label="Last date to apply"
                  name="lastDateToApply"
                  type="datetime-local"
                  value={jobForm.lastDateToApply}
                  onChange={changeJob}
                  full
                />

                <label className="full">
                  <span>Job description</span>

                  <textarea
                    name="description"
                    value={jobForm.description}
                    onChange={changeJob}
                    required
                  />
                </label>
              </div>

              {postMessage && (
                <div className="company-post-message">{postMessage}</div>
              )}

              <div className="company-post-actions">
                <button
                  type="button"
                  onClick={() => navigate("/company/dashboard")}
                >
                  Cancel
                </button>

                <button type="submit">
                  <Plus />
                  Publish Job
                </button>
              </div>
            </form>
          </div>
        )}

        {/* ========================================
            FULL COMPANY PROFILE MODAL
            ======================================== */}

        {view === "profile" && (
          <div className="company-post-overlay" role="dialog" aria-modal="true">
            <form
              className="company-post-form company-profile-form"
              onSubmit={saveProfile}
            >
              <div className="company-post-head">
                <div>
                  <span>Company identity</span>

                  <h2>Update Company Profile</h2>

                  <p>Keep your hiring identity accurate and complete.</p>
                </div>

                <button
                  type="button"
                  onClick={() => navigate("/company/dashboard")}
                >
                  ×
                </button>
              </div>

              <div className="company-form-grid">
                <JobField
                  label="Company name"
                  name="companyName"
                  value={profileForm.companyName}
                  onChange={changeProfile}
                />

                <JobField
                  label="Registration email"
                  name="email"
                  type="email"
                  value={profileForm.email}
                  disabled
                  required={false}
                />

                <JobField
                  label="Phone"
                  name="phone"
                  value={profileForm.phone}
                  onChange={changeProfile}
                />

                <JobField
                  label="Website"
                  name="website"
                  type="url"
                  value={profileForm.website}
                  onChange={changeProfile}
                />

                <JobField
                  label="Industry / Designation"
                  name="industry"
                  value={profileForm.industry}
                  onChange={changeProfile}
                />

                <JobField
                  label="City"
                  name="city"
                  value={profileForm.city}
                  onChange={changeProfile}
                />

                <JobField
                  label="State"
                  name="state"
                  value={profileForm.state}
                  onChange={changeProfile}
                />

                <JobField
                  label="Country"
                  name="country"
                  value={profileForm.country}
                  onChange={changeProfile}
                />

                <JobField
                  label="Address"
                  name="address"
                  value={profileForm.address}
                  onChange={changeProfile}
                  full
                />

                <label className="full">
                  <span>Company description</span>

                  <textarea
                    name="description"
                    value={profileForm.description}
                    onChange={changeProfile}
                  />
                </label>
              </div>

              {postMessage && (
                <div className="company-post-message">{postMessage}</div>
              )}

              <div className="company-post-actions">
                <button
                  type="button"
                  onClick={() => navigate("/company/dashboard")}
                >
                  Cancel
                </button>

                <button type="submit">Save Profile</button>
              </div>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}

// ==========================================
// METRIC
// ==========================================

function CompanyMetric({ icon: Icon, label, value, detail }) {
  return (
    <article>
      <div>
        <Icon />
      </div>

      <span>
        {label}

        <strong>{value}</strong>

        <small>{detail}</small>
      </span>
    </article>
  );
}

// ==========================================
// JOB FIELD
// ==========================================

function JobField({ label, full, ...props }) {
  return (
    <label className={full ? "full" : ""}>
      <span>{label}</span>

      <input required {...props} />
    </label>
  );
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
