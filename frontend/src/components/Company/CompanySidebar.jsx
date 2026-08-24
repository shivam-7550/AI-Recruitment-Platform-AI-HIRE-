import { NavLink, useNavigate } from "react-router-dom";
import {
  BriefcaseBusiness,
  CalendarDays,
  FileText,
  LogOut,
  MessageSquare,
  Plus,
  Settings,
  UserRound,
} from "lucide-react";

import "../../styles/CompanyCSS/CompanySidebar.css";

const NAVIGATION_ITEMS = [
  {
    label: "Dashboard",
    path: "/company/dashboard",
    icon: BriefcaseBusiness,
  },
  // {
  //   label: "Post a Job",
  //   path: "/company/jobs/new",
  //   icon: Plus,
  // },
  {
    label: "Posted Jobs",
    path: "/company/posted-jobs",
    icon: FileText,
  },
  {
    label: "Applications",
    path: "/company/applications",
    icon: FileText,
  },
  {
    label: "Interviews",
    path: "/company/interviews",
    icon: CalendarDays,
  },
  {
    label: "Messages",
    path: "/company/messages",
    icon: MessageSquare,
  },
  {
    label: "Profile",
    path: "/company/profile",
    icon: UserRound,
  },
  {
    label: "Settings",
    path: "/company/settings",
    icon: Settings,
  },
];

export default function CompanySidebar() {
  const navigate = useNavigate();

  function logout() {
    sessionStorage.removeItem("user");
    sessionStorage.removeItem("accessToken");
    sessionStorage.removeItem("refreshToken");

    navigate("/login", {
      replace: true,
    });
  }

  return (
    <aside className="company-sidebar">
      {/* ================================
          LOGO
      ================================= */}
      <div className="company-sidebar-logo">
        <NavLink to="/company/dashboard">
          <strong>HireLine</strong>
        </NavLink>
      </div>

      {/* ================================
          NAVIGATION
      ================================= */}
      <nav className="company-sidebar-nav">
        {NAVIGATION_ITEMS.map((item) => {
          const Icon = item.icon;

          return (
            <NavLink
              key={item.path}
              to={item.path}
              end={item.path === "/company/dashboard"}
              className={({ isActive }) =>
                `company-sidebar-link ${
                  isActive ? "company-sidebar-link-active" : ""
                }`
              }
            >
              <Icon className="company-sidebar-link-icon" />

              <span className="company-sidebar-link-label">{item.label}</span>
            </NavLink>
          );
        })}
      </nav>

      {/* ================================
          LOGOUT
      ================================= */}
      <div className="company-sidebar-bottom">
        <button
          type="button"
          className="company-sidebar-logout"
          onClick={logout}
        >
          <LogOut className="company-sidebar-logout-icon" />

          <span>Logout</span>
        </button>
      </div>
    </aside>
  );
}
