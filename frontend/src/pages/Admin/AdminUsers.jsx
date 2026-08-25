import { useEffect, useMemo, useState } from "react";
import { Navigate } from "react-router-dom";
import { Search, UserRound, UsersRound } from "lucide-react";
import AdminSidebar from "../../components/Admin/AdminSidebar";
import AdminHeader from "../../components/Admin/AdminHeader";
import { adminApi } from "../../services/api";
import "../../styles/AdminCSS/AdminUsers.css";

export default function AdminUsers() {
  const session = JSON.parse(sessionStorage.getItem("user") || "null");
  const [users, setUsers] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [query, setQuery] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (session?.role !== "Admin") return;
    adminApi.users()
      .then((userData) => {
        setUsers(userData || []);
      })
      .catch((requestError) =>
        setError(requestError?.message || "Unable to load registered users."),
      )
      .finally(() => setLoading(false));
  }, [session?.role]);

  const unread = notifications.filter(
    (notification) => !notification.isRead,
  ).length;
  const normalizedQuery = query.trim().toLowerCase();
  const filteredUsers = useMemo(
    () =>
      users.filter((user) =>
        `${user.name || ""} ${user.email || ""} ${user.role || ""}`
          .toLowerCase()
          .includes(normalizedQuery),
      ),
    [users, normalizedQuery],
  );

  if (!session) return <Navigate to="/login" replace />;
  if (session.role !== "Admin")
    return <Navigate to={`/${session.role.toLowerCase()}/dashboard`} replace />;

  return (
    <div className="admin-dashboard-layout">
      <AdminSidebar unread={unread} />
      <main className="admin-dashboard-main">
        <AdminHeader
          title="Candidates"
          subtitle="View candidates registered on the HireLine platform."
          query={query}
          onQueryChange={setQuery}
          notifications={notifications}
          onNotificationsChange={setNotifications}
        />
        <div className="admin-dashboard-content admin-users-page">
          {error && <div className="admin-users-notice">{error}</div>}
          <section className="admin-users-page-heading">
            <div>
              <span>Candidate directory</span>
              <h2>Registered Users</h2>
              <p>Browse every candidate registered on HireLine.</p>
            </div>
            <div className="admin-users-summary">
              <span>
                <UsersRound size={15} /> {users.length} registered
              </span>
              <span>
                <UserRound size={15} /> Candidate accounts
              </span>
            </div>
          </section>
          {loading ? (
            <div className="admin-users-empty">Loading registered users...</div>
          ) : filteredUsers.length ? (
            <section className="admin-user-card-grid">
              {filteredUsers.map((user) => {
                const initials = (user.name || "User")
                  .split(" ")
                  .filter(Boolean)
                  .map((word) => word[0])
                  .slice(0, 2)
                  .join("")
                  .toUpperCase();
                const role = (user.role || "User").toLowerCase();
                return (
                  <article className="admin-directory-user-card" key={user.id}>
                    <header>
                      <div className="admin-directory-user-avatar">
                        {initials}
                      </div>
                      <span className={`admin-user-role ${role}`}>
                        {user.role || "User"}
                      </span>
                    </header>
                    <span className="admin-directory-user-label">
                      Candidate account
                    </span>
                    <h3>{user.name || "Unnamed User"}</h3>
                    <p>{user.email || "No email provided"}</p>
                    <div className="admin-directory-user-details">
                      <span>Candidate account</span>
                      <span>
                        {user.createdAt
                          ? `Joined ${new Date(user.createdAt).toLocaleDateString()}`
                          : "Join date unavailable"}
                      </span>
                    </div>
                    <footer>
                      <span>Active account</span>
                    </footer>
                  </article>
                );
              })}
            </section>
          ) : (
            <div className="admin-users-empty">
              <Search size={20} />
              <span>
                {query
                  ? "No users match your search."
                  : "No registered users found."}
              </span>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
