export type Role = 'admin' | 'wrd_user' | 'non_wrd_user';

export interface Flowmeter {
  id: string;
  wua: string;
  division: string;
  flowRate: number;
  todayVolume: number;
  totalVolume: number;
  status: 'online' | 'offline' | 'warning';
  lastUpdated: string;
  latitude: number;
  longitude: number;
}

export interface Alert {
  type: 'system' | 'offline' | 'high-flow' | 'low-water';
  title: string;
  message: string;
  time: string;
}

export interface ApiEndpoint {
  id: string;
  name: string;
  type: 'iot' | 'sms' | 'email';
  endpoint: string;
  status: 'active' | 'degraded' | 'offline';
  connectedDevices: number;
  lastSync: Date;
  frequency: string;
  recordsToday: number;
  successRate: string;
  responseTime: number;
  dataVolume: string;
}

export interface Contractor {
    id: string;
    name: string;
    flowmetersCount: number;
    apiType: string;
    endpoint: string;
    successRate: string;
    lastData: Date;
    status: 'active' | 'degraded' | 'offline';
    responseTime: number;
    recordsToday: number;
    dataVolume: string;
}

export interface ApiLog {
    id: string;
    timestamp: Date;
    method: string;
    endpoint: string;
    endpointName: string;
    statusCode: number;
    responseTime: number;
    records: number;
    dataSize: string;
}

export interface SmsMessage {
    id: string;
    timestamp: Date;
    sender: string;
    content: string;
    parsedData: {
        flowmeterId: string;
        flowRate: number;
        volume: number;
        date: string;
        time: string;
    };
    status: 'processed' | 'error';
}

export interface WuaData {
    id: string;
    name: string;
    division: string;
    allocated: number;
    usedToday: number;
    usedMonth: number;
    percentConsumed: number;
    status: 'exceeded' | 'warning' | 'within';
    boundary: [number, number][];
}

export interface NotificationRule {
    id: string;
    name: string;
    trigger: string;
    action: string;
    recipients: string;
    active: boolean;
}

export interface NotificationHistory {
    timestamp: Date;
    rule: string;
    recipient: string;
    message: string;
    channel: string;
    status: 'Delivered' | 'Failed';
}

export interface AppNotification {
    id: string;
    type: string;
    title: string;
    message: string;
    timestamp: Date;
    status: 'read' | 'unread';
    severity: 'critical' | 'high' | 'medium' | 'low';
    icon: string;
}

export interface ScheduledReport {
    id: string;
    name: string;
    type: string;
    frequency: 'Daily' | 'Weekly' | 'Monthly';
    recipients: string;
    nextRun: Date;
    status: 'active' | 'paused';
}

export interface ReportHistory {
    id: string;
    name: string;
    type: string;
    generatedAt: Date;
    generatedBy: string;
    format: 'PDF' | 'CSV' | 'XLSX';
    fileSize: string;
}

export interface GatiShaktiLayer {
    id: string;
    name: string;
    type: 'line' | 'point';
    color: string;
    icon?: string;
    data: [number, number][] | [number, number]; 
}

export interface GatiShaktiProject {
    id: string;
    name: string;
    description: string;
    status: 'Planning' | 'In Progress' | 'Completed' | 'On Hold';
    alignmentScore: number;
    startDate: Date;
    endDate: Date;
    location: [number, number];
    associatedLayers: string[];
}

export interface AuditLog {
    id: string;
    timestamp: Date;
    user: string;
    role: Role;
    action: string;
    entityType: string;
    entityId: string;
    status: 'success' | 'failure';
    ipAddress: string;
}

export interface SlaMetric {
    id: string;
    name: string;
    target: number;
    actual: number;
    status: 'compliant' | 'at_risk' | 'breached';
    description: string;
    unit: '%' | 'min' | 'hrs';
}

export interface ContractorSla {
    contractorId: string;
    contractorName: string;
    uptime: { target: number; actual: number };
    dataFreshness: { target: number; actual: number }; // in minutes
    apiSuccessRate: { target: number; actual: number };
    overallStatus: 'compliant' | 'at_risk' | 'breached';
}

export interface SupportTicket {
    id: string;
    subject: string;
    requester: string;
    assignedTo: string;
    priority: 'critical' | 'high' | 'medium' | 'low';
    status: 'open' | 'in_progress' | 'resolved' | 'closed';
    category: 'Flowmeter Issue' | 'Data Discrepancy' | 'API Problem' | 'UI Bug' | 'General Inquiry';
    createdAt: Date;
    updatedAt: Date;
}

export interface KnowledgeBaseArticle {
    id: string;
    title: string;
    category: 'Getting Started' | 'Troubleshooting' | 'Data Management' | 'Account Settings';
    content: string;
    views: number;
    lastUpdated: Date;
}
