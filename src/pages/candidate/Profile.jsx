import "./Profile.css";
import { useEffect, useState } from "react";
import DashboardLayout from "../../components/layout/DashboardLayout";
import { supabase } from "../../services/supabase";
import { syncApplicantSnapshot } from "../../services/applicationService";
import {
  getCurrentUser,
  getCandidateProfileByUserId,
  saveCandidateProfile,
  setCurrentUser,
} from "../../services/localStorageService";

const defaultProfile = {
  fullName: "",
  email: "",
  contactNumber: "",
  address: "",
  currentPassword: "",
  newPassword: "",
  confirmPassword: "",
};

function parseSkills(raw) {
  if (!raw) return [];
  if (Array.isArray(raw)) return raw.filter(Boolean);
  if (typeof raw === "string" && raw.length > 0) {
    return raw.split(",").map((s) => s.trim()).filter(Boolean);
  }
  return [];
}

function profileFromRow(data, user) {
  return {
    ...defaultProfile,
    fullName: data.full_name || user?.user_metadata?.full_name || "",
    email: data.email || user?.email || "",
    contactNumber: data.contact_number || "",
    address: data.address || "",
  };
}

function profileFromCache(cached, user) {
  return {
    ...defaultProfile,
    fullName: cached.fullName || cached.full_name || user?.full_name || "",
    email: cached.email || user?.email || "",
    contactNumber: cached.contactNumber || cached.contact_number || "",
    address: cached.address || "",
  };
}

