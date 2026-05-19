import { useEffect, useState } from "react";
import DashboardLayout from "../../components/layout/DashboardLayout";

const COMPANY_PROFILES_KEY = "skillsync_company_profiles";

export default function CompanyProfile() {
  const [isEditing, setIsEditing] = useState(false);
  const [message, setMessage] = useState("");

  const [company, setCompany] = useState({
    companyName: "",
    industry: "",
    companySize: "",
    location: "",
    website: "",
    contactEmail: "",
    contactNumber: "",
    about: "",
  });

  useEffect(() => {
    loadCompanyProfile();
  }, []);

  function getCurrentUser() {
    return JSON.parse(localStorage.getItem("skillsync_user")) || {};
  }

  function getAllCompanyProfiles() {
    return JSON.parse(localStorage.getItem(COMPANY_PROFILES_KEY)) || [];
  }

  function loadCompanyProfile() {
    const currentUser = getCurrentUser();
    const savedProfiles = getAllCompanyProfiles();

    const myProfile = savedProfiles.find(
      (profile) => profile.employerEmail === currentUser.email
    );

    if (myProfile) {
      setCompany({
        companyName: myProfile.companyName || "",
        industry: myProfile.industry || "",
        companySize: myProfile.companySize || "",
        location: myProfile.location || "",
        website: myProfile.website || "",
        contactEmail: myProfile.contactEmail || currentUser.email || "",
        contactNumber: myProfile.contactNumber || "",
        about: myProfile.about || "",
      });
      setIsEditing(false);
      return;
    }

    setCompany({
      companyName: "",
      industry: "",
      companySize: "",
      location: "",
      website: "",
      contactEmail: currentUser.email || "",
      contactNumber: "",
      about: "",
    });

    setIsEditing(true);
  }

  function handleChange(e) {
    const { name, value } = e.target;

    setCompany((prevCompany) => ({
      ...prevCompany,
      [name]: value,
    }));
  }

  function handleSubmit(e) {
    e.preventDefault();

    const currentUser = getCurrentUser();

    if (!currentUser.email) {
      setMessage("No employer account is logged in.");
      return;
    }

    if (!company.companyName.trim()) {
      setMessage("Please enter your company name.");
      return;
    }

    if (!company.industry.trim()) {
      setMessage("Please enter your company industry.");
      return;
    }

    if (!company.location.trim()) {
      setMessage("Please enter your company location.");
      return;
    }

    const savedProfiles = getAllCompanyProfiles();

    const profileData = {
      id: currentUser.email,
      employerEmail: currentUser.email,
      employerName:
        currentUser.name ||
        currentUser.fullName ||
        currentUser.email,
      companyName: company.companyName.trim(),
      industry: company.industry.trim(),
      companySize: company.companySize.trim(),
      location: company.location.trim(),
      website: company.website.trim(),
      contactEmail: company.contactEmail.trim() || currentUser.email,
      contactNumber: company.contactNumber.trim(),
      about: company.about.trim(),
      updatedAt: new Date().toISOString(),
    };

    const existingProfile = savedProfiles.find(
      (profile) => profile.employerEmail === currentUser.email
    );

    let updatedProfiles;

    if (existingProfile) {
      updatedProfiles = savedProfiles.map((profile) =>
        profile.employerEmail === currentUser.email
          ? {
              ...profile,
              ...profileData,
            }
          : profile
      );
    } else {
      updatedProfiles = [
        ...savedProfiles,
        {
          ...profileData,
          createdAt: new Date().toISOString(),
        },
      ];
    }

    localStorage.setItem(
      COMPANY_PROFILES_KEY,
      JSON.stringify(updatedProfiles)
    );

    setCompany(profileData);
    setIsEditing(false);
    setMessage("Company profile saved successfully.");
  }

  function handleEdit() {
    setMessage("");
    setIsEditing(true);
  }

  function handleCancel() {
    setMessage("");
    loadCompanyProfile();
  }

  const hasCompanyInfo =
    company.companyName ||
    company.industry ||
    company.companySize ||
    company.location ||
    company.website ||
    company.contactEmail ||
    company.contactNumber ||
    company.about;

  return (
    <DashboardLayout
      role="employer"
      title="Company"
      subtitle="Manage your company profile and hiring details."
    >
      <section className="dashboard-panel">
        <div className="panel-header company-panel-header">
          <div className="panel-header-content">
            <h2>Company Information</h2>
          </div>

          {!isEditing && hasCompanyInfo && (
            <button
              type="button"
              className="panel-action"
              onClick={handleEdit}
            >
              Edit Company
            </button>
          )}
        </div>

        {message && <div className="profile-message">{message}</div>}

        {!isEditing && !hasCompanyInfo ? (
          <div className="empty-state">
            <span>▤</span>
            <h3>No company information yet</h3>
            <p>
              Add your company details so job seekers can better understand your
              organization.
            </p>

            <button
              type="button"
              className="panel-action"
              onClick={() => setIsEditing(true)}
            >
              Add Company Info
            </button>
          </div>
        ) : (
          <form className="profile-form" onSubmit={handleSubmit}>
            <div className="profile-form-grid">
              <label>
                <span>Company Name</span>
                <input
                  type="text"
                  name="companyName"
                  placeholder="Enter Company Name"
                  value={company.companyName}
                  onChange={handleChange}
                  disabled={!isEditing}
                />
              </label>

              <label>
                <span>Industry</span>
                <input
                  type="text"
                  name="industry"
                  placeholder="Enter Company Industry"
                  value={company.industry}
                  onChange={handleChange}
                  disabled={!isEditing}
                />
              </label>

              <label>
                <span>Company Size</span>
                <input
                  type="text"
                  name="companySize"
                  placeholder="Enter Company Size"
                  value={company.companySize}
                  onChange={handleChange}
                  disabled={!isEditing}
                />
              </label>

              <label>
                <span>Company Location</span>
                <input
                  type="text"
                  name="location"
                  placeholder="Enter Company Location"
                  value={company.location}
                  onChange={handleChange}
                  disabled={!isEditing}
                />
              </label>

              <label>
                <span>Website</span>
                <input
                  type="text"
                  name="website"
                  placeholder="https://company.com"
                  value={company.website}
                  onChange={handleChange}
                  disabled={!isEditing}
                />
              </label>

              <label>
                <span>Contact Email</span>
                <input
                  type="email"
                  name="contactEmail"
                  placeholder="company@email.com"
                  value={company.contactEmail}
                  onChange={handleChange}
                  disabled={!isEditing}
                />
              </label>

              <label>
                <span>Contact Number</span>
                <input
                  type="text"
                  name="contactNumber"
                  placeholder="Enter Contact Number"
                  value={company.contactNumber}
                  onChange={handleChange}
                  disabled={!isEditing}
                />
              </label>
            </div>

            <label>
              <span>About the Company</span>
              <textarea
                className="dashboard-textarea"
                name="about"
                placeholder="Write a short description about your company."
                value={company.about}
                onChange={handleChange}
                disabled={!isEditing}
              />
            </label>

            {!isEditing && company.about && (
              <div className="company-preview-card">
                <span>Company Overview</span>
                <p>{company.about}</p>
              </div>
            )}

            {isEditing && (
              <div className="profile-actions">
                <button type="submit" className="profile-save-btn">
                  Save Company
                </button>

                <button
                  type="button"
                  className="profile-cancel-btn"
                  onClick={handleCancel}
                >
                  Cancel
                </button>
              </div>
            )}
          </form>
        )}
      </section>
    </DashboardLayout>
  );
}