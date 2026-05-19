import { Link, useNavigate } from "react-router-dom";
import "./AdminLogin.css";

export default function AdminLogin() {
  const navigate = useNavigate();

  function handleSubmit(event) {
    event.preventDefault();

    const admin = {
      email: event.target.email.value,
      role: "admin",
    };

    localStorage.setItem("skillsync_user", JSON.stringify(admin));
    navigate("/admin/dashboard");
  }

  return (
    <main className="admin-login-page">
      <section className="admin-login-card">
        <div className="admin-login-showcase">
          <div className="admin-login-brand">
            <div className="admin-login-brand-icon">✓</div>

            <div>
              <h2>SkillSync</h2>
              <p>Find the right match</p>
            </div>
          </div>

          <div className="admin-login-showcase-content">
            <span className="admin-login-chip">Admin Portal</span>

            <div className="admin-login-copy">
              <h1>Manage SkillSync with clarity.</h1>
              <p>
                Access the admin workspace to manage users, job posts,
                employers, and platform records.
              </p>
            </div>
          </div>
        </div>

        <div className="admin-login-form-side">
          <div className="admin-login-form-wrap">
            <h1>Admin access</h1>
            <p>Sign in to manage users, jobs, employers, and reports.</p>

            <form className="admin-login-form" onSubmit={handleSubmit}>
              <label>
                <span>Admin email</span>
                <input
                  name="email"
                  type="email"
                  placeholder="admin@skillsync.com"
                  required
                />
              </label>

              <label>
                <span>Password</span>
                <input
                  name="password"
                  type="password"
                  placeholder="Enter admin password"
                  required
                />
              </label>

              <button type="submit">Login as Admin</button>
            </form>

            <div className="admin-login-footer">
              <p>
                Not an admin? <Link to="/sign-in">Go to user sign in</Link>
              </p>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}