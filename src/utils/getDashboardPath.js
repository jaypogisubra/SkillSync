import { ROLES } from "./roles";

export function getDashboardPath(role) {
  switch (role) {
    case ROLES.ADMIN:
      return "/admin/dashboard";

    case ROLES.EMPLOYER:
      return "/employer/dashboard";

    case ROLES.CANDIDATE:
      return "/candidate/dashboard";

    default:
      return "/";
  }
}