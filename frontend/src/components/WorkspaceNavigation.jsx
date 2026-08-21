import { NavLink } from "react-router-dom";

const dashboardRoutes = {
  User: "/user/dashboard",
  Company: "/company/dashboard",
  Admin: "/admin/dashboard",
};

const exploreRoutes = {
  User: "/user/explore-jobs",
  Company: "/company/explore-jobs",
  Admin: "/admin/explore-jobs",
};

const workspaceLinks = {
  User: [
    ["/user/jobs", "Browse jobs"],
    ["/user/profile", "My profile"],
  ],
  Company: [
    ["/company/jobs", "Your jobs"],
    ["/company/jobs/new", "Post a job"],
    ["/company/profile", "Company profile"],
  ],
  Admin: [["/admin/jobs", "All jobs"]],
};

export default function WorkspaceNavigation({ role }) {
  return (
    <div className="workspace-nav-wrap">
      <nav className="workspace-tabs" aria-label={`${role} workspace`}>
        <NavLink to={exploreRoutes[role]}>
          <small>01</small>Explore jobs
        </NavLink>
        <NavLink to={dashboardRoutes[role]} end>
          <small>02</small>Workspace
        </NavLink>
        {workspaceLinks[role].map(([path, label], index) => (
          <NavLink key={path} to={path} end>
            <small>{String(index + 3).padStart(2, "0")}</small>
            {label}
          </NavLink>
        ))}
      </nav>
    </div>
  );
}
