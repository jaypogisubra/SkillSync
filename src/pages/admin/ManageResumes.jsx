import { useEffect, useState } from "react";
import DashboardLayout from "../../components/layout/DashboardLayout";
import { supabase } from "../../services/supabase";
import { fetchAdminResumes, deleteResume, displayUserName } from "../../services/adminService";
import { getResumeViewUrl } from "../../services/api";
import ResumeViewerModal from "../../components/resume/ResumeViewerModal";

export default function ManageResumes() {
  const [resumes, setResumes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [fileTypeFilter, setFileTypeFilter] = useState("all");
  const [previewApplicant, setPreviewApplicant] = useState(null);
  const [toast, setToast] = useState({ text: "", type: "success" });
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    loadResumes();
  }, []);

  async function loadResumes() {
    setLoading(true);
    setLoadError("");
    try {
      const { data, error } = await fetchAdminResumes();
      if (error) {
        setLoadError("Could not retrieve resumes from Supabase storage and database.");
        return;
      }
      setResumes(data || []);
    } catch (err) {
      console.error(err);
      setLoadError("Failed to synchronize with Supabase tables.");
    } finally {
      setLoading(false);
    }
  }

  function showToast(text, type = "success") {
    setToast({ text, type });
    setTimeout(() => setToast({ text: "", type: "success" }), 4000);
  }

  function formatFileSize(size) {
    if (!size) return "0.00 KB";
    if (size < 1024 * 1024) {
      return `${(size / 1024).toFixed(1)} KB`;
    }
    return `${(size / 1024 / 1024).toFixed(2)} MB`;
  }

  function formatDate(dateString) {
    if (!dateString) return "No date";
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  }

  function extractResumeStoragePath(fileUrl) {
    if (!fileUrl) return null;

    const markers = [
      '/storage/v1/object/public/resumes/',
      '/storage/v1/object/sign/resumes/',
      '/storage/v1/object/authenticated/resumes/',
    ];

    for (const marker of markers) {
      const index = fileUrl.indexOf(marker);
      if (index !== -1) {
        return decodeURIComponent(fileUrl.slice(index + marker.length).split('?')[0]);
      }
    }

    const fallback = fileUrl.indexOf('/resumes/');
    if (fallback !== -1) {
      return decodeURIComponent(fileUrl.slice(fallback + '/resumes/'.length).split('?')[0]);
    }

    return null;
  }

  // Preview Resume handler
  function handlePreview(resume) {
    // Structure applicant exactly as ResumeViewerModal expects
    const appObject = {
      resume: {
        file_url: resume.file_url,
        file_name: resume.file_name,
        file_size: resume.file_size,
        created_at: resume.created_at,
      },
      profiles: {
        full_name: resume.applicant_name,
        email: resume.applicant_email,
        skills: "",
      },
      displayName: resume.applicant_name || resume.applicant_email || "Unnamed Candidate",
      jobs: {
        title: "Resume Vault Review",
        location: "System Storage",
        employment_type: "Full-time",
      },
      status: "Verified",
    };
    setPreviewApplicant(appObject);
  }

  // Sign URL & Download handler
  async function handleDownload(resume) {
    if (!resume.file_url) {
      showToast("No storage URL associated with this resume.", "error");
      return;
    }
    try {
      const { url, error } = await getResumeViewUrl(resume.file_url);
      if (error || !url) {
        showToast("Failed to retrieve signed download URL.", "error");
        return;
      }
      
      // Open signed url in a new tab to let browser handle view/download
      window.open(url, "_blank");
      showToast("Download session generated successfully.");
    } catch (err) {
      console.error(err);
      showToast("An unexpected error occurred during download initialization.", "error");
    }
  }

  // Delete Resume handler
  async function handleDelete(resume) {
    const confirmDelete = window.confirm(
      `Are you sure you want to permanently delete the resume "${resume.file_name || "Resume"}"?\n\nThis will remove the file from Supabase Storage and remove the resume association from the candidate's account. This cannot be undone.`
    );
    if (!confirmDelete) return;

    setActionLoading(true);
    try {
      // 1. Delete from storage bucket if possible
      const storagePath = extractResumeStoragePath(resume.file_url);
      if (storagePath) {
        const { error: storageError } = await supabase.storage
          .from("resumes")
          .remove([storagePath]);
        
        if (storageError) {
          console.warn("Storage deletion warning (might already be deleted):", storageError.message);
        }
      }

      // 2. Delete from DB using our RPC
      const { error: dbError } = await deleteResume(resume.applicant_id);
      if (dbError) {
        showToast(`Failed to delete resume: ${dbError.message}`, "error");
        return;
      }

      // 3. Update local state
      setResumes((prev) => prev.filter((r) => r.applicant_id !== resume.applicant_id));
      showToast("Resume document and storage block successfully removed.");
    } catch (err) {
      console.error(err);
      showToast("An unexpected error occurred during resume cleanup.", "error");
    } finally {
      setActionLoading(false);
    }
  }

  // Filter & Search logic
  const filteredResumes = resumes.filter((resume) => {
    const filename = (resume.file_name || "").toLowerCase();
    const applicantName = (resume.applicant_name || "").toLowerCase();
    const applicantEmail = (resume.applicant_email || "").toLowerCase();
    const query = searchQuery.toLowerCase();

    const matchesSearch =
      filename.includes(query) ||
      applicantName.includes(query) ||
      applicantEmail.includes(query);

    const isPdf = filename.endsWith(".pdf");
    let matchesType = true;
    if (fileTypeFilter === "pdf") {
      matchesType = isPdf;
    } else if (fileTypeFilter === "word") {
      matchesType = !isPdf;
    }

    return matchesSearch && matchesType;
  });

  // Calculate storage quota metadata
  const totalFiles = resumes.length;
  const pdfFilesCount = resumes.filter((r) => (r.file_name || "").toLowerCase().endsWith(".pdf")).length;
  const wordFilesCount = totalFiles - pdfFilesCount;
  const totalStorageBytes = resumes.reduce((acc, curr) => acc + (Number(curr.file_size) || 0), 0);

  return (
    <DashboardLayout
      role="admin"
      title="Resume Vault"
      subtitle="Monitor resume files uploaded across the system, preview text models, and clear storage paths."
    >
      {/* Toast Alert */}
      {toast.text && (
        <div style={{
          position: "fixed",
          top: "20px",
          right: "20px",
          zIndex: 1000,
          background: toast.type === "error" ? "#fff1f2" : "#e9fbef",
          color: toast.type === "error" ? "#e11d48" : "#15803d",
          border: `1px solid ${toast.type === "error" ? "#fecdd3" : "#a7f3d0"}`,
          borderRadius: "12px",
          padding: "12px 24px",
          fontWeight: "900",
          boxShadow: "0 10px 30px rgba(0,0,0,0.08)",
          display: "flex",
          alignItems: "center",
          gap: "8px"
        }}>
          <span>{toast.type === "error" ? "⚠️" : "✓"}</span> {toast.text}
        </div>
      )}

      {/* METRIC CARDS */}
      <section className="overview-grid" style={{ marginBottom: "22px", gridTemplateColumns: "repeat(4, 1fr)" }}>
        <article className="overview-card" style={{ borderLeft: "4px solid #58158f" }}>
          <span>📁</span>
          <div>
            <h3>{totalFiles}</h3>
            <p>Total Resumes</p>
          </div>
        </article>
        <article className="overview-card" style={{ borderLeft: "4px solid #06b6d4" }}>
          <span>💾</span>
          <div>
            <h3>{formatFileSize(totalStorageBytes)}</h3>
            <p>Storage Used</p>
          </div>
        </article>
        <article className="overview-card" style={{ borderLeft: "4px solid #10b981" }}>
          <span>📄</span>
          <div>
            <h3>{pdfFilesCount}</h3>
            <p>PDF Documents</p>
          </div>
        </article>
        <article className="overview-card" style={{ borderLeft: "4px solid #f59e0b" }}>
          <span>📝</span>
          <div>
            <h3>{wordFilesCount}</h3>
            <p>Word / Text Files</p>
          </div>
        </article>
      </section>

      {/* MAIN VAULT PANEL */}
      <section className="dashboard-panel">
        <div className="panel-header" style={{ borderBottom: "none", marginBottom: "8px" }}>
          <div className="panel-header-content">
            <h2>Document Storage Directory ({filteredResumes.length})</h2>
            <p>Review files directly in browser using native rendering, download attachments, or release database allocations.</p>
          </div>
        </div>

        {/* SEARCH AND FILTERS */}
        <div style={{
          display: "grid",
          gridTemplateColumns: "3fr 1fr",
          gap: "12px",
          background: "#f9fafb",
          padding: "12px",
          borderRadius: "18px",
          border: "1px solid #f2f4f7",
          marginBottom: "20px"
        }}>
          <input
            type="text"
            placeholder="Search by file name, applicant name, or email..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{
              height: "44px",
              padding: "0 14px",
              fontSize: "14px",
              border: "1px solid #d0d5dd",
              borderRadius: "10px",
              outline: "none"
            }}
          />
          <select
            value={fileTypeFilter}
            onChange={(e) => setFileTypeFilter(e.target.value)}
            style={{
              height: "44px",
              padding: "0 10px",
              fontSize: "14px",
              border: "1px solid #d0d5dd",
              borderRadius: "10px",
              outline: "none"
            }}
          >
            <option value="all">All File Types</option>
            <option value="pdf">PDF files (.pdf)</option>
            <option value="word">Word/Others (.docx, .txt)</option>
          </select>
        </div>

        {loadError && (
          <div className="profile-message" style={{ background: "#fff1f2", color: "#e11d48", borderColor: "#fecdd3", marginBottom: "20px" }}>
            {loadError}
          </div>
        )}

        {loading ? (
          <div style={{ textAlign: "center", padding: "80px 0", fontSize: "16px", color: "#667085" }}>
            Synchronizing document structures with Supabase storage...
          </div>
        ) : filteredResumes.length === 0 ? (
          <div className="empty-state">
            <span>📁</span>
            <h3>No resumes found</h3>
            <p>No document meets the specified query constraints.</p>
          </div>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table style={{
              width: "100%",
              borderCollapse: "separate",
              borderSpacing: "0 8px",
              minWidth: "800px"
            }}>
              <thead>
                <tr style={{ color: "#667085", fontSize: "13px", fontWeight: "800", textAlign: "left" }}>
                  <th style={{ padding: "12px 16px" }}>File Name & Type</th>
                  <th style={{ padding: "12px 16px" }}>Associated Candidate</th>
                  <th style={{ padding: "12px 16px" }}>Upload Date</th>
                  <th style={{ padding: "12px 16px" }}>File Size</th>
                  <th style={{ padding: "12px 16px", textAlign: "right" }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredResumes.map((resume) => {
                  const isPdf = (resume.file_name || "").toLowerCase().endsWith(".pdf");
                  return (
                    <tr key={resume.applicant_id} className="resume-vault-row" style={{
                      background: "#ffffff",
                      border: "1px solid #e7e2f2",
                      borderRadius: "16px",
                      boxShadow: "0 2px 4px rgba(0,0,0,0.01)",
                      transition: "0.2s"
                    }}>
                      <td style={{
                        padding: "16px",
                        borderTopLeftRadius: "16px",
                        borderBottomLeftRadius: "16px",
                        borderTop: "1px solid #e7e2f2",
                        borderBottom: "1px solid #e7e2f2",
                        borderLeft: "1px solid #e7e2f2"
                      }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                          <div style={{
                            width: "40px",
                            height: "40px",
                            borderRadius: "10px",
                            background: isPdf ? "#fff1f2" : "#eff6ff",
                            display: "grid",
                            placeItems: "center",
                            fontSize: "20px",
                            color: isPdf ? "#ef4444" : "#3b82f6",
                            fontWeight: "bold"
                          }}>
                            {isPdf ? "PDF" : "W"}
                          </div>
                          <div>
                            <strong style={{
                              display: "block",
                              fontSize: "14px",
                              color: "#101828",
                              maxWidth: "260px",
                              overflow: "hidden",
                              textOverflow: "ellipsis",
                              whiteSpace: "nowrap"
                            }}>
                              {resume.file_name || "Resume Document"}
                            </strong>
                            <small style={{ color: "#98a2b3", fontSize: "11px" }}>
                              {isPdf ? "Acrobat Portable Document" : "Word Processing Text"}
                            </small>
                          </div>
                        </div>
                      </td>
                      <td style={{
                        padding: "16px",
                        borderTop: "1px solid #e7e2f2",
                        borderBottom: "1px solid #e7e2f2"
                      }}>
                        <div>
                          <strong style={{ display: "block", fontSize: "14px", color: "#344054" }}>
                            {resume.applicant_name || "Unnamed Candidate"}
                          </strong>
                          <span style={{ fontSize: "12px", color: "#667085" }}>
                            {resume.applicant_email || "No email registered"}
                          </span>
                        </div>
                      </td>
                      <td style={{
                        padding: "16px",
                        borderTop: "1px solid #e7e2f2",
                        borderBottom: "1px solid #e7e2f2",
                        fontSize: "13px",
                        color: "#475467"
                      }}>
                        {formatDate(resume.created_at)}
                      </td>
                      <td style={{
                        padding: "16px",
                        borderTop: "1px solid #e7e2f2",
                        borderBottom: "1px solid #e7e2f2",
                        fontSize: "13px",
                        fontWeight: "700",
                        color: "#344054"
                      }}>
                        {formatFileSize(resume.file_size)}
                      </td>
                      <td style={{
                        padding: "16px",
                        borderTopRightRadius: "16px",
                        borderBottomRightRadius: "16px",
                        borderTop: "1px solid #e7e2f2",
                        borderBottom: "1px solid #e7e2f2",
                        borderRight: "1px solid #e7e2f2",
                        textAlign: "right"
                      }}>
                        <div style={{ display: "flex", gap: "8px", justifyContent: "flex-end" }}>
                          <button
                            type="button"
                            onClick={() => handlePreview(resume)}
                            style={{
                              height: "36px",
                              padding: "0 14px",
                              borderRadius: "8px",
                              background: "#ffffff",
                              border: "1px solid #d0d5dd",
                              fontSize: "13px",
                              fontWeight: "800",
                              color: "#344054",
                              cursor: "pointer",
                              transition: "0.2s"
                            }}
                          >
                            Preview
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDownload(resume)}
                            style={{
                              height: "36px",
                              padding: "0 14px",
                              borderRadius: "8px",
                              background: "linear-gradient(135deg, #58158f, #8b18ff)",
                              border: "none",
                              fontSize: "13px",
                              fontWeight: "800",
                              color: "#ffffff",
                              cursor: "pointer",
                              transition: "0.2s"
                            }}
                          >
                            Download
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDelete(resume)}
                            disabled={actionLoading}
                            style={{
                              height: "36px",
                              padding: "0 14px",
                              borderRadius: "8px",
                              background: "#fff1f2",
                              border: "none",
                              fontSize: "13px",
                              fontWeight: "800",
                              color: "#e11d48",
                              cursor: "pointer",
                              transition: "0.2s"
                            }}
                          >
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* RESUME PREVIEW MODAL */}
      {previewApplicant && (
        <ResumeViewerModal
          applicant={previewApplicant}
          onClose={() => setPreviewApplicant(null)}
        />
      )}
    </DashboardLayout>
  );
}
