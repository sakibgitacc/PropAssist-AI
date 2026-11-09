/**
 * Role-based routing utilities for PropAssist AI
 * Maps verified backend roles to dedicated dashboards
 */

export const getDashboardRouteForRole = (role) => {
  const normalized = (role || '').toUpperCase();
  switch (normalized) {
    case 'ADMIN':
    case 'SUPER_ADMIN':
      return '/admin/dashboard';
    case 'SALES_HEAD':
      return '/sales-head/dashboard';
    case 'SALES_EXECUTIVE':
      return '/executive/dashboard';
    case 'BUYER':
      return '/buyer/dashboard';
    default:
      return '/buyer/dashboard';
  }
};

export const getRoleDisplayName = (role) => {
  const normalized = (role || '').toUpperCase();
  switch (normalized) {
    case 'ADMIN':
    case 'SUPER_ADMIN':
      return 'Super Admin';
    case 'SALES_HEAD':
      return 'Sales Head';
    case 'SALES_EXECUTIVE':
      return 'Sales Executive';
    case 'BUYER':
      return 'Verified Buyer';
    default:
      return role || 'User';
  }
};
