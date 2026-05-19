import { Link } from "react-router-dom";
import { useEffect, useState } from "react";
import DashboardLayout from "../../components/layout/DashboardLayout";
import { supabase } from "../../services/supabase";

export default function ManageJobs() {
  const [jobs, setJobs] = useState([]);
  const [editingJobId, setEditingJobId] = useState(null);
  const [userId, setUserId] = useState(null);
  const [editForm, setEditForm] = useState({
    title: "", employment_type: "Full Time",
    location: "", required_skills: "", description: "",
  });

  useEffect(() => { loadJobs(); }, []);

  async function loadJobs() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    setUserId(user.id);
    const { data } = await supabase.from("jobs").select("*")
      .eq("employer_id", user.id).order("created_at", { ascending: false });
    setJobs(data || []);
  }

  function handleEditJob(job) {
    setEditingJobId(job.id);
    setEditForm({
      title: job.title || "",
      employment_type: job.employment_type || "Full Time",
      location: job.location || "",
      required_skills: job.required_skills || "",
      description: job.description || "",
    });
  }

  function handleEditChange(e) {
    const { name, value } = e.target;
    setEditForm((prev) => ({ ...prev, [name]: value }));
  }

  async function handleSaveEdit(jobId) {
    const { error } = await supabase.from("jobs").update({
      title: editForm.title.trim(),
      employment_type: editForm.employment_type,
      location: editForm.location.trim(),
      required_skills: editForm.required_skills.trim(),
      description: editForm.description.trim(),
    }).eq("id", jobId).eq("employer_id", userId);

    if (!error) {
      setEditingJobId(null);
      loadJobs();
    }
  }

  async function handleToggleStatus(jobId, currentStatus) {
    const newStatus = currentStatus === "closed" ? "open" : "closed";
    await supabase.from("jobs").update({ status: newStatus })
      .eq("id", jobId).eq("employer_id", userId);
    loadJobs();
  }

  async function handleDeleteJob(jobId) {
    if (!window.confirm("Are you sure you want to delete this job post?")) return;
    await supabase.from("jobs").delete().eq("id", jobId).eq("employer_id", userId);
    setJobs((prev) => prev.filter((j) => j.id !== jobId));
  }

  return (
    <DashboardLayout role="employer" title="Manage Jobs"
      subtitle="Update and manage your company job posts.">
      <section className="dashboard-panel">
        <div className="panel-header jobs-panel-header">
          <div className="panel-header-content"><h2>Company Job Posts</h2></div>
          <Link to="/employer/post-job" className="panel-action">Post New Job</Link>
        </div>

        {jobs.length === 0 ? (
          <div className="empty-state">
            <span>▣</span>
            <h3>No job posts yet</h3>
            <p>Create a job post first, then it will appear here.</p>
            <Link to="/employer/post-job" className="panel-action">Add Job Post</Link>
          </div>
        ) : (
          <div className="jobs-manage-list">
            {jobs.map((job) => (
              <article className="job-manage-card" key={job.id}>
                {editingJobId === job.id ? (
                  <div className="profile-form">
                    <div className="profile-form-grid">
                      <label><span>Job Title</span>
                        <input type="text" name="title" value={editForm.title} onChange={handleEditChange}/>
                      </label>
                      <label><span>Job Type</span>
                        <select name="employment_type" value={editForm.employment_type} onChange={handleEditChange}>
                          <option value="Full Time">Full Time</option>
                          <option value="Part Time">Part Time</option>
                          <option value="Contract">Contract</option>
                          <option value="Internship">Internship</option>
                        </select>
                      </label>
                      <label><span>Location</span>
                        <input type="text" name="location" value={editForm.location} onChange={handleEditChange}/>
                      </label>
                      <label><span>Required Skills</span>
                        <input type="text" name="required_skills" value={editForm.required_skills} onChange={handleEditChange}/>
                      </label>
                    </div>
                    <label><span>Job Description</span>
                      <textarea className="dashboard-textarea" name="description" value={editForm.description} onChange={handleEditChange}/>
                    </label>
                    <div className="job-actions">
                      <button type="button" className="job-edit-btn" onClick={() => handleSaveEdit(job.id)}>Save Changes</button>
                      <button type="button" className="job-status-btn" onClick={() => setEditingJobId(null)}>Cancel</button>
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="job-manage-top">
                      <div className="job-manage-info">
                        <h3>{job.title || "Untitled Job"}</h3>
                        <div className="job-meta">
                          <span>{job.employment_type || "Not specified"}</span>
                          <span>{job.location || "No location"}</span>
                          <span>{job.required_skills || "No skills listed"}</span>
                        </div>
                      </div>
                      <span className={`job-status-badge ${job.status === "closed" ? "closed" : "open"}`}>
                        {job.status || "open"}
                      </span>
                    </div>
                    <p className="job-description">{job.description || "No description provided."}</p>
                    <div className="job-actions">
                      <button type="button" className="job-edit-btn" onClick={() => handleEditJob(job)}>Edit</button>
                      <button type="button" className="job-status-btn" onClick={() => handleToggleStatus(job.id, job.status)}>
                        {job.status === "closed" ? "Mark Open" : "Mark Closed"}
                      </button>
                      <button type="button" className="job-delete-btn" onClick={() => handleDeleteJob(job.id)}>Delete</button>
                    </div>
                  </>
                )}
              </article>
            ))}
          </div>
        )}
      </section>
    </DashboardLayout>
  );
}