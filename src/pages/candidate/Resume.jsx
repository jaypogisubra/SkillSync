import { useEffect, useRef, useState } from "react";
import DashboardLayout from "../../components/layout/DashboardLayout";
import { uploadResume, saveResumeRecord, getResume } from "../../services/api";
import { supabase } from "../../services/supabase";

export default function Resume() {
  const fileInputRef = useRef(null);
  const [resumeFile, setResumeFile] = useState(null);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadResume();
  }, []);

  async function loadResume() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data } = await getResume(user.id);
    if (data) setResumeFile(data);
  }

  function handleAddResume() {
    if (fileInputRef.current) fileInputRef.current.click();
  }

  async function handleFileChange(event) {
    const file = event.target.files[0];
    if (!file) return;

    const allowedExtensions = [".pdf", ".doc", ".docx"];
    const fileName = file.name.toLowerCase();
    const hasAllowedExtension = allowedExtensions.some((ext) =>
      fileName.endsWith(ext)
    );

    if (!hasAllowedExtension) {
      setMessage("Please upload a PDF, DOC, or DOCX resume file.");
      return;
    }

    setLoading(true);
    setMessage("");

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      setMessage("You must be logged in to upload a resume.");
      setLoading(false);
      return;
    }

    const { data: fileUrl, error: uploadError } = await uploadResume(file, user.id);

    if (uploadError) {
      setMessage("Failed to upload resume. Please try again.");
      setLoading(false);
      return;
    }

    await saveResumeRecord(user.id, fileUrl, "");

    setResumeFile({
      file_url: fileUrl,
      name: file.name,
      size: file.size,
      uploadedAt: new Date().toISOString(),
    });

    setMessage("Resume uploaded successfully.");
    setLoading(false);
  }

  async function handleDeleteResume() {
    const confirmDelete = window.confirm("Are you sure you want to delete your resume?");
    if (!confirmDelete) return;

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    await supabase.from("resumes").delete().eq("applicant_id", user.id);
    setResumeFile(null);
    setMessage("Resume deleted successfully.");
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  function formatFileSize(size) {
    if (!size) return "Unknown size";
    return `${(size / 1024 / 1024).toFixed(2)} MB`;
  }

  function formatUploadDate(dateString) {
    if (!dateString) return "";
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  }

  return (
    <DashboardLayout
      role="candidate"
      title="Resume"
      subtitle="Upload and manage your resume information."
    >
      <section className="dashboard-panel">
        <div className="panel-header">
          <div>
            <h2>Resume Upload</h2>
          </div>
          <button className="panel-action" type="button" onClick={handleAddResume}>
            Add Resume
          </button>
        </div>

        {message && <div className="profile-message">{message}</div>}

        <input
          ref={fileInputRef}
          type="file"
          accept=".pdf,.doc,.docx"
          onChange={handleFileChange}
          hidden
        />

        {!resumeFile ? (
          <div className="empty-state">
            <span>▤</span>
            <h3>No resume uploaded yet</h3>
            <p>
              Upload your resume so your skills and experience can be prepared
              for job matching.
            </p>
            <button
              className="resume-upload-btn"
              type="button"
              onClick={handleAddResume}
              disabled={loading}
            >
              {loading ? "Uploading..." : "Upload Resume"}
            </button>
          </div>
        ) : (
          <div className="resume-file-card">
            <div className="resume-file-icon">▤</div>
            <div className="resume-file-info">
              <h3>{resumeFile.name || "Resume"}</h3>
              <p>
                {formatFileSize(resumeFile.size)} • Uploaded{" "}
                {formatUploadDate(resumeFile.uploadedAt || resumeFile.created_at)}
              </p>
            </div>
            <div className="resume-file-actions">
              {resumeFile.file_url && (
                <a
                  href={resumeFile.file_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="resume-view-btn"
                >
                  View
                </a>
              )}
              <button
                className="resume-delete-btn"
                type="button"
                onClick={handleDeleteResume}
              >
                Delete
              </button>
            </div>
          </div>
        )}
      </section>
    </DashboardLayout>
  );
}