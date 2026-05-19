import "./Profile.css";
import { useEffect, useState } from "react";
import DashboardLayout from "../../components/layout/DashboardLayout";
import { supabase } from "../../services/supabase";

const defaultProfile = {
  fullName: "",
  email: "",
  contactNumber: "",
  address: "",
  currentPassword: "",
  newPassword: "",
  confirmPassword: "",
};

export default function Profile() {
  const [profile, setProfile] = useState(defaultProfile);
  const [skills, setSkills] = useState([]);
  const [skillInput, setSkillInput] = useState("");
  const [message, setMessage] = useState({ text: "", type: "success" });
  const [saving, setSaving] = useState(false);
  const [userId, setUserId] = useState(null);
  const [activeTab, setActiveTab] = useState("view");

  useEffect(() => {
    loadProfile();
  }, []);

  async function loadProfile() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    setUserId(user.id);

    const { data } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", user.id)
      .single();

    if (data) {
      setProfile({
        ...defaultProfile,
        fullName: data.full_name || "",
        email: data.email || user.email || "",
        contactNumber: data.contact_number || "",
        address: data.address || "",
      });
      // Load skills — stored as array or comma string
      if (data.skills) {
        if (Array.isArray(data.skills)) {
          setSkills(data.skills);
        } else if (typeof data.skills === "string" && data.skills.length > 0) {
          setSkills(data.skills.split(",").map((s) => s.trim()).filter(Boolean));
        }
      }
    } else {
      setProfile({
        ...defaultProfile,
        email: user.email || "",
        fullName: user.user_metadata?.full_name || "",
      });
    }
  }

  function handleChange(e) {
    const { name, value } = e.target;
    setProfile((prev) => ({ ...prev, [name]: value }));
  }

  function handleAddSkill() {
    const trimmed = skillInput.trim();
    if (!trimmed) return;
    if (skills.includes(trimmed)) return;
    setSkills((prev) => [...prev, trimmed]);
    setSkillInput("");
  }

  function handleSkillKeyDown(e) {
    if (e.key === "Enter") {
      e.preventDefault();
      handleAddSkill();
    }
  }

  function handleRemoveSkill(skill) {
    setSkills((prev) => prev.filter((s) => s !== skill));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setSaving(true);
    setMessage({ text: "", type: "success" });

    if (profile.newPassword || profile.confirmPassword) {
      if (!profile.currentPassword) {
        setMessage({ text: "Please enter your current password before changing it.", type: "error" });
        setSaving(false);
        return;
      }
      if (profile.newPassword !== profile.confirmPassword) {
        setMessage({ text: "New password and confirm password do not match.", type: "error" });
        setSaving(false);
        return;
      }
      if (profile.newPassword.length < 6) {
        setMessage({ text: "New password must be at least 6 characters.", type: "error" });
        setSaving(false);
        return;
      }
      const { error: pwError } = await supabase.auth.updateUser({
        password: profile.newPassword,
      });
      if (pwError) {
        setMessage({ text: "Failed to update password: " + pwError.message, type: "error" });
        setSaving(false);
        return;
      }
    }

    const { error } = await supabase.from("profiles").upsert({
      id: userId,
      full_name: profile.fullName,
      email: profile.email,
      contact_number: profile.contactNumber,
      address: profile.address,
      skills: skills.join(","),
    });

    if (error) {
      setMessage({ text: "Failed to save profile: " + error.message, type: "error" });
      setSaving(false);
      return;
    }

    setProfile((prev) => ({
      ...prev,
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
    }));

    setSaving(false);
    setMessage({ text: "Profile updated successfully!", type: "success" });
    setActiveTab("view");
  }

  return (
    <DashboardLayout
      role="candidate"
      title="Profile"
      subtitle="Manage your personal details, skills, and preferences."
    >
      <section className="dashboard-panel">

        {/* Tab Buttons */}
        <div className="profile-tabs">
          <button
            className={`profile-tab-btn ${activeTab === "view" ? "active" : ""}`}
            onClick={() => setActiveTab("view")}
          >
            View Profile
          </button>
          <button
            className={`profile-tab-btn ${activeTab === "edit" ? "active" : ""}`}
            onClick={() => setActiveTab("edit")}
          >
            Edit Profile
          </button>
        </div>

        {/* ── VIEW PROFILE ── */}
        {activeTab === "view" && (
          <div className="profile-view">
            <div className="panel-header">
              <div className="panel-header-content">
                <h2>Profile Information</h2>
                <p>Your saved profile details are shown below.</p>
              </div>
            </div>

            {message.text && (
              <div className="profile-message">{message.text}</div>
            )}

            <div className="profile-view-grid">
              <div className="profile-view-field">
                <span className="profile-view-label">Full Name</span>
                <span className="profile-view-value">
                  {profile.fullName || <em>Not provided</em>}
                </span>
              </div>
              <div className="profile-view-field">
                <span className="profile-view-label">Email Address</span>
                <span className="profile-view-value">
                  {profile.email || <em>Not provided</em>}
                </span>
              </div>
              <div className="profile-view-field">
                <span className="profile-view-label">Contact Number</span>
                <span className="profile-view-value">
                  {profile.contactNumber || <em>Not provided</em>}
                </span>
              </div>
              <div className="profile-view-field">
                <span className="profile-view-label">Address</span>
                <span className="profile-view-value">
                  {profile.address || <em>Not provided</em>}
                </span>
              </div>
            </div>

            {/* Skills View */}
            <div className="profile-view-section">
              <span className="profile-view-label">Skills</span>
              {skills.length > 0 ? (
                <div className="profile-skills-display">
                  {skills.map((skill) => (
                    <span key={skill} className="profile-skill-tag">{skill}</span>
                  ))}
                </div>
              ) : (
                <span className="profile-view-value"><em>No skills added yet</em></span>
              )}
            </div>
          </div>
        )}

        {/* ── EDIT PROFILE ── */}
        {activeTab === "edit" && (
          <>
            <div className="panel-header">
              <div className="panel-header-content">
                <h2>Profile Information</h2>
                <p>Edit your details below and click Save Changes when done.</p>
              </div>
            </div>

            {message.text && (
              <div
                className="profile-message"
                style={
                  message.type === "error"
                    ? { background: "#fff1f2", color: "#e11d48", borderColor: "#fecdd3" }
                    : {}
                }
              >
                {message.text}
              </div>
            )}

            <form className="profile-form" onSubmit={handleSubmit}>
              <div className="profile-form-grid">
                <label>
                  <span>Full Name</span>
                  <input
                    name="fullName"
                    type="text"
                    value={profile.fullName}
                    onChange={handleChange}
                    placeholder="Enter your full name"
                  />
                </label>

                <label>
                  <span>Email Address</span>
                  <input
                    name="email"
                    type="email"
                    value={profile.email}
                    placeholder="you@example.com"
                    disabled
                    title="Email cannot be changed"
                  />
                </label>

                <label>
                  <span>Contact Number</span>
                  <input
                    name="contactNumber"
                    type="tel"
                    value={profile.contactNumber}
                    onChange={handleChange}
                    placeholder="Enter your contact number"
                  />
                </label>

                <label>
                  <span>Address</span>
                  <input
                    name="address"
                    type="text"
                    value={profile.address}
                    onChange={handleChange}
                    placeholder="Enter your address"
                  />
                </label>
              </div>

              {/* Skills Input */}
              <div className="profile-skills-section">
                <h3>Skills</h3>
                <p>Add your skills one at a time. Press Enter or click Add.</p>
                <div className="profile-skills-input-row">
                  <input
                    type="text"
                    value={skillInput}
                    onChange={(e) => setSkillInput(e.target.value)}
                    onKeyDown={handleSkillKeyDown}
                    placeholder="e.g. JavaScript, Communication..."
                    className="profile-skill-input"
                  />
                  <button
                    type="button"
                    className="profile-skill-add-btn"
                    onClick={handleAddSkill}
                  >
                    Add
                  </button>
                </div>
                {skills.length > 0 && (
                  <div className="profile-skills-display">
                    {skills.map((skill) => (
                      <span key={skill} className="profile-skill-tag editable">
                        {skill}
                        <button
                          type="button"
                          className="profile-skill-remove"
                          onClick={() => handleRemoveSkill(skill)}
                        >
                          ×
                        </button>
                      </span>
                    ))}
                  </div>
                )}
              </div>

              <div className="profile-password-section">
                <div>
                  <h3>Password Settings</h3>
                  <p>Leave these fields blank if you do not want to change your password.</p>
                </div>

                <div className="profile-form-grid">
                  <label>
                    <span>Current Password</span>
                    <input
                      name="currentPassword"
                      type="password"
                      value={profile.currentPassword}
                      onChange={handleChange}
                      placeholder="Enter current password"
                    />
                  </label>

                  <label>
                    <span>New Password</span>
                    <input
                      name="newPassword"
                      type="password"
                      value={profile.newPassword}
                      onChange={handleChange}
                      placeholder="Enter new password"
                    />
                  </label>

                  <label>
                    <span>Confirm New Password</span>
                    <input
                      name="confirmPassword"
                      type="password"
                      value={profile.confirmPassword}
                      onChange={handleChange}
                      placeholder="Confirm new password"
                    />
                  </label>
                </div>
              </div>

              <div className="profile-actions">
                <button
                  className="profile-save-btn"
                  type="submit"
                  disabled={saving}
                >
                  {saving ? "Saving..." : "Save Changes"}
                </button>
                <button
                  className="profile-cancel-btn"
                  type="button"
                  onClick={() => setActiveTab("view")}
                >
                  Cancel
                </button>
              </div>
            </form>
          </>
        )}

      </section>
    </DashboardLayout>
  );
}