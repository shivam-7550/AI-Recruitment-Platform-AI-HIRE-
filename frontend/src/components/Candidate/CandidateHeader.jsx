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
        <NotificationBell
          portalRole="User"
          maxItems={8}
          resolveRoute={(notification) =>
            notification?.type === "ApplicationSubmittedCandidate" ||
            notification?.type === "ApplicationStatusChanged"
              ? "/user/applications"
              : "/user/browse-jobs"
          }
        />

        {/* =========================
            USER PROFILE
            ========================= */}
        <button
          type="button"
          className="candidate-shared-header-user"
          onClick={() => navigate("/user/profile")}
        >
          <span>
            {profile.photoUrl ? (
              <img src={profile.photoUrl} alt="" />
            ) : (
              profile.name?.slice(0, 1) || session?.name?.slice(0, 1) || "U"
            )}
          </span>

          <div>
            <strong>{profile.name || session?.name || "Candidate"}</strong>

            <small>Candidate</small>
          </div>
        </button>
      </div>
    </header>
  );
}
