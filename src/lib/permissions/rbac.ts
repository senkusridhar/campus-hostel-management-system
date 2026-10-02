export type AppRole =
  | 'SUPER_ADMIN'
  | 'WARDEN'
  | 'STUDENT'
  | 'PARENT'
  | 'SECURITY'
  | 'ACCOUNTANT'
  | 'FINANCE'
  | 'MAINTENANCE';

export interface RoleConfig {
  role: AppRole;
  portalName: string;
  defaultDashboard: string;
  loginRoute: string;
  description: string;
  demoEmail: string;
}

export const ROLE_CONFIGS: Record<string, RoleConfig> = {
  SUPER_ADMIN: {
    role: 'SUPER_ADMIN',
    portalName: 'Super Admin Portal',
    defaultDashboard: '/dashboard/admin',
    loginRoute: '/login/admin',
    description: 'Institution configuration, user management, audit logs & system governance',
    demoEmail: 'admin@campushms.local',
  },
  WARDEN: {
    role: 'WARDEN',
    portalName: 'Hostel Warden Portal',
    defaultDashboard: '/dashboard/warden',
    loginRoute: '/login/warden',
    description: 'Resident management, gate passes, night roll calls & welfare complaints',
    demoEmail: 'warden@campushms.local',
  },
  STUDENT: {
    role: 'STUDENT',
    portalName: 'Student Self-Service Portal',
    defaultDashboard: '/dashboard/student',
    loginRoute: '/login/student',
    description: 'Room details, pass applications, fee payments, mess & maintenance',
    demoEmail: 'student@campushms.local',
  },
  PARENT: {
    role: 'PARENT',
    portalName: 'Parent Welfare Portal',
    defaultDashboard: '/dashboard/parent',
    loginRoute: '/login/parent',
    description: 'Linked ward status, attendance tracking, gate passes & fee receipts',
    demoEmail: 'parent@campushms.local',
  },
  SECURITY: {
    role: 'SECURITY',
    portalName: 'Campus Security Portal',
    defaultDashboard: '/dashboard/security',
    loginRoute: '/login/security',
    description: 'Gate pass check-in/out verification, scanner logs & curfew alerts',
    demoEmail: 'security@campushms.local',
  },
  FINANCE: {
    role: 'FINANCE',
    portalName: 'Finance & Accounts Portal',
    defaultDashboard: '/dashboard/finance',
    loginRoute: '/login/finance',
    description: 'Fee structures, billing, payment verification & student dues ledger',
    demoEmail: 'finance@campushms.local',
  },
  ACCOUNTANT: {
    role: 'ACCOUNTANT',
    portalName: 'Finance & Accounts Portal',
    defaultDashboard: '/dashboard/finance',
    loginRoute: '/login/finance',
    description: 'Fee structures, billing, payment verification & student dues ledger',
    demoEmail: 'finance@campushms.local',
  },
  MAINTENANCE: {
    role: 'MAINTENANCE',
    portalName: 'Facilities Maintenance Portal',
    defaultDashboard: '/dashboard/maintenance',
    loginRoute: '/login/maintenance',
    description: 'Work orders, electrical & plumbing dispatches & ticket status updates',
    demoEmail: 'maintenance@campushms.local',
  },
};

/**
 * Route-to-Role Permission Rules
 */
