import { useEffect, useMemo, useState } from "react";
import { Navigate } from "react-router-dom";
import { Building2, CheckCircle2, Clock3, Search, XCircle } from "lucide-react";

import AdminSidebar from "../../components/Admin/AdminSidebar";
import AdminHeader from "../../components/Admin/AdminHeader";
import { adminApi } from "../../services/api";

import "../../styles/AdminCSS/AdminCompanies.css";

export default function AdminCompanies() {
  const session = JSON.parse(sessionStorage.getItem("user") || "null");
  const [companies, setCompanies] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [query, setQuery] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState(null);

  useEffect(() => {
    if (session?.role !== "Admin") return;

    adminApi.companies()
      .then((companyData) => {
        setCompanies(companyData || []);
      })
      .catch((error) => setMessage(error?.message || "Unable to load companies."))
      .finally(() => setLoading(false));
  }, [session?.role]);

  const unread = notifications.filter((item) => !item.isRead).length;
  const normalizedQuery = query.trim().toLowerCase();
  const filteredCompanies = useMemo(
    () =>
      companies.filter((company) =>
        `${company.companyName || ""} ${company.industry || ""} ${company.email || ""}`
          .toLowerCase()
          .includes(normalizedQuery),
      ),
    [companies, normalizedQuery],
  );

  const statusCounts = {
    approved: companies.filter((company) => company.approvalStatus === "Approved").length,
    pending: companies.filter((company) => company.approvalStatus === "Pending").length,
    rejected: companies.filter((company) => company.approvalStatus === "Rejected").length,
  };

  if (!session) return <Navigate to="/login" replace />;
  if (session.role !== "Admin") {
    return <Navigate to={`/${session.role.toLowerCase()}/dashboard`} replace />;
  }

  async function refreshCompanies() {
    const data = await adminApi.companies();
    setCompanies(data || []);
  }

  async function updateCompany(id, action) {
    try {
      let reason = "";
      if (action === "reject") {
        reason = window.prompt("Reason for rejecting this company:");
        if (reason === null) return;
      }

      setUpdatingId(id);
      if (action === "approve") await adminApi.approveCompany(id);
      else await adminApi.rejectCompany(id, reason);
      await refreshCompanies();
      setMessage(action === "approve" ? "Company approved successfully." : "Company rejected.");
    } catch (error) {
      setMessage(error?.message || "Unable to update this company.");
    } finally {
      setUpdatingId(null);
    }
  }

  return (
    <div className="admin-dashboard-layout">
      <AdminSidebar unread={unread} />
      <main className="admin-dashboard-main">
        <AdminHeader
          title="Companies"
          subtitle="Review and manage every company registered on HireLine."
          query={query}
          onQueryChange={setQuery}
          notifications={notifications}
          onNotificationsChange={setNotifications}
        />

        <div className="admin-dashboard-content admin-companies-page">
          {message && <div className="admin-message"><CheckCircle2 size={17} /><span>{message}</span></div>}

          <section className="admin-companies-page-heading">
            <div>
              <span>Company directory</span>
              <h2>Registered Companies</h2>
              <p>Review profiles and keep your company network up to date.</p>
            </div>
            <div className="admin-company-summary">
              <span><CheckCircle2 size={15} /> {statusCounts.approved} approved</span>
              <span><Clock3 size={15} /> {statusCounts.pending} pending</span>
              <span><XCircle size={15} /> {statusCounts.rejected} rejected</span>
            </div>
          </section>

          {loading ? (
            <div className="admin-companies-empty">Loading registered companies...</div>
          ) : filteredCompanies.length ? (
            <section className="admin-company-card-grid">
              {filteredCompanies.map((company) => {
                const status = (company.approvalStatus || "Unknown").toLowerCase();
                const isPending = company.approvalStatus === "Pending";
                return (
                  <article className="admin-directory-company-card" key={company.id}>
                    <header>
                      <div className="admin-directory-company-avatar">
                        {company.companyName?.slice(0, 1).toUpperCase() || <Building2 size={18} />}
                      </div>
                      <span className={`admin-directory-status ${status}`}>{company.approvalStatus || "Unknown"}</span>
                    </header>
                    <span className="admin-directory-company-label">Registered company</span>
                    <h3>{company.companyName || "Unnamed Company"}</h3>
                    <p>{company.industry || "Industry not specified"}</p>
                    <div className="admin-directory-company-details">
                      <span>{company.email || "No email provided"}</span>
                      <span>{company.createdAt ? `Joined ${new Date(company.createdAt).toLocaleDateString()}` : "Join date unavailable"}</span>
                    </div>
                    <footer>
                      {isPending ? (
                        <>
                          <button type="button" onClick={() => updateCompany(company.id, "approve")} disabled={updatingId === company.id}>
                            {updatingId === company.id ? "Updating..." : "Approve"}
                          </button>
                          <button type="button" className="admin-directory-reject" onClick={() => updateCompany(company.id, "reject")} disabled={updatingId === company.id}>Reject</button>
                        </>
                      ) : (
                        <span className="admin-directory-activity">{company.isActive ? "Active account" : "Inactive account"}</span>
                      )}
                    </footer>
                  </article>
                );
              })}
            </section>
          ) : (
            <div className="admin-companies-empty"><Search size={20} /><span>{query ? "No companies match your search." : "No registered companies found."}</span></div>
          )}
        </div>
      </main>
    </div>
  );
}
