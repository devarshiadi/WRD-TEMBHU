import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { Role, Flowmeter, Alert, ApiEndpoint, Contractor, ApiLog, SmsMessage, WuaData, NotificationRule, NotificationHistory, AppNotification, ScheduledReport, ReportHistory, GatiShaktiLayer, GatiShaktiProject, AuditLog, SlaMetric, ContractorSla, SupportTicket, KnowledgeBaseArticle } from './types';
import { SECTIONS, WUA_NAMES, DIVISIONS } from './constants';
import { WaterIcon, ChartLineIcon, BroadcastTowerIcon, ServerIcon, StatusIcon } from './components/icons';

// Add declarations for CDN libraries to satisfy TypeScript
declare const L: any;
declare const Chart: any;

const STATIC_FLOWMETERS: Flowmeter[] = Array.from({ length: 121 }, (_, i) => {
    const id = `TEMBHU_FM_${String(i + 1).padStart(3, '0')}`;
    const wua = WUA_NAMES[Math.floor(Math.random() * WUA_NAMES.length)];
    const division = DIVISIONS[Math.floor(Math.random() * DIVISIONS.length)];
    const statusRand = Math.random();
    let status: 'online' | 'offline' | 'warning' = 'online';
    if (statusRand < 0.08) status = 'offline';
    else if (statusRand < 0.15) status = 'warning';
    
    const lastUpdatedDate = new Date(Date.now() - Math.random() * 24 * 3600 * 1000 * 3); // last 3 days
    const lastUpdated = `${lastUpdatedDate.getFullYear()}-${String(lastUpdatedDate.getMonth() + 1).padStart(2, '0')}-${String(lastUpdatedDate.getDate()).padStart(2, '0')} ${String(lastUpdatedDate.getHours()).padStart(2, '0')}:${String(lastUpdatedDate.getMinutes()).padStart(2, '0')}:${String(lastUpdatedDate.getSeconds()).padStart(2, '0')}`;
    
    const flowRate = status === 'offline' ? 0 : Math.floor(Math.random() * (6000 - 1500) + 1500);
    const todayVolume = status === 'offline' ? 0 : Math.floor(flowRate * (Math.random() * 8 + 4)); // 4-12 hours of flow
    const totalVolume = Math.floor(todayVolume * (Math.random() * 200 + 50));
    
    return {
        id, wua, division, status, lastUpdated, flowRate, todayVolume, totalVolume,
        latitude: 17.05 + (Math.random() - 0.5) * 0.5,
        longitude: 74.5 + (Math.random() - 0.5) * 0.5,
    };
});

const STATIC_CONTRACTORS: Contractor[] = [
    { id: 'C001', name: 'AquaFlow Solutions', flowmetersCount: 25, apiType: 'iot', endpoint: '/v1/data/aquaflow', successRate: '99.8%', lastData: new Date(Date.now() - 3e5), status: 'active', responseTime: 120, recordsToday: 14400, dataVolume: '1.2 GB' },
    { id: 'C002', name: 'HydroTech Inc.', flowmetersCount: 30, apiType: 'iot', endpoint: '/v2/push/hydro', successRate: '98.5%', lastData: new Date(Date.now() - 9e5), status: 'degraded', responseTime: 450, recordsToday: 15120, dataVolume: '1.5 GB' },
    { id: 'C003', name: 'DataStream Connect', flowmetersCount: 15, apiType: 'iot', endpoint: '/stream/v3/post', successRate: '100%', lastData: new Date(Date.now() - 1.2e6), status: 'active', responseTime: 95, recordsToday: 9800, dataVolume: '950 MB' },
    { id: 'C004', name: 'SecureIoT Data', flowmetersCount: 41, apiType: 'iot', endpoint: '/secure/submit', successRate: '92.1%', lastData: new Date(Date.now() - 8.64e7), status: 'offline', responseTime: 1200, recordsToday: 20500, dataVolume: '2.1 GB' },
    { id: 'C005', name: 'FlowMetric Systems', flowmetersCount: 10, apiType: 'iot', endpoint: '/api/fm/data', successRate: '99.9%', lastData: new Date(Date.now() - 6e4), status: 'active', responseTime: 150, recordsToday: 7200, dataVolume: '700 MB' },
    { id: 'C006', name: 'RiverLink Tech', flowmetersCount: 18, apiType: 'iot', endpoint: '/data/riverlink', successRate: '99.5%', lastData: new Date(Date.now() - 2e5), status: 'active', responseTime: 180, recordsToday: 11520, dataVolume: '1.1 GB' },
    { id: 'C007', name: 'Canalytics', flowmetersCount: 22, apiType: 'iot', endpoint: '/canal/push', successRate: '97.2%', lastData: new Date(Date.now() - 3.6e6), status: 'degraded', responseTime: 620, recordsToday: 12800, dataVolume: '1.3 GB' },
    { id: 'C008', name: 'WaterGrid Pro', flowmetersCount: 35, apiType: 'iot', endpoint: '/watergrid/v1/update', successRate: '99.9%', lastData: new Date(Date.now() - 5e4), status: 'active', responseTime: 85, recordsToday: 18800, dataVolume: '1.9 GB' },
];

const STATIC_API_LOGS: ApiLog[] = Array.from({ length: 500 }, (_, i) => {
    const timestamp = new Date(Date.now() - i * 3e4 * Math.random());
    const methods = ['POST', 'GET'];
    const endpoints = [
        { name: 'AquaFlow', endpoint: '/v1/data/aquaflow' },
        { name: 'HydroTech', endpoint: '/v2/push/hydro' },
        { name: 'DataStream', endpoint: '/stream/v3/post' },
        { name: 'SecureIoT', endpoint: '/secure/submit' },
        { name: 'FlowMetric', endpoint: '/api/fm/data' },
        { name: 'RiverLink', endpoint: '/data/riverlink' },
        { name: 'Canalytics', endpoint: '/canal/push' },
        { name: 'WaterGrid', endpoint: '/watergrid/v1/update' },
        { name: 'System', endpoint: '/system/health' },
        { name: 'Reports', endpoint: '/reports/generate' },
    ];
    const endpointData = endpoints[Math.floor(Math.random() * endpoints.length)];
    const rand = Math.random();
    let statusCode: number;
    if (rand < 0.85) statusCode = 200;
    else if (rand < 0.95) statusCode = 404;
    else statusCode = 500;
    
    return {
        id: `log-${timestamp.getTime()}-${i}`,
        timestamp,
        method: methods[Math.floor(Math.random() * methods.length)],
        endpointName: endpointData.name,
        endpoint: endpointData.endpoint,
        statusCode,
        responseTime: Math.floor(Math.random() * 500) + 50,
        records: statusCode === 200 ? Math.floor(Math.random() * 10) + 1 : 0,
        dataSize: `${(Math.random() * 1.5).toFixed(2)} KB`
    };
});

const STATIC_SMS_MESSAGES: SmsMessage[] = [
    { id: 'sms001', timestamp: new Date(Date.now() - 1.8e6), sender: '+919876543210', content: 'ID:TEMBHU_FM_015,FR:2500,V:12000,D:230724,T:1430', parsedData: { flowmeterId: 'TEMBHU_FM_015', flowRate: 2500, volume: 12000, date: '23/07/24', time: '14:30' }, status: 'processed' },
    { id: 'sms002', timestamp: new Date(Date.now() - 3.6e6), sender: '+919123456789', content: 'ID:TEMBHU_FM_022,FR:3100,V:15500,D:230724,T:1400', parsedData: { flowmeterId: 'TEMBHU_FM_022', flowRate: 3100, volume: 15500, date: '23/07/24', time: '14:00' }, status: 'processed' },
    { id: 'sms003', timestamp: new Date(Date.now() - 5.4e6), sender: '+919876543211', content: 'ID:INVALID_ID,FR:1800,V:9000', parsedData: { flowmeterId: 'N/A', flowRate: 1800, volume: 9000, date: 'N/A', time: 'N/A' }, status: 'error' },
    { id: 'sms004', timestamp: new Date(Date.now() - 7.2e6), sender: '+919123456780', content: 'ID:TEMBHU_FM_050,FR:4500,V:22500,D:230724,T:1330', parsedData: { flowmeterId: 'TEMBHU_FM_050', flowRate: 4500, volume: 22500, date: '23/07/24', time: '13:30' }, status: 'processed' },
    { id: 'sms005', timestamp: new Date(Date.now() - 9e6), sender: '+919876543212', content: 'DATA:TEMBHU_FM_089,RATE:1200,VOL:6000,TS:2307241300', parsedData: { flowmeterId: 'TEMBHU_FM_089', flowRate: 1200, volume: 6000, date: '23/07/24', time: '13:00' }, status: 'processed' },
    { id: 'sms006', timestamp: new Date(Date.now() - 1.08e7), sender: '+919123456781', content: 'FM099 FR3300 V16500 D230724 T1230', parsedData: { flowmeterId: 'N/A', flowRate: 3300, volume: 16500, date: '23/07/24', time: '12:30' }, status: 'error' },
];

interface ManualEntry {
    id: string;
    flowmeterId: string;
    entryTimestamp: Date;
    readingTimestamp: Date;
    flowRate: number;
    todayVolume: number;
    enteredBy: string;
    status: 'approved' | 'pending' | 'rejected';
    remarks?: string;
}

const STATIC_MANUAL_ENTRIES: ManualEntry[] = Array.from({ length: 35 }, (_, i) => {
    const entryTimestamp = new Date(Date.now() - i * 86400000 * Math.random());
    const readingTimestamp = new Date(entryTimestamp.getTime() - 3600000 * Math.random());
    const statuses: Array<'approved' | 'pending' | 'rejected'> = ['approved', 'pending', 'rejected'];
    return {
        id: `ME-${String(1001 + i).padStart(4, '0')}`,
        flowmeterId: STATIC_FLOWMETERS[Math.floor(Math.random() * STATIC_FLOWMETERS.length)].id,
        entryTimestamp,
        readingTimestamp,
        flowRate: Math.floor(Math.random() * 4000) + 1000,
        todayVolume: Math.floor(Math.random() * 50000) + 5000,
        enteredBy: Math.random() > 0.4 ? 'Admin User' : 'WRD Operator',
        status: statuses[Math.floor(Math.random() * statuses.length)],
        remarks: Math.random() > 0.6 ? 'Offline reading due to network issue.' : undefined,
    };
});

const STATIC_SCHEDULED_REPORTS: ScheduledReport[] = [
    { id: 'SR001', name: 'Daily WUA Summary', type: 'WUA Consumption', frequency: 'Daily', recipients: 'wrd-heads@gov.in, sangli-wua@gov.in', nextRun: new Date(new Date().setHours(2, 0, 0, 0) + 86400000), status: 'active' },
    { id: 'SR002', name: 'Weekly Offline Flowmeter Report', type: 'Flowmeter Performance', frequency: 'Weekly', recipients: 'maintenance-team@gov.in', nextRun: new Date(new Date().setDate(new Date().getDate() + (7 - new Date().getDay() + 1) % 7)), status: 'active' },
    { id: 'SR003', name: 'Monthly Compliance Audit', type: 'Compliance', frequency: 'Monthly', recipients: 'audit-dept@gov.in', nextRun: new Date(new Date().getFullYear(), new Date().getMonth() + 1, 1), status: 'active' },
    { id: 'SR004', name: 'High-Usage Alert Report', type: 'Alert Summary', frequency: 'Daily', recipients: 'ops-center@gov.in', nextRun: new Date(new Date().setHours(8, 0, 0, 0) + 86400000), status: 'paused' },
];

const STATIC_REPORT_HISTORY: ReportHistory[] = Array.from({ length: 25 }, (_, i) => {
    const reportTypes = ['Daily Water Usage', 'Flowmeter Performance', 'WUA Consumption', 'Compliance Report'];
    const formats: Array<'PDF' | 'CSV' | 'XLSX'> = ['PDF', 'CSV', 'XLSX'];
    const generatedAt = new Date(Date.now() - i * (86400000 / 2) * (Math.random() + 0.5));
    const type = reportTypes[Math.floor(Math.random() * reportTypes.length)];

    return {
        id: `RH-${String(20240701 - i).padStart(8, '0')}`,
        name: `${type} - ${generatedAt.toLocaleDateString('en-GB')}`,
        type,
        generatedAt,
        generatedBy: Math.random() > 0.3 ? 'Admin User' : 'WRD Supervisor',
        format: formats[Math.floor(Math.random() * formats.length)],
        fileSize: `${(Math.random() * 5 + 0.5).toFixed(1)} MB`
    };
});

const STATIC_GATI_SHAKTI_LAYERS: GatiShaktiLayer[] = [
    { id: 'water-pipelines', name: 'Water Pipelines', type: 'line', color: '#0ea5e9', data: [[17.25, 74.3], [17.15, 74.4], [17.05, 74.5], [16.95, 74.6]] },
    { id: 'canals', name: 'Canal Network', type: 'line', color: '#3b82f6', data: [[17.3, 74.55], [17.2, 74.6], [17.1, 74.65], [17.0, 74.7]] },
    { id: 'roads', name: 'National Highways', type: 'line', color: '#f59e0b', data: [[16.8, 74.2], [17.0, 74.4], [17.2, 74.6], [17.4, 74.8]] },
    { id: 'power-lines', name: 'Power Transmission', type: 'line', color: '#f43f5e', data: [[17.3, 74.2], [17.2, 74.35], [17.1, 74.5], [17.0, 74.65]] },
    { id: 'pumping-stations', name: 'Pumping Stations', type: 'point', color: '#10b981', icon: 'fa-water', data: [] },
    { id: 'substations', name: 'Electrical Substations', type: 'point', color: '#facc15', icon: 'fa-bolt', data: [] },
];

const STATIC_GATI_SHAKTI_PROJECTS: GatiShaktiProject[] = [
    { id: 'PROJ001', name: 'Main Canal Expansion', description: 'Expansion of the main Tembhu canal to increase water carrying capacity by 20%.', status: 'In Progress', alignmentScore: 92, startDate: new Date('2023-01-15'), endDate: new Date('2025-06-30'), location: [17.10, 74.60], associatedLayers: ['canals', 'roads'] },
    { id: 'PROJ002', name: 'PS-3 Pump Upgrade', description: 'Upgrading pumps at Pumping Station 3 for higher efficiency and output.', status: 'Completed', alignmentScore: 88, startDate: new Date('2022-09-01'), endDate: new Date('2023-11-20'), location: [17.20, 74.45], associatedLayers: ['pumping-stations', 'power-lines'] },
    { id: 'PROJ003', name: 'North Division Pipeline', description: 'New pipeline network for the Tembhu North Division to cover 5000 new hectares.', status: 'Planning', alignmentScore: 95, startDate: new Date('2024-08-01'), endDate: new Date('2026-12-31'), location: [17.30, 74.50], associatedLayers: ['water-pipelines', 'roads'] },
    { id: 'PROJ004', name: 'SCADA System Integration', description: 'Integration of all flowmeters with a centralized SCADA system.', status: 'In Progress', alignmentScore: 85, startDate: new Date('2023-05-10'), endDate: new Date('2024-10-15'), location: [17.05, 74.55], associatedLayers: ['power-lines'] },
    { id: 'PROJ005', name: 'Solar Power for PS-1', description: 'Feasibility study for a 5MW solar plant to power Pumping Station 1.', status: 'On Hold', alignmentScore: 78, startDate: new Date('2024-02-01'), endDate: new Date('2024-07-30'), location: [17.00, 74.35], associatedLayers: ['pumping-stations', 'power-lines'] },
    { id: 'PROJ006', name: 'South Division Automation', description: 'Automating gate controls for the South Division canal network.', status: 'Completed', alignmentScore: 91, startDate: new Date('2022-11-01'), endDate: new Date('2024-04-10'), location: [16.95, 74.65], associatedLayers: ['canals'] },
];

const STATIC_WUA_DATA: WuaData[] = WUA_NAMES.map((name, i) => {
    const allocated = Math.floor(Math.random() * 100000) + 50000;
    const consumptionRatio = Math.random() * 1.2; // can go up to 120%
    const usedMonth = Math.floor(allocated * consumptionRatio);
    const percentConsumed = Math.round((usedMonth / allocated) * 100);
    
    let status: 'within' | 'warning' | 'exceeded' = 'within';
    if (percentConsumed > 100) status = 'exceeded';
    else if (percentConsumed > 80) status = 'warning';

    const centerLat = 17.05 + (Math.random() - 0.5) * 0.4;
    const centerLng = 74.5 + (Math.random() - 0.5) * 0.4;
    const size = 0.05 + Math.random() * 0.05;
    
    return {
        id: `WUA_${String(i + 1).padStart(3, '0')}`,
        name: name,
        division: DIVISIONS[i % DIVISIONS.length],
        allocated: allocated,
        usedMonth: usedMonth,
        usedToday: Math.floor(usedMonth / 30 * (Math.random() * 0.5 + 0.75)),
        percentConsumed: percentConsumed,
        status: status,
        boundary: [
            [centerLat - size, centerLng - size],
            [centerLat + size, centerLng - size],
            [centerLat + size, centerLng + size],
            [centerLat - size, centerLng + size],
        ],
    };
});

const STATIC_NOTIFICATION_RULES: NotificationRule[] = [
    { id: 'NR001', name: 'Flowmeter Offline Alert', trigger: 'Flowmeter status is "offline" for > 1 hour', action: 'Send SMS to Maintenance Team', recipients: 'Maintenance Leads', active: true },
    { id: 'NR002', name: 'High Flow Rate Warning', trigger: 'Flow rate > 5000 m³/hr', action: 'Send Email to WRD Supervisor', recipients: 'wrd-supervisor@gov.in', active: true },
    { id: 'NR003', name: 'WUA Consumption Exceeded', trigger: 'WUA monthly consumption > 100%', action: 'Create critical notification', recipients: 'Admin, WUA Head', active: true },
    { id: 'NR004', name: 'API Endpoint Failure', trigger: 'API endpoint fails 3 consecutive times', action: 'Send Email to IT Department', recipients: 'it-support@gov.in', active: false },
    { id: 'NR005', name: 'Low Flow Rate Anomaly', trigger: 'Flow rate < 500 m³/hr during peak hours', action: 'Create medium notification', recipients: 'Operations Center', active: true },
];

const STATIC_NOTIFICATION_HISTORY: NotificationHistory[] = Array.from({ length: 50 }, (_, i) => {
    const rules = ['Flowmeter Offline Alert', 'High Flow Rate Warning', 'WUA Consumption Exceeded'];
    const channels = ['SMS', 'Email', 'In-App'];
    const statuses: Array<'Delivered' | 'Failed'> = Math.random() > 0.9 ? ['Failed'] : ['Delivered'];
    return {
        timestamp: new Date(Date.now() - i * 3600000 * Math.random()),
        rule: rules[Math.floor(Math.random() * rules.length)],
        recipient: Math.random() > 0.5 ? '+919876543210' : 'user@example.com',
        message: 'Alert: TEMBHU_FM_042 is offline.',
        channel: channels[Math.floor(Math.random() * channels.length)],
        status: statuses[0],
    };
});

const STATIC_APP_NOTIFICATIONS: AppNotification[] = Array.from({ length: 75 }, (_, i) => {
    const types = [
        { type: 'Offline', title: 'Flowmeter Offline', severity: 'critical', icon: 'fa-wifi-slash' },
        { type: 'High Flow', title: 'High Flow Rate Alert', severity: 'high', icon: 'fa-tachometer-alt-fast' },
        { type: 'System', title: 'System Maintenance', severity: 'low', icon: 'fa-tools' },
        { type: 'Data Anomaly', title: 'Unusual Data Pattern Detected', severity: 'medium', icon: 'fa-chart-pie' },
        { type: 'Billing', title: 'WUA Exceeded Allocation', severity: 'high', icon: 'fa-file-invoice-dollar' }
    ] as const;
    const selectedType = types[Math.floor(Math.random() * types.length)];
    const fm = `TEMBHU_FM_${String(Math.floor(Math.random() * 121) + 1).padStart(3, '0')}`;
    return {
        id: `AN${1000 + i}`,
        type: selectedType.type,
        title: selectedType.title,
        message: `${selectedType.title} detected for flowmeter ${fm}. Please investigate immediately.`,
        timestamp: new Date(Date.now() - i * 1800000 * Math.random()),
        status: Math.random() > 0.3 ? 'unread' : 'read',
        severity: selectedType.severity,
        icon: selectedType.icon,
    };
});

const STATIC_AUDIT_LOGS: AuditLog[] = Array.from({ length: 200 }, (_, i) => {
    const users = [
        { user: 'Admin User', role: 'admin' },
        { user: 'WRD Supervisor', role: 'wrd_user' },
        { user: 'wrd-operator-01', role: 'wrd_user' },
        { user: 'wua-head-sangli', role: 'non_wrd_user' },
    ] as const;
    const actions = [
        { action: 'User Login', entityType: 'User', entityIdPrefix: 'USR' },
        { action: 'Updated Flowmeter Settings', entityType: 'Flowmeter', entityIdPrefix: 'TEMBHU_FM' },
        { action: 'Generated Report', entityType: 'Report', entityIdPrefix: 'REP' },
        { action: 'Deleted Manual Entry', entityType: 'Manual Entry', entityIdPrefix: 'ME' },
        { action: 'Failed Login Attempt', entityType: 'User', entityIdPrefix: 'USR' },
        { action: 'Viewed Audit Logs', entityType: 'System', entityIdPrefix: 'SYS' },
        { action: 'Changed User Permissions', entityType: 'User', entityIdPrefix: 'USR' },
    ] as const;

    const selectedUser = users[Math.floor(Math.random() * users.length)];
    const selectedAction = actions[Math.floor(Math.random() * actions.length)];
    const status = selectedAction.action.includes('Failed') ? 'failure' : (Math.random() > 0.05 ? 'success' : 'failure');

    return {
        id: `AUDIT-${Date.now() - i * 100000}-${i}`,
        timestamp: new Date(Date.now() - i * 360000 * (Math.random() + 0.2)),
        user: selectedUser.user,
        role: selectedUser.role,
        action: selectedAction.action,
        entityType: selectedAction.entityType,
        entityId: `${selectedAction.entityIdPrefix}-${String(Math.floor(Math.random() * 200) + 1).padStart(3, '0')}`,
        status: status,
        ipAddress: `192.168.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}`
    };
});

