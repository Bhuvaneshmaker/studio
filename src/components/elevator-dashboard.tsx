
"use client";

import type { ElevatorData } from '@/types/elevator';
import { Landmark, Wrench, ShieldAlert, CheckCircle2, Calendar as CalendarIcon, Clock } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import Link from 'next/link';
import { useMemo, useState, useEffect } from 'react';
import { Skeleton } from './ui/skeleton';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';


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
  const [currentTime, setCurrentTime] = useState(new Date());
  const [date, setDate] = useState<Date | undefined>(new Date());

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);


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
      <CardHeader className="flex flex-row items-start justify-between">
        <div>
            <CardTitle className="text-xl sm:text-2xl">Control Room Status</CardTitle>
            <CardDescription>A high-level overview of the entire elevator network. Updates every 5 seconds.</CardDescription>
        </div>
        <div className="flex flex-col sm:flex-row gap-2 items-center">
            <div className="text-sm font-medium p-2 rounded-lg bg-muted/50 flex items-center gap-2">
                <Clock className="w-4 h-4 text-primary" />
                <span>{format(currentTime, 'HH:mm:ss')}</span>
            </div>
            <Popover>
                <PopoverTrigger asChild>
                <Button
                    variant={"outline"}
                    className={cn(
                        "w-[200px] justify-start text-left font-normal",
                        !date && "text-muted-foreground"
                    )}
                    >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {date ? format(date, "PPP") : <span>Pick a date</span>}
                </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                <Calendar
                    mode="single"
                    selected={date}
                    onSelect={setDate}
                    initialFocus
                />
                </PopoverContent>
            </Popover>
        </div>
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
