import { useEffect, useState } from "react";
import DashboardLayout from "../../components/layout/DashboardLayout";
import { supabase } from "../../services/supabase";
import { applyForJobWithSnapshot } from "../../services/applicationService";
import { triggerSimulationNotification } from "../../services/notificationService";
import "./JobMatches.css";

export default function JobMatches() {
  const [jobs, setJobs] = useState([]);
  const [applications, setApplications] = useState([]);
  const [candidateSkills, setCandidateSkills] = useState([]);
  const [bookmarks, setBookmarks] = useState([]);
  
  // Filtering & Search
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedType, setSelectedType] = useState("All");
  const [selectedMatch, setSelectedMatch] = useState("All");
  const [showBookmarkedOnly, setShowBookmarkedOnly] = useState(false);
  
  // Status message
  const [message, setMessage] = useState("");
  const [userId, setUserId] = useState(null);

  // Detail Modal Popup
  const [selectedJob, setSelectedJob] = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    setUserId(user.id);

    // 1. Fetch Candidate Profile Skills
    const { data: profile } = await supabase
      .from("profiles")
      .select("skills")
      .eq("id", user.id)
      .maybeSingle();

    // 2. Fetch Resume Extracted Skills
    const { data: resume } = await supabase
      .from("resumes")
      .select("extracted_skills")
      .eq("applicant_id", user.id)
      .maybeSingle();

    // Combine skills from profile and resume
    const pSkills = profile?.skills ? profile.skills.split(",").map(s => s.trim().toLowerCase()) : [];
    const rSkills = resume?.extracted_skills ? resume.extracted_skills.split(",").map(s => s.trim().toLowerCase()) : [];
    const combined = Array.from(new Set([...pSkills, ...rSkills])).filter(Boolean);
    setCandidateSkills(combined);

    // 3. Fetch Jobs
    const { data: jobsData } = await supabase
      .from("jobs")
      .select("*")
      .eq("status", "open");
    
    setJobs(jobsData || []);

    // 4. Fetch Applications
    const { data: appsData } = await supabase
      .from("applications")
      .select("*")
      .eq("applicant_id", user.id);
    setApplications(appsData || []);

    // 5. Fetch Bookmarks from localStorage
    const savedBookmarks = localStorage.getItem(`skillsync_bookmarks_${user.id}`);
    if (savedBookmarks) {
      setBookmarks(JSON.parse(savedBookmarks));
    }
  }

  function hasApplied(jobId) {
    return applications.some((app) => app.job_id === jobId);
  }

  // Toggle Bookmark
  function toggleBookmark(jobId) {
    if (!userId) return;
    let nextBookmarks;
    if (bookmarks.includes(jobId)) {
      nextBookmarks = bookmarks.filter(id => id !== jobId);
    } else {
      nextBookmarks = [...bookmarks, jobId];
    }
    setBookmarks(nextBookmarks);
    localStorage.setItem(`skillsync_bookmarks_${userId}`, JSON.stringify(nextBookmarks));
  }

  // Calculate Match Percentage and details
  function calculateJobMatchDetails(jobRequiredSkillsStr) {
    if (!jobRequiredSkillsStr) {
      return { score: 50, matched: [], missing: [], reqCount: 0 };
    }

    const reqSkillsList = jobRequiredSkillsStr.split(",").map(s => s.trim()).filter(Boolean);
    if (reqSkillsList.length === 0) {
      return { score: 100, matched: [], missing: [], reqCount: 0 };
    }

    const matched = [];
    const missing = [];

    reqSkillsList.forEach(skill => {
      const isMatched = candidateSkills.includes(skill.toLowerCase());
      if (isMatched) {
        matched.push(skill);
      } else {
        missing.push(skill);
      }
    });

    const score = Math.round((matched.length / reqSkillsList.length) * 100);

    return {
      score,
      matched,
      missing,
      reqCount: reqSkillsList.length
    };
  }

  async function handleApply(job) {
    if (!userId) {
      setMessage("Please sign in before applying.");
      return;
    }

    if (hasApplied(job.id)) {
      setMessage("You already applied to this job.");
      return;
    }

    const { data, error } = await applyForJobWithSnapshot(job.id, userId);

    if (error) {
      setMessage("Failed to apply: " + error.message);
      return;
    }

    setApplications((prev) => [...prev, data]);
    setMessage(`Successfully applied for "${job.title}"!`);

    // Trigger simulation notification
    await triggerSimulationNotification(userId, "job_applied", {
      jobTitle: job.title
    });

    setTimeout(() => setMessage(""), 4000);
    
    // Close modal if open
    setShowDetailModal(false);
  }

  function handleViewDetails(job) {
    const matchDetails = calculateJobMatchDetails(job.required_skills);
    setSelectedJob({ ...job, matchDetails });
    setShowDetailModal(true);
  }

  // Process and Filter jobs list
  const processedJobs = jobs.map(job => {
    const match = calculateJobMatchDetails(job.required_skills);
    return {
      ...job,
      matchScore: match.score,
      matchedSkills: match.matched,
      missingSkills: match.missing
    };
  });

  // Sort descending by match score
  const sortedJobs = processedJobs.sort((a, b) => b.matchScore - a.matchScore);

  const filteredJobs = sortedJobs.filter(job => {
    // Search filter
    const matchesSearch = 
      job.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (job.location && job.location.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (job.required_skills && job.required_skills.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (job.description && job.description.toLowerCase().includes(searchTerm.toLowerCase()));

    // Employment type filter
    const matchesType = selectedType === "All" || job.employment_type === selectedType;

    // Match quality filter
    let matchesMatch = true;
    if (selectedMatch === "High") {
      matchesMatch = job.matchScore >= 75;
    } else if (selectedMatch === "Medium") {
      matchesMatch = job.matchScore >= 40 && job.matchScore < 75;
    } else if (selectedMatch === "Basic") {
      matchesMatch = job.matchScore < 40;
    }

    // Bookmark filter
    const matchesBookmark = !showBookmarkedOnly || bookmarks.includes(job.id);

    return matchesSearch && matchesType && matchesMatch && matchesBookmark;
  });

  return (
    <DashboardLayout
      role="candidate"
      title="Skill Aligned Job Openings"
      subtitle="AI-driven job screening matching your profile achievements."
    >
      <section className="dashboard-panel">
        <div className="panel-header">
          <div>
            <h2>Intelligent Job Matching</h2>
            <p>Our matching algorithm ranks openings by comparing your skills to the recruiter's specifications.</p>
          </div>
        </div>

        {/* Filter controls row */}
        <div className="matches-controls-row">
          <input
            type="text"
            placeholder="🔍 Search title, skills, location..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="search-filter-input"
          />

          <select 
            value={selectedType}
            onChange={(e) => setSelectedType(e.target.value)}
            className="filter-select"
          >
            <option value="All">All Job Types</option>
            <option value="Full-time">Full-Time</option>
            <option value="Part-time">Part-Time</option>
            <option value="Contract">Contract</option>
            <option value="Remote">Remote</option>
            <option value="Internship">Internship</option>
          </select>

          <select 
            value={selectedMatch}
            onChange={(e) => setSelectedMatch(e.target.value)}
            className="filter-select"
          >
            <option value="All">All Match Levels</option>
            <option value="High">🔥 High Matches (≥75%)</option>
            <option value="Medium">⚡ Medium Matches (40-74%)</option>
            <option value="Basic">📈 Basic Matches (&lt;40%)</option>
          </select>

          <button 
            type="button" 
            className={`bookmarks-tab-btn ${showBookmarkedOnly ? "active" : ""}`}
            onClick={() => setShowBookmarkedOnly(!showBookmarkedOnly)}
          >
            ⭐ Bookmarks ({bookmarks.length})
          </button>
        </div>

        {message && <div className="profile-message">{message}</div>}

        {filteredJobs.length === 0 ? (
          <div className="empty-state">
            <span>◎</span>
            <h3>No matching jobs found</h3>
            <p>Try adjusting your search criteria, clearing your filters, or adding more skills in your profile builder.</p>
          </div>
        ) : (
          <div className="job-match-list">
            {filteredJobs.map((job) => {
              const score = job.matchScore;
              let matchClass = "basic-match";
              let badgeClass = "basic";
              if (score >= 75) {
                matchClass = "high-match";
                badgeClass = "high";
              } else if (score >= 40) {
                matchClass = "medium-match";
                badgeClass = "medium";
              }

              return (
                <article className={`job-match-card ${matchClass}`} key={job.id}>
                  <div className="job-card-header">
                    <div className="job-card-title-area">
                      <h3>{job.title}</h3>
                      <h4>Company Partner</h4>
                    </div>

                    <div className={`match-score-badge ${badgeClass}`}>
                      🧠 {score}% Skill Match
                    </div>
                  </div>

                  <p className="job-description-excerpt">{job.description || "No job description provided."}</p>

                  {/* Skills tags list indicating matched skills */}
                  <div className="job-skills-list">
                    {job.required_skills ? (
                      job.required_skills.split(",").map((s) => {
                        const skill = s.trim();
                        const isMatched = candidateSkills.includes(skill.toLowerCase());
                        return (
                          <span 
                            key={skill} 
                            className={`job-skill-badge ${isMatched ? "matched" : ""}`}
                          >
                            {isMatched ? "✓ " : ""}{skill}
                          </span>
                        );
                      })
                    ) : (
                      <span className="job-skill-badge">No required skills specified</span>
                    )}
                  </div>

                  <div className="job-card-footer">
                    <div className="job-card-meta">
                      <span>📍 {job.location || "Not specified"}</span>
                      <span>💼 {job.employment_type || "Full-time"}</span>
                    </div>

                    <div className="job-card-actions">
                      <button 
                        type="button" 
                        className={`bookmark-btn ${bookmarks.includes(job.id) ? "bookmarked" : ""}`}
                        onClick={() => toggleBookmark(job.id)}
                        title="Bookmark Job"
                      >
                        ⭐
                      </button>
                      <button 
                        type="button" 
                        className="view-details-btn"
                        onClick={() => handleViewDetails(job)}
                      >
                        View Alignment
                      </button>
                      <button
                        type="button"
                        className="job-apply-primary"
                        onClick={() => handleApply(job)}
                        disabled={hasApplied(job.id)}
                      >
                        {hasApplied(job.id) ? "Applied" : "Apply Now"}
                      </button>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </section>

      {/* ── JOB DETAILS POPUP MODAL ── */}
      {showDetailModal && selectedJob && (
        <div className="modal-overlay" onClick={() => setShowDetailModal(false)}>
          <div className="modal-card" style={{ maxWidth: "700px" }} onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div>
                <h3 style={{ fontSize: "20px" }}>{selectedJob.title}</h3>
                <span style={{ fontSize: "13px", color: "#58158f", fontWeight: "800" }}>Company Hiring Partner</span>
              </div>
              <button className="modal-close-btn" onClick={() => setShowDetailModal(false)}>×</button>
            </div>
            
            {/* Skills Comparison */}
            <div className="skills-comparison-card">
              <h4>Skill Alignment Comparison</h4>
              <div className="skills-comparison-group">
                <div className="skills-comparison-label">Matched Skills ({selectedJob.matchDetails.matched.length})</div>
                <div className="job-skills-list">
                  {selectedJob.matchDetails.matched.map(skill => (
                    <span key={skill} className="job-skill-badge matched">✓ {skill}</span>
                  ))}
                  {selectedJob.matchDetails.matched.length === 0 && (
                    <em style={{ fontSize: "12px", color: "#8b8f9c" }}>No matching skills yet. Add these to your profile.</em>
                  )}
                </div>
              </div>
              
              <div className="skills-comparison-group">
                <div className="skills-comparison-label">Missing Skills ({selectedJob.matchDetails.missing.length})</div>
                <div className="job-skills-list">
                  {selectedJob.matchDetails.missing.map(skill => (
                    <span key={skill} className="job-skill-badge" style={{ color: "#d97706", background: "#fffbeb", border: "1px solid #fde68a" }}>{skill}</span>
                  ))}
                  {selectedJob.matchDetails.missing.length === 0 && (
                    <span className="job-skill-badge matched">✓ Complete match!</span>
                  )}
                </div>
              </div>
            </div>

            <div className="job-detail-grid">
              <div className="job-detail-main">
                <h4>Job Description</h4>
                <p>{selectedJob.description || "No description provided by the recruiter."}</p>
              </div>

              <div className="job-detail-sidebar">
                <div className="detail-sidebar-item">
                  <h5>Location</h5>
                  <p>{selectedJob.location || "Office Location"}</p>
                </div>
                <div className="detail-sidebar-item">
                  <h5>Employment Type</h5>
                  <p>{selectedJob.employment_type || "Full-time"}</p>
                </div>
                <div className="detail-sidebar-item">
                  <h5>AI Match Rating</h5>
                  <p style={{ color: selectedJob.matchScore >= 75 ? "#10b981" : "#8b5cf6" }}>
                    {selectedJob.matchScore}% Match
                  </p>
                </div>
              </div>
            </div>

            <div className="modal-actions">
              <button 
                type="button" 
                className="modal-btn secondary" 
                onClick={() => setShowDetailModal(false)}
              >
                Close
              </button>
              <button 
                type="button" 
                className="modal-btn primary"
                onClick={() => handleApply(selectedJob)}
                disabled={hasApplied(selectedJob.id)}
              >
                {hasApplied(selectedJob.id) ? "Applied" : "Apply for Job"}
              </button>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}