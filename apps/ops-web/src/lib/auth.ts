export const AUTH_COOKIE_ACCESS_TOKEN = 'vp_access_token';
export const AUTH_COOKIE_ROLE = 'vp_role';

export type BackofficeRole = 'operator' | 'admin' | 'traveler';

export const OPS_REQUIRED_ROLE: BackofficeRole = 'operator';

export function isRoleAllowed(role: string | undefined | null): boolean {
  return role === OPS_REQUIRED_ROLE;
}