const STATIC_SLA_METRICS: SlaMetric[] = [
    { id: 'uptime', name: 'Overall System Uptime', target: 99.9, actual: 99.95, status: 'compliant', description: 'Availability of the core monitoring platform.', unit: '%' },
    { id: 'fm_uptime', name: 'Flowmeter Uptime', target: 98.0, actual: 98.7, status: 'compliant', description: 'Percentage of flowmeters online and reporting.', unit: '%' },
    { id: 'data_freshness', name: 'Data Freshness', target: 15, actual: 12.5, status: 'compliant', description: 'Average delay between data capture and system availability.', unit: 'min' },
    { id: 'api_success', name: 'API Success Rate', target: 99.5, actual: 99.1, status: 'at_risk', description: 'Successful API requests from contractors.', unit: '%' },
    { id: 'report_gen', name: 'Report Generation Time', target: 5, actual: 6.2, status: 'breached', description: 'Time to generate standard daily reports.', unit: 'min' },
    { id: 'ticket_res', name: 'Support Ticket Resolution', target: 24, actual: 18.5, status: 'compliant', description: 'Average time to close high-priority support tickets.', unit: 'hrs' },
];

const STATIC_CONTRACTOR_SLAS: ContractorSla[] = STATIC_CONTRACTORS.map(c => {
    const uptimeActual = 98 + Math.random() * 2.5; // 98-100.5
    const freshnessActual = 10 + Math.random() * 10; // 10-20
    const successActual = 98 + Math.random() * 2.1; // 98-100.1
    
    let compliantCount = 0;
    if (uptimeActual >= 99.0) compliantCount++;
    if (freshnessActual <= 15) compliantCount++;
    if (successActual >= 99.5) compliantCount++;
    
    let status: 'compliant' | 'at_risk' | 'breached' = 'compliant';
    if (compliantCount < 2) status = 'breached';
    else if (compliantCount < 3) status = 'at_risk';

    return {
        contractorId: c.id,
        contractorName: c.name,
        uptime: { target: 99.0, actual: parseFloat(uptimeActual.toFixed(2)) },
        dataFreshness: { target: 15, actual: parseFloat(freshnessActual.toFixed(1)) },
        apiSuccessRate: { target: 99.5, actual: parseFloat(successActual.toFixed(2)) },
        overallStatus: status,
    };
});

const STATIC_SUPPORT_TICKETS: SupportTicket[] = Array.from({ length: 80 }, (_, i) => {
    const requesters = ['Admin User', 'WRD Supervisor', 'wua-head-sangli', 'wrd-operator-01', 'external-audit'];
    const assignees = ['Support Team L1', 'Support Team L2', 'Dev Team', 'Unassigned'];
    const priorities: SupportTicket['priority'][] = ['critical', 'high', 'medium', 'low'];
    const statuses: SupportTicket['status'][] = ['open', 'in_progress', 'resolved', 'closed'];
    const categories: SupportTicket['category'][] = ['Flowmeter Issue', 'Data Discrepancy', 'API Problem', 'UI Bug', 'General Inquiry'];
    const subjects = [
        'Flowmeter TEMBHU_FM_012 is offline', 'Incorrect reading for WUA Zone A', 'API endpoint for HydroTech is slow',
        'Cannot download monthly report', 'Request for new user account', 'Dashboard chart not loading', 'Data from SMS gateway is delayed'
    ];

    const createdAt = new Date(Date.now() - (i * 86400000 / 4 * Math.random()));
    const status = statuses[Math.floor(Math.random() * statuses.length)];
    const updatedAt = new Date(createdAt.getTime() + Math.random() * (Date.now() - createdAt.getTime()));

    return {
        id: `TKT-${String(7000 + i).padStart(5, '0')}`,
        subject: subjects[Math.floor(Math.random() * subjects.length)],
        requester: requesters[Math.floor(Math.random() * requesters.length)],
        assignedTo: assignees[Math.floor(Math.random() * assignees.length)],
        priority: priorities[Math.floor(Math.random() * priorities.length)],
        status: status,
        category: categories[Math.floor(Math.random() * categories.length)],
        createdAt,
        updatedAt: status !== 'open' ? updatedAt : createdAt,
    };
});

const STATIC_KB_ARTICLES: KnowledgeBaseArticle[] = [
    { id: 'KB001', title: 'How to troubleshoot an offline flowmeter', category: 'Troubleshooting', content: '...', views: 125, lastUpdated: new Date('2024-07-15') },
    { id: 'KB002', title: 'Understanding your WUA water entitlement dashboard', category: 'Getting Started', content: '...', views: 210, lastUpdated: new Date('2024-06-20') },
    { id: 'KB003', title: 'How to generate a custom report', category: 'Data Management', content: '...', views: 88, lastUpdated: new Date('2024-07-01') },
    { id: 'KB004', title: 'Resetting your account password', category: 'Account Settings', content: '...', views: 350, lastUpdated: new Date('2024-05-10') },
    { id: 'KB005', title: 'Why is my data not updating in real-time?', category: 'Troubleshooting', content: '...', views: 155, lastUpdated: new Date('2024-07-18') },
    { id: 'KB006', title: 'Adding a new user to your WUA group', category: 'Account Settings', content: '...', views: 75, lastUpdated: new Date('2024-07-05') },
];

const generateAlerts = (): Alert[] => {
    const alertTypes = [
        { type: 'system', title: 'System Update', message: 'System maintenance scheduled for tonight' },
        { type: 'offline', title: 'Flowmeter Offline', message: 'TEMBHU_FM_045 connection lost' },
        { type: 'high-flow', title: 'High Flow Alert', message: 'Flow rate exceeded threshold at TEMBHU_FM_089' },
        { type: 'low-water', title: 'Low Water Level', message: 'Water level below minimum at Zone B' },
        { type: 'system', title: 'Data Sync Complete', message: 'Daily data synchronization completed successfully' }
    ] as const;
    return alertTypes.map((alert, index) => ({...alert, time: new Date(Date.now() - index * 1800000).toLocaleTimeString() }));
};

const generateChartData = (timeRange: '24h' | '7d' | '30d' | '12m') => {
    switch (timeRange) {
        case '24h':
            return {
                labels: Array.from({ length: 24 }, (_, i) => `${String(i).padStart(2, '0')}:00`),
                data: Array.from({ length: 24 }, () => Math.floor(Math.random() * (150 - 50) + 50)),
                label: 'Water Supply (m³/hr)',
            };
        case '7d':
             const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
             const today = new Date().getDay();
            return {
                labels: [...days.slice(today + 1), ...days.slice(0, today + 1)],
                data: Array.from({ length: 7 }, () => Math.floor(Math.random() * (5000 - 3000) + 3000)),
                label: 'Water Supply (m³)',
            };
        case '30d':
            return {
                labels: Array.from({ length: 30 }, (_, i) => `${i + 1}`),
                data: Array.from({ length: 30 }, () => Math.floor(Math.random() * (6000 - 4000) + 4000)),
                label: 'Water Supply (m³)',
            };
        case '12m':
        default:
            return {
                labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
                data: [120, 135, 140, 130, 150, 165, 160, 175, 180, 190, 200, 210].map(v => v * 1000), // To simulate larger numbers
                label: 'Water Supply (m³)',
            };
    }
};


const LineChartComponent: React.FC<{ theme: 'light' | 'dark', timeRange: '24h' | '7d' | '30d' | '12m' }> = ({ theme, timeRange }) => {
    const chartRef = useRef<HTMLCanvasElement>(null);
    const chartInstanceRef = useRef<any>(null);
    const chartData = useMemo(() => generateChartData(timeRange), [timeRange]);

    useEffect(() => {
        if (chartRef.current) {
            if (chartInstanceRef.current) {
                chartInstanceRef.current.destroy();
            }
            const ctx = chartRef.current.getContext('2d');
            if (ctx) {
                const isDark = theme === 'dark';
                const gridColor = isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)';
                const textColor = isDark ? '#cbd5e1' : '#475569';

                chartInstanceRef.current = new Chart(ctx, {
                    type: 'line',
                    data: {
                        labels: chartData.labels,
                        datasets: [{
                            label: chartData.label,
                            data: chartData.data,
                            borderColor: '#06b6d4',
                            backgroundColor: 'rgba(6, 182, 212, 0.1)',
                            fill: true,
                            tension: 0.4,
                        }]
                    },
                    options: {
                        responsive: true,
                        maintainAspectRatio: false,
                        plugins: {
                            legend: {
                                display: false,
                            }
                        },
                        scales: {
                            y: {
                                beginAtZero: false,
                                grid: { color: gridColor, drawBorder: false },
                                ticks: { color: textColor, padding: 10, font: { size: 10 } }
                            },
                            x: {
                                grid: { display: false },
                                ticks: { color: textColor, padding: 10, font: { size: 10 } }
                            }
                        },
                        interaction: {
                            intersect: false,
                            mode: 'index',
                        },
                    }
                });
            }
        }
        return () => {
            if (chartInstanceRef.current) {
                chartInstanceRef.current.destroy();
            }
        };
    }, [theme, chartData]);

    return <canvas ref={chartRef}></canvas>;
};

const StatusDistributionChart: React.FC<{ flowmeters: Flowmeter[], theme: 'light' | 'dark' }> = ({ flowmeters, theme }) => {
    const chartRef = useRef<HTMLCanvasElement>(null);
    const chartInstanceRef = useRef<any>(null);

    const statusCounts = useMemo(() => {
        const counts = { online: 0, offline: 0, warning: 0 };
        flowmeters.forEach(fm => {
            counts[fm.status]++;
        });
        return counts;
    }, [flowmeters]);

    useEffect(() => {
        if (chartRef.current) {
            if (chartInstanceRef.current) {
                chartInstanceRef.current.destroy();
            }
            const ctx = chartRef.current.getContext('2d');
            if (ctx) {
                const isDark = theme === 'dark';
                const textColor = isDark ? '#cbd5e1' : '#475569';

                chartInstanceRef.current = new Chart(ctx, {
                    type: 'doughnut',
                    data: {
                        labels: ['Online', 'Offline', 'Warning'],
                        datasets: [{
                            data: [statusCounts.online, statusCounts.offline, statusCounts.warning],
                            backgroundColor: ['#22c55e', '#ef4444', '#f59e0b'],
                            borderColor: isDark ? '#1f2937' : '#ffffff',
                            borderWidth: 2,
                            hoverOffset: 4,
                        }]
                    },
                    options: {
                        responsive: true,
                        maintainAspectRatio: false,
                        cutout: '70%',
                        plugins: {
                            legend: {
                                position: 'bottom',
                                labels: {
                                    color: textColor,
                                    padding: 15,
                                    usePointStyle: true,
                                    pointStyle: 'circle',
                                    font: { size: 10 }
                                },
                            },
                        },
                    }
                });
            }
        }
        return () => {
            if (chartInstanceRef.current) {
                chartInstanceRef.current.destroy();
            }
        };
    }, [theme, statusCounts]);

    return <canvas ref={chartRef}></canvas>;
};

const MapComponent: React.FC<{ flowmeters: Flowmeter[] }> = ({ flowmeters }) => {
    const mapContainerRef = useRef<HTMLDivElement>(null);
    const mapInstanceRef = useRef<any>(null);

    const statusColors = {
        online: '#22c55e', // green-500
        offline: '#ef4444', // red-500
        warning: '#f59e0b', // amber-500
    };

    useEffect(() => {
        if (mapContainerRef.current && !mapInstanceRef.current) {
            const indiaBounds = L.latLngBounds(L.latLng(6, 68), L.latLng(37, 98));
            const map = L.map(mapContainerRef.current, { 
                zoomControl: false,
                maxBounds: indiaBounds,
                maxBoundsViscosity: 1.0,
            }).setView([17.05, 74.5], 9);
            
            L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager_labels_under/{z}/{x}/{y}{r}.png', {
                attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
                subdomains: 'abcd',
                maxZoom: 20
            }).addTo(map);
            L.control.zoom({ position: 'topright' }).addTo(map);
            mapInstanceRef.current = map;
        }

        if (mapInstanceRef.current && flowmeters.length > 0) {
            setTimeout(() => {
                mapInstanceRef.current?.invalidateSize();
            }, 0);

            mapInstanceRef.current.eachLayer((layer: any) => {
                if (layer instanceof L.CircleMarker) {
                    mapInstanceRef.current.removeLayer(layer);
                }
            });

            const markers = flowmeters.map(fm => {
                const marker = L.circleMarker([fm.latitude, fm.longitude], {
                    radius: 7,
                    fillColor: statusColors[fm.status],
                    color: '#fff',
                    weight: 2,
                    opacity: 1,
                    fillOpacity: 0.9
                });

                marker.bindPopup(`
                    <div style="font-family: Inter, sans-serif; font-size: 14px; min-width: 180px;">
                        <strong style="color: #0891b2;">${fm.id}</strong><br>
                        <span style="font-size: 12px; color: #64748b;">${fm.wua}</span><br><br>
                        Flow: <strong>${fm.flowRate.toLocaleString()} m³/hr</strong><br>
                        Status: <span style="text-transform: capitalize; font-weight: 500; color: ${statusColors[fm.status]};">${fm.status}</span>
                    </div>
                `, { closeButton: false });

                marker.on('mouseover', function (this: any) { this.openPopup(); });
                marker.on('mouseout', function (this: any) { this.closePopup(); });
                
                marker.addTo(mapInstanceRef.current);
                return marker;
            });
            
            if (markers.length > 0) {
                 const group = new L.featureGroup(markers);
                 mapInstanceRef.current.fitBounds(group.getBounds().pad(0.1));
            }
        }

    }, [flowmeters]);

    return <div ref={mapContainerRef} className="h-full w-full bg-slate-200 dark:bg-slate-700" />;
};


const FlowmetersSection: React.FC<{ flowmeters: Flowmeter[] }> = ({ flowmeters }) => {
    const [searchTerm, setSearchTerm] = useState('');
    const [wuaFilter, setWuaFilter] = useState('all');
    const [divisionFilter, setDivisionFilter] = useState('all');
    const [statusFilter, setStatusFilter] = useState<'all' | 'online' | 'offline' | 'warning'>('all');
    const [sortConfig, setSortConfig] = useState<{ key: keyof Flowmeter | null; direction: 'asc' | 'desc' }>({ key: 'id', direction: 'asc' });
    const [currentPage, setCurrentPage] = useState(1);
    const [selectedFlowmeters, setSelectedFlowmeters] = useState<Set<string>>(new Set());
    const itemsPerPage = 10;

    const sortedAndFilteredFlowmeters = useMemo(() => {
        let filtered = flowmeters.filter(fm => {
            const searchLower = searchTerm.toLowerCase();
            const matchesSearch = !searchTerm ||
                fm.id.toLowerCase().includes(searchLower) ||
                fm.wua.toLowerCase().includes(searchLower) ||
                fm.division.toLowerCase().includes(searchLower);
            
            const matchesWua = wuaFilter === 'all' || fm.wua === wuaFilter;
            const matchesDivision = divisionFilter === 'all' || fm.division === divisionFilter;
            const matchesStatus = statusFilter === 'all' || fm.status === statusFilter;

            return matchesSearch && matchesWua && matchesDivision && matchesStatus;
        });

        if (sortConfig.key) {
            filtered.sort((a, b) => {
                const aValue = a[sortConfig.key!];
                const bValue = b[sortConfig.key!];
                if (aValue < bValue) return sortConfig.direction === 'asc' ? -1 : 1;
                if (aValue > bValue) return sortConfig.direction === 'asc' ? 1 : -1;
                return 0;
            });
        }

        return filtered;
    }, [flowmeters, searchTerm, wuaFilter, divisionFilter, statusFilter, sortConfig]);

    const paginatedFlowmeters = useMemo(() => {
        const startIndex = (currentPage - 1) * itemsPerPage;
        return sortedAndFilteredFlowmeters.slice(startIndex, startIndex + itemsPerPage);
    }, [sortedAndFilteredFlowmeters, currentPage]);
    
    const totalPages = Math.ceil(sortedAndFilteredFlowmeters.length / itemsPerPage);

    const handleSort = (key: keyof Flowmeter) => {
        let direction: 'asc' | 'desc' = 'asc';
        if (sortConfig.key === key && sortConfig.direction === 'asc') {
            direction = 'desc';
        }
        setSortConfig({ key, direction });
    };
    
    const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.checked) {
            setSelectedFlowmeters(new Set(paginatedFlowmeters.map(fm => fm.id)));
        } else {
            setSelectedFlowmeters(new Set());
        }
    };
    
    const handleSelectOne = (id: string) => {
        const newSelection = new Set(selectedFlowmeters);
        if (newSelection.has(id)) {
            newSelection.delete(id);
        } else {
            newSelection.add(id);
        }
        setSelectedFlowmeters(newSelection);
    };

    const isAllSelected = paginatedFlowmeters.length > 0 && selectedFlowmeters.size === paginatedFlowmeters.length;
    
    const StatusBadge: React.FC<{ status: 'online' | 'offline' | 'warning' }> = ({ status }) => {
        const styles = {
            online: 'bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300',
            offline: 'bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-300',
            warning: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/50 dark:text-yellow-300',
        };
        const icon = {
            online: 'fa-check-circle',
            offline: 'fa-times-circle',
            warning: 'fa-exclamation-triangle',
        };
        return (
            <span className={`inline-flex items-center gap-1.5 px-2 py-1 text-xs font-medium rounded-full ${styles[status]}`}>
                <i className={`fas ${icon[status]}`}></i>
                {status.charAt(0).toUpperCase() + status.slice(1)}
            </span>
        );
    };

    const SortableTh: React.FC<{ label: string; sortKey: keyof Flowmeter; className?: string }> = ({ label, sortKey, className }) => (
        <th scope="col" className={`px-4 py-3 ${className}`}>
            <button className="flex items-center gap-1.5 w-full text-left uppercase text-xs font-semibold text-slate-500 dark:text-slate-400" onClick={() => handleSort(sortKey)}>
                {label}
                {sortConfig.key === sortKey ? (
                    <i className={`fas fa-arrow-${sortConfig.direction === 'asc' ? 'up' : 'down'}`}></i>
                ) : (
                    <i className="fas fa-sort text-slate-300 dark:text-slate-500"></i>
                )}
            </button>
        </th>
    );

    return (
        <div className="animate-fade-in">
            <div className="flex flex-wrap justify-between items-center gap-4 mb-6">
                <div>
                    <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-200">Flowmeters Management</h1>
                    <p className="text-sm text-slate-500 dark:text-slate-400">{sortedAndFilteredFlowmeters.length} Flowmeters</p>
                </div>
                <div className="flex items-center gap-2">
                    <button className="px-4 py-2 text-sm font-medium text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-md hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors">
                        <i className="fas fa-download mr-2"></i>Download Report
                    </button>
                    <button className="px-4 py-2 text-sm font-medium text-white bg-cyan-600 rounded-md hover:bg-cyan-700 transition-colors">
                         <i className="fas fa-plus mr-2"></i>Add New Flowmeter
                    </button>
                </div>
            </div>
            
            <div className="bg-white dark:bg-slate-800/50 p-4 rounded-lg shadow-sm border border-slate-200 dark:border-slate-700 mb-6">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div className="relative">
                         <i className="fas fa-search absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"></i>
                        <input type="text" placeholder="Search by ID, WUA..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="w-full pl-9 pr-3 py-2 bg-slate-50 dark:bg-slate-700/50 border border-slate-200 dark:border-slate-600 rounded-md text-sm focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 outline-none"/>
                    </div>
                     <select value={wuaFilter} onChange={e => setWuaFilter(e.target.value)} className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-700/50 border border-slate-200 dark:border-slate-600 rounded-md text-sm focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 outline-none">
                        <option value="all">All WUAs</option>
                        {WUA_NAMES.map(name => <option key={name} value={name}>{name}</option>)}
                    </select>
                    <select value={divisionFilter} onChange={e => setDivisionFilter(e.target.value)} className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-700/50 border border-slate-200 dark:border-slate-600 rounded-md text-sm focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 outline-none">
                        <option value="all">All Divisions</option>
                        {DIVISIONS.map(name => <option key={name} value={name}>{name}</option>)}
                    </select>
                    <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-700/50 p-1 rounded-md">
                        {(['all', 'online', 'offline', 'warning'] as const).map(status => (
                            <button key={status} onClick={() => setStatusFilter(status)} className={`w-full px-2 py-1 text-xs font-semibold rounded-md transition-colors ${statusFilter === status ? 'bg-white text-cyan-600 dark:bg-slate-600 dark:text-white shadow-sm' : 'text-slate-500 dark:text-slate-400 hover:bg-slate-200/70 dark:hover:bg-slate-600/50'}`}>
                                {status.charAt(0).toUpperCase() + status.slice(1)}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            <div className="bg-white dark:bg-slate-800/50 rounded-lg shadow-sm border border-slate-200 dark:border-slate-700 overflow-x-auto">
                <table className="w-full text-sm text-left text-slate-500 dark:text-slate-400">
                    <thead className="bg-slate-50 dark:bg-slate-700/50">
                        <tr>
                            <th scope="col" className="p-4"><input type="checkbox" onChange={handleSelectAll} checked={isAllSelected} className="rounded" /></th>
                            <SortableTh label="Flowmeter ID" sortKey="id" />
                            <SortableTh label="WUA Name" sortKey="wua" />
                            <SortableTh label="Division" sortKey="division" />
                            <SortableTh label="Status" sortKey="status" />
                            <SortableTh label="Last Data Received" sortKey="lastUpdated" />
                            <SortableTh label="Flow Rate (m³/hr)" sortKey="flowRate" />
                            <SortableTh label="Today's Volume (m³)" sortKey="todayVolume" />
                            <SortableTh label="Total Volume (m³)" sortKey="totalVolume" />
                            <th scope="col" className="px-4 py-3">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                       {paginatedFlowmeters.map(fm => (
                           <tr key={fm.id} className="hover:bg-slate-50 dark:hover:bg-slate-800">
                               <td className="p-4"><input type="checkbox" checked={selectedFlowmeters.has(fm.id)} onChange={() => handleSelectOne(fm.id)} className="rounded" /></td>
                               <td className="px-4 py-3 font-medium text-slate-900 dark:text-white whitespace-nowrap">{fm.id}</td>
                               <td className="px-4 py-3">{fm.wua}</td>
                               <td className="px-4 py-3">{fm.division}</td>
                               <td className="px-4 py-3"><StatusBadge status={fm.status} /></td>
                               <td className="px-4 py-3 whitespace-nowrap">{fm.lastUpdated}</td>
                               <td className="px-4 py-3 font-mono text-right">{fm.flowRate.toLocaleString()}</td>
                               <td className="px-4 py-3 font-mono text-right">{fm.todayVolume.toLocaleString()}</td>
                               <td className="px-4 py-3 font-mono text-right">{fm.totalVolume.toLocaleString()}</td>
                               <td className="px-4 py-3">
                                   <div className="flex items-center gap-3 text-slate-500">
                                       <button className="hover:text-cyan-600"><i className="fas fa-eye"></i></button>
                                       <button className="hover:text-cyan-600"><i className="fas fa-pencil-alt"></i></button>
                                       <button className="hover:text-red-500"><i className="fas fa-trash"></i></button>
                                   </div>
                               </td>
                           </tr>
                       ))}
                    </tbody>
                </table>
            </div>

            <div className="flex justify-between items-center mt-4">
                <span className="text-sm text-slate-500 dark:text-slate-400">
                    Showing {Math.min((currentPage - 1) * itemsPerPage + 1, sortedAndFilteredFlowmeters.length)}-{Math.min(currentPage * itemsPerPage, sortedAndFilteredFlowmeters.length)} of {sortedAndFilteredFlowmeters.length}
                </span>
                <div className="flex items-center gap-2">
                    <button onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1} className="px-3 py-1 border border-slate-300 dark:border-slate-600 rounded-md disabled:opacity-50 disabled:cursor-not-allowed">
                        Previous
                    </button>
                    <span className="text-sm">Page {currentPage} of {totalPages}</span>
                     <button onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages} className="px-3 py-1 border border-slate-300 dark:border-slate-600 rounded-md disabled:opacity-50 disabled:cursor-not-allowed">
                        Next
                    </button>
                </div>
            </div>
        </div>
    );
};

