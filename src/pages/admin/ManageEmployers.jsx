import { useEffect, useState } from "react";
import DashboardLayout from "../../components/layout/DashboardLayout";
import { supabase } from "../../services/supabase";

export default function ManageEmployers() {
  const [employers, setEmployers] = useState([]);

  useEffect(() => { loadEmployers(); }, []);

  async function loadEmployers() {
    const { data } = await supabase.from("profiles").select("*").eq("role", "employer");
    setEmployers(data || []);
  }

  async function handleRemoveEmployer(userId) {
    if (!window.confirm("Are you sure you want to remove this employer account?")) return;
    await supabase.from("profiles").delete().eq("id", userId);
    await supabase.auth.admin.deleteUser(userId).catch(() => {});
    setEmployers((prev) => prev.filter((e) => e.id !== userId));
  }

  function formatDate(dateString) {
    if (!dateString) return "No date";
    return new Date(dateString).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" });
  }

  return (
    <DashboardLayout role="admin" title="Employers"
      subtitle="Manage employer accounts and company profiles.">
      <section className="dashboard-panel">
        <div className="panel-header employers-panel-header">
          <div className="panel-header-content"><h2>Employer Accounts</h2></div>
        </div>
        {employers.length === 0 ? (
          <div className="empty-state">
            <span>▤</span><h3>No employers yet</h3>
            <p>Registered employer accounts will be displayed here.</p>
          </div>
        ) : (
          <div className="admin-employers-list">
            {employers.map((employer) => (
              <article className="admin-employer-card" key={employer.id}>
                <div className="admin-employer-main">
                  <div className="admin-employer-avatar">
                    {(employer.full_name || employer.email || "E").charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <h3>{employer.full_name || "Unnamed Employer"}</h3>
                    <p>{employer.email || "No email"}</p>
                  </div>
                </div>
                <div className="admin-employer-details-grid">
                  <div><span>Account Type</span><strong>Employer</strong></div>
                  <div><span>Email</span><strong>{employer.email || "Not provided"}</strong></div>
                  <div><span>Status</span><strong>Active</strong></div>
                  <div><span>Registered</span><strong>{formatDate(employer.created_at)}</strong></div>
                </div>
                <div className="admin-employer-actions">
                  <button type="button" className="job-delete-btn" onClick={() => handleRemoveEmployer(employer.id)}>
                    Remove
                  </button>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>
    </DashboardLayout>
  );
}