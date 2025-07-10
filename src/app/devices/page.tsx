
"use client";

import { useState, useEffect, useRef } from 'react';
import type { SlaveData } from '@/types/elevator';
import { generateInitialSlaves, updateSlaveState, NUM_DEVICES } from '@/lib/elevator-simulation';
import { useToast } from "@/hooks/use-toast";
import Link from 'next/link';
import { Building, Router } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { DeviceCard } from '@/components/device-card';
import { SlidersHorizontal } from 'lucide-react';

export default function DevicesPage() {
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
  
  const slavesByDevice = slaves.reduce((acc, slave) => {
    const ip = slave.deviceIp;
    if (!acc[ip]) {
      acc[ip] = [];
    }
    acc[ip].push(slave);
    return acc;
  }, {} as Record<string, SlaveData[]>);


  return (
    <div className="min-h-screen">
      <header className="p-4 sm:p-6 border-b bg-card/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="container mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2 sm:gap-3 truncate">
            <Link href="/" className="flex items-center gap-2 sm:gap-3">
              <div className="bg-primary text-primary-foreground p-2 rounded-lg">
                <Building className="w-6 h-6" />
              </div>
              <h1 className="text-xl sm:text-3xl font-bold text-primary font-headline hidden sm:block">
                ElevateView
              </h1>
            </Link>
            <span className="text-xl sm:text-2xl text-muted-foreground">/</span>
            <h2 className="text-xl sm:text-2xl font-semibold text-primary truncate">
              Devices
            </h2>
          </div>
          <Button asChild variant="outline" size="sm" className="shrink-0">
            <Link href="/slaves"><SlidersHorizontal className="w-4 h-4 mr-2"/>View Slaves</Link>
          </Button>
        </div>
      </header>
      <main className="container mx-auto p-4 sm:p-6 space-y-8">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {Object.entries(slavesByDevice).map(([ip, slaves]) => (
            <DeviceCard key={ip} deviceIp={ip} slaves={slaves} />
          ))}
        </div>
      </main>
      <footer className="container mx-auto p-4 sm:p-6 border-t mt-8">
        <p className="text-center text-sm text-muted-foreground">
          ElevateView &copy; {new Date().getFullYear()}. Real-time data is simulated.
        </p>
      </footer>
    </div>
  );
}
