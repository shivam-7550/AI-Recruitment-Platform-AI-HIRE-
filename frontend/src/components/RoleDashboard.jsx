import { Navigate } from "react-router-dom";
import AppShell from "./AppShell";
import WorkspaceNavigation from "./WorkspaceNavigation";

const dashboardRoutes = {
  User: "/user/dashboard",
  Company: "/company/dashboard",
  Admin: "/admin/dashboard",
};

export default function RoleDashboard({ role, title, profile, children, compact = false }) {
  const user = JSON.parse(sessionStorage.getItem("user") || "null");

  if (!user) return <Navigate to="/login" replace />;
  if (user.role !== role) {
    return <Navigate to={dashboardRoutes[user.role] || "/"} replace />;
  }

  const workspaceNavigation = <WorkspaceNavigation role={role} />;

  return (
    <AppShell workspaceNavigation={workspaceNavigation}>
      <section className={`workspace-head ${compact ? "compact" : ""}`}>
        <p className="eyebrow">{role} workspace</p>
        <h1>{title}</h1>
        <div className="identity-chip">
          {profile?.photoUrl
            ? <img src={profile.photoUrl} alt="" />
            : <span>{profile?.name?.slice(0, 1) || role.slice(0, 1)}</span>}
          <div>
            <strong>{profile?.name || role}</strong>
            <small>{profile?.degree || profile?.professionalHeadline || "Authenticated session"}</small>
          </div>
        </div>
      </section>
      {children}
    </AppShell>
  );
}
