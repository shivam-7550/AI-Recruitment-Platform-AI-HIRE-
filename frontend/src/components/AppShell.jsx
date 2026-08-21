import { useEffect, useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { notificationApi } from "../services/api";

export default function AppShell({ children, workspaceNavigation }) {
  const navigate = useNavigate();
  const user = JSON.parse(sessionStorage.getItem("user") || "null");
  const userRole = user?.role;
  const exploreRoutes = {
    User: "/user/explore-jobs",
    Company: "/company/explore-jobs",
    Admin: "/admin/explore-jobs",
  };
  const [notifications, setNotifications] = useState([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const [notificationError, setNotificationError] = useState("");

  useEffect(() => {
    if (userRole === "User" || userRole === "Company" || userRole === "Admin") {
      notificationApi
        .mine()
        .then((items) => {
          setNotifications(items);
          setNotificationError("");
        })
        .catch((error) => setNotificationError(error.message));
      const refresh = window.setInterval(() => {
        notificationApi
          .mine()
          .then((items) => {
            setNotifications(items);
            setNotificationError("");
          })
          .catch((error) => setNotificationError(error.message));
      }, 5000);
      return () => window.clearInterval(refresh);
    }
  }, [userRole]);

  const unread = notifications.filter((item) => !item.isRead).length;

  function logout() {
    fetch("/api/Auth/logout", { method: "POST" }).catch(() => {});
    sessionStorage.removeItem("user");
    navigate("/login");
  }

  async function toggleNotifications() {
    const nextState = !showNotifications;
    setShowNotifications(nextState);
    if (nextState) {
      try {
        setNotifications(await notificationApi.mine());
        setNotificationError("");
      } catch (error) {
        setNotificationError(error.message);
      }
    }
  }
  async function openNotification(item) {
    if (!item.isRead) {
      await notificationApi.read(item.id);
      setNotifications((items) =>
        items.map((current) =>
          current.id === item.id ? { ...current, isRead: true } : current,
        ),
      );
    }
    if (item.jobId) {
      const notificationRoutes = {
        User: "/user/explore-jobs",
        Company: "/company/posted-jobs",
        Admin: "/admin/jobs",
      };
      navigate(notificationRoutes[user?.role] || "/jobs", {
        state: { jobId: item.jobId, notificationType: item.type },
      });
    } else if (item.type === "CompanyRegistered") {
      navigate("/admin/dashboard");
    } else if (
      item.type === "CompanyApproved" ||
      item.type === "CompanyRejected"
    ) {
      navigate("/company/dashboard");
    }
    setShowNotifications(false);
  }

  return (
    <div className="app-shell">
      <header className="site-header">
        <NavLink
          to={user ? exploreRoutes[userRole] : "/jobs"}
          className="brand"
          aria-label="Hireline home"
        >
          HIRE<span>LINE</span>
        </NavLink>
        {workspaceNavigation}
        <nav className="site-nav" aria-label="Primary navigation">
          {!user && <NavLink to="/jobs">Explore jobs</NavLink>}
          {user && (
            <div className="notification-wrap">
              <button
                className="notification-button"
                onClick={toggleNotifications}
                aria-label={`${unread} unread notifications`}
              >
                <svg viewBox="0 0 24 24" aria-hidden="true">
                  <path d="M18 8a6 6 0 00-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9M10 21h4" />
                </svg>
                {unread > 0 && <span>{unread > 9 ? "9+" : unread}</span>}
              </button>
              {showNotifications && (
                <div className="notification-panel">
                  <div className="notification-head">
                    <strong>Notifications</strong>
                    <span>{unread} new</span>
                  </div>
                  {notificationError && (
                    <p className="notification-error">
                      Could not load notifications: {notificationError}
                    </p>
                  )}
                  {notifications.slice(0, 8).map((item) => (
                    <button
                      className={item.isRead ? "read" : ""}
                      key={item.id}
                      onClick={() => openNotification(item)}
                    >
                      <strong>{item.title}</strong>
                      <span>{item.message}</span>
                      <small>{new Date(item.createdAt).toLocaleString()}</small>
                    </button>
                  ))}
                  {!notifications.length && (
                    <p className="notification-empty">No notifications yet.</p>
                  )}
                </div>
              )}
            </div>
          )}
          {user && (
            <button className="header-logout" onClick={logout}>
              Log out
            </button>
          )}
          {!user && (
            <NavLink className="nav-cta" to="/login">
              Sign in
            </NavLink>
          )}
        </nav>
      </header>
      <main>{children}</main>
      <footer className="site-footer">
        <strong>HIRELINE</strong>
        <span>Talent, clearly connected.</span>
        <span>© 2026</span>
      </footer>
    </div>
  );
}
