import { useEffect, useState } from "react";
import DashboardLayout from "../../components/layout/DashboardLayout";
import { supabase } from "../../services/supabase";

export default function Applications() {
  const [applications, setApplications] = useState([]);

  useEffect(() => {
    loadApplications();
  }, []);

  async function loadApplications() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data: appsData, error: appsError } = await supabase
      .from("applications")
      .select("*")
      .eq("applicant_id", user.id)
      .order("created_at", { ascending: false });

    if (appsError) {
      console.warn("Failed to load applications:", appsError.message);
      return;
    }

    // Enrich with job details using job_ids
    const apps = appsData || [];
    const jobIds = [...new Set(apps.map(a => a.job_id).filter(Boolean))];

    let jobMap = {};
    if (jobIds.length > 0) {
      const { data: jobsData } = await supabase
        .from("jobs")
        .select("id, title, employment_type, location")
        .in("id", jobIds);
      (jobsData || []).forEach(j => { jobMap[j.id] = j; });
    }

    const enriched = apps.map(app => ({
      ...app,
      jobs: jobMap[app.job_id] || null,
    }));

    setApplications(enriched);
  }

  async function handleWithdraw(applicationId) {
    const confirmWithdraw = window.confirm(
      "Are you sure you want to withdraw this application?"
    );
    if (!confirmWithdraw) return;

    await supabase.from("applications").delete().eq("id", applicationId);
    setApplications((prev) => prev.filter((app) => app.id !== applicationId));
  }

  function formatDate(dateString) {
    if (!dateString) return "No date";
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  }

  function getStatusClass(status) {
    const s = String(status || "").toLowerCase();
    if (s === "accepted" || s === "hired") return "accepted";
    if (s === "rejected") return "rejected";
    if (s.includes("interview")) return "pending";
    return "submitted";
  }

  return (
    <DashboardLayout
      role="candidate"
      title="Applications"
      subtitle="Track your submitted job applications."
    >
      <section className="dashboard-panel">
        <div className="panel-header applications-panel-header">
          <div className="panel-header-content">
            <h2>My Applications</h2>
          </div>
        </div>

        {applications.length === 0 ? (
          <div className="empty-state">
            <span>▣</span>
            <h3>No applications yet</h3>
            <p>Once you apply to a job, your application records will be shown here.</p>
          </div>
        ) : (
          <div className="applications-list">
            {applications.map((app) => (
              <article className="application-card" key={app.id}>
                <div className="application-top">
                  <div>
                    <h3>{app.jobs?.title || "Untitled Job"}</h3>
                    <p>Applied on {formatDate(app.created_at)}</p>
                  </div>
                  <span className={`application-status-badge ${getStatusClass(app.status)}`}>
                    {app.status || "Applied"}
                  </span>
                </div>

                <div className="application-details-grid">
                  <div>
                    <span>Job Type</span>
                    <strong>{app.jobs?.employment_type || "Not specified"}</strong>
                  </div>
                  <div>
                    <span>Location</span>
                    <strong>{app.jobs?.location || "No location"}</strong>
                  </div>
                  <div>
                    <span>Application Status</span>
                    <strong>{app.status || "Applied"}</strong>
                  </div>
                </div>

                {app.status === "applied" && (
                  <div className="application-actions">
                    <button
                      type="button"
                      className="job-delete-btn"
                      onClick={() => handleWithdraw(app.id)}
                    >
                      Withdraw
                    </button>
                  </div>
                )}
              </article>
            ))}
          </div>
        )}
      </section>
    </DashboardLayout>
  );
}