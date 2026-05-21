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
  if (Array.isArray(raw)) return raw.filter(Boolean).map(s => s.trim().toLowerCase());
  if (typeof raw === "string") {
    return raw.split(",").map((s) => s.trim().toLowerCase()).filter(Boolean);
  }
  return [];
}

export default function ResumeViewerModal({ applicant, onClose, onAccept, onReject, onShortlist }) {
  const [viewUrl, setViewUrl] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const resume = applicant?.resume;
  const profile = applicant?.profiles;
  const displayName = applicant?.displayName || profile?.full_name || "Unnamed Applicant";
  const job = applicant?.jobs;
  
  // Skills extraction
  const candidateSkills = parseSkills(profile?.skills);
  const jobSkills = parseSkills(job?.required_skills);
  
  // Intersections
  const matchedSkills = jobSkills.filter(s => candidateSkills.includes(s));
  const missingSkills = jobSkills.filter(s => !candidateSkills.includes(s));
  const matchPct = jobSkills.length > 0 ? Math.round((matchedSkills.length / jobSkills.length) * 100) : 100;

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
    return () => { active = false; };
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
          <aside className="resume-viewer-sidebar" style={{ maxHeight: "calc(100vh - 120px)", overflowY: "auto" }}>
            <div className="resume-viewer-sidebar-section">
              <h3>Hiring Analysis</h3>
              <dl>
                <div>
                  <dt>Current Status</dt>
                  <dd style={{ textTransform: "capitalize", fontWeight: "bold" }}>{applicant.status || "Applied"}</dd>
                </div>
                <div>
                  <dt>Job Skill Fit</dt>
                  <dd style={{ color: matchPct >= 80 ? "#10b981" : matchPct >= 40 ? "#6d28d9" : "#d97706", fontWeight: "900" }}>
                    🧠 {matchPct}% Alignment
                  </dd>
                </div>
                {resume?.resume_score && (
                  <div>
                    <dt>Resume Score</dt>
                    <dd>⭐ {resume.resume_score} / 100</dd>
                  </div>
                )}
              </dl>
            </div>

            {/* Side-by-side Skill Matching Comparison Table */}
            {jobSkills.length > 0 && (
              <div className="resume-viewer-sidebar-section">
                <h3>Skill Alignment Details</h3>
                <div style={{ background: "#faf8ff", border: "1px solid #f1ebfa", borderRadius: "10px", padding: "10px" }}>
                  <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "12px" }}>
                    <thead>
                      <tr style={{ textAlign: "left", color: "#667085" }}>
                        <th style={{ paddingBottom: "6px" }}>Requirement</th>
                        <th style={{ paddingBottom: "6px" }}>Candidate Fit</th>
                      </tr>
                    </thead>
                    <tbody>
                      {matchedSkills.map(skill => (
                        <tr key={skill} style={{ borderTop: "1px solid #f1f5f9" }}>
                          <td style={{ padding: "6px 0", color: "#1e1b4b", textTransform: "capitalize" }}>{skill}</td>
                          <td style={{ padding: "6px 0", color: "#10b981", fontWeight: "bold" }}>✅ Match</td>
                        </tr>
                      ))}
                      {missingSkills.map(skill => (
                        <tr key={skill} style={{ borderTop: "1px solid #f1f5f9" }}>
                          <td style={{ padding: "6px 0", color: "#667085", textTransform: "capitalize" }}>{skill}</td>
                          <td style={{ padding: "6px 0", color: "#f59e0b", fontWeight: "bold" }}>⚠️ Missing</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
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

            {/* Sidebar quick update workflow */}
            <div className="resume-viewer-sidebar-actions" style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
              {onShortlist && (
                <button
                  type="button"
                  className="resume-viewer-btn secondary"
                  onClick={() => {
                    onShortlist(applicant.id);
                    onClose();
                  }}
                  disabled={applicant.status === "shortlisted" || applicant.status === "hired" || applicant.status === "rejected"}
                  style={{ width: "100%", justifyContent: "center" }}
                >
                  Shortlist Applicant
                </button>
              )}
              <button
                type="button"
                className="resume-viewer-btn primary"
                onClick={() => {
                  onAccept?.(applicant.id);
                  onClose();
                }}
                disabled={applicant.status === "hired" || applicant.status === "rejected"}
                style={{ width: "100%", justifyContent: "center" }}
              >
                Hire Applicant
              </button>
              <button
                type="button"
                className="resume-viewer-btn danger"
                onClick={() => {
                  onReject?.(applicant.id);
                  onClose();
                }}
                disabled={applicant.status === "hired" || applicant.status === "rejected"}
                style={{ width: "100%", justifyContent: "center", background: "#fef2f2" }}
              >
                Reject Applicant
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
