
"use client";

import { useState, useEffect } from 'react';
import type { ElevatorData } from '@/types/elevator';
import { ElevatorCard } from '@/components/elevator-card';
import { useNaming } from "@/hooks/use-naming";
import { Separator } from './ui/separator';
import { SearchX, Landmark, PlusCircle } from 'lucide-react';
import { Skeleton } from './ui/skeleton';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from './ui/card';
import { Button } from './ui/button';
import Link from 'next/link';
import { AddBlockFormWrapper } from './add-block-form-wrapper';

const ElevatorGridSkeleton = () => (
  <div className="space-y-8">
    {[1, 2].map(i => (
      <section key={i}>
        <div className="flex items-center gap-2 mb-4">
            <Landmark className="w-7 h-7 text-primary" />
            <Skeleton className="h-8 w-48" />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
          {Array.from({ length: 5 }).map((_, j) => (
            <div key={j} className="space-y-3 rounded-lg border bg-card text-card-foreground shadow-sm p-4">
              <Skeleton className="h-6 w-3/4" />
              <Skeleton className="h-4 w-1/2" />
              <div className="flex items-center justify-around gap-4 pt-4">
                  <Skeleton className="h-24 w-1/2 rounded-lg" />
                  <Skeleton className="h-12 w-1/2 rounded-md" />
              </div>
              <div className="flex gap-2 pt-4">
                <Skeleton className="h-8 w-1/2" />
                <Skeleton className="h-8 w-1/2" />
              </div>
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
    const fetchData = async () => {
        const res = await fetch('/api/elevators', { cache: 'no-store' });
        if (res.ok) {
            const data = await res.json();
            setElevators(data);
        }
        setLoading(false); // Only set loading to false after the first fetch
    }

    fetchData();

    const interval = setInterval(fetchData, 5000); // Poll for updates every 5 seconds
    return () => clearInterval(interval);
  }, []);

  const handleBlockAdded = (newElevators: ElevatorData[]) => {
    setElevators(newElevators);
  };

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

  if (elevators.length === 0) {
    return (
        <Card className="mt-10 col-span-full">
            <CardHeader className="text-center">
              <CardTitle>No Elevators in the System</CardTitle>
              <CardDescription>
                You first need to add a block to create and monitor elevators.
              </CardDescription>
            </CardHeader>
            <CardContent className="flex justify-center">
              <AddBlockFormWrapper onBlockAdded={handleBlockAdded}>
                <Button size="lg">
                  <PlusCircle className="mr-2 h-5 w-5" />
                  Add New Block to ElevateView
                </Button>
              </AddBlockFormWrapper>
            </CardContent>
        </Card>
    );
  }

  if (filteredElevators.length === 0) {
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
            <h3 className="text-2xl font-bold text-primary mb-4 flex items-center gap-2"><Landmark/> {getDeviceName(deviceId)}</h3>
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
