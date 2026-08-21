import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Bell,
  BriefcaseBusiness,
  CheckCircle2,
  Eye,
  EyeOff,
  LockKeyhole,
  LogOut,
  Mail,
  Save,
  ShieldCheck,
  Trash2,
  UserRound,
} from "lucide-react";

import CandidateSidebar from "../../components/CandidateSidebar";
import CandidateHeader from "../../components/CandidateHeader";

import "../../styles/CandidatesCSS/CandidateSettings.css";

const initialSettings = {
  emailNotifications: true,
  jobAlerts: true,
  applicationUpdates: true,
  recruiterMessages: true,
  marketingEmails: false,

  profileVisibility: true,
  resumeVisibility: true,
  recruiterSearchable: true,

  preferredJobAlerts: true,
  weeklyJobDigest: false,
};

export default function CandidateSettings() {
  const navigate = useNavigate();

  const [settings, setSettings] = useState(() => {
    try {
      return {
        ...initialSettings,
        ...JSON.parse(localStorage.getItem("candidateSettings") || "{}"),
      };
    } catch {
      return initialSettings;
    }
  });

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [saving, setSaving] = useState(false);
  const [changingPassword, setChangingPassword] = useState(false);
  const [message, setMessage] = useState("");

  const handleSettingChange = (name) => {
    setSettings((previous) => ({
      ...previous,
      [name]: !previous[name],
    }));
  };

  const handleSaveSettings = async (event) => {
    event.preventDefault();

    try {
      setSaving(true);
      setMessage("");

      localStorage.setItem("candidateSettings", JSON.stringify(settings));

      setMessage("Settings updated successfully.");
    } catch (error) {
      console.error("Settings update failed:", error);
      setMessage("Unable to update settings.");
    } finally {
      setSaving(false);
    }
  };

  const handleChangePassword = async (event) => {
    event.preventDefault();

    if (!currentPassword || !newPassword || !confirmPassword) {
      setMessage("Please fill all password fields.");
      return;
    }

    if (newPassword.length < 8) {
      setMessage("New password must contain at least 8 characters.");
      return;
    }

    if (newPassword !== confirmPassword) {
      setMessage("New password and confirm password do not match.");
      return;
    }

    try {
      setChangingPassword(true);
      setMessage("");

      /*
       * TODO:
       * Connect with ChangePassword API.
       *
       * Example:
       *
       * await userSettingsApi.changePassword({
       *   currentPassword,
       *   newPassword,
       * });
       */

      await new Promise((resolve) => setTimeout(resolve, 700));

      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");

      setMessage("Password changed successfully.");
    } catch (error) {
      console.error("Password change failed:", error);
      setMessage("Unable to change password.");
    } finally {
      setChangingPassword(false);
    }
  };

  const handleLogout = () => {
    sessionStorage.removeItem("user");
    sessionStorage.removeItem("accessToken");
    sessionStorage.removeItem("refreshToken");
    navigate("/login", { replace: true });
  };

  const handleDeleteAccount = () => {
    const confirmed = window.confirm(
      "Are you sure you want to delete your account? This action cannot be undone.",
    );

    if (!confirmed) {
      return;
    }

    /*
     * TODO:
     * Connect with Delete Account API.
     */

    console.log("Delete account requested");
  };

  return (
    <div className="candidate-settings-layout">
      <CandidateSidebar />

      <main className="candidate-settings-main">
        <CandidateHeader
          title="Settings"
          subtitle="Manage your account, notifications, privacy and security."
        />

        <form
          className="candidate-settings-content"
          onSubmit={handleSaveSettings}
        >
          {/* =====================================================
              SETTINGS MESSAGE
          ====================================================== */}

          {message && (
            <div className="candidate-settings-message">
              <CheckCircle2 size={17} />
              <span>{message}</span>
            </div>
          )}

          {/* =====================================================
              ACCOUNT
          ====================================================== */}

          <section className="candidate-settings-section">
            <div className="candidate-settings-section-heading">
              <div className="candidate-settings-section-icon">
                <UserRound size={20} />
              </div>

              <div>
                <span>01</span>
                <h2>Account</h2>
                <p>Manage your basic candidate account information.</p>
              </div>
            </div>

            <div className="candidate-settings-account-card">
              <div className="candidate-settings-account-avatar">
                <UserRound size={28} />
              </div>

              <div className="candidate-settings-account-info">
                <strong>Candidate Account</strong>

                <span>
                  <Mail size={14} />
                  Your registered email address
                </span>
              </div>

              <div className="candidate-settings-account-status">
                <ShieldCheck size={15} />
                Active
              </div>
            </div>

            <p className="candidate-settings-note">
              To update your name, phone number, professional information,
              education or profile details, visit your Profile page.
            </p>
          </section>

          {/* =====================================================
              NOTIFICATIONS
          ====================================================== */}

          <section className="candidate-settings-section">
            <div className="candidate-settings-section-heading">
              <div className="candidate-settings-section-icon">
                <Bell size={20} />
              </div>

              <div>
                <span>02</span>
                <h2>Notifications</h2>
                <p>Choose which notifications you want to receive.</p>
              </div>
            </div>

            <div className="candidate-settings-options">
              <SettingToggle
                icon={<Mail size={18} />}
                title="Email Notifications"
                description="Receive important account notifications through email."
                checked={settings.emailNotifications}
                onChange={() => handleSettingChange("emailNotifications")}
              />

              <SettingToggle
                icon={<BriefcaseBusiness size={18} />}
                title="Job Alerts"
                description="Receive notifications about jobs matching your profile."
                checked={settings.jobAlerts}
                onChange={() => handleSettingChange("jobAlerts")}
              />

              <SettingToggle
                icon={<CheckCircle2 size={18} />}
                title="Application Updates"
                description="Get updates when your application status changes."
                checked={settings.applicationUpdates}
                onChange={() => handleSettingChange("applicationUpdates")}
              />

              <SettingToggle
                icon={<Mail size={18} />}
                title="Recruiter Messages"
                description="Receive notifications when recruiters contact you."
                checked={settings.recruiterMessages}
                onChange={() => handleSettingChange("recruiterMessages")}
              />

              <SettingToggle
                icon={<Mail size={18} />}
                title="Marketing Emails"
                description="Receive product updates, tips and promotional emails."
                checked={settings.marketingEmails}
                onChange={() => handleSettingChange("marketingEmails")}
              />
            </div>
          </section>

          {/* =====================================================
              JOB PREFERENCES
          ====================================================== */}

          <section className="candidate-settings-section">
            <div className="candidate-settings-section-heading">
              <div className="candidate-settings-section-icon">
                <BriefcaseBusiness size={20} />
              </div>

              <div>
                <span>03</span>
                <h2>Job Preferences</h2>
                <p>Control how AI-Hire recommends opportunities to you.</p>
              </div>
            </div>

            <div className="candidate-settings-options">
              <SettingToggle
                icon={<BriefcaseBusiness size={18} />}
                title="Personalized Job Recommendations"
                description="Allow AI-Hire to recommend jobs based on your profile and skills."
                checked={settings.preferredJobAlerts}
                onChange={() => handleSettingChange("preferredJobAlerts")}
              />

              <SettingToggle
                icon={<Mail size={18} />}
                title="Weekly Job Digest"
                description="Receive a weekly summary of relevant job opportunities."
                checked={settings.weeklyJobDigest}
                onChange={() => handleSettingChange("weeklyJobDigest")}
              />
            </div>
          </section>

          {/* =====================================================
              PRIVACY
          ====================================================== */}

          <section className="candidate-settings-section">
            <div className="candidate-settings-section-heading">
              <div className="candidate-settings-section-icon">
                <Eye size={20} />
              </div>

              <div>
                <span>04</span>
                <h2>Privacy & Visibility</h2>
                <p>
                  Control how recruiters can discover and view your profile.
                </p>
              </div>
            </div>

            <div className="candidate-settings-options">
              <SettingToggle
                icon={<Eye size={18} />}
                title="Profile Visibility"
                description="Allow recruiters to view your candidate profile."
                checked={settings.profileVisibility}
                onChange={() => handleSettingChange("profileVisibility")}
              />

              <SettingToggle
                icon={<Eye size={18} />}
                title="Resume Visibility"
                description="Allow recruiters to view your uploaded resume."
                checked={settings.resumeVisibility}
                onChange={() => handleSettingChange("resumeVisibility")}
              />

              <SettingToggle
                icon={<UserRound size={18} />}
                title="Recruiter Searchable"
                description="Allow recruiters to find your profile through candidate search."
                checked={settings.recruiterSearchable}
                onChange={() => handleSettingChange("recruiterSearchable")}
              />
            </div>

            <div className="candidate-settings-privacy-note">
              <ShieldCheck size={18} />

              <div>
                <strong>Your privacy matters</strong>
                <p>
                  You control how your profile and resume are shared with
                  recruiters.
                </p>
              </div>
            </div>
          </section>

          {/* =====================================================
              SECURITY / CHANGE PASSWORD
          ====================================================== */}

          <section className="candidate-settings-section">
            <div className="candidate-settings-section-heading">
              <div className="candidate-settings-section-icon">
                <LockKeyhole size={20} />
              </div>

              <div>
                <span>05</span>
                <h2>Security</h2>
                <p>
                  Keep your AI-Hire account secure by managing your password.
                </p>
              </div>
            </div>

            <div className="candidate-settings-password-card">
              <div className="candidate-settings-password-title">
                <LockKeyhole size={18} />

                <div>
                  <strong>Change Password</strong>
                  <span>
                    Use a strong password that you do not use elsewhere.
                  </span>
                </div>
              </div>

              <div className="candidate-settings-password-grid">
                <PasswordField
                  label="Current Password"
                  value={currentPassword}
                  onChange={setCurrentPassword}
                  visible={showCurrentPassword}
                  onToggle={() =>
                    setShowCurrentPassword((previous) => !previous)
                  }
                />

                <PasswordField
                  label="New Password"
                  value={newPassword}
                  onChange={setNewPassword}
                  visible={showNewPassword}
                  onToggle={() => setShowNewPassword((previous) => !previous)}
                />

                <PasswordField
                  label="Confirm New Password"
                  value={confirmPassword}
                  onChange={setConfirmPassword}
                  visible={showConfirmPassword}
                  onToggle={() =>
                    setShowConfirmPassword((previous) => !previous)
                  }
                />
              </div>

              <div className="candidate-settings-password-actions">
                <button
                  type="button"
                  className="candidate-settings-secondary-button"
                  onClick={() => {
                    setCurrentPassword("");
                    setNewPassword("");
                    setConfirmPassword("");
                  }}
                >
                  Clear
                </button>

                <button
                  type="button"
                  className="candidate-settings-primary-button"
                  onClick={handleChangePassword}
                  disabled={changingPassword}
                >
                  <LockKeyhole size={16} />

                  {changingPassword ? "Changing..." : "Change Password"}
                </button>
              </div>
            </div>
          </section>

          {/* =====================================================
              SAVE SETTINGS
          ====================================================== */}

          <section className="candidate-settings-save-bar">
            <div>
              <strong>Save your settings</strong>

              <span>
                Your notification and privacy preferences will be updated.
              </span>
            </div>

            <button
              type="submit"
              className="candidate-settings-primary-button"
              disabled={saving}
            >
              <Save size={16} />

              {saving ? "Saving..." : "Save Settings"}
            </button>
          </section>
        </form>

        {/* =====================================================
            ACCOUNT ACTIONS
        ====================================================== */}

        <section className="candidate-settings-section candidate-settings-danger-section">
          <div className="candidate-settings-section-heading">
            <div className="candidate-settings-section-icon candidate-settings-danger-icon">
              <Trash2 size={20} />
            </div>

            <div>
              <span>06</span>
              <h2>Account Actions</h2>
              <p>
                Manage your active session or permanently delete your account.
              </p>
            </div>
          </div>

          <div className="candidate-settings-danger-actions">
            <div className="candidate-settings-danger-card">
              <div>
                <strong>Sign out</strong>

                <p>Sign out from your current AI-Hire session.</p>
              </div>

              <button
                type="button"
                className="candidate-settings-secondary-button"
                onClick={handleLogout}
              >
                <LogOut size={16} />
                Sign Out
              </button>
            </div>

            <div className="candidate-settings-delete-card">
              <div>
                <strong>Delete Account</strong>

                <p>
                  Permanently delete your candidate account and associated data.
                  This action cannot be undone.
                </p>
              </div>

              <button
                type="button"
                className="candidate-settings-delete-button"
                onClick={handleDeleteAccount}
              >
                <Trash2 size={16} />
                Delete Account
              </button>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}

/* =========================================================
   SETTING TOGGLE
========================================================= */

function SettingToggle({ icon, title, description, checked, onChange }) {
  return (
    <div className="candidate-settings-option">
      <div className="candidate-settings-option-icon">{icon}</div>

      <div className="candidate-settings-option-content">
        <strong>{title}</strong>

        <p>{description}</p>
      </div>

      <button
        type="button"
        className={`candidate-settings-toggle ${checked ? "is-active" : ""}`}
        onClick={onChange}
        aria-pressed={checked}
        aria-label={`Toggle ${title}`}
      >
        <span />
      </button>
    </div>
  );
}

/* =========================================================
   PASSWORD FIELD
========================================================= */

function PasswordField({ label, value, onChange, visible, onToggle }) {
  return (
    <label className="candidate-settings-password-field">
      <span>{label}</span>

      <div className="candidate-settings-password-input">
        <input
          type={visible ? "text" : "password"}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          placeholder={label}
        />

        <button
          type="button"
          onClick={onToggle}
          aria-label={visible ? "Hide password" : "Show password"}
        >
          {visible ? <EyeOff size={17} /> : <Eye size={17} />}
        </button>
      </div>
    </label>
  );
}
