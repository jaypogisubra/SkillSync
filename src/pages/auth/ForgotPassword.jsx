import { useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "../../services/supabase";
import "./SignIn.css";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    if (!email.trim()) {
      setError("Please enter your email address.");
      return;
    }

    setLoading(true);
    setError("");
    setMessage("");

    try {
      const { error: resetError } = await supabase.auth.resetPasswordForEmail(
        email.trim(),
        {
          redirectTo: `${window.location.origin}/reset-password`,
        }
      );

      if (resetError) {
        setError(resetError.message || "Failed to send reset link. Please try again.");
      } else {
        setMessage("A password reset link has been sent to your email address. Please check your inbox.");
        setEmail("");
      }
    } catch (err) {
      console.error("Forgot password error:", err);
      setError("An unexpected error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="signin-page">
      <section className="signin-shell">
        <section className="signin-left">
          <Link to="/sign-in" className="signin-back-btn">
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <line x1="19" y1="12" x2="5" y2="12"></line>
              <polyline points="12 19 5 12 12 5"></polyline>
            </svg>
            <span>Back to Sign In</span>
          </Link>
          <div className="signin-brand">
            <div className="signin-logo-icon">✓</div>
            <div>
              <h1>SkillSync</h1>
              <p>Find the right match</p>
            </div>
          </div>

          <div className="signin-hero-content">
            <h2>Recover your account password.</h2>
            <p>
              Enter your email address and we'll send you a secure link to reset
              your password, getting you back to your career matches quickly.
            </p>
          </div>
        </section>

        <section className="signin-right">
          <form className="signin-card" onSubmit={handleSubmit}>
            <div className="signin-card-header">
              <span>Security</span>
              <h2>Forgot Password?</h2>
              <p>Enter your email below to receive a password reset link.</p>
            </div>

            {error && <div className="signin-error">{error}</div>}
            {message && (
              <div 
                className="profile-message" 
                style={{ 
                  background: "#f5ecff", 
                  color: "#58158f", 
                  borderColor: "#e2cff8",
                  padding: "12px 14px",
                  borderRadius: "14px",
                  border: "1px solid",
                  marginBottom: "16px",
                  fontSize: "14px",
                  fontWeight: "800"
                }}
              >
                {message}
              </div>
            )}

            <label>
              <span>Email address</span>
              <input
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  setError("");
                  setMessage("");
                }}
                required
                disabled={loading}
              />
            </label>

            <button
              type="submit"
              className="signin-submit-btn"
              disabled={loading}
            >
              {loading ? "Sending link..." : "Send Reset Link"}
            </button>

            <p className="signin-footer-text">
              Remember your password? <Link to="/sign-in">Sign in</Link>
            </p>
          </form>
        </section>
      </section>
    </main>
  );
}
