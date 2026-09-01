import { NavLink, useNavigate } from "react-router-dom";
import {
  Bookmark,
  BriefcaseBusiness,
  CalendarDays,
  FileText,
  LogOut,
  MessageSquare,
  Search,
  Settings,
  Upload,
  UserRound,
} from "lucide-react";

import "../../styles/CandidatesCSS/CandidateSidebar.css";

const NAVIGATION_ITEMS = [
  {
    label: "Dashboard",
    path: "/user/dashboard",
    icon: BriefcaseBusiness,
  },
  {
    label: "Browse Jobs",
    path: "/user/browse-jobs",
    icon: Search,
  },
  {
    label: "My Applications",
    path: "/user/applications",
    icon: FileText,
  },
  {
    label: "Interviews",
    path: "/user/interviews",
    icon: CalendarDays,
  },
  {
    label: "Resume",
    path: "/user/resume",
    icon: Upload,
  },
  {
    label: "Saved Jobs",
    path: "/user/saved-jobs",
    icon: Bookmark,
  },
  {
    label: "Messages",
    path: "/user/messages",
    icon: MessageSquare,
  },
  {
    label: "Profile",
    path: "/user/profile",
    icon: UserRound,
  },
  {
    label: "Settings",
    path: "/user/settings",
    icon: Settings,
  },
];

export default function CandidateSidebar() {
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
    <aside className="candidate-sidebar">
      {/* ================================
          LOGO
      ================================= */}

      <div className="candidate-sidebar-logo">
        <NavLink to="/user/dashboard">
          <strong>AI-HIRE</strong>
        </NavLink>
      </div>

      {/* ================================
          NAVIGATION
      ================================= */}

      <nav className="candidate-sidebar-nav">
        {NAVIGATION_ITEMS.map((item) => {
          const Icon = item.icon;

          return (
            <NavLink
              key={item.path}
              to={item.path}
              end={item.path === "/user/dashboard"}
              className={({ isActive }) =>
                `candidate-sidebar-link ${
                  isActive ? "candidate-sidebar-link-active" : ""
                }`
              }
            >
              <Icon className="candidate-sidebar-link-icon" />

              <span className="candidate-sidebar-link-label">{item.label}</span>
            </NavLink>
          );
        })}
      </nav>

      {/* ================================
          LOGOUT
      ================================= */}

      <div className="candidate-sidebar-bottom">
        <button
          type="button"
          className="candidate-sidebar-logout"
          onClick={logout}
        >
          <LogOut className="candidate-sidebar-logout-icon" />

          <span>Logout</span>
        </button>
      </div>
    </aside>
  );
}
