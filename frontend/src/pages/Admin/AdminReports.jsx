import React, { useEffect, useMemo, useState } from "react";
import {
  Activity,
  BriefcaseBusiness,
  Building2,
  CalendarDays,
  CheckCircle2,
  Clock3,
  FileText,
  Filter,
  RefreshCw,
  Search,
  TrendingUp,
  UserRound,
  Users,
  XCircle,
} from "lucide-react";

import { adminApi } from "../../services/api";
import AdminSidebar from "../../components/admin/AdminSidebar";
import AdminHeader from "../../components/admin/AdminHeader";

import "../../styles/AdminCSS/AdminReports.css";

const TABS = [
  { key: "overview", label: "Overview", icon: Activity },
  { key: "candidates", label: "Candidates", icon: Users },
  { key: "companies", label: "Companies", icon: Building2 },
  { key: "jobs", label: "Jobs", icon: BriefcaseBusiness },
  { key: "applications", label: "Applications", icon: FileText },
  { key: "interviews", label: "Interviews", icon: CalendarDays },
  { key: "ats", label: "AI / ATS", icon: TrendingUp },
  {
    key: "performance",
    label: "Company Performance",
    icon: Building2,
  },
];

const pad = (value) => String(value).padStart(2, "0");

const formatDateInput = (date) => {
  if (!date) return "";

  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(
    date.getDate(),
  )}`;
};

const getToday = () => {
  const today = new Date();

  return {
    from: formatDateInput(today),
    to: formatDateInput(today),
  };
};

const getLast7Days = () => {
  const to = new Date();
  const from = new Date();

  from.setDate(from.getDate() - 6);

  return {
    from: formatDateInput(from),
    to: formatDateInput(to),
  };
};

const getLast30Days = () => {
  const to = new Date();
  const from = new Date();

  from.setDate(from.getDate() - 29);

  return {
    from: formatDateInput(from),
    to: formatDateInput(to),
  };
};

const getThisMonth = () => {
  const today = new Date();

  const from = new Date(today.getFullYear(), today.getMonth(), 1);

  return {
    from: formatDateInput(from),
    to: formatDateInput(today),
  };
};

const formatNumber = (value) => {
  return new Intl.NumberFormat("en-IN").format(Number(value || 0));
};

const formatPercent = (value) => {
  return `${Number(value || 0).toFixed(1)}%`;
};

const normalizeDate = (value) => {
  if (!value) return "";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return String(value).slice(0, 10);
  }

  return formatDateInput(date);
};

const getMaxTrendValue = (trend = []) => {
  const values = trend.map((item) => Number(item?.count || 0));

  return Math.max(...values, 1);
};

function StatCard({ title, value, subtitle, icon: Icon, className = "" }) {
  return (
    <div className={`report-stat-card ${className}`}>
      <div className="report-stat-card-top">
        <div className="report-stat-icon">
          <Icon size={19} strokeWidth={1.8} />
        </div>
      </div>

      <div className="report-stat-value">
        {typeof value === "number" ? formatNumber(value) : value}
      </div>

      <div className="report-stat-title">{title}</div>

      {subtitle && <div className="report-stat-subtitle">{subtitle}</div>}
    </div>
  );
}

function SectionHeader({ title, description }) {
  return (
    <div className="report-section-header">
      <div>
        <h2>{title}</h2>

        {description && <p>{description}</p>}
      </div>
    </div>
  );
}

function EmptyState({ message = "No data available." }) {
  return (
    <div className="report-empty-state">
      <FileText size={24} />
      <span>{message}</span>
    </div>
  );
}

function TrendChart({ data = [], title = "Trend" }) {
  const max = getMaxTrendValue(data);

  return (
    <div className="report-card report-trend-card">
      <div className="report-card-header">
        <div>
          <h3>{title}</h3>
          <span>Based on the selected date range</span>
        </div>
      </div>

      {data.length === 0 ? (
        <EmptyState message="No trend data available for this period." />
      ) : (
        <div className="report-trend-list">
          {data.map((item, index) => {
            const value = Number(item?.count || 0);
            const width = Math.max((value / max) * 100, value > 0 ? 4 : 0);

            return (
              <div className="report-trend-row" key={`${item?.date}-${index}`}>
                <div className="report-trend-date">
                  {normalizeDate(item?.date)}
                </div>

                <div className="report-trend-bar-wrapper">
                  <div
                    className="report-trend-bar"
                    style={{ width: `${width}%` }}
                  />
                </div>

                <div className="report-trend-count">{formatNumber(value)}</div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function DistributionList({ data = [], title }) {
  return (
    <div className="report-card">
      <div className="report-card-header">
        <div>
          <h3>{title}</h3>
        </div>
      </div>

      {data.length === 0 ? (
        <EmptyState />
      ) : (
        <div className="report-distribution-list">
          {data.map((item, index) => (
            <div
              className="report-distribution-row"
              key={`${item?.status}-${index}`}
            >
              <span>{item?.status || "Unknown"}</span>

              <strong>{formatNumber(item?.count)}</strong>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function Funnel({ data = [] }) {
  const max = Math.max(...data.map((item) => Number(item?.count || 0)), 1);

  return (
    <div className="report-card">
      <div className="report-card-header">
        <div>
          <h3>Recruitment Funnel</h3>
          <span>Actual application statuses</span>
        </div>
      </div>

      {data.length === 0 ? (
        <EmptyState />
      ) : (
        <div className="report-funnel">
          {data.map((item, index) => {
            const count = Number(item?.count || 0);
            const width = Math.max((count / max) * 100, 8);

            return (
              <div
                className="report-funnel-row"
                key={`${item?.stage}-${index}`}
              >
                <div className="report-funnel-label">{item?.stage}</div>

                <div className="report-funnel-track">
                  <div
                    className="report-funnel-fill"
                    style={{ width: `${width}%` }}
                  >
                    <span>{formatNumber(count)}</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function Table({ columns, rows, emptyMessage }) {
  if (!rows || rows.length === 0) {
    return <EmptyState message={emptyMessage} />;
  }

  return (
    <div className="report-table-wrapper">
      <table className="report-table">
        <thead>
          <tr>
            {columns.map((column) => (
              <th key={column.key}>{column.label}</th>
            ))}
          </tr>
        </thead>

        <tbody>
          {rows.map((row, rowIndex) => (
            <tr key={row.id || row.companyId || rowIndex}>
              {columns.map((column) => (
                <td key={column.key}>
                  {column.render
                    ? column.render(row)
                    : (row[column.key] ?? "—")}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default function AdminReports() {
  const initialRange = getLast30Days();

  const [activeTab, setActiveTab] = useState("overview");

  const [fromDate, setFromDate] = useState(initialRange.from);
  const [toDate, setToDate] = useState(initialRange.to);

  const [appliedFrom, setAppliedFrom] = useState(initialRange.from);
  const [appliedTo, setAppliedTo] = useState(initialRange.to);

  const [report, setReport] = useState(null);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [query, setQuery] = useState("");

  const loadReports = async (from = appliedFrom, to = appliedTo) => {
    try {
      setLoading(true);
      setError("");

      const data = await adminApi.reports(from, to);

      setReport(data);
    } catch (err) {
      console.error("Failed to load admin reports:", err);

      setError(err?.message || "Unable to load reports. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadReports();
  }, []);

  const applyFilter = () => {
    if (!fromDate || !toDate) {
      setError("Please select both From Date and To Date.");
      return;
    }

    if (fromDate > toDate) {
      setError("From Date cannot be after To Date.");
      return;
    }

    setAppliedFrom(fromDate);
    setAppliedTo(toDate);

    loadReports(fromDate, toDate);
  };

  const resetFilter = () => {
    const range = getLast30Days();

    setFromDate(range.from);
    setToDate(range.to);
    setAppliedFrom(range.from);
    setAppliedTo(range.to);

    loadReports(range.from, range.to);
  };

  const selectPreset = (preset) => {
    let range;

    switch (preset) {
      case "today":
        range = getToday();
        break;

      case "7":
        range = getLast7Days();
        break;

      case "30":
        range = getLast30Days();
        break;

      case "month":
        range = getThisMonth();
        break;

      default:
        return;
    }

    setFromDate(range.from);
    setToDate(range.to);
    setAppliedFrom(range.from);
    setAppliedTo(range.to);

    loadReports(range.from, range.to);
  };

  const filteredPerformance = useMemo(() => {
    const rows = report?.companyPerformance || [];

    if (!query.trim()) {
      return rows;
    }

    const search = query.toLowerCase();

    return rows.filter((company) =>
      String(company?.companyName || "")
        .toLowerCase()
        .includes(search),
    );
  }, [report, query]);

  const overview = report?.overview;
  const candidates = report?.candidates;
  const companies = report?.companies;
  const jobs = report?.jobs;
  const applications = report?.applications;
  const interviews = report?.interviews;
  const ats = report?.ats;

  const renderOverview = () => (
    <>
      <SectionHeader
        title="Platform Overview"
        description="Current platform totals with activity generated during the selected period."
      />

      <div className="report-stat-grid">
        <StatCard
          title="Total Candidates"
          value={overview?.totalCandidates}
          subtitle="Current registered candidates"
          icon={Users}
        />

        <StatCard
          title="Total Companies"
          value={overview?.totalCompanies}
          subtitle="All registered companies"
          icon={Building2}
        />

        <StatCard
          title="Approved Companies"
          value={overview?.approvedCompanies}
          subtitle="Currently approved"
          icon={CheckCircle2}
        />

        <StatCard
          title="Pending Companies"
          value={overview?.pendingCompanies}
          subtitle="Awaiting approval"
          icon={Clock3}
        />

        <StatCard
          title="Total Jobs"
          value={overview?.totalJobs}
          subtitle="All job postings"
          icon={BriefcaseBusiness}
        />

        <StatCard
          title="Active Jobs"
          value={overview?.activeJobs}
          subtitle="Currently active"
          icon={Activity}
        />

        <StatCard
          title="Total Applications"
          value={overview?.totalApplications}
          subtitle="All applications"
          icon={FileText}
        />

        <StatCard
          title="Total Interviews"
          value={overview?.totalInterviews}
          subtitle="All interviews"
          icon={CalendarDays}
        />
      </div>

      <div className="report-period-heading">
        <div>
          <h3>Period Activity</h3>
          <span>
            {appliedFrom} → {appliedTo}
          </span>
        </div>
      </div>

      <div className="report-stat-grid report-stat-grid-small">
        <StatCard
          title="New Candidates"
          value={overview?.newCandidates}
          icon={UserRound}
        />

        <StatCard
          title="New Companies"
          value={overview?.newCompanies}
          icon={Building2}
        />

        <StatCard
          title="New Jobs"
          value={overview?.newJobs}
          icon={BriefcaseBusiness}
        />

        <StatCard
          title="New Applications"
          value={overview?.newApplications}
          icon={FileText}
        />

        <StatCard
          title="New Interviews"
          value={overview?.newInterviews}
          icon={CalendarDays}
        />
      </div>
    </>
  );

  const renderCandidates = () => (
    <>
      <SectionHeader
        title="Candidate Report"
        description="Candidate registration, activity and resume coverage."
      />

      <div className="report-stat-grid">
        <StatCard
          title="Registered Candidates"
          value={candidates?.totalRegisteredCandidates}
          icon={Users}
        />

        <StatCard
          title="New Candidates"
          value={candidates?.newCandidates}
          subtitle="Selected period"
          icon={UserRound}
        />

        <StatCard
          title="With Resume"
          value={candidates?.candidatesWithResume}
          icon={FileText}
        />

        <StatCard
          title="Without Resume"
          value={candidates?.candidatesWithoutResume}
          icon={XCircle}
        />

        <StatCard
          title="Candidates Who Applied"
          value={candidates?.candidatesWhoApplied}
          icon={Activity}
        />

        <StatCard
          title="Candidates Who Saved Jobs"
          value={candidates?.candidatesWhoSavedJobs}
          icon={BriefcaseBusiness}
        />

        <StatCard
          title="Active Candidates"
          value={candidates?.activeCandidates}
          icon={CheckCircle2}
        />

        <StatCard
          title="Inactive Candidates"
          value={candidates?.inactiveCandidates}
          icon={Clock3}
        />
      </div>

      <div className="report-grid-two">
        <TrendChart
          title="Candidate Registration Trend"
          data={candidates?.registrationTrend || []}
        />

        <div className="report-card">
          <div className="report-card-header">
            <div>
              <h3>Resume Coverage</h3>
              <span>Current candidate resume status</span>
            </div>
          </div>

          <div className="report-progress-group">
            <div className="report-progress-row">
              <div>
                <span>With Resume</span>
                <strong>
                  {formatNumber(candidates?.candidatesWithResume)}
                </strong>
              </div>

              <div className="report-progress-track">
                <div
                  className="report-progress-fill"
                  style={{
                    width: `${
                      candidates?.totalRegisteredCandidates
                        ? Math.min(
                            (candidates.candidatesWithResume /
                              candidates.totalRegisteredCandidates) *
                              100,
                            100,
                          )
                        : 0
                    }%`,
                  }}
                />
              </div>
            </div>

            <div className="report-progress-row">
              <div>
                <span>Without Resume</span>
                <strong>
                  {formatNumber(candidates?.candidatesWithoutResume)}
                </strong>
              </div>

              <div className="report-progress-track">
                <div
                  className="report-progress-fill secondary"
                  style={{
                    width: `${
                      candidates?.totalRegisteredCandidates
                        ? Math.min(
                            (candidates.candidatesWithoutResume /
                              candidates.totalRegisteredCandidates) *
                              100,
                            100,
                          )
                        : 0
                    }%`,
                  }}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );

  const renderCompanies = () => (
    <>
      <SectionHeader
        title="Company Report"
        description="Company registration, approval and platform participation."
      />

      <div className="report-stat-grid">
        <StatCard
          title="Total Companies"
          value={companies?.totalCompanies}
          icon={Building2}
        />

        <StatCard
          title="Approved"
          value={companies?.approvedCompanies}
          icon={CheckCircle2}
        />

        <StatCard
          title="Pending"
          value={companies?.pendingCompanies}
          icon={Clock3}
        />

        <StatCard
          title="Rejected"
          value={companies?.rejectedCompanies}
          icon={XCircle}
        />

        <StatCard
          title="New Companies"
          value={companies?.newCompanies}
          subtitle="Selected period"
          icon={TrendingUp}
        />

        <StatCard
          title="Active Companies"
          value={companies?.activeCompanies}
          icon={Activity}
        />

        <StatCard
          title="Companies With Jobs"
          value={companies?.companiesWithJobs}
          icon={BriefcaseBusiness}
        />

        <StatCard
          title="Companies With Applications"
          value={companies?.companiesWithApplications}
          icon={FileText}
        />
      </div>

      <TrendChart
        title="Company Registration Trend"
        data={companies?.registrationTrend || []}
      />
    </>
  );

  const renderJobs = () => (
    <>
      <SectionHeader
        title="Job Posting Report"
        description="Job inventory and company-level posting performance."
      />

      <div className="report-stat-grid">
        <StatCard
          title="Total Jobs"
          value={jobs?.totalJobs}
          icon={BriefcaseBusiness}
        />

        <StatCard
          title="Active Jobs"
          value={jobs?.activeJobs}
          icon={Activity}
        />

        <StatCard
          title="Expired Jobs"
          value={jobs?.expiredJobs}
          icon={Clock3}
        />

        <StatCard
          title="Jobs Created"
          value={jobs?.jobsCreatedDuringPeriod}
          subtitle="Selected period"
          icon={TrendingUp}
        />
      </div>

      <div className="report-card">
        <div className="report-card-header">
          <div>
            <h3>Jobs by Company</h3>
            <span>Company posting activity and applications</span>
          </div>
        </div>

        <Table
          rows={jobs?.jobsByCompany || []}
          emptyMessage="No company job data available."
          columns={[
            {
              key: "companyName",
              label: "Company",
            },
            {
              key: "jobsPosted",
              label: "Jobs Posted",
              render: (row) => formatNumber(row.jobsPosted),
            },
            {
              key: "activeJobs",
              label: "Active Jobs",
              render: (row) => formatNumber(row.activeJobs),
            },
            {
              key: "applications",
              label: "Applications",
              render: (row) => formatNumber(row.applications),
            },
          ]}
        />
      </div>
    </>
  );

  const renderApplications = () => (
    <>
      <SectionHeader
        title="Application & Recruitment Report"
        description="Application volume, status distribution and recruitment funnel."
      />

      <div className="report-stat-grid">
        <StatCard
          title="Total Applications"
          value={applications?.totalApplications}
          icon={FileText}
        />

        <StatCard
          title="Applied"
          value={applications?.applied}
          icon={Activity}
        />

        <StatCard
          title="Under Review"
          value={applications?.underReview}
          icon={Clock3}
        />

        <StatCard
          title="Shortlisted"
          value={applications?.shortlisted}
          icon={CheckCircle2}
        />

        <StatCard
          title="Interview"
          value={applications?.interview}
          icon={CalendarDays}
        />

        <StatCard title="Hired" value={applications?.hired} icon={TrendingUp} />

        <StatCard
          title="Rejected"
          value={applications?.rejected}
          icon={XCircle}
        />
      </div>

      <div className="report-grid-two">
        <TrendChart
          title="Application Trend"
          data={applications?.trend || []}
        />

        <DistributionList
          title="Application Status Distribution"
          data={applications?.distribution || []}
        />
      </div>

      <Funnel data={applications?.funnel || []} />
    </>
  );

  const renderInterviews = () => (
    <>
      <SectionHeader
        title="Interview Report"
        description="Interview status and scheduling analytics."
      />

      <div className="report-stat-grid">
        <StatCard
          title="Total Interviews"
          value={interviews?.totalInterviews}
          subtitle="Overall interview count"
          icon={CalendarDays}
        />

        <StatCard
          title="Scheduled"
          value={interviews?.scheduled}
          icon={Clock3}
        />

        <StatCard
          title="Rescheduled"
          value={interviews?.rescheduled}
          icon={RefreshCw}
        />

        <StatCard
          title="Completed"
          value={interviews?.completed}
          icon={CheckCircle2}
        />

        <StatCard
          title="Cancelled"
          value={interviews?.cancelled}
          icon={XCircle}
        />

        <StatCard title="No Show" value={interviews?.noShow} icon={Users} />

        <StatCard
          title="Upcoming"
          value={interviews?.upcomingInterviews}
          icon={CalendarDays}
        />
      </div>

      <TrendChart title="Interview Trend" data={interviews?.trend || []} />

      <div className="report-card">
        <div className="report-card-header">
          <div>
            <h3>Interviews by Company</h3>
            <span>Company-level interview breakdown</span>
          </div>
        </div>

        <Table
          rows={interviews?.interviewsByCompany || []}
          emptyMessage="No company interview breakdown is currently available from the backend."
          columns={[
            {
              key: "companyName",
              label: "Company",
            },
            {
              key: "totalInterviews",
              label: "Total",
              render: (row) => formatNumber(row.totalInterviews),
            },
            {
              key: "upcomingInterviews",
              label: "Upcoming",
              render: (row) => formatNumber(row.upcomingInterviews),
            },
            {
              key: "completedInterviews",
              label: "Completed",
              render: (row) => formatNumber(row.completedInterviews),
            },
          ]}
        />
      </div>

      <div className="report-note">
        <CalendarDays size={17} />
        <span>
          Interview totals are currently provided as overall values by the
          backend, while the trend follows the selected date range.
        </span>
      </div>
    </>
  );

  const renderATS = () => (
    <>
      <SectionHeader
        title="AI / ATS Report"
        description="Resume and application ATS analytics. Gemini AI history is not fabricated when it is not persisted."
      />

      <div className="report-stat-grid">
        <StatCard
          title="Resumes Analyzed"
          value={ats?.resumesAnalyzed}
          icon={FileText}
        />

        <StatCard
          title="Average Resume ATS"
          value={
            ats?.averageResumeATS != null
              ? Number(ats.averageResumeATS).toFixed(1)
              : "0.0"
          }
          icon={TrendingUp}
        />

        <StatCard
          title="Applications Analyzed"
          value={ats?.applicationsAnalyzed}
          icon={Activity}
        />

        <StatCard
          title="Average Application ATS"
          value={
            ats?.averageApplicationATS != null
              ? Number(ats.averageApplicationATS).toFixed(1)
              : "0.0"
          }
          icon={TrendingUp}
        />

        <StatCard title="ATS 80+" value={ats?.above80} icon={CheckCircle2} />

        <StatCard
          title="ATS 60–79"
          value={ats?.between60And80}
          icon={Activity}
        />

        <StatCard title="ATS Below 60" value={ats?.below60} icon={XCircle} />
      </div>

      <div className="report-card">
        <div className="report-card-header">
          <div>
            <h3>Resume ATS Distribution</h3>
            <span>Current resume ATS score buckets</span>
          </div>
        </div>

        <div className="report-score-distribution">
          <div className="report-score-item">
            <span>80 and above</span>
            <strong>{formatNumber(ats?.above80)}</strong>
          </div>

          <div className="report-score-item">
            <span>60 to below 80</span>
            <strong>{formatNumber(ats?.between60And80)}</strong>
          </div>

          <div className="report-score-item">
            <span>Below 60</span>
            <strong>{formatNumber(ats?.below60)}</strong>
          </div>
        </div>
      </div>

      <div className="report-note">
        <TrendingUp size={17} />
        <span>
          The current backend report exposes ATS metrics only. Gemini AI
          analysis history is not persisted in this report contract, so no fake
          AI-analysis numbers are shown.
        </span>
      </div>
    </>
  );

  const renderPerformance = () => (
    <>
      <SectionHeader
        title="Company Performance"
        description="Compare company job posting, application, shortlist and interview activity."
      />

      <div className="report-card">
        <div className="report-card-header report-performance-header">
          <div>
            <h3>Company Performance</h3>
            <span>Lifetime company performance from current platform data</span>
          </div>

          <div className="report-search">
            <Search size={17} />

            <input
              type="text"
              placeholder="Search company..."
              value={query}
              onChange={(event) => setQuery(event.target.value)}
            />
          </div>
        </div>

        <Table
          rows={filteredPerformance}
          emptyMessage="No company performance data available."
          columns={[
            {
              key: "companyName",
              label: "Company",
            },
            {
              key: "jobsPosted",
              label: "Jobs Posted",
              render: (row) => formatNumber(row.jobsPosted),
            },
            {
              key: "activeJobs",
              label: "Active Jobs",
              render: (row) => formatNumber(row.activeJobs),
            },
            {
              key: "applications",
              label: "Applications",
              render: (row) => formatNumber(row.applications),
            },
            {
              key: "shortlisted",
              label: "Shortlisted",
              render: (row) => formatNumber(row.shortlisted),
            },
            {
              key: "interviews",
              label: "Interviews",
              render: (row) => formatNumber(row.interviews),
            },
          ]}
        />
      </div>
    </>
  );

  const renderActiveSection = () => {
    if (!report) return null;

    switch (activeTab) {
      case "candidates":
        return renderCandidates();

      case "companies":
        return renderCompanies();

      case "jobs":
        return renderJobs();

      case "applications":
        return renderApplications();

      case "interviews":
        return renderInterviews();

      case "ats":
        return renderATS();

      case "performance":
        return renderPerformance();

      case "overview":
      default:
        return renderOverview();
    }
  };

  return (
    <div className="admin-reports-layout">
      <AdminSidebar />

      <main className="admin-reports-main">
        <AdminHeader
          title="Reports"
          subtitle="Platform analytics and recruitment performance"
          query=""
          onQueryChange={() => {}}
        />

        <div className="admin-reports-content">
          <div className="reports-page-header">
            <div>
              <h1>Admin Reports</h1>

              <p>
                Analyze platform activity, recruitment progress and company
                performance.
              </p>
            </div>

            <button
              className="reports-refresh-button"
              onClick={() => loadReports()}
              disabled={loading}
            >
              <RefreshCw size={17} className={loading ? "spin" : ""} />

              {loading ? "Refreshing..." : "Refresh"}
            </button>
          </div>

          <div className="reports-filter-card">
            <div className="reports-filter-title">
              <Filter size={18} />
              <span>Date Range</span>
            </div>

            <div className="reports-presets">
              <button type="button" onClick={() => selectPreset("today")}>
                Today
              </button>

              <button type="button" onClick={() => selectPreset("7")}>
                Last 7 Days
              </button>

              <button type="button" onClick={() => selectPreset("30")}>
                Last 30 Days
              </button>

              <button type="button" onClick={() => selectPreset("month")}>
                This Month
              </button>
            </div>

            <div className="reports-date-fields">
              <label>
                <span>From Date</span>

                <input
                  type="date"
                  value={fromDate}
                  onChange={(event) => setFromDate(event.target.value)}
                />
              </label>

              <label>
                <span>To Date</span>

                <input
                  type="date"
                  value={toDate}
                  onChange={(event) => setToDate(event.target.value)}
                />
              </label>

              <button
                type="button"
                className="reports-apply-button"
                onClick={applyFilter}
              >
                Apply
              </button>

              <button
                type="button"
                className="reports-reset-button"
                onClick={resetFilter}
              >
                Reset
              </button>
            </div>
          </div>

          {error && (
            <div className="reports-error">
              <XCircle size={18} />
              <span>{error}</span>
            </div>
          )}

          <div className="reports-tabs">
            {TABS.map((tab) => {
              const Icon = tab.icon;

              return (
                <button
                  type="button"
                  key={tab.key}
                  className={activeTab === tab.key ? "active" : ""}
                  onClick={() => setActiveTab(tab.key)}
                >
                  <Icon size={17} />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>

          {loading && !report ? (
            <div className="reports-loading">
              <div className="reports-loading-spinner" />
              <span>Loading reports...</span>
            </div>
          ) : report ? (
            <div className="reports-section">{renderActiveSection()}</div>
          ) : (
            <div className="reports-empty">
              <FileText size={30} />
              <h3>No report data</h3>
              <p>Reports could not be loaded.</p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
