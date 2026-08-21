// import { useEffect, useMemo, useState } from "react";
// import { Navigate, useNavigate } from "react-router-dom";
// import AppShell from "../components/AppShell";
// import WorkspaceNavigation from "../components/WorkspaceNavigation";
// import { jobsApi } from "../services/api";

// export default function Jobs({ workspaceRole }) {
//   const navigate = useNavigate();
//   const sessionUser = JSON.parse(sessionStorage.getItem("user") || "null");
//   const user = workspaceRole ? sessionUser : null;
//   const [jobs, setJobs] = useState([]);
//   const [query, setQuery] = useState("");
//   const [location, setLocation] = useState("");
//   const [error, setError] = useState("");

//   useEffect(() => {
//     jobsApi.all().then(setJobs).catch((e) => setError(e.message));
//   }, []);

//   const visible = useMemo(() => jobs.filter((job) => {
//     const text = `${job.title} ${job.companyName} ${job.skills}`.toLowerCase();
//     return text.includes(query.toLowerCase()) &&
//       job.location.toLowerCase().includes(location.toLowerCase());
//   }), [jobs, query, location]);

//   if (workspaceRole && !sessionUser) {
//     return <Navigate to="/login" replace />;
//   }

//   if (workspaceRole && sessionUser.role !== workspaceRole) {
//     return <Navigate
//       to={`/${sessionUser.role.toLowerCase()}/explore-jobs`}
//       replace
//     />;
//   }

//   return (
//     <AppShell workspaceNavigation={
//       user ? <WorkspaceNavigation role={user.role} /> : null
//     }>
//       {!user && <section className="hero">
//         <p className="eyebrow">The focused talent marketplace</p>
//         <h1>Find work that<br /><em>moves you forward.</em></h1>
//         <p className="hero-copy">
//           Search open roles, understand the essentials, and apply with one
//           thoughtful profile.
//         </p>
//         <div className="search-bar">
//           <label>
//             <span>Role or skill</span>
//             <input value={query} onChange={(e) => setQuery(e.target.value)}
//               placeholder="Product designer, React..." />
//           </label>
//           <label>
//             <span>Location</span>
//             <input value={location} onChange={(e) => setLocation(e.target.value)}
//               placeholder="City or remote" />
//           </label>
//           <button onClick={() => document.querySelector("#openings")?.scrollIntoView()}>
//             Search roles
//           </button>
//         </div>
//       </section>}

//       <section className={`content-section ${user ? "logged-jobs-page" : ""}`} id="openings">
//         <div className="section-heading">
//           <div>
//             <p className="eyebrow">{user ? `${user.role} / Explore` : "Fresh opportunities"}</p>
//             <h2>{user ? "Explore every opportunity" : "Latest jobs posted"}</h2>
//           </div>
//           <span>{visible.length} positions</span>
//         </div>
//         {user && (
//           <div className="explore-filters">
//             <label><span>Role, company or skill</span>
//               <input value={query} onChange={(e) => setQuery(e.target.value)}
//                 placeholder="Search opportunities" /></label>
//             <label><span>Location</span>
//               <input value={location} onChange={(e) => setLocation(e.target.value)}
//                 placeholder="City or remote" /></label>
//           </div>
//         )}
//         {error && <div className="notice error">{error}</div>}
//         <div className="job-list">
//           {visible.map((job, index) => (
//             <article className="job-row" key={job.id}>
//               <span className="job-index">{String(index + 1).padStart(2, "0")}</span>
//               <div className="job-main">
//                 <p>{job.companyName}</p>
//                 <h3>{job.title}</h3>
//                 <div className="job-meta">
//                   <span>{job.location}</span>
//                   <span>{job.employmentType}</span>
//                   <span>{job.experience} yrs</span>
//                 </div>
//               </div>
//               <div className="job-side">
//                 <strong>₹{Number(job.salary).toLocaleString("en-IN")}</strong>
//                 <button onClick={() => navigate(
//                   user?.role === "User" ? "/user/dashboard" : `/${user?.role?.toLowerCase() || "user"}/dashboard`,
//                   { state: { jobId: job.id } })}>
//                   {user?.role === "User" ? "View & apply ↗" : "View details ↗"}
//                 </button>
//               </div>
//             </article>
//           ))}
//           {!error && visible.length === 0 && (
//             <div className="empty-state">No roles match this search yet.</div>
//           )}
//         </div>
//       </section>
//     </AppShell>
//   );
// }
