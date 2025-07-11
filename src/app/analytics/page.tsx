
"use client";

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Building, AreaChart, BarChart, AlertTriangle, Clock, TrendingUp, Download } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { BackButton } from '@/components/back-button';
import type { AnalyticsData } from '@/types/analytics';
import { Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, BarChart as RechartsBarChart } from 'recharts';
import { Skeleton } from '@/components/ui/skeleton';

const StatCard = ({ title, value, icon, description }: { title: string, value: string, icon: React.ReactNode, description: string }) => (
    <Card className="shadow-md hover:shadow-lg transition-shadow duration-300">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{title}</CardTitle>
            {icon}
        </CardHeader>
        <CardContent>
            <div className="text-2xl font-bold">{value}</div>
            <p className="text-xs text-muted-foreground">{description}</p>
        </CardContent>
    </Card>
);

const AnalyticsPageSkeleton = () => (
    <div className="space-y-8">
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Skeleton className="h-32" />
            <Skeleton className="h-32" />
            <Skeleton className="h-32" />
            <Skeleton className="h-32" />
        </div>
        <div className="grid gap-8 md:grid-cols-2">
            <Card className="shadow-lg">
                <CardHeader>
                    <Skeleton className="h-6 w-1/2" />
                    <Skeleton className="h-4 w-3/4" />
                </CardHeader>
                <CardContent>
                    <Skeleton className="h-64 w-full" />
                </CardContent>
            </Card>
            <Card className="shadow-lg">
                <CardHeader>
                    <Skeleton className="h-6 w-1/2" />
                    <Skeleton className="h-4 w-3/4" />
                </CardHeader>
                <CardContent>
                    <Skeleton className="h-64 w-full" />
                </CardContent>
            </Card>
        </div>
    </div>
);