// ===============================================
// API SECTION COMPONENTS
// ===============================================

const ApiChartComponent: React.FC<{ theme: 'light' | 'dark', apiLogs: ApiLog[] }> = ({ theme, apiLogs }) => {
    const chartRef = useRef<HTMLCanvasElement>(null);
    const chartInstanceRef = useRef<any>(null);

    const chartData = useMemo(() => {
        const labels = Array.from({ length: 24 }, (_, i) => `${String(i).padStart(2, '0')}:00`);
        const data = Array(24).fill(0);
        const now = Date.now();
        apiLogs.forEach(log => {
            if (log.timestamp.getTime() > now - 24 * 3600 * 1000) {
                 const logHour = new Date(log.timestamp).getHours();
                 data[logHour]++;
            }
        });
        return { labels, data, label: 'API Calls' };
    }, [apiLogs]);

    useEffect(() => {
        if (chartRef.current) {
            if (chartInstanceRef.current) chartInstanceRef.current.destroy();
            const ctx = chartRef.current.getContext('2d');
            if (ctx) {
                const isDark = theme === 'dark';
                chartInstanceRef.current = new Chart(ctx, {
                    type: 'bar',
                    data: {
                        labels: chartData.labels,
                        datasets: [{
                            label: chartData.label,
                            data: chartData.data,
                            backgroundColor: '#22d3ee',
                            borderColor: '#06b6d4',
                            borderWidth: 1,
                            borderRadius: 4,
                        }]
                    },
                    options: {
                        responsive: true, maintainAspectRatio: false,
                        plugins: { legend: { display: false } },
                        scales: {
                            y: { grid: { color: isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)' }, ticks: { color: isDark ? '#cbd5e1' : '#475569', font: { size: 10 } } },
                            x: { grid: { display: false }, ticks: { color: isDark ? '#cbd5e1' : '#475569', font: { size: 10 } } }
                        }
                    }
                });
            }
        }
        return () => { if (chartInstanceRef.current) chartInstanceRef.current.destroy(); };
    }, [theme, chartData]);

    return <canvas ref={chartRef}></canvas>;
};

const ApiStatusDistributionChart: React.FC<{ contractors: Contractor[], theme: 'light' | 'dark' }> = ({ contractors, theme }) => {
    const chartRef = useRef<HTMLCanvasElement>(null);
    const chartInstanceRef = useRef<any>(null);

    const statusCounts = useMemo(() => {
        const counts = { active: 0, degraded: 0, offline: 0 };
        contractors.forEach(c => counts[c.status]++);
        return counts;
    }, [contractors]);

    useEffect(() => {
        if (chartRef.current) {
            if (chartInstanceRef.current) chartInstanceRef.current.destroy();
            const ctx = chartRef.current.getContext('2d');
            if (ctx) {
                const isDark = theme === 'dark';
                chartInstanceRef.current = new Chart(ctx, {
                    type: 'doughnut',
                    data: {
                        labels: ['Active', 'Degraded', 'Offline'],
                        datasets: [{
                            data: [statusCounts.active, statusCounts.degraded, statusCounts.offline],
                            backgroundColor: ['#22c55e', '#f59e0b', '#ef4444'],
                            borderColor: isDark ? '#1f2937' : '#ffffff',
                        }]
                    },
                    options: {
                        responsive: true, maintainAspectRatio: false, cutout: '70%',
                        plugins: { legend: { position: 'bottom', labels: { color: isDark ? '#cbd5e1' : '#475569', usePointStyle: true, pointStyle: 'circle', padding: 15, font: { size: 10 } } } }
                    }
                });
            }
        }
        return () => { if (chartInstanceRef.current) chartInstanceRef.current.destroy(); };
    }, [theme, statusCounts]);

    return <canvas ref={chartRef}></canvas>;
};

const ApisSection: React.FC<{ contractors: Contractor[], apiLogs: ApiLog[], smsMessages: SmsMessage[], theme: 'light' | 'dark' }> = ({ contractors, apiLogs, smsMessages, theme }) => {
    const [activeTab, setActiveTab] = useState('dashboard');
    const [modalState, setModalState] = useState<{ isOpen: boolean; view: 'performance' | 'logs' | null; contractor: Contractor | null; }>({ isOpen: false, view: null, contractor: null });
    const tabs = ['Dashboard', 'IoT Endpoints', 'SMS Gateway', 'API Logs'];

    const handleOpenModal = (contractor: Contractor, view: 'performance' | 'logs') => {
        setModalState({ isOpen: true, contractor, view });
    };

    const handleCloseModal = () => {
        setModalState({ isOpen: false, contractor: null, view: null });
    };

    const renderContent = () => {
        switch (activeTab) {
            case 'dashboard': return <ApiDashboardView contractors={contractors} apiLogs={apiLogs} theme={theme} />;
            case 'iot endpoints': return <IotEndpointsView contractors={contractors} onOpenModal={handleOpenModal} />;
            case 'sms gateway': return <SmsGatewayView smsMessages={smsMessages} />;
            case 'api logs': return <ApiLogsView apiLogs={apiLogs} />;
            default: return null;
        }
    };

    return (
        <div className="animate-fade-in">
            <div className="mb-6">
                <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-200">API Management</h1>
                <p className="text-sm text-slate-500 dark:text-slate-400">Monitor and manage all system integrations.</p>
            </div>
            <div className="border-b border-slate-200 dark:border-slate-700 mb-6">
                <nav className="-mb-px flex gap-6" aria-label="Tabs">
                    {tabs.map(tab => (
                        <button
                            key={tab}
                            onClick={() => setActiveTab(tab.toLowerCase())}
                            className={`${
                                activeTab === tab.toLowerCase()
                                    ? 'border-cyan-500 text-cyan-600 dark:text-cyan-400'
                                    : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300 dark:text-slate-400 dark:hover:text-slate-300 dark:hover:border-slate-600'
                            } whitespace-nowrap py-3 px-1 border-b-2 font-medium text-sm transition-colors`}
                        >
                            {tab}
                        </button>
                    ))}
                </nav>
            </div>
            {renderContent()}
            {modalState.isOpen && modalState.contractor && modalState.view && (
                <EndpointDetailModal
                    contractor={modalState.contractor}
                    view={modalState.view}
                    apiLogs={apiLogs}
                    onClose={handleCloseModal}
                    theme={theme}
                />
            )}
        </div>
    );
};

const ApiDashboardView: React.FC<{ contractors: Contractor[], apiLogs: ApiLog[], theme: 'light' | 'dark' }> = ({ contractors, apiLogs, theme }) => {
    const kpiData = useMemo(() => {
        const totalCalls = apiLogs.length;
        const successfulCalls = apiLogs.filter(log => log.statusCode === 200).length;
        const successRate = totalCalls > 0 ? (successfulCalls / totalCalls * 100).toFixed(1) : '0';
        const avgResponseTime = totalCalls > 0 ? Math.round(apiLogs.reduce((acc, log) => acc + log.responseTime, 0) / totalCalls) : 0;
        const dataVolume = contractors.reduce((acc, c) => acc + parseFloat(c.dataVolume), 0);
        return { totalCalls, successRate, avgResponseTime, dataVolume };
    }, [apiLogs, contractors]);
    
    return (
        <div className="animate-fade-in-slow">
             <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
                <KpiCard title="Total API Calls (24h)" value={kpiData.totalCalls.toLocaleString()} unit="requests" trend="+5.2%" trendDirection="up" icon={<i className="fas fa-exchange-alt text-blue-500"></i>} />
                <KpiCard title="Success Rate" value={kpiData.successRate} unit="%" trend="Stable" trendDirection="up" icon={<i className="fas fa-check-circle text-green-500"></i>} />
                <KpiCard title="Avg. Response Time" value={kpiData.avgResponseTime.toString()} unit="ms" trend="-15ms" trendDirection="up" icon={<i className="fas fa-stopwatch text-yellow-500"></i>} />
                <KpiCard title="Data Volume Today" value={kpiData.dataVolume.toFixed(1)} unit="GB" trend="+200MB" trendDirection="down" icon={<i className="fas fa-database text-purple-500"></i>} />
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 bg-white dark:bg-slate-800/50 p-6 rounded-lg shadow-sm border border-slate-200 dark:border-slate-700">
                     <h3 className="font-semibold text-slate-800 dark:text-slate-200 mb-4">API Calls (Last 24 Hours)</h3>
                     <div className="h-80"><ApiChartComponent theme={theme} apiLogs={apiLogs} /></div>
                </div>
                <div className="bg-white dark:bg-slate-800/50 p-6 rounded-lg shadow-sm border border-slate-200 dark:border-slate-700">
                     <h3 className="font-semibold text-slate-800 dark:text-slate-200 mb-4">Endpoint Status</h3>
                     <div className="h-80"><ApiStatusDistributionChart contractors={contractors} theme={theme} /></div>
                </div>
            </div>
        </div>
    );
};

const IotEndpointsView: React.FC<{ contractors: Contractor[], onOpenModal: (contractor: Contractor, view: 'performance' | 'logs') => void }> = ({ contractors, onOpenModal }) => {
    const ApiStatusBadge: React.FC<{ status: 'active' | 'degraded' | 'offline' }> = ({ status }) => {
        const styles = {
            active: 'bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300',
            degraded: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/50 dark:text-yellow-300',
            offline: 'bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-300',
        };
        const icon = { active: 'fa-check-circle', degraded: 'fa-exclamation-triangle', offline: 'fa-times-circle' };
        return <span className={`inline-flex items-center gap-1.5 px-2 py-1 text-xs font-medium rounded-full ${styles[status]}`}><i className={`fas ${icon[status]}`}></i>{status.charAt(0).toUpperCase() + status.slice(1)}</span>;
    };
    
    return (
        <div className="animate-fade-in-slow bg-white dark:bg-slate-800/50 rounded-lg shadow-sm border border-slate-200 dark:border-slate-700 overflow-x-auto">
            <table className="w-full text-sm text-left text-slate-500 dark:text-slate-400">
                <thead className="bg-slate-50 dark:bg-slate-700/50 text-xs text-slate-700 dark:text-slate-300 uppercase">
                    <tr>
                        <th scope="col" className="px-6 py-3">Contractor</th>
                        <th scope="col" className="px-6 py-3">Endpoint</th>
                        <th scope="col" className="px-6 py-3">Status</th>
                        <th scope="col" className="px-6 py-3">Success Rate</th>
                        <th scope="col" className="px-6 py-3">Avg. Response</th>
                        <th scope="col" className="px-6 py-3">Last Data</th>
                        <th scope="col" className="px-6 py-3">Actions</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                    {contractors.map(c => (
                        <tr key={c.id} className="hover:bg-slate-50 dark:hover:bg-slate-800">
                            <td className="px-6 py-4 font-medium text-slate-900 dark:text-white">{c.name}</td>
                            <td className="px-6 py-4 font-mono text-xs">{c.endpoint}</td>
                            <td className="px-6 py-4"><ApiStatusBadge status={c.status} /></td>
                            <td className="px-6 py-4">{c.successRate}</td>
                            <td className="px-6 py-4">{c.responseTime}ms</td>
                            <td className="px-6 py-4 whitespace-nowrap">{c.lastData.toLocaleString()}</td>
                            <td className="px-6 py-4">
                               <div className="flex items-center gap-4 text-slate-500">
                                   <button className="hover:text-cyan-600 transition-colors" onClick={() => onOpenModal(c, 'performance')}><i className="fas fa-chart-bar"></i></button>
                                   <button className="hover:text-cyan-600 transition-colors" onClick={() => onOpenModal(c, 'logs')}><i className="fas fa-file-alt"></i></button>
                               </div>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
};

const SmsGatewayView: React.FC<{ smsMessages: SmsMessage[] }> = ({ smsMessages }) => {
    return (
        <div className="animate-fade-in-slow bg-white dark:bg-slate-800/50 rounded-lg shadow-sm border border-slate-200 dark:border-slate-700 overflow-x-auto">
            <table className="w-full text-sm text-left text-slate-500 dark:text-slate-400">
                <thead className="bg-slate-50 dark:bg-slate-700/50 text-xs text-slate-700 dark:text-slate-300 uppercase">
                    <tr>
                        <th scope="col" className="px-6 py-3">Timestamp</th>
                        <th scope="col" className="px-6 py-3">Sender</th>
                        <th scope="col" className="px-6 py-3">Content</th>
                        <th scope="col" className="px-6 py-3">Status</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                    {smsMessages.map(sms => (
                        <tr key={sms.id} className="hover:bg-slate-50 dark:hover:bg-slate-800">
                            <td className="px-6 py-4 whitespace-nowrap">{sms.timestamp.toLocaleString()}</td>
                            <td className="px-6 py-4 font-mono">{sms.sender}</td>
                            <td className="px-6 py-4 font-mono text-xs max-w-sm truncate">{sms.content}</td>
                            <td className="px-6 py-4">
                                <span className={`px-2 py-1 text-xs rounded-full ${sms.status === 'processed' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>{sms.status}</span>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
};

const ApiLogsView: React.FC<{ apiLogs: ApiLog[] }> = ({ apiLogs }) => {
    const [page, setPage] = useState(1);
    const itemsPerPage = 15;
    const paginatedLogs = apiLogs.slice((page - 1) * itemsPerPage, page * itemsPerPage);
    const totalPages = Math.ceil(apiLogs.length / itemsPerPage);

    const MethodBadge: React.FC<{ method: string }> = ({ method }) => {
        const colors: { [key: string]: string } = { 'POST': 'bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300', 'GET': 'bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-300' };
        return <span className={`font-mono text-xs font-semibold px-2 py-0.5 rounded ${colors[method] || 'bg-slate-100 text-slate-800'}`}>{method}</span>
    };
    const StatusBadge: React.FC<{ code: number }> = ({ code }) => {
        const color = code >= 500 ? 'bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-300' : code >= 400 ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/50 dark:text-yellow-300' : 'bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300';
        return <span className={`font-mono text-xs font-semibold px-2 py-0.5 rounded ${color}`}>{code}</span>
    };

    return (
        <div className="animate-fade-in-slow">
            <div className="bg-white dark:bg-slate-800/50 rounded-lg shadow-sm border border-slate-200 dark:border-slate-700 overflow-x-auto">
                <table className="w-full text-sm text-left text-slate-500 dark:text-slate-400">
                    <thead className="bg-slate-50 dark:bg-slate-700/50 text-xs text-slate-700 dark:text-slate-300 uppercase">
                        <tr>
                            <th scope="col" className="px-6 py-3">Timestamp</th>
                            <th scope="col" className="px-6 py-3">Method</th>
                            <th scope="col" className="px-6 py-3">Endpoint</th>
                            <th scope="col" className="px-6 py-3">Status</th>
                            <th scope="col" className="px-6 py-3">Response Time</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                        {paginatedLogs.map(log => (
                            <tr key={log.id} className="hover:bg-slate-50 dark:hover:bg-slate-800">
                                <td className="px-6 py-4 whitespace-nowrap">{log.timestamp.toLocaleString()}</td>
                                <td className="px-6 py-4"><MethodBadge method={log.method} /></td>
                                <td className="px-6 py-4 font-mono text-xs">{log.endpoint}</td>
                                <td className="px-6 py-4"><StatusBadge code={log.statusCode} /></td>
                                <td className="px-6 py-4">{log.responseTime}ms</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
            <div className="flex justify-between items-center mt-4">
                 <span className="text-sm text-slate-500 dark:text-slate-400">Page {page} of {totalPages}</span>
                <div className="flex items-center gap-2">
                    <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className="px-3 py-1 border border-slate-300 dark:border-slate-600 rounded-md disabled:opacity-50">Prev</button>
                    <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages} className="px-3 py-1 border border-slate-300 dark:border-slate-600 rounded-md disabled:opacity-50">Next</button>
                </div>
            </div>
        </div>
    );
};

// ===============================================
// MODAL COMPONENTS FOR API SECTION
// ===============================================

const EndpointDetailModal: React.FC<{
    contractor: Contractor;
    view: 'performance' | 'logs';
    apiLogs: ApiLog[];
    onClose: () => void;
    theme: 'light' | 'dark';
}> = ({ contractor, view, apiLogs, onClose, theme }) => {
    const contractorLogs = useMemo(() =>
        apiLogs.filter(log => log.endpoint === contractor.endpoint),
        [apiLogs, contractor.endpoint]
    );

    useEffect(() => {
        const handleEsc = (event: KeyboardEvent) => {
            if (event.key === 'Escape') onClose();
        };
        window.addEventListener('keydown', handleEsc);
        return () => window.removeEventListener('keydown', handleEsc);
    }, [onClose]);

    return (
        <div className="fixed inset-0 bg-black/60 dark:bg-black/70 z-50 flex items-center justify-center p-4 animate-fade-in" onClick={onClose}>
            <div className="bg-white dark:bg-slate-900 rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] flex flex-col border border-slate-200 dark:border-slate-700" onClick={e => e.stopPropagation()}>
                <div className="flex justify-between items-center p-4 border-b border-slate-200 dark:border-slate-700 flex-shrink-0">
                    <div>
                        <h2 className="text-lg font-bold text-slate-800 dark:text-slate-200">{contractor.name} - Endpoint {view === 'performance' ? 'Performance' : 'Logs'}</h2>
                        <p className="text-sm text-slate-500 dark:text-slate-400 font-mono">{contractor.endpoint}</p>
                    </div>
                    <button onClick={onClose} className="text-2xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors">&times;</button>
                </div>
                <div className="p-6 overflow-y-auto">
                    {view === 'performance' ?
                        <ModalPerformanceView contractor={contractor} logs={contractorLogs} theme={theme} /> :
                        <ModalLogsView logs={contractorLogs} />}
                </div>
            </div>
        </div>
    );
};

const ModalPerformanceView: React.FC<{ contractor: Contractor, logs: ApiLog[], theme: 'light' | 'dark' }> = ({ contractor, logs, theme }) => {
    const MiniKpi: React.FC<{title: string, value: string | number, unit?: string}> = ({title, value, unit}) => (
        <div className="bg-slate-50 dark:bg-slate-800 p-4 rounded-lg border border-slate-200 dark:border-slate-700">
            <p className="text-sm text-slate-500 dark:text-slate-400">{title}</p>
            <p className="text-2xl font-bold text-slate-800 dark:text-slate-200">{value}{unit && <span className="text-base font-medium ml-1 text-slate-500 dark:text-slate-400">{unit}</span>}</p>
        </div>
    );
    
    return (
        <div className="animate-fade-in">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                <MiniKpi title="Success Rate" value={contractor.successRate} />
                <MiniKpi title="Avg Response" value={contractor.responseTime} unit="ms" />
                <MiniKpi title="Records Today" value={contractor.recordsToday.toLocaleString()} />
                <MiniKpi title="Data Volume" value={contractor.dataVolume} />
            </div>
            <h3 className="font-semibold text-slate-800 dark:text-slate-200 mb-4">API Calls (Last 24 hours)</h3>
            <div className="h-64">
                <ApiChartComponent theme={theme} apiLogs={logs} />
            </div>
        </div>
    );
};

const ModalLogsView: React.FC<{ logs: ApiLog[] }> = ({ logs }) => {
    const [page, setPage] = useState(1);
    const itemsPerPage = 10;
    const paginatedLogs = logs.slice((page - 1) * itemsPerPage, page * itemsPerPage);
    const totalPages = Math.ceil(logs.length / itemsPerPage);

    const MethodBadge: React.FC<{ method: string }> = ({ method }) => {
        const colors: { [key: string]: string } = { 'POST': 'bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300', 'GET': 'bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-300' };
        return <span className={`font-mono text-xs font-semibold px-2 py-0.5 rounded ${colors[method] || 'bg-slate-100 text-slate-800'}`}>{method}</span>
    };
    const StatusBadge: React.FC<{ code: number }> = ({ code }) => {
        const color = code >= 500 ? 'bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-300' : code >= 400 ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/50 dark:text-yellow-300' : 'bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300';
        return <span className={`font-mono text-xs font-semibold px-2 py-0.5 rounded ${color}`}>{code}</span>
    };
    
    return (
        <div className="animate-fade-in">
            <div className="border border-slate-200 dark:border-slate-700 rounded-lg overflow-x-auto">
                <table className="w-full text-sm text-left text-slate-500 dark:text-slate-400">
                     <thead className="bg-slate-50 dark:bg-slate-800 text-xs text-slate-700 dark:text-slate-300 uppercase">
                        <tr>
                            <th scope="col" className="px-6 py-3">Timestamp</th>
                            <th scope="col" className="px-6 py-3">Method</th>
                            <th scope="col" className="px-6 py-3">Status</th>
                            <th scope="col" className="px-6 py-3">Response Time</th>
                            <th scope="col" className="px-6 py-3">Data Size</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                        {paginatedLogs.map(log => (
                            <tr key={log.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                                <td className="px-6 py-4 whitespace-nowrap">{log.timestamp.toLocaleString()}</td>
                                <td className="px-6 py-4"><MethodBadge method={log.method} /></td>
                                <td className="px-6 py-4"><StatusBadge code={log.statusCode} /></td>
                                <td className="px-6 py-4">{log.responseTime}ms</td>
                                <td className="px-6 py-4">{log.dataSize}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
             <div className="flex justify-between items-center mt-4">
                 <span className="text-sm text-slate-500 dark:text-slate-400">Showing {Math.min((page - 1) * itemsPerPage + 1, logs.length)}-{Math.min(page * itemsPerPage, logs.length)} of {logs.length}</span>
                <div className="flex items-center gap-2">
                    <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className="px-3 py-1 border border-slate-300 dark:border-slate-600 rounded-md disabled:opacity-50">Prev</button>
                    <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages} className="px-3 py-1 border border-slate-300 dark:border-slate-600 rounded-md disabled:opacity-50">Next</button>
                </div>
            </div>
        </div>
    );
};

// ===============================================
// MANUAL ENTRY SECTION COMPONENTS
// ===============================================

const ManualEntrySection: React.FC<{ flowmeters: Flowmeter[], manualEntries: ManualEntry[] }> = ({ flowmeters, manualEntries }) => {
    const [activeTab, setActiveTab] = useState('form');
    const tabs = [{id: 'form', label: 'New Entry Form'}, {id: 'history', label: 'Entry History'}];

    const renderContent = () => {
        switch (activeTab) {
            case 'form': return <NewEntryForm flowmeters={flowmeters} />;
            case 'history': return <EntryHistoryView entries={manualEntries} />;
            default: return null;
        }
    };

    return (
        <div className="animate-fade-in">
            <div className="mb-6">
                <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-200">Manual Data Entry</h1>
                <p className="text-sm text-slate-500 dark:text-slate-400">Submit or review manually entered flowmeter readings.</p>
            </div>
            <div className="border-b border-slate-200 dark:border-slate-700 mb-6">
                <nav className="-mb-px flex gap-6" aria-label="Tabs">
                    {tabs.map(tab => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={`${
                                activeTab === tab.id
                                    ? 'border-cyan-500 text-cyan-600 dark:text-cyan-400'
                                    : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300 dark:text-slate-400 dark:hover:text-slate-300 dark:hover:border-slate-600'
                            } whitespace-nowrap py-3 px-1 border-b-2 font-medium text-sm transition-colors`}
                        >
                            {tab.label}
                        </button>
                    ))}
                </nav>
            </div>
            {renderContent()}
        </div>
    );
};

const NewEntryForm: React.FC<{flowmeters: Flowmeter[]}> = ({flowmeters}) => {
    const [formData, setFormData] = useState({ flowmeterId: '', date: '', time: '', flowRate: '', todayVolume: '', remarks: '' });
    const [isSubmitted, setIsSubmitted] = useState(false);
    const flowmeterOptions = useMemo(() => flowmeters.map(f => ({ value: f.id, label: f.id })), [flowmeters]);
    
    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };
    
    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        // Here you would typically send the data to a server
        console.log('Manual Entry Submitted:', formData);
        setIsSubmitted(true);
        setFormData({ flowmeterId: '', date: '', time: '', flowRate: '', todayVolume: '', remarks: '' });
        setTimeout(() => setIsSubmitted(false), 5000); // Hide message after 5 seconds
    };
    
    const handleReset = () => {
        setFormData({ flowmeterId: '', date: '', time: '', flowRate: '', todayVolume: '', remarks: '' });
    };

    return (
        <div className="bg-white dark:bg-slate-800/50 p-6 rounded-lg shadow-sm border border-slate-200 dark:border-slate-700 max-w-2xl mx-auto">
            <form onSubmit={handleSubmit}>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="md:col-span-2">
                        <label htmlFor="flowmeterId" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Flowmeter ID</label>
                        <select id="flowmeterId" name="flowmeterId" value={formData.flowmeterId} onChange={handleInputChange} required className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-700/50 border border-slate-300 dark:border-slate-600 rounded-md text-sm focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 outline-none">
                            <option value="" disabled>Select a Flowmeter</option>
                            {flowmeterOptions.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
                        </select>
                    </div>
                    <div>
                        <label htmlFor="date" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Date of Reading</label>
                        <input type="date" id="date" name="date" value={formData.date} onChange={handleInputChange} required className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-700/50 border border-slate-300 dark:border-slate-600 rounded-md text-sm focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 outline-none"/>
                    </div>
                    <div>
                        <label htmlFor="time" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Time of Reading</label>
                        <input type="time" id="time" name="time" value={formData.time} onChange={handleInputChange} required className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-700/50 border border-slate-300 dark:border-slate-600 rounded-md text-sm focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 outline-none"/>
                    </div>
                    <div>
                        <label htmlFor="flowRate" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Flow Rate (m³/hr)</label>
                        <input type="number" id="flowRate" name="flowRate" value={formData.flowRate} onChange={handleInputChange} required className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-700/50 border border-slate-300 dark:border-slate-600 rounded-md text-sm focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 outline-none"/>
                    </div>
                    <div>
                        <label htmlFor="todayVolume" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Today's Volume (m³)</label>
                        <input type="number" id="todayVolume" name="todayVolume" value={formData.todayVolume} onChange={handleInputChange} required className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-700/50 border border-slate-300 dark:border-slate-600 rounded-md text-sm focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 outline-none"/>
                    </div>
                    <div className="md:col-span-2">
                         <label htmlFor="remarks" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Remarks (Optional)</label>
                        <textarea id="remarks" name="remarks" value={formData.remarks} onChange={handleInputChange} rows={3} className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-700/50 border border-slate-300 dark:border-slate-600 rounded-md text-sm focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 outline-none"></textarea>
                    </div>
                </div>
                {isSubmitted && (
                    <div className="mt-4 p-3 rounded-md bg-green-50 dark:bg-green-900/50 border border-green-200 dark:border-green-700 text-green-700 dark:text-green-300 text-sm">
                        <i className="fas fa-check-circle mr-2"></i>
                        Manual entry submitted successfully for review.
                    </div>
                )}
                <div className="flex justify-end gap-4 mt-6">
                    <button type="button" onClick={handleReset} className="px-4 py-2 text-sm font-medium text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-md hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors">Reset Form</button>
                    <button type="submit" className="px-6 py-2 text-sm font-medium text-white bg-cyan-600 rounded-md hover:bg-cyan-700 transition-colors">Submit Entry</button>
                </div>
            </form>
        </div>
    );
};

const EntryHistoryView: React.FC<{entries: ManualEntry[]}> = ({entries}) => {
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 10;
    
    const filteredEntries = useMemo(() => {
        return entries.filter(entry => {
            const matchesSearch = !searchTerm || entry.flowmeterId.toLowerCase().includes(searchTerm.toLowerCase());
            const matchesStatus = statusFilter === 'all' || entry.status === statusFilter;
            return matchesSearch && matchesStatus;
        });
    }, [entries, searchTerm, statusFilter]);
    
    const paginatedEntries = useMemo(() => {
        const startIndex = (currentPage - 1) * itemsPerPage;
        return filteredEntries.slice(startIndex, startIndex + itemsPerPage);
    }, [filteredEntries, currentPage]);
    
    const totalPages = Math.ceil(filteredEntries.length / itemsPerPage);

    const StatusBadge: React.FC<{ status: 'approved' | 'pending' | 'rejected' }> = ({ status }) => {
        const styles = {
            approved: 'bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300',
            pending: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/50 dark:text-yellow-300',
            rejected: 'bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-300',
        };
        const icon = { approved: 'fa-check-circle', pending: 'fa-clock', rejected: 'fa-times-circle' };
        return <span className={`inline-flex items-center gap-1.5 px-2 py-1 text-xs font-medium rounded-full ${styles[status]}`}><i className={`fas ${icon[status]}`}></i>{status.charAt(0).toUpperCase() + status.slice(1)}</span>;
    };
    
    return (
        <div className="animate-fade-in-slow">
            <div className="bg-white dark:bg-slate-800/50 p-4 rounded-lg shadow-sm border border-slate-200 dark:border-slate-700 mb-6">
                 <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="relative md:col-span-2">
                         <i className="fas fa-search absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"></i>
                        <input type="text" placeholder="Search by Flowmeter ID..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="w-full pl-9 pr-3 py-2 bg-slate-50 dark:bg-slate-700/50 border border-slate-200 dark:border-slate-600 rounded-md text-sm focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 outline-none"/>
                    </div>
                     <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-700/50 border border-slate-200 dark:border-slate-600 rounded-md text-sm focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 outline-none">
                        <option value="all">All Statuses</option>
                        <option value="approved">Approved</option>
                        <option value="pending">Pending</option>
                        <option value="rejected">Rejected</option>
                    </select>
                </div>
            </div>
            
            <div className="bg-white dark:bg-slate-800/50 rounded-lg shadow-sm border border-slate-200 dark:border-slate-700 overflow-x-auto">
                 <table className="w-full text-sm text-left text-slate-500 dark:text-slate-400">
                    <thead className="bg-slate-50 dark:bg-slate-700/50 text-xs text-slate-700 dark:text-slate-300 uppercase">
                        <tr>
                            <th scope="col" className="px-6 py-3">Entry ID</th>
                            <th scope="col" className="px-6 py-3">Flowmeter ID</th>
                            <th scope="col" className="px-6 py-3">Reading Time</th>
                            <th scope="col" className="px-6 py-3">Flow Rate</th>
                            <th scope="col" className="px-6 py-3">Volume</th>
                            <th scope="col" className="px-6 py-3">Entered By</th>
                            <th scope="col" className="px-6 py-3">Status</th>
                            <th scope="col" className="px-6 py-3">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                        {paginatedEntries.map(entry => (
                             <tr key={entry.id} className="hover:bg-slate-50 dark:hover:bg-slate-800">
                                <td className="px-6 py-4 font-mono text-xs">{entry.id}</td>
                                <td className="px-6 py-4 font-medium text-slate-900 dark:text-white">{entry.flowmeterId}</td>
                                <td className="px-6 py-4 whitespace-nowrap">{entry.readingTimestamp.toLocaleString()}</td>
                                <td className="px-6 py-4 font-mono">{entry.flowRate.toLocaleString()} m³/hr</td>
                                <td className="px-6 py-4 font-mono">{entry.todayVolume.toLocaleString()} m³</td>
                                <td className="px-6 py-4">{entry.enteredBy}</td>
                                <td className="px-6 py-4"><StatusBadge status={entry.status} /></td>
                                <td className="px-6 py-4">
                                   <div className="flex items-center gap-3 text-slate-500">
                                       <button className="hover:text-cyan-600"><i className="fas fa-eye"></i></button>
                                       <button className="hover:text-cyan-600"><i className="fas fa-pencil-alt"></i></button>
                                   </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                 </table>
            </div>

            <div className="flex justify-between items-center mt-4">
                <span className="text-sm text-slate-500 dark:text-slate-400">
                    Showing {Math.min((currentPage - 1) * itemsPerPage + 1, filteredEntries.length)}-{Math.min(currentPage * itemsPerPage, filteredEntries.length)} of {filteredEntries.length}
                </span>
                <div className="flex items-center gap-2">
                    <button onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1} className="px-3 py-1 border border-slate-300 dark:border-slate-600 rounded-md disabled:opacity-50">Previous</button>
                    <span className="text-sm">Page {currentPage} of {totalPages}</span>
                     <button onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages} className="px-3 py-1 border border-slate-300 dark:border-slate-600 rounded-md disabled:opacity-50">Next</button>
                </div>
            </div>
        </div>
    );
};

// ===============================================
// REPORTS SECTION COMPONENTS
// ===============================================

const ReportsSection: React.FC<{ scheduledReports: ScheduledReport[], reportHistory: ReportHistory[] }> = ({ scheduledReports, reportHistory }) => {
    const [activeTab, setActiveTab] = useState('generate');
    const tabs = [
        { id: 'generate', label: 'Generate Report' },
        { id: 'scheduled', label: 'Scheduled Reports' },
        { id: 'history', label: 'Report History' },
    ];

    const renderContent = () => {
        switch (activeTab) {
            case 'generate': return <ReportGenerator />;
            case 'scheduled': return <ScheduledReportsView reports={scheduledReports} />;
            case 'history': return <ReportHistoryView history={reportHistory} />;
            default: return null;
        }
    };

    return (
        <div className="animate-fade-in">
            <div className="mb-6">
                <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-200">Reports & Analytics</h1>
                <p className="text-sm text-slate-500 dark:text-slate-400">Generate, schedule, and view historical reports.</p>
            </div>
            <div className="border-b border-slate-200 dark:border-slate-700 mb-6">
                <nav className="-mb-px flex gap-6" aria-label="Tabs">
                    {tabs.map(tab => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={`${
                                activeTab === tab.id
                                    ? 'border-cyan-500 text-cyan-600 dark:text-cyan-400'
                                    : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300 dark:text-slate-400 dark:hover:text-slate-300 dark:hover:border-slate-600'
                            } whitespace-nowrap py-3 px-1 border-b-2 font-medium text-sm transition-colors`}
                        >
                            {tab.label}
                        </button>
                    ))}
                </nav>
            </div>
            {renderContent()}
        </div>
    );
};

const ReportGenerator: React.FC = () => {
    const [isGenerating, setIsGenerating] = useState(false);
    
    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setIsGenerating(true);
        setTimeout(() => {
            setIsGenerating(false);
            // In a real app, you would trigger a download here
        }, 2000);
    };

    const FormRow: React.FC<{ label: string, children: React.ReactNode}> = ({label, children}) => (
        <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">{label}</label>
            {children}
        </div>
    );

    return (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2">
                 <div className="bg-white dark:bg-slate-800/50 p-6 rounded-lg shadow-sm border border-slate-200 dark:border-slate-700">
                    <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-200 mb-4 border-b border-slate-200 dark:border-slate-700 pb-3">Report Configuration</h3>
                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                           <FormRow label="Report Type">
                                <select required className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-700/50 border border-slate-300 dark:border-slate-600 rounded-md text-sm focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 outline-none">
                                    <option>Daily Water Usage</option>
                                    <option>Flowmeter Performance</option>
                                    <option>WUA Consumption</option>
                                    <option>Compliance Report</option>
                                    <option>Alert Summary</option>
                                </select>
                           </FormRow>
                           <FormRow label="Date Range">
                               <div className="flex items-center gap-2">
                                <input type="date" required className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-700/50 border border-slate-300 dark:border-slate-600 rounded-md text-sm focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 outline-none"/>
                                <span className="text-slate-500">to</span>
                                <input type="date" required className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-700/50 border border-slate-300 dark:border-slate-600 rounded-md text-sm focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 outline-none"/>
                               </div>
                           </FormRow>
                           <FormRow label="WUA">
                                <select className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-700/50 border border-slate-300 dark:border-slate-600 rounded-md text-sm focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 outline-none">
                                    <option>All WUAs</option>
                                    {WUA_NAMES.map(w => <option key={w}>{w}</option>)}
                                </select>
                           </FormRow>
                           <FormRow label="Division">
                                <select className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-700/50 border border-slate-300 dark:border-slate-600 rounded-md text-sm focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 outline-none">
                                    <option>All Divisions</option>
                                    {DIVISIONS.map(d => <option key={d}>{d}</option>)}
                                </select>
                           </FormRow>
                        </div>
                        <div>
                            <p className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Output Format</p>
                            <div className="flex gap-4">
                                {['PDF', 'CSV', 'XLSX'].map(format => (
                                    <label key={format} className="flex items-center gap-2 text-sm">
                                        <input type="radio" name="format" value={format} defaultChecked={format==='PDF'} className="text-cyan-600 focus:ring-cyan-500" />
                                        {format}
                                    </label>
                                ))}
                            </div>
                        </div>
                        <div className="pt-4 border-t border-slate-200 dark:border-slate-700">
                             <button type="submit" className="w-full md:w-auto px-6 py-2.5 text-sm font-medium text-white bg-cyan-600 rounded-md hover:bg-cyan-700 transition-colors disabled:bg-cyan-400" disabled={isGenerating}>
                                {isGenerating ? <><i className="fas fa-spinner fa-spin mr-2"></i>Generating...</> : <><i className="fas fa-cogs mr-2"></i>Generate Report</>}
                            </button>
                        </div>
                    </form>
                 </div>
            </div>
            <div className="bg-white dark:bg-slate-800/50 p-6 rounded-lg shadow-sm border border-slate-200 dark:border-slate-700 self-start">
                 <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-200 mb-4">Quick Reports</h3>
                 <div className="space-y-3">
                     <button className="w-full text-left flex items-center gap-3 px-4 py-3 bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-md transition-colors">
                        <i className="fas fa-calendar-day text-cyan-600"></i>
                        <div>
                            <p className="font-semibold">Last 24 Hours Summary</p>
                            <p className="text-xs text-slate-500 dark:text-slate-400">A quick overview of all flowmeters.</p>
                        </div>
                     </button>
                     <button className="w-full text-left flex items-center gap-3 px-4 py-3 bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-md transition-colors">
                        <i className="fas fa-calendar-week text-cyan-600"></i>
                        <div>
                            <p className="font-semibold">Last 7 Days WUA Report</p>
                            <p className="text-xs text-slate-500 dark:text-slate-400">Consumption report for all WUAs.</p>
                        </div>
                     </button>
                     <button className="w-full text-left flex items-center gap-3 px-4 py-3 bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-md transition-colors">
                        <i className="fas fa-exclamation-triangle text-yellow-500"></i>
                        <div>
                            <p className="font-semibold">Monthly Offline Report</p>
                            <p className="text-xs text-slate-500 dark:text-slate-400">List of all offline flowmeters.</p>
                        </div>
                     </button>
                 </div>
            </div>
        </div>
    );
};


const ScheduledReportsView: React.FC<{ reports: ScheduledReport[] }> = ({ reports }) => {
    const StatusBadge: React.FC<{ status: 'active' | 'paused' }> = ({ status }) => {
        const styles = {
            active: 'bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300',
            paused: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/50 dark:text-yellow-300',
        };
        const icon = { active: 'fa-check-circle', paused: 'fa-pause-circle' };
        return <span className={`inline-flex items-center gap-1.5 px-2 py-1 text-xs font-medium rounded-full ${styles[status]}`}><i className={`fas ${icon[status]}`}></i>{status.charAt(0).toUpperCase() + status.slice(1)}</span>;
    };
    
    return (
        <div className="animate-fade-in-slow">
            <div className="flex justify-end mb-4">
                 <button className="px-4 py-2 text-sm font-medium text-white bg-cyan-600 rounded-md hover:bg-cyan-700 transition-colors">
                    <i className="fas fa-plus mr-2"></i>Schedule New Report
                </button>
            </div>
             <div className="bg-white dark:bg-slate-800/50 rounded-lg shadow-sm border border-slate-200 dark:border-slate-700 overflow-x-auto">
                 <table className="w-full text-sm text-left text-slate-500 dark:text-slate-400">
                    <thead className="bg-slate-50 dark:bg-slate-700/50 text-xs text-slate-700 dark:text-slate-300 uppercase">
                        <tr>
                            <th scope="col" className="px-6 py-3">Report Name</th>
                            <th scope="col" className="px-6 py-3">Frequency</th>
                            <th scope="col" className="px-6 py-3">Next Run</th>
                            <th scope="col" className="px-6 py-3">Recipients</th>
                            <th scope="col" className="px-6 py-3">Status</th>
                            <th scope="col" className="px-6 py-3">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                        {reports.map(report => (
                            <tr key={report.id} className="hover:bg-slate-50 dark:hover:bg-slate-800">
                                <td className="px-6 py-4 font-medium text-slate-900 dark:text-white">{report.name}</td>
                                <td className="px-6 py-4">{report.frequency}</td>
                                <td className="px-6 py-4 whitespace-nowrap">{report.nextRun.toLocaleString()}</td>
                                <td className="px-6 py-4 text-xs max-w-xs truncate">{report.recipients}</td>
                                <td className="px-6 py-4"><StatusBadge status={report.status} /></td>
                                <td className="px-6 py-4">
                                   <div className="flex items-center gap-3 text-slate-500">
                                       <button className="hover:text-cyan-600" title="Run Now"><i className="fas fa-play"></i></button>
                                       <button className="hover:text-cyan-600" title="Edit"><i className="fas fa-pencil-alt"></i></button>
                                       <button className="hover:text-red-500" title="Delete"><i className="fas fa-trash"></i></button>
                                   </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                 </table>
             </div>
        </div>
    );
};

const ReportHistoryView: React.FC<{ history: ReportHistory[] }> = ({ history }) => {
    const [page, setPage] = useState(1);
    const itemsPerPage = 10;
    const paginatedHistory = history.slice((page - 1) * itemsPerPage, page * itemsPerPage);
    const totalPages = Math.ceil(history.length / itemsPerPage);
    
     const FormatBadge: React.FC<{ format: string }> = ({ format }) => {
        const colors: { [key: string]: string } = { 'PDF': 'bg-red-100 text-red-800', 'CSV': 'bg-blue-100 text-blue-800', 'XLSX': 'bg-green-100 text-green-800' };
        return <span className={`font-mono text-xs font-semibold px-2 py-0.5 rounded ${colors[format] || 'bg-slate-100 text-slate-800'}`}>{format}</span>
    };

    return (
        <div className="animate-fade-in-slow">
             <div className="bg-white dark:bg-slate-800/50 rounded-lg shadow-sm border border-slate-200 dark:border-slate-700 overflow-x-auto">
                 <table className="w-full text-sm text-left text-slate-500 dark:text-slate-400">
                    <thead className="bg-slate-50 dark:bg-slate-700/50 text-xs text-slate-700 dark:text-slate-300 uppercase">
                        <tr>
                            <th scope="col" className="px-6 py-3">Report Name</th>
                            <th scope="col" className="px-6 py-3">Generated On</th>
                            <th scope="col" className="px-6 py-3">Generated By</th>
                            <th scope="col" className="px-6 py-3">Format</th>
                            <th scope="col" className="px-6 py-3">Download</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                        {paginatedHistory.map(item => (
                            <tr key={item.id} className="hover:bg-slate-50 dark:hover:bg-slate-800">
                                <td className="px-6 py-4 font-medium text-slate-900 dark:text-white">{item.name}</td>
                                <td className="px-6 py-4 whitespace-nowrap">{item.generatedAt.toLocaleString()}</td>
                                <td className="px-6 py-4">{item.generatedBy}</td>
                                <td className="px-6 py-4"><FormatBadge format={item.format} /></td>
                                <td className="px-6 py-4">
                                   <a href="#" className="flex items-center gap-2 font-medium text-cyan-600 hover:text-cyan-700 dark:text-cyan-400 dark:hover:text-cyan-300">
                                       <i className="fas fa-download"></i>
                                       <span>{item.fileSize}</span>
                                   </a>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                 </table>
             </div>
             <div className="flex justify-between items-center mt-4">
                 <span className="text-sm text-slate-500 dark:text-slate-400">Page {page} of {totalPages}</span>
                <div className="flex items-center gap-2">
                    <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className="px-3 py-1 border border-slate-300 dark:border-slate-600 rounded-md disabled:opacity-50">Prev</button>
                    <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages} className="px-3 py-1 border border-slate-300 dark:border-slate-600 rounded-md disabled:opacity-50">Next</button>
                </div>
            </div>
        </div>
    );
};

// ===============================================
// PM GATI SHAKTI SECTION COMPONENTS
// ===============================================
const PmGatiShaktiMap: React.FC<{ layers: GatiShaktiLayer[], projects: GatiShaktiProject[], activeLayerIds: Set<string>, selectedProjectId: string | null }> = ({ layers, projects, activeLayerIds, selectedProjectId }) => {
    const mapContainerRef = useRef<HTMLDivElement>(null);
    const mapInstanceRef = useRef<any>(null);
    const layerGroupRef = useRef<any>(null);
    const projectMarkersRef = useRef<any>({});

    useEffect(() => {
        if (mapContainerRef.current && !mapInstanceRef.current) {
            const map = L.map(mapContainerRef.current, { zoomControl: false }).setView([17.05, 74.5], 9);
            L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager_labels_under/{z}/{x}/{y}{r}.png', {
                attribution: '&copy; OpenStreetMap &copy; CARTO',
            }).addTo(map);
            L.control.zoom({ position: 'topright' }).addTo(map);
            mapInstanceRef.current = map;
            layerGroupRef.current = L.layerGroup().addTo(map);

            // Add project markers initially
            projects.forEach(project => {
                const marker = L.circleMarker(project.location, {
                    radius: 8,
                    fillColor: '#8b5cf6', // purple-500
                    color: '#fff',
                    weight: 2,
                    opacity: 1,
                    fillOpacity: 0.9,
                });
                marker.bindPopup(`<strong>${project.name}</strong><br>${project.description}`);
                marker.addTo(map);
                projectMarkersRef.current[project.id] = marker;
            });
        }
    }, [projects]);

    useEffect(() => {
        if (layerGroupRef.current) {
            layerGroupRef.current.clearLayers();
            layers.forEach(layer => {
                if (activeLayerIds.has(layer.id) && layer.type === 'line' && Array.isArray(layer.data[0])) {
                    L.polyline(layer.data as [number, number][], { color: layer.color, weight: 3 }).addTo(layerGroupRef.current);
                }
            });
        }
    }, [layers, activeLayerIds]);

    useEffect(() => {
        Object.values(projectMarkersRef.current).forEach((marker: any) => marker.setRadius(8).setStyle({ fillColor: '#8b5cf6' }));
        if (selectedProjectId && projectMarkersRef.current[selectedProjectId]) {
            const selectedMarker = projectMarkersRef.current[selectedProjectId];
            selectedMarker.setRadius(12).setStyle({ fillColor: '#ec4899' }).bringToFront(); // pink-500
            mapInstanceRef.current.panTo(selectedMarker.getLatLng());
        }
    }, [selectedProjectId]);

    return <div ref={mapContainerRef} className="h-full w-full bg-slate-200 dark:bg-slate-700 rounded-lg" />;
};


const PmGatiShaktiSection: React.FC<{ layers: GatiShaktiLayer[], projects: GatiShaktiProject[] }> = ({ layers, projects }) => {
    const [activeLayerIds, setActiveLayerIds] = useState<Set<string>>(new Set(['water-pipelines', 'canals']));
    const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 5;

    const handleLayerToggle = (layerId: string) => {
        const newActiveIds = new Set(activeLayerIds);
        if (newActiveIds.has(layerId)) {
            newActiveIds.delete(layerId);
        } else {
            newActiveIds.add(layerId);
        }
        setActiveLayerIds(newActiveIds);
    };
    
    const kpiData = useMemo(() => ({
        totalProjects: projects.length,
        layersIntegrated: layers.length,
        avgAlignment: Math.round(projects.reduce((acc, p) => acc + p.alignmentScore, 0) / projects.length),
        projectsCompleted: projects.filter(p => p.status === 'Completed').length,
    }), [projects, layers]);
    
    const paginatedProjects = projects.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);
    const totalPages = Math.ceil(projects.length / itemsPerPage);

    const ProjectStatusBadge: React.FC<{ status: GatiShaktiProject['status'] }> = ({ status }) => {
        const styles = {
            'Planning': 'bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-300',
            'In Progress': 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/50 dark:text-yellow-300',
            'Completed': 'bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300',
            'On Hold': 'bg-slate-100 text-slate-800 dark:bg-slate-700 dark:text-slate-300',
        };
        return <span className={`px-2 py-1 text-xs font-medium rounded-full ${styles[status]}`}>{status}</span>;
    };

    return (
        <div className="animate-fade-in">
            <div className="mb-6">
                <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-200">PM GatiShakti - National Master Plan</h1>
                <p className="text-sm text-slate-500 dark:text-slate-400">Geospatial planning and monitoring for Tembhu LIS projects.</p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
                 <KpiCard title="Total Projects Monitored" value={kpiData.totalProjects.toString()} unit="Projects" trend="Active" trendDirection="up" icon={<i className="fas fa-tasks text-blue-500"></i>} />
                 <KpiCard title="Infrastructure Layers" value={kpiData.layersIntegrated.toString()} unit="Layers" trend="Integrated" trendDirection="up" icon={<i className="fas fa-layer-group text-green-500"></i>} />
                 <KpiCard title="Avg. Alignment Score" value={kpiData.avgAlignment.toString()} unit="%" trend="High" trendDirection="up" icon={<i className="fas fa-bullseye text-yellow-500"></i>} />
                 <KpiCard title="Projects Completed" value={kpiData.projectsCompleted.toString()} unit={`/ ${kpiData.totalProjects}`} trend={`${Math.round(kpiData.projectsCompleted / kpiData.totalProjects * 100)}%`} trendDirection="up" icon={<i className="fas fa-check-double text-purple-500"></i>} />
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
                <div className="xl:col-span-2 h-[600px] xl:h-auto bg-white dark:bg-slate-800/50 p-4 rounded-lg shadow-sm border border-slate-200 dark:border-slate-700">
                     <PmGatiShaktiMap layers={layers} projects={projects} activeLayerIds={activeLayerIds} selectedProjectId={selectedProjectId} />
                </div>
                <div className="space-y-6">
                    <div className="bg-white dark:bg-slate-800/50 p-4 rounded-lg shadow-sm border border-slate-200 dark:border-slate-700">
                        <h3 className="font-semibold text-slate-800 dark:text-slate-200 text-base mb-3 px-2">Data Layers</h3>
                        <div className="space-y-2">
                            {layers.map(layer => (
                                <label key={layer.id} className="flex items-center gap-3 p-2 rounded-md hover:bg-slate-50 dark:hover:bg-slate-700/50 cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={activeLayerIds.has(layer.id)}
                                        onChange={() => handleLayerToggle(layer.id)}
                                        className="h-4 w-4 rounded text-cyan-600 focus:ring-cyan-500 border-slate-300 dark:border-slate-600 bg-slate-100 dark:bg-slate-900"
                                    />
                                    <div className="flex items-center gap-2">
                                        <span className="w-4 h-1 rounded-full" style={{ backgroundColor: layer.color }}></span>
                                        <span className="text-sm">{layer.name}</span>
                                    </div>
                                </label>
                            ))}
                        </div>
                    </div>
                     <div className="bg-white dark:bg-slate-800/50 p-4 rounded-lg shadow-sm border border-slate-200 dark:border-slate-700">
                        <h3 className="font-semibold text-slate-800 dark:text-slate-200 text-base mb-3 px-2">Monitored Projects</h3>
                        <div className="overflow-x-auto">
                           <table className="w-full text-sm text-left">
                               <thead className="text-xs text-slate-500 dark:text-slate-400 uppercase">
                                   <tr><th className="py-2 pr-2">Project Name</th><th className="py-2">Status</th></tr>
                               </thead>
                               <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                                   {paginatedProjects.map(project => (
                                       <tr key={project.id} onClick={() => setSelectedProjectId(project.id)} className={`cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800 ${selectedProjectId === project.id ? 'bg-cyan-50 dark:bg-cyan-900/50' : ''}`}>
                                            <td className="py-2 pr-2 font-medium text-slate-800 dark:text-slate-200">{project.name}</td>
                                            <td className="py-2"><ProjectStatusBadge status={project.status} /></td>
                                       </tr>
                                   ))}
                               </tbody>
                           </table>
                        </div>
                        <div className="flex justify-between items-center mt-3 text-xs">
                             <span className="text-slate-500 dark:text-slate-400">Page {currentPage} of {totalPages}</span>
                            <div className="flex items-center gap-1">
                                <button onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1} className="px-2 py-0.5 border border-slate-300 dark:border-slate-600 rounded disabled:opacity-50">Prev</button>
                                <button onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages} className="px-2 py-0.5 border border-slate-300 dark:border-slate-600 rounded disabled:opacity-50">Next</button>
                            </div>
                        </div>
                     </div>
                </div>
            </div>
        </div>
    );
};


// ===============================================
// WATER ENTITLEMENT SECTION COMPONENTS
// ===============================================

const WuaMapComponent: React.FC<{ wuaData: WuaData[], selectedWuaId: string | null }> = ({ wuaData, selectedWuaId }) => {
    const mapContainerRef = useRef<HTMLDivElement>(null);
    const mapInstanceRef = useRef<any>(null);
    const wuaLayerRef = useRef<any>(null);
    const polygonRefs = useRef<{ [key: string]: any }>({});

    const statusColors = {
        within: { fill: '#22c55e', stroke: '#166534' },
        warning: { fill: '#f59e0b', stroke: '#92400e' },
        exceeded: { fill: '#ef4444', stroke: '#991b1b' },
    };

    useEffect(() => {
        if (mapContainerRef.current && !mapInstanceRef.current) {
            const map = L.map(mapContainerRef.current, { zoomControl: false }).setView([17.05, 74.5], 10);
            L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager_nolabels/{z}/{x}/{y}{r}.png', {
                attribution: '&copy; CARTO',
            }).addTo(map);
            L.control.zoom({ position: 'topright' }).addTo(map);
            mapInstanceRef.current = map;
            wuaLayerRef.current = L.featureGroup().addTo(map);
        }
    }, []);
    
    useEffect(() => {
        if (wuaLayerRef.current) {
            wuaLayerRef.current.clearLayers();
            polygonRefs.current = {};
            wuaData.forEach(wua => {
                const colors = statusColors[wua.status];
                const polygon = L.polygon(wua.boundary, {
                    color: colors.stroke,
                    weight: 1.5,
                    fillColor: colors.fill,
                    fillOpacity: 0.6
                }).addTo(wuaLayerRef.current);
                
                polygon.bindTooltip(`
                    <div style="font-family: Inter, sans-serif;">
                        <strong style="color: #0891b2;">${wua.name}</strong><br>
                        Consumed: <strong>${wua.percentConsumed}%</strong>
                    </div>
                `, { permanent: false, sticky: true });

                polygonRefs.current[wua.id] = polygon;
            });
            if (wuaData.length > 0) {
                mapInstanceRef.current.fitBounds(wuaLayerRef.current.getBounds().pad(0.1));
            }
        }
    }, [wuaData]);

    useEffect(() => {
         Object.values(polygonRefs.current).forEach((p: any) => p.setStyle({ weight: 1.5 }));
         if (selectedWuaId && polygonRefs.current[selectedWuaId]) {
             const selectedPolygon = polygonRefs.current[selectedWuaId];
             selectedPolygon.setStyle({ weight: 4 });
             selectedPolygon.bringToFront();
             mapInstanceRef.current.fitBounds(selectedPolygon.getBounds(), {padding: [50, 50]});
         }
    }, [selectedWuaId]);


    return <div ref={mapContainerRef} className="h-full w-full bg-slate-200 dark:bg-slate-700 rounded-lg" />;
};


const WaterEntitlementSection: React.FC<{ wuaData: WuaData[] }> = ({ wuaData }) => {
    const [selectedWuaId, setSelectedWuaId] = useState<string | null>(null);
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 7;

    const kpiData = useMemo(() => {
        const totalAllocated = wuaData.reduce((sum, w) => sum + w.allocated, 0);
        const totalConsumed = wuaData.reduce((sum, w) => sum + w.usedMonth, 0);
        const overallConsumption = totalAllocated > 0 ? Math.round((totalConsumed / totalAllocated) * 100) : 0;
        const exceededCount = wuaData.filter(w => w.status === 'exceeded').length;
        return { totalAllocated, totalConsumed, overallConsumption, exceededCount };
    }, [wuaData]);
    
    const paginatedWuaData = wuaData.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);
    const totalPages = Math.ceil(wuaData.length / itemsPerPage);

    const WuaStatusBadge: React.FC<{ status: WuaData['status'] }> = ({ status }) => {
        const styles = {
            within: 'bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300',
            warning: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/50 dark:text-yellow-300',
            exceeded: 'bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-300',
        };
        const icon = { within: 'fa-check-circle', warning: 'fa-exclamation-triangle', exceeded: 'fa-times-circle' };
        return <span className={`inline-flex items-center gap-1.5 px-2 py-1 text-xs font-medium rounded-full ${styles[status]}`}><i className={`fas ${icon[status]}`}></i>{status.charAt(0).toUpperCase() + status.slice(1)}</span>;
    };
    
    const ConsumptionBar: React.FC<{ percent: number }> = ({ percent }) => {
        const color = percent > 100 ? 'bg-red-500' : percent > 80 ? 'bg-yellow-500' : 'bg-green-500';
        return (
            <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-2.5">
                <div className={`${color} h-2.5 rounded-full`} style={{ width: `${Math.min(percent, 100)}%` }}></div>
            </div>
        );
    };

    return (
        <div className="animate-fade-in">
             <div className="mb-6">
                <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-200">Water Entitlement & Billing</h1>
                <p className="text-sm text-slate-500 dark:text-slate-400">Monitor WUA water allocation, consumption, and compliance.</p>
            </div>
             <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
                <KpiCard title="Total Allocated (Month)" value={`${(kpiData.totalAllocated / 1e6).toFixed(2)}`} unit="M m³" trend="Stable" trendDirection="up" icon={<i className="fas fa-hand-holding-water text-blue-500"></i>} />
                <KpiCard title="Total Consumed (Month)" value={`${(kpiData.totalConsumed / 1e6).toFixed(2)}`} unit="M m³" trend="+3%" trendDirection="up" icon={<i className="fas fa-water text-cyan-500"></i>} />
                <KpiCard title="Overall Consumption" value={kpiData.overallConsumption.toString()} unit="%" trend="Warning" trendDirection="up" icon={<i className="fas fa-tachometer-alt text-yellow-500"></i>} />
                <KpiCard title="WUAs Exceeding Limit" value={kpiData.exceededCount.toString()} unit={`/ ${wuaData.length}`} trend="Action Required" trendDirection="down" icon={<i className="fas fa-exclamation-circle text-red-500"></i>} />
            </div>
            
             <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                <div className="bg-white dark:bg-slate-800/50 p-4 rounded-lg shadow-sm border border-slate-200 dark:border-slate-700 min-h-[500px]">
                    <WuaMapComponent wuaData={wuaData} selectedWuaId={selectedWuaId} />
                </div>
                 <div className="bg-white dark:bg-slate-800/50 rounded-lg shadow-sm border border-slate-200 dark:border-slate-700">
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm text-left text-slate-500 dark:text-slate-400">
                            <thead className="bg-slate-50 dark:bg-slate-700/50 text-xs text-slate-700 dark:text-slate-300 uppercase">
                                <tr>
                                    <th scope="col" className="px-6 py-3">WUA Name</th>
                                    <th scope="col" className="px-6 py-3">Consumption</th>
                                    <th scope="col" className="px-6 py-3">Status</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                                {paginatedWuaData.map(w => (
                                    <tr key={w.id} onClick={() => setSelectedWuaId(w.id)} className={`cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800 ${selectedWuaId === w.id ? 'bg-cyan-50 dark:bg-cyan-900/50' : ''}`}>
                                        <td className="px-6 py-4">
                                            <p className="font-medium text-slate-900 dark:text-white">{w.name}</p>
                                            <p className="text-xs text-slate-500">{w.division}</p>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-2">
                                                <div className="w-24"><ConsumptionBar percent={w.percentConsumed} /></div>
                                                <span className="font-mono text-xs font-semibold">{w.percentConsumed}%</span>
                                            </div>
                                            <p className="text-xs text-slate-500 dark:text-slate-400 font-mono">
                                                {w.usedMonth.toLocaleString()} / {w.allocated.toLocaleString()} m³
                                            </p>
                                        </td>
                                        <td className="px-6 py-4"><WuaStatusBadge status={w.status} /></td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                     <div className="flex justify-between items-center p-4 border-t border-slate-200 dark:border-slate-700">
                        <span className="text-sm text-slate-500 dark:text-slate-400">Page {currentPage} of {totalPages}</span>
                        <div className="flex items-center gap-2">
                            <button onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1} className="px-3 py-1 border border-slate-300 dark:border-slate-600 rounded-md disabled:opacity-50">Prev</button>
                            <button onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages} className="px-3 py-1 border border-slate-300 dark:border-slate-600 rounded-md disabled:opacity-50">Next</button>
                        </div>
                    </div>
                </div>
             </div>
        </div>
    );
};

// ===============================================
// ALL NOTIFICATIONS SECTION COMPONENTS
// ===============================================

const AllNotificationsSection: React.FC<{
    appNotifications: AppNotification[],
    notificationRules: NotificationRule[],
    notificationHistory: NotificationHistory[],
}> = ({ appNotifications, notificationRules, notificationHistory }) => {
    const [activeTab, setActiveTab] = useState('inbox');
    const tabs = [
        { id: 'inbox', label: 'Inbox' },
        { id: 'rules', label: 'Notification Rules' },
        { id: 'history', label: 'Notification History' },
    ];

    const renderContent = () => {
        switch (activeTab) {
            case 'inbox': return <InboxView initialNotifications={appNotifications} />;
            case 'rules': return <RulesView rules={notificationRules} />;
            case 'history': return <HistoryView history={notificationHistory} />;
            default: return null;
        }
    };
    
    return (
        <div className="animate-fade-in">
            <div className="mb-6">
                <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-200">Notifications Center</h1>
                <p className="text-sm text-slate-500 dark:text-slate-400">View, manage, and configure system alerts.</p>
            </div>
            <div className="border-b border-slate-200 dark:border-slate-700 mb-6">
                <nav className="-mb-px flex gap-6" aria-label="Tabs">
                    {tabs.map(tab => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={`${
                                activeTab === tab.id
                                    ? 'border-cyan-500 text-cyan-600 dark:text-cyan-400'
                                    : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300 dark:text-slate-400 dark:hover:text-slate-300 dark:hover:border-slate-600'
                            } whitespace-nowrap py-3 px-1 border-b-2 font-medium text-sm transition-colors`}
                        >
                            {tab.label}
                        </button>
                    ))}
                </nav>
            </div>
            {renderContent()}
        </div>
    );
};

const InboxView: React.FC<{ initialNotifications: AppNotification[] }> = ({ initialNotifications }) => {
    const [notifications, setNotifications] = useState(initialNotifications);
    const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
    const [searchTerm, setSearchTerm] = useState('');
    const [severityFilter, setSeverityFilter] = useState('all');
    const [statusFilter, setStatusFilter] = useState('all');
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 10;

    const filteredNotifications = useMemo(() => {
        return notifications.filter(n => {
            const searchLower = searchTerm.toLowerCase();
            const matchesSearch = !searchTerm || n.title.toLowerCase().includes(searchLower) || n.message.toLowerCase().includes(searchLower);
            const matchesSeverity = severityFilter === 'all' || n.severity === severityFilter;
            const matchesStatus = statusFilter === 'all' || n.status === statusFilter;
            return matchesSearch && matchesSeverity && matchesStatus;
        });
    }, [notifications, searchTerm, severityFilter, statusFilter]);
    
    const paginatedNotifications = useMemo(() => {
        return filteredNotifications.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);
    }, [filteredNotifications, currentPage]);

    const totalPages = Math.ceil(filteredNotifications.length / itemsPerPage);

    const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.checked) {
            setSelectedIds(new Set(paginatedNotifications.map(n => n.id)));
        } else {
            setSelectedIds(new Set());
        }
    };
    
    const handleSelectOne = (id: string) => {
        const newSelection = new Set(selectedIds);
        newSelection.has(id) ? newSelection.delete(id) : newSelection.add(id);
        setSelectedIds(newSelection);
    };

    const isAllSelected = paginatedNotifications.length > 0 && selectedIds.size === paginatedNotifications.length;

    const updateNotificationStatus = (ids: Set<string>, status: 'read' | 'unread') => {
        setNotifications(prev => prev.map(n => ids.has(n.id) ? { ...n, status } : n));
        setSelectedIds(new Set());
    };
    
    const archiveNotifications = (ids: Set<string>) => {
        setNotifications(prev => prev.filter(n => !ids.has(n.id)));
        setSelectedIds(new Set());
    };

    const SeverityBadge: React.FC<{ severity: AppNotification['severity'] }> = ({ severity }) => {
        const styles = {
            critical: 'bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-300',
            high: 'bg-orange-100 text-orange-800 dark:bg-orange-900/50 dark:text-orange-300',
            medium: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/50 dark:text-yellow-300',
            low: 'bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-300'
        };
        return <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${styles[severity]}`}>{severity}</span>;
    };
    
    return (
        <div className="animate-fade-in-slow">
            <div className="bg-white dark:bg-slate-800/50 p-4 rounded-lg shadow-sm border border-slate-200 dark:border-slate-700 mb-6">
                 <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    <div className="relative">
                        <i className="fas fa-search absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"></i>
                        <input type="text" placeholder="Search notifications..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="w-full pl-9 pr-3 py-2 bg-slate-50 dark:bg-slate-700/50 border border-slate-200 dark:border-slate-600 rounded-md text-sm focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 outline-none"/>
                    </div>
                    <select value={severityFilter} onChange={e => setSeverityFilter(e.target.value)} className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-700/50 border border-slate-200 dark:border-slate-600 rounded-md text-sm focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 outline-none">
                        <option value="all">All Severities</option>
                        <option value="critical">Critical</option>
                        <option value="high">High</option>
                        <option value="medium">Medium</option>
                        <option value="low">Low</option>
                    </select>
                     <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-700/50 border border-slate-200 dark:border-slate-600 rounded-md text-sm focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 outline-none">
                        <option value="all">All Statuses</option>
                        <option value="unread">Unread</option>
                        <option value="read">Read</option>
                    </select>
                </div>
            </div>

            <div className="flex justify-between items-center mb-4">
                <div className="flex items-center gap-2">
                    <button onClick={() => updateNotificationStatus(new Set(notifications.map(n => n.id)), 'read')} className="px-3 py-1.5 text-xs font-medium text-slate-600 dark:text-slate-300 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-md hover:bg-slate-50 dark:hover:bg-slate-700"><i className="fas fa-check-double mr-2"></i>Mark all as read</button>
                    {selectedIds.size > 0 && (
                        <button onClick={() => archiveNotifications(selectedIds)} className="px-3 py-1.5 text-xs font-medium text-slate-600 dark:text-slate-300 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-md hover:bg-slate-50 dark:hover:bg-slate-700"><i className="fas fa-archive mr-2"></i>Archive Selected</button>
                    )}
                </div>
                <span className="text-sm text-slate-500 dark:text-slate-400">{filteredNotifications.length} notifications</span>
            </div>
            
            <div className="bg-white dark:bg-slate-800/50 rounded-lg shadow-sm border border-slate-200 dark:border-slate-700">
                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left text-slate-500 dark:text-slate-400">
                        <thead className="bg-slate-50 dark:bg-slate-700/50 text-xs text-slate-700 dark:text-slate-300 uppercase">
                           <tr>
                                <th scope="col" className="p-4"><input type="checkbox" onChange={handleSelectAll} checked={isAllSelected} className="rounded" /></th>
                                <th scope="col" className="px-4 py-3">Details</th>
                                <th scope="col" className="px-4 py-3">Severity</th>
                                <th scope="col" className="px-4 py-3">Timestamp</th>
                                <th scope="col" className="px-4 py-3">Actions</th>
                           </tr>
                        </thead>
                         <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                           {paginatedNotifications.map(n => (
                                <tr key={n.id} className={`${n.status === 'unread' ? 'bg-cyan-50/30 dark:bg-cyan-900/20' : ''} hover:bg-slate-50 dark:hover:bg-slate-800`}>
                                    <td className="p-4"><input type="checkbox" checked={selectedIds.has(n.id)} onChange={() => handleSelectOne(n.id)} className="rounded"/></td>
                                    <td className="px-4 py-3">
                                        <div className="flex items-start gap-3">
                                            <i className={`fas ${n.icon} mt-1 text-base text-slate-400 dark:text-slate-500`}></i>
                                            <div>
                                                <p className={`font-semibold text-slate-800 dark:text-slate-200 ${n.status === 'unread' ? 'font-bold' : ''}`}>{n.title}</p>
                                                <p className="text-xs text-slate-500 dark:text-slate-400 max-w-md">{n.message}</p>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-4 py-3"><SeverityBadge severity={n.severity} /></td>
                                    <td className="px-4 py-3 text-xs whitespace-nowrap">{n.timestamp.toLocaleString()}</td>
                                    <td className="px-4 py-3">
                                       <div className="flex items-center gap-3 text-slate-500">
                                            {n.status === 'unread' && <button onClick={() => updateNotificationStatus(new Set([n.id]), 'read')} title="Mark as Read" className="hover:text-cyan-600"><i className="fas fa-check"></i></button>}
                                            <button onClick={() => archiveNotifications(new Set([n.id]))} title="Archive" className="hover:text-red-500"><i className="fas fa-archive"></i></button>
                                       </div>
                                    </td>
                               </tr>
                           ))}
                        </tbody>
                    </table>
                </div>
            </div>
             <div className="flex justify-between items-center mt-4">
                <span className="text-sm text-slate-500 dark:text-slate-400">
                    Showing {Math.min((currentPage - 1) * itemsPerPage + 1, filteredNotifications.length)}-{Math.min(currentPage * itemsPerPage, filteredNotifications.length)} of {filteredNotifications.length}
                </span>
                <div className="flex items-center gap-2">
                    <button onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1} className="px-3 py-1 border border-slate-300 dark:border-slate-600 rounded-md disabled:opacity-50">Prev</button>
                    <span className="text-sm">Page {currentPage} of {totalPages}</span>
                    <button onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages} className="px-3 py-1 border border-slate-300 dark:border-slate-600 rounded-md disabled:opacity-50">Next</button>
                </div>
            </div>
        </div>
    );
};

const RulesView: React.FC<{ rules: NotificationRule[] }> = ({ rules }) => {
    const [currentRules, setCurrentRules] = useState(rules);
    
    const toggleRuleStatus = (id: string) => {
        setCurrentRules(prev => prev.map(r => r.id === id ? { ...r, active: !r.active } : r));
    };

    const ToggleSwitch: React.FC<{ checked: boolean, onChange: () => void }> = ({ checked, onChange }) => (
        <label className="relative inline-flex items-center cursor-pointer">
            <input type="checkbox" checked={checked} onChange={onChange} className="sr-only peer" />
            <div className="w-11 h-6 bg-slate-200 dark:bg-slate-700 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-cyan-300 dark:peer-focus:ring-cyan-800 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-slate-600 peer-checked:bg-cyan-600"></div>
        </label>
    );

    return (
        <div className="animate-fade-in-slow">
            <div className="flex justify-end mb-4">
                 <button className="px-4 py-2 text-sm font-medium text-white bg-cyan-600 rounded-md hover:bg-cyan-700 transition-colors">
                    <i className="fas fa-plus mr-2"></i>Create New Rule
                </button>
            </div>
             <div className="bg-white dark:bg-slate-800/50 rounded-lg shadow-sm border border-slate-200 dark:border-slate-700 overflow-x-auto">
                 <table className="w-full text-sm text-left text-slate-500 dark:text-slate-400">
                    <thead className="bg-slate-50 dark:bg-slate-700/50 text-xs text-slate-700 dark:text-slate-300 uppercase">
                       <tr>
                            <th scope="col" className="px-6 py-3">Rule Name</th>
                            <th scope="col" className="px-6 py-3">Trigger Condition</th>
                            <th scope="col" className="px-6 py-3">Action</th>
                            <th scope="col" className="px-6 py-3">Active</th>
                            <th scope="col" className="px-6 py-3">Actions</th>
                       </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                        {currentRules.map(rule => (
                            <tr key={rule.id} className="hover:bg-slate-50 dark:hover:bg-slate-800">
                                <td className="px-6 py-4 font-semibold text-slate-800 dark:text-slate-200">{rule.name}</td>
                                <td className="px-6 py-4 text-xs">{rule.trigger}</td>
                                <td className="px-6 py-4 text-xs">{rule.action}</td>
                                <td className="px-6 py-4"><ToggleSwitch checked={rule.active} onChange={() => toggleRuleStatus(rule.id)} /></td>
                                <td className="px-6 py-4">
                                   <div className="flex items-center gap-3 text-slate-500">
                                       <button className="hover:text-cyan-600" title="Edit"><i className="fas fa-pencil-alt"></i></button>
                                       <button className="hover:text-red-500" title="Delete"><i className="fas fa-trash"></i></button>
                                   </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                 </table>
             </div>
        </div>
    );
};

const HistoryView: React.FC<{ history: NotificationHistory[] }> = ({ history }) => {
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 10;
    const paginatedHistory = history.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);
    const totalPages = Math.ceil(history.length / itemsPerPage);

    const DeliveryStatusBadge: React.FC<{ status: 'Delivered' | 'Failed' }> = ({ status }) => {
        const styles = {
            Delivered: 'bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300',
            Failed: 'bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-300',
        };
        return <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${styles[status]}`}>{status}</span>;
    };
    
    return (
        <div className="animate-fade-in-slow">
             <div className="bg-white dark:bg-slate-800/50 rounded-lg shadow-sm border border-slate-200 dark:border-slate-700 overflow-x-auto">
                 <table className="w-full text-sm text-left text-slate-500 dark:text-slate-400">
                    <thead className="bg-slate-50 dark:bg-slate-700/50 text-xs text-slate-700 dark:text-slate-300 uppercase">
                        <tr>
                            <th scope="col" className="px-6 py-3">Timestamp</th>
                            <th scope="col" className="px-6 py-3">Rule Triggered</th>
                            <th scope="col" className="px-6 py-3">Recipient</th>
                            <th scope="col" className="px-6 py-3">Channel</th>
                            <th scope="col" className="px-6 py-3">Status</th>
                        </tr>
                    </thead>
                     <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                        {paginatedHistory.map((item, index) => (
                            <tr key={index} className="hover:bg-slate-50 dark:hover:bg-slate-800">
                                <td className="px-6 py-4 whitespace-nowrap">{item.timestamp.toLocaleString()}</td>
                                <td className="px-6 py-4">{item.rule}</td>
                                <td className="px-6 py-4 font-mono text-xs">{item.recipient}</td>
                                <td className="px-6 py-4">{item.channel}</td>
                                <td className="px-6 py-4"><DeliveryStatusBadge status={item.status} /></td>
                            </tr>
                        ))}
                    </tbody>
                 </table>
             </div>
             <div className="flex justify-between items-center mt-4">
                 <span className="text-sm text-slate-500 dark:text-slate-400">Page {currentPage} of {totalPages}</span>
                <div className="flex items-center gap-2">
                    <button onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1} className="px-3 py-1 border border-slate-300 dark:border-slate-600 rounded-md disabled:opacity-50">Prev</button>
                    <button onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages} className="px-3 py-1 border border-slate-300 dark:border-slate-600 rounded-md disabled:opacity-50">Next</button>
                </div>
            </div>
        </div>
    );
};

// ===============================================
// AUDIT LOGS SECTION COMPONENTS
// ===============================================

const AuditLogsSection: React.FC<{ auditLogs: AuditLog[] }> = ({ auditLogs }) => {
    const [searchTerm, setSearchTerm] = useState('');
    const [roleFilter, setRoleFilter] = useState<Role | 'all'>('all');
    const [statusFilter, setStatusFilter] = useState<'all' | 'success' | 'failure'>('all');
    const [dateRange, setDateRange] = useState<{ start: string; end: string }>({ start: '', end: '' });
    const [sortConfig, setSortConfig] = useState<{ key: keyof AuditLog; direction: 'asc' | 'desc' }>({ key: 'timestamp', direction: 'desc' });
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 15;

    const sortedAndFilteredLogs = useMemo(() => {
        let filtered = auditLogs.filter(log => {
            const searchLower = searchTerm.toLowerCase();
            const matchesSearch = !searchTerm ||
                log.user.toLowerCase().includes(searchLower) ||
                log.action.toLowerCase().includes(searchLower) ||
                log.entityId.toLowerCase().includes(searchLower) ||
                log.ipAddress.includes(searchTerm);
            
            const matchesRole = roleFilter === 'all' || log.role === roleFilter;
            const matchesStatus = statusFilter === 'all' || log.status === statusFilter;
            
            const logDate = log.timestamp.getTime();
            const startDate = dateRange.start ? new Date(dateRange.start).getTime() : 0;
            const endDate = dateRange.end ? new Date(dateRange.end).setHours(23, 59, 59, 999) : Infinity;
            const matchesDate = logDate >= startDate && logDate <= endDate;

            return matchesSearch && matchesRole && matchesStatus && matchesDate;
        });

        if (sortConfig.key) {
            filtered.sort((a, b) => {
                const aValue = a[sortConfig.key];
                const bValue = b[sortConfig.key];
                if (aValue < bValue) return sortConfig.direction === 'asc' ? -1 : 1;
                if (aValue > bValue) return sortConfig.direction === 'asc' ? 1 : -1;
                return 0;
            });
        }
        return filtered;
    }, [auditLogs, searchTerm, roleFilter, statusFilter, dateRange, sortConfig]);

    const paginatedLogs = useMemo(() => {
        return sortedAndFilteredLogs.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);
    }, [sortedAndFilteredLogs, currentPage]);

    const totalPages = Math.ceil(sortedAndFilteredLogs.length / itemsPerPage);

    const handleSort = (key: keyof AuditLog) => {
        let direction: 'asc' | 'desc' = 'asc';
        if (sortConfig.key === key && sortConfig.direction === 'asc') {
            direction = 'desc';
        }
        setSortConfig({ key, direction });
    };

    const RoleBadge: React.FC<{ role: Role }> = ({ role }) => {
        const styles = {
            admin: 'bg-purple-100 text-purple-800 dark:bg-purple-900/50 dark:text-purple-300',
            wrd_user: 'bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-300',
            non_wrd_user: 'bg-slate-100 text-slate-800 dark:bg-slate-700 dark:text-slate-300',
        };
        const text = { admin: 'Admin', wrd_user: 'WRD User', non_wrd_user: 'Non-WRD User' };
        return <span className={`px-2 py-1 text-xs font-medium rounded-full ${styles[role]}`}>{text[role]}</span>;
    };
    
    const StatusBadge: React.FC<{ status: 'success' | 'failure' }> = ({ status }) => {
        const styles = {
            success: 'bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300',
            failure: 'bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-300',
        };
        const icon = { success: 'fa-check-circle', failure: 'fa-times-circle' };
        return <span className={`inline-flex items-center gap-1.5 px-2 py-1 text-xs font-medium rounded-full ${styles[status]}`}><i className={`fas ${icon[status]}`}></i>{status}</span>;
    };
    
    return (
        <div className="animate-fade-in">
            <div className="mb-6">
                <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-200">Audit Logs</h1>
                <p className="text-sm text-slate-500 dark:text-slate-400">Track all user and system activities for security and compliance.</p>
            </div>

            <div className="bg-white dark:bg-slate-800/50 p-4 rounded-lg shadow-sm border border-slate-200 dark:border-slate-700 mb-6">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                    <div className="relative xl:col-span-2">
                        <i className="fas fa-search absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"></i>
                        <input type="text" placeholder="Search user, action, ID..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="w-full pl-9 pr-3 py-2 bg-slate-50 dark:bg-slate-700/50 border border-slate-200 dark:border-slate-600 rounded-md text-sm focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 outline-none"/>
                    </div>
                    <div className="flex items-center gap-2">
                        <input type="date" value={dateRange.start} onChange={e => setDateRange(p => ({...p, start: e.target.value}))} className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-700/50 border border-slate-200 dark:border-slate-600 rounded-md text-sm focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 outline-none"/>
                        <span className="text-slate-500 text-sm">to</span>
                        <input type="date" value={dateRange.end} onChange={e => setDateRange(p => ({...p, end: e.target.value}))} className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-700/50 border border-slate-200 dark:border-slate-600 rounded-md text-sm focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 outline-none"/>
                    </div>
                     <select value={roleFilter} onChange={e => setRoleFilter(e.target.value as any)} className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-700/50 border border-slate-200 dark:border-slate-600 rounded-md text-sm focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 outline-none">
                        <option value="all">All Roles</option>
                        <option value="admin">Admin</option>
                        <option value="wrd_user">WRD User</option>
                        <option value="non_wrd_user">Non-WRD User</option>
                    </select>
                    <select value={statusFilter} onChange={e => setStatusFilter(e.target.value as any)} className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-700/50 border border-slate-200 dark:border-slate-600 rounded-md text-sm focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 outline-none">
                        <option value="all">All Statuses</option>
                        <option value="success">Success</option>
                        <option value="failure">Failure</option>
                    </select>
                </div>
            </div>
            
             <div className="bg-white dark:bg-slate-800/50 rounded-lg shadow-sm border border-slate-200 dark:border-slate-700 overflow-x-auto">
                 <table className="w-full text-sm text-left text-slate-500 dark:text-slate-400">
                     <thead className="bg-slate-50 dark:bg-slate-700/50 text-xs text-slate-700 dark:text-slate-300 uppercase">
                        <tr>
                            <th scope="col" className="px-4 py-3">
                                <button className="flex items-center gap-1.5" onClick={() => handleSort('timestamp')}>
                                    Timestamp {sortConfig.key === 'timestamp' && <i className={`fas fa-arrow-${sortConfig.direction === 'asc' ? 'up' : 'down'}`}></i>}
                                </button>
                            </th>
                            <th scope="col" className="px-4 py-3">User</th>
                            <th scope="col" className="px-4 py-3">Role</th>
                            <th scope="col" className="px-4 py-3">Action</th>
                            <th scope="col" className="px-4 py-3">Entity</th>
                            <th scope="col" className="px-4 py-3">Status</th>
                            <th scope="col" className="px-4 py-3">IP Address</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                       {paginatedLogs.map(log => (
                           <tr key={log.id} className="hover:bg-slate-50 dark:hover:bg-slate-800">
                               <td className="px-4 py-3 whitespace-nowrap">{log.timestamp.toLocaleString()}</td>
                               <td className="px-4 py-3 font-medium text-slate-900 dark:text-white">{log.user}</td>
                               <td className="px-4 py-3"><RoleBadge role={log.role} /></td>
                               <td className="px-4 py-3">{log.action}</td>
                               <td className="px-4 py-3">
                                   <p className="font-mono text-xs">{log.entityId}</p>
                                   <p className="text-xs text-slate-500">{log.entityType}</p>
                               </td>
                               <td className="px-4 py-3"><StatusBadge status={log.status} /></td>
                               <td className="px-4 py-3 font-mono text-xs">{log.ipAddress}</td>
                           </tr>
                       ))}
                    </tbody>
                 </table>
            </div>

            <div className="flex justify-between items-center mt-4">
                <span className="text-sm text-slate-500 dark:text-slate-400">
                    Showing {Math.min((currentPage - 1) * itemsPerPage + 1, sortedAndFilteredLogs.length)}-{Math.min(currentPage * itemsPerPage, sortedAndFilteredLogs.length)} of {sortedAndFilteredLogs.length}
                </span>
                <div className="flex items-center gap-2">
                    <button onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1} className="px-3 py-1 border border-slate-300 dark:border-slate-600 rounded-md disabled:opacity-50">Prev</button>
                    <span className="text-sm">Page {currentPage} of {totalPages}</span>
                     <button onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages} className="px-3 py-1 border border-slate-300 dark:border-slate-600 rounded-md disabled:opacity-50">Next</button>
                </div>
            </div>
        </div>
    );
};


// ===============================================
// SLA MONITORING SECTION COMPONENTS
// ===============================================

const SlaHistoryChart: React.FC<{ theme: 'light' | 'dark' }> = ({ theme }) => {
    const chartRef = useRef<HTMLCanvasElement>(null);
    const chartInstanceRef = useRef<any>(null);

    const chartData = useMemo(() => {
        const labels = Array.from({ length: 30 }, (_, i) => {
            const date = new Date();
            date.setDate(date.getDate() - (29 - i));
            return date.toLocaleDateString('en-GB', { day: '2-digit', month: 'short' });
        });
        const data = Array.from({ length: 30 }, () => 98.5 + Math.random() * 1.4); // Simulate values between 98.5 and 99.9
        return { labels, data };
    }, []);

    useEffect(() => {
        if (chartRef.current) {
            if (chartInstanceRef.current) chartInstanceRef.current.destroy();
            const ctx = chartRef.current.getContext('2d');
            if (ctx) {
                const isDark = theme === 'dark';
                chartInstanceRef.current = new Chart(ctx, {
                    type: 'line',
                    data: {
                        labels: chartData.labels,
                        datasets: [{
                            label: 'SLA Compliance (%)',
                            data: chartData.data,
                            borderColor: '#8b5cf6',
                            backgroundColor: 'rgba(139, 92, 246, 0.1)',
                            fill: true, tension: 0.4,
                        }]
                    },
                    options: {
                        responsive: true, maintainAspectRatio: false,
                        plugins: { legend: { display: false } },
                        scales: {
                            y: { beginAtZero: false, min: 98, max: 100, grid: { color: isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)' }, ticks: { color: isDark ? '#cbd5e1' : '#475569', font: { size: 10 }, callback: value => `${value}%` } },
                            x: { grid: { display: false }, ticks: { color: isDark ? '#cbd5e1' : '#475569', font: { size: 10 }, maxRotation: 0, autoSkip: true, maxTicksLimit: 10 } }
                        }
                    }
                });
            }
        }
        return () => { if (chartInstanceRef.current) chartInstanceRef.current.destroy(); };
    }, [theme, chartData]);

    return <canvas ref={chartRef}></canvas>;
};

const SlaMetricCard: React.FC<{ metric: SlaMetric }> = ({ metric }) => {
    const radius = 50;
    const stroke = 8;
    const normalizedRadius = radius - stroke * 2;
    const circumference = normalizedRadius * 2 * Math.PI;
    
    let progress = 0;
    if (metric.unit === '%') {
        progress = metric.actual / 100;
    } else { // For time-based, lower is better
        progress = Math.max(0, 1 - (metric.actual - metric.target) / metric.target);
    }
    progress = Math.min(1, Math.max(0, progress));
    const strokeDashoffset = circumference - progress * circumference;

    const statusColors = {
        compliant: 'text-green-500',
        at_risk: 'text-yellow-500',
        breached: 'text-red-500',
    };

    return (
        <div className="bg-white dark:bg-slate-800/50 p-4 rounded-lg shadow-sm border border-slate-200 dark:border-slate-700 flex flex-col items-center text-center">
            <div className="relative w-32 h-32">
                <svg height="100%" viewBox="0 0 120 120" width="100%">
                    <circle
                        className="text-slate-200 dark:text-slate-700"
                        stroke="currentColor"
                        strokeWidth={stroke}
                        fill="transparent"
                        r={normalizedRadius}
                        cx={radius}
                        cy={radius}
                    />
                    <circle
                        className={statusColors[metric.status]}
                        stroke="currentColor"
                        strokeDasharray={`${circumference} ${circumference}`}
                        style={{ strokeDashoffset }}
                        strokeWidth={stroke}
                        fill="transparent"
                        r={normalizedRadius}
                        cx={radius}
                        cy={radius}
                        transform={`rotate(-90 ${radius} ${radius})`}
                    />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className={`text-2xl font-bold ${statusColors[metric.status]}`}>{metric.actual}<span className="text-lg">{metric.unit}</span></span>
                    <span className="text-xs text-slate-500">Target: {metric.target}{metric.unit}</span>
                </div>
            </div>
            <h4 className="font-semibold text-sm mt-3">{metric.name}</h4>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">{metric.description}</p>
        </div>
    );
};

const SlaMonitoringSection: React.FC<{ slaMetrics: SlaMetric[], contractorSlas: ContractorSla[], theme: 'light' | 'dark' }> = ({ slaMetrics, contractorSlas, theme }) => {
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 5;

    const paginatedContractorSlas = contractorSlas.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);
    const totalPages = Math.ceil(contractorSlas.length / itemsPerPage);

    const kpiData = useMemo(() => {
        const uptime = slaMetrics.find(m => m.id === 'uptime')?.actual ?? 0;
        const freshness = slaMetrics.find(m => m.id === 'data_freshness')?.actual ?? 0;
        const apiPerf = slaMetrics.find(m => m.id === 'api_success')?.actual ?? 0;
        const resolution = slaMetrics.find(m => m.id === 'ticket_res')?.actual ?? 0;
        return { uptime, freshness, apiPerf, resolution };
    }, [slaMetrics]);

    const SlaStatusBadge: React.FC<{ status: 'compliant' | 'at_risk' | 'breached' }> = ({ status }) => {
        const styles = {
            compliant: 'bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300',
            at_risk: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/50 dark:text-yellow-300',
            breached: 'bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-300',
        };
        const text = { compliant: 'Compliant', at_risk: 'At Risk', breached: 'Breached' };
        return <span className={`px-2 py-1 text-xs font-medium rounded-full ${styles[status]}`}>{text[status]}</span>;
    };
    
    const PerfBar: React.FC<{ actual: number; target: number; lowerIsBetter?: boolean }> = ({ actual, target, lowerIsBetter = false }) => {
        const percent = lowerIsBetter ? (target / actual) * 100 : (actual / target) * 100;
        const color = percent >= 100 ? 'bg-green-500' : percent >= 99 ? 'bg-yellow-500' : 'bg-red-500';
        return <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-2"><div className={`${color} h-2 rounded-full`} style={{ width: `${Math.min(percent, 100)}%` }}></div></div>;
    };

    return (
        <div className="animate-fade-in">
             <div className="mb-6">
                <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-200">SLA Monitoring</h1>
                <p className="text-sm text-slate-500 dark:text-slate-400">Track and analyze system performance against Service Level Agreements.</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
                <KpiCard title="Overall Uptime" value={kpiData.uptime.toString()} unit="%" trend="Compliant" trendDirection="up" icon={<i className="fas fa-shield-alt text-green-500"></i>} />
                <KpiCard title="Data Freshness" value={kpiData.freshness.toString()} unit="min" trend="Good" trendDirection="up" icon={<i className="fas fa-history text-blue-500"></i>} />
                <KpiCard title="API Performance" value={kpiData.apiPerf.toString()} unit="%" trend="At Risk" trendDirection="down" icon={<i className="fas fa-cogs text-yellow-500"></i>} />
                <KpiCard title="Support Resolution" value={kpiData.resolution.toString()} unit="hrs" trend="Excellent" trendDirection="up" icon={<i className="fas fa-headset text-purple-500"></i>} />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 mb-6">
                {slaMetrics.map(metric => <SlaMetricCard key={metric.id} metric={metric} />)}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
                <div className="lg:col-span-3 bg-white dark:bg-slate-800/50 p-6 rounded-lg shadow-sm border border-slate-200 dark:border-slate-700">
                     <h3 className="font-semibold text-slate-800 dark:text-slate-200 mb-4">SLA Compliance Trend (Last 30 Days)</h3>
                     <div className="h-64"><SlaHistoryChart theme={theme} /></div>
                </div>
            </div>
            
            <div>
                <h3 className="text-xl font-bold text-slate-800 dark:text-slate-200 mb-4">Contractor SLA Performance</h3>
                <div className="bg-white dark:bg-slate-800/50 rounded-lg shadow-sm border border-slate-200 dark:border-slate-700 overflow-x-auto">
                    <table className="w-full text-sm text-left text-slate-500 dark:text-slate-400">
                        <thead className="bg-slate-50 dark:bg-slate-700/50 text-xs text-slate-700 dark:text-slate-300 uppercase">
                            <tr>
                                <th scope="col" className="px-6 py-3">Contractor</th>
                                <th scope="col" className="px-6 py-3">Uptime</th>
                                <th scope="col" className="px-6 py-3">Data Freshness</th>
                                <th scope="col" className="px-6 py-3">API Success Rate</th>
                                <th scope="col" className="px-6 py-3">Overall Status</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                           {paginatedContractorSlas.map(sla => (
                                <tr key={sla.contractorId}>
                                    <td className="px-6 py-4 font-medium text-slate-900 dark:text-white">{sla.contractorName}</td>
                                    <td className="px-6 py-4"><PerfBar actual={sla.uptime.actual} target={sla.uptime.target} /> <span className="text-xs font-mono">{sla.uptime.actual}% / {sla.uptime.target}%</span></td>
                                    <td className="px-6 py-4"><PerfBar actual={sla.dataFreshness.actual} target={sla.dataFreshness.target} lowerIsBetter /> <span className="text-xs font-mono">{sla.dataFreshness.actual}m / {sla.dataFreshness.target}m</span></td>
                                    <td className="px-6 py-4"><PerfBar actual={sla.apiSuccessRate.actual} target={sla.apiSuccessRate.target} /> <span className="text-xs font-mono">{sla.apiSuccessRate.actual}% / {sla.apiSuccessRate.target}%</span></td>
                                    <td className="px-6 py-4"><SlaStatusBadge status={sla.overallStatus} /></td>
                                </tr>
                           ))}
                        </tbody>
                    </table>
                </div>
                 <div className="flex justify-between items-center mt-4">
                    <span className="text-sm text-slate-500 dark:text-slate-400">Page {currentPage} of {totalPages}</span>
                    <div className="flex items-center gap-2">
                        <button onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1} className="px-3 py-1 border border-slate-300 dark:border-slate-600 rounded-md disabled:opacity-50">Prev</button>
                        <button onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages} className="px-3 py-1 border border-slate-300 dark:border-slate-600 rounded-md disabled:opacity-50">Next</button>
                    </div>
                </div>
            </div>
        </div>
    );
};

// ===============================================
// SUPPORT TICKETS SECTION COMPONENTS
// ===============================================

const SupportTicketsSection: React.FC<{ tickets: SupportTicket[], kbArticles: KnowledgeBaseArticle[], theme: 'light' | 'dark' }> = ({ tickets, kbArticles, theme }) => {
    const [activeTab, setActiveTab] = useState('dashboard');
    const tabs = [
        { id: 'dashboard', label: 'Dashboard' },
        { id: 'all_tickets', label: 'All Tickets' },
        { id: 'knowledge_base', label: 'Knowledge Base' },
        { id: 'submit_ticket', label: 'Submit a Ticket' },
    ];
    
    const [currentTickets, setCurrentTickets] = useState(tickets);
    
    const addTicket = (newTicketData: Omit<SupportTicket, 'id' | 'createdAt' | 'updatedAt'>) => {
        const newTicket: SupportTicket = {
            id: `TKT-${String(7000 + currentTickets.length + 1).padStart(5, '0')}`,
            createdAt: new Date(),
            updatedAt: new Date(),
            ...newTicketData,
        };
        setCurrentTickets(prev => [newTicket, ...prev]);
        setActiveTab('all_tickets'); // Switch to ticket list after submission
    };

    const renderContent = () => {
        switch (activeTab) {
            case 'dashboard': return <TicketDashboardView tickets={currentTickets} theme={theme} />;
            case 'all_tickets': return <AllTicketsView tickets={currentTickets} />;
            case 'knowledge_base': return <KnowledgeBaseView articles={kbArticles} />;
            case 'submit_ticket': return <SubmitTicketForm onSubmit={addTicket} />;
            default: return null;
        }
    };

    return (
        <div className="animate-fade-in">
            <div className="mb-6">
                <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-200">Support Center</h1>
                <p className="text-sm text-slate-500 dark:text-slate-400">Manage support tickets and access help resources.</p>
            </div>
            <div className="border-b border-slate-200 dark:border-slate-700 mb-6">
                <nav className="-mb-px flex gap-6" aria-label="Tabs">
                    {tabs.map(tab => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={`${
                                activeTab === tab.id
                                    ? 'border-cyan-500 text-cyan-600 dark:text-cyan-400'
                                    : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300 dark:text-slate-400 dark:hover:text-slate-300 dark:hover:border-slate-600'
                            } whitespace-nowrap py-3 px-1 border-b-2 font-medium text-sm transition-colors`}
                        >
                            {tab.label}
                        </button>
                    ))}
                </nav>
            </div>
            {renderContent()}
        </div>
    );
};

const TicketDashboardView: React.FC<{ tickets: SupportTicket[], theme: 'light' | 'dark' }> = ({ tickets, theme }) => {
    const kpiData = useMemo(() => {
        const openTickets = tickets.filter(t => t.status === 'open' || t.status === 'in_progress').length;
        const resolvedToday = tickets.filter(t => t.status === 'resolved' && t.updatedAt.toDateString() === new Date().toDateString()).length;
        const totalResolutionTime = tickets.filter(t => t.status === 'resolved' || t.status === 'closed').reduce((acc, t) => acc + (t.updatedAt.getTime() - t.createdAt.getTime()), 0);
        const resolvedCount = tickets.filter(t => t.status === 'resolved' || t.status === 'closed').length;
        const avgResolutionTime = resolvedCount > 0 ? (totalResolutionTime / resolvedCount / (1000 * 3600)).toFixed(1) : 'N/A';
        const overdueTickets = tickets.filter(t => (t.status === 'open' || t.status === 'in_progress') && (new Date().getTime() - t.createdAt.getTime()) > (3 * 24 * 3600 * 1000)).length; // Overdue if > 3 days
        return { openTickets, resolvedToday, avgResolutionTime, overdueTickets };
    }, [tickets]);
    
    return (
        <div className="animate-fade-in-slow">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
                <KpiCard title="Open Tickets" value={kpiData.openTickets.toString()} unit="" trend="High Priority" trendDirection="up" icon={<i className="fas fa-ticket-alt text-blue-500"></i>} />
                <KpiCard title="Resolved Today" value={kpiData.resolvedToday.toString()} unit="tickets" trend="+2" trendDirection="up" icon={<i className="fas fa-check-circle text-green-500"></i>} />
                <KpiCard title="Avg. Resolution Time" value={kpiData.avgResolutionTime.toString()} unit="hrs" trend="Improving" trendDirection="down" icon={<i className="fas fa-stopwatch text-yellow-500"></i>} />
                <KpiCard title="Overdue Tickets" value={kpiData.overdueTickets.toString()} unit="tickets" trend="Action Needed" trendDirection="down" icon={<i className="fas fa-exclamation-triangle text-red-500"></i>} />
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-white dark:bg-slate-800/50 p-6 rounded-lg shadow-sm border border-slate-200 dark:border-slate-700">
                     <h3 className="font-semibold text-slate-800 dark:text-slate-200 mb-4">Tickets by Priority</h3>
                     <div className="h-80"><TicketsByPriorityChart tickets={tickets} theme={theme} /></div>
                </div>
                <div className="bg-white dark:bg-slate-800/50 p-6 rounded-lg shadow-sm border border-slate-200 dark:border-slate-700">
                     <h3 className="font-semibold text-slate-800 dark:text-slate-200 mb-4">Tickets by Status</h3>
                     <div className="h-80"><TicketsByStatusChart tickets={tickets} theme={theme} /></div>
                </div>
            </div>
        </div>
    );
};

const AllTicketsView: React.FC<{ tickets: SupportTicket[] }> = ({ tickets }) => {
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');
    const [priorityFilter, setPriorityFilter] = useState('all');
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 10;

    const filteredTickets = useMemo(() => {
        return tickets.filter(t => {
            const matchesSearch = searchTerm === '' || t.subject.toLowerCase().includes(searchTerm.toLowerCase()) || t.id.toLowerCase().includes(searchTerm.toLowerCase());
            const matchesStatus = statusFilter === 'all' || t.status === statusFilter;
            const matchesPriority = priorityFilter === 'all' || t.priority === priorityFilter;
            return matchesSearch && matchesStatus && matchesPriority;
        }).sort((a,b) => b.updatedAt.getTime() - a.updatedAt.getTime());
    }, [tickets, searchTerm, statusFilter, priorityFilter]);

    const paginatedTickets = filteredTickets.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);
    const totalPages = Math.ceil(filteredTickets.length / itemsPerPage);

    const PriorityBadge: React.FC<{ priority: SupportTicket['priority'] }> = ({ priority }) => {
        const styles = {
            critical: 'bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-300',
            high: 'bg-orange-100 text-orange-800 dark:bg-orange-900/50 dark:text-orange-300',
            medium: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/50 dark:text-yellow-300',
            low: 'bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-300',
        };
        return <span className={`px-2 py-1 text-xs font-medium rounded-full ${styles[priority]}`}>{priority}</span>;
    };
    
    const StatusBadge: React.FC<{ status: SupportTicket['status'] }> = ({ status }) => {
        const styles = {
            open: 'bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-300',
            in_progress: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/50 dark:text-yellow-300',
            resolved: 'bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300',
            closed: 'bg-slate-100 text-slate-800 dark:bg-slate-700 dark:text-slate-300',
        };
        const text = { open: 'Open', in_progress: 'In Progress', resolved: 'Resolved', closed: 'Closed' };
        return <span className={`px-2 py-1 text-xs font-medium rounded-full ${styles[status]}`}>{text[status]}</span>;
    };

    return (
        <div className="animate-fade-in-slow">
             <div className="bg-white dark:bg-slate-800/50 p-4 rounded-lg shadow-sm border border-slate-200 dark:border-slate-700 mb-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                     <input type="text" placeholder="Search by ID or Subject..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-700/50 border border-slate-200 dark:border-slate-600 rounded-md text-sm focus:ring-2 focus:ring-cyan-500 outline-none"/>
                     <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-700/50 border border-slate-200 dark:border-slate-600 rounded-md text-sm focus:ring-2 focus:ring-cyan-500 outline-none">
                        <option value="all">All Statuses</option>
                        <option value="open">Open</option><option value="in_progress">In Progress</option><option value="resolved">Resolved</option><option value="closed">Closed</option>
                    </select>
                    <select value={priorityFilter} onChange={e => setPriorityFilter(e.target.value)} className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-700/50 border border-slate-200 dark:border-slate-600 rounded-md text-sm focus:ring-2 focus:ring-cyan-500 outline-none">
                        <option value="all">All Priorities</option>
                        <option value="critical">Critical</option><option value="high">High</option><option value="medium">Medium</option><option value="low">Low</option>
                    </select>
                </div>
            </div>
             <div className="bg-white dark:bg-slate-800/50 rounded-lg shadow-sm border border-slate-200 dark:border-slate-700 overflow-x-auto">
                <table className="w-full text-sm text-left text-slate-500 dark:text-slate-400">
                    <thead className="bg-slate-50 dark:bg-slate-700/50 text-xs text-slate-700 dark:text-slate-300 uppercase">
                        <tr>
                            <th className="px-6 py-3">Ticket ID</th><th className="px-6 py-3">Subject</th><th className="px-6 py-3">Requester</th><th className="px-6 py-3">Priority</th><th className="px-6 py-3">Status</th><th className="px-6 py-3">Last Updated</th><th className="px-6 py-3">Action</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                        {paginatedTickets.map(t => (
                            <tr key={t.id}>
                                <td className="px-6 py-4 font-mono text-xs">{t.id}</td>
                                <td className="px-6 py-4 font-semibold text-slate-800 dark:text-slate-200 max-w-xs truncate">{t.subject}</td>
                                <td className="px-6 py-4">{t.requester}</td>
                                <td className="px-6 py-4"><PriorityBadge priority={t.priority}/></td>
                                <td className="px-6 py-4"><StatusBadge status={t.status}/></td>
                                <td className="px-6 py-4 whitespace-nowrap">{t.updatedAt.toLocaleString()}</td>
                                <td className="px-6 py-4"><button className="font-medium text-cyan-600 hover:underline">View</button></td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
            <div className="flex justify-between items-center mt-4">
                <span className="text-sm text-slate-500 dark:text-slate-400">Page {currentPage} of {totalPages}</span>
                <div className="flex items-center gap-2">
                    <button onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1} className="px-3 py-1 border rounded-md disabled:opacity-50">Prev</button>
                    <button onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages} className="px-3 py-1 border rounded-md disabled:opacity-50">Next</button>
                </div>
            </div>
        </div>
    );
};

const KnowledgeBaseView: React.FC<{ articles: KnowledgeBaseArticle[] }> = ({ articles }) => {
    const [searchTerm, setSearchTerm] = useState('');
    const articlesByCategory = useMemo(() => {
        const filtered = articles.filter(a => a.title.toLowerCase().includes(searchTerm.toLowerCase()));
        return filtered.reduce((acc, article) => {
            if (!acc[article.category]) acc[article.category] = [];
            acc[article.category].push(article);
            return acc;
        }, {} as Record<string, KnowledgeBaseArticle[]>);
    }, [articles, searchTerm]);

    return (
        <div className="animate-fade-in-slow max-w-4xl mx-auto">
            <div className="relative mb-8">
                <i className="fas fa-search absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 text-lg"></i>
                <input type="text" placeholder="Search for answers..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="w-full pl-12 pr-4 py-3 bg-white dark:bg-slate-800/50 border-2 border-slate-200 dark:border-slate-700 rounded-lg text-lg focus:ring-4 focus:ring-cyan-500/50 focus:border-cyan-500 outline-none"/>
            </div>
            {Object.entries(articlesByCategory).map(([category, articles]) => (
                <div key={category} className="mb-8">
                    <h3 className="text-xl font-bold text-slate-800 dark:text-slate-200 mb-4 pb-2 border-b-2 border-cyan-500">{category}</h3>
                    <div className="space-y-3">
                        {articles.map(article => (
                            <a href="#" key={article.id} className="block p-4 bg-white dark:bg-slate-800/50 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 transition-all hover:shadow-md">
                                <p className="font-semibold text-cyan-700 dark:text-cyan-400">{article.title}</p>
                                <p className="text-xs text-slate-500 mt-1">{article.views} views - Last updated {article.lastUpdated.toLocaleDateString()}</p>
                            </a>
                        ))}
                    </div>
                </div>
            ))}
        </div>
    );
};

const SubmitTicketForm: React.FC<{ onSubmit: (data: Omit<SupportTicket, 'id' | 'createdAt' | 'updatedAt'>) => void }> = ({ onSubmit }) => {
    const [formData, setFormData] = useState({ subject: '', category: 'General Inquiry', priority: 'medium', description: '' });
    const [isSubmitted, setIsSubmitted] = useState(false);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const ticketData = {
            ...formData,
            requester: 'Admin User', // This would be dynamic in a real app
            assignedTo: 'Unassigned',
            status: 'open',
        } as Omit<SupportTicket, 'id' | 'createdAt' | 'updatedAt'>;
        onSubmit(ticketData);
        setIsSubmitted(true);
        setFormData({ subject: '', category: 'General Inquiry', priority: 'medium', description: '' });
    };

    return (
        <div className="bg-white dark:bg-slate-800/50 p-6 rounded-lg shadow-sm border border-slate-200 dark:border-slate-700 max-w-2xl mx-auto">
            <form onSubmit={handleSubmit} className="space-y-6">
                 <div>
                    <label htmlFor="subject" className="block text-sm font-medium mb-1">Subject</label>
                    <input type="text" id="subject" value={formData.subject} onChange={e => setFormData({...formData, subject: e.target.value})} required className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-700/50 border border-slate-300 dark:border-slate-600 rounded-md text-sm outline-none"/>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <label htmlFor="category" className="block text-sm font-medium mb-1">Category</label>
                        <select id="category" value={formData.category} onChange={e => setFormData({...formData, category: e.target.value as any})} className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-700/50 border border-slate-300 dark:border-slate-600 rounded-md text-sm outline-none">
                            <option>Flowmeter Issue</option><option>Data Discrepancy</option><option>API Problem</option><option>UI Bug</option><option>General Inquiry</option>
                        </select>
                    </div>
                    <div>
                        <label htmlFor="priority" className="block text-sm font-medium mb-1">Priority</label>
                        <select id="priority" value={formData.priority} onChange={e => setFormData({...formData, priority: e.target.value as any})} className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-700/50 border border-slate-300 dark:border-slate-600 rounded-md text-sm outline-none">
                            <option value="low">Low</option><option value="medium">Medium</option><option value="high">High</option><option value="critical">Critical</option>
                        </select>
                    </div>
                </div>
                 <div>
                    <label htmlFor="description" className="block text-sm font-medium mb-1">Description</label>
                    <textarea id="description" value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} required rows={6} className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-700/50 border border-slate-300 dark:border-slate-600 rounded-md text-sm outline-none"></textarea>
                </div>
                 <div>
                    <label className="block text-sm font-medium mb-1">Attachments</label>
                    <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-slate-300 dark:border-slate-600 border-dashed rounded-md">
                        <div className="space-y-1 text-center"><i className="fas fa-cloud-upload-alt text-4xl text-slate-400"></i><p className="text-sm">Drag & drop files here, or click to browse</p><input type="file" className="sr-only" /></div>
                    </div>
                </div>
                {isSubmitted && <div className="p-3 bg-green-50 text-green-700 rounded-md text-sm">Ticket submitted successfully!</div>}
                <div className="flex justify-end"><button type="submit" className="px-6 py-2 text-sm font-medium text-white bg-cyan-600 rounded-md">Submit Ticket</button></div>
            </form>
        </div>
    );
};

const TicketsByPriorityChart: React.FC<{ tickets: SupportTicket[], theme: 'light' | 'dark' }> = ({ tickets, theme }) => {
    const chartRef = useRef<HTMLCanvasElement>(null);
    const chartInstanceRef = useRef<any>(null);

    const data = useMemo(() => {
        const counts = { critical: 0, high: 0, medium: 0, low: 0 };
        tickets.forEach(t => counts[t.priority]++);
        return counts;
    }, [tickets]);

    useEffect(() => {
        if (chartRef.current) {
            if (chartInstanceRef.current) chartInstanceRef.current.destroy();
            const ctx = chartRef.current.getContext('2d');
            if (ctx) {
                const isDark = theme === 'dark';
                chartInstanceRef.current = new Chart(ctx, {
                    type: 'bar',
                    data: {
                        labels: ['Critical', 'High', 'Medium', 'Low'],
                        datasets: [{
                            data: [data.critical, data.high, data.medium, data.low],
                            backgroundColor: ['#ef4444', '#f97316', '#f59e0b', '#3b82f6'],
                            borderRadius: 4,
                        }]
                    },
                    options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } }, scales: { y: { grid: { color: isDark ? '#374151' : '#e5e7eb' } }, x: { grid: { display: false } } } }
                });
            }
        }
    }, [theme, data]);

    return <canvas ref={chartRef}></canvas>;
};

const TicketsByStatusChart: React.FC<{ tickets: SupportTicket[], theme: 'light' | 'dark' }> = ({ tickets, theme }) => {
    const chartRef = useRef<HTMLCanvasElement>(null);
    const chartInstanceRef = useRef<any>(null);

    const data = useMemo(() => {
        const counts = { open: 0, in_progress: 0, resolved: 0, closed: 0 };
        tickets.forEach(t => counts[t.status]++);
        return counts;
    }, [tickets]);

    useEffect(() => {
        if (chartRef.current) {
            if (chartInstanceRef.current) chartInstanceRef.current.destroy();
            const ctx = chartRef.current.getContext('2d');
            if (ctx) {
                const isDark = theme === 'dark';
                chartInstanceRef.current = new Chart(ctx, {
                    type: 'doughnut',
                    data: {
                        labels: ['Open', 'In Progress', 'Resolved', 'Closed'],
                        datasets: [{
                            data: [data.open, data.in_progress, data.resolved, data.closed],
                            backgroundColor: ['#3b82f6', '#f59e0b', '#22c55e', '#6b7280'],
                            borderColor: isDark ? '#1f2937' : '#ffffff',
                        }]
                    },
                    options: { responsive: true, maintainAspectRatio: false, cutout: '70%', plugins: { legend: { position: 'bottom', labels: { color: isDark ? '#cbd5e1' : '#475569' } } } }
                });
            }
        }
    }, [theme, data]);

    return <canvas ref={chartRef}></canvas>;
};

const App: React.FC = () => {
    const [activeSection, setActiveSection] = useState<string>('dashboard');
    const [currentRole, setCurrentRole] = useState<Role>('admin');
    const [theme, setTheme] = useState<'light' | 'dark'>('light');
    const [dateTime, setDateTime] = useState(new Date());
    const [isSidebarOpen, setSidebarOpen] = useState(true);

    // Data states
    const [flowmeters, setFlowmeters] = useState<Flowmeter[]>([]);
    const [alerts, setAlerts] = useState<Alert[]>([]);
    const [contractors, setContractors] = useState<Contractor[]>([]);
    const [apiLogs, setApiLogs] = useState<ApiLog[]>([]);
    const [smsMessages, setSmsMessages] = useState<SmsMessage[]>([]);
    const [manualEntries, setManualEntries] = useState<ManualEntry[]>([]);
    const [scheduledReports, setScheduledReports] = useState<ScheduledReport[]>([]);
    const [reportHistory, setReportHistory] = useState<ReportHistory[]>([]);
    const [gatiShaktiLayers, setGatiShaktiLayers] = useState<GatiShaktiLayer[]>([]);
    const [gatiShaktiProjects, setGatiShaktiProjects] = useState<GatiShaktiProject[]>([]);
    const [wuaData, setWuaData] = useState<WuaData[]>([]);
    const [appNotifications, setAppNotifications] = useState<AppNotification[]>([]);
    const [notificationRules, setNotificationRules] = useState<NotificationRule[]>([]);
    const [notificationHistory, setNotificationHistory] = useState<NotificationHistory[]>([]);
    const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
    const [slaMetrics, setSlaMetrics] = useState<SlaMetric[]>([]);
    const [contractorSlas, setContractorSlas] = useState<ContractorSla[]>([]);
    const [supportTickets, setSupportTickets] = useState<SupportTicket[]>([]);
    const [kbArticles, setKbArticles] = useState<KnowledgeBaseArticle[]>([]);

    useEffect(() => {
        const timer = setInterval(() => setDateTime(new Date()), 1000);
        
        setFlowmeters(STATIC_FLOWMETERS);
        setAlerts(generateAlerts());
        setContractors(STATIC_CONTRACTORS);
        setApiLogs(STATIC_API_LOGS);
        setSmsMessages(STATIC_SMS_MESSAGES);
        setManualEntries(STATIC_MANUAL_ENTRIES);
        setScheduledReports(STATIC_SCHEDULED_REPORTS);
        setReportHistory(STATIC_REPORT_HISTORY);
        setGatiShaktiLayers(STATIC_GATI_SHAKTI_LAYERS);
        setGatiShaktiProjects(STATIC_GATI_SHAKTI_PROJECTS);
        setWuaData(STATIC_WUA_DATA);
        setAppNotifications(STATIC_APP_NOTIFICATIONS);
        setNotificationRules(STATIC_NOTIFICATION_RULES);
        setNotificationHistory(STATIC_NOTIFICATION_HISTORY);
        setAuditLogs(STATIC_AUDIT_LOGS);
        setSlaMetrics(STATIC_SLA_METRICS);
        setContractorSlas(STATIC_CONTRACTOR_SLAS);
        setSupportTickets(STATIC_SUPPORT_TICKETS);
        setKbArticles(STATIC_KB_ARTICLES);

        const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        const initialTheme = prefersDark ? 'dark' : 'light';
        setTheme(initialTheme);
        document.documentElement.setAttribute('data-color-scheme', initialTheme);
        document.documentElement.classList.toggle('dark', prefersDark);
        
        return () => clearInterval(timer);
    }, []);

    const toggleTheme = () => {
        setTheme(prev => {
            const newTheme = prev === 'light' ? 'dark' : 'light';
            document.documentElement.setAttribute('data-color-scheme', newTheme);
            document.documentElement.classList.toggle('dark', newTheme === 'dark');
            return newTheme;
        });
    };

    const handleRoleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const newRole = e.target.value as Role;
        setCurrentRole(newRole);
        const currentSectionData = SECTIONS.find(s => s.id === activeSection);
        if (!currentSectionData?.roles.includes(newRole)) {
            setActiveSection('dashboard');
        }
    };
    
    const visibleSections = useMemo(() => SECTIONS.filter(section => section.roles.includes(currentRole)), [currentRole]);

    const kpiData = useMemo(() => {
        const activeFlowmeters = flowmeters.filter(f => f.status === 'online').length;
        const totalWaterSupplyToday = flowmeters.reduce((sum, f) => sum + f.todayVolume, 0);
        const avgFlowRate = flowmeters.length > 0 ? Math.floor(flowmeters.reduce((sum, f) => sum + f.flowRate, 0) / flowmeters.length) : 0;
        const systemUptime = 99.5 + Math.random() * 0.4;
        return { activeFlowmeters, totalWaterSupplyToday, avgFlowRate, systemUptime, totalFlowmeters: flowmeters.length };
    }, [flowmeters]);

    const renderSection = () => {
        switch (activeSection) {
            case 'dashboard':
                return <DashboardSection kpiData={kpiData} alerts={alerts} flowmeters={flowmeters} theme={theme} onNavigate={setActiveSection} />;
            case 'flowmeters':
                return <FlowmetersSection flowmeters={flowmeters} />;
            case 'apis':
                return <ApisSection contractors={contractors} apiLogs={apiLogs} smsMessages={smsMessages} theme={theme} />;
            case 'manual-entry':
                return <ManualEntrySection flowmeters={flowmeters} manualEntries={manualEntries} />;
            case 'reports':
                return <ReportsSection scheduledReports={scheduledReports} reportHistory={reportHistory} />;
            case 'pmgs':
                return <PmGatiShaktiSection layers={gatiShaktiLayers} projects={gatiShaktiProjects} />;
            case 'billing':
                return <WaterEntitlementSection wuaData={wuaData} />;
            case 'all-notifications':
                return <AllNotificationsSection appNotifications={appNotifications} notificationRules={notificationRules} notificationHistory={notificationHistory} />;
            case 'audit-logs':
                return <AuditLogsSection auditLogs={auditLogs} />;
            case 'sla-monitoring':
                return <SlaMonitoringSection slaMetrics={slaMetrics} contractorSlas={contractorSlas} theme={theme} />;
            case 'support-tickets':
                return <SupportTicketsSection tickets={supportTickets} kbArticles={kbArticles} theme={theme} />;
            default:
                return <div className="p-8 bg-white dark:bg-slate-800 rounded-lg shadow-md">
                    <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-200">{SECTIONS.find(s => s.id === activeSection)?.label}</h2>
                    <p className="mt-4 text-slate-600 dark:text-slate-400">This section is under construction.</p>
                </div>;
        }
    };

    return (
        <div className={`text-slate-800 dark:text-slate-200 min-h-screen transition-colors duration-300`}>
            {/* Header */}
            <header className="fixed top-0 left-0 right-0 h-16 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between px-6 z-40">
                <div className="flex items-center gap-4">
                    <button onClick={() => setSidebarOpen(!isSidebarOpen)} className="text-xl text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"><i className="fas fa-bars"></i></button>
                    <div className="flex items-center gap-2 text-lg font-bold text-cyan-600 dark:text-cyan-400">
                        <i className="fas fa-tint"></i>
                        <span>WRD Tembhu LIS</span>
                    </div>
                </div>
                <div className="hidden md:block text-sm text-slate-500 dark:text-slate-400">
                    {dateTime.toLocaleString('en-IN', { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                </div>
                <div className="flex items-center gap-4">
                    <div className="hidden lg:flex items-center gap-2 text-sm text-green-600 dark:text-green-400">
                        <span className="relative flex h-2 w-2">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
                        </span>
                        System Online
                    </div>
                    <button onClick={toggleTheme} className="text-lg text-slate-500 hover:text-slate-800 dark:hover:text-slate-200">
                        {theme === 'light' ? <i className="fas fa-moon"></i> : <i className="fas fa-sun"></i>}
                    </button>
                    <div className="relative">
                        <button className="text-lg text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"><i className="fas fa-bell"></i></button>
                        <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-xs font-medium text-white">{alerts.length}</span>
                    </div>
                    <div className="flex items-center gap-2">
                         <i className="fas fa-user-circle text-2xl text-cyan-600"></i>
                        <select id="roleSelector" value={currentRole} onChange={handleRoleChange} className="bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-md p-1 text-sm">
                            <option value="admin">Admin</option>
                            <option value="wrd_user">WRD User</option>
                            <option value="non_wrd_user">Non-WRD User (WUA)</option>
                        </select>
                    </div>
                </div>
            </header>

            {/* Sidebar */}
            <aside className={`fixed top-16 left-0 w-60 h-[calc(100vh-4rem)] bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-700 z-30 transition-transform duration-300 ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
                <nav className="p-2">
                    <ul>
                        {visibleSections.map(section => (
                            <li key={section.id}>
                                <a
                                    href={`#${section.id}`}
                                    onClick={(e) => { e.preventDefault(); setActiveSection(section.id); }}
                                    className={`flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium transition-colors ${activeSection === section.id ? 'bg-cyan-50 text-cyan-700 dark:bg-cyan-900/50 dark:text-cyan-300' : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'}`}
                                >
                                    <i className={`fas ${section.icon} w-5 text-center`}></i>
                                    <span>{section.label}</span>
                                </a>
                            </li>
                        ))}
                    </ul>
                </nav>
            </aside>
            
            {/* Main Content */}
            <main className={`pt-16 transition-all duration-300 ${isSidebarOpen ? 'lg:pl-60' : 'pl-0'}`}>
                <div className="p-6">
                    {renderSection()}
                </div>
            </main>
        </div>
    );
};


const DashboardSection: React.FC<{
    kpiData: any;
    alerts: Alert[];
    flowmeters: Flowmeter[];
    theme: 'light' | 'dark';
    onNavigate: (section: string) => void;
}> = ({ kpiData, alerts, flowmeters, theme, onNavigate }) => {
    const [timeRange, setTimeRange] = useState<'24h' | '7d' | '30d' | '12m'>('12m');

    const topFlowmeters = useMemo(() => {
        return [...flowmeters]
            .sort((a, b) => b.flowRate - a.flowRate)
            .slice(0, 10);
    }, [flowmeters]);

    const timeRangeOptions: { id: '24h' | '7d' | '30d' | '12m'; label: string }[] = [
        { id: '24h', label: '24H' },
        { id: '7d', label: '7D' },
        { id: '30d', label: '30D' },
        { id: '12m', label: '12M' },
    ];

    return (
        <div className="animate-fade-in">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-200">Real-Time Water Monitoring Dashboard</h1>
            </div>
            {/* KPI Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
                <KpiCard title="Total Water Supply Today" value={`${(kpiData.totalWaterSupplyToday / 1000).toFixed(1)}K`} unit="m³" trend="+12%" trendDirection="up" icon={<WaterIcon />} />
                <KpiCard title="Average Flow Rate" value={kpiData.avgFlowRate.toLocaleString()} unit="m³/hr" trend="+5%" trendDirection="up" icon={<ChartLineIcon />} />
                <KpiCard title="Active Flowmeters" value={kpiData.activeFlowmeters.toString()} unit={`/ ${kpiData.totalFlowmeters}`} trend={`${((kpiData.activeFlowmeters / kpiData.totalFlowmeters) * 100).toFixed(1)}%`} trendDirection="up" icon={<BroadcastTowerIcon />} />
                <KpiCard title="System Uptime" value={kpiData.systemUptime.toFixed(2)} unit="%" trend="Excellent" trendDirection="up" icon={<ServerIcon />} />
            </div>

            {/* Main Layout */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 flex flex-col gap-6">
                    <div className="bg-white dark:bg-slate-800/50 p-6 rounded-lg shadow-sm border border-slate-200 dark:border-slate-700">
                         <div className="flex justify-between items-center mb-4">
                            <h3 className="font-semibold text-slate-800 dark:text-slate-200">Water Supply Trend</h3>
                             <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-700/50 p-1 rounded-md">
                                {timeRangeOptions.map(option => (
                                    <button
                                        key={option.id}
                                        onClick={() => setTimeRange(option.id)}
                                        className={`px-3 py-1 text-xs font-semibold rounded-md transition-colors ${
                                            timeRange === option.id
                                                ? 'bg-white text-cyan-600 dark:bg-slate-600 dark:text-white shadow-sm'
                                                : 'text-slate-500 dark:text-slate-400 hover:bg-slate-200/70 dark:hover:bg-slate-600/50'
                                        }`}
                                    >
                                        {option.label}
                                    </button>
                                ))}
                            </div>
                        </div>
                        <div className="h-80"><LineChartComponent theme={theme} timeRange={timeRange} /></div>
                    </div>
                     <div className="bg-white dark:bg-slate-800/50 p-6 rounded-lg shadow-sm border border-slate-200 dark:border-slate-700 flex-1 flex flex-col">
                        <h3 className="font-semibold text-slate-800 dark:text-slate-200 mb-4">Flowmeter Locations</h3>
                        <div className="flex-1 rounded-lg overflow-hidden">
                           <MapComponent flowmeters={flowmeters} />
                        </div>
                    </div>
                </div>

                <div className="space-y-6">
                    {/* Status Distribution */}
                    <div className="bg-white dark:bg-slate-800/50 p-4 rounded-lg shadow-sm border border-slate-200 dark:border-slate-700">
                        <h3 className="font-semibold text-slate-800 dark:text-slate-200 text-base mb-3 px-2">Status Distribution</h3>
                        <div className="h-52">
                             <StatusDistributionChart flowmeters={flowmeters} theme={theme} />
                        </div>
                    </div>

                    {/* Top 10 Flowmeters */}
                    <div className="bg-white dark:bg-slate-800/50 p-4 rounded-lg shadow-sm border border-slate-200 dark:border-slate-700">
                        <div className="flex justify-between items-center mb-3 px-2">
                            <h3 className="font-semibold text-slate-800 dark:text-slate-200 text-base">Top 10 Flowmeters (by Rate)</h3>
                            <a 
                                href="#flowmeters" 
                                onClick={(e) => { e.preventDefault(); onNavigate('flowmeters'); }}
                                className="text-sm text-cyan-600 dark:text-cyan-400 font-medium hover:underline"
                            >
                                View All
                            </a>
                        </div>
                        <div className="space-y-1">
                            {topFlowmeters.map((fm, index) => (
                                <div key={fm.id} className="flex items-center justify-between p-2 rounded-md hover:bg-slate-50 dark:hover:bg-slate-700/50 text-sm">
                                    <div className="flex items-center gap-3">
                                        <span className="font-mono text-xs text-slate-400 dark:text-slate-500 w-5 text-center">{index + 1}</span>
                                        <div>
                                            <p className="font-medium text-slate-700 dark:text-slate-300">{fm.id}</p>
                                            <p className="text-xs text-slate-500 dark:text-slate-400">{fm.wua}</p>
                                        </div>
                                    </div>
                                    <div className="font-semibold text-slate-800 dark:text-slate-200">{fm.flowRate.toLocaleString()} <span className="text-xs text-slate-400">m³/hr</span></div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Alerts */}
                    <div className="bg-white dark:bg-slate-800/50 p-4 rounded-lg shadow-sm border border-slate-200 dark:border-slate-700">
                        <h3 className="font-semibold text-slate-800 dark:text-slate-200 text-base mb-3 px-2">Recent Alerts</h3>
                        <div className="space-y-3">
                            {alerts.map((alert, index) => (
                                <div key={index} className={`flex gap-3 p-2 border-l-4 ${
                                    alert.type === 'system' ? 'border-blue-500' :
                                    alert.type === 'offline' ? 'border-red-500' :
                                    alert.type === 'high-flow' ? 'border-yellow-500' : 'border-red-500'
                                }`}>
                                    <div>
                                        <p className="font-medium text-sm text-slate-700 dark:text-slate-300">{alert.title}</p>
                                        <p className="text-xs text-slate-500 dark:text-slate-400">{alert.message}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

const KpiCard: React.FC<{
    title: string;
    value: string;
    unit: string;
    trend: string;
    trendDirection: 'up' | 'down';
    icon: React.ReactNode;
}> = ({ title, value, unit, trend, trendDirection, icon }) => {
    const trendColor = trendDirection === 'up' ? 'text-green-500' : 'text-red-500';
    return (
        <div className="bg-white dark:bg-slate-800/50 p-5 rounded-lg shadow-sm border border-slate-200 dark:border-slate-700">
            <div className="flex justify-between items-start">
                <div className="text-2xl h-10 w-10 flex items-center justify-center rounded-lg bg-slate-100 dark:bg-slate-700">
                    {icon}
                </div>
                <div className={`text-sm font-medium flex items-center gap-1 ${trendColor}`}>
                    {trendDirection === 'up' && trend !== 'Stable' && trend !== 'Integrated' && trend !== 'Active' && trend !== 'High' && trend !== 'Excellent' && trend !== 'Compliant' && trend !== 'Good' ? <i className="fas fa-arrow-up"></i> : trendDirection === 'down' ? <i className="fas fa-arrow-down"></i> : null}
                    {trend}
                </div>
            </div>
            <div className="mt-4">
                <p className="text-sm text-slate-500 dark:text-slate-400">{title}</p>
                <div className="flex items-baseline gap-2">
                    <p className="text-3xl font-bold text-slate-800 dark:text-slate-200">{value}</p>
                    <span className="text-sm font-medium text-slate-500 dark:text-slate-400">{unit}</span>
                </div>
            </div>
        </div>
    );
};

export default App;
