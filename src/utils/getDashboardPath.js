import { ROLES } from "./roles";

export function getDashboardPath(role) {
  if (role === "job_seeker") {
    return "/candidate/dashboard";
  }

  switch (role) {
    case ROLES.ADMIN:
      return "/admin/dashboard";

    case ROLES.EMPLOYER:
      return "/employer/dashboard";

    case ROLES.CANDIDATE:
      return "/candidate/dashboard";

    default:
      return "/candidate/dashboard";
  }
}