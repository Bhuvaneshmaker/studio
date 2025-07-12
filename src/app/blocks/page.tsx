
"use client";

import Link from 'next/link';
import { Building, PlusCircle, Server } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { DeviceCard } from '@/components/device-card';
import { AddDeviceFormWrapper } from '@/components/add-device-form-wrapper';
import { BackButton } from '@/components/back-button';
import type { ElevatorData } from '@/types/elevator';
import { useEffect, useState } from 'react';
import { Skeleton } from '@/components/ui/skeleton';

const DevicesPageSkeleton = () => (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {Array.from({ length: 8 }).map((_, i) => (
             <div key={i} className="space-y-3">
              <Skeleton className="h-56 w-full rounded-lg" />
            </div>
        ))}
    </div>
);

export default function DevicesPage() {
  const [elevators, setElevators] = useState<ElevatorData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
        setLoading(true);
        const res = await fetch('/api/elevators');
        const data = await res.json();
        setElevators(data);
        setLoading(false);
    }
    fetchData();
  }, []);
  
  const handleDeviceAdded = (newElevators: ElevatorData[]) => {
    setElevators(newElevators);
  };

  const elevatorsByDevice = elevators.reduce((acc, elevator) => {
    const deviceId = elevator.deviceId;
    if (!acc[deviceId]) {
      acc[deviceId] = [];
    }
    acc[deviceId].push(elevator);
    return acc;
  }, {} as Record<string, ElevatorData[]>);

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
              <Server className="w-6 h-6" /> Devices
            </h2>
          </div>
          <div className="flex items-center gap-2">
            <AddDeviceFormWrapper onDeviceAdded={handleDeviceAdded}>
               <Button size="sm">
                  <PlusCircle className="mr-2 h-4 w-4" />
                  Add New Device
                </Button>
            </AddDeviceFormWrapper>
            <BackButton />
          </div>
        </div>
      </header>
      <main className="container mx-auto p-4 sm:p-6 space-y-8">
        {loading ? (
          <DevicesPageSkeleton />
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {Object.entries(elevatorsByDevice).sort(([a], [b]) => a.localeCompare(b, undefined, {numeric: true})).map(([deviceId, deviceElevators]) => (
              <DeviceCard key={deviceId} deviceId={deviceId} elevators={deviceElevators} />
            ))}
          </div>
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
