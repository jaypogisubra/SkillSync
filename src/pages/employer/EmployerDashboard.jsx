import { Link } from "react-router-dom";
import { useEffect, useState } from "react";
import DashboardLayout from "../../components/layout/DashboardLayout";
import { supabase } from "../../services/supabase";

export default function EmployerDashboard() {
  const [jobs, setJobs] = useState([]);
  const [applications, setApplications] = useState([]);

  useEffect(() => {
    loadDashboardData();
  }, []);

  async function loadDashboardData() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data: jobsData } = await supabase
      .from("jobs")
      .select("*")
      .eq("employer_id", user.id)
      .order("created_at", { ascending: false });
    setJobs(jobsData || []);

    if (jobsData && jobsData.length > 0) {
      const jobIds = jobsData.map((j) => j.id);

      const { data: appsData } = await supabase
        .from("applications")
        .select("*")
        .in("job_id", jobIds);

      const apps = appsData || [];
      const applicantIds = [...new Set(apps.map(a => a.applicant_id).filter(Boolean))];

      let profileMap = {};
      if (applicantIds.length > 0) {
        const { data: profilesData } = await supabase
          .from("profiles")
          .select("id, full_name, email")
          .in("id", applicantIds);
        (profilesData || []).forEach(p => { profileMap[p.id] = p; });
      }

      const enriched = apps.map(app => ({
        ...app,
        profiles: profileMap[app.applicant_id] || null,
      }));
      setApplications(enriched);
    }
  }

  function getStatusClass(status) {
    const s = String(status || "").toLowerCase();
    if (s === "accepted" || s === "hired") return "accepted";
    if (s === "rejected") return "rejected";
    if (s.includes("interview")) return "pending";
    return "submitted";
  }

  const openJobs = jobs.filter((job) => job.status === "open");
  const closedJobs = jobs.filter((job) => job.status === "closed");
  const recentJobs = jobs.slice(0, 3);
  const recentApplications = applications.slice(0, 3);

  return (
    <DashboardLayout
      role="employer"
      title="Employer Dashboard"
      subtitle="Manage job posts, applicants, and company hiring activity."
    >
      <section className="dashboard-grid">
        <section className="dashboard-hero-card">
          <div>
            <span className="section-badge">Hiring Workspace</span>
            <h2>Start managing your hiring process</h2>
            <p>
              Track your job posts, review applicants, and manage your
              company hiring profile from one workspace.
            </p>
          </div>
          <div className="dashboard-hero-icon">▤</div>
        </section>

        <section className="overview-grid">
          <article className="overview-card">
            <span>▣</span>
            <div>
              <h3>{jobs.length}</h3>
              <p>Total Job Posts</p>
            </div>
          </article>

          <article className="overview-card">
            <span>◎</span>
            <div>
              <h3>{openJobs.length}</h3>
              <p>Open Jobs</p>
            </div>
          </article>

          <article className="overview-card">
            <span>□</span>
            <div>
              <h3>{closedJobs.length}</h3>
              <p>Closed Jobs</p>
            </div>
          </article>

          <article className="overview-card">
            <span>👥</span>
            <div>
              <h3>{applications.length}</h3>
              <p>Total Applicants</p>
            </div>
          </article>
        </section>

        <section className="dashboard-overview-columns">
          <section className="dashboard-panel overview-panel">
            <div className="panel-header overview-panel-header">
              <div className="panel-header-content">
                <h2>Job Posts Overview</h2>
              </div>
              <Link to="/employer/jobs" className="panel-action">
                Manage Jobs
              </Link>
            </div>

            <div className="overview-panel-body">
              {recentJobs.length === 0 ? (
                <div className="empty-state compact-empty-state">
                  <span>▣</span>
                  <h3>No job posts yet</h3>
                  <p>Your job posts will appear here once you create one.</p>
                </div>
              ) : (
                <div className="overview-list">
                  {recentJobs.map((job) => (
                    <article className="overview-list-card" key={job.id}>
                      <div className="overview-list-card-content">
                        <h3>{job.title || "Untitled Job"}</h3>
                        <p>
                          {job.employment_type || "Not specified"} •{" "}
                          {job.location || "No location"}
                        </p>
                      </div>
                      <span className={`overview-status ${job.status === "closed" ? "closed" : "open"}`}>
                        {job.status || "Open"}
                      </span>
                    </article>
                  ))}
                </div>
              )}
            </div>
          </section>

          <section className="dashboard-panel overview-panel">
            <div className="panel-header overview-panel-header">
              <div className="panel-header-content">
                <h2>Recent Applicants</h2>
              </div>
              <Link to="/employer/applicants" className="panel-action">
                View Applicants
              </Link>
            </div>

            <div className="overview-panel-body">
              {recentApplications.length === 0 ? (
                <div className="empty-state compact-empty-state">
                  <span>👥</span>
                  <h3>No applicants yet</h3>
                  <p>Applicants will appear here once job seekers apply to your jobs.</p>
                </div>
              ) : (
                <div className="overview-list">
                  {recentApplications.map((app) => (
                    <article className="overview-list-card" key={app.id}>
                      <div className="overview-list-card-content">
                        <h3>{app.profiles?.full_name || "Unnamed Applicant"}</h3>
                        <p>{app.status || "Applied"}</p>
                      </div>
                      <span className={`overview-status ${getStatusClass(app.status)}`}>
                        {app.status || "Applied"}
                      </span>
                    </article>
                  ))}
                </div>
              )}
            </div>
          </section>
        </section>
      </section>
    </DashboardLayout>
  );
}