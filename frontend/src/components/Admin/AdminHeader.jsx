import { Search } from "lucide-react";

import NotificationBell from "../notifications/NotificationBell";

import "../../styles/AdminCSS/AdminHeader.css";

export default function AdminHeader({
  title = "Dashboard",
  subtitle = "Welcome back, Admin! Here's what's happening today.",
  query = "",
  onQueryChange,
  notifications = [],
  onNotificationsChange,
}) {
  const session = JSON.parse(sessionStorage.getItem("user") || "null");

  const adminName = session?.name || "Admin User";

  const initials =
    adminName
      ?.split(" ")
      .filter(Boolean)
      .map((name) => name.charAt(0))
      .slice(0, 2)
      .join("")
      .toUpperCase() || "A";

  return (
    <header className="admin-header">
      {/* =====================================================
          TITLE
      ====================================================== */}

      <div className="admin-header-title">
        <span>Admin Workspace</span>

        <h1>{title}</h1>

        <p>{subtitle}</p>
      </div>

      {/* =====================================================
          SEARCH
      ====================================================== */}

      <label className="admin-header-search">
        <Search size={18} />

        <input
          type="text"
          value={query}
          onChange={(event) => onQueryChange?.(event.target.value)}
          placeholder="Search anything..."
        />
      </label>

      {/* =====================================================
          NOTIFICATION
      ====================================================== */}

      <div className="admin-header-notification">
        <NotificationBell
          portalRole="Admin"
          maxItems={8}
          onNotificationsChange={onNotificationsChange}
          resolveRoute={(notification) =>
            notification?.type === "CompanyRegistered"
              ? "/admin/companies"
              : notification?.jobId
                ? "/admin/jobs"
                : "/admin/dashboard"
          }
        />
      </div>

      {/* =====================================================
          ADMIN PROFILE
      ====================================================== */}

      <div className="admin-header-user">
        <div className="admin-header-avatar">{initials}</div>

        <div className="admin-header-user-info">
          <strong>{adminName}</strong>
          <small>Super Admin</small>
        </div>
      </div>
    </header>
  );
}
