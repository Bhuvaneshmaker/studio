"use client";

import { useState, useEffect, useRef } from 'react';
import type { ElevatorData } from '@/types/elevator';
import { ElevatorCard } from '@/components/elevator-card';
import { useToast } from "@/hooks/use-toast";
import { Separator } from './ui/separator';
import { generateInitialElevators, updateElevatorState } from '@/lib/elevator-simulation';

export function ElevatorGrid() {
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

  const elevatorsByBlock = elevators.reduce((acc, elevator) => {
    const block = elevator.id.split('-')[0];
    if (!acc[block]) {
      acc[block] = [];
    }
    acc[block].push(elevator);
    return acc;
  }, {} as Record<string, ElevatorData[]>);


  return (
    <div className="space-y-8">
      {Object.entries(elevatorsByBlock).sort(([blockA], [blockB]) => parseInt(blockA) - parseInt(blockB)).map(([block, blockElevators]) => (
        <section key={block} id={`block-${block}`}>
            <h3 className="text-2xl font-bold text-primary mb-4">Block {block}</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-5 gap-6">
                {blockElevators.sort((a,b) => a.id.localeCompare(b.id, undefined, {numeric: true})).map(elevator => (
                    <ElevatorCard key={elevator.id} elevator={elevator} />
                ))}
            </div>
            <Separator className="my-8" />
        </section>
      ))}
    </div>
  );
}
