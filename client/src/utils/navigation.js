export const APPROVER_ROLES = [
  'manager',
  'hr',
  'finance',
  'it',
  'procurement',
  'department_head',
  'administration',
  'executive',
];

/**
 * Resolves the primary dashboard route for an authenticated user based on their roles
 * and password-change requirement.
 *
 * @param {Object|null} user - The user object from AuthContext
 * @returns {string} Route path
 */
export function getDashboardRoute(user) {
  if (!user) return '/login';
  if (user.mustChangePassword) return '/change-password';
  if (user.roles?.includes('admin')) {
    return '/admin/dashboard';
  }
  if (user.roles?.some((r) => APPROVER_ROLES.includes(r))) {
    return '/approver/inbox';
  }
  return '/dashboard';
}