const ROUTE_PERMISSIONS: { pattern: RegExp; allowedRoles: string[] }[] = [
  // Settings & System Config
  { pattern: /^\/settings(\/.*)?$/, allowedRoles: ['SUPER_ADMIN'] },

  // Role-Specific Dashboards
  { pattern: /^\/dashboard\/admin(\/.*)?$/, allowedRoles: ['SUPER_ADMIN'] },
  { pattern: /^\/dashboard\/warden(\/.*)?$/, allowedRoles: ['SUPER_ADMIN', 'WARDEN'] },
  { pattern: /^\/dashboard\/student(\/.*)?$/, allowedRoles: ['SUPER_ADMIN', 'STUDENT'] },
  { pattern: /^\/dashboard\/parent(\/.*)?$/, allowedRoles: ['SUPER_ADMIN', 'PARENT'] },
  { pattern: /^\/dashboard\/security(\/.*)?$/, allowedRoles: ['SUPER_ADMIN', 'SECURITY'] },
  { pattern: /^\/dashboard\/finance(\/.*)?$/, allowedRoles: ['SUPER_ADMIN', 'FINANCE', 'ACCOUNTANT'] },
  { pattern: /^\/dashboard\/maintenance(\/.*)?$/, allowedRoles: ['SUPER_ADMIN', 'MAINTENANCE'] },

  // Reports
  { pattern: /^\/reports(\/.*)?$/, allowedRoles: ['SUPER_ADMIN', 'WARDEN', 'FINANCE', 'ACCOUNTANT'] },

  // Hostel Layouts & Infrastructure
  { pattern: /^\/hostels(\/.*)?$/, allowedRoles: ['SUPER_ADMIN', 'WARDEN'] },
  { pattern: /^\/blocks(\/.*)?$/, allowedRoles: ['SUPER_ADMIN', 'WARDEN'] },
  { pattern: /^\/floors(\/.*)?$/, allowedRoles: ['SUPER_ADMIN', 'WARDEN'] },
  { pattern: /^\/rooms(\/.*)?$/, allowedRoles: ['SUPER_ADMIN', 'WARDEN', 'STUDENT', 'PARENT', 'MAINTENANCE'] },
  { pattern: /^\/room-allocation(\/.*)?$/, allowedRoles: ['SUPER_ADMIN', 'WARDEN', 'STUDENT'] },

  // Students Directory
  { pattern: /^\/students(\/.*)?$/, allowedRoles: ['SUPER_ADMIN', 'WARDEN', 'SECURITY', 'FINANCE', 'ACCOUNTANT'] },

  // Gate Management
  { pattern: /^\/gate-passes(\/.*)?$/, allowedRoles: ['SUPER_ADMIN', 'WARDEN', 'STUDENT', 'PARENT', 'SECURITY'] },
  { pattern: /^\/gate-activity(\/.*)?$/, allowedRoles: ['SUPER_ADMIN', 'WARDEN', 'SECURITY'] },

  // Complaints & Maintenance
  { pattern: /^\/complaints\/new(\/.*)?$/, allowedRoles: ['SUPER_ADMIN', 'WARDEN', 'STUDENT'] },
  { pattern: /^\/complaints(\/.*)?$/, allowedRoles: ['SUPER_ADMIN', 'WARDEN', 'STUDENT', 'PARENT', 'MAINTENANCE'] },
  { pattern: /^\/maintenance\/tickets(\/.*)?$/, allowedRoles: ['SUPER_ADMIN', 'WARDEN', 'MAINTENANCE', 'STUDENT'] },
  { pattern: /^\/maintenance(\/.*)?$/, allowedRoles: ['SUPER_ADMIN', 'WARDEN', 'MAINTENANCE', 'STUDENT'] },

  // Feedback & Analytics
  { pattern: /^\/feedback\/monthly(\/.*)?$/, allowedRoles: ['SUPER_ADMIN', 'WARDEN', 'STUDENT'] },
  { pattern: /^\/feedback\/analytics(\/.*)?$/, allowedRoles: ['SUPER_ADMIN', 'WARDEN'] },
  { pattern: /^\/feedback(\/.*)?$/, allowedRoles: ['SUPER_ADMIN', 'WARDEN', 'STUDENT'] },

  // Finance, Fees, Invoices & Receipts
  { pattern: /^\/fees(\/.*)?$/, allowedRoles: ['SUPER_ADMIN', 'FINANCE', 'ACCOUNTANT', 'STUDENT', 'PARENT'] },
  { pattern: /^\/invoices(\/.*)?$/, allowedRoles: ['SUPER_ADMIN', 'FINANCE', 'ACCOUNTANT', 'STUDENT', 'PARENT'] },
  { pattern: /^\/payments(\/.*)?$/, allowedRoles: ['SUPER_ADMIN', 'FINANCE', 'ACCOUNTANT', 'STUDENT', 'PARENT'] },
  { pattern: /^\/fines(\/.*)?$/, allowedRoles: ['SUPER_ADMIN', 'FINANCE', 'ACCOUNTANT', 'STUDENT', 'PARENT'] },
  { pattern: /^\/receipts(\/.*)?$/, allowedRoles: ['SUPER_ADMIN', 'FINANCE', 'ACCOUNTANT', 'STUDENT', 'PARENT'] },
  { pattern: /^\/finance(\/.*)?$/, allowedRoles: ['SUPER_ADMIN', 'FINANCE', 'ACCOUNTANT'] },

  // Mess & Meal Rebates
  { pattern: /^\/mess(\/.*)?$/, allowedRoles: ['SUPER_ADMIN', 'WARDEN', 'STUDENT', 'PARENT'] },
  { pattern: /^\/meal-rebates(\/.*)?$/, allowedRoles: ['SUPER_ADMIN', 'WARDEN', 'STUDENT'] },

  // Attendance & Night Roll Call
  { pattern: /^\/night-roll-call(\/.*)?$/, allowedRoles: ['SUPER_ADMIN', 'WARDEN', 'SECURITY'] },
  { pattern: /^\/attendance(\/.*)?$/, allowedRoles: ['SUPER_ADMIN', 'WARDEN', 'PARENT', 'SECURITY'] },

  // Notices (Accessible to all authenticated roles)
  { pattern: /^\/notices(\/.*)?$/, allowedRoles: ['SUPER_ADMIN', 'WARDEN', 'STUDENT', 'PARENT', 'SECURITY', 'FINANCE', 'ACCOUNTANT', 'MAINTENANCE'] },
];

export function getRoleDashboardRoute(role: string): string {
  const normRole = role.toUpperCase();
  if (normRole === 'SUPER_ADMIN' || normRole === 'ADMIN') return '/dashboard/admin';
  if (normRole === 'WARDEN') return '/dashboard/warden';
  if (normRole === 'STUDENT') return '/dashboard/student';
  if (normRole === 'PARENT') return '/dashboard/parent';
  if (normRole === 'SECURITY') return '/dashboard/security';
  if (normRole === 'FINANCE' || normRole === 'ACCOUNTANT') return '/dashboard/finance';
  if (normRole === 'MAINTENANCE') return '/dashboard/maintenance';
  return '/dashboard';
}

export function isRoleAllowedOnRoute(role: string, path: string): boolean {
  const normRole = role.toUpperCase();

  // Super Admin has master authorization across all routes
  if (normRole === 'SUPER_ADMIN') return true;

  // Root dashboard route is accessible to all authenticated users (redirects to their role dashboard)
  if (path === '/dashboard' || path === '/dashboard/') return true;

  for (const rule of ROUTE_PERMISSIONS) {
    if (rule.pattern.test(path)) {
      return rule.allowedRoles.includes(normRole);
    }
  }

  // Default allow if not restricted
  return true;
}
