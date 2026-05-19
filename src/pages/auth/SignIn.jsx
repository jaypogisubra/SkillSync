import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { signIn } from "../../services/authService";
import { supabase } from "../../services/supabase";
import { setCurrentUser } from "../../services/localStorageService";
import "./SignIn.css";

export default function SignIn() {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    email: "",
    password: "",
    accountType: "candidate",
  });

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  function handleChange(e) {
    const { name, value } = e.target;
    setFormData((prevData) => ({
      ...prevData,
      [name]: value,
    }));
    setError("");
  }

  function getDashboardPath(role) {
    if (role === "candidate" || role === "job_seeker") return "/candidate/dashboard";
    if (role === "employer") return "/employer/dashboard";
    if (role === "admin") return "/admin/dashboard";
    return "/candidate/dashboard";
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      console.log("Step 1: Attempting signIn...");
      const { data, error } = await signIn(formData.email, formData.password);

      if (error) {
        console.error("Supabase login error:", error);
        const msg = error.message?.toLowerCase() || "";
        if (msg.includes("email not confirmed")) {
          setError("Your email is not confirmed yet. Please check your inbox and click the confirmation link.");
        } else if (msg.includes("invalid login credentials") || msg.includes("invalid email or password")) {
          setError("Incorrect email or password. Please try again.");
        } else if (msg.includes("too many requests")) {
          setError("Too many login attempts. Please wait a moment and try again.");
        } else {
          setError(error.message || "Login failed. Please try again.");
        }
        setLoading(false);
        return;
      }

      console.log("Step 2: signIn success. User:", data.user?.id);

      // Fetch profile with a 5-second timeout to prevent hanging
      let role = formData.accountType;
      try {
        const profilePromise = supabase
          .from("profiles")
          .select("role")
          .eq("id", data.user.id)
          .single();

        const timeoutPromise = new Promise((_, reject) =>
          setTimeout(() => reject(new Error("Profile fetch timed out")), 5000)
        );

        const { data: profile, error: profileError } = await Promise.race([profilePromise, timeoutPromise]);

        if (profileError) {
          console.warn("Profile fetch error (non-critical):", profileError);
        } else {
          console.log("Step 3: Profile fetched:", profile);
          role = profile?.role || data.user?.user_metadata?.role || formData.accountType;
        }
      } catch (profileErr) {
        console.warn("Profile fetch failed (using fallback role):", profileErr.message);
        role = data.user?.user_metadata?.role || formData.accountType;
      }

      console.log("Step 4: Saving user to localStorage and navigating with role:", role);
      // Save user + role to localStorage so RoleRoute can verify the session
      setCurrentUser({
        id: data.user.id,
        email: data.user.email,
        role: role,
        full_name: data.user?.user_metadata?.full_name || "",
      });
      navigate(getDashboardPath(role));
    } catch (unexpectedError) {
      console.error("Unexpected error during login:", unexpectedError);
      setError("Something went wrong. Please try again.");
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
            <h2>Find jobs that match your skill.</h2>
            <p>
              Access your account, manage your profile, and continue your
              SkillSync journey with a cleaner and more modern experience.
            </p>
          </div>
        </section>

        <section className="signin-right">
          <form className="signin-card" onSubmit={handleSubmit}>
            <div className="signin-card-header">
              <span>Sign In</span>
              <h2>Welcome back</h2>
              <p>Sign in to continue your SkillSync journey.</p>
            </div>

            {error && <div className="signin-error">{error}</div>}

            <label>
              <span>Email address</span>
              <input
                type="email"
                name="email"
                placeholder="you@example.com"
                value={formData.email}
                onChange={handleChange}
                required
              />
            </label>

            <label>
              <span>Password</span>
              <input
                type="password"
                name="password"
                placeholder="Enter password"
                value={formData.password}
                onChange={handleChange}
                required
              />
            </label>

            <label>
              <span>Login as</span>
              <select
                name="accountType"
                value={formData.accountType}
                onChange={handleChange}
              >
                <option value="candidate">Job Seeker</option>
                <option value="employer">Employer</option>
              </select>
            </label>

            <button
              type="submit"
              className="signin-submit-btn"
              disabled={loading}
            >
              {loading ? "Signing in..." : "Sign In"}
            </button>

            <p className="signin-footer-text">
              New to SkillSync? <Link to="/sign-up">Create an account</Link>
            </p>
          </form>
        </section>
      </section>
    </main>
  );
}