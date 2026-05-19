import { Link } from "react-router-dom";
import "../../styles/auth.css";

export default function AuthLayout({ title, subtitle, children, badge }) {
  return (
    <main className="auth-page">
      <section className="auth-shell">
        <div className="auth-brand-panel">
          <Link to="/" className="auth-logo">
            <span className="auth-logo-icon">✓</span>
            <span>
              <strong>SkillSync</strong>
              <small>Find the right match</small>
            </span>
          </Link>

          <div className="auth-hero-copy">
            <span className="auth-badge">{badge || "Skill-Based Matching"}</span>

            <h1>
              Find jobs that match
              <span> your skill.</span>
            </h1>

            <p>
              SkillSync helps job seekers and employers connect through
              skill-focused profiles, resume screening, and role-based access.
            </p>
          </div>

          <div className="auth-feature-list">
            <div className="auth-feature-item">
              <span>▤</span>
              <div>
                <strong>Resume Screening</strong>
                <small>Upload and manage resume information.</small>
              </div>
            </div>

            <div className="auth-feature-item">
              <span>◎</span>
              <div>
                <strong>Skill Alignment</strong>
                <small>Organize skills for job matching.</small>
              </div>
            </div>

            <div className="auth-feature-item">
              <span>▣</span>
              <div>
                <strong>Role-Based Access</strong>
                <small>Separate access for admins and job seekers.</small>
              </div>
            </div>
          </div>
        </div>

        <div className="auth-form-panel">
          <div className="auth-card">
            <div className="auth-card-header">
              <h2>{title}</h2>
              <p>{subtitle}</p>
            </div>

            {children}
          </div>
        </div>
      </section>
    </main>
  );
}