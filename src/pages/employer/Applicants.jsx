import { useEffect, useState } from "react";
import DashboardLayout from "../../components/layout/DashboardLayout";
import ResumeViewerModal from "../../components/resume/ResumeViewerModal";
import { fetchEmployerApplicants } from "../../services/applicationService";
import { supabase } from "../../services/supabase";

function formatUploadDate(dateString) {
  if (!dateString) return "";
  return new Date(dateString).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

function getResumeFileName(resume) {
  return resume?.file_name || resume?.name || "Resume";
}

export default function Applicants() {
  const [applicants, setApplicants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedApplicant, setSelectedApplicant] = useState(null);

  useEffect(() => {
    loadApplicants();
  }, []);

  async function loadApplicants() {
    setLoading(true);
    const { data: { session } } = await supabase.auth.getSession();
    const user = session?.user;
    if (!user) {
      setLoading(false);
      return;
    }

    const { data, error } = await fetchEmployerApplicants(user.id);

    if (error) {
      console.warn("Failed to load applicants:", error.message);
    }

    setApplicants(data || []);
    setLoading(false);
  }

  async function updateStatus(appId, newStatus) {
    await supabase.from("applications").update({ status: newStatus }).eq("id", appId);
    setApplicants((prev) =>
      prev.map((a) => (a.id === appId ? { ...a, status: newStatus } : a))
    );
    setSelectedApplicant((prev) =>
      prev?.id === appId ? { ...prev, status: newStatus } : prev
    );
  }

  async function handleAccept(appId) {
    if (!window.confirm("Accept this applicant?")) return;
    await updateStatus(appId, "hired");
  }

  async function handleReject(appId) {
    if (!window.confirm("Reject this applicant?")) return;
    await updateStatus(appId, "rejected");
  }

  function openResumeViewer(app) {
    setSelectedApplicant(app);
  }

  function closeResumeViewer() {
    setSelectedApplicant(null);
  }

  return (
    <DashboardLayout
      role="employer"
      title="Applicants"
      subtitle="Review applicants and view their resumes."
    >
      <section className="dashboard-panel">
        <div className="panel-header applicants-panel-header">
          <div className="panel-header-content">
            <h2>Applicant List</h2>
            <p>Click View Resume to preview an applicant&apos;s file, similar to Indeed.</p>
          </div>
        </div>

        {loading ? (
          <div className="empty-state">
            <h3>Loading applicants...</h3>
          </div>
        ) : applicants.length === 0 ? (
          <div className="empty-state">
            <span>👥</span>
            <h3>No applicants yet</h3>
            <p>Applicants will appear here once job seekers apply to your jobs.</p>
          </div>
        ) : (
          <div className="applicants-list">
            {applicants.map((app) => (
              <article className="applicant-card" key={app.id}>
                <div className="applicant-main">
                  <div className="applicant-avatar">
                    {app.avatarLetter || "A"}
                  </div>
                  <div>
                    <h3>{app.displayName || app.profiles?.full_name || "Unnamed Applicant"}</h3>
                    <p>{app.displayEmail || app.profiles?.email || "No email"}</p>
                  </div>
                </div>

                <div className="applicant-details-grid">
                  <div>
                    <span>Applied Role</span>
                    <strong>{app.jobs?.title || "No role"}</strong>
                  </div>
                  <div>
                    <span>Job Type</span>
                    <strong>{app.jobs?.employment_type || "Not specified"}</strong>
                  </div>
                  <div>
                    <span>Location</span>
                    <strong>{app.jobs?.location || "No location"}</strong>
                  </div>
                  <div>
                    <span>Status</span>
                    <strong>{app.status || "Applied"}</strong>
                  </div>
                </div>

                <div className="applicant-resume-row">
                  {app.resume?.file_url ? (
                    <div className="applicant-resume-card">
                      <div className="applicant-resume-icon">▤</div>
                      <div className="applicant-resume-info">
                        <strong>{getResumeFileName(app.resume)}</strong>
                        <span>
                          Uploaded {formatUploadDate(app.resume.created_at) || "recently"}
                        </span>
                      </div>
                      <button
                        type="button"
                        className="applicant-view-resume-btn"
                        onClick={() => openResumeViewer(app)}
                      >
                        View Resume
                      </button>
                    </div>
                  ) : (
                    <div className="applicant-no-resume">
                      <span>▤</span>
                      <p>No resume uploaded yet</p>
                    </div>
                  )}
                </div>

                <div className="applicant-actions">
                  <button
                    type="button"
                    className="job-edit-btn"
                    onClick={() => handleAccept(app.id)}
                    disabled={app.status === "hired" || app.status === "rejected"}
                  >
                    Accept
                  </button>
                  <button
                    type="button"
                    className="job-delete-btn"
                    onClick={() => handleReject(app.id)}
                    disabled={app.status === "hired" || app.status === "rejected"}
                  >
                    Reject
                  </button>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>

      {selectedApplicant && (
        <ResumeViewerModal
          applicant={selectedApplicant}
          onClose={closeResumeViewer}
          onAccept={handleAccept}
          onReject={handleReject}
        />
      )}
    </DashboardLayout>
  );
}
