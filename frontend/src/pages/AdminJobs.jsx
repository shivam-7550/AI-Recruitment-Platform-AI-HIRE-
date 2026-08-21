import { useEffect, useState } from "react";
import RoleDashboard from "../components/RoleDashboard";
import { adminApi } from "../services/api";

export default function AdminJobs() {
  const [jobs, setJobs] = useState([]);
  const [error, setError] = useState("");

  useEffect(() => {
    adminApi.jobs().then(setJobs).catch((e) => setError(e.message));
  }, []);

  return (
    <RoleDashboard role="Admin" title={<>Monitor every<br />opportunity.</>}>
      <section className="content-section">
        <div className="section-heading">
          <div><p className="eyebrow">Admin / Jobs</p><h2>Platform job directory</h2></div>
          <span>{jobs.length} total jobs</span>
        </div>
        {error && <div className="notice error">{error}</div>}
        <div className="data-table admin-jobs-table">
          <div className="table-head">
            <span>Position</span><span>Company</span><span>Location</span><span>Status</span>
          </div>
          {jobs.map((job) => (
            <div className="table-row" key={job.id}>
              <div><strong>{job.title}</strong>
                <small>{new Date(job.createdAt).toLocaleDateString()}</small></div>
              <span>{job.companyName}</span><span>{job.location}</span>
              <span className="status">{job.isActive ? "Active" : "Closed"}</span>
            </div>
          ))}
          {!error && !jobs.length &&
            <div className="empty-state compact">No jobs have been posted.</div>}
        </div>
      </section>
    </RoleDashboard>
  );
}
