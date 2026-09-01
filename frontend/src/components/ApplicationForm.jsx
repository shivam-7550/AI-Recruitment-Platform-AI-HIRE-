import { useEffect, useState } from "react";
import { FileText, Send, Upload, X } from "lucide-react";

import "../styles/ApplicationForm.css";
import { candidateApi } from "../services/api";

// ============================================================
// Initial Form
// ============================================================

const INITIAL_FORM = {
  name: "",
  email: "",
  contact: "",
  qualification: "",
  course: "",
  collegeName: "",
  skills: "",
  experience: "",
};

// ============================================================
// Parse Skills
// ============================================================

function parseSkills(value) {
  if (Array.isArray(value)) {
    return value
      .map((skill) => String(skill).trim())
      .filter(Boolean)
      .join(", ");
  }

  if (!value) {
    return "";
  }

  return String(value)
    .split(",")
    .map((skill) => skill.trim())
    .filter(Boolean)
    .join(", ");
}

// ============================================================
// Application Form
// ============================================================

export default function ApplicationForm({
  job,
  profile,
  resume: existingResume = null,
  onClose,
  onSubmit,
  submitting = false,
}) {
  const [form, setForm] = useState(INITIAL_FORM);

  const [resume, setResume] = useState(existingResume);
  const [resumeUploading, setResumeUploading] = useState(false);

  const [errors, setErrors] = useState({});
  const [resumeError, setResumeError] = useState("");
  const [submissionError, setSubmissionError] = useState("");

  // ==========================================================
  // Load Candidate Profile
  // ==========================================================

  useEffect(() => {
    setForm({
      name: profile?.name || "",
      email: profile?.email || "",
      contact: profile?.phone || profile?.contact || "",
      qualification: profile?.degree || profile?.qualification || "",
      course: profile?.fieldOfStudy || profile?.course || "",
      collegeName: profile?.institution || profile?.collegeName || "",

      skills: parseSkills(profile?.skills),

      experience:
        profile?.experienceYears !== null &&
        profile?.experienceYears !== undefined
          ? String(profile.experienceYears)
          : "",
    });
  }, [profile]);

  // ==========================================================
  // Sync Resume
  // ==========================================================

  useEffect(() => {
    setResume(existingResume || null);
  }, [existingResume]);

  // ==========================================================
  // Input Change
  // ==========================================================

  function handleChange(event) {
    const { name, value } = event.target;

    setForm((current) => ({
      ...current,
      [name]: value,
    }));

    setErrors((current) => ({
      ...current,
      [name]: "",
    }));
  }

  // ==========================================================
  // Resume Upload
  // ==========================================================

  async function handleResumeUpload(event) {
    const file = event.target.files?.[0];

    // Allow selecting the same file again
    event.target.value = "";

    if (!file) {
      return;
    }

    setResumeError("");
    setSubmissionError("");

    // ========================================================
    // FILE TYPE VALIDATION
    // ========================================================

    const allowedExtensions = [".pdf", ".doc", ".docx", ".word"];

    const fileName = file.name || "";

    const extension = fileName.includes(".")
      ? "." + fileName.split(".").pop().toLowerCase()
      : "";

    if (!allowedExtensions.includes(extension)) {
      setResumeError("Only PDF, DOC, DOCX, and WORD files are allowed.");

      return;
    }

    // ========================================================
    // FILE SIZE VALIDATION
    // ========================================================

    const maxSize = 5 * 1024 * 1024;

    if (file.size > maxSize) {
      setResumeError("Resume size must be 5 MB or smaller.");

      return;
    }

    // ========================================================
    // UPLOAD
    // ========================================================

    try {
      setResumeUploading(true);

      const uploadedResume = await candidateApi.uploadResume(file);

      if (!uploadedResume?.id) {
        throw new Error(
          "Resume upload completed but no resume ID was returned.",
        );
      }

      setResume(uploadedResume);

      setResumeError("");
    } catch (error) {
      console.error("Resume upload failed:", error);

      setResume(null);

      setResumeError(error?.message || "Unable to upload resume.");
    } finally {
      setResumeUploading(false);
    }
  }

  // ==========================================================
  // Validation
  // ==========================================================

  function validateForm() {
    const newErrors = {};

    if (!form.name.trim()) {
      newErrors.name = "Name is required.";
    }

    if (!form.email.trim()) {
      newErrors.email = "Email is required.";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) {
      newErrors.email = "Please enter a valid email address.";
    }

    if (!form.contact.trim()) {
      newErrors.contact = "Contact number is required.";
    }

    if (!form.qualification.trim()) {
      newErrors.qualification = "Qualification is required.";
    }

    if (!form.course.trim()) {
      newErrors.course = "Course is required.";
    }

    if (!form.collegeName.trim()) {
      newErrors.collegeName = "College name is required.";
    }

    if (!form.skills.trim()) {
      newErrors.skills = "Please enter at least one skill.";
    }

    if (!form.experience.trim()) {
      newErrors.experience = "Experience is required.";
    } else {
      const experienceValue = Number(form.experience);

      if (
        Number.isNaN(experienceValue) ||
        !Number.isInteger(experienceValue) ||
        experienceValue < 0 ||
        experienceValue > 50
      ) {
        newErrors.experience =
          "Experience must be a whole number from 0 to 50.";
      }
    }

    // ------------------------------------------
    // Resume is mandatory
    // ------------------------------------------

    if (!resume) {
      setResumeError(
        "Please upload your resume before submitting the application.",
      );
    }

    setErrors(newErrors);

    return Object.keys(newErrors).length === 0 && !!resume;
  }

  // ==========================================================
  // Submit
  // ==========================================================

  async function handleSubmit(event) {
    event.preventDefault();

    if (submitting || resumeUploading) {
      return;
    }

    const isValid = validateForm();

    if (!isValid) {
      return;
    }

    try {
      setSubmissionError("");

      const skills = form.skills
        .split(",")
        .map((skill) => skill.trim())
        .filter(Boolean);

      await onSubmit({
        jobId: job?.id,

        name: form.name.trim(),

        email: form.email.trim(),

        contact: form.contact.trim(),

        qualification: form.qualification.trim(),

        course: form.course.trim(),

        collegeName: form.collegeName.trim(),

        skills,

        experience: form.experience.trim(),

        // Resume information is already
        // stored through /api/Resume/upload.
        resumeId: resume?.id || resume?.resumeId || null,
      });
    } catch (error) {
      console.error("Application submission failed:", error);

      setSubmissionError(
        error?.message || "Unable to submit application. Please try again.",
      );
    }
  }

  // ==========================================================
  // Render
  // ==========================================================

  return (
    <div
      className="candidate-application-overlay"
      role="dialog"
      aria-modal="true"
      aria-labelledby="candidate-application-title"
    >
      <div className="candidate-application-modal">
        {/* ====================================================
            Header
        ==================================================== */}

        <header className="candidate-application-header">
          <div className="candidate-application-header-content">
            <h2 id="candidate-application-title">Apply for this Job</h2>

            <p>{job?.title || "Job Application"}</p>

            {job?.companyName && <small>{job.companyName}</small>}
          </div>

          <button
            type="button"
            className="candidate-application-close"
            onClick={onClose}
            disabled={submitting || resumeUploading}
            aria-label="Close application form"
          >
            <X />
          </button>
        </header>

        {/* ====================================================
            Form
        ==================================================== */}

        <form
          className="candidate-application-form"
          onSubmit={handleSubmit}
          noValidate
        >
          <div className="candidate-application-body">
            {/* ==================================================
                Personal Information
            ================================================== */}

            <section className="candidate-application-section">
              <h3 className="candidate-application-section-title">
                Personal Information
              </h3>

              <div className="candidate-application-grid">
                {/* Name */}

                <div
                  className={`candidate-application-field ${
                    errors.name ? "candidate-application-field-error" : ""
                  }`}
                >
                  <label htmlFor="candidate-application-name">
                    Full Name
                    <span>*</span>
                  </label>

                  <input
                    id="candidate-application-name"
                    type="text"
                    name="name"
                    value={form.name}
                    onChange={handleChange}
                    placeholder="Enter your full name"
                    disabled={submitting || resumeUploading}
                  />

                  {errors.name && (
                    <small className="candidate-application-error">
                      {errors.name}
                    </small>
                  )}
                </div>

                {/* Email */}

                <div
                  className={`candidate-application-field ${
                    errors.email ? "candidate-application-field-error" : ""
                  }`}
                >
                  <label htmlFor="candidate-application-email">
                    Email
                    <span>*</span>
                  </label>

                  <input
                    id="candidate-application-email"
                    type="email"
                    name="email"
                    value={form.email}
                    onChange={handleChange}
                    placeholder="Enter your email"
                    disabled={submitting || resumeUploading}
                  />

                  {errors.email && (
                    <small className="candidate-application-error">
                      {errors.email}
                    </small>
                  )}
                </div>

                {/* Contact */}

                <div
                  className={`candidate-application-field ${
                    errors.contact ? "candidate-application-field-error" : ""
                  }`}
                >
                  <label htmlFor="candidate-application-contact">
                    Contact
                    <span>*</span>
                  </label>

                  <input
                    id="candidate-application-contact"
                    type="tel"
                    name="contact"
                    value={form.contact}
                    onChange={handleChange}
                    placeholder="Enter contact number"
                    disabled={submitting || resumeUploading}
                  />

                  {errors.contact && (
                    <small className="candidate-application-error">
                      {errors.contact}
                    </small>
                  )}
                </div>
              </div>
            </section>

            {/* ==================================================
                Education
            ================================================== */}

            <section className="candidate-application-section">
              <h3 className="candidate-application-section-title">Education</h3>

              <div className="candidate-application-grid">
                {/* Qualification */}

                <div
                  className={`candidate-application-field ${
                    errors.qualification
                      ? "candidate-application-field-error"
                      : ""
                  }`}
                >
                  <label htmlFor="candidate-application-qualification">
                    Qualification
                    <span>*</span>
                  </label>

                  <input
                    id="candidate-application-qualification"
                    type="text"
                    name="qualification"
                    value={form.qualification}
                    onChange={handleChange}
                    placeholder="e.g. Bachelor's, Master's"
                    disabled={submitting || resumeUploading}
                  />

                  {errors.qualification && (
                    <small className="candidate-application-error">
                      {errors.qualification}
                    </small>
                  )}
                </div>

                {/* Course */}

                <div
                  className={`candidate-application-field ${
                    errors.course ? "candidate-application-field-error" : ""
                  }`}
                >
                  <label htmlFor="candidate-application-course">
                    Course
                    <span>*</span>
                  </label>

                  <input
                    id="candidate-application-course"
                    type="text"
                    name="course"
                    value={form.course}
                    onChange={handleChange}
                    placeholder="e.g. Computer Science"
                    disabled={submitting || resumeUploading}
                  />

                  {errors.course && (
                    <small className="candidate-application-error">
                      {errors.course}
                    </small>
                  )}
                </div>

                {/* College */}

                <div
                  className={`candidate-application-field candidate-application-full-width ${
                    errors.collegeName
                      ? "candidate-application-field-error"
                      : ""
                  }`}
                >
                  <label htmlFor="candidate-application-college">
                    College / University Name
                    <span>*</span>
                  </label>

                  <input
                    id="candidate-application-college"
                    type="text"
                    name="collegeName"
                    value={form.collegeName}
                    onChange={handleChange}
                    placeholder="Enter your college or university"
                    disabled={submitting || resumeUploading}
                  />

                  {errors.collegeName && (
                    <small className="candidate-application-error">
                      {errors.collegeName}
                    </small>
                  )}
                </div>
              </div>
            </section>

            {/* ==================================================
                Skills
            ================================================== */}

            <section className="candidate-application-section">
              <h3 className="candidate-application-section-title">
                Skills
                <span>*</span>
              </h3>

              <div
                className={`candidate-application-field ${
                  errors.skills ? "candidate-application-field-error" : ""
                }`}
              >
                <label htmlFor="candidate-application-skills">
                  Your Skills
                  <span>*</span>
                </label>

                <input
                  id="candidate-application-skills"
                  type="text"
                  name="skills"
                  value={form.skills}
                  onChange={handleChange}
                  placeholder="e.g. JavaScript, React, Node.js"
                  disabled={submitting || resumeUploading}
                />

                <small className="candidate-application-field-hint">
                  Enter multiple skills separated by commas.
                </small>

                {errors.skills && (
                  <small className="candidate-application-error">
                    {errors.skills}
                  </small>
                )}
              </div>
            </section>

            {/* ==================================================
                Experience
            ================================================== */}

            <section className="candidate-application-section">
              <h3 className="candidate-application-section-title">
                Experience
              </h3>

              <div
                className={`candidate-application-field ${
                  errors.experience ? "candidate-application-field-error" : ""
                }`}
              >
                <label htmlFor="candidate-application-experience">
                  Years of Experience
                  <span>*</span>
                </label>

                <div className="candidate-application-experience">
                  <input
                    id="candidate-application-experience"
                    type="number"
                    name="experience"
                    value={form.experience}
                    onChange={handleChange}
                    placeholder="e.g. 2"
                    min="0"
                    step="1"
                    disabled={submitting || resumeUploading}
                  />

                  <span>Years</span>
                </div>

                {errors.experience && (
                  <small className="candidate-application-error">
                    {errors.experience}
                  </small>
                )}
              </div>
            </section>

            {/* ==================================================
                  Resume Upload
            ================================================== */}

            <section className="candidate-application-section">
              <h3 className="candidate-application-section-title">
                Resume
                <span>*</span>
              </h3>

              <div className="candidate-application-field">
                <label htmlFor="candidate-application-resume">
                  Upload Resume
                  <span>*</span>
                </label>

                <label
                  htmlFor="candidate-application-resume"
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "10px",
                    padding: "14px 16px",
                    border: "1px dashed #cbd5e1",
                    borderRadius: "10px",
                    cursor:
                      submitting || resumeUploading ? "not-allowed" : "pointer",
                    background: "#f8fafc",
                  }}
                >
                  <Upload size={18} />

                  <span>
                    {resumeUploading
                      ? "Uploading resume..."
                      : resume
                        ? "Change Resume"
                        : "Choose Resume"}
                  </span>

                  <input
                    id="candidate-application-resume"
                    type="file"
                    accept=".pdf,.doc,.docx,.word"
                    hidden
                    onChange={handleResumeUpload}
                    disabled={submitting || resumeUploading}
                  />
                </label>

                {resume && (
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "8px",
                      marginTop: "10px",
                      fontSize: "13px",
                    }}
                  >
                    <FileText size={17} />

                    <span>
                      {resume.fileName || resume.name || "Resume uploaded"}
                    </span>
                  </div>
                )}

                {resumeError && (
                  <small className="candidate-application-error">
                    {resumeError}
                  </small>
                )}

                <small className="candidate-application-field-hint">
                  Accepted formats: PDF, DOC, DOCX, WORD. Maximum size: 5 MB.
                </small>
              </div>
            </section>

            {/* ==================================================
                Resume Notice
            ================================================== */}

            <div className="candidate-application-resume-notice">
              <div>
                Your resume will be used for ATS matching and will be available
                to the company reviewing your application.
              </div>
            </div>
          </div>

          {/* ====================================================
              Footer
          ==================================================== */}

          <footer className="candidate-application-footer">
            {submissionError && (
              <small className="candidate-application-error">
                {submissionError}
              </small>
            )}

            <button
              type="button"
              className="candidate-application-cancel"
              onClick={onClose}
              disabled={submitting || resumeUploading}
            >
              Cancel
            </button>

            <button
              type="submit"
              className="candidate-application-submit"
              disabled={submitting || resumeUploading}
            >
              {submitting || resumeUploading ? (
                <>
                  <span className="candidate-application-spinner" />

                  {resumeUploading ? "Uploading Resume" : "Submitting"}
                </>
              ) : (
                <>
                  <Send />
                  Submit Application
                </>
              )}
            </button>
          </footer>
        </form>
      </div>
    </div>
  );
}
