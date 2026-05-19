import { Link } from "react-router-dom";
import "./AboutUs.css";

export default function AboutUs() {
  return (
    <main className="about-page">
      <header className="about-navbar">
        <Link to="/" className="about-brand">
          <span className="about-brand-icon">✓</span>

          <span className="about-brand-text">
            <strong>SkillSync</strong>
            <small>Find the right match</small>
          </span>
        </Link>

        <nav className="about-nav-links">
          <Link to="/">Home</Link>
          <Link to="/browse-jobs">Browse Jobs</Link>
          <Link to="/how-it-works">How it works</Link>
          <Link className="active" to="/about">
            About us
          </Link>
        </nav>

        <div className="about-nav-actions">
          <Link className="about-btn about-btn-light" to="/admin/login">
            Admin
          </Link>
          <Link className="about-btn about-btn-outline" to="/sign-in">
            Sign In
          </Link>
          <Link className="about-btn about-btn-pink" to="/sign-up">
            Sign Up
          </Link>
        </div>
      </header>

      <section className="about-hero">
        <div className="about-hero-inner">
          <div className="about-hero-copy">
            <span className="about-badge">About SkillSync</span>
            <h1>Helping job seekers and employers connect more clearly.</h1>
            <p>
              SkillSync is built to simplify hiring and job searching through
              skill-based matching.
            </p>

            <div className="about-hero-actions">
              <Link to="/sign-up" className="about-primary-btn">
                Get Started
              </Link>
              <Link to="/browse-jobs" className="about-outline-btn">
                Browse Jobs
              </Link>
            </div>
          </div>

          <div className="about-hero-panel">
            <div className="about-panel-card">
              <span className="about-panel-icon">▤</span>
              <div>
                <strong>Skill-Based Matching</strong>
                <p>
                  Connect people to roles based on relevant skills and profile
                  details.
                </p>
              </div>
            </div>

            <div className="about-panel-card">
              <span className="about-panel-icon">◎</span>
              <div>
                <strong>Organized Profiles</strong>
                <p>
                  Present job seeker information clearly for better application
                  flow.
                </p>
              </div>
            </div>

          </div>
        </div>
      </section>

      <section className="about-intro">
        <div className="about-container">
          <div className="about-section-heading">
            <span>Who we are</span>
            <h2>A cleaner way to support hiring and career growth.</h2>
            <p>
              SkillSync focuses on making the hiring experience easier to
              understand and easier to manage. From profile creation to browsing
              roles and managing access, the platform is designed to stay simple,
              modern, and practical.
            </p>
          </div>
        </div>
      </section>

      <section className="about-cta">
        <div className="about-container">
          <div className="about-cta-card">
            <div>
              <span className="about-cta-badge">Start with SkillSync</span>
              <h2>Ready to explore the platform?</h2>
              <p>
                Create an account, browse jobs, and continue building your
                SkillSync experience.
              </p>
            </div>

            <div className="about-cta-actions">
              <Link to="/sign-up" className="about-primary-btn">
                Create Account
              </Link>
              <Link to="/sign-in" className="about-outline-btn">
                Sign In
              </Link>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}