import { useEffect, useMemo, useState } from "react";
import { Navigate, useNavigate, Link } from "react-router-dom";

import {
  BriefcaseBusiness,
  Building2,
  CheckCircle2,
  FileText,
  Users,
} from "lucide-react";

import { adminApi, notificationApi } from "../../services/api";

import AdminSidebar from "../../components/Admin/AdminSidebar";
import AdminHeader from "../../components/Admin/AdminHeader";

import "../../styles/AdminCSS/AdminDashboard.css";

export default function AdminDashboard() {
  const navigate = useNavigate();

  const session = JSON.parse(sessionStorage.getItem("user") || "null");

  const [companies, setCompanies] = useState([]);
  const [jobs, setJobs] = useState([]);
  const [notifications, setNotifications] = useState([]);

  const [query, setQuery] = useState("");
  const [message, setMessage] = useState("");

  /* =========================================================
     LOAD DASHBOARD DATA
  ========================================================= */

  useEffect(() => {
    if (session?.role !== "Admin") {
      return;
    }

    Promise.all([adminApi.companies(), adminApi.jobs(), notificationApi.mine()])
      .then(([companyData, jobData, notificationData]) => {
        setCompanies(companyData || []);
        setJobs(jobData || []);
        setNotifications(notificationData || []);
      })
      .catch((error) => {
        console.error("Admin dashboard loading failed:", error);
        setMessage(error?.message || "Unable to load admin dashboard data.");
      });
  }, [session?.role]);

  /* =========================================================
     STATISTICS
  ========================================================= */

  const pending = companies.filter(
    (company) => company.approvalStatus === "Pending",
  );

  const approved = companies.filter(
    (company) => company.approvalStatus === "Approved",
  );

  const rejected = companies.filter(
    (company) => company.approvalStatus === "Rejected",
  );

  const activeJobs = jobs.filter((job) => job.isActive);

  const unread = notifications.filter((item) => !item.isRead).length;

  /* =========================================================
     SEARCH
  ========================================================= */

  const normalizedQuery = query.trim().toLowerCase();

  const filteredJobs = useMemo(() => {
    return jobs
      .filter((job) =>
        `${job.title || ""} ${job.companyName || ""} ${job.location || ""}`
          .toLowerCase()
          .includes(normalizedQuery),
      )
      .slice(0, 6);
  }, [jobs, normalizedQuery]);

  const recentCompanies = useMemo(() => {
    return companies
      .filter((company) =>
        `${company.companyName || ""} ${
          company.industry || ""
        } ${company.email || ""}`
          .toLowerCase()
          .includes(normalizedQuery),
      )
      .slice(0, 6);
  }, [companies, normalizedQuery]);

  /* =========================================================
     AUTHORIZATION
  ========================================================= */

  if (!session) {
    return <Navigate to="/login" replace />;
  }

  if (session.role !== "Admin") {
    return <Navigate to={`/${session.role.toLowerCase()}/dashboard`} replace />;
  }

  /* =========================================================
     COMPANY ACTIONS
  ========================================================= */

  async function refreshCompanies() {
    try {
      const data = await adminApi.companies();
      setCompanies(data || []);
    } catch (error) {
      setMessage(error?.message || "Unable to refresh companies.");
    }
  }

  async function approve(id) {
    try {
      await adminApi.approveCompany(id);

      await refreshCompanies();

      setMessage("Company approved successfully.");
    } catch (error) {
      setMessage(error?.message || "Unable to approve company.");
    }
  }

  async function reject(id) {
    const reason = window.prompt("Reason for rejecting this company:");

    if (reason === null) {
      return;
    }

    try {
      await adminApi.rejectCompany(id, reason);

      await refreshCompanies();

      setMessage("Company rejected.");
    } catch (error) {
      setMessage(error?.message || "Unable to reject company.");
    }
  }

  return (
    <div className="admin-dashboard-layout">
      {/* =====================================================
          SIDEBAR
      ====================================================== */}

      <AdminSidebar unread={unread} />

      {/* =====================================================
          MAIN
      ====================================================== */}

      <main className="admin-dashboard-main">
        <AdminHeader
          title="Dashboard"
          subtitle="Welcome back, Admin! Here's what's happening today."
          query={query}
          onQueryChange={setQuery}
          notifications={notifications}
          onNotificationsChange={setNotifications}
        />

        <div className="admin-dashboard-content">
          {/* =================================================
              MESSAGE
          ================================================= */}

          {message && (
            <div className="admin-message">
              <CheckCircle2 size={17} />
              <span>{message}</span>
            </div>
          )}

          {/* =================================================
              METRICS
          ================================================= */}

          <section className="admin-metrics">
            <AdminMetric
              icon={Building2}
              label="Companies"
              value={companies.length}
              detail={`${approved.length} approved`}
              tone="blue"
            />

            <AdminMetric
              icon={BriefcaseBusiness}
              label="Posted Jobs"
              value={jobs.length}
              detail={`${activeJobs.length} currently active`}
              tone="violet"
            />

            <AdminMetric
              icon={Users}
              label="Pending Reviews"
              value={pending.length}
              detail="Company verification"
              tone="green"
            />

            <AdminMetric
              icon={FileText}
              label="Notifications"
              value={notifications.length}
              detail={`${unread} unread alerts`}
              tone="orange"
            />

            <AdminMetric
              icon={CheckCircle2}
              label="Approved"
              value={approved.length}
              detail="Verified companies"
              tone="red"
            />
          </section>

          {/* =================================================
              OVERVIEW
          ================================================= */}

          <section className="admin-overview-grid">
            {/* =================================================
                PLATFORM GROWTH
            ================================================= */}

            <article className="admin-card admin-chart-card" id="insights">
              <div className="admin-card-title">
                <div>
                  <span>Analytics</span>
                  <h2>Platform Growth</h2>
                </div>

                <span>This Month</span>
              </div>

              <div className="admin-chart-legend">
                <span>
                  <i className="jobs-dot" />
                  Jobs
                </span>

                <span>
                  <i className="companies-dot" />
                  Companies
                </span>
              </div>

              <div className="admin-line-chart">
                <svg viewBox="0 0 500 190" preserveAspectRatio="none">
                  <polyline
                    className="jobs-line"
                    points="0,170 45,150 90,135 135,140 180,110 225,103 270,105 315,76 360,66 405,45 450,50 500,20"
                  />

                  <polyline
                    className="companies-line"
                    points="0,184 45,176 90,160 135,168 180,155 225,145 270,146 315,132 360,129 405,115 450,100 500,90"
                  />
                </svg>
              </div>

              <footer>
                <span>Week 1</span>
                <span>Week 2</span>
                <span>Week 3</span>
                <span>Week 4</span>
              </footer>
            </article>

            {/* =================================================
                RECENT JOBS
            ================================================= */}

            <article className="admin-card recent-jobs" id="jobs">
              <div className="admin-card-title">
                <div>
                  <span>Jobs</span>
                  <h2>Recent Job Postings</h2>
                </div>

                <Link to="/admin/jobs">View all</Link>
              </div>

              <div className="admin-job-head">
                <span>Job Title</span>
                <span>Company</span>
                <span>Location</span>
                <span>Posted On</span>
                <span>Status</span>
              </div>

              {filteredJobs.map((job) => (
                <div className="admin-job-row" key={job.id}>
                  <strong>{job.title || "Untitled Job"}</strong>

                  <span>{job.companyName || "Unknown"}</span>

                  <span>{job.location || "Not specified"}</span>

                  <span>
                    {job.createdAt
                      ? new Date(job.createdAt).toLocaleDateString()
                      : "—"}
                  </span>

                  <em className={job.isActive ? "active" : "closed"}>
                    {job.isActive ? "Active" : "Closed"}
                  </em>
                </div>
              ))}

              {!filteredJobs.length && (
                <p className="admin-empty">No matching jobs found.</p>
              )}
            </article>
          </section>

          {/* =================================================
              BOTTOM GRID
          ================================================= */}

          <section className="admin-bottom-grid">
            {/* =================================================
                COMPANIES
            ================================================= */}

            <article className="admin-card admin-companies" id="companies">
              <div className="admin-card-title">
                <div>
                  <span>Management</span>
                  <h2>Recent Companies</h2>
                </div>

                <span>{pending.length} pending</span>
              </div>

              <div className="admin-company-head">
                <span>Company</span>
                <span>Industry</span>
                <span>Status</span>
                <span>Action</span>
              </div>

              {recentCompanies.map((company) => (
                <div className="admin-company-row" key={company.id}>
                  <div className="admin-company-name">
                    <i>
                      {company.companyName?.slice(0, 1)?.toUpperCase() || "C"}
                    </i>

                    <strong>{company.companyName || "Unnamed Company"}</strong>
                  </div>

                  <span>{company.industry || "Not specified"}</span>

                  <em className={company.approvalStatus?.toLowerCase()}>
                    {company.approvalStatus || "Unknown"}
                  </em>

                  <div className="admin-company-actions">
                    {company.approvalStatus === "Pending" ? (
                      <>
                        <button
                          type="button"
                          onClick={() => approve(company.id)}
                        >
                          Approve
                        </button>

                        <button
                          type="button"
                          onClick={() => reject(company.id)}
                        >
                          Reject
                        </button>
                      </>
                    ) : (
                      <small>{company.isActive ? "Active" : "Inactive"}</small>
                    )}
                  </div>
                </div>
              ))}

              {!recentCompanies.length && (
                <p className="admin-empty">No companies found.</p>
              )}
            </article>

            {/* =================================================
                COMPANY STATUS
            ================================================= */}

            <article className="admin-card admin-status">
              <div className="admin-card-title">
                <div>
                  <span>Verification</span>
                  <h2>Company Status</h2>
                </div>

                <span>Live</span>
              </div>

              <div
                className="admin-donut"
                style={{
                  "--approved": `${
                    companies.length
                      ? (approved.length / companies.length) * 360
                      : 0
                  }deg`,
                }}
              >
                <strong>
                  {companies.length
                    ? Math.round((approved.length / companies.length) * 100)
                    : 0}
                  %
                </strong>

                <small>Approved</small>
              </div>

              <p>
                <i className="approved" />
                Approved
                <b>{approved.length}</b>
              </p>

              <p>
                <i className="pending" />
                Pending
                <b>{pending.length}</b>
              </p>

              <p>
                <i className="rejected" />
                Rejected
                <b>{rejected.length}</b>
              </p>
            </article>

            {/* =================================================
                RECENT ACTIVITY
            ================================================= */}

            <article className="admin-card admin-activity">
              <div className="admin-card-title">
                <div>
                  <span>Activity</span>
                  <h2>Recent Activity</h2>
                </div>

                <span>Notifications</span>
              </div>

              {notifications.slice(0, 6).map((item) => (
                <div key={item.id} className="admin-activity-item">
                  <FileText size={17} />

                  <p>
                    <strong>{item.title || "Notification"}</strong>

                    {item.message}
                  </p>

                  <small>
                    {item.createdAt
                      ? new Date(item.createdAt).toLocaleDateString()
                      : "—"}
                  </small>
                </div>
              ))}

              {!notifications.length && (
                <p className="admin-empty">No recent activity.</p>
              )}
            </article>
          </section>
        </div>
      </main>
    </div>
  );
}

/* =========================================================
   ADMIN METRIC
========================================================= */

function AdminMetric({ icon: Icon, label, value, detail, tone }) {
  return (
    <article className={`admin-metric ${tone}`}>
      <div className="admin-metric-icon">
        <Icon size={20} />
      </div>

      <div className="admin-metric-info">
        <span>{label}</span>

        <strong>{value}</strong>

        <small>{detail}</small>
      </div>
    </article>
  );
}
