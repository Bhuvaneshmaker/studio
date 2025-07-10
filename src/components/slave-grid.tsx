
"use client";

import { useState, useEffect, useRef } from 'react';
import type { SlaveData } from '@/types/elevator';
import { SlaveCard } from '@/components/slave-card';
import { useToast } from "@/hooks/use-toast";
import { useNaming } from "@/hooks/use-naming";
import { Separator } from './ui/separator';
import { generateInitialSlaves, updateSlaveState } from '@/lib/elevator-simulation';
import { SearchX } from 'lucide-react';

export function SlaveGrid({ searchQuery, deviceFilter }: { searchQuery: string, deviceFilter: string | null }) {
  const [slaves, setSlaves] = useState<SlaveData[]>([]);
  const { toast } = useToast();
  const notifiedErrors = useRef<Set<string>>(new Set());
  const { getDeviceName, getSlaveName } = useNaming();

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

  const filteredSlaves = slaves.filter(slave => {
    if (deviceFilter && slave.deviceIp !== deviceFilter) {
        return false;
    }

    const query = searchQuery.toLowerCase().trim();
    if (!query) return true;

    const deviceName = getDeviceName(slave.deviceIp).toLowerCase();
    const slaveName = getSlaveName(slave.id).toLowerCase();
    
    const idMatch = slave.id.toLowerCase().includes(query);
    const slaveIdMatch = slave.slaveId.toString().includes(query);
    const ipMatch = slave.deviceIp.toLowerCase().includes(query);
    const floorMatch = slave.currentFloor.toString().includes(query);
    const deviceNameMatch = deviceName.includes(query);
    const slaveNameMatch = slaveName.includes(query);

    if (deviceFilter) {
      return slaveNameMatch || idMatch || floorMatch || slaveIdMatch;
    }

    return deviceNameMatch || slaveNameMatch || idMatch || floorMatch || ipMatch || slaveIdMatch;
  });

  const slavesByDevice = filteredSlaves.reduce((acc, slave) => {
    const ip = slave.deviceIp;
    if (!acc[ip]) {
      acc[ip] = [];
    }
    acc[ip].push(slave);
    return acc;
  }, {} as Record<string, SlaveData[]>);


  if (slaves.length > 0 && filteredSlaves.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center text-center gap-4 py-16">
        <SearchX className="w-16 h-16 text-muted-foreground" />
        <h3 className="text-2xl font-bold">No Slaves Found</h3>
        <p className="text-muted-foreground">
          {searchQuery ? `Your search for "${searchQuery}" did not match any slaves.` : "No slaves match the current filter."}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {Object.entries(slavesByDevice).sort(([ipA], [ipB]) => ipA.localeCompare(ipB, undefined, {numeric: true})).map(([ip, deviceSlaves], index) => (
        <section key={ip} id={`device-${ip}`}>
            <h3 className="text-2xl font-bold text-primary mb-4">{getDeviceName(ip)}</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
                {deviceSlaves.sort((a,b) => a.slaveId - b.slaveId).map(slave => (
                    <SlaveCard key={slave.id} slave={slave} />
                ))}
            </div>
            {index < Object.keys(slavesByDevice).length - 1 && <Separator className="my-8" />}
        </section>
      ))}
    </div>
  );
}
