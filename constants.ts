
export const API_BASE_URL = 'https://api.tembhu-lis.gov.in';

export const WUA_NAMES = [
  'Tembhu North Division',
  'Tembhu South Division',
  'Minor Irrigation Zone A',
  'Minor Irrigation Zone B',
  'Sangli District WUA',
  'Irrigation Management Division',
  'Canal District WUA'
];

export const DIVISIONS = ['Tembhu North Division', 'Tembhu South Division', 'Satara Division'];

export const SECTIONS = [
    { id: 'dashboard', label: 'Dashboard', icon: 'fa-home', roles: ['admin', 'wrd_user', 'non_wrd_user'] },
    { id: 'flowmeters', label: 'Flowmeters', icon: 'fa-water', roles: ['admin', 'wrd_user', 'non_wrd_user'] },
    { id: 'apis', label: 'APIs', icon: 'fa-plug', roles: ['admin'] },
    { id: 'manual-entry', label: 'Manual Entry', icon: 'fa-edit', roles: ['admin', 'wrd_user'] },
    { id: 'reports', label: 'Reports', icon: 'fa-chart-bar', roles: ['admin', 'wrd_user'] },
    { id: 'pmgs', label: 'PM GatiShakti', icon: 'fa-globe', roles: ['admin'] },
    { id: 'billing', label: 'Water Entitlement', icon: 'fa-rupee-sign', roles: ['admin', 'wrd_user'] },
    { id: 'all-notifications', label: 'All Notifications', icon: 'fa-bell', roles: ['admin', 'wrd_user', 'non_wrd_user'] },
    { id: 'audit-logs', label: 'Audit Logs', icon: 'fa-history', roles: ['admin'] },
    { id: 'sla-monitoring', label: 'SLA Monitoring', icon: 'fa-chart-line', roles: ['admin', 'wrd_user'] },
    { id: 'support-tickets', label: 'Support Tickets', icon: 'fa-ticket-alt', roles: ['admin', 'wrd_user', 'non_wrd_user'] },
    { id: 'data-archival', label: 'Data Archival', icon: 'fa-archive', roles: ['admin'] },
    { id: 'compliance', label: 'Compliance', icon: 'fa-check-circle', roles: ['admin'] },
    { id: 'change-management', label: 'Change Management', icon: 'fa-tasks', roles: ['admin'] },
    { id: 'financial-tracking', label: 'Financial Tracking', icon: 'fa-money-bill-wave', roles: ['admin'] },
    { id: 'notifications', label: 'Notifications', icon: 'fa-bell', roles: ['admin'] },
    { id: 'settings', label: 'Settings', icon: 'fa-cog', roles: ['admin'] },
    { id: 'help', label: 'Help', icon: 'fa-question-circle', roles: ['admin', 'wrd_user', 'non_wrd_user'] },
];