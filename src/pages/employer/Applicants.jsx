import { useEffect, useState } from "react";
import DashboardLayout from "../../components/layout/DashboardLayout";
import { supabase } from "../../services/supabase";

export default function Applicants() {
  const [applicants, setApplicants] = useState([]);

  useEffect(() => { loadApplicants(); }, []);

  async function loadApplicants() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data: jobs } = await supabase
      .from("jobs")
      .select("id, title, employment_type, location")
      .eq("employer_id", user.id);
    if (!jobs || jobs.length === 0) return;

    const jobIds = jobs.map((j) => j.id);
    const jobMap = {};
    jobs.forEach(j => { jobMap[j.id] = j; });

    // Fetch applications without broken FK joins
    const { data: appsData, error } = await supabase
      .from("applications")
      .select("*")
      .in("job_id", jobIds)
      .order("created_at", { ascending: false });

    if (error) {
      console.warn("Failed to load applicants:", error.message);
      return;
    }

    const apps = appsData || [];

    // Fetch applicant profiles separately
    const applicantIds = [...new Set(apps.map(a => a.applicant_id).filter(Boolean))];
    let profileMap = {};
    if (applicantIds.length > 0) {
      const { data: profilesData } = await supabase
        .from("profiles")
        .select("id, full_name, email")
        .in("id", applicantIds);
      (profilesData || []).forEach(p => { profileMap[p.id] = p; });
    }

    // Merge job + profile data into each application
    const enriched = apps.map(app => ({
      ...app,
      jobs: jobMap[app.job_id] || null,
      profiles: profileMap[app.applicant_id] || null,
    }));

    setApplicants(enriched);
  }

  async function updateStatus(appId, newStatus) {
    await supabase.from("applications").update({ status: newStatus }).eq("id", appId);
    setApplicants((prev) => prev.map((a) => a.id === appId ? { ...a, status: newStatus } : a));
  }

  async function handleAccept(appId) {
    if (!window.confirm("Accept this applicant?")) return;
    await updateStatus(appId, "hired");
  }

  async function handleReject(appId) {
    if (!window.confirm("Reject this applicant?")) return;
    await updateStatus(appId, "rejected");
  }

  return (
    <DashboardLayout role="employer" title="Applicants"
      subtitle="Review applicants for your job posts.">
      <section className="dashboard-panel">
        <div className="panel-header applicants-panel-header">
          <div className="panel-header-content"><h2>Applicant List</h2></div>
        </div>
        {applicants.length === 0 ? (
          <div className="empty-state">
            <span>👥</span>
            <h3>No applicants yet</h3>
            <p>Applicants will appear here once job seekers apply to your jobs.</p>
          </div>
        ) : (
          <div className="applicants-list">
            {applicants.map((app) => (
              <article className="applicant-card" key={app.id}>
                <div className="applicant-main">
                  <div className="applicant-avatar">
                    {(app.profiles?.full_name || "A").charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <h3>{app.profiles?.full_name || "Unnamed Applicant"}</h3>
                    <p>{app.profiles?.email || "No email"}</p>
                  </div>
                </div>
                <div className="applicant-details-grid">
                  <div><span>Applied Role</span><strong>{app.jobs?.title || "No role"}</strong></div>
                  <div><span>Job Type</span><strong>{app.jobs?.employment_type || "Not specified"}</strong></div>
                  <div><span>Location</span><strong>{app.jobs?.location || "No location"}</strong></div>
                  <div><span>Status</span><strong>{app.status || "Applied"}</strong></div>
                </div>
                <div className="applicant-actions">
                  <button type="button" className="job-edit-btn"
                    onClick={() => handleAccept(app.id)}
                    disabled={app.status === "hired" || app.status === "rejected"}>
                    Accept
                  </button>
                  <button type="button" className="job-delete-btn"
                    onClick={() => handleReject(app.id)}
                    disabled={app.status === "hired" || app.status === "rejected"}>
                    Reject
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