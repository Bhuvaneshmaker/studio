

export interface KpiData {
    uptimePercentage: number;
    averageWaitTime: number;
    totalFaults: number;
    peakUsageHour: string;
}

export interface ChartDataPoint {
    name: string;
    [key: string]: number | string;
}

export interface AnalyticsData {
    kpis: KpiData;
    usageByBlock: ChartDataPoint[];
    faultsByDay: ChartDataPoint[];
}

export type HistoricalPeriod = 'weekly' | 'monthly' | 'yearly';

export interface HistoricalData {
    kpis: KpiData;
    usageByBlock: ChartDataPoint[];
    faultsByPeriod: ChartDataPoint[];
}
