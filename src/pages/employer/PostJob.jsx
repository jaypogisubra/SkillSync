import { useState } from "react";
import { useNavigate } from "react-router-dom";
import DashboardLayout from "../../components/layout/DashboardLayout";
import { supabase } from "../../services/supabase";

export default function PostJob() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    title: "", employment_type: "Full Time",
    location: "", required_skills: "", description: "",
  });
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  function handleChange(e) {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);
    setMessage("");

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setMessage("Please sign in first."); setLoading(false); return; }

    if (!formData.title.trim()) { setMessage("Please enter a job title."); setLoading(false); return; }
    if (!formData.location.trim()) { setMessage("Please enter a job location."); setLoading(false); return; }
    if (!formData.description.trim()) { setMessage("Please enter a job description."); setLoading(false); return; }

    const { error } = await supabase.from("jobs").insert([{
      title: formData.title.trim(),
      employment_type: formData.employment_type,
      location: formData.location.trim(),
      required_skills: formData.required_skills.trim(),
      description: formData.description.trim(),
      status: "open",
      employer_id: user.id,
    }]);

    if (error) {
      setMessage("Failed to post job: " + error.message);
      setLoading(false);
      return;
    }

    setMessage("Job post created successfully!");
    setLoading(false);
    setTimeout(() => navigate("/employer/jobs"), 600);
  }

  return (
    <DashboardLayout role="employer" title="Post Job"
      subtitle="Create a new job opportunity for job seekers.">
      <section className="dashboard-panel">
        <div className="panel-header jobs-panel-header">
          <div className="panel-header-content"><h2>Job Information</h2></div>
        </div>
        {message && <div className="profile-message">{message}</div>}
        <form className="profile-form" onSubmit={handleSubmit}>
          <div className="profile-form-grid">
            <label><span>Job Title</span>
              <input type="text" name="title" placeholder="Enter Job Title"
                value={formData.title} onChange={handleChange} required/>
            </label>
            <label><span>Job Type</span>
              <select name="employment_type" value={formData.employment_type} onChange={handleChange}>
                <option value="Full Time">Full Time</option>
                <option value="Part Time">Part Time</option>
                <option value="Contract">Contract</option>
                <option value="Internship">Internship</option>
              </select>
            </label>
            <label><span>Location</span>
              <input type="text" name="location" placeholder="Enter Job Location"
                value={formData.location} onChange={handleChange} required/>
            </label>
            <label><span>Required Skills</span>
              <input type="text" name="required_skills" placeholder="e.g. React, Node.js, SQL"
                value={formData.required_skills} onChange={handleChange}/>
            </label>
          </div>
          <label><span>Job Description</span>
            <textarea className="dashboard-textarea" name="description"
              placeholder="Describe the job responsibilities and requirements."
              value={formData.description} onChange={handleChange} required/>
          </label>
          <div className="profile-actions">
            <button type="submit" className="profile-save-btn" disabled={loading}>
              {loading ? "Posting..." : "Post Job"}
            </button>
            <button type="button" className="profile-cancel-btn"
              onClick={() => navigate("/employer/jobs")}>Cancel</button>
          </div>
        </form>
      </section>
    </DashboardLayout>
  );
}