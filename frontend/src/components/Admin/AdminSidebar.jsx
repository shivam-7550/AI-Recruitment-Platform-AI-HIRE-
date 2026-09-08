import { useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import {
  BriefcaseBusiness,
  Building2,
  FileText,
  Grid2X2,
  LogOut,
  ShieldCheck,
  Users,
} from "lucide-react";

import "../../styles/AdminCSS/AdminSidebar.css";

export default function AdminSidebar() {
  const navigate = useNavigate();
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

  const handleLogout = () => {
    fetch("/api/Auth/logout", {
      method: "POST",
    }).catch(() => {});

    sessionStorage.removeItem("user");
    sessionStorage.removeItem("accessToken");
    sessionStorage.removeItem("refreshToken");

    navigate("/login", {
      replace: true,
    });
  };

  const navigationItems = [
    { label: "Dashboard", icon: Grid2X2, to: "/admin/dashboard" },
    { label: "Companies", icon: Building2, to: "/admin/companies" },
    { label: "Jobs", icon: BriefcaseBusiness, to: "/admin/jobs" },
    { label: "Users", icon: Users, to: "/admin/users" },
    { label: "Reports", icon: FileText, to: "/admin/reports" },
  ];

  return (
    <>
      <aside className="admin-sidebar">
        <NavLink to="/admin/dashboard" className="admin-sidebar-logo">
          <div className="admin-sidebar-logo-icon">
            <ShieldCheck size={22} />
          </div>

          <div>
            <strong>HireLine</strong>
            <span>Admin Panel</span>
          </div>
        </NavLink>

        <nav className="admin-sidebar-navigation">
          <div className="admin-sidebar-section-label">Workspace</div>

          {navigationItems.map((item) => {
            const Icon = item.icon;

            return (
              <NavLink
                key={item.label}
                to={item.to}
                className={({ isActive }) =>
                  `admin-sidebar-link ${
                    isActive ? "admin-sidebar-link-active" : ""
                  }`
                }
              >
                <Icon size={19} />
                <span>{item.label}</span>
              </NavLink>
            );
          })}
        </nav>

        <button
          type="button"
          className="admin-sidebar-logout"
          onClick={() => setShowLogoutConfirm(true)}
        >
          <LogOut size={19} />
          <span>Logout</span>
        </button>
      </aside>

      {showLogoutConfirm && (
        <div className="admin-logout-overlay">
          <div className="admin-logout-modal">
            <div className="admin-logout-modal-icon">
              <LogOut size={22} />
            </div>

            <h3>Logout?</h3>

            <p>Are you sure you want to logout from the admin panel?</p>

            <div className="admin-logout-actions">
              <button
                type="button"
                className="admin-logout-cancel"
                onClick={() => setShowLogoutConfirm(false)}
              >
                Cancel
              </button>

              <button
                type="button"
                className="admin-logout-confirm"
                onClick={handleLogout}
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
