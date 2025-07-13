
"use client";

import Link from 'next/link';
import { Building, PlusCircle, Landmark } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { BlockCard } from '@/components/block-card';
import { AddBlockFormWrapper } from '@/components/add-block-form-wrapper';
import { BackButton } from '@/components/back-button';
import type { ElevatorData } from '@/types/elevator';
import { useEffect, useState } from 'react';
import { Skeleton } from '@/components/ui/skeleton';

const BlocksPageSkeleton = () => (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {Array.from({ length: 8 }).map((_, i) => (
             <div key={i} className="space-y-3 rounded-lg border bg-card text-card-foreground shadow-sm p-4">
              <Skeleton className="h-6 w-3/4" />
              <Skeleton className="h-4 w-1/2" />
              <div className="space-y-2 pt-2">
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
              </div>
              <div className="pt-2">
                <Skeleton className="h-10 w-full" />
              </div>
            </div>
        ))}
    </div>
);

export default function BlocksPage() {
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
  
  const handleBlockAdded = (newElevators: ElevatorData[]) => {
    setElevators(newElevators);
  };

  const elevatorsByBlock = elevators.reduce((acc, elevator) => {
    const deviceId = elevator.deviceId;
    if (!acc[deviceId]) {
      acc[deviceId] = [];
    }
    acc[deviceId].push(elevator);
    return acc;
  }, {} as Record<string, ElevatorData[]>);

  const pageTitle = 'Blocks';

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
              <Landmark className="w-6 h-6" /> {pageTitle}
            </h2>
          </div>
          <div className="flex items-center gap-2">
            <AddBlockFormWrapper onBlockAdded={handleBlockAdded}>
               <Button size="sm">
                  <PlusCircle className="mr-2 h-4 w-4" />
                  Add New Elevator
                </Button>
            </AddBlockFormWrapper>
            <BackButton />
          </div>
        </div>
      </header>
      <main className="container mx-auto p-4 sm:p-6 space-y-8">
        {loading ? (
          <BlocksPageSkeleton />
        ) : Object.keys(elevatorsByBlock).length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {Object.entries(elevatorsByBlock).sort(([a], [b]) => a.localeCompare(b, undefined, {numeric: true})).map(([deviceId, deviceElevators]) => (
              <BlockCard key={deviceId} deviceId={deviceId} elevators={deviceElevators} />
            ))}
          </div>
        ) : (
           <Card className="mt-10 col-span-full">
            <CardHeader className="text-center">
              <CardTitle>No Blocks Configured</CardTitle>
              <CardDescription>
                Get started by adding your first block to monitor elevators.
              </CardDescription>
            </CardHeader>
            <CardContent className="flex justify-center">
              <AddBlockFormWrapper onBlockAdded={handleBlockAdded}>
                <Button size="lg">
                  <PlusCircle className="mr-2 h-5 w-5" />
                  Add New Elevator to ElevateView
                </Button>
              </AddBlockFormWrapper>
            </CardContent>
          </Card>
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
