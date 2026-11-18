import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import { candidateApi } from "../../services/api";
import NotificationBell from "../notifications/NotificationBell";

import "../../styles/CandidatesCSS/CandidateHeader.css";

export default function CandidateHeader({ title, subtitle }) {
  const navigate = useNavigate();

  const session = JSON.parse(sessionStorage.getItem("user") || "null");

  const [profile, setProfile] = useState({});

  useEffect(() => {
    let mounted = true;

    async function loadHeader() {
      const profileResult = await candidateApi.profile();

      if (!mounted) return;

      setProfile(profileResult || {});
    }

    loadHeader().catch(() => {});

    return () => {
      mounted = false;
    };
  }, []);

  const displayName = profile.name || session?.name || "Candidate";
  const displayDesignation =
    profile.professionalHeadline ||
    profile.currentJobTitle ||
    session?.professionalHeadline ||
    session?.designation ||
    "Candidate";
  const displayPhoto = profile.photoUrl || session?.photoUrl || "";

  return (
    <header className="candidate-shared-header">
      {/* =========================
          HEADER TITLE
          ========================= */}
      <div className="candidate-shared-header-title">
        <h1>{title}</h1>

        <p>{subtitle}</p>
      </div>

      {/* =========================
          HEADER ACTIONS
          ========================= */}
      <div className="candidate-shared-header-actions">
        {/* =========================
            NOTIFICATION
            ========================= */}
        <NotificationBell portalRole="User" maxItems={8} />

        {/* =========================
            USER PROFILE
            ========================= */}
        <button
          type="button"
          className="candidate-shared-header-user"
          onClick={() => navigate("/user/profile")}
          aria-label={`Open profile for ${displayName}`}
        >
          <span>
            {displayPhoto ? (
              <img src={displayPhoto} alt={displayName} />
            ) : (
              displayName.slice(0, 1).toUpperCase()
            )}
          </span>

          <div>
            <strong>{displayName}</strong>

            <small>{displayDesignation}</small>
          </div>
        </button>
      </div>
    </header>
  );
}
