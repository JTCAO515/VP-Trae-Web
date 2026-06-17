export const AUTH_COOKIE_ACCESS_TOKEN = 'vp_access_token';
export const AUTH_COOKIE_ROLE = 'vp_role';

export type BackofficeRole = 'operator' | 'admin' | 'traveler';

export const ADMIN_REQUIRED_ROLE: BackofficeRole = 'admin';

export function isRoleAllowed(role: string | undefined | null): boolean {
  return role === ADMIN_REQUIRED_ROLE;
}

