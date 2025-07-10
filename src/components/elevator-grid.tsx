
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
      const { updatedElevators, newAlerts } = updateElevatorState(elevators, notifiedErrors.current);
      setElevators(updatedElevators);

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
  }, [elevators, toast]);

  const filteredElevators = elevators.filter(elevator => {
    if (blockFilter && elevator.blockId !== blockFilter) {
        return false;
    }

    const query = searchQuery.toLowerCase().trim();
    if (!query) return true;

    const blockName = getBlockName(elevator.blockId).toLowerCase();
    const elevatorName = getElevatorName(elevator.id).toLowerCase();
    
    const idMatch = elevator.id.toLowerCase().includes(query);
    const elevatorNumMatch = elevator.elevatorNum.toString().includes(query);
    const blockIdMatch = elevator.blockId.toLowerCase().includes(query);
    const floorMatch = elevator.currentFloor.toString().includes(query);
    const blockNameMatch = blockName.includes(query);
    const elevatorNameMatch = elevatorName.includes(query);

    if (blockFilter) {
      return elevatorNameMatch || idMatch || floorMatch || elevatorNumMatch;
    }

    return blockNameMatch || elevatorNameMatch || idMatch || floorMatch || blockIdMatch || elevatorNumMatch;
  });

  const elevatorsByBlock = filteredElevators.reduce((acc, elevator) => {
    const blockId = elevator.blockId;
    if (!acc[blockId]) {
      acc[blockId] = [];
    }
    acc[blockId].push(elevator);
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
      {Object.entries(elevatorsByBlock).sort(([a], [b]) => a.localeCompare(b, undefined, {numeric: true})).map(([blockId, blockElevators], index) => (
        <section key={blockId} id={`block-${blockId}`}>
            <h3 className="text-2xl font-bold text-primary mb-4">{getBlockName(blockId)}</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
                {blockElevators.sort((a,b) => a.elevatorNum - b.elevatorNum).map(elevator => (
                    <ElevatorCard key={elevator.id} elevator={elevator} />
                ))}
            </div>
            {index < Object.keys(elevatorsByBlock).length - 1 && <Separator className="my-8" />}
        </section>
      ))}
    </div>
  );
}
