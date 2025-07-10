
"use client";

import { useState, useEffect, useRef } from 'react';
import type { ElevatorData } from '@/types/elevator';
import { useToast } from "@/hooks/use-toast";
import { Landmark, Wrench, ShieldAlert, CheckCircle2, SlidersHorizontal } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import Link from 'next/link';
import { generateInitialElevators, updateElevatorState, TOTAL_ELEVATORS, NUM_BLOCKS } from '@/lib/elevator-simulation';

export default function ElevatorDashboard() {
  const [elevators, setElevators] = useState<ElevatorData[]>([]);
  const { toast } = useToast();
  const notifiedErrors = useRef<Set<string>>(new Set());

  useEffect(() => {
    setElevators(generateInitialElevators());
  }, []);

  useEffect(() => {
    if (elevators.length === 0) return;

    const interval = setInterval(() => {
      const { updatedElevators, newAlerts } = updateElevatorState(elevators, notifiedErrors.current);
      setElevators(updatedElevators);
      
      newAlerts.forEach(alert => {
        if (!notifiedErrors.current.has(alert.id)) {
          toast({
            variant: "destructive",
            title: alert.title,
            description: alert.description,
          });
          notifiedErrors.current.add(alert.id);
        }
      });
    }, 2000);

    return () => clearInterval(interval);
  }, [elevators, toast]);

  const maintenanceCount = elevators.filter(e => e.status === 'MAINTENANCE').length;
  const errorCount = elevators.filter(e => e.status === 'ERROR' || e.emergencyStop).length;
  const activeCount = TOTAL_ELEVATORS - maintenanceCount - errorCount;

  return (
    <>
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="text-xl sm:text-2xl">Control Room Status</CardTitle>
          <CardDescription>A high-level overview of the entire elevator network.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 text-center">
            <Link href="/blocks" className="block hover:scale-105 transition-transform duration-200">
              <div className="bg-muted/50 p-4 rounded-lg h-full flex flex-col justify-center">
                <Landmark className="w-8 h-8 mx-auto text-primary mb-2"/>
                <p className="text-2xl sm:text-3xl font-bold">{NUM_BLOCKS}</p>
                <p className="text-sm text-muted-foreground">Blocks</p>
              </div>
            </Link>
             <Link href="/elevators" className="block hover:scale-105 transition-transform duration-200">
               <div className="bg-muted/50 p-4 rounded-lg flex flex-col justify-center">
                  <CheckCircle2 className="w-8 h-8 mx-auto text-green-500 mb-2"/>
                  <p className="text-2xl sm:text-3xl font-bold">{activeCount}/{TOTAL_ELEVATORS}</p>
                  <p className="text-sm text-muted-foreground">Elevators Active</p>
              </div>
            </Link>
            <Link href="/maintenance" className="block hover:scale-105 transition-transform duration-200">
                <div className="bg-muted/50 p-4 rounded-lg flex flex-col justify-center h-full">
                <Wrench className="w-8 h-8 mx-auto text-yellow-500 mb-2"/>
                <p className="text-2xl sm:text-3xl font-bold">{maintenanceCount}</p>
                <p className="text-sm text-muted-foreground">In Maintenance</p>
                </div>
            </Link>
            <div className="bg-muted/50 p-4 rounded-lg flex flex-col justify-center">
              <ShieldAlert className="w-8 h-8 mx-auto text-red-500 mb-2"/>
              <p className="text-2xl sm:text-3xl font-bold">{errorCount}</p>
              <p className="text-sm text-muted-foreground">System Alerts</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </>
  );
}
