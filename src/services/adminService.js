import { supabase } from "./supabase";

function isJobSeeker(role) {
  return role === "candidate" || role === "job_seeker";
}

export async function fetchAdminProfiles() {
  const { data: rpcData, error: rpcError } = await supabase.rpc(
    "admin_get_all_profiles"
  );

  if (!rpcError && Array.isArray(rpcData)) {
    return { data: rpcData, error: null };
  }

  const { data, error } = await supabase.from("profiles").select("*");
  return { data: data || [], error: rpcError || error };
}

export async function fetchAdminDashboardStats() {
  const { data: rpcData, error: rpcError } = await supabase.rpc(
    "admin_get_dashboard_stats"
  );

  if (!rpcError && rpcData) {
    return {
      data: {
        jobSeekers: rpcData.job_seekers ?? 0,
        employers: rpcData.employers ?? 0,
        totalJobs: rpcData.total_jobs ?? 0,
        openJobs: rpcData.open_jobs ?? 0,
        closedJobs: rpcData.closed_jobs ?? 0,
        totalApplications: rpcData.total_applications ?? 0,
      },
      error: null,
    };
  }

  const { data: profiles } = await fetchAdminProfiles();
  const { data: jobs } = await supabase.from("jobs").select("*");
  const { data: applications } = await supabase.from("applications").select("*");

  const profileList = profiles || [];
  const jobList = jobs || [];

  return {
    data: {
      jobSeekers: profileList.filter((p) => isJobSeeker(p.role)).length,
      employers: profileList.filter((p) => p.role === "employer").length,
      totalJobs: jobList.length,
      openJobs: jobList.filter((j) => j.status === "open").length,
      closedJobs: jobList.filter((j) => j.status === "closed").length,
      totalApplications: (applications || []).length,
    },
    error: rpcError,
  };
}

export async function fetchAdminJobs() {
  const { data: rpcData, error: rpcError } = await supabase.rpc(
    "admin_get_all_jobs"
  );

  if (!rpcError && Array.isArray(rpcData)) {
    return {
      data: rpcData.map((job) => ({
        ...job,
        profiles: {
          full_name: job.employer_name,
          email: job.employer_email,
        },
      })),
      error: null,
    };
  }

  const { data, error } = await supabase
    .from("jobs")
    .select("*")
    .order("created_at", { ascending: false });

  return { data: data || [], error: rpcError || error };
}

export function filterJobSeekers(profiles) {
  return (profiles || []).filter((p) => isJobSeeker(p.role));
}

export function filterEmployers(profiles) {
  return (profiles || []).filter((p) => p.role === "employer");
}

export function displayUserName(user) {
  if (user?.full_name?.trim()) return user.full_name.trim();
  if (user?.email?.trim()) {
    const local = user.email.split("@")[0];
    return local.replace(/[._-]+/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
  }
  return "Unnamed User";
}

export async function fetchAdminResumes() {
  const { data, error } = await supabase.rpc("admin_get_all_resumes");
  return { data: data || [], error };
}

export async function fetchAdminApplications() {
  const { data, error } = await supabase.rpc("admin_get_all_applications");
  return { data: data || [], error };
}

export async function toggleUserSuspension(userId, suspendStatus) {
  const { error } = await supabase.rpc("admin_toggle_user_suspension", {
    user_id: userId,
    suspend_status: suspendStatus,
  });
  return { error };
}

export async function deleteUser(userId) {
  const { error } = await supabase.rpc("admin_delete_user", {
    user_id: userId,
  });
  return { error };
}

export async function deleteResume(userId) {
  const { error } = await supabase.rpc("admin_delete_resume", {
    user_id: userId,
  });
  return { error };
}

export async function updateUserProfile(userId, { fullName, email, contactNumber, address, skills, role }) {
  const { error } = await supabase.rpc("admin_update_profile", {
    user_id: userId,
    new_full_name: fullName || "",
    new_email: email || "",
    new_contact_number: contactNumber || "",
    new_address: address || "",
    new_skills: Array.isArray(skills) ? skills.join(",") : skills || "",
    new_role: role || "candidate",
  });
  return { error };
}

