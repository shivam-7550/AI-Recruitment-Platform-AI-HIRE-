import { useEffect, useState } from "react";
import { ChevronRight, FileText, X } from "lucide-react";
import { useLocation, useNavigate } from "react-router-dom";

import { companyApi } from "../services/api";
import NotificationBell from "./notifications/NotificationBell";

import "../styles/CompanyCSS/CompanyHeader.css";

export default function CompanyHeader({
  company,
  setCompany,
  title,
  subtitle,
  pageTitle,
  pageSubtitle,
}) {
  const navigate = useNavigate();
  const { pathname } = useLocation();

  const [showProfile, setShowProfile] = useState(false);

  const [editingProfile, setEditingProfile] = useState(false);
  const [savingProfile, setSavingProfile] = useState(false);
  const [profileMessage, setProfileMessage] = useState("");

  const [companyName, setCompanyName] = useState("");
  const [industry, setIndustry] = useState("");

  // ==========================================
  // COMPANY DATA
  // ==========================================

  useEffect(() => {
    const syncCompanyForm = window.setTimeout(() => {
      setCompanyName(company?.companyName || "");
      setIndustry(company?.industry || "");
    }, 0);

    return () => window.clearTimeout(syncCompanyForm);
  }, [company]);

  // ==========================================
  // PROFILE SAVE
  // ==========================================

  async function handleSaveProfile() {
    if (!company?.id) {
      return;
    }

    setSavingProfile(true);
    setProfileMessage("");

    try {
      const updated = await companyApi.update(company.id, {
        ...company,
        companyName: companyName.trim(),
        industry: industry.trim(),
      });

      const nextCompany = updated || {
        ...company,
        companyName: companyName.trim(),
        industry: industry.trim(),
      };

      setCompany?.(nextCompany);

      setProfileMessage("Company profile updated successfully.");

      setEditingProfile(false);
    } catch (error) {
      console.error("Company profile update error:", error);

      setProfileMessage(error?.message || "Unable to update company profile.");
    } finally {
      setSavingProfile(false);
    }
  }

  // ==========================================
  // CLOSE DROPDOWNS
  // ==========================================

  function closeProfile() {
    setShowProfile(false);
    setEditingProfile(false);
    setProfileMessage("");
  }

  // ==========================================
  // COMPANY DISPLAY
  // ==========================================

  const displayCompanyName = company?.companyName?.trim() || "Company";

  const displayIndustry = company?.industry?.trim() || "Industry not specified";

  const companyInitial = displayCompanyName.charAt(0).toUpperCase();

  // ==========================================
  // DYNAMIC HEADER TITLE
  // ==========================================

  const routeHeaders = {
    "/company/posted-jobs": {
      title: "Posted Jobs",
      subtitle: "Manage all the jobs posted by your company.",
    },
    "/company/applications": {
      title: "Applications",
      subtitle: "Review and manage candidates who applied to your jobs.",
    },
    "/company/interviews": {
      title: "Interviews",
      subtitle: "Manage scheduled interviews and candidate progress.",
    },
    "/company/messages": {
      title: "Messages",
      subtitle: "View and manage your recruitment conversations.",
    },
    "/company/profile": {
      title: "Company Profile",
      subtitle: "Manage your company information and hiring identity.",
    },
    "/company/settings": {
      title: "Settings",
      subtitle: "Manage your company account preferences.",
    },
    "/company/candidates": {
      title: "Candidates",
      subtitle: "Discover and review candidates for your open roles.",
    },
    "/company/analytics": {
      title: "Analytics",
      subtitle: "Track jobs, applications and hiring performance.",
    },
    "/company/team": {
      title: "Team Members",
      subtitle: "Manage the people involved in your hiring process.",
    },
    "/company/jobs/new": {
      title: "Post a Job",
      subtitle: "Create and publish a new opportunity.",
    },
  };

  const routeHeader = routeHeaders[pathname];

  const headerTitle =
    title ||
    pageTitle ||
    routeHeader?.title ||
    `Welcome back, ${displayCompanyName}`;

  const headerSubtitle =
    subtitle ||
    pageSubtitle ||
    routeHeader?.subtitle ||
    "Manage your jobs, applications and hiring activity.";

  return (
    <header className="company-header">
      {/* ======================================
          TITLE
      ====================================== */}

      <div className="company-header-title">
        <h1>{headerTitle}</h1>

        <p>{headerSubtitle}</p>
      </div>

      {/* ======================================
          ACTIONS
      ====================================== */}

      <div className="company-header-actions">
        {/* ====================================
            NOTIFICATION
        ==================================== */}

        <NotificationBell
          portalRole="Company"
          maxItems={8}
          onOpen={() => setShowProfile(false)}
          resolveRoute={(notification) =>
            notification?.jobId ? "/company/posted-jobs" : "/company/dashboard"
          }
        />

        {/* ====================================
            COMPANY PROFILE
        ==================================== */}

        <div className="company-header-profile-wrapper">
          <button
            type="button"
            className="company-header-profile-trigger"
            onClick={() => {
              setShowProfile((current) => !current);
              setProfileMessage("");
            }}
          >
            <div className="company-header-company-mark">{companyInitial}</div>

            <div className="company-header-profile-info">
              <strong>{displayCompanyName}</strong>

              <small>{displayIndustry}</small>
            </div>
          </button>

          {/* ==================================
              PROFILE POPUP
          ================================== */}

          {showProfile && (
            <div className="company-header-profile-popup">
              {/* Popup Header */}

              <div className="company-header-profile-popup-head">
                <div>
                  <span>COMPANY PROFILE</span>

                  <strong>{displayCompanyName}</strong>
                </div>

                <button
                  type="button"
                  onClick={closeProfile}
                  aria-label="Close profile"
                >
                  <X />
                </button>
              </div>

              {/* Profile Preview */}

              <div className="company-header-profile-preview">
                <div className="company-header-profile-avatar">
                  {companyInitial}
                </div>

                <div>
                  <strong>{displayCompanyName}</strong>

                  <small>{displayIndustry}</small>
                </div>
              </div>

              {/* Profile Fields */}

              {editingProfile && (
                <div className="company-header-profile-fields">
                  <label>
                    <span>Company Name</span>

                    <input
                      type="text"
                      value={companyName}
                      onChange={(event) => setCompanyName(event.target.value)}
                    />
                  </label>

                  <label>
                    <span>Industry</span>

                    <input
                      type="text"
                      value={industry}
                      onChange={(event) => setIndustry(event.target.value)}
                    />
                  </label>
                </div>
              )}

              {/* Profile Message */}

              {profileMessage && (
                <p className="company-header-profile-message">
                  {profileMessage}
                </p>
              )}

              {/* Profile Actions */}

              <div className="company-header-profile-actions">
                {editingProfile ? (
                  <>
                    <button
                      type="button"
                      onClick={() => {
                        setEditingProfile(false);
                        setCompanyName(company?.companyName || "");
                        setIndustry(company?.industry || "");
                        setProfileMessage("");
                      }}
                    >
                      Cancel
                    </button>

                    <button
                      type="button"
                      onClick={handleSaveProfile}
                      disabled={savingProfile}
                    >
                      {savingProfile ? "Saving..." : "Save Changes"}
                    </button>
                  </>
                ) : (
                  <>
                    <button
                      type="button"
                      onClick={() => setEditingProfile(true)}
                    >
                      Edit Profile
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        closeProfile();
                        navigate("/company/profile");
                      }}
                    >
                      View Profile
                    </button>
                  </>
                )}
              </div>

              {/* Full Profile */}

              <button
                type="button"
                className="company-header-profile-full"
                onClick={() => {
                  closeProfile();
                  navigate("/company/profile");
                }}
              >
                <FileText />

                <span>Open complete company profile</span>

                <ChevronRight />
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
