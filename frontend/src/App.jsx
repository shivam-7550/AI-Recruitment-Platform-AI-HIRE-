import { Navigate, Routes, Route } from "react-router-dom";

// ==========================================
// Public Pages
// ==========================================
import Landing from "./pages/Landing";
import Login from "./pages/Login";

// ==========================================
// Registration
// ==========================================
import CandidateRegister from "./pages/Candidates/CandidateRegister";
import CompanyRegister from "./pages/Companies/CompanyRegister";

// ==========================================
// Dashboards
// ==========================================
import CandidateDashboard from "./pages/Candidates/CandidateDashboard";
import CompanyDashboard from "./pages/Companies/CompanyDashboard";
import AdminDashboard from "./pages/AdminDashboard";

// ==========================================
// Candidate Pages
// ==========================================
import CandidateApplications from "./pages/Candidates/CandidateApplication";
import CandidateResume from "./pages/Candidates/CandidateResume";
import CandidateSavedJobs from "./pages/Candidates/CandidateSavedJobs";
import CandidateMessages from "./pages/Candidates/CandidateMessages";
import CandidateSettings from "./pages/Candidates/CandidateSettings";
import CandidateProfile from "./pages/Candidates/CandidateProfile";
import CandidateBrowseJobs from "./pages/Candidates/CandidateBrowseJobs";

// ==========================================
// Company Pages
// ==========================================
import CompanyPostedJobs from "./pages/Companies/CompanyPostedJobs";
import CompanyApplication from "./pages/Companies/CompanyApplication";

// ==========================================
// Admin Pages
// ==========================================
import AdminJobs from "./pages/AdminJobs";

// ==========================================
// Route Guards
// ==========================================
import {
  DashboardRedirect,
  RoleGuard,
  SafeFallback,
} from "./components/RouteGuard";

function App() {
  return (
    <Routes>
      {/* =====================================================
          PUBLIC ROUTES
      ===================================================== */}

      <Route path="/" element={<Landing />} />

      <Route path="/login" element={<Login />} />

      {/* Legacy Login Routes */}
      <Route path="/login/user" element={<Navigate to="/login" replace />} />

      <Route path="/login/company" element={<Navigate to="/login" replace />} />

      <Route path="/login/admin" element={<Navigate to="/login" replace />} />

      {/* =====================================================
          REGISTRATION
      ===================================================== */}

      <Route
        path="/register"
        element={<Navigate to="/register/candidate" replace />}
      />

      <Route path="/register/candidate" element={<CandidateRegister />} />

      <Route path="/register/company" element={<CompanyRegister />} />

      {/* =====================================================
          COMMON DASHBOARD
      ===================================================== */}

      <Route path="/dashboard" element={<DashboardRedirect />} />

      {/* =====================================================
          CANDIDATE / USER ROUTES
      ===================================================== */}

      <Route element={<RoleGuard role="User" />}>
        {/* Dashboard */}
        <Route path="/user/dashboard" element={<CandidateDashboard />} />

        {/* Browse Jobs */}
        <Route path="/user/browse-jobs" element={<CandidateBrowseJobs />} />

        {/* Applications */}
        <Route path="/user/applications" element={<CandidateApplications />} />

        {/* Resume */}
        <Route path="/user/resume" element={<CandidateResume />} />

        {/* Saved Jobs */}
        <Route path="/user/saved-jobs" element={<CandidateSavedJobs />} />

        {/* Messages */}
        <Route path="/user/messages" element={<CandidateMessages />} />

        {/* Profile */}
        <Route path="/user/profile" element={<CandidateProfile />} />

        {/* Settings */}
        <Route path="/user/settings" element={<CandidateSettings />} />
      </Route>

      {/* =====================================================
          COMPANY ROUTES
      ===================================================== */}

      <Route element={<RoleGuard role="Company" />}>
        {/* -----------------------------------------
            Company Dashboard
        ----------------------------------------- */}

        <Route path="/company/dashboard" element={<CompanyDashboard />} />

        {/* -----------------------------------------
            Company Profile
        ----------------------------------------- */}

        <Route path="/company/profile" element={<CompanyDashboard />} />

        {/* -----------------------------------------
            Posted Jobs
        ----------------------------------------- */}

        <Route path="/company/posted-jobs" element={<CompanyPostedJobs />} />

        {/* -----------------------------------------
            Create / Post New Job

            IMPORTANT:
            Dedicated route is used instead of
            rendering CompanyDashboard.

            This prevents:
            Posted Jobs -> Post Job -> Back
            from unexpectedly redirecting to Dashboard.
        ----------------------------------------- */}

        <Route path="/company/jobs/new" element={<CompanyDashboard />} />

        {/* -----------------------------------------
            Job Details
        ----------------------------------------- */}

        <Route path="/company/jobs/:id" element={<CompanyDashboard />} />

        {/* -----------------------------------------
            Edit Job
        ----------------------------------------- */}

        <Route path="/company/jobs/:id/edit" element={<CompanyDashboard />} />

        {/* -----------------------------------------
            Candidates
        ----------------------------------------- */}

        <Route path="/company/candidates" element={<CompanyDashboard />} />

        {/* -----------------------------------------
            Applications
        ----------------------------------------- */}

        <Route path="/company/applications" element={<CompanyApplication />} />

        {/* -----------------------------------------
            Interviews
        ----------------------------------------- */}

        <Route path="/company/interviews" element={<CompanyDashboard />} />

        {/* -----------------------------------------
            Messages
        ----------------------------------------- */}

        <Route path="/company/messages" element={<CompanyDashboard />} />

        {/* -----------------------------------------
            Analytics
        ----------------------------------------- */}

        <Route path="/company/analytics" element={<CompanyDashboard />} />

        {/* -----------------------------------------
            Team Members
        ----------------------------------------- */}

        <Route path="/company/team" element={<CompanyDashboard />} />

        {/* -----------------------------------------
            Settings
        ----------------------------------------- */}

        <Route path="/company/settings" element={<CompanyDashboard />} />
      </Route>

      {/* =====================================================
          ADMIN ROUTES
      ===================================================== */}

      <Route element={<RoleGuard role="Admin" />}>
        {/* Dashboard */}
        <Route path="/admin/dashboard" element={<AdminDashboard />} />

        {/* Jobs */}
        <Route path="/admin/jobs" element={<AdminJobs />} />
      </Route>

      {/* =====================================================
          404
      ===================================================== */}

      <Route path="*" element={<SafeFallback />} />
    </Routes>
  );
}

export default App;
