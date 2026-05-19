import { Link } from "react-router-dom";
import "./BrowseJobs.css";

export default function BrowseJobs() {
  return (
    <main className="browse-page">
      <header className="browse-navbar">
        <Link to="/" className="browse-brand">
          <span className="browse-brand-icon">✓</span>

          <span className="browse-brand-text">
            <strong>SkillSync</strong>
            <small>Find the right match</small>
          </span>
        </Link>

        <nav className="browse-nav-links">
          <Link to="/">Home</Link>
          <Link className="active" to="/browse-jobs">
            Browse Jobs
          </Link>
          <Link to="/how-it-works">How it works</Link>
          <Link to="/about">About us</Link>
        </nav>

        <div className="browse-nav-actions">
          <Link className="browse-btn browse-btn-light" to="/admin/login">
            Admin
          </Link>
          <Link className="browse-btn browse-btn-outline" to="/sign-in">
            Sign In
          </Link>
          <Link className="browse-btn browse-btn-pink" to="/sign-up">
            Sign Up
          </Link>
        </div>
      </header>

      <section className="browse-hero">
        <div className="browse-hero-inner">
          <div className="browse-hero-copy">
            <span className="browse-badge">Browse Opportunities</span>
            <h1>Browse jobs with a cleaner matching experience.</h1>
            <p>
              Explore available opportunities, filter by your preferences, and
              connect with roles that match your skills and career goals.
            </p>
          </div>
        </div>
      </section>

      <section className="browse-search-section">
        <div className="browse-search-card">
          <div className="browse-search-title">
            <h2>Find your next opportunity</h2>
            <p>Search and filter jobs based on your preferred role and setup.</p>
          </div>

          <div className="browse-search-grid">
            <div className="browse-input">
              <span>⌕</span>
              <input type="text" placeholder="Job title, keyword, or company" />
            </div>

            <div className="browse-input">
              <span>⌖</span>
              <input type="text" placeholder="Location" />
            </div>

            <select className="browse-select" defaultValue="">
              <option value="" disabled>
                Job Type
              </option>
              <option>Full Time</option>
              <option>Part Time</option>
              <option>Contract</option>
              <option>Internship</option>
              <option>Remote</option>
            </select>

            <button className="browse-search-btn">Search Jobs</button>
          </div>
        </div>
      </section>

      <section className="browse-content-section">
        <div className="browse-layout">
          <aside className="browse-sidebar">
            <div className="browse-sidebar-card">
              <h3>Filters</h3>

              <div className="browse-filter-group">
                <label>Experience Level</label>
                <select>
                  <option>Any</option>
                  <option>Entry Level</option>
                  <option>Mid Level</option>
                  <option>Senior Level</option>
                </select>
              </div>

              <div className="browse-filter-group">
                <label>Work Setup</label>
                <select>
                  <option>Any</option>
                  <option>On-site</option>
                  <option>Hybrid</option>
                  <option>Remote</option>
                </select>
              </div>

              <div className="browse-filter-group">
                <label>Category</label>
                <select>
                  <option>Any</option>
                  <option>Technology</option>
                  <option>Design</option>
                  <option>Marketing</option>
                  <option>Operations</option>
                </select>
              </div>

              <div className="browse-filter-group">
                <label>Salary Range</label>
                <select>
                  <option>Any</option>
                  <option>Below 20k</option>
                  <option>20k - 50k</option>
                  <option>50k - 100k</option>
                  <option>100k+</option>
                </select>
              </div>

              <button className="browse-clear-btn">Clear Filters</button>
            </div>
          </aside>

          <div className="browse-results">
            <div className="browse-results-top">
              <div>
                <h3>Available Jobs</h3>
                <p>
                  Your job listings will appear here once connected to your
                  backend.
                </p>
              </div>

              <div className="browse-results-meta">
                <span className="results-badge">0 Jobs</span>
              </div>
            </div>

            <div className="browse-empty-state">
              <div className="browse-empty-icon">▣</div>
              <h4>No job listings yet</h4>
              <p>
                Please SignIn/SignUp to continue.
              </p>

              <div className="browse-empty-actions">
                <Link to="/sign-in" className="browse-outline-btn">
                  Sign In
                </Link>
                <Link to="/sign-up" className="browse-primary-btn">
                  Create Account
                </Link>
              </div>
            </div>

            <div className="browse-placeholder-grid">
              <div className="browse-placeholder-card"></div>
              <div className="browse-placeholder-card"></div>
              <div className="browse-placeholder-card"></div>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}