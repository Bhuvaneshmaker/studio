
"use client";

import { useState, useEffect, useRef } from 'react';
import type { ElevatorData } from '@/types/elevator';
import { ElevatorCard } from '@/components/elevator-card';
import { useToast } from "@/hooks/use-toast";
import { useNaming } from "@/hooks/use-naming";
import { Separator } from './ui/separator';
import { generateInitialElevators, updateElevatorState } from '@/lib/elevator-simulation';
import { SearchX } from 'lucide-react';

export function ElevatorGrid({ searchQuery, blockFilter }: { searchQuery: string, blockFilter: string | null }) {
  const [elevators, setElevators] = useState<ElevatorData[]>([]);
  const { toast } = useToast();
  const notifiedErrors = useRef<Set<string>>(new Set());
  const { getBlockName, getElevatorName } = useNaming();

  useEffect(() => {
    setElevators(generateInitialElevators());
  }, []);

  useEffect(() => {
    if (elevators.length === 0) return;

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
  }, [toast, elevators.length]);

  const filteredElevators = elevators.filter(elevator => {
    const block = elevator.id.split('-')[0];

    if (blockFilter && block !== blockFilter) {
        return false;
    }

    const query = searchQuery.toLowerCase().trim();
    if (!query) return true;

    const blockName = getBlockName(block).toLowerCase();
    const elevatorName = getElevatorName(elevator.id).toLowerCase();
    
    const idMatch = elevator.id.toLowerCase().includes(query);
    const floorMatch = elevator.currentFloor.toString().includes(query);
    const blockNameMatch = blockName.includes(query);
    const elevatorNameMatch = elevatorName.includes(query);

    if (blockFilter) {
      return elevatorNameMatch || idMatch || floorMatch;
    }

    return blockNameMatch || elevatorNameMatch || idMatch || floorMatch;
  });

  const elevatorsByBlock = filteredElevators.reduce((acc, elevator) => {
    const block = elevator.id.split('-')[0];
    if (!acc[block]) {
      acc[block] = [];
    }
    acc[block].push(elevator);
    return acc;
  }, {} as Record<string, ElevatorData[]>);


  if (elevators.length > 0 && filteredElevators.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center text-center gap-4 py-16">
        <SearchX className="w-16 h-16 text-muted-foreground" />
        <h3 className="text-2xl font-bold">No Elevators Found</h3>
        <p className="text-muted-foreground">
          {searchQuery ? `Your search for "${searchQuery}" did not match any elevators.` : "No elevators match the current filter."}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {Object.entries(elevatorsByBlock).sort(([blockA], [blockB]) => parseInt(blockA) - parseInt(blockB)).map(([block, blockElevators], index) => (
        <section key={block} id={`block-${block}`}>
            <h3 className="text-2xl font-bold text-primary mb-4">{getBlockName(block)}</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
                {blockElevators.sort((a,b) => a.id.localeCompare(b.id, undefined, {numeric: true})).map(elevator => (
                    <ElevatorCard key={elevator.id} elevator={elevator} />
                ))}
            </div>
            {index < Object.keys(elevatorsByBlock).length - 1 && <Separator className="my-8" />}
        </section>
      ))}
    </div>
  );
}
