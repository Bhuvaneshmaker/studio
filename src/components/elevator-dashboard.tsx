
"use client";

import type { ElevatorData } from '@/types/elevator';
import { Landmark, Wrench, ShieldAlert, CheckCircle2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import Link from 'next/link';
import { useMemo } from 'react';
import { Skeleton } from './ui/skeleton';

const DashboardSkeleton = () => (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 text-center">
        {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="p-4 rounded-lg bg-muted/50">
                <Skeleton className="w-8 h-8 mx-auto mb-2 rounded-full" />
                <Skeleton className="h-8 w-20 mx-auto mb-2" />
                <Skeleton className="h-4 w-24 mx-auto" />
            </div>
        ))}
    </div>
);

export default function ElevatorDashboard({ elevators, loading }: { elevators: ElevatorData[], loading: boolean }) {
  const {
    activeCount,
    maintenanceCount,
    errorCount,
    totalElevators,
    numDevices
  } = useMemo(() => {
    const maintenanceCount = elevators.filter(e => e.status === 'MAINTENANCE').length;
    const errorCount = elevators.filter(e => e.status === 'ERROR' || e.emergencyStop).length;
    const totalElevators = elevators.length;
    const activeCount = totalElevators - maintenanceCount - errorCount;
    const numDevices = new Set(elevators.map(e => e.deviceId)).size;
    return { activeCount, maintenanceCount, errorCount, totalElevators, numDevices };
  }, [elevators]);

  const blockTitle = 'Blocks';
  const elevatorTitle = 'Elevators Active';

  return (
    <Card className="shadow-lg">
      <CardHeader>
        <CardTitle className="text-xl sm:text-2xl">Control Room Status</CardTitle>
        <CardDescription>A high-level overview of the entire elevator network. Updates every 5 seconds.</CardDescription>
      </CardHeader>
      <CardContent>
        {loading ? (
            <DashboardSkeleton />
        ) : (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 text-center">
            <Link href="/blocks" className="block p-4 rounded-lg bg-muted/50 hover:bg-muted transition-colors duration-200">
              <div className="flex flex-col justify-center h-full">
                <Landmark className="w-7 h-7 sm:w-8 sm:h-8 mx-auto text-primary mb-2"/>
                <p className="text-2xl sm:text-3xl font-bold">{numDevices}</p>
                <p className="text-sm text-muted-foreground">{blockTitle}</p>
              </div>
            </Link>
             <Link href="/elevators" className="block p-4 rounded-lg bg-muted/50 hover:bg-muted transition-colors duration-200">
               <div className="flex flex-col justify-center h-full">
                  <CheckCircle2 className="w-7 h-7 sm:w-8 sm:h-8 mx-auto text-green-500 mb-2"/>
                  <p className="text-2xl sm:text-3xl font-bold">{activeCount}/{totalElevators}</p>
                  <p className="text-sm text-muted-foreground">{elevatorTitle}</p>
              </div>
            </Link>
            <Link href="/maintenance" className="block p-4 rounded-lg bg-muted/50 hover:bg-muted transition-colors duration-200">
                <div className="flex flex-col justify-center h-full">
                <Wrench className="w-7 h-7 sm:w-8 sm:h-8 mx-auto text-yellow-500 mb-2"/>
                <p className="text-2xl sm:text-3xl font-bold">{maintenanceCount}</p>
                <p className="text-sm text-muted-foreground">In Maintenance</p>
                </div>
            </Link>
            <Link href="/elevators" className="block p-4 rounded-lg bg-muted/50 hover:bg-muted transition-colors duration-200">
              <div className="flex flex-col justify-center h-full">
                <ShieldAlert className="w-7 h-7 sm:w-8 sm:h-8 mx-auto text-red-500 mb-2"/>
                <p className="text-2xl sm:text-3xl font-bold">{errorCount}</p>
                <p className="text-sm text-muted-foreground">System Alerts</p>
              </div>
            </Link>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
