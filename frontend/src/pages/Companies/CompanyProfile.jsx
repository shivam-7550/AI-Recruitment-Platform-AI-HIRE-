import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  Building2,
  CheckCircle2,
  Globe,
  Mail,
  MapPin,
  Phone,
  Save,
} from "lucide-react";

import { companyApi } from "../../services/api";
import CompanySidebar from "../../components/Company/CompanySidebar";
import CompanyHeader from "../../components/Company/CompanyHeader";
import "../../styles/CompanyCSS/CompanyProfile.css";

const initialForm = {
  companyName: "",
  email: "",
  phone: "",
  website: "",
  industry: "",
  city: "",
  state: "",
  country: "",
  address: "",
  description: "",
};

export default function CompanyProfile() {
  const navigate = useNavigate();

  const [company, setCompany] = useState(null);
  const [profileForm, setProfileForm] = useState(initialForm);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    loadCompany();
  }, []);

  const getSession = () => {
    try {
      return JSON.parse(sessionStorage.getItem("user")) || {};
    } catch {
      return {};
    }
  };

  const getUserId = () => {
    const user = getSession();

    return user?.userId || user?.UserId || user?.tokenUserId || user?.id || "";
  };

  const loadCompany = async () => {
    try {
      setLoading(true);
      setMessage("");

      const userId = getUserId();

      if (!userId) {
        navigate("/login", { replace: true });
        return;
      }

      const data = await companyApi.byUser(userId);

      if (!data) {
        setCompany(null);
        return;
      }

      setCompany(data);

      setProfileForm({
        companyName: data.companyName || "",
        email: data.email || "",
        phone: data.phone || "",
        website: data.website || "",
        industry: data.industry || "",
        city: data.city || "",
        state: data.state || "",
        country: data.country || "",
        address: data.address || data.fullAddress || "",
        description: data.description || "",
      });
    } catch (error) {
      console.error("Failed to load company profile:", error);
      setMessage(error?.message || "Failed to load company profile.");
    } finally {
      setLoading(false);
    }
  };

  const changeProfile = (event) => {
    const { name, value } = event.target;

    setProfileForm((previous) => ({
      ...previous,
      [name]: value,
    }));
  };

  const saveProfile = async (event) => {
    event.preventDefault();

    if (!company?.id) {
      setMessage("Company information is not available.");
      return;
    }

    try {
      setSaving(true);
      setMessage("");

      const updatedCompany = await companyApi.update(company.id, profileForm);

      const mergedCompany = {
        ...company,
        ...(updatedCompany || {}),
        ...profileForm,
      };

      setCompany(mergedCompany);

      setProfileForm({
        companyName: mergedCompany.companyName || "",
        email: mergedCompany.email || "",
        phone: mergedCompany.phone || "",
        website: mergedCompany.website || "",
        industry: mergedCompany.industry || "",
        city: mergedCompany.city || "",
        state: mergedCompany.state || "",
        country: mergedCompany.country || "",
        address: mergedCompany.address || mergedCompany.fullAddress || "",
        description: mergedCompany.description || "",
      });

      setMessage("Company profile updated successfully.");

      setTimeout(() => {
        setMessage("");
      }, 3000);
    } catch (error) {
      console.error("Failed to update company profile:", error);

      setMessage(error?.message || "Failed to update company profile.");
    } finally {
      setSaving(false);
    }
  };

  const handleBack = () => {
    navigate("/company/dashboard");
  };

  if (loading) {
    return (
      <div className="company-profile-layout">
        <CompanySidebar />

        <div className="company-profile-main">
          <CompanyHeader />

          <div className="company-profile-page">
            <div className="company-profile-loading">
              <div className="company-profile-spinner" />
              <p>Loading company profile...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!company) {
    return (
      <div className="company-profile-layout">
        <CompanySidebar />

        <div className="company-profile-main">
          <CompanyHeader />

          <div className="company-profile-page">
            <div className="company-profile-empty">
              <Building2 size={42} />

              <h2>Company profile not found</h2>

              <p>
                We could not load your company information. Please try again.
              </p>

              <button
                type="button"
                className="company-profile-back-btn"
                onClick={handleBack}
              >
                <ArrowLeft size={17} />
                Back to Dashboard
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="company-profile-layout">
      {/* =====================================================
          COMPANY SIDEBAR
      ===================================================== */}

      <CompanySidebar />

      {/* =====================================================
          MAIN CONTENT
      ===================================================== */}

      <div className="company-profile-main">
        {/* ===================================================
            COMPANY HEADER
        =================================================== */}

        <CompanyHeader company={company} setCompany={setCompany} />

        {/* ===================================================
            PROFILE PAGE
        =================================================== */}

        <main className="company-profile-page">
          <div className="company-profile-container">
            {/* Header */}
            <div className="company-profile-topbar">
              {/* <button
                type="button"
                className="company-profile-back"
                onClick={handleBack}
              >
                <ArrowLeft size={18} />
                Back to Dashboard
              </button> */}
            </div>

            <div className="company-profile-heading">
              <div>
                <div className="company-profile-title-row">
                  <div className="company-profile-title-icon">
                    <Building2 size={23} />
                  </div>

                  <div>
                    <h1>Company Profile</h1>

                    <p>Manage your company information and profile details.</p>
                  </div>
                </div>
              </div>

              {company.approvalStatus && (
                <div
                  className={`company-profile-status ${
                    String(company.approvalStatus).toLowerCase() === "approved"
                      ? "approved"
                      : ""
                  }`}
                >
                  <CheckCircle2 size={16} />

                  {company.approvalStatus}
                </div>
              )}
            </div>

            {/* Success / Error Message */}
            {message && (
              <div className="company-profile-message">
                <CheckCircle2 size={17} />

                <span>{message}</span>
              </div>
            )}

            <form className="company-profile-form" onSubmit={saveProfile}>
              {/* =================================================
                  BASIC INFORMATION
              ================================================= */}

              <section className="company-profile-card">
                <div className="company-profile-card-header">
                  <div>
                    <h2>Basic Information</h2>

                    <p>Keep your company's basic information up to date.</p>
                  </div>
                </div>

                <div className="company-profile-grid">
                  <ProfileField
                    label="Company Name"
                    name="companyName"
                    value={profileForm.companyName}
                    onChange={changeProfile}
                    placeholder="Enter company name"
                    required
                    icon={<Building2 size={17} />}
                  />

                  <ProfileField
                    label="Email"
                    name="email"
                    value={profileForm.email}
                    onChange={changeProfile}
                    placeholder="company@example.com"
                    type="email"
                    disabled
                    icon={<Mail size={17} />}
                  />

                  <ProfileField
                    label="Phone"
                    name="phone"
                    value={profileForm.phone}
                    onChange={changeProfile}
                    placeholder="Enter phone number"
                    icon={<Phone size={17} />}
                  />

                  <ProfileField
                    label="Website"
                    name="website"
                    value={profileForm.website}
                    onChange={changeProfile}
                    placeholder="https://example.com"
                    type="url"
                    icon={<Globe size={17} />}
                  />

                  <ProfileField
                    label="Industry"
                    name="industry"
                    value={profileForm.industry}
                    onChange={changeProfile}
                    placeholder="e.g. Information Technology"
                    icon={<Building2 size={17} />}
                  />
                </div>
              </section>

              {/* =================================================
                  LOCATION
              ================================================= */}

              <section className="company-profile-card">
                <div className="company-profile-card-header">
                  <div>
                    <h2>Location</h2>

                    <p>Add the location details of your company.</p>
                  </div>
                </div>

                <div className="company-profile-grid">
                  <ProfileField
                    label="City"
                    name="city"
                    value={profileForm.city}
                    onChange={changeProfile}
                    placeholder="Enter city"
                    icon={<MapPin size={17} />}
                  />

                  <ProfileField
                    label="State"
                    name="state"
                    value={profileForm.state}
                    onChange={changeProfile}
                    placeholder="Enter state"
                  />

                  <ProfileField
                    label="Country"
                    name="country"
                    value={profileForm.country}
                    onChange={changeProfile}
                    placeholder="Enter country"
                  />

                  <div className="company-profile-field full-width">
                    <label htmlFor="address">Full Address</label>

                    <div className="company-profile-input-wrapper textarea-wrapper">
                      <MapPin size={17} />

                      <textarea
                        id="address"
                        name="address"
                        value={profileForm.address}
                        onChange={changeProfile}
                        placeholder="Enter complete company address"
                        rows={3}
                      />
                    </div>
                  </div>
                </div>
              </section>

              {/* =================================================
                  ABOUT COMPANY
              ================================================= */}

              <section className="company-profile-card">
                <div className="company-profile-card-header">
                  <div>
                    <h2>About Company</h2>

                    <p>Tell candidates more about your organization.</p>
                  </div>
                </div>

                <div className="company-profile-field full-width">
                  <label htmlFor="description">Company Description</label>

                  <textarea
                    id="description"
                    name="description"
                    value={profileForm.description}
                    onChange={changeProfile}
                    placeholder="Write a short description about your company..."
                    rows={7}
                  />

                  <div className="company-profile-character-count">
                    {profileForm.description.length} characters
                  </div>
                </div>
              </section>

              {/* =================================================
                  ACTIONS
              ================================================= */}

              <div className="company-profile-actions">
                <button
                  type="button"
                  className="company-profile-cancel"
                  onClick={handleBack}
                  disabled={saving}
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  className="company-profile-save"
                  disabled={saving}
                >
                  <Save size={17} />

                  {saving ? "Saving..." : "Save Changes"}
                </button>
              </div>
            </form>
          </div>
        </main>
      </div>
    </div>
  );
}

function ProfileField({
  label,
  name,
  value,
  onChange,
  placeholder,
  type = "text",
  disabled = false,
  required = false,
  icon,
}) {
  return (
    <div className="company-profile-field">
      <label htmlFor={name}>
        {label}

        {required && <span className="required-mark">*</span>}
      </label>

      <div
        className={`company-profile-input-wrapper ${
          disabled ? "disabled" : ""
        }`}
      >
        {icon}

        <input
          id={name}
          name={name}
          type={type}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          disabled={disabled}
          required={required}
        />
      </div>
    </div>
  );
}
