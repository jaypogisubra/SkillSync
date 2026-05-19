import { useEffect, useState } from "react";
import DashboardLayout from "../../components/layout/DashboardLayout";
import {
  fetchAdminDashboardStats,
  fetchAdminProfiles,
  filterJobSeekers,
  filterEmployers,
} from "../../services/adminService";

export default function Reports() {
  const [stats, setStats] = useState(null);
  const [loadError, setLoadError] = useState("");

  useEffect(() => {
    loadReports();
  }, []);

  async function loadReports() {
    setLoadError("");
    const { data, error } = await fetchAdminDashboardStats();
    if (error && !data) {
      setLoadError(
        "Could not load reports. Run supabase/admin_access.sql in your Supabase SQL Editor, then refresh."
      );
      return;
    }
    const { data: profiles } = await fetchAdminProfiles();
    setStats({
      ...data,
      jobSeekers: profiles?.length
        ? filterJobSeekers(profiles).length
        : data.jobSeekers,
      employers: profiles?.length
        ? filterEmployers(profiles).length
        : data.employers,
    });
  }

  return (
    <DashboardLayout
      role="admin"
      title="Reports"
      subtitle="View platform reports and summaries."
    >
      <section className="dashboard-panel">
        <div className="panel-header">
          <div>
            <h2>Platform Summary</h2>
            <p>Overview of registered users and activity on SkillSync.</p>
          </div>
        </div>

        {loadError && <div className="profile-message">{loadError}</div>}

        {!stats && !loadError ? (
          <div className="empty-state">
            <span>↗</span>
            <h3>Loading reports...</h3>
          </div>
        ) : stats ? (
          <section className="overview-grid admin-overview-grid">
            <article className="overview-card">
              <span>👥</span>
              <div>
                <h3>{stats.jobSeekers}</h3>
                <p>Job Seekers</p>
              </div>
            </article>
            <article className="overview-card">
              <span>▤</span>
              <div>
                <h3>{stats.employers}</h3>
                <p>Employers</p>
              </div>
            </article>
            <article className="overview-card">
              <span>▣</span>
              <div>
                <h3>{stats.totalJobs}</h3>
                <p>Total Job Posts</p>
              </div>
            </article>
            <article className="overview-card">
              <span>◎</span>
              <div>
                <h3>{stats.openJobs}</h3>
                <p>Open Jobs</p>
              </div>
            </article>
            <article className="overview-card">
              <span>□</span>
              <div>
                <h3>{stats.closedJobs}</h3>
                <p>Closed Jobs</p>
              </div>
            </article>
            <article className="overview-card">
              <span>↗</span>
              <div>
                <h3>{stats.totalApplications}</h3>
                <p>Total Applications</p>
              </div>
            </article>
          </section>
        ) : null}
      </section>
    </DashboardLayout>
  );
}
