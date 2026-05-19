import { Link } from "react-router-dom";
import { useEffect, useState } from "react";
import DashboardLayout from "../../components/layout/DashboardLayout";
import { supabase } from "../../services/supabase";

export default function CandidateDashboard() {
  const [resume, setResume] = useState(null);
  const [profile, setProfile] = useState(null);
  const [jobs, setJobs] = useState([]);
  const [applications, setApplications] = useState([]);

  useEffect(() => {
    loadDashboardData();
  }, []);

  async function loadDashboardData() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    // Use maybeSingle() so it returns null (not error) when no row exists
    const { data: profileData } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", user.id)
      .maybeSingle();
    setProfile(profileData);

    // maybeSingle() prevents 406 error when user has no resume yet
    const { data: resumeData } = await supabase
      .from("resumes")
      .select("*")
      .eq("applicant_id", user.id)
      .maybeSingle();
    setResume(resumeData);

    const { data: jobsData } = await supabase
      .from("jobs")
      .select("*")
      .eq("status", "open");
    setJobs(jobsData || []);

    // Select applications without join to avoid 400 errors from wrong FK names
    const { data: appsData, error: appsError } = await supabase
      .from("applications")
      .select("*")
      .eq("applicant_id", user.id);

    if (appsError) {
      console.warn("Applications fetch error:", appsError.message);
      setApplications([]);
    } else {
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
  }

  function getStatusClass(status) {
    const s = String(status || "").toLowerCase();
    if (s === "accepted" || s === "hired") return "accepted";
    if (s === "rejected") return "rejected";
    if (s.includes("interview")) return "pending";
    return "submitted";
  }

  function getProfileStatus() {
    if (!profile) return "Incomplete";
    if (profile.full_name && profile.email && profile.role) return "Ready";
    return "Incomplete";
  }

  const recentJobs = jobs.slice(0, 3);
  const recentApplications = applications.slice(0, 3);

  return (
    <DashboardLayout
      role="candidate"
      title="Job Seeker Dashboard"
      subtitle="Manage your profile, resume, applications, and job matching setup."
    >
      <section className="dashboard-grid">
        <section className="dashboard-hero-card">
          <div>
            <span className="section-badge">Career Workspace</span>
            <h2>Prepare your profile for job matching</h2>
            <p>
              Upload your resume, complete your profile, browse open job
              matches, and track your submitted applications from one workspace.
            </p>
          </div>
          <div className="dashboard-hero-icon">◎</div>
        </section>

        <section className="overview-grid">
          <article className="overview-card">
            <span>▤</span>
            <div>
              <h3>{resume ? 1 : 0}</h3>
              <p>Resume Uploaded</p>
            </div>
          </article>

          <article className="overview-card">
            <span>◎</span>
            <div>
              <h3>{jobs.length}</h3>
              <p>Open Job Matches</p>
            </div>
          </article>

          <article className="overview-card">
            <span>▣</span>
            <div>
              <h3>{applications.length}</h3>
              <p>Applications Sent</p>
            </div>
          </article>

          <article className="overview-card">
            <span>👤</span>
            <div>
              <h3>{getProfileStatus()}</h3>
              <p>Profile Status</p>
            </div>
          </article>
        </section>

        <section className="dashboard-overview-columns">
          <section className="dashboard-panel overview-panel">
            <div className="panel-header overview-panel-header">
              <div className="panel-header-content">
                <h2>Job Matches Overview</h2>
              </div>
              <Link to="/candidate/jobs" className="panel-action">
                View Matches
              </Link>
            </div>

            <div className="overview-panel-body">
              {recentJobs.length === 0 ? (
                <div className="empty-state compact-empty-state">
                  <span>◎</span>
                  <h3>No job matches yet</h3>
                  <p>Job matches will appear here once employers post available jobs.</p>
                </div>
              ) : (
                <div className="overview-list">
                  {recentJobs.map((job) => (
                    <article className="overview-list-card" key={job.id}>
                      <div className="overview-list-card-content">
                        <h3>{job.title || "Untitled Job"}</h3>
                        <p>{job.employment_type || "Not specified"} • {job.location || "No location"}</p>
                      </div>
                      <span className="overview-status open">
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
                <h2>Recent Applications</h2>
              </div>
              <Link to="/candidate/applications" className="panel-action">
                View Applications
              </Link>
            </div>

            <div className="overview-panel-body">
              {recentApplications.length === 0 ? (
                <div className="empty-state compact-empty-state">
                  <span>▣</span>
                  <h3>No applications yet</h3>
                  <p>Your submitted applications will appear here after you apply to a job.</p>
                </div>
              ) : (
                <div className="overview-list">
                  {recentApplications.map((app) => (
                    <article className="overview-list-card" key={app.id}>
                      <div className="overview-list-card-content">
                        <h3>{app.jobs?.title || "Untitled Job"}</h3>
                        <p>{app.jobs?.employment_type || "Not specified"} • {app.status || "Applied"}</p>
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