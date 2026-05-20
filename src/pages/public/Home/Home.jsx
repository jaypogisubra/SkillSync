import { Link } from "react-router-dom";
import HeroSection from "./HeroSection";
import JobSearchSection from "./JobSearchSection";
import FeatureCards from "./FeatureCards";
import "./Home.css";

export default function Home() {
  return (
    <div className="home-page">
      <header className="navbar">
        <Link to="/" className="brand">
          <span className="brand-icon">✓</span>

          <span className="brand-text">
            <strong>SkillSync</strong>
            <small>Find the right match</small>
          </span>
        </Link>

        <nav className="nav-links">
          <Link className="active" to="/">
            Home
          </Link>
          <Link to="/browse-jobs">Browse Jobs</Link>
          <Link to="/how-it-works">How it works</Link>
          <Link to="/about">About us</Link>
        </nav>

        <div className="nav-actions">
          <Link className="btn btn-outline" to="/sign-in">
            Sign In
          </Link>
          <Link className="btn btn-pink" to="/sign-up">
            Sign Up
          </Link>
        </div>
      </header>

      <main>
        <HeroSection />
        <JobSearchSection />
        <FeatureCards />
      </main>
    </div>
  );
}