import { Link } from "react-router-dom";
import { useEffect, useState } from "react";
import DashboardLayout from "../../components/layout/DashboardLayout";
import { supabase } from "../../services/supabase";

export default function AdminDashboard() {
  const [stats, setStats] = useState({
    jobSeekers: 0, employers: 0, totalJobs: 0,
    openJobs: 0, closedJobs: 0, totalApplications: 0,
  });
  const [recentUsers, setRecentUsers] = useState([]);
  const [recentJobs, setRecentJobs] = useState([]);

  useEffect(() => { loadDashboardData(); }, []);

  async function loadDashboardData() {
    const { data: profiles } = await supabase.from("profiles").select("*");
    const { data: jobs } = await supabase.from("jobs").select("*").order("created_at", { ascending: false });
    const { data: applications } = await supabase.from("applications").select("*");

    const jobSeekers = (profiles || []).filter((p) => p.role === "candidate" || p.role === "job_seeker");
    const employers = (profiles || []).filter((p) => p.role === "employer");
    const openJobs = (jobs || []).filter((j) => j.status === "open");
    const closedJobs = (jobs || []).filter((j) => j.status === "closed");

    setStats({
      jobSeekers: jobSeekers.length,
      employers: employers.length,
      totalJobs: (jobs || []).length,
      openJobs: openJobs.length,
      closedJobs: closedJobs.length,
      totalApplications: (applications || []).length,
    });

    setRecentUsers((profiles || []).slice(0, 3));
    setRecentJobs((jobs || []).slice(0, 3));
  }

  return (
    <DashboardLayout role="admin" title="Admin Dashboard"
      subtitle="Manage the SkillSync platform from one workspace.">
      <section className="dashboard-grid">
        <section className="dashboard-hero-card">
          <div>
            <span className="section-badge">Platform Management</span>
            <h2>Welcome to the admin workspace</h2>
            <p>Monitor registered job seekers, employers, job posts, and applications from one admin overview.</p>
          </div>
          <div className="dashboard-hero-icon">▣</div>
        </section>

        <section className="overview-grid admin-overview-grid">
          <article className="overview-card"><span>👥</span><div><h3>{stats.jobSeekers}</h3><p>Job Seekers</p></div></article>
          <article className="overview-card"><span>▤</span><div><h3>{stats.employers}</h3><p>Employers</p></div></article>
          <article className="overview-card"><span>▣</span><div><h3>{stats.totalJobs}</h3><p>Total Job Posts</p></div></article>
          <article className="overview-card"><span>◎</span><div><h3>{stats.openJobs}</h3><p>Open Jobs</p></div></article>
          <article className="overview-card"><span>□</span><div><h3>{stats.closedJobs}</h3><p>Closed Jobs</p></div></article>
          <article className="overview-card"><span>↗</span><div><h3>{stats.totalApplications}</h3><p>Total Applications</p></div></article>
        </section>

        <section className="dashboard-overview-columns">
          <section className="dashboard-panel overview-panel">
            <div className="panel-header overview-panel-header">
              <div className="panel-header-content"><h2>Recent Accounts</h2></div>
              <Link to="/admin/users" className="panel-action">Manage Users</Link>
            </div>
            <div className="overview-panel-body">
              {recentUsers.length === 0 ? (
                <div className="empty-state compact-empty-state">
                  <span>👥</span><h3>No registered accounts yet</h3>
                  <p>Registered users will appear here once accounts are created.</p>
                </div>
              ) : (
                <div className="overview-list">
                  {recentUsers.map((user) => (
                    <article className="overview-list-card" key={user.id}>
                      <div className="overview-list-card-content">
                        <h3>{user.full_name || "Unnamed User"}</h3>
                        <p>{user.email || "No email"}</p>
                      </div>
                      <span className="overview-status submitted">{user.role || "user"}</span>
                    </article>
                  ))}
                </div>
              )}
            </div>
          </section>

          <section className="dashboard-panel overview-panel">
            <div className="panel-header overview-panel-header">
              <div className="panel-header-content"><h2>Recent Job Posts</h2></div>
              <Link to="/admin/jobs" className="panel-action">Manage Jobs</Link>
            </div>
            <div className="overview-panel-body">
              {recentJobs.length === 0 ? (
                <div className="empty-state compact-empty-state">
                  <span>▣</span><h3>No job posts yet</h3>
                  <p>Employer job posts will appear here once employers create jobs.</p>
                </div>
              ) : (
                <div className="overview-list">
                  {recentJobs.map((job) => (
                    <article className="overview-list-card" key={job.id}>
                      <div className="overview-list-card-content">
                        <h3>{job.title || "Untitled Job"}</h3>
                        <p>{job.employment_type || "Not specified"} • {job.location || "No location"}</p>
                      </div>
                      <span className={`overview-status ${job.status === "closed" ? "closed" : "open"}`}>
                        {job.status || "open"}
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