export default function AnalyticsPage() {
    const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function fetchData() {
            setLoading(true);
            const response = await fetch('/api/analytics');
            const data = await response.json();
            setAnalytics(data);
            setLoading(false);
        }
        fetchData();
    }, []);

    const handleDownloadLog = () => {
        if (!analytics) return;

        const { kpis, usageByBlock, faultsByDay } = analytics;
        const today = new Date();
        const timestamp = today.toISOString();
        const dateString = today.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });

        let logContent = `ElevateView - Daily Activity Log\n`;
        logContent += `==================================\n\n`;
        logContent += `Date Generated: ${dateString}\n`;
        logContent += `Timestamp: ${timestamp}\n\n`;

        logContent += `--- Key Performance Indicators (KPIs) ---\n`;
        logContent += `Overall Uptime: ${kpis.uptimePercentage}%\n`;
        logContent += `Average Wait Time: ${kpis.averageWaitTime}s\n`;
        logContent += `Total Faults (Last 30 days): ${kpis.totalFaults}\n`;
        logContent += `Peak Usage Hour: ${kpis.peakUsageHour}\n\n`;

        logContent += `--- Usage by Block (Last 24 hours) ---\n`;
        usageByBlock.forEach(block => {
            logContent += `${block.name}: ${block.trips} trips\n`;
        });
        logContent += `\n`;

        logContent += `--- Monthly Fault Trend (Last 30 days) ---\n`;
        faultsByDay.forEach(day => {
            logContent += `${day.name}: ${day.faults} faults\n`;
        });
        logContent += `\n`;

        logContent += `--- End of Report ---\n`;
        
        const blob = new Blob([logContent], { type: 'text/plain;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `ElevateView_Log_${today.toISOString().split('T')[0]}.txt`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    };

    return (
        <div className="min-h-screen">
            <header className="p-4 sm:p-6 border-b bg-card/50 backdrop-blur-sm sticky top-0 z-10">
                <div className="container mx-auto flex items-center justify-between">
                <div className="flex items-center gap-2 sm:gap-3 truncate">
                    <Link href="/" className="flex items-center gap-2 sm:gap-3">
                    <div className="bg-primary text-primary-foreground p-2 rounded-lg">
                        <Building className="w-5 h-5 sm:w-6 sm:h-6" />
                    </div>
                    <h1 className="text-xl sm:text-3xl font-bold text-primary font-headline hidden sm:block">
                        ElevateView
                    </h1>
                    </Link>
                    <span className="text-xl sm:text-2xl text-muted-foreground">/</span>
                    <h2 className="text-lg sm:text-2xl font-semibold text-primary truncate flex items-center gap-2">
                        <AreaChart />
                        Analytics
                    </h2>
                </div>
                <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm" onClick={handleDownloadLog} disabled={loading || !analytics}>
                        <Download className="w-4 h-4 mr-2" />
                        Download Log
                    </Button>
                    <BackButton />
                </div>
                </div>
            </header>
            <main className="container mx-auto p-4 sm:p-6 space-y-8">
                {loading || !analytics ? (
                    <AnalyticsPageSkeleton />
                ) : (
                    <>
                        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                            <StatCard 
                                title="Overall Uptime" 
                                value={`${analytics.kpis.uptimePercentage}%`}
                                icon={<TrendingUp className="h-4 w-4 text-muted-foreground" />}
                                description="Percentage of elevators operational"
                            />
                            <StatCard 
                                title="Average Wait Time" 
                                value={`${analytics.kpis.averageWaitTime}s`}
                                icon={<Clock className="h-4 w-4 text-muted-foreground" />}
                                description="Estimated passenger wait time"
                            />
                            <StatCard 
                                title="Total Faults" 
                                value={analytics.kpis.totalFaults.toString()}
                                icon={<AlertTriangle className="h-4 w-4 text-muted-foreground" />}
                                description="In the last 30 days"
                            />
                            <StatCard 
                                title="Peak Usage" 
                                value={analytics.kpis.peakUsageHour}
                                icon={<BarChart className="h-4 w-4 text-muted-foreground" />}
                                description="Busiest hour of the day"
                            />
                        </div>

                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                            <Card className="shadow-lg">
                                <CardHeader>
                                    <CardTitle>Usage by Block</CardTitle>
                                    <CardDescription>Total elevator trips per block in the last 24 hours.</CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <ResponsiveContainer width="100%" height={300}>
                                        <RechartsBarChart data={analytics.usageByBlock}>
                                            <CartesianGrid strokeDasharray="3 3" />
                                            <XAxis dataKey="name" fontSize={12} tickLine={false} axisLine={false} />
                                            <YAxis fontSize={12} tickLine={false} axisLine={false} />
                                            <Tooltip
                                                contentStyle={{
                                                    backgroundColor: 'hsl(var(--background))',
                                                    border: '1px solid hsl(var(--border))',
                                                    borderRadius: 'var(--radius)',
                                                }}
                                            />
                                            <Legend wrapperStyle={{fontSize: "14px"}}/>
                                            <Bar dataKey="trips" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                                        </RechartsBarChart>
                                    </ResponsiveContainer>
                                </CardContent>
                            </Card>

                             <Card className="shadow-lg">
                                <CardHeader>
                                    <CardTitle>Monthly Fault Trend</CardTitle>
                                    <CardDescription>Number of faults recorded per day over the last 30 days.</CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <ResponsiveContainer width="100%" height={300}>
                                        <RechartsBarChart data={analytics.faultsByDay}>
                                            <CartesianGrid strokeDasharray="3 3" />
                                            <XAxis dataKey="name" fontSize={12} tickLine={false} axisLine={false} />
                                            <YAxis fontSize={12} tickLine={false} axisLine={false} />
                                            <Tooltip 
                                                contentStyle={{
                                                    backgroundColor: 'hsl(var(--background))',
                                                    border: '1px solid hsl(var(--border))',
                                                    borderRadius: 'var(--radius)',
                                                }}
                                            />
                                            <Legend wrapperStyle={{fontSize: "14px"}} />
                                            <Bar dataKey="faults" fill="hsl(var(--destructive))" radius={[4, 4, 0, 0]} />
                                        </RechartsBarChart>
                                    </ResponsiveContainer>
                                </CardContent>
                            </Card>
                        </div>
                    </>
                )}
            </main>
             <footer className="container mx-auto p-4 sm:p-6 border-t mt-8">
                <p className="text-center text-sm text-muted-foreground">
                    ElevateView &copy; {new Date().getFullYear()}. For support, contact <a href="mailto:support@bhuvitech.com" className="underline hover:text-primary">support@bhuvitech.com</a>.
                </p>
            </footer>
        </div>
    );
}
