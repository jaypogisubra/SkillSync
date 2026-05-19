import { useEffect, useState } from "react";
import DashboardLayout from "../../components/layout/DashboardLayout";
import { supabase } from "../../services/supabase";

export default function JobMatches() {
  const [jobs, setJobs] = useState([]);
  const [applications, setApplications] = useState([]);
  const [message, setMessage] = useState("");
  const [userId, setUserId] = useState(null);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    setUserId(user.id);

    const { data: jobsData } = await supabase
      .from("jobs")
      .select("*")
      .eq("status", "open");
    setJobs(jobsData || []);

    const { data: appsData } = await supabase
      .from("applications")
      .select("*")
      .eq("applicant_id", user.id);
    setApplications(appsData || []);
  }

  function hasApplied(jobId) {
    return applications.some((app) => app.job_id === jobId);
  }

  async function handleApply(job) {
    if (!userId) {
      setMessage("Please sign in before applying.");
      return;
    }

    if (hasApplied(job.id)) {
      setMessage("You already applied to this job.");
      return;
    }

    const { data, error } = await supabase
      .from("applications")
      .insert([{
        job_id: job.id,
        applicant_id: userId,
        status: "applied",
      }])
      .select()
      .single();

    if (error) {
      setMessage("Failed to apply: " + error.message);
      return;
    }

    setApplications((prev) => [...prev, data]);
    setMessage("Application submitted successfully!");

    setTimeout(() => setMessage(""), 3000);
  }

  return (
    <DashboardLayout
      role="candidate"
      title="Job Matches"
      subtitle="View job opportunities prepared for your profile."
    >
      <section className="dashboard-panel">
        <div className="panel-header jobs-panel-header">
          <div className="panel-header-content">
            <h2>Matched Jobs</h2>
          </div>
        </div>

        {message && <div className="profile-message">{message}</div>}

        {jobs.length === 0 ? (
          <div className="empty-state">
            <span>◎</span>
            <h3>No job matches yet</h3>
            <p>Job matches will appear here once employers post available jobs.</p>
          </div>
        ) : (
          <div className="job-match-list">
            {jobs.map((job) => (
              <article className="job-match-card" key={job.id}>
                <div className="job-match-main">
                  <div>
                    <h3>{job.title}</h3>
                    <p>{job.description || "No job description provided."}</p>
                  </div>
                  <span className="job-status-badge open">
                    {job.status || "Open"}
                  </span>
                </div>

                <div className="job-meta">
                  <span>{job.employment_type || "Not specified"}</span>
                  <span>{job.location || "No location"}</span>
                  <span>{job.required_skills || "No skills listed"}</span>
                </div>

                <div className="job-actions">
                  <button
                    type="button"
                    className={hasApplied(job.id) ? "job-status-btn" : "job-edit-btn"}
                    onClick={() => handleApply(job)}
                    disabled={hasApplied(job.id)}
                  >
                    {hasApplied(job.id) ? "Applied" : "Apply Now"}
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