import { useEffect, useState } from "react";
import {
  CalendarDays,
  Clock3,
  Link as LinkIcon,
  MapPin,
  Video,
  X,
  UserRound,
} from "lucide-react";

import "../../styles/InterviewCSS/ScheduleInterviewModal.css";

const DEFAULT_FORM = {
  round: "Technical",
  interviewType: "Online",
  scheduledAt: "",
  durationMinutes: 30,
  meetingLink: "",
  location: "",
  instructions: "",
};

export default function ScheduleInterviewModal({
  isOpen,
  onClose,

  // Existing selected application
  application = null,

  // NEW: all applications of the company
  applications = [],

  onSubmit,
  loading = false,
  initialData = null,
  mode = "create",
}) {
  const [form, setForm] = useState(DEFAULT_FORM);

  const [selectedApplicationId, setSelectedApplicationId] = useState(
    application?.id || "",
  );

  const [selectedApplication, setSelectedApplication] = useState(
    application || null,
  );

  const [error, setError] = useState("");

  const isEdit = mode === "edit";

  // ==========================================
  // INITIALIZE
  // ==========================================

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    setError("");

    if (initialData) {
      setForm({
        round: initialData.round || "Technical",

        interviewType: initialData.interviewType || "Online",

        scheduledAt: convertToDateTimeLocal(initialData.scheduledAt),

        durationMinutes: initialData.durationMinutes || 30,

        meetingLink: initialData.meetingLink || "",

        location: initialData.location || "",

        instructions: initialData.instructions || "",
      });

      // Edit mode already has the application
      setSelectedApplicationId(
        initialData.applicationId || application?.id || "",
      );

      setSelectedApplication(application || null);

      return;
    }

    setForm(DEFAULT_FORM);

    setSelectedApplicationId(application?.id || "");

    setSelectedApplication(application || null);
  }, [isOpen, initialData, application]);

  // ==========================================
  // FIND SELECTED APPLICATION
  // ==========================================

  useEffect(() => {
    if (!selectedApplicationId) {
      setSelectedApplication(null);
      return;
    }

    const found = applications.find(
      (item) => String(item.id) === String(selectedApplicationId),
    );

    if (found) {
      setSelectedApplication(found);
    } else if (
      application &&
      String(application.id) === String(selectedApplicationId)
    ) {
      setSelectedApplication(application);
    }
  }, [selectedApplicationId, applications, application]);

  if (!isOpen) {
    return null;
  }

  // ==========================================
  // CANDIDATE DETAILS
  // ==========================================

  const candidateName =
    selectedApplication?.candidateName ||
    selectedApplication?.name ||
    selectedApplication?.userName ||
    selectedApplication?.candidate?.name ||
    "Candidate";

  const candidateEmail =
    selectedApplication?.candidateEmail ||
    selectedApplication?.email ||
    selectedApplication?.candidate?.email ||
    "-";

  const jobTitle =
    selectedApplication?.jobTitle ||
    selectedApplication?.job?.title ||
    "Position not available";

  // ==========================================
  // UPDATE FORM
  // ==========================================

  function updateField(field, value) {
    setForm((previous) => ({
      ...previous,
      [field]: value,
    }));

    setError("");
  }

  // ==========================================
  // APPLICATION CHANGE
  // ==========================================

  function handleApplicationChange(event) {
    const applicationId = event.target.value;

    setSelectedApplicationId(applicationId);

    const found = applications.find(
      (item) => String(item.id) === String(applicationId),
    );

    setSelectedApplication(found || null);

    setError("");
  }

  // ==========================================
  // INTERVIEW TYPE
  // ==========================================

  function handleInterviewTypeChange(value) {
    setForm((previous) => ({
      ...previous,

      interviewType: value,

      meetingLink: value === "Online" ? previous.meetingLink : "",

      location: value === "Online" ? "" : previous.location,
    }));

    setError("");
  }

  // ==========================================
  // SUBMIT
  // ==========================================

  async function handleSubmit(event) {
    event.preventDefault();

    setError("");

    // Create mode requires candidate application
    if (!isEdit && !selectedApplicationId) {
      setError("Please select a candidate application.");
      return;
    }

    if (!form.round.trim()) {
      setError("Please select interview round.");
      return;
    }

    if (!form.interviewType.trim()) {
      setError("Please select interview type.");
      return;
    }

    if (!form.scheduledAt) {
      setError("Please select interview date and time.");
      return;
    }

    const selectedDate = new Date(form.scheduledAt);

    if (Number.isNaN(selectedDate.getTime())) {
      setError("Please select a valid date and time.");
      return;
    }

    if (selectedDate <= new Date()) {
      setError("Interview must be scheduled for a future date and time.");
      return;
    }

    const duration = Number(form.durationMinutes);

    if (!Number.isInteger(duration) || duration <= 0) {
      setError("Duration must be a valid positive number.");
      return;
    }

    if (form.interviewType === "Online" && !form.meetingLink.trim()) {
      setError("Meeting link is required for an online interview.");
      return;
    }

    if (form.interviewType !== "Online" && !form.location.trim()) {
      setError("Location is required for an in-person interview.");
      return;
    }

    // ==========================================
    // PAYLOAD
    // ==========================================

    const payload = {
      ...(isEdit
        ? {}
        : {
            applicationId: selectedApplicationId,
          }),

      round: form.round.trim(),

      interviewType: form.interviewType.trim(),

      scheduledAt: selectedDate.toISOString(),

      durationMinutes: duration,

      meetingLink: form.meetingLink.trim() || null,

      location: form.location.trim() || null,

      instructions: form.instructions.trim() || null,
    };

    try {
      await onSubmit(payload);
    } catch (err) {
      setError(err?.message || "Unable to save interview.");
    }
  }

  return (
    <div className="schedule-interview-overlay" onClick={onClose}>
      <div
        className="schedule-interview-modal"
        onClick={(event) => event.stopPropagation()}
      >
        {/* ======================================
            HEADER
        ====================================== */}

        <div className="schedule-interview-header">
          <div>
            <span>{isEdit ? "UPDATE INTERVIEW" : "SCHEDULE INTERVIEW"}</span>

            <h2>{isEdit ? "Update Interview" : "Schedule Interview"}</h2>

            <p>
              {isEdit
                ? "Update the interview details for this candidate."
                : "Select a candidate application and schedule an interview."}
            </p>
          </div>

          <button
            type="button"
            className="schedule-interview-close"
            onClick={onClose}
            disabled={loading}
            aria-label="Close"
          >
            <X />
          </button>
        </div>

        {/* ======================================
            SELECT CANDIDATE APPLICATION
        ====================================== */}

        {!isEdit && (
          <div className="schedule-interview-application-selector">
            <label htmlFor="candidate-application">
              Select Candidate Application
            </label>

            <div className="schedule-interview-select-wrapper">
              <UserRound />

              <select
                id="candidate-application"
                value={selectedApplicationId}
                onChange={handleApplicationChange}
                disabled={loading}
              >
                <option value="">-- Select a candidate application --</option>

                {applications.length > 0 ? (
                  applications.map((item) => {
                    const name =
                      item.candidateName ||
                      item.name ||
                      item.userName ||
                      item.candidate?.name ||
                      "Candidate";

                    const email =
                      item.candidateEmail ||
                      item.email ||
                      item.candidate?.email ||
                      "";

                    const job = item.jobTitle || item.job?.title || "Job";

                    return (
                      <option key={item.id} value={item.id}>
                        {name} {email ? `(${email})` : ""} — {job}
                      </option>
                    );
                  })
                ) : (
                  <option value="" disabled>
                    No applications found
                  </option>
                )}
              </select>
            </div>

            {applications.length === 0 && (
              <p className="schedule-interview-no-applications">
                No candidate applications are available for this company.
              </p>
            )}
          </div>
        )}

        {/* ======================================
            SELECTED CANDIDATE
        ====================================== */}

        {selectedApplication && (
          <div className="schedule-interview-candidate">
            <div className="schedule-interview-candidate-avatar">
              {candidateName.trim().charAt(0).toUpperCase() || "C"}
            </div>

            <div>
              <strong>{candidateName}</strong>

              <span>{candidateEmail}</span>

              <small>{jobTitle}</small>
            </div>
          </div>
        )}

        {/* ======================================
            FORM
        ====================================== */}

        <form className="schedule-interview-form" onSubmit={handleSubmit}>
          {error && <div className="schedule-interview-error">{error}</div>}

          {/* ROUND */}

          <div className="schedule-interview-field">
            <label htmlFor="interview-round">Interview Round</label>

            <select
              id="interview-round"
              value={form.round}
              onChange={(event) => updateField("round", event.target.value)}
              disabled={loading}
            >
              <option value="Screening">Screening</option>
              <option value="HR">HR</option>
              <option value="Technical">Technical</option>
              <option value="Managerial">Managerial</option>
              <option value="Final">Final</option>
            </select>
          </div>

          {/* TYPE */}

          <div className="schedule-interview-field">
            <label htmlFor="interview-type">Interview Type</label>

            <div className="schedule-interview-type-grid">
              <button
                type="button"
                className={form.interviewType === "Online" ? "active" : ""}
                onClick={() => handleInterviewTypeChange("Online")}
                disabled={loading}
              >
                <Video />
                Online
              </button>

              <button
                type="button"
                className={form.interviewType === "In-Person" ? "active" : ""}
                onClick={() => handleInterviewTypeChange("In-Person")}
                disabled={loading}
              >
                <MapPin />
                In-Person
              </button>
            </div>
          </div>

          {/* DATE + DURATION */}

          <div className="schedule-interview-form-grid">
            <div className="schedule-interview-field">
              <label htmlFor="scheduled-at">Date & Time</label>

              <div className="schedule-interview-input-icon">
                <CalendarDays />

                <input
                  id="scheduled-at"
                  type="datetime-local"
                  value={form.scheduledAt}
                  onChange={(event) =>
                    updateField("scheduledAt", event.target.value)
                  }
                  disabled={loading}
                />
              </div>
            </div>

            <div className="schedule-interview-field">
              <label htmlFor="duration">Duration</label>

              <div className="schedule-interview-input-icon">
                <Clock3 />

                <input
                  id="duration"
                  type="number"
                  min="1"
                  max="480"
                  value={form.durationMinutes}
                  onChange={(event) =>
                    updateField("durationMinutes", event.target.value)
                  }
                  disabled={loading}
                />

                <span>min</span>
              </div>
            </div>
          </div>

          {/* ONLINE */}

          {form.interviewType === "Online" && (
            <div className="schedule-interview-field">
              <label htmlFor="meeting-link">Meeting Link</label>

              <div className="schedule-interview-input-icon">
                <LinkIcon />

                <input
                  id="meeting-link"
                  type="url"
                  value={form.meetingLink}
                  onChange={(event) =>
                    updateField("meetingLink", event.target.value)
                  }
                  placeholder="https://meet.google.com/..."
                  disabled={loading}
                />
              </div>
            </div>
          )}

          {/* LOCATION */}

          {form.interviewType !== "Online" && (
            <div className="schedule-interview-field">
              <label htmlFor="location">Interview Location</label>

              <div className="schedule-interview-input-icon">
                <MapPin />

                <input
                  id="location"
                  type="text"
                  value={form.location}
                  onChange={(event) =>
                    updateField("location", event.target.value)
                  }
                  placeholder="Office / meeting room / address"
                  disabled={loading}
                />
              </div>
            </div>
          )}

          {/* INSTRUCTIONS */}

          <div className="schedule-interview-field">
            <label htmlFor="instructions">Instructions</label>

            <textarea
              id="instructions"
              rows="4"
              value={form.instructions}
              onChange={(event) =>
                updateField("instructions", event.target.value)
              }
              placeholder="Add instructions for the candidate..."
              disabled={loading}
            />
          </div>

          {/* ACTIONS */}

          <div className="schedule-interview-actions">
            <button
              type="button"
              className="schedule-interview-cancel"
              onClick={onClose}
              disabled={loading}
            >
              Cancel
            </button>

            <button
              type="submit"
              className="schedule-interview-submit"
              disabled={loading || (!isEdit && !selectedApplicationId)}
            >
              {loading
                ? isEdit
                  ? "Updating..."
                  : "Scheduling..."
                : isEdit
                  ? "Update Interview"
                  : "Schedule Interview"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ==========================================
// DATETIME LOCAL HELPER
// ==========================================

function convertToDateTimeLocal(value) {
  if (!value) {
    return "";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "";
  }

  const offset = date.getTimezoneOffset();

  const localDate = new Date(date.getTime() - offset * 60000);

  return localDate.toISOString().slice(0, 16);
}
