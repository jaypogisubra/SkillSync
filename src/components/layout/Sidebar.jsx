import { NavLink, useNavigate } from "react-router-dom";
import { signOut } from "../../services/authService";

const sidebarLinks = {
  admin: [
    { label: "Dashboard", icon: "⌂", path: "/admin/dashboard" },
    { label: "Manage Users", icon: "👥", path: "/admin/users" },
    { label: "Manage Jobs", icon: "▣", path: "/admin/jobs" },
    { label: "Employers", icon: "▤", path: "/admin/employers" },
    { label: "Reports", icon: "↗", path: "/admin/reports" },
  ],

  candidate: [
    { label: "Dashboard", icon: "⌂", path: "/candidate/dashboard" },
    { label: "Resume", icon: "▤", path: "/candidate/resume" },
    { label: "Job Matches", icon: "◎", path: "/candidate/jobs" },
    { label: "Applications", icon: "▣", path: "/candidate/applications" },
    { label: "Profile", icon: "👤", path: "/candidate/profile" },
  ],

  employer: [
    { label: "Dashboard", icon: "⌂", path: "/employer/dashboard" },
    { label: "Manage Jobs", icon: "▣", path: "/employer/jobs" },
    { label: "Post Job", icon: "＋", path: "/employer/post-job" },
    { label: "Applicants", icon: "👥", path: "/employer/applicants" },
    { label: "Company Profile", icon: "▤", path: "/employer/company" },
  ],
};

export default function Sidebar({ role }) {
  const navigate = useNavigate();

  const links = sidebarLinks[role] || sidebarLinks.candidate;

  const roleLabel =
    role === "admin" ? "Admin" : role === "employer" ? "Employer" : "Job Seeker";

  const roleSubtitle =
    role === "admin"
      ? "Control Panel"
      : role === "employer"
      ? "Hiring Workspace"
      : "Career Workspace";

  async function handleLogout() {
    try {
      await signOut();
    } finally {
      navigate("/sign-in", { replace: true });
    }
  }

  return (
    <aside className="dashboard-sidebar">
      <NavLink to="/" className="dashboard-logo">
        <span className="dashboard-logo-icon">✓</span>
        <span>
          <strong>SkillSync</strong>
          <small>Find the right match</small>
        </span>
      </NavLink>

      <div className="sidebar-role-card">
        <span>{roleLabel}</span>
        <strong>{roleSubtitle}</strong>
      </div>

      <nav className="sidebar-nav">
        {links.map((link) => (
          <NavLink
            key={link.label}
            to={link.path}
            className={({ isActive }) =>
              isActive ? "sidebar-link active" : "sidebar-link"
            }
          >
            <span>{link.icon}</span>
            {link.label}
          </NavLink>
        ))}
      </nav>

      <button type="button" className="sidebar-logout" onClick={handleLogout}>
        Logout
      </button>
    </aside>
  );
}