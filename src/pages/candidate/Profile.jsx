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
  const [message, setMessage] = useState({ text: "", type: "success" });
  const [saving, setSaving] = useState(false);
  const [userId, setUserId] = useState(null);

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

  async function handleSubmit(e) {
    e.preventDefault();
    setSaving(true);
    setMessage({ text: "", type: "success" });

    // Password change validation
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

    // Save profile details
    const { error } = await supabase.from("profiles").upsert({
      id: userId,
      full_name: profile.fullName,
      email: profile.email,
      contact_number: profile.contactNumber,
      address: profile.address,
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
  }

  return (
    <DashboardLayout
      role="candidate"
      title="Profile"
      subtitle="Manage your personal details, skills, and preferences."
    >
      <section className="dashboard-panel">
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
            <button className="profile-save-btn" type="submit" disabled={saving}>
              {saving ? "Saving..." : "Save Changes"}
            </button>
          </div>
        </form>
      </section>
    </DashboardLayout>
  );
}