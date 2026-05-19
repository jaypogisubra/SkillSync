import { useEffect, useState } from "react";
import { getResumeViewUrl } from "../../services/api";

function getFileName(resume) {
  return resume?.file_name || resume?.name || "Resume";
}

function isPdfFile(resume) {
  const name = getFileName(resume).toLowerCase();
  const url = (resume?.file_url || "").toLowerCase();
  return name.endsWith(".pdf") || url.includes(".pdf");
}

function formatFileSize(size) {
  if (!size) return null;
  return `${(size / 1024 / 1024).toFixed(2)} MB`;
}

function formatDate(dateString) {
  if (!dateString) return null;
  return new Date(dateString).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

function parseSkills(raw) {
  if (!raw) return [];
  if (Array.isArray(raw)) return raw.filter(Boolean);
  if (typeof raw === "string") {
    return raw.split(",").map((s) => s.trim()).filter(Boolean);
  }
  return [];
}

export default function ResumeViewerModal({ applicant, onClose, onAccept, onReject }) {
  const [viewUrl, setViewUrl] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const resume = applicant?.resume;
  const profile = applicant?.profiles;
  const displayName =
    applicant?.displayName || profile?.full_name || "Unnamed Applicant";
  const job = applicant?.jobs;
  const skills = parseSkills(profile?.skills);
  const canPreviewPdf = resume?.file_url && isPdfFile(resume);

  useEffect(() => {
    let active = true;

    async function loadViewUrl() {
      if (!resume?.file_url) {
        setLoading(false);
        return;
      }

      setLoading(true);
      setError("");

      const { url, error: urlError } = await getResumeViewUrl(resume.file_url);
      if (!active) return;

      if (urlError || !url) {
        setError("Could not load resume preview. Try downloading the file instead.");
        setViewUrl(resume.file_url);
      } else {
        setViewUrl(url);
      }

      setLoading(false);
    }

    loadViewUrl();
    return () => {
      active = false;
    };
  }, [resume?.file_url]);

  useEffect(() => {
    function handleKeyDown(e) {
      if (e.key === "Escape") onClose();
    }
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", handleKeyDown);
    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [onClose]);

  if (!applicant) return null;

  return (
    <div className="resume-viewer-overlay" onClick={onClose} role="presentation">
      <div
        className="resume-viewer-modal"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label={`Resume for ${displayName}`}
      >
        <header className="resume-viewer-header">
          <div className="resume-viewer-header-main">
            <div className="resume-viewer-avatar">
              {(displayName || "A").charAt(0).toUpperCase()}
            </div>
            <div>
              <h2>{displayName}</h2>
              <p>
                Applied for <strong>{job?.title || "Unknown role"}</strong>
                {job?.location ? ` · ${job.location}` : ""}
              </p>
              {profile?.email && <small>{profile.email}</small>}
            </div>
          </div>

          <div className="resume-viewer-header-actions">
            {viewUrl && (
              <>
                <a
                  href={viewUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="resume-viewer-btn secondary"
                >
                  Open in tab
                </a>
                <a
                  href={viewUrl}
                  download={getFileName(resume)}
                  className="resume-viewer-btn secondary"
                >
                  Download
                </a>
              </>
            )}
            <button type="button" className="resume-viewer-close" onClick={onClose}>
              ×
            </button>
          </div>
        </header>

        <div className="resume-viewer-body">
          <aside className="resume-viewer-sidebar">
            <div className="resume-viewer-sidebar-section">
              <h3>Application</h3>
              <dl>
                <div>
                  <dt>Status</dt>
                  <dd>{applicant.status || "Applied"}</dd>
                </div>
                <div>
                  <dt>Job type</dt>
                  <dd>{job?.employment_type || "Not specified"}</dd>
                </div>
                {applicant.created_at && (
                  <div>
                    <dt>Applied on</dt>
                    <dd>{formatDate(applicant.created_at)}</dd>
                  </div>
                )}
              </dl>
            </div>

            {skills.length > 0 && (
              <div className="resume-viewer-sidebar-section">
                <h3>Skills</h3>
                <div className="resume-viewer-skills">
                  {skills.map((skill) => (
                    <span key={skill} className="resume-viewer-skill-tag">
                      {skill}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {resume?.file_url && (
              <div className="resume-viewer-sidebar-section">
                <h3>Resume file</h3>
                <p className="resume-viewer-file-meta">
                  <strong>{getFileName(resume)}</strong>
                  {formatFileSize(resume.file_size) && (
                    <> · {formatFileSize(resume.file_size)}</>
                  )}
                  {formatDate(resume.created_at) && (
                    <> · Uploaded {formatDate(resume.created_at)}</>
                  )}
                </p>
              </div>
            )}

            <div className="resume-viewer-sidebar-actions">
              <button
                type="button"
                className="resume-viewer-btn primary"
                onClick={() => onAccept?.(applicant.id)}
                disabled={applicant.status === "hired" || applicant.status === "rejected"}
              >
                Accept applicant
              </button>
              <button
                type="button"
                className="resume-viewer-btn danger"
                onClick={() => onReject?.(applicant.id)}
                disabled={applicant.status === "hired" || applicant.status === "rejected"}
              >
                Reject applicant
              </button>
            </div>
          </aside>

          <section className="resume-viewer-preview">
            {!resume?.file_url ? (
              <div className="resume-viewer-empty">
                <span>▤</span>
                <h3>No resume uploaded</h3>
                <p>This applicant has not uploaded a resume yet.</p>
              </div>
            ) : loading ? (
              <div className="resume-viewer-empty">
                <h3>Loading resume...</h3>
              </div>
            ) : canPreviewPdf ? (
              <>
                {error && <p className="resume-viewer-error">{error}</p>}
                <iframe
                  title={`Resume preview for ${profile?.full_name || "applicant"}`}
                  src={viewUrl}
                  className="resume-viewer-iframe"
                />
              </>
            ) : (
              <div className="resume-viewer-empty">
                <span>📄</span>
                <h3>{getFileName(resume)}</h3>
                <p>
                  Word document preview is not available in the browser.
                  Download or open the file to review this resume.
                </p>
                {viewUrl && (
                  <a
                    href={viewUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="resume-viewer-btn primary"
                  >
                    Open resume file
                  </a>
                )}
              </div>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}
