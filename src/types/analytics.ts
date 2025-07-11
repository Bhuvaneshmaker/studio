
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