export default function Profile() {
  const [profile, setProfile] = useState(defaultProfile);
  const [skills, setSkills] = useState([]);
  const [skillInput, setSkillInput] = useState("");
  const [message, setMessage] = useState({ text: "", type: "success" });
  const [saving, setSaving] = useState(false);
  const [userId, setUserId] = useState(null);
  const [activeTab, setActiveTab] = useState("view");

  function applyProfileState(nextProfile, nextSkills) {
    setProfile(nextProfile);
    setSkills(nextSkills);
  }

  function cacheProfileLocally(id, nextProfile, nextSkills) {
    saveCandidateProfile(
      {
        id,
        fullName: nextProfile.fullName,
        full_name: nextProfile.fullName,
        email: nextProfile.email,
        contactNumber: nextProfile.contactNumber,
        contact_number: nextProfile.contactNumber,
        address: nextProfile.address,
        skills: nextSkills,
      },
      id
    );
  }

  async function persistProfileToServer(id, nextProfile, nextSkills) {
    const storedUser = getCurrentUser();
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user) return { error: new Error("No active session") };

    const payload = {
      id,
      full_name: nextProfile.fullName.trim(),
      email: nextProfile.email.trim() || session.user.email || storedUser?.email,
      contact_number: nextProfile.contactNumber.trim(),
      address: nextProfile.address.trim(),
      skills: nextSkills.join(","),
      role: storedUser?.role || session.user?.user_metadata?.role || "candidate",
    };

    let result = await supabase.from("profiles").upsert(payload);

    if (result.error?.message?.toLowerCase().includes("skills")) {
      const { skills: _skills, ...withoutSkills } = payload;
      result = await supabase.from("profiles").upsert(withoutSkills);
    }

    return result;
  }

  function updateStoredUserName(fullName) {
    const stored = getCurrentUser();
    if (!stored) return;
    setCurrentUser({
      ...stored,
      full_name: fullName,
      fullName,
      name: fullName,
    });
  }

  async function loadProfileForUser(user) {
    if (!user?.id) return;
    setUserId(user.id);

    const storedUser = getCurrentUser();
    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", user.id)
      .maybeSingle();

    if (data) {
      applyProfileState(profileFromRow(data, user), parseSkills(data.skills));
      cacheProfileLocally(user.id, profileFromRow(data, user), parseSkills(data.skills));
      return;
    }

    const cached = getCandidateProfileByUserId(user.id);
    if (cached) {
      applyProfileState(
        profileFromCache(cached, { ...user, ...storedUser }),
        parseSkills(cached.skills)
      );
      return;
    }

    applyProfileState(
      {
        ...defaultProfile,
        email: user.email || storedUser?.email || "",
        fullName: user.user_metadata?.full_name || storedUser?.full_name || "",
      },
      []
    );

    if (error) {
      console.warn("Could not load profile from database:", error.message);
    }
  }

  useEffect(() => {
    let active = true;

    async function init() {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user && active) {
        await loadProfileForUser(session.user);
      }
    }

    init();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event) => {
        if (!active) return;
        if (event === "SIGNED_OUT") {
          setProfile(defaultProfile);
          setSkills([]);
          setUserId(null);
          setSaving(false);
        }
      }
    );

    return () => {
      active = false;
      subscription.unsubscribe();
    };
  }, []);

  function handleChange(e) {
    const { name, value } = e.target;
    setProfile((prev) => ({ ...prev, [name]: value }));
  }

  async function handleAddSkill() {
    const trimmed = skillInput.trim();
    if (!trimmed) return;
    if (skills.includes(trimmed)) return;
    const nextSkills = [...skills, trimmed];
    setSkills(nextSkills);
    setSkillInput("");

    const activeId = userId || getCurrentUser()?.id;
    if (!activeId) return;

    setUserId(activeId);
    cacheProfileLocally(activeId, profile, nextSkills);

    const { error } = await persistProfileToServer(activeId, profile, nextSkills);
    if (!error) {
      updateStoredUserName(profile.fullName);
      syncApplicantSnapshot(activeId).catch(() => {});
    }
    if (error) {
      setMessage({
        text: "Skill added locally. Click Save Changes after signing in to sync to your account.",
        type: "error",
      });
    }
  }

  function handleSkillKeyDown(e) {
    if (e.key === "Enter") {
      e.preventDefault();
      handleAddSkill();
    }
  }

  async function handleRemoveSkill(skill) {
    const nextSkills = skills.filter((s) => s !== skill);
    setSkills(nextSkills);

    const activeId = userId || getCurrentUser()?.id;
    if (!activeId) return;

    cacheProfileLocally(activeId, profile, nextSkills);
    await persistProfileToServer(activeId, profile, nextSkills);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setSaving(true);
    setMessage({ text: "", type: "success" });

    try {
      const { data: { session } } = await supabase.auth.getSession();
      const storedUser = getCurrentUser();
      const activeUserId = session?.user?.id || userId || storedUser?.id;

      if (!activeUserId) {
        setMessage({
          text: "Your session expired. Please sign in again, then save your profile.",
          type: "error",
        });
        return;
      }

      setUserId(activeUserId);

      if (profile.newPassword || profile.confirmPassword) {
        if (!profile.currentPassword) {
          setMessage({
            text: "Please enter your current password before changing it.",
            type: "error",
          });
          return;
        }
        if (profile.newPassword !== profile.confirmPassword) {
          setMessage({
            text: "New password and confirm password do not match.",
            type: "error",
          });
          return;
        }
        if (profile.newPassword.length < 6) {
          setMessage({
            text: "New password must be at least 6 characters.",
            type: "error",
          });
          return;
        }
        const { error: pwError } = await supabase.auth.updateUser({
          password: profile.newPassword,
        });
        if (pwError) {
          setMessage({
            text: "Failed to update password: " + pwError.message,
            type: "error",
          });
          return;
        }
      }

      cacheProfileLocally(activeUserId, profile, skills);

      const { error } = await persistProfileToServer(activeUserId, profile, skills);

      if (error) {
        setMessage({
          text:
            "Could not sync to the server (" +
            error.message +
            "). Your changes were saved on this device.",
          type: "error",
        });
        return;
      }

      updateStoredUserName(profile.fullName.trim());
      syncApplicantSnapshot(activeUserId).catch(() => {});

      setProfile((prev) => ({
        ...prev,
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      }));

      setMessage({ text: "Profile updated successfully!", type: "success" });
      setActiveTab("view");
    } catch (err) {
      setMessage({
        text: err.message || "Something went wrong while saving. Please try again.",
        type: "error",
      });
    } finally {
      setSaving(false);
    }
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
                <p>
                  Add your skills one at a time. Press Enter or click Add, then click{" "}
                  <strong>Save Changes</strong> to keep them after refresh or logout.
                </p>
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
                  onClick={() => {
                    setSaving(false);
                    setActiveTab("view");
                  }}
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