
import React from 'react';

export const WaterIcon = () => <i className="fas fa-tint text-blue-800"></i>;
export const ChartLineIcon = () => <i className="fas fa-chart-line text-green-500"></i>;
export const BroadcastTowerIcon = () => <i className="fas fa-broadcast-tower text-yellow-500"></i>;
export const ServerIcon = () => <i className="fas fa-server text-purple-500"></i>;

export const StatusIcon: React.FC<{ status: 'online' | 'offline' | 'warning' }> = ({ status }) => {
    const iconClass = {
        online: 'fa-check-circle text-green-500',
        offline: 'fa-times-circle text-red-500',
        warning: 'fa-exclamation-triangle text-yellow-500',
    }[status];
    return <i className={`fas ${iconClass}`}></i>;
};
