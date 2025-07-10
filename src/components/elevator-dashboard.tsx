"use client";

import { useState, useEffect, useRef } from 'react';
import type { ElevatorData } from '@/types/elevator';
import { useToast } from "@/hooks/use-toast";
import { Building, Wrench, ShieldAlert } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import Link from 'next/link';
import { generateInitialElevators, updateElevatorState, TOTAL_ELEVATORS, NUM_BLOCKS } from '@/lib/elevator-simulation';

export default function ElevatorDashboard() {
  const [elevators, setElevators] = useState<ElevatorData[]>(generateInitialElevators);
  const { toast } = useToast();
  const notifiedErrors = useRef<Set<string>>(new Set());

  const maintenanceCount = elevators.filter(e => e.status === 'MAINTENANCE').length;
  const errorCount = elevators.filter(e => e.status === 'ERROR').length;
  const activeCount = TOTAL_ELEVATORS - maintenanceCount - errorCount;

  useEffect(() => {
    const interval = setInterval(() => {
      setElevators(prevElevators => {
        const { updatedElevators, newAlerts } = updateElevatorState(prevElevators, notifiedErrors.current);
        
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

        return updatedElevators;
      });
    }, 2000);

    return () => clearInterval(interval);
  }, [toast]);

  return (
    <>
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="text-xl">Control Room Status</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-center">
            <Link href="/elevators" className="block hover:scale-105 transition-transform duration-200">
              <div className="bg-muted/50 p-4 rounded-lg h-full">
                <Building className="w-8 h-8 mx-auto text-primary mb-2"/>
                <p className="text-3xl font-bold">{NUM_BLOCKS}</p>
                <p className="text-sm text-muted-foreground">Blocks</p>
              </div>
            </Link>
            <div className="bg-muted/50 p-4 rounded-lg">
                <div className="w-8 h-8 mx-auto text-green-500 mb-2 font-bold text-3xl flex items-center justify-center">{activeCount}</div>
                <p className="text-3xl font-bold">{TOTAL_ELEVATORS}</p>
                <p className="text-sm text-muted-foreground">Total Elevators</p>
            </div>
            <div className="bg-muted/50 p-4 rounded-lg">
              <Wrench className="w-8 h-8 mx-auto text-yellow-500 mb-2"/>
              <p className="text-3xl font-bold">{maintenanceCount}</p>
              <p className="text-sm text-muted-foreground">In Maintenance</p>
            </div>
            <div className="bg-muted/50 p-4 rounded-lg">
              <ShieldAlert className="w-8 h-8 mx-auto text-red-500 mb-2"/>
              <p className="text-3xl font-bold">{errorCount}</p>
              <p className="text-sm text-muted-foreground">System Alerts</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </>
  );
}
