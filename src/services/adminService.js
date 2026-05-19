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
