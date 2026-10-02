import { AppRole } from '@/lib/permissions/rbac';

export interface DemoUser {
  id: string;
  name: string;
  email: string;
  role: AppRole;
  phone: string;
  isActive: boolean;
}

export const DEMO_PASSWORD = 'CampusHMS@2026';

export const DEMO_USERS: Record<string, DemoUser> = {
  'admin@campushms.local': {
    id: 'demo-super-admin-01',
    name: 'Super Administrator',
    email: 'admin@campushms.local',
    role: 'SUPER_ADMIN',
    phone: '+91 98000 00001',
    isActive: true,
  },
  'warden@campushms.local': {
    id: 'demo-warden-01',
    name: 'Chief Warden Dr. Ramesh',
    email: 'warden@campushms.local',
    role: 'WARDEN',
    phone: '+91 98000 00002',
    isActive: true,
  },
  'student@campushms.local': {
    id: 'demo-student-01',
    name: 'Rahul Kumar (Demo Student)',
    email: 'student@campushms.local',
    role: 'STUDENT',
    phone: '+91 98000 00003',
    isActive: true,
  },
  'parent@campushms.local': {
    id: 'demo-parent-01',
    name: 'Mahesh Kumar (Demo Parent)',
    email: 'parent@campushms.local',
    role: 'PARENT',
    phone: '+91 98000 00004',
    isActive: true,
  },
  'security@campushms.local': {
    id: 'demo-security-01',
    name: 'Inspector Ram Singh (Security Desk)',
    email: 'security@campushms.local',
    role: 'SECURITY',
    phone: '+91 98000 00005',
    isActive: true,
  },
  'finance@campushms.local': {
    id: 'demo-finance-01',
    name: 'Rajiv Malhotra (Accounts Officer)',
    email: 'finance@campushms.local',
    role: 'FINANCE',
    phone: '+91 98000 00006',
    isActive: true,
  },
  'maintenance@campushms.local': {
    id: 'demo-maintenance-01',
    name: 'Suresh Kumar (Chief Electrician)',
    email: 'maintenance@campushms.local',
    role: 'MAINTENANCE',
    phone: '+91 98000 00007',
    isActive: true,
  },
};
