import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "../../services/supabase";
import "./SignIn.css";

export default function ResetPassword() {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    password: "",
    confirmPassword: "",
  });

  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  // We should verify that we have an active session or a recovery token/type.
  // When a user clicks reset link, Supabase handles auth.onAuthStateChange with event PASSWORD_RECOVERY
  useEffect(() => {
    supabase.auth.onAuthStateChange(async (event) => {
      if (event !== "PASSWORD_RECOVERY") {
        // Checking session
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) {
          setError("Your password reset link is invalid or has expired. Please request a new link.");
        }
      }
    });
  }, []);

  function handleChange(e) {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
    setError("");
    setMessage("");
  }

  async function handleSubmit(e) {
    e.preventDefault();

    if (formData.password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setLoading(true);
    setError("");
    setMessage("");

    try {
      const { error: updateError } = await supabase.auth.updateUser({
        password: formData.password,
      });

      if (updateError) {
        setError(updateError.message || "Failed to reset password. Please try again.");
      } else {
        setMessage("Your password has been reset successfully. Redirecting you to sign in...");
        setFormData({ password: "", confirmPassword: "" });
        setTimeout(() => {
          navigate("/sign-in");
        }, 3000);
      }
    } catch (err) {
      console.error("Reset password error:", err);
      setError("An unexpected error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="signin-page">
      <section className="signin-shell">
        <section className="signin-left">
          <div className="signin-brand">
            <div className="signin-logo-icon">✓</div>
            <div>
              <h1>SkillSync</h1>
              <p>Find the right match</p>
            </div>
          </div>

          <div className="signin-hero-content">
            <h2>Secure your account credentials.</h2>
            <p>
              Please enter a strong new password below to update your account
              credentials and restore secure access to SkillSync.
            </p>
          </div>
        </section>

        <section className="signin-right">
          <form className="signin-card" onSubmit={handleSubmit}>
            <div className="signin-card-header">
              <span>Security</span>
              <h2>Reset Password</h2>
              <p>Create a new password below for your account.</p>
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
              <span>New Password</span>
              <input
                type="password"
                name="password"
                placeholder="Minimum 6 characters"
                value={formData.password}
                onChange={handleChange}
                required
                disabled={loading}
              />
            </label>

            <label>
              <span>Confirm New Password</span>
              <input
                type="password"
                name="confirmPassword"
                placeholder="Confirm new password"
                value={formData.confirmPassword}
                onChange={handleChange}
                required
                disabled={loading}
              />
            </label>

            <button
              type="submit"
              className="signin-submit-btn"
              disabled={loading}
            >
              {loading ? "Resetting password..." : "Save Password"}
            </button>

            <p className="signin-footer-text">
              Go back to <Link to="/sign-in">Sign In</Link>
            </p>
          </form>
        </section>
      </section>
    </main>
  );
}
