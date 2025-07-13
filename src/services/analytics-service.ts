
'use server';

import type { AnalyticsData, ChartDataPoint, KpiData, HistoricalData, HistoricalPeriod } from '@/types/analytics';
import { getElevatorData } from './elevator-service';
import { NUM_BLOCKS } from '@/lib/elevator-simulation';

const numberToLetter = (num: number) => {
    if (num <= 0) return '';
    let letter = '';
    while (num > 0) {
        const remainder = (num - 1) % 26;
        letter = String.fromCharCode(65 + remainder) + letter;
        num = Math.floor((num - 1) / 26);
    }
    return letter;
};

// This is a server-side only helper for naming.
// In a real app, this logic would come from a database.
const getDeviceNameServer = (deviceId: string) => `Block ${deviceId}`;


function generateDailyAnalytics(): AnalyticsData {
    // KPIs
    const elevators = getElevatorData();
    const operationalElevators = elevators.filter(e => e.mainPower && !e.emergencyStop && e.status !== 'MAINTENANCE').length;
    const uptimePercentage = parseFloat(((operationalElevators / elevators.length) * 100).toFixed(1));
    
    const kpis: KpiData = {
        uptimePercentage: isNaN(uptimePercentage) ? 100 : uptimePercentage,
        averageWaitTime: Math.floor(Math.random() * 25) + 15, // 15-40 seconds
        totalFaults: Math.floor(Math.random() * 10) + 1, // 1-10 faults
        peakUsageHour: `${Math.floor(Math.random() * 3) + 8}:00 AM`, // 8, 9, or 10 AM
    };

    // Chart Data
    const usageByBlock: ChartDataPoint[] = Array.from({ length: NUM_BLOCKS }, (_, i) => ({
        name: numberToLetter(i + 1),
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
    return generateDailyAnalytics();
}

// --- Historical Data Generation ---

function generateHistoricalData(period: HistoricalPeriod): HistoricalData {
    const kpis: KpiData = {
        uptimePercentage: parseFloat((Math.random() * (99.8 - 95.0) + 95.0).toFixed(1)), // 95.0% - 99.8%
        averageWaitTime: Math.floor(Math.random() * 10) + 20, // 20-30s
        totalFaults: 0, // Calculated below
        peakUsageHour: ['9:00 AM', '5:00 PM', '12:00 PM'][Math.floor(Math.random() * 3)],
    };

    const usageByBlock: ChartDataPoint[] = Array.from({ length: NUM_BLOCKS }, (_, i) => ({
        name: numberToLetter(i + 1),
        trips: 0 // Calculated below
    }));

    let faultsByPeriod: ChartDataPoint[] = [];
    let multiplier = 1;

    switch (period) {
        case 'weekly':
            multiplier = 7;
            faultsByPeriod = Array.from({ length: 7 }, (_, i) => {
                 const date = new Date();
                 date.setDate(date.getDate() - (6 - i));
                 return { name: date.toLocaleDateString('en-US', { weekday: 'short'}), faults: Math.floor(Math.random() * 5) }
            });
            break;
        case 'monthly':
            multiplier = 30;
            faultsByPeriod = Array.from({ length: 4 }, (_, i) => ({
                name: `Week ${i + 1}`,
                faults: Math.floor(Math.random() * 15) + 5
            }));
            break;
        case 'yearly':
            multiplier = 365;
            faultsByPeriod = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'].map(month => ({
                name: month,
                faults: Math.floor(Math.random() * 50) + 10
            }));
            break;
    }

    // Aggregate total faults from the generated period data
    kpis.totalFaults = faultsByPeriod.reduce((sum, item) => sum + (item.faults as number), 0);
    
    // Aggregate total trips from the generated period data
    usageByBlock.forEach(block => {
        block.trips = (Math.floor(Math.random() * 300) + 100) * multiplier;
    });

    return {
        kpis,
        usageByBlock,
        faultsByPeriod,
    };
}

export async function getHistoricalData(period: HistoricalPeriod): Promise<HistoricalData> {
    await new Promise(resolve => setTimeout(resolve, 300));
    return generateHistoricalData(period);
}
