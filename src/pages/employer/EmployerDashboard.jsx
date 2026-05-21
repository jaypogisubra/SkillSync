import { Link } from "react-router-dom";
import { useEffect, useState } from "react";
import DashboardLayout from "../../components/layout/DashboardLayout";
import { supabase } from "../../services/supabase";
import { getNotifications, markAsRead, markAllAsRead, clearAllNotifications } from "../../services/notificationService";
import "./EmployerDashboard.css";

export default function EmployerDashboard() {
  const [jobs, setJobs] = useState([]);
  const [applications, setApplications] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [showBell, setShowBell] = useState(false);
  const [userId, setUserId] = useState(null);
  const [activityLogs, setActivityLogs] = useState([]);

  useEffect(() => { loadDashboardData(); }, []);

  async function loadDashboardData() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    setUserId(user.id);

    // Jobs
    const { data: jobsData } = await supabase
      .from("jobs").select("*")
      .eq("employer_id", user.id)
      .order("created_at", { ascending: false });
    const myJobs = jobsData || [];
    setJobs(myJobs);

    // Applications for those jobs
    let enrichedApps = [];
    if (myJobs.length > 0) {
      const jobIds = myJobs.map(j => j.id);
      const { data: appsData } = await supabase
        .from("applications").select("*")
        .in("job_id", jobIds)
        .order("created_at", { ascending: false });

      const apps = appsData || [];
      const applicantIds = [...new Set(apps.map(a => a.applicant_id).filter(Boolean))];

      let profileMap = {};
      if (applicantIds.length > 0) {
        const { data: profilesData } = await supabase
          .from("profiles").select("id,full_name,email,skills")
          .in("id", applicantIds);
        (profilesData || []).forEach(p => { profileMap[p.id] = p; });
      }

      const jobMap = Object.fromEntries(myJobs.map(j => [j.id, j]));
      enrichedApps = apps.map(app => ({
        ...app,
        profiles: profileMap[app.applicant_id] || null,
        jobs: jobMap[app.job_id] || null,
      }));
      setApplications(enrichedApps);

      // Build activity feed from recent applications
      const logs = enrichedApps.slice(0, 5).map(app => ({
        id: app.id,
        icon: "✉️",
        title: `${app.profiles?.full_name || "Someone"} applied`,
        desc: `Applied for ${app.jobs?.title || "a job"} · ${new Date(app.created_at).toLocaleDateString()}`,
      }));
      setActivityLogs(logs);
    }

    // Notifications
    const { data: notifData } = await getNotifications(user.id);
    setNotifications(notifData || []);
  }

  async function handleNotifClick(id) {
    await markAsRead(id);
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n));
  }
  async function handleMarkAllRead() {
    if (!userId) return;
    await markAllAsRead(userId);
    setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
  }
  async function handleClearAll() {
    if (!userId) return;
    await clearAllNotifications(userId);
    setNotifications([]);
    setShowBell(false);
  }

  // Derived stats
  const openJobs        = jobs.filter(j => j.status === "open");
  const closedJobs      = jobs.filter(j => j.status === "closed");
  const shortlisted     = applications.filter(a => a.status === "shortlisted");
  const interviews      = applications.filter(a => String(a.status||"").toLowerCase().includes("interview"));
  const hired           = applications.filter(a => ["hired","accepted"].includes(String(a.status||"").toLowerCase()));
  const pending         = applications.filter(a => ["applied","pending","submitted"].includes(String(a.status||"").toLowerCase()));
  const unread          = notifications.filter(n => !n.is_read).length;

  // Donut chart: pipeline distribution
  const total = applications.length || 1; // avoid /0
  const segments = [
    { label: "Pending",     count: pending.length,     color: "#8b18ff" },
    { label: "Shortlisted", count: shortlisted.length, color: "#10b981" },
    { label: "Interview",   count: interviews.length,  color: "#f59e0b" },
    { label: "Hired",       count: hired.length,       color: "#f13093" },
  ];
  let cumulativeOffset = 0;
  const CIRC = 2 * Math.PI * 40; // r=40

  // Bar chart: applications per job (top 5 jobs by applicant count)
  const jobAppCounts = jobs.slice(0, 6).map(job => ({
    label: (job.title || "Job").substring(0, 8),
    count: applications.filter(a => a.job_id === job.id).length,
  }));
  const maxCount = Math.max(...jobAppCounts.map(j => j.count), 1);

  return (
    <DashboardLayout
      role="employer"
      title="Recruiter Dashboard"
      subtitle="Monitor hiring pipelines, applicant analytics, and job performance."
    >
      {/* Topbar actions */}
      <div className="recruiter-topbar-actions">
        <Link to="/employer/post-job" className="recruiter-action-btn">＋ Post New Job</Link>
        <Link to="/employer/applicants" className="recruiter-action-btn">👥 View Applicants</Link>

        <div className="recruiter-bell-container">
          <button type="button" className="recruiter-bell-btn" onClick={() => setShowBell(!showBell)}>
            🔔
            {unread > 0 && <span className="recruiter-bell-badge">{unread}</span>}
          </button>

          {showBell && (
            <div className="recruiter-notif-dropdown">
              <div className="recruiter-notif-header">
                <h3>Inbox Notifications</h3>
                {notifications.length > 0 && (
                  <button type="button" className="recruiter-notif-clear" onClick={handleMarkAllRead}>Mark all read</button>
                )}
              </div>
              <div className="recruiter-notif-list">
                {notifications.length > 0 ? notifications.map(n => (
                  <div key={n.id} className={`recruiter-notif-item ${!n.is_read ? "unread" : ""}`} onClick={() => handleNotifClick(n.id)}>
                    <span className="recruiter-notif-icon">
                      {n.type === "job_match" ? "🧠" : n.type === "application_update" ? "✉️" : "📢"}
                    </span>
                    <div className="recruiter-notif-info">
                      <h4>{n.title}</h4>
                      <p>{n.message}</p>
                    </div>
                  </div>
                )) : (
                  <div className="recruiter-notif-empty">No notifications yet.</div>
                )}
              </div>
              {notifications.length > 0 && (
                <div style={{ padding: "8px 14px", borderTop: "1px solid #f1f5f9", textAlign: "right" }}>
                  <button type="button" className="recruiter-notif-clear" style={{ color: "#dc2626" }} onClick={handleClearAll}>Clear All</button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Stats grid — 7 cards */}
      <div className="recruiter-stats-grid">
        <div className="recruiter-stat-card">
          <div className="recruiter-stat-icon purple">▣</div>
          <div className="recruiter-stat-info">
            <h3>{jobs.length}</h3>
            <p>Total Job Posts</p>
          </div>
        </div>
        <div className="recruiter-stat-card">
          <div className="recruiter-stat-icon blue">◎</div>
          <div className="recruiter-stat-info">
            <h3>{openJobs.length}</h3>
            <p>Active Listings</p>
          </div>
        </div>
        <div className="recruiter-stat-card">
          <div className="recruiter-stat-icon teal">👥</div>
          <div className="recruiter-stat-info">
            <h3>{applications.length}</h3>
            <p>Total Applicants</p>
          </div>
        </div>
        <div className="recruiter-stat-card">
          <div className="recruiter-stat-icon orange">⭐</div>
          <div className="recruiter-stat-info">
            <h3>{shortlisted.length}</h3>
            <p>Shortlisted</p>
          </div>
        </div>
        <div className="recruiter-stat-card">
          <div className="recruiter-stat-icon green">📅</div>
          <div className="recruiter-stat-info">
            <h3>{interviews.length}</h3>
            <p>Interviews Scheduled</p>
          </div>
        </div>
        <div className="recruiter-stat-card">
          <div className="recruiter-stat-icon pink">✅</div>
          <div className="recruiter-stat-info">
            <h3>{hired.length}</h3>
            <p>Hired</p>
          </div>
        </div>
        <div className="recruiter-stat-card">
          <div className="recruiter-stat-icon red">⏳</div>
          <div className="recruiter-stat-info">
            <h3>{pending.length}</h3>
            <p>Pending Review</p>
          </div>
        </div>
      </div>

      {/* Analytics columns */}
      <div className="recruiter-analytics-columns">
        {/* Donut: pipeline */}
        <div className="recruiter-panel">
          <div className="recruiter-panel-header">
            <h2>Applicant Pipeline</h2>
          </div>
          <div className="donut-chart-container">
            <div className="donut-svg-wrap" style={{ width: 140, height: 140 }}>
              <svg width="140" height="140" viewBox="0 0 100 100">
                {applications.length === 0 ? (
                  <circle cx="50" cy="50" r="40" fill="none" stroke="#f1f0f5" strokeWidth="14"/>
                ) : segments.map((seg, i) => {
                  const pct = (seg.count / total) * CIRC;
                  const offset = -(cumulativeOffset);
                  cumulativeOffset += (seg.count / total) * CIRC;
                  return (
                    <circle
                      key={i}
                      cx="50" cy="50" r="40"
                      fill="none"
                      stroke={seg.color}
                      strokeWidth="14"
                      strokeDasharray={`${pct} ${CIRC - pct}`}
                      strokeDashoffset={offset}
                      style={{ transform: "rotate(-90deg)", transformOrigin: "50% 50%" }}
                    />
                  );
                })}
              </svg>
              <div className="donut-center-label">
                <strong>{applications.length}</strong>
                <span>Total</span>
              </div>
            </div>
            <div className="donut-legend">
              {segments.map(seg => (
                <div className="donut-legend-item" key={seg.label}>
                  <span className="donut-legend-dot" style={{ background: seg.color }}></span>
                  {seg.label}
                  <span className="donut-legend-count">{seg.count}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Bar chart: applications per job */}
        <div className="recruiter-panel">
          <div className="recruiter-panel-header">
            <h2>Applications per Job</h2>
          </div>
          {jobs.length === 0 ? (
            <p style={{ color: "#94a3b8", fontSize: "13px", textAlign: "center", padding: "30px" }}>Post a job to see analytics.</p>
          ) : (
            <div className="bar-chart-wrap">
              {jobAppCounts.map((item, i) => (
                <div className="bar-chart-bar-group" key={i}>
                  <div
                    className="bar-chart-bar"
                    style={{ height: `${Math.max(4, (item.count / maxCount) * 100)}px` }}
                    title={`${item.count} applicants`}
                  ></div>
                  <span className="bar-chart-bar-label">{item.label}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Bottom columns: activity + recent applicants */}
      <div className="recruiter-analytics-columns">
        {/* Activity feed */}
        <div className="recruiter-panel">
          <div className="recruiter-panel-header">
            <h2>Recent Hiring Activity</h2>
          </div>
          {activityLogs.length === 0 ? (
            <p style={{ color: "#94a3b8", fontSize: "13px", textAlign: "center", padding: "24px" }}>No activity yet.</p>
          ) : (
            <div className="recruiter-activity-feed">
              {activityLogs.map(log => (
                <div className="recruiter-activity-item" key={log.id}>
                  <div className="recruiter-activity-dot">{log.icon}</div>
                  <div className="recruiter-activity-content">
                    <h4>{log.title}</h4>
                    <p>{log.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Recent job posts */}
        <div className="recruiter-panel">
          <div className="recruiter-panel-header">
            <h2>Recent Job Posts</h2>
            <Link to="/employer/jobs" style={{ fontSize: "12px", color: "#8b18ff", fontWeight: "800", textDecoration: "none" }}>Manage →</Link>
          </div>
          {jobs.length === 0 ? (
            <div className="empty-state compact-empty-state">
              <span>▣</span><h3>No jobs posted</h3>
              <p>Create your first job listing.</p>
            </div>
          ) : (
            <div className="overview-list">
              {jobs.slice(0, 4).map(job => (
                <article className="overview-list-card" key={job.id}>
                  <div className="overview-list-card-content">
                    <h3>{job.title}</h3>
                    <p>{job.employment_type} · {applications.filter(a => a.job_id === job.id).length} applicants</p>
                  </div>
                  <span className={`overview-status ${job.status === "closed" ? "closed" : "open"}`}>
                    {job.status}
                  </span>
                </article>
              ))}
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}