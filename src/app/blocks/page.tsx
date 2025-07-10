
"use client";

import { useState, useEffect, useRef } from 'react';
import type { ElevatorData } from '@/types/elevator';
import { generateInitialElevators, updateElevatorState, NUM_BLOCKS } from '@/lib/elevator-simulation';
import { useToast } from "@/hooks/use-toast";
import Link from 'next/link';
import { Building, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { BlockCard } from '@/components/block-card';

export default function BlocksPage() {
  const [elevators, setElevators] = useState<ElevatorData[]>(generateInitialElevators);
  const { toast } = useToast();
  const notifiedErrors = useRef<Set<string>>(new Set());

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
  
  const elevatorsByBlock = Array.from({ length: NUM_BLOCKS }, (_, i) => i + 1).map(blockNum => {
    return {
      blockId: blockNum.toString(),
      elevators: elevators.filter(e => e.id.startsWith(`${blockNum}-`))
    };
  });

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
              Blocks
            </h2>
          </div>
          <Button asChild variant="outline" size="sm" className="shrink-0">
            <Link href="/elevators">View Elevators</Link>
          </Button>
        </div>
      </header>
      <main className="container mx-auto p-4 sm:p-6 space-y-8">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {elevatorsByBlock.map(({ blockId, elevators }) => (
            <BlockCard key={blockId} blockId={blockId} elevators={elevators} />
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
