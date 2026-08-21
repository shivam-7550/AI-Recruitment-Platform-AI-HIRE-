import { useEffect, useMemo, useState } from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";
import {
  Bell,
  BriefcaseBusiness,
  Building2,
  CheckCircle2,
  FileText,
  Grid2X2,
  Lightbulb,
  LogOut,
  Search,
  Settings,
  ShieldCheck,
  Users,
} from "lucide-react";
import { adminApi, notificationApi } from "../services/api";
import NotificationBell from "../components/notifications/NotificationBell";
import "../styles/AdminDashboard.css";

export default function AdminDashboard() {
  const navigate = useNavigate();
  const session = JSON.parse(sessionStorage.getItem("user") || "null");
  const [companies, setCompanies] = useState([]);
  const [jobs, setJobs] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [query, setQuery] = useState("");
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (session?.role !== "Admin") return;
    Promise.all([adminApi.companies(), adminApi.jobs(), notificationApi.mine()])
      .then(([companyData, jobData, notificationData]) => {
        setCompanies(companyData);
        setJobs(jobData);
        setNotifications(notificationData);
      })
      .catch((error) => setMessage(error.message));
  }, [session?.role]);

  const pending = companies.filter(
    (company) => company.approvalStatus === "Pending",
  );
  const approved = companies.filter(
    (company) => company.approvalStatus === "Approved",
  );
  const activeJobs = jobs.filter((job) => job.isActive);
  const unread = notifications.filter((item) => !item.isRead).length;
  const filteredJobs = useMemo(
    () =>
      jobs
        .filter((job) =>
          `${job.title} ${job.companyName} ${job.location}`
            .toLowerCase()
            .includes(query.toLowerCase()),
        )
        .slice(0, 6),
    [jobs, query],
  );
  const recentCompanies = useMemo(
    () =>
      companies
        .filter((company) =>
          `${company.companyName} ${company.industry} ${company.email}`
            .toLowerCase()
            .includes(query.toLowerCase()),
        )
        .slice(0, 6),
    [companies, query],
  );

  if (!session) return <Navigate to="/login" replace />;
  if (session.role !== "Admin")
    return <Navigate to={`/${session.role.toLowerCase()}/dashboard`} replace />;

  async function refreshCompanies() {
    setCompanies(await adminApi.companies());
  }
  async function approve(id) {
    try {
      await adminApi.approveCompany(id);
      await refreshCompanies();
      setMessage("Company approved successfully.");
    } catch (error) {
      setMessage(error.message);
    }
  }
  async function reject(id) {
    const reason = window.prompt("Reason for rejecting this company:");
    if (reason === null) return;
    try {
      await adminApi.rejectCompany(id, reason);
      await refreshCompanies();
      setMessage("Company rejected.");
    } catch (error) {
      setMessage(error.message);
    }
  }
  function logout() {
    fetch("/api/Auth/logout", { method: "POST" }).catch(() => {});
    sessionStorage.removeItem("user");
    navigate("/login");
  }

  return (
    <div className="admin-dashboard">
      <aside className="admin-sidebar">
        <Link className="admin-logo" to="/">
          <ShieldCheck />
          <span>
            HireLine
            <small>Admin Panel</small>
          </span>
        </Link>
        <nav>
          <Link className="active" to="/admin/dashboard">
            <Grid2X2 />
            Dashboard
          </Link>
          <a href="#companies">
            <Building2 />
            Companies
          </a>
          <Link to="/admin/jobs">
            <BriefcaseBusiness />
            Jobs
          </Link>
          <a href="#companies">
            <Users />
            Users
          </a>
          <a href="#jobs">
            <FileText />
            Reports
          </a>
          <a href="#insights">
            <Lightbulb />
            AI Insights
          </a>
          <button type="button">
            <Bell />
            Notifications {unread > 0 && <b>{unread}</b>}
          </button>
          <button type="button">
            <Settings />
            Settings
          </button>
        </nav>
        <button className="admin-logout" onClick={logout}>
          <LogOut />
          Logout
        </button>
        <div className="admin-insight">
          <div>✦</div>
          <h3>Platform overview</h3>
          <p>{pending.length} companies are waiting for verification.</p>
          <a href="#companies">Review requests</a>
        </div>
      </aside>

      <main className="admin-main">
        <header className="admin-topbar">
          <div>
            <h1>Dashboard</h1>
            <p>Welcome back, Admin! Here&apos;s what&apos;s happening today.</p>
          </div>
          <label>
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search anything..."
            />
            <Search />
          </label>
          <NotificationBell
            portalRole="Admin"
            maxItems={8}
            onNotificationsChange={setNotifications}
            resolveRoute={(notification) =>
              notification?.type === "CompanyRegistered"
                ? "/admin/dashboard#companies"
                : notification?.jobId
                  ? "/admin/jobs"
                  : "/admin/dashboard"
            }
          />
          <div className="admin-user">
            <span>{session.name?.slice(0, 1) || "A"}</span>
            <div>
              <strong>{session.name || "Admin User"}</strong>
              <small>Super Admin</small>
            </div>
          </div>
        </header>
        {message && <div className="admin-message">{message}</div>}

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

        <section className="admin-overview-grid">
          <article className="admin-card admin-chart-card" id="insights">
            <div className="admin-card-title">
              <h2>Platform Growth</h2>
              <span>This Month</span>
            </div>
            <div className="admin-chart-legend">
              <span>
                <i />
                Jobs
              </span>
              <span>
                <i />
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
          <article className="admin-card recent-jobs" id="jobs">
            <div className="admin-card-title">
              <h2>Recent Job Postings</h2>
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
                <strong>{job.title}</strong>
                <span>{job.companyName}</span>
                <span>{job.location}</span>
                <span>{new Date(job.createdAt).toLocaleDateString()}</span>
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

        <section className="admin-bottom-grid">
          <article className="admin-card admin-companies" id="companies">
            <div className="admin-card-title">
              <h2>Recent Companies</h2>
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
                <div>
                  <i>{company.companyName?.slice(0, 1)}</i>
                  <strong>{company.companyName}</strong>
                </div>
                <span>{company.industry || "Not specified"}</span>
                <em className={company.approvalStatus?.toLowerCase()}>
                  {company.approvalStatus}
                </em>
                <div>
                  {company.approvalStatus === "Pending" ? (
                    <>
                      <button onClick={() => approve(company.id)}>
                        Approve
                      </button>
                      <button onClick={() => reject(company.id)}>Reject</button>
                    </>
                  ) : (
                    <small>{company.isActive ? "Active" : "Inactive"}</small>
                  )}
                </div>
              </div>
            ))}
          </article>
          <article className="admin-card admin-status">
            <div className="admin-card-title">
              <h2>Company Status</h2>
              <span>Live</span>
            </div>
            <div
              className="admin-donut"
              style={{
                "--approved": `${companies.length ? (approved.length / companies.length) * 360 : 0}deg`,
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
              Approved <b>{approved.length}</b>
            </p>
            <p>
              <i className="pending" />
              Pending <b>{pending.length}</b>
            </p>
            <p>
              <i className="rejected" />
              Rejected{" "}
              <b>
                {
                  companies.filter((c) => c.approvalStatus === "Rejected")
                    .length
                }
              </b>
            </p>
          </article>
          <article className="admin-card admin-activity">
            <div className="admin-card-title">
              <h2>Recent Activity</h2>
              <span>Notifications</span>
            </div>
            {notifications.slice(0, 6).map((item) => (
              <div key={item.id}>
                <FileText />
                <p>
                  <strong>{item.title}</strong>
                  {item.message}
                </p>
                <small>{new Date(item.createdAt).toLocaleDateString()}</small>
              </div>
            ))}
            {!notifications.length && (
              <p className="admin-empty">No recent activity.</p>
            )}
          </article>
        </section>
      </main>
    </div>
  );
}

function AdminMetric({ icon: Icon, label, value, detail, tone }) {
  return (
    <article className={tone}>
      <div>
        <Icon />
      </div>
      <span>
        {label}
        <strong>{value}</strong>
        <small>{detail} ↗</small>
      </span>
    </article>
  );
}
