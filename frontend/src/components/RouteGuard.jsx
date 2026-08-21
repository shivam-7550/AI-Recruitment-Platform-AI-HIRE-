import { Navigate, Outlet, useLocation } from "react-router-dom";

function readSession() {
  try {
    return JSON.parse(sessionStorage.getItem("user") || "null");
  } catch {
    return null;
  }
}

const dashboardFor = (role) =>
  ({
    User: "/user/dashboard",
    Company: "/company/dashboard",
    Admin: "/admin/dashboard",
  })[role] || "/login";

export function RoleGuard({ role }) {
  const location = useLocation();
  const user = readSession();

  if (!user) {
    sessionStorage.setItem(
      "hireline-return-to",
      `${location.pathname}${location.search}${location.hash}`,
    );
    return <Navigate to="/login" state={{ from: location }} replace />;
  }
  if (user.role !== role)
    return <Navigate to={dashboardFor(user.role)} replace />;
  return <Outlet />;
}

export function DashboardRedirect() {
  const user = readSession();
  return <Navigate to={user ? dashboardFor(user.role) : "/login"} replace />;
}

export function SafeFallback() {
  const user = readSession();
  return <Navigate to={user ? dashboardFor(user.role) : "/"} replace />;
}
