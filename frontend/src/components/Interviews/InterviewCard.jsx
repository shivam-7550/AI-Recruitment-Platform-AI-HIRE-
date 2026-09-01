import {
  CalendarDays,
  Clock3,
  ExternalLink,
  MapPin,
  UserRound,
  Video,
} from "lucide-react";

import InterviewStatusBadge from "./InterviewStatusBadge";

import "../../styles/InterviewCSS/InterviewCard.css";

export default function InterviewCard({
  interview,
  role = "Company",
  onView,
  onEdit,
  onStatusChange,
  onDelete,
}) {
  if (!interview) {
    return null;
  }

  const isCompany = role === "Company";

  const candidateName = interview.candidateName || "Candidate";

  const candidateEmail = interview.candidateEmail || "-";

  const jobTitle = interview.jobTitle || "Position not available";

  const round = interview.round || "Interview";

  const interviewType = interview.interviewType || "Online";

  const duration = Number(interview.durationMinutes || 0);

  const scheduledDate = formatInterviewDate(interview.scheduledAt);

  const meetingLink = interview.meetingLink?.trim() || "";

  const location = interview.location?.trim() || "";

  const status = interview.status || "Scheduled";

  function handleCardClick() {
    if (onView) {
      onView(interview);
    }
  }

  return (
    <article
      className="interview-card"
      onClick={handleCardClick}
      role={onView ? "button" : undefined}
      tabIndex={onView ? 0 : undefined}
      onKeyDown={(event) => {
        if (!onView) {
          return;
        }

        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          onView(interview);
        }
      }}
    >
      {/* ==========================================
          HEADER
      ========================================== */}

      <div className="interview-card-header">
        <div className="interview-card-header-main">
          <div className="interview-card-icon">
            <CalendarDays />
          </div>

          <div className="interview-card-title">
            <h3>{round} Interview</h3>

            <p>{jobTitle}</p>
          </div>
        </div>

        <InterviewStatusBadge status={status} />
      </div>

      {/* ==========================================
          CANDIDATE / COMPANY INFO
      ========================================== */}

      <div className="interview-card-person">
        <div className="interview-card-avatar">
          {candidateName.trim().charAt(0).toUpperCase() || "C"}
        </div>

        <div className="interview-card-person-info">
          <span>{isCompany ? "Candidate" : "Application"}</span>

          <strong>{isCompany ? candidateName : jobTitle}</strong>

          {isCompany && <small>{candidateEmail}</small>}
        </div>
      </div>

      {/* ==========================================
          DETAILS
      ========================================== */}

      <div className="interview-card-details">
        <div className="interview-card-detail">
          <CalendarDays />

          <div>
            <span>Date & Time</span>
            <strong>{scheduledDate}</strong>
          </div>
        </div>

        <div className="interview-card-detail">
          <Clock3 />

          <div>
            <span>Duration</span>

            <strong>{duration > 0 ? `${duration} minutes` : "-"}</strong>
          </div>
        </div>

        <div className="interview-card-detail">
          <Video />

          <div>
            <span>Interview Type</span>
            <strong>{interviewType}</strong>
          </div>
        </div>

        {interviewType.toLowerCase() === "online" && meetingLink && (
          <div className="interview-card-detail">
            <ExternalLink />

            <div>
              <span>Meeting</span>

              <a
                href={meetingLink}
                target="_blank"
                rel="noopener noreferrer"
                onClick={(event) => event.stopPropagation()}
              >
                Join Meeting
              </a>
            </div>
          </div>
        )}

        {interviewType.toLowerCase() !== "online" && location && (
          <div className="interview-card-detail">
            <MapPin />

            <div>
              <span>Location</span>
              <strong>{location}</strong>
            </div>
          </div>
        )}
      </div>

      {/* ==========================================
          INSTRUCTIONS
      ========================================== */}

      {interview.instructions && (
        <div className="interview-card-instructions">
          <span>Instructions</span>

          <p>{interview.instructions}</p>
        </div>
      )}

      {/* ==========================================
          ACTIONS
      ========================================== */}

      {(onEdit || onStatusChange || onDelete || onView) && (
        <div
          className="interview-card-actions"
          onClick={(event) => event.stopPropagation()}
        >
          {onView && (
            <button
              type="button"
              className="interview-card-action interview-card-view"
              onClick={() => onView(interview)}
            >
              View Details
            </button>
          )}

          {isCompany && onEdit && (
            <button
              type="button"
              className="interview-card-action"
              onClick={() => onEdit(interview)}
            >
              Edit
            </button>
          )}

          {isCompany && onStatusChange && (
            <select
              className="interview-card-status-select"
              value={status}
              onChange={(event) =>
                onStatusChange(interview, event.target.value)
              }
            >
              <option value="Scheduled">Scheduled</option>

              <option value="Completed">Completed</option>

              <option value="Cancelled">Cancelled</option>

              <option value="Rescheduled">Rescheduled</option>
            </select>
          )}

          {isCompany && onDelete && (
            <button
              type="button"
              className="interview-card-action interview-card-delete"
              onClick={() => onDelete(interview)}
            >
              Delete
            </button>
          )}
        </div>
      )}
    </article>
  );
}

// ==========================================
// DATE FORMAT
// ==========================================

function formatInterviewDate(value) {
  if (!value) {
    return "-";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "-";
  }

  return date.toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}
