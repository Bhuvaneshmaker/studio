
"use client";

import { useState, useEffect, useRef } from 'react';
import type { SlaveData } from '@/types/elevator';
import { useToast } from "@/hooks/use-toast";
import { Router, Wrench, ShieldAlert, CheckCircle2, SlidersHorizontal } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import Link from 'next/link';
import { generateInitialSlaves, updateSlaveState, TOTAL_SLAVES, NUM_DEVICES } from '@/lib/elevator-simulation';

export default function SlaveDashboard() {
  const [slaves, setSlaves] = useState<SlaveData[]>([]);
  const { toast } = useToast();
  const notifiedErrors = useRef<Set<string>>(new Set());

  useEffect(() => {
    setSlaves(generateInitialSlaves());
  }, []);

  useEffect(() => {
    if (slaves.length === 0) return;

    const interval = setInterval(() => {
      const { updatedSlaves, newAlerts } = updateSlaveState(slaves, notifiedErrors.current);
      setSlaves(updatedSlaves);
      
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
  }, [slaves, toast]);

  const maintenanceCount = slaves.filter(e => e.status === 'MAINTENANCE').length;
  const errorCount = slaves.filter(e => e.status === 'ERROR' || e.emergencyStop).length;
  const activeCount = TOTAL_SLAVES - maintenanceCount - errorCount;

  return (
    <>
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="text-xl sm:text-2xl">Control Room Status</CardTitle>
          <CardDescription>A high-level overview of the entire slave device network.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 text-center">
            <Link href="/devices" className="block hover:scale-105 transition-transform duration-200">
              <div className="bg-muted/50 p-4 rounded-lg h-full flex flex-col justify-center">
                <Router className="w-8 h-8 mx-auto text-primary mb-2"/>
                <p className="text-2xl sm:text-3xl font-bold">{NUM_DEVICES}</p>
                <p className="text-sm text-muted-foreground">Devices</p>
              </div>
            </Link>
             <Link href="/slaves" className="block hover:scale-105 transition-transform duration-200">
               <div className="bg-muted/50 p-4 rounded-lg flex flex-col justify-center">
                  <CheckCircle2 className="w-8 h-8 mx-auto text-green-500 mb-2"/>
                  <p className="text-2xl sm:text-3xl font-bold">{activeCount}/{TOTAL_SLAVES}</p>
                  <p className="text-sm text-muted-foreground">Slaves Active</p>
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
