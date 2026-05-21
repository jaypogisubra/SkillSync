import { useEffect, useState } from "react";
import DashboardLayout from "../../components/layout/DashboardLayout";
import ResumeViewerModal from "../../components/resume/ResumeViewerModal";
import { fetchEmployerApplicants } from "../../services/applicationService";
import { supabase } from "../../services/supabase";
import "./Applicants.css";

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
  
  // Search & Filter state
  const [searchQuery, setSearchQuery] = useState("");
  const [filterJob, setFilterJob] = useState("All");
  const [filterStatus, setFilterStatus] = useState("All");
  const [filterMatchTier, setFilterMatchTier] = useState("All");

  // Expandable sections state
  const [expandedNotes, setExpandedNotes] = useState({});
  const [expandedInterviews, setExpandedInterviews] = useState({});

  // Form states per application
  const [notesState, setNotesState] = useState({});
  const [interviewState, setInterviewState] = useState({});
  const [saveMessages, setSaveMessages] = useState({});

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

    const list = data || [];
    setApplicants(list);

    // Seed notes and interview states
    const notes = {};
    const interviews = {};
    list.forEach(app => {
      notes[app.id] = app.recruiter_notes || "";
      
      const isched = app.interview_schedule || {};
      interviews[app.id] = {
        date: isched.date || "",
        time: isched.time || "",
        link: isched.link || "",
        notes: isched.notes || ""
      };
    });
    setNotesState(notes);
    setInterviewState(interviews);

    setLoading(false);
  }

  // Parse skill strings or arrays helper
  function getSkillsList(raw) {
    if (!raw) return [];
    if (Array.isArray(raw)) return raw;
    if (typeof raw === "string") {
      return raw.split(",").map(s => s.trim().toLowerCase()).filter(Boolean);
    }
    return [];
  }

  // Algorithm to calculate skill alignment
  function calculateAlignment(app) {
    const jobSkills = getSkillsList(app.jobs?.required_skills);
    const candidateSkills = getSkillsList(app.profiles?.skills);

    if (jobSkills.length === 0) {
      return { score: 100, matched: [], missing: [] };
    }

    const matched = [];
    const missing = [];

    jobSkills.forEach(skill => {
      if (candidateSkills.includes(skill)) {
        matched.push(skill);
      } else {
        missing.push(skill);
      }
    });

    const score = Math.round((matched.length / jobSkills.length) * 100);
    return { score, matched, missing };
  }

  function getMatchTier(score) {
    if (score >= 80) return "High";
    if (score >= 40) return "Medium";
    return "Basic";
  }

  async function updateStatus(appId, newStatus) {
    const { error } = await supabase.from("applications").update({ status: newStatus }).eq("id", appId);
    if (error) {
      console.error("Status update failed:", error.message);
      return;
    }

    // Live state update
    setApplicants((prev) =>
      prev.map((a) => (a.id === appId ? { ...a, status: newStatus } : a))
    );
    if (selectedApplicant?.id === appId) {
      setSelectedApplicant((prev) => ({ ...prev, status: newStatus }));
    }

    // Trigger local notification to candidate when status changes
    const updatedApp = applicants.find(a => a.id === appId);
    if (updatedApp && updatedApp.applicant_id) {
      await supabase.from("notifications").insert([{
        user_id: updatedApp.applicant_id,
        title: "Application Status Update",
        message: `Your application status for "${updatedApp.jobs?.title}" has been updated to "${newStatus.replace("_", " ")}".`,
        type: "application_update",
        is_read: false
      }]);
    }
  }

  async function saveNotes(appId) {
    const noteText = notesState[appId] || "";
    const { error } = await supabase.from("applications").update({ recruiter_notes: noteText }).eq("id", appId);
    
    if (error) {
      setSaveMessages(prev => ({ ...prev, [appId]: "❌ Failed to save notes" }));
    } else {
      setSaveMessages(prev => ({ ...prev, [appId]: "✅ Notes saved!" }));
      setTimeout(() => setSaveMessages(prev => ({ ...prev, [appId]: "" })), 2000);
    }
  }

  async function saveInterview(appId) {
    const details = interviewState[appId] || {};
    const { error } = await supabase.from("applications").update({ interview_schedule: details }).eq("id", appId);
    
    if (error) {
      setSaveMessages(prev => ({ ...prev, [appId]: "❌ Failed to save interview" }));
    } else {
      setSaveMessages(prev => ({ ...prev, [appId]: "✅ Interview scheduled!" }));
      setTimeout(() => setSaveMessages(prev => ({ ...prev, [appId]: "" })), 2000);

      // Notify candidate
      const updatedApp = applicants.find(a => a.id === appId);
      if (updatedApp && updatedApp.applicant_id) {
        await supabase.from("notifications").insert([{
          user_id: updatedApp.applicant_id,
          title: "🗓️ Interview Invitation",
          message: `An interview has been scheduled for "${updatedApp.jobs?.title}" on ${details.date} at ${details.time}. Link: ${details.link || "Google Meet"}`,
          type: "interview",
          is_read: false
        }]);
      }
    }
  }

  function toggleNotes(appId) {
    setExpandedNotes(prev => ({ ...prev, [appId]: !prev[appId] }));
  }

  function toggleInterview(appId) {
    setExpandedInterviews(prev => ({ ...prev, [appId]: !prev[appId] }));
  }

  function openResumeViewer(app) {
    setSelectedApplicant(app);
  }

  function closeResumeViewer() {
    setSelectedApplicant(null);
  }

  // Get unique jobs for filter dropdown
  const uniqueJobs = ["All", ...new Set(applicants.map(app => app.jobs?.title).filter(Boolean))];

  // Filtering Logic
  const filteredApplicants = applicants.filter(app => {
    const alignment = calculateAlignment(app);
    const tier = getMatchTier(alignment.score);

    const name = (app.profiles?.full_name || app.displayName || "").toLowerCase();
    const email = (app.profiles?.email || app.displayEmail || "").toLowerCase();
    const skills = (app.profiles?.skills || "").toLowerCase();
    const query = searchQuery.toLowerCase();

    const matchesSearch = name.includes(query) || email.includes(query) || skills.includes(query);
    const matchesJob = filterJob === "All" || app.jobs?.title === filterJob;
    const matchesStatus = filterStatus === "All" || app.status === filterStatus.toLowerCase();
    const matchesTier = filterMatchTier === "All" || tier === filterMatchTier;

    return matchesSearch && matchesJob && matchesStatus && matchesTier;
  });

  return (
    <DashboardLayout
      role="employer"
      title="Applicants Desk"
      subtitle="Verify candidate skills alignment, parse score analytics, and progress hiring workflows."
    >
      <section className="dashboard-panel">
        <div className="panel-header">
          <div>
            <h2>Review Applications</h2>
            <p>Compare job criteria to parsed applicant resumes matching Indeed analytics.</p>
          </div>
        </div>

        {/* Filter Toolbar */}
        <div className="applicants-controls">
          <input
            type="text"
            className="applicants-search-input"
            placeholder="🔍 Search applicant name, email, or skills…"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
          />

          <select className="applicants-filter-select" value={filterJob} onChange={e => setFilterJob(e.target.value)}>
            <option value="All">All Job Posts</option>
            {uniqueJobs.filter(j => j !== "All").map(j => (
              <option key={j} value={j}>{j}</option>
            ))}
          </select>

          <select className="applicants-filter-select" value={filterStatus} onChange={e => setFilterStatus(e.target.value)}>
            <option value="All">All Statuses</option>
            <option value="Pending">Pending</option>
            <option value="Under Review">Under Review</option>
            <option value="Shortlisted">Shortlisted</option>
            <option value="Interview Scheduled">Interview Scheduled</option>
            <option value="Rejected">Rejected</option>
            <option value="Hired">Hired</option>
          </select>

          <select className="applicants-filter-select" value={filterMatchTier} onChange={e => setFilterMatchTier(e.target.value)}>
            <option value="All">All Match Tiers</option>
            <option value="High">High Matches (≥80%)</option>
            <option value="Medium">Medium Matches (40-79%)</option>
            <option value="Basic">Basic Matches (&lt;40%)</option>
          </select>
        </div>

        {loading ? (
          <div className="empty-state">
            <h3>Retrieving applicants...</h3>
          </div>
        ) : filteredApplicants.length === 0 ? (
          <div className="empty-state">
            <span>👥</span>
            <h3>No applicants found</h3>
            <p>Try modifying your search queries or listing filters.</p>
          </div>
        ) : (
          <div className="applicants-list">
            {filteredApplicants.map((app) => {
              const alignment = calculateAlignment(app);
              const tier = getMatchTier(alignment.score);
              
              return (
                <article
                  className={`recruiter-applicant-card ${tier === "High" ? "high-match" : tier === "Medium" ? "med-match" : "low-match"}`}
                  key={app.id}
                >
                  <div className="rac-header">
                    <div className="rac-avatar">
                      {app.avatarLetter || "A"}
                    </div>
                    <div className="rac-identity">
                      <h3>{app.displayName || "Unnamed Applicant"}</h3>
                      <p>{app.displayEmail || "No Email"}</p>
                    </div>

                    <div className="rac-header-right">
                      <span className={`rac-match-badge ${tier.toLowerCase()}`}>
                        🧠 {alignment.score}% Match
                      </span>
                    </div>
                  </div>

                  {/* Info Snapshot Grid */}
                  <div className="rac-info-grid">
                    <div className="rac-info-item">
                      <span>Applied For</span>
                      <strong>{app.jobs?.title || "No role"}</strong>
                    </div>
                    <div className="rac-info-item">
                      <span>Job Type</span>
                      <strong>{app.jobs?.employment_type || "Full-time"}</strong>
                    </div>
                    <div className="rac-info-item">
                      <span>Applied Date</span>
                      <strong>{formatUploadDate(app.created_at)}</strong>
                    </div>
                    <div className="rac-info-item">
                      <span>Resume Score</span>
                      <strong>{app.resume?.resume_score || "N/A"}</strong>
                    </div>
                  </div>

                  {/* Skills Alignment Widgets */}
                  <div className="rac-skills-section">
                    {alignment.matched.length > 0 && (
                      <div style={{ marginBottom: "8px" }}>
                        <div className="rac-skills-label">Matched Skills ({alignment.matched.length})</div>
                        <div className="rac-skills-row">
                          {alignment.matched.map(s => (
                            <span key={s} className="rac-skill-chip matched">{s}</span>
                          ))}
                        </div>
                      </div>
                    )}
                    {alignment.missing.length > 0 && (
                      <div>
                        <div className="rac-skills-label">Missing Skills ({alignment.missing.length})</div>
                        <div className="rac-skills-row">
                          {alignment.missing.map(s => (
                            <span key={s} className="rac-skill-chip missing">{s}</span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Workflow Stage */}
                  <div className="rac-stage-section">
                    <div className="rac-stage-label">Current Hiring Pipeline Stage</div>
                    <select
                      className="rac-stage-select"
                      value={app.status || "pending"}
                      onChange={(e) => updateStatus(app.id, e.target.value)}
                    >
                      <option value="pending">Pending</option>
                      <option value="under review">Under Review</option>
                      <option value="shortlisted">Shortlisted</option>
                      <option value="interview scheduled">Interview Scheduled</option>
                      <option value="rejected">Rejected</option>
                      <option value="hired">Hired</option>
                    </select>
                  </div>

                  {/* Accordion Actions */}
                  <div className="rac-expand-actions">
                    <button
                      type="button"
                      className="rac-expand-btn"
                      onClick={() => toggleNotes(app.id)}
                    >
                      📝 Recruiter Notes {expandedNotes[app.id] ? "▲" : "▼"}
                    </button>
                    <button
                      type="button"
                      className="rac-expand-btn"
                      onClick={() => toggleInterview(app.id)}
                      style={{ color: "#16803d" }}
                    >
                      🗓️ Schedule Interview {expandedInterviews[app.id] ? "▲" : "▼"}
                    </button>

                    {app.resume?.file_url ? (
                      <button
                        type="button"
                        className="rac-resume-btn"
                        onClick={() => openResumeViewer(app)}
                      >
                        📄 View PDF Resume
                      </button>
                    ) : (
                      <span className="job-meta-chip" style={{ fontSize: "11px" }}>No Resume Uploaded</span>
                    )}

                    {saveMessages[app.id] && (
                      <span style={{ marginLeft: "auto", fontSize: "12px", fontWeight: "800" }}>
                        {saveMessages[app.id]}
                      </span>
                    )}
                  </div>

                  {/* 1. Recruiter Notes Panel */}
                  {expandedNotes[app.id] && (
                    <div className="rac-notes-panel">
                      <h4>Recruiter Screening Notes</h4>
                      <textarea
                        className="rac-notes-textarea"
                        placeholder="Add screening evaluations, resume review findings, or specific follow-ups…"
                        value={notesState[app.id] || ""}
                        onChange={(e) => {
                          const val = e.target.value;
                          setNotesState(prev => ({ ...prev, [app.id]: val }));
                        }}
                      />
                      <button
                        type="button"
                        className="rac-notes-save-btn"
                        onClick={() => saveNotes(app.id)}
                      >
                        Save Evaluations
                      </button>
                    </div>
                  )}

                  {/* 2. Interview Scheduler Panel */}
                  {expandedInterviews[app.id] && (
                    <div className="rac-interview-panel">
                      <h4>Schedule Interview Session</h4>
                      <div className="rac-interview-grid">
                        <label className="rac-interview-label">
                          Interview Date
                          <input
                            type="date"
                            value={interviewState[app.id]?.date || ""}
                            onChange={(e) => {
                              const dateVal = e.target.value;
                              setInterviewState(prev => ({
                                ...prev,
                                [app.id]: { ...(prev[appId] || {}), date: dateVal }
                              }));
                            }}
                          />
                        </label>
                        <label className="rac-interview-label">
                          Interview Time
                          <input
                            type="time"
                            value={interviewState[app.id]?.time || ""}
                            onChange={(e) => {
                              const timeVal = e.target.value;
                              setInterviewState(prev => ({
                                ...prev,
                                [app.id]: { ...(prev[appId] || {}), time: timeVal }
                              }));
                            }}
                          />
                        </label>
                      </div>
                      <label className="rac-interview-label" style={{ marginBottom: "12px" }}>
                        Google Meet or Interview Link
                        <input
                          type="url"
                          placeholder="https://meet.google.com/abc-defg-hij"
                          value={interviewState[app.id]?.link || ""}
                          onChange={(e) => {
                            const linkVal = e.target.value;
                            setInterviewState(prev => ({
                              ...prev,
                              [app.id]: { ...(prev[appId] || {}), link: linkVal }
                            }));
                          }}
                        />
                      </label>
                      <label className="rac-interview-label" style={{ marginBottom: "12px" }}>
                        Session Notes / Prep Instructions
                        <input
                          type="text"
                          placeholder="e.g. Technical live coding, dress professionally"
                          value={interviewState[app.id]?.notes || ""}
                          onChange={(e) => {
                            const noteVal = e.target.value;
                            setInterviewState(prev => ({
                              ...prev,
                              [app.id]: { ...(prev[appId] || {}), notes: noteVal }
                            }));
                          }}
                        />
                      </label>
                      <button
                        type="button"
                        className="rac-interview-save-btn"
                        onClick={() => saveInterview(app.id)}
                      >
                        Confirm & Invite Candidate
                      </button>
                    </div>
                  )}
                </article>
              );
            })}
          </div>
        )}
      </section>

      {selectedApplicant && (
        <ResumeViewerModal
          applicant={selectedApplicant}
          onClose={closeResumeViewer}
          onAccept={() => updateStatus(selectedApplicant.id, "hired")}
          onReject={() => updateStatus(selectedApplicant.id, "rejected")}
          onShortlist={() => updateStatus(selectedApplicant.id, "shortlisted")}
        />
      )}
    </DashboardLayout>
  );
}
