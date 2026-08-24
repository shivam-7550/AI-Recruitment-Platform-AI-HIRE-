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
// Candidate Dashboard
// ==========================================
import CandidateDashboard from "./pages/Candidates/CandidateDashboard";

// ==========================================
// Company Dashboard
// ==========================================
import CompanyDashboard from "./pages/Companies/CompanyDashboard";

// ==========================================
// Admin Dashboard
// ==========================================
import AdminDashboard from "./pages/Admin/AdminDashboard";

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
import AdminJobs from "./pages/Admin/AdminJobs";

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
        {/* Dashboard */}
        <Route path="/company/dashboard" element={<CompanyDashboard />} />

        {/* Profile */}
        <Route path="/company/profile" element={<CompanyDashboard />} />

        {/* Posted Jobs */}
        <Route path="/company/posted-jobs" element={<CompanyPostedJobs />} />

        {/* Create Job */}
        <Route path="/company/jobs/new" element={<CompanyDashboard />} />

        {/* Job Details */}
        <Route path="/company/jobs/:id" element={<CompanyDashboard />} />

        {/* Edit Job */}
        <Route path="/company/jobs/:id/edit" element={<CompanyDashboard />} />

        {/* Candidates */}
        <Route path="/company/candidates" element={<CompanyDashboard />} />

        {/* Applications */}
        <Route path="/company/applications" element={<CompanyApplication />} />

        {/* Interviews */}
        <Route path="/company/interviews" element={<CompanyDashboard />} />

        {/* Messages */}
        <Route path="/company/messages" element={<CompanyDashboard />} />

        {/* Analytics */}
        <Route path="/company/analytics" element={<CompanyDashboard />} />

        {/* Team */}
        <Route path="/company/team" element={<CompanyDashboard />} />

        {/* Settings */}
        <Route path="/company/settings" element={<CompanyDashboard />} />
      </Route>

      {/* =====================================================
          ADMIN ROUTES
      ===================================================== */}

      <Route element={<RoleGuard role="Admin" />}>
        {/* -----------------------------------------
            Admin Dashboard
        ----------------------------------------- */}

        <Route path="/admin/dashboard" element={<AdminDashboard />} />

        {/* -----------------------------------------
            Admin Jobs
        ----------------------------------------- */}

        <Route path="/admin/jobs" element={<AdminJobs />} />

        {/* -----------------------------------------
            Admin Companies

            Currently handled through dashboard.
            Later can be replaced with:
            <AdminCompanies />
        ----------------------------------------- */}

        <Route
          path="/admin/companies"
          element={<Navigate to="/admin/dashboard#companies" replace />}
        />

        {/* -----------------------------------------
            Admin Users

            Currently handled through dashboard.
            Later can be replaced with:
            <AdminUsers />
        ----------------------------------------- */}

        <Route
          path="/admin/users"
          element={<Navigate to="/admin/dashboard#companies" replace />}
        />

        {/* -----------------------------------------
            Admin Reports
        ----------------------------------------- */}

        <Route
          path="/admin/reports"
          element={<Navigate to="/admin/dashboard#jobs" replace />}
        />

        {/* -----------------------------------------
            AI Insights
        ----------------------------------------- */}

        <Route
          path="/admin/ai-insights"
          element={<Navigate to="/admin/dashboard#insights" replace />}
        />

        {/* -----------------------------------------
            Notifications
        ----------------------------------------- */}

        <Route
          path="/admin/notifications"
          element={<Navigate to="/admin/dashboard" replace />}
        />

        {/* -----------------------------------------
            Admin Settings
        ----------------------------------------- */}

        <Route
          path="/admin/settings"
          element={<Navigate to="/admin/dashboard" replace />}
        />
      </Route>

      {/* =====================================================
          404 / FALLBACK
      ===================================================== */}

      <Route path="*" element={<SafeFallback />} />
    </Routes>
  );
}

export default App;
