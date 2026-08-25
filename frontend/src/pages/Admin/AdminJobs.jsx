import { useEffect, useMemo, useState } from "react";
import { Navigate } from "react-router-dom";
import {
  BriefcaseBusiness,
  CheckCircle2,
  Clock3,
  MapPin,
  Search,
} from "lucide-react";
import AdminSidebar from "../../components/Admin/AdminSidebar";
import AdminHeader from "../../components/Admin/AdminHeader";
import { adminApi } from "../../services/api";
import "../../styles/AdminCSS/AdminJobs.css";

export default function AdminJobs() {
  const session = JSON.parse(sessionStorage.getItem("user") || "null");
  const [jobs, setJobs] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [query, setQuery] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (session?.role !== "Admin") return;
    adminApi.jobs()
      .then((jobData) => {
        setJobs(jobData || []);
      })
      .catch((requestError) =>
        setError(requestError?.message || "Unable to load posted jobs."),
      )
      .finally(() => setLoading(false));
  }, [session?.role]);

  const unread = notifications.filter(
    (notification) => !notification.isRead,
  ).length;
  const normalizedQuery = query.trim().toLowerCase();
  const filteredJobs = useMemo(
    () =>
      jobs.filter((job) =>
        `${job.title || ""} ${job.companyName || ""} ${job.location || ""} ${job.skills || ""}`
          .toLowerCase()
          .includes(normalizedQuery),
      ),
    [jobs, normalizedQuery],
  );
  const activeJobs = jobs.filter((job) => job.isActive).length;

  if (!session) return <Navigate to="/login" replace />;
  if (session.role !== "Admin")
    return <Navigate to={`/${session.role.toLowerCase()}/dashboard`} replace />;

  return (
    <div className="admin-dashboard-layout">
      <AdminSidebar unread={unread} />
      <main className="admin-dashboard-main">
        <AdminHeader
          title="Jobs"
          subtitle="Monitor every opportunity posted by registered companies."
          query={query}
          onQueryChange={setQuery}
          notifications={notifications}
          onNotificationsChange={setNotifications}
        />
        <div className="admin-dashboard-content admin-jobs-page">
          {error && <div className="admin-jobs-notice">{error}</div>}
          <section className="admin-jobs-page-heading">
            <div>
              <span>Platform directory</span>
              <h2>Posted Jobs</h2>
              <p>
                Browse all roles currently published by companies on HireLine.
              </p>
            </div>
            <div className="admin-jobs-summary">
              <span>
                <BriefcaseBusiness size={15} /> {jobs.length} total jobs
              </span>
              <span>
                <CheckCircle2 size={15} /> {activeJobs} active
              </span>
              <span>
                <Clock3 size={15} /> {jobs.length - activeJobs} closed
              </span>
            </div>
          </section>
          {loading ? (
            <div className="admin-jobs-empty">Loading posted jobs...</div>
          ) : filteredJobs.length ? (
            <section className="admin-job-card-grid">
              {filteredJobs.map((job) => {
                const companyName = job.companyName || "Company";
                const skills = String(job.skills || "")
                  .split(",")
                  .map((skill) => skill.trim())
                  .filter(Boolean)
                  .slice(0, 4);
                return (
                  <article className="admin-directory-job-card" key={job.id}>
                    <header>
                      <div className="admin-directory-job-avatar">
                        {companyName.slice(0, 1).toUpperCase()}
                      </div>
                      <span
                        className={
                          job.isActive
                            ? "admin-job-status active"
                            : "admin-job-status closed"
                        }
                      >
                        {job.isActive ? "Active" : "Closed"}
                      </span>
                    </header>
                    <span className="admin-directory-job-company">
                      {companyName}
                    </span>
                    <h3>{job.title || "Untitled Job"}</h3>
                    <p className="admin-directory-job-description">
                      {job.description || "No job description available."}
                    </p>
                    <div className="admin-directory-job-tags">
                      {job.employmentType && <span>{job.employmentType}</span>}
                      {job.experience !== undefined &&
                        job.experience !== null && (
                          <span>{job.experience} years</span>
                        )}
                    </div>
                    <div className="admin-directory-job-meta">
                      <span>
                        <MapPin size={12} />{" "}
                        {job.location || "Location not specified"}
                      </span>
                      {job.salary && (
                        <strong>
                          ₹{Number(job.salary).toLocaleString("en-IN")}
                        </strong>
                      )}
                    </div>
                    {skills.length > 0 && (
                      <div className="admin-directory-job-skills">
                        {skills.map((skill) => (
                          <span key={skill}>{skill}</span>
                        ))}
                      </div>
                    )}
                    <footer>
                      <span>
                        {job.createdAt
                          ? `Posted ${new Date(job.createdAt).toLocaleDateString()}`
                          : "Posting date unavailable"}
                      </span>
                    </footer>
                  </article>
                );
              })}
            </section>
          ) : (
            <div className="admin-jobs-empty">
              <Search size={20} />
              <span>
                {query
                  ? "No jobs match your search."
                  : "No jobs have been posted yet."}
              </span>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
