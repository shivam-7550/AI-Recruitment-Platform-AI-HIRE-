import { useEffect, useMemo, useState } from "react";
import {
  BriefcaseBusiness,
  CalendarDays,
  CheckCircle2,
  FileText,
  GraduationCap,
  Link as LinkIcon,
  Mail,
  MapPin,
  Pencil,
  Phone,
  Save,
  Upload,
  UserRound,
  X,
} from "lucide-react";

import CandidateSidebar from "../../components/Candidate/CandidateSidebar";
import CandidateHeader from "../../components/Candidate/CandidateHeader";

import "../../styles/CandidatesCSS/CandidateProfile.css";

const initialProfile = {
  firstName: "",
  lastName: "",
  email: "",
  phoneNumber: "",
  dateOfBirth: "",

  headline: "",
  currentJobTitle: "",
  currentCompany: "",
  totalExperience: "",

  preferredJobTitle: "",
  employmentType: "",
  preferredLocation: "",
  workMode: "",
  expectedSalary: "",

  highestDegree: "",
  fieldOfStudy: "",
  university: "",
  graduationYear: "",

  skills: [],
  professionalSummary: "",

  linkedinUrl: "",
  githubUrl: "",
  portfolioUrl: "",

  resumeFileName: "",
};

const skillSuggestions = [
  "C#",
  ".NET",
  "ASP.NET Core",
  "Web API",
  "React",
  "JavaScript",
  "TypeScript",
  "SQL Server",
  "MongoDB",
  "Azure",
  "AWS",
  "Docker",
  "Python",
  "Java",
];

