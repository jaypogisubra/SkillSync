import { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import { supabase } from "../../services/supabase";
import { setCurrentUser } from "../../services/localStorageService";

export default function RoleRoute({ allowedRoles, children }) {
  const [status, setStatus] = useState("checking"); // "checking" | "allowed" | "unauthorized" | "unauthenticated"

  useEffect(() => {
    async function checkAuth() {
      // 1. Try localStorage first (fast path)
      const storedUser = localStorage.getItem("skillsync_user");
      if (storedUser) {
        try {
          const user = JSON.parse(storedUser);
          if (allowedRoles.includes(user.role)) {
            setStatus("allowed");
          } else {
            setStatus("unauthorized");
          }
          return;
        } catch {
          // Corrupted localStorage — fall through to Supabase check
          localStorage.removeItem("skillsync_user");
        }
      }

      // 2. Fallback: check live Supabase session
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) {
        setStatus("unauthenticated");
        return;
      }

      // 3. Fetch role from profiles table
      const { data: profile } = await supabase
        .from("profiles")
        .select("role, full_name, email")
        .eq("id", session.user.id)
        .single();

      const role = profile?.role || session.user?.user_metadata?.role || "candidate";

      // Re-sync localStorage
      setCurrentUser({
        id: session.user.id,
        email: session.user.email,
        role,
        full_name: profile?.full_name || session.user?.user_metadata?.full_name || "",
      });

      if (allowedRoles.includes(role)) {
        setStatus("allowed");
      } else {
        setStatus("unauthorized");
      }
    }

    checkAuth();
  }, []);

  if (status === "checking") {
    return (
      <div style={{
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        height: "100vh",
        background: "#f8f9fc",
        flexDirection: "column",
        gap: "1rem",
        fontFamily: "Inter, sans-serif",
        color: "#6b7280"
      }}>
        <div style={{
          width: 40,
          height: 40,
          border: "3px solid #e5e7eb",
          borderTop: "3px solid #7c3aed",
          borderRadius: "50%",
          animation: "spin 0.8s linear infinite"
        }} />
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        <p>Verifying session...</p>
      </div>
    );
  }

  if (status === "unauthenticated") return <Navigate to="/sign-in" replace />;
  if (status === "unauthorized") return <Navigate to="/unauthorized" replace />;
  return children;
}