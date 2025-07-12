
'use server';

import type { AnalyticsData, ChartDataPoint, KpiData } from '@/types/analytics';
import { getElevatorData } from './elevator-service';
import { NUM_BLOCKS } from '@/lib/elevator-simulation';
import { useNaming } from '@/hooks/use-naming';

// This is a server-side only hook for naming, we can't use the real hook.
// In a real app, this logic would come from a database.
const getDeviceNameServer = (deviceId: string) => `Device ${deviceId}`;


function generateAnalytics(): AnalyticsData {
    // KPIs
    const elevators = getElevatorData();
    const operationalElevators = elevators.filter(e => e.mainPower && !e.emergencyStop && e.status !== 'MAINTENANCE').length;
    const uptimePercentage = parseFloat(((operationalElevators / elevators.length) * 100).toFixed(1));
    
    const kpis: KpiData = {
        uptimePercentage: uptimePercentage || 100,
        averageWaitTime: Math.floor(Math.random() * 25) + 15, // 15-40 seconds
        totalFaults: Math.floor(Math.random() * 10) + 1, // 1-10 faults
        peakUsageHour: `${Math.floor(Math.random() * 3) + 8}:00 AM`, // 8, 9, or 10 AM
    };

    // Chart Data
    const usageByBlock: ChartDataPoint[] = Array.from({ length: NUM_BLOCKS }, (_, i) => ({
        name: getDeviceNameServer((i + 1).toString()),
        trips: Math.floor(Math.random() * 400) + 100, // 100-500 trips
    }));

    const faultsByDay: ChartDataPoint[] = [];
    const today = new Date();
    for(let i = 29; i >= 0; i--) {
        const date = new Date(today);
        date.setDate(today.getDate() - i);
        faultsByDay.push({
            name: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
            faults: Math.floor(Math.random() * 3), // 0-2 faults per day
        })
    }
    
    // Ensure at least a few days have faults for a more interesting chart
    for(let i=0; i < 4; i++) {
        const randomIndex = Math.floor(Math.random() * 30);
        if(faultsByDay[randomIndex]) {
            (faultsByDay[randomIndex].faults as number) += Math.floor(Math.random() * 2) + 1;
        }
    }


    return {
        kpis,
        usageByBlock,
        faultsByDay,
    };
}


export async function getAnalyticsData(): Promise<AnalyticsData> {
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 500));
    return generateAnalytics();
}
