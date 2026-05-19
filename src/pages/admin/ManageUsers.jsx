import { useEffect, useState } from "react";
import DashboardLayout from "../../components/layout/DashboardLayout";
import { supabase } from "../../services/supabase";
import {
  fetchAdminProfiles,
  fetchAdminJobs,
  filterJobSeekers,
  filterEmployers,
  displayUserName,
} from "../../services/adminService";

export default function ManageUsers() {
  const [jobSeekers, setJobSeekers] = useState([]);
  const [employers, setEmployers] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [message, setMessage] = useState("");
  const [recommendForm, setRecommendForm] = useState({
    job_id: "", status: "shortlisted",
  });
  const [jobs, setJobs] = useState([]);
  const [loadError, setLoadError] = useState("");

  useEffect(() => {
    loadAccounts();
  }, []);

  async function loadAccounts() {
    setLoadError("");
    const { data: profiles, error } = await fetchAdminProfiles();
    const { data: jobsData } = await fetchAdminJobs();

    if (error && (!profiles || profiles.length === 0)) {
      setLoadError(
        "Could not load users. Run supabase/admin_access.sql in your Supabase SQL Editor, then refresh."
      );
    }

    setJobSeekers(filterJobSeekers(profiles));
    setEmployers(filterEmployers(profiles));
    setJobs((jobsData || []).filter((j) => j.status === "open"));
  }

  async function handleRemoveUser(userId) {
    if (!window.confirm("Are you sure you want to remove this job seeker?")) return;
    await supabase.from("profiles").delete().eq("id", userId);
    setJobSeekers((prev) => prev.filter((u) => u.id !== userId));
    if (selectedUser?.id === userId) setSelectedUser(null);
  }

  function handleViewDetails(user) {
    setSelectedUser(user);
    setMessage("");
    setRecommendForm({ job_id: "", status: "shortlisted" });
  }

  async function handleRecommendSubmit(e) {
    e.preventDefault();
    if (!selectedUser) return;
    if (!recommendForm.job_id) {
      setMessage("Please select a job before recommending.");
      return;
    }

    const { error } = await supabase.from("applications").upsert([{
      job_id: recommendForm.job_id,
      applicant_id: selectedUser.id,
      status: recommendForm.status,
    }]);

    if (error) {
      setMessage("Failed to recommend: " + error.message);
      return;
    }
    setMessage("Job seeker successfully recommended for the job!");
  }

  function formatDate(dateString) {
    if (!dateString) return "No date";
    return new Date(dateString).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" });
  }

  return (
    <DashboardLayout role="admin" title="Manage Users"
      subtitle="View and manage registered job seeker accounts.">
      <section className="dashboard-panel">
        <div className="panel-header users-panel-header">
          <div className="panel-header-content"><h2>Job Seeker Accounts</h2></div>
        </div>
        {loadError && <div className="profile-message">{loadError}</div>}

        {jobSeekers.length === 0 && !loadError ? (
          <div className="empty-state">
            <span>👥</span><h3>No job seekers yet</h3>
            <p>Registered job seeker accounts will appear here.</p>
          </div>
        ) : (
          <div className="admin-users-list">
            {jobSeekers.map((user) => (
              <article className="admin-user-card" key={user.id}>
                <div className="admin-user-main">
                  <div className="admin-user-avatar">
                    {(user.full_name || user.email || "J").charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <h3>{displayUserName(user)}</h3>
                    <p>{user.email || "No email"}</p>
                  </div>
                </div>
                <div className="admin-user-details-grid">
                  <div><span>Account Type</span><strong>Job Seeker</strong></div>
                  <div><span>Status</span><strong>Active</strong></div>
                  <div><span>Registered</span><strong>{formatDate(user.created_at)}</strong></div>
                </div>
                <div className="admin-user-actions">
                  <button type="button" className="job-status-btn" onClick={() => handleViewDetails(user)}>View Details</button>
                  <button type="button" className="job-delete-btn" onClick={() => handleRemoveUser(user.id)}>Remove</button>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>

      {selectedUser && (
        <section className="dashboard-panel admin-user-detail-panel">
          <div className="panel-header users-panel-header">
            <div className="panel-header-content"><h2>Job Seeker Details</h2></div>
            <button type="button" className="job-delete-btn" onClick={() => setSelectedUser(null)}>Close</button>
          </div>

          {message && <div className="profile-message">{message}</div>}

          <div className="admin-user-profile-card">
            <div className="admin-user-main">
              <div className="admin-user-avatar">
                {(selectedUser.full_name || selectedUser.email || "J").charAt(0).toUpperCase()}
              </div>
              <div>
                <h3>{displayUserName(selectedUser)}</h3>
                <p>{selectedUser.email || "No email"}</p>
              </div>
            </div>
            <div className="admin-user-details-grid">
              <div><span>Full Name</span><strong>{selectedUser.full_name || displayUserName(selectedUser)}</strong></div>
              <div><span>Email</span><strong>{selectedUser.email || "Not provided"}</strong></div>
              <div><span>Contact</span><strong>{selectedUser.contact_number || "Not provided"}</strong></div>
              <div><span>Address</span><strong>{selectedUser.address || "Not provided"}</strong></div>
              <div><span>Registered</span><strong>{formatDate(selectedUser.created_at)}</strong></div>
            </div>
          </div>

          <form className="profile-form recommend-form" onSubmit={handleRecommendSubmit}>
            <div>
              <h3>Recommend to Job</h3>
              <p>Select a job to recommend this job seeker for.</p>
            </div>
            <div className="profile-form-grid">
              <label><span>Select Job</span>
                <select name="job_id" value={recommendForm.job_id}
                  onChange={(e) => setRecommendForm((prev) => ({ ...prev, job_id: e.target.value }))} required>
                  <option value="">Choose a job</option>
                  {jobs.map((job) => (
                    <option key={job.id} value={job.id}>{job.title} — {job.location}</option>
                  ))}
                </select>
              </label>
              <label><span>Status</span>
                <select name="status" value={recommendForm.status}
                  onChange={(e) => setRecommendForm((prev) => ({ ...prev, status: e.target.value }))}>
                  <option value="shortlisted">Shortlisted</option>
                  <option value="interview">For Interview</option>
                  <option value="hired">Hired</option>
                </select>
              </label>
            </div>
            <div className="profile-actions">
              <button type="submit" className="profile-save-btn">Recommend to Job</button>
              <button type="button" className="profile-cancel-btn" onClick={() => setSelectedUser(null)}>Cancel</button>
            </div>
          </form>
        </section>
      )}
    </DashboardLayout>
  );
}