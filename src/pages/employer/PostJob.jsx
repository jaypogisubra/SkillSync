import { useState } from "react";
import { useNavigate } from "react-router-dom";
import DashboardLayout from "../../components/layout/DashboardLayout";
import { supabase } from "../../services/supabase";

export default function PostJob() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    title: "",
    employment_type: "Full-time",
    location: "",
    required_skills: "",
    description: "",
    salary_range: "",
    deadline: "",
  });
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState("info"); // "info" | "error"
  const [loading, setLoading] = useState(false);

  function handleChange(e) {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);
    setMessage("");

    // Validations
    if (!formData.title.trim()) {
      setMessage("Please enter a job title."); setMessageType("error"); setLoading(false); return;
    }
    if (!formData.location.trim()) {
      setMessage("Please enter a job location."); setMessageType("error"); setLoading(false); return;
    }
    if (!formData.description.trim()) {
      setMessage("Please provide a job description."); setMessageType("error"); setLoading(false); return;
    }
    if (formData.deadline) {
      const deadlineDate = new Date(formData.deadline);
      if (deadlineDate < new Date()) {
        setMessage("Application deadline must be a future date."); setMessageType("error"); setLoading(false); return;
      }
    }

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      setMessage("Please sign in first."); setMessageType("error"); setLoading(false); return;
    }

    const payload = {
      title: formData.title.trim(),
      employment_type: formData.employment_type,
      location: formData.location.trim(),
      required_skills: formData.required_skills.trim(),
      description: formData.description.trim(),
      status: "open",
      employer_id: user.id,
    };

    // Add optional fields if columns exist (graceful degradation)
    if (formData.salary_range.trim()) payload.salary_range = formData.salary_range.trim();
    if (formData.deadline) payload.deadline = formData.deadline;

    const { error } = await supabase.from("jobs").insert([payload]);

    if (error) {
      // If error is about missing column, retry without those fields
      if (error.message.includes("salary_range") || error.message.includes("deadline")) {
        delete payload.salary_range;
        delete payload.deadline;
        const { error: retryErr } = await supabase.from("jobs").insert([payload]);
        if (retryErr) {
          setMessage("Failed to post job: " + retryErr.message); setMessageType("error"); setLoading(false); return;
        }
      } else {
        setMessage("Failed to post job: " + error.message); setMessageType("error"); setLoading(false); return;
      }
    }

    setMessage("Job posted successfully! Redirecting…"); setMessageType("info");
    setLoading(false);
    setTimeout(() => navigate("/employer/jobs"), 800);
  }

  return (
    <DashboardLayout
      role="employer"
      title="Post a Job"
      subtitle="Create a new job listing to attract the right candidates."
    >
      <section className="dashboard-panel">
        <div className="panel-header">
          <div>
            <h2>New Job Posting</h2>
            <p>Fill in all the fields below to publish your listing to job seekers.</p>
          </div>
        </div>

        {message && (
          <div className={`profile-message ${messageType === "error" ? "error" : ""}`}>
            {message}
          </div>
        )}

        <form className="profile-form" onSubmit={handleSubmit}>
          <div className="profile-form-grid">
            {/* Job Title */}
            <label>
              <span>Job Title <span style={{ color: "#dc2626" }}>*</span></span>
              <input
                type="text"
                name="title"
                placeholder="e.g. Senior React Developer"
                value={formData.title}
                onChange={handleChange}
                required
              />
            </label>

            {/* Employment Type */}
            <label>
              <span>Employment Type</span>
              <select name="employment_type" value={formData.employment_type} onChange={handleChange}>
                <option value="Full-time">Full-time</option>
                <option value="Part-time">Part-time</option>
                <option value="Contract">Contract</option>
                <option value="Internship">Internship</option>
                <option value="Remote">Remote</option>
              </select>
            </label>

            {/* Location */}
            <label>
              <span>Location <span style={{ color: "#dc2626" }}>*</span></span>
              <input
                type="text"
                name="location"
                placeholder="e.g. Manila, Philippines or Remote"
                value={formData.location}
                onChange={handleChange}
                required
              />
            </label>

            {/* Salary Range */}
            <label>
              <span>Salary Range</span>
              <input
                type="text"
                name="salary_range"
                placeholder="e.g. ₱40,000 – ₱60,000/month"
                value={formData.salary_range}
                onChange={handleChange}
              />
            </label>

            {/* Required Skills */}
            <label>
              <span>Required Skills</span>
              <input
                type="text"
                name="required_skills"
                placeholder="e.g. React, Node.js, PostgreSQL (comma-separated)"
                value={formData.required_skills}
                onChange={handleChange}
              />
            </label>

            {/* Application Deadline */}
            <label>
              <span>Application Deadline</span>
              <input
                type="date"
                name="deadline"
                value={formData.deadline}
                onChange={handleChange}
                min={new Date().toISOString().split("T")[0]}
              />
            </label>
          </div>

          {/* Job Description */}
          <label style={{ marginTop: "8px" }}>
            <span>Job Description <span style={{ color: "#dc2626" }}>*</span></span>
            <textarea
              className="dashboard-textarea"
              name="description"
              placeholder="Describe the responsibilities, qualifications, and benefits of this role…"
              value={formData.description}
              onChange={handleChange}
              rows={6}
              required
            />
          </label>

          <div className="profile-actions" style={{ marginTop: "24px" }}>
            <button type="submit" className="profile-save-btn" disabled={loading}>
              {loading ? "Posting…" : "Publish Job Post"}
            </button>
            <button type="button" className="profile-cancel-btn" onClick={() => navigate("/employer/jobs")}>
              Cancel
            </button>
          </div>
        </form>
      </section>
    </DashboardLayout>
  );
}