export default function CandidateProfile() {
  const [profile, setProfile] = useState(initialProfile);
  const [newSkill, setNewSkill] = useState("");
  const [editing, setEditing] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    // TODO:
    // Replace this with your actual candidate profile API.
    //
    // Example:
    // const loadProfile = async () => {
    //   const response = await candidateProfileApi.getProfile();
    //   setProfile(response.data);
    // };
    //
    // loadProfile();
  }, []);

  const profileCompletion = useMemo(() => {
    const requiredFields = [
      profile.firstName,
      profile.lastName,
      profile.email,
      profile.phoneNumber,
      profile.headline,
      profile.currentJobTitle,
      profile.totalExperience,
      profile.preferredJobTitle,
      profile.employmentType,
      profile.preferredLocation,
      profile.workMode,
      profile.highestDegree,
      profile.fieldOfStudy,
      profile.university,
      profile.graduationYear,
      profile.professionalSummary,
      profile.skills.length > 0,
      profile.resumeFileName,
    ];

    const completed = requiredFields.filter(Boolean).length;

    return Math.round((completed / requiredFields.length) * 100);
  }, [profile]);

  const handleChange = (event) => {
    const { name, value } = event.target;

    setProfile((previous) => ({
      ...previous,
      [name]: value,
    }));
  };

  const addSkill = (skill) => {
    const normalizedSkill = skill.trim();

    if (!normalizedSkill) {
      return;
    }

    const exists = profile.skills.some(
      (item) => item.toLowerCase() === normalizedSkill.toLowerCase(),
    );

    if (exists) {
      setNewSkill("");
      return;
    }

    setProfile((previous) => ({
      ...previous,
      skills: [...previous.skills, normalizedSkill],
    }));

    setNewSkill("");
  };

  const removeSkill = (skillToRemove) => {
    setProfile((previous) => ({
      ...previous,
      skills: previous.skills.filter((skill) => skill !== skillToRemove),
    }));
  };

  const handleSkillKeyDown = (event) => {
    if (event.key === "Enter") {
      event.preventDefault();
      addSkill(newSkill);
    }
  };

  const handleResumeChange = (event) => {
    const file = event.target.files?.[0];

    if (!file) {
      return;
    }

    const allowedTypes = [
      "application/pdf",
      "application/msword",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    ];

    if (!allowedTypes.includes(file.type)) {
      setMessage("Please upload a PDF or Word document.");
      return;
    }

    const maxSize = 5 * 1024 * 1024;

    if (file.size > maxSize) {
      setMessage("Resume size must be less than 5 MB.");
      return;
    }

    setProfile((previous) => ({
      ...previous,
      resumeFileName: file.name,
    }));

    setMessage("");
  };

  const handleSave = async (event) => {
    event.preventDefault();

    try {
      setSaving(true);
      setMessage("");

      /*
       * TODO:
       * Connect this to your backend.
       *
       * Example:
       *
       * await candidateProfileApi.updateProfile(profile);
       */

      await new Promise((resolve) => setTimeout(resolve, 700));

      setEditing(false);
      setMessage("Profile updated successfully.");
    } catch (error) {
      console.error("Profile update failed:", error);
      setMessage("Unable to update profile.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="candidate-profile-layout">
      <CandidateSidebar />

      <main className="candidate-profile-main">
        <CandidateHeader
          title="Profile"
          subtitle="Manage your personal and professional information."
        />

        <form className="candidate-profile-content" onSubmit={handleSave}>
          {/* =====================================================
              PROFILE HEADER
          ====================================================== */}

          <section className="candidate-profile-overview">
            <div className="candidate-profile-avatar">
              {profile.firstName?.charAt(0)?.toUpperCase() || (
                <UserRound size={32} />
              )}
            </div>

            <div className="candidate-profile-overview-info">
              <span>Candidate Profile</span>

              <h1>
                {profile.firstName || profile.lastName
                  ? `${profile.firstName} ${profile.lastName}`.trim()
                  : "Complete your profile"}
              </h1>

              <p>
                {profile.headline ||
                  "Add your professional headline to attract recruiters."}
              </p>
            </div>

            <div className="candidate-profile-overview-actions">
              {!editing && (
                <button
                  type="button"
                  className="candidate-profile-secondary-button"
                  onClick={() => setEditing(true)}
                >
                  <Pencil size={16} />
                  Edit Profile
                </button>
              )}

              {editing && (
                <button
                  type="submit"
                  className="candidate-profile-primary-button"
                  disabled={saving}
                >
                  <Save size={16} />

                  {saving ? "Saving..." : "Save Profile"}
                </button>
              )}
            </div>
          </section>

          {/* =====================================================
              MESSAGE
          ====================================================== */}

          {message && (
            <div className="candidate-profile-message">
              <CheckCircle2 size={17} />
              <span>{message}</span>
            </div>
          )}

          {/* =====================================================
              PROFILE COMPLETION
          ====================================================== */}

          <section className="candidate-profile-completion">
            <div>
              <div className="candidate-profile-completion-title">
                <strong>Profile Completion</strong>
                <span>{profileCompletion}%</span>
              </div>

              <div className="candidate-profile-progress">
                <div
                  style={{
                    width: `${profileCompletion}%`,
                  }}
                />
              </div>

              <p>
                Complete your profile to improve your visibility to recruiters.
              </p>
            </div>
          </section>

          {/* =====================================================
              BASIC INFORMATION
          ====================================================== */}

          <section className="candidate-profile-section">
            <div className="candidate-profile-section-heading">
              <div>
                <span>01</span>
                <h2>Basic Information</h2>
                <p>Your personal information.</p>
              </div>
            </div>

            <div className="candidate-profile-form-grid">
              <FormField
                label="First Name"
                name="firstName"
                value={profile.firstName}
                onChange={handleChange}
                disabled={!editing}
                required
              />

              <FormField
                label="Last Name"
                name="lastName"
                value={profile.lastName}
                onChange={handleChange}
                disabled={!editing}
                required
              />

              <FormField
                label="Email Address"
                name="email"
                type="email"
                value={profile.email}
                onChange={handleChange}
                disabled={!editing}
                icon={<Mail size={16} />}
                required
              />

              <FormField
                label="Phone Number"
                name="phoneNumber"
                value={profile.phoneNumber}
                onChange={handleChange}
                disabled={!editing}
                icon={<Phone size={16} />}
                required
              />

              <FormField
                label="Date of Birth"
                name="dateOfBirth"
                type="date"
                value={profile.dateOfBirth}
                onChange={handleChange}
                disabled={!editing}
                icon={<CalendarDays size={16} />}
              />
            </div>
          </section>

          {/* =====================================================
              PROFESSIONAL INFORMATION
          ====================================================== */}

          <section className="candidate-profile-section">
            <div className="candidate-profile-section-heading">
              <div>
                <span>02</span>
                <h2>Professional Information</h2>
                <p>Tell recruiters about your current professional position.</p>
              </div>
            </div>

            <div className="candidate-profile-form-grid">
              <FormField
                label="Professional Headline"
                name="headline"
                value={profile.headline}
                onChange={handleChange}
                disabled={!editing}
                placeholder="e.g. Full Stack .NET Developer"
                required
              />

              <FormField
                label="Current Job Title"
                name="currentJobTitle"
                value={profile.currentJobTitle}
                onChange={handleChange}
                disabled={!editing}
                placeholder="e.g. Software Developer"
                required
              />

              <FormField
                label="Current Company"
                name="currentCompany"
                value={profile.currentCompany}
                onChange={handleChange}
                disabled={!editing}
                placeholder="e.g. ABC Technologies"
              />

              <FormField
                label="Total Experience"
                name="totalExperience"
                value={profile.totalExperience}
                onChange={handleChange}
                disabled={!editing}
                placeholder="e.g. 2 years"
                icon={<BriefcaseBusiness size={16} />}
                required
              />
            </div>
          </section>

          {/* =====================================================
              CAREER PREFERENCES
          ====================================================== */}

          <section className="candidate-profile-section">
            <div className="candidate-profile-section-heading">
              <div>
                <span>03</span>
                <h2>Career Preferences</h2>
                <p>Help recruiters understand what opportunities you want.</p>
              </div>
            </div>

            <div className="candidate-profile-form-grid">
              <FormField
                label="Preferred Job Title"
                name="preferredJobTitle"
                value={profile.preferredJobTitle}
                onChange={handleChange}
                disabled={!editing}
                placeholder="e.g. Backend Developer"
                required
              />

              <SelectField
                label="Employment Type"
                name="employmentType"
                value={profile.employmentType}
                onChange={handleChange}
                disabled={!editing}
                required
                options={[
                  ["Full Time", "Full Time"],
                  ["Part Time", "Part Time"],
                  ["Contract", "Contract"],
                  ["Internship", "Internship"],
                  ["Freelance", "Freelance"],
                ]}
              />

              <FormField
                label="Preferred Location"
                name="preferredLocation"
                value={profile.preferredLocation}
                onChange={handleChange}
                disabled={!editing}
                placeholder="e.g. Noida, Delhi NCR"
                icon={<MapPin size={16} />}
                required
              />

              <SelectField
                label="Work Mode"
                name="workMode"
                value={profile.workMode}
                onChange={handleChange}
                disabled={!editing}
                required
                options={[
                  ["On-site", "On-site"],
                  ["Hybrid", "Hybrid"],
                  ["Remote", "Remote"],
                ]}
              />

              <FormField
                label="Expected Salary"
                name="expectedSalary"
                value={profile.expectedSalary}
                onChange={handleChange}
                disabled={!editing}
                placeholder="e.g. ₹6 LPA"
              />
            </div>
          </section>

          {/* =====================================================
              EDUCATION
          ====================================================== */}

          <section className="candidate-profile-section">
            <div className="candidate-profile-section-heading">
              <div>
                <span>04</span>
                <h2>Education</h2>
                <p>Your highest or most relevant educational qualification.</p>
              </div>
            </div>

            <div className="candidate-profile-form-grid">
              <SelectField
                label="Highest Degree"
                name="highestDegree"
                value={profile.highestDegree}
                onChange={handleChange}
                disabled={!editing}
                required
                options={[
                  ["High School", "High School"],
                  ["Diploma", "Diploma"],
                  ["Bachelor's Degree", "Bachelor's Degree"],
                  ["Master's Degree", "Master's Degree"],
                  ["MBA", "MBA"],
                  ["MCA", "MCA"],
                  ["PhD", "PhD"],
                ]}
              />

              <FormField
                label="Field of Study"
                name="fieldOfStudy"
                value={profile.fieldOfStudy}
                onChange={handleChange}
                disabled={!editing}
                placeholder="e.g. Computer Science"
                required
              />

              <FormField
                label="University / Institution"
                name="university"
                value={profile.university}
                onChange={handleChange}
                disabled={!editing}
                icon={<GraduationCap size={16} />}
                required
              />

              <FormField
                label="Graduation Year"
                name="graduationYear"
                type="number"
                value={profile.graduationYear}
                onChange={handleChange}
                disabled={!editing}
                placeholder="e.g. 2025"
                required
              />
            </div>
          </section>

          {/* =====================================================
              SKILLS
          ====================================================== */}

          <section className="candidate-profile-section">
            <div className="candidate-profile-section-heading">
              <div>
                <span>05</span>
                <h2>Skills</h2>
                <p>
                  Add the skills that recruiters should find in your profile.
                </p>
              </div>
            </div>

            <div className="candidate-profile-skills-container">
              <div className="candidate-profile-skill-input">
                <input
                  type="text"
                  value={newSkill}
                  disabled={!editing}
                  onChange={(event) => setNewSkill(event.target.value)}
                  onKeyDown={handleSkillKeyDown}
                  placeholder="Type a skill and press Enter"
                />

                <button
                  type="button"
                  disabled={!editing}
                  onClick={() => addSkill(newSkill)}
                >
                  Add
                </button>
              </div>

              <div className="candidate-profile-skills">
                {profile.skills.map((skill) => (
                  <span key={skill}>
                    {skill}

                    {editing && (
                      <button
                        type="button"
                        onClick={() => removeSkill(skill)}
                        aria-label={`Remove ${skill}`}
                      >
                        <X size={13} />
                      </button>
                    )}
                  </span>
                ))}
              </div>

              {editing && (
                <div className="candidate-profile-suggestions">
                  <small>Suggested skills</small>

                  <div>
                    {skillSuggestions.map((skill) => (
                      <button
                        type="button"
                        key={skill}
                        onClick={() => addSkill(skill)}
                      >
                        + {skill}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </section>

          {/* =====================================================
              PROFESSIONAL SUMMARY
          ====================================================== */}

          <section className="candidate-profile-section">
            <div className="candidate-profile-section-heading">
              <div>
                <span>06</span>
                <h2>Professional Summary</h2>
                <p>Give recruiters a short overview of your profile.</p>
              </div>
            </div>

            <textarea
              className="candidate-profile-textarea"
              name="professionalSummary"
              value={profile.professionalSummary}
              onChange={handleChange}
              disabled={!editing}
              placeholder="Write a professional summary describing your experience, skills, achievements and career goals..."
              rows={7}
              required
            />
          </section>

          {/* =====================================================
              SOCIAL LINKS
          ====================================================== */}

          <section className="candidate-profile-section">
            <div className="candidate-profile-section-heading">
              <div>
                <span>07</span>
                <h2>Professional Links</h2>
                <p>Connect your professional profiles and portfolio.</p>
              </div>
            </div>

            <div className="candidate-profile-form-grid">
              <FormField
                label="Portfolio Website"
                name="portfolioUrl"
                value={profile.portfolioUrl}
                onChange={handleChange}
                disabled={!editing}
                placeholder="https://yourportfolio.com"
                icon={<LinkIcon size={16} />}
              />
            </div>
          </section>

          {/* =====================================================
              RESUME
          ====================================================== */}

          <section className="candidate-profile-section">
            <div className="candidate-profile-section-heading">
              <div>
                <span>08</span>
                <h2>Resume</h2>
                <p>
                  Upload your latest resume so recruiters can review your
                  profile.
                </p>
              </div>
            </div>

            <div className="candidate-profile-resume">
              <div className="candidate-profile-resume-icon">
                <FileText size={25} />
              </div>

              <div className="candidate-profile-resume-info">
                <strong>
                  {profile.resumeFileName || "No resume uploaded"}
                </strong>

                <small>PDF, DOC or DOCX • Maximum file size 5 MB</small>
              </div>

              {editing && (
                <label className="candidate-profile-upload-button">
                  <Upload size={16} />
                  Upload Resume
                  <input
                    type="file"
                    accept=".pdf,.doc,.docx"
                    onChange={handleResumeChange}
                  />
                </label>
              )}
            </div>
          </section>

          {/* =====================================================
              BOTTOM SAVE
          ====================================================== */}

          {editing && (
            <div className="candidate-profile-save-bar">
              <div>
                <strong>Ready to update your profile?</strong>
                <span>
                  Make sure your information is accurate before saving.
                </span>
              </div>

              <button
                type="submit"
                className="candidate-profile-primary-button"
                disabled={saving}
              >
                <Save size={16} />
                {saving ? "Saving..." : "Save Profile"}
              </button>
            </div>
          )}
        </form>
      </main>
    </div>
  );
}

/* =========================================================
   FORM FIELD
========================================================= */

function FormField({
  label,
  name,
  type = "text",
  value,
  onChange,
  disabled,
  placeholder,
  icon,
  required = false,
}) {
  return (
    <label className="candidate-profile-field">
      <span>
        {label}

        {required && <b>*</b>}
      </span>

      <div className="candidate-profile-input-wrapper">
        {icon}

        <input
          type={type}
          name={name}
          value={value}
          onChange={onChange}
          disabled={disabled}
          placeholder={placeholder}
          required={required}
        />
      </div>
    </label>
  );
}

/* =========================================================
   SELECT FIELD
========================================================= */

function SelectField({
  label,
  name,
  value,
  onChange,
  disabled,
  options,
  required = false,
}) {
  return (
    <label className="candidate-profile-field">
      <span>
        {label}

        {required && <b>*</b>}
      </span>

      <select
        name={name}
        value={value}
        onChange={onChange}
        disabled={disabled}
        required={required}
      >
        <option value="">Select {label}</option>

        {options.map(([value, label]) => (
          <option value={value} key={value}>
            {label}
          </option>
        ))}
      </select>
    </label>
  );
}
