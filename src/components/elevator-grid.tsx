
"use client";

import { useState, useEffect } from 'react';
import type { ElevatorData } from '@/types/elevator';
import { ElevatorCard } from '@/components/elevator-card';
import { useNaming } from "@/hooks/use-naming";
import { Separator } from './ui/separator';
import { SearchX } from 'lucide-react';
import { Skeleton } from './ui/skeleton';

const ElevatorGridSkeleton = () => (
  <div className="space-y-8">
    {[1, 2].map(i => (
      <section key={i}>
        <Skeleton className="h-8 w-48 mb-4" />
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
          {Array.from({ length: 5 }).map((_, j) => (
            <div key={j} className="space-y-3">
              <Skeleton className="h-40 w-full rounded-lg" />
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-4 w-1/2" />
            </div>
          ))}
        </div>
      </section>
    ))}
  </div>
);


export function ElevatorGrid({ searchQuery, deviceFilter }: { searchQuery: string, deviceFilter: string | null }) {
  const [elevators, setElevators] = useState<ElevatorData[]>([]);
  const [loading, setLoading] = useState(true);
  const { getDeviceName, getElevatorName } = useNaming();

  useEffect(() => {
    // Initial fetch with loading state
    const initialFetch = async () => {
        setLoading(true);
        const res = await fetch('/api/elevators');
        const data = await res.json();
        setElevators(data);
        setLoading(false);
    }
    initialFetch();

    // Subsequent fetches without setting loading state
    const fetchUpdates = async () => {
        const res = await fetch('/api/elevators', { cache: 'no-store' });
        if (res.ok) {
            const data = await res.json();
            setElevators(data);
        }
    }

    const interval = setInterval(fetchUpdates, 5000); // Poll for updates every 5 seconds
    return () => clearInterval(interval);
  }, []);

  const filteredElevators = elevators.filter(elevator => {
    if (deviceFilter && elevator.deviceId !== deviceFilter) {
        return false;
    }

    const query = searchQuery.toLowerCase().trim();
    if (!query) return true;

    const deviceName = getDeviceName(elevator.deviceId).toLowerCase();
    const elevatorName = getElevatorName(elevator.id).toLowerCase();
    
    return [
      elevator.id.toLowerCase(),
      elevator.elevatorNum.toString(),
      elevator.deviceId.toLowerCase(),
      elevator.currentFloor.toString(),
      deviceName,
      elevatorName,
      elevator.status.toLowerCase(),
    ].some(field => field.includes(query));
  });

  const elevatorsByDevice = filteredElevators.reduce((acc, elevator) => {
    const deviceId = elevator.deviceId;
    if (!acc[deviceId]) {
      acc[deviceId] = [];
    }
    acc[deviceId].push(elevator);
    return acc;
  }, {} as Record<string, ElevatorData[]>);

  if (loading) {
    return <ElevatorGridSkeleton />;
  }

  if (elevators.length > 0 && filteredElevators.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center text-center gap-4 py-16">
        <SearchX className="w-16 h-16 text-muted-foreground" />
        <h3 className="text-2xl font-bold">No Elevators Found</h3>
        <p className="text-muted-foreground max-w-sm">
          {searchQuery ? `Your search for "${searchQuery}" did not match any elevators.` : "No elevators match the current filter."}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {Object.entries(elevatorsByDevice).sort(([a], [b]) => a.localeCompare(b, undefined, {numeric: true})).map(([deviceId, deviceElevators], index) => (
        <section key={deviceId} id={`device-${deviceId}`}>
            <h3 className="text-2xl font-bold text-primary mb-4">{getDeviceName(deviceId)}</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
                {deviceElevators.sort((a,b) => a.elevatorNum - b.elevatorNum).map(elevator => (
                    <ElevatorCard key={elevator.id} elevator={elevator} />
                ))}
            </div>
            {index < Object.keys(elevatorsByDevice).length - 1 && <Separator className="my-8" />}
        </section>
      ))}
    </div>
  );
}
