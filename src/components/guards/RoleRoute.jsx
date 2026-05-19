import { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import { supabase } from "../../services/supabase";
import { setCurrentUser } from "../../services/localStorageService";

function normalizeRole(role) {
  if (role === "job_seeker") return "candidate";
  return role || "candidate";
}

function roleIsAllowed(role, allowedRoles) {
  const normalized = normalizeRole(role);
  return allowedRoles.some(
    (allowed) => normalizeRole(allowed) === normalized
  );
}

export default function RoleRoute({ allowedRoles, children }) {
  const [status, setStatus] = useState("checking");

  useEffect(() => {
    async function checkAuth() {
      // Check if we have an admin user in local storage to support local admin accounts
      try {
        const localUserStr = localStorage.getItem("skillsync_user");
        if (localUserStr) {
          const localUser = JSON.parse(localUserStr);
          if (localUser?.role === "admin" && allowedRoles.includes("admin")) {
            setStatus("allowed");
            return;
          }
        }
      } catch (e) {
        console.error("Error parsing local admin session:", e);
      }

      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) {
        setStatus("unauthenticated");
        return;
      }

      const { data: profile } = await supabase
        .from("profiles")
        .select("role, full_name, email")
        .eq("id", session.user.id)
        .maybeSingle();

      const role = normalizeRole(
        profile?.role || session.user?.user_metadata?.role
      );

      setCurrentUser({
        id: session.user.id,
        email: profile?.email || session.user.email,
        role,
        full_name:
          profile?.full_name || session.user?.user_metadata?.full_name || "",
      });

      if (roleIsAllowed(role, allowedRoles)) {
        setStatus("allowed");
      } else {
        setStatus("unauthorized");
      }
    }

    checkAuth();
  }, [allowedRoles]);

  if (status === "checking") {
    return (
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          height: "100vh",
          background: "#f8f9fc",
          flexDirection: "column",
          gap: "1rem",
          fontFamily: "Inter, sans-serif",
          color: "#6b7280",
        }}
      >
        <div
          style={{
            width: 40,
            height: 40,
            border: "3px solid #e5e7eb",
            borderTop: "3px solid #7c3aed",
            borderRadius: "50%",
            animation: "spin 0.8s linear infinite",
          }}
        />
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        <p>Verifying session...</p>
      </div>
    );
  }

  if (status === "unauthenticated") return <Navigate to="/sign-in" replace />;
  if (status === "unauthorized") return <Navigate to="/unauthorized" replace />;
  return children;
}
