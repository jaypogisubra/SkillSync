import Sidebar from "./Sidebar";
import "../../styles/dashboard.css";

export default function DashboardLayout({
  role = "candidate",
  title,
  subtitle,
  children,
}) {
  const currentUser =
    JSON.parse(localStorage.getItem("skillsync_user")) || {};

  const panelLabel =
    role === "admin"
      ? "ADMIN PANEL"
      : role === "employer"
      ? "EMPLOYER PANEL"
      : "JOB SEEKER PANEL";

  const displayName =
    currentUser?.name ||
    currentUser?.fullName ||
    currentUser?.email ||
    "Account";

  const displayEmail = currentUser?.email || "user@skillsync.com";

  const displayInitial = displayName.charAt(0).toUpperCase();

  return (
    <div className="dashboard-page">
      <Sidebar role={role} />

      <main className="dashboard-main">
        <div className="dashboard-topbar">
          <div>
            <p className="dashboard-eyebrow">{panelLabel}</p>
            <h1>{title}</h1>
            <span>{subtitle}</span>
          </div>

          <div className="dashboard-user">
            <div>
              <strong>Account</strong>
              <small>{displayEmail}</small>
            </div>
            <span>{displayInitial}</span>
          </div>
        </div>

        {children}
      </main>
    </div>
  );
}