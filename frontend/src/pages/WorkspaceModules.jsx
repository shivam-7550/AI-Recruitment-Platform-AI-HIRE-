import { useEffect, useState } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { adminApi, candidateApi, companyApi, jobsApi } from "../services/api";

const initialJob = {
  title: "",
  description: "",
  location: "",
  salary: "",
  experience: 0,
  employmentType: "Full-time",
  skills: "",
  vacancies: 1,
  lastDateToApply: "",
};

export function RoleDashboardRedirect() {
  const user = JSON.parse(sessionStorage.getItem("user") || "null");

  if (!user) return <Navigate to="/login" replace />;
  const routes = {
    User: "/user/dashboard",
    Company: "/company/dashboard",
    Admin: "/admin/dashboard",
  };
  return <Navigate to={routes[user.role] || "/"} replace />;
}

export function CandidateWorkspace({ selectedJob }) {
  const [resume, setResume] = useState(null);
  const [applications, setApplications] = useState([]);
  const [jobs, setJobs] = useState([]);
  const [message, setMessage] = useState("");

  useEffect(() => {
    Promise.all([jobsApi.all(), candidateApi.applications()])
      .then(([jobData, applicationData]) => {
        setJobs(jobData);
        setApplications(applicationData);
      })
      .catch((e) => setMessage(e.message));

    candidateApi
      .resume()
      .then(setResume)
      .catch(() => setResume(null));
  }, []);

  async function upload(event) {
    const file = event.target.files[0];
    if (!file) return;
    try {
      setResume(await candidateApi.uploadResume(file));
      setMessage("Resume uploaded and ready to use.");
    } catch (e) {
      setMessage(e.message);
    }
  }

  async function apply(jobId) {
    if (!resume) return setMessage("Upload a resume before applying.");
    try {
      setMessage(await candidateApi.apply(jobId, resume.id));
      setApplications(await candidateApi.applications());
    } catch (e) {
      setMessage(e.message);
    }
  }

  return (
    <section className="workspace-grid content-section">
      <div className="panel span-2">
        <div className="panel-title">
          <div>
            <p className="eyebrow">01 / Profile</p>
            <h2>Your resume</h2>
          </div>
          <label className="button dark">
            Upload PDF or DOCX
            <input type="file" accept=".pdf,.docx" onChange={upload} hidden />
          </label>
        </div>
        {resume ? (
          <div className="resume-card">
            <strong>{resume.fileName}</strong>
            <span>
              Uploaded {new Date(resume.uploadedAt).toLocaleDateString()}
            </span>
          </div>
        ) : (
          <div className="empty-state compact">
            Add a resume to unlock one-click applications.
          </div>
        )}
        {message && <div className="notice">{message}</div>}
      </div>
      <div className="panel span-2">
        <div className="panel-title">
          <div>
            <p className="eyebrow">02 / Discover</p>
            <h2>Latest jobs posted</h2>
          </div>
          <span>{jobs.length} open</span>
        </div>
        <div className="mini-list">
          {jobs.slice(0, 6).map((job) => (
            <article
              key={job.id}
              className={selectedJob === job.id ? "selected" : ""}
            >
              <div>
                <small>
                  {job.companyName} · {job.location}
                </small>
                <h3>{job.title}</h3>
              </div>
              <button onClick={() => apply(job.id)}>Apply ↗</button>
            </article>
          ))}
        </div>
      </div>
      <div className="panel span-4">
        <div className="panel-title">
          <div>
            <p className="eyebrow">03 / Progress</p>
            <h2>Your applications</h2>
          </div>
        </div>
        <div className="data-table">
          <div className="table-head">
            <span>Position</span>
            <span>Company</span>
            <span>ATS score</span>
            <span>Status</span>
          </div>
          {applications.map((item) => (
            <div className="table-row" key={item.id}>
              <strong>{item.jobTitle}</strong>
              <span>{item.companyName}</span>
              <span>{Math.round(item.atsScore)}%</span>
              <span className="status">{item.status}</span>
            </div>
          ))}
          {!applications.length && (
            <div className="empty-state compact">
              Your applications will appear here.
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

export function CompanyWorkspace({ view = "overview" }) {
  const navigate = useNavigate();
  const sessionUser = JSON.parse(sessionStorage.getItem("user") || "null");
  const userId = sessionUser?.userId || parseJwt(sessionUser?.token)?.nameid;
  const [company, setCompany] = useState(null);
  const [jobs, setJobs] = useState([]);
  const [form, setForm] = useState(initialJob);
  const [profile, setProfile] = useState({
    companyName: "",
    email: "",
    industry: "",
    city: "",
    country: "",
    description: "",
  });
  const [message, setMessage] = useState("");

  useEffect(() => {
    jobsApi.all().then(setJobs);
    if (userId) {
      companyApi
        .byUser(userId)
        .then(setCompany)
        .catch(() => {});
      const companyRefresh = window.setInterval(() => {
        companyApi
          .byUser(userId)
          .then(setCompany)
          .catch(() => {});
      }, 5000);
      return () => window.clearInterval(companyRefresh);
    }
  }, [userId]);

  const change = (setter) => (e) =>
    setter((old) => ({ ...old, [e.target.name]: e.target.value }));

  async function createProfile(e) {
    e.preventDefault();
    try {
      setCompany(await companyApi.create({ ...profile, userId }));
      setMessage("Company profile submitted for admin approval.");
      navigate("/company/dashboard");
    } catch (err) {
      setMessage(err.message);
    }
  }

  async function publish(e) {
    e.preventDefault();
    try {
      await jobsApi.create({
        ...form,
        salary: Number(form.salary),
        experience: Number(form.experience),
        vacancies: Number(form.vacancies),
      });
      setForm(initialJob);
      setJobs(await jobsApi.all());
      setMessage("Role published successfully.");
      navigate("/company/jobs");
    } catch (err) {
      setMessage(err.message);
    }
  }

  if (!company)
    return (
      <section className="content-section narrow">
        <div className="panel">
          <p className="eyebrow">Company setup</p>
          <h2>Build your company profile</h2>
          <p className="muted">
            Complete this once. It links your account to company job tools.
          </p>
          <form className="form-grid" onSubmit={createProfile}>
            <Field
              name="companyName"
              label="Company name"
              value={profile.companyName}
              onChange={change(setProfile)}
            />
            <Field
              name="email"
              type="email"
              label="Work email"
              value={profile.email}
              onChange={change(setProfile)}
            />
            <Field
              name="industry"
              label="Industry"
              value={profile.industry}
              onChange={change(setProfile)}
            />
            <Field
              name="city"
              label="City"
              value={profile.city}
              onChange={change(setProfile)}
            />
            <Field
              name="country"
              label="Country"
              value={profile.country}
              onChange={change(setProfile)}
            />
            <label className="field full">
              <span>About the company</span>
              <textarea
                name="description"
                value={profile.description}
                onChange={change(setProfile)}
              />
            </label>
            <button className="button dark full">Create company profile</button>
          </form>
          {message && <div className="notice">{message}</div>}
        </div>
      </section>
    );

  if (company.approvalStatus !== "Approved")
    return (
      <section className="content-section narrow">
        <div
          className={`approval-card panel ${company.approvalStatus?.toLowerCase()}`}
        >
          <p className="eyebrow">Company verification</p>
          <span className="approval-badge">{company.approvalStatus}</span>
          <h2>
            {company.approvalStatus === "Rejected"
              ? "Verification needs attention."
              : "Your profile is under review."}
          </h2>
          <p className="muted">
            {company.approvalStatus === "Rejected"
              ? company.rejectionReason
              : "An administrator will review your company details. Job publishing will unlock automatically after approval."}
          </p>
          <div className="approval-steps">
            <span className="done">Profile submitted</span>
            <span
              className={company.approvalStatus === "Pending" ? "current" : ""}
            >
              Admin review
            </span>
            <span>Job publishing</span>
          </div>
        </div>
      </section>
    );

  const ownJobs = jobs.filter((job) => job.companyId === company.id);
  return (
    <section className={`workspace-grid content-section company-view-${view}`}>
      <div className="panel span-2">
        <p className="eyebrow">Company profile</p>
        <h2>{company.companyName}</h2>
        <p className="muted">
          {company.description ||
            "Add a clear company description to attract the right people."}
        </p>
        <div className="stat-line">
          <span>
            Industry<strong>{company.industry || "—"}</strong>
          </span>
          <span>
            Location<strong>{company.city || "—"}</strong>
          </span>
        </div>
      </div>
      <div className="panel span-2">
        <p className="eyebrow">Publish a position</p>
        <h2>New job</h2>
        <form className="form-grid dense" onSubmit={publish}>
          <Field
            name="title"
            label="Job title"
            value={form.title}
            onChange={change(setForm)}
          />
          <Field
            name="location"
            label="Location"
            value={form.location}
            onChange={change(setForm)}
          />
          <Field
            name="salary"
            type="number"
            label="Annual salary"
            value={form.salary}
            onChange={change(setForm)}
          />
          <Field
            name="experience"
            type="number"
            label="Experience (years)"
            value={form.experience}
            onChange={change(setForm)}
          />
          <Field
            name="employmentType"
            label="Employment type"
            value={form.employmentType}
            onChange={change(setForm)}
          />
          <Field
            name="vacancies"
            type="number"
            label="Vacancies"
            value={form.vacancies}
            onChange={change(setForm)}
          />
          <Field
            name="skills"
            label="Skills (comma separated)"
            value={form.skills}
            onChange={change(setForm)}
            full
          />
          <Field
            name="lastDateToApply"
            type="datetime-local"
            label="Apply by"
            value={form.lastDateToApply}
            onChange={change(setForm)}
            full
          />
          <label className="field full">
            <span>Description</span>
            <textarea
              required
              name="description"
              value={form.description}
              onChange={change(setForm)}
            />
          </label>
          <button className="button dark full">Publish position</button>
        </form>
        {message && <div className="notice">{message}</div>}
      </div>
      <div className="panel span-4">
        <div className="panel-title">
          <div>
            <p className="eyebrow">Live portfolio</p>
            <h2>Your positions</h2>
          </div>
          <span>{ownJobs.length} roles</span>
        </div>
        <div className="mini-list">
          {ownJobs.map((job) => (
            <article key={job.id}>
              <div>
                <small>
                  {job.location} · {job.employmentType}
                </small>
                <h3>{job.title}</h3>
              </div>
              <button
                onClick={async () => {
                  await jobsApi.remove(job.id);
                  setJobs(await jobsApi.all());
                }}
              >
                Remove
              </button>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

export function AdminWorkspace() {
  const [companies, setCompanies] = useState([]);
  const [jobs, setJobs] = useState([]);
  useEffect(() => {
    Promise.all([adminApi.companies(), adminApi.jobs()]).then(([c, j]) => {
      setCompanies(c);
      setJobs(j);
    });
  }, []);

  async function refreshCompanies() {
    setCompanies(await adminApi.companies());
  }

  async function approveCompany(id) {
    await adminApi.approveCompany(id);
    await refreshCompanies();
  }

  async function rejectCompany(id) {
    const reason = window.prompt("Reason for rejecting this company:");
    if (reason === null) return;
    await adminApi.rejectCompany(id, reason);
    await refreshCompanies();
  }
  return (
    <section className="workspace-grid content-section">
      <Metric label="Registered companies" value={companies.length} />
      <Metric label="Published positions" value={jobs.length} />
      <Metric
        label="Active companies"
        value={companies.filter((c) => c.isActive).length}
      />
      <Metric
        label="Pending approvals"
        value={companies.filter((c) => c.approvalStatus === "Pending").length}
      />
      <Metric
        label="Open positions"
        value={jobs.filter((j) => j.isActive).length}
      />
      <div className="panel span-4">
        <p className="eyebrow">Platform directory</p>
        <h2>Companies</h2>
        <div className="data-table">
          {companies.map((c) => (
            <div className="table-row admin" key={c.id}>
              <strong>{c.companyName}</strong>
              <span>{c.industry || "Unspecified"}</span>
              <span>{c.city || "—"}</span>
              <div className="admin-company-action">
                <span className="status">{c.approvalStatus}</span>
                {c.approvalStatus === "Pending" && (
                  <>
                    <button onClick={() => approveCompany(c.id)}>
                      Approve
                    </button>
                    <button onClick={() => rejectCompany(c.id)}>Reject</button>
                  </>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function Field({ label, full, ...props }) {
  return (
    <label className={`field ${full ? "full" : ""}`}>
      <span>{label}</span>
      <input required {...props} />
    </label>
  );
}
function Metric({ label, value }) {
  return (
    <div className="metric">
      <strong>{value}</strong>
      <span>{label}</span>
    </div>
  );
}
function parseJwt(token) {
  try {
    const data = JSON.parse(
      atob(token.split(".")[1].replace(/-/g, "+").replace(/_/g, "/")),
    );
    return {
      ...data,
      nameid:
        data[
          "http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier"
        ],
    };
  } catch {
    return {};
  }
}
