
"use client";

import { useState, useEffect, useRef } from 'react';
import type { ElevatorData } from '@/types/elevator';
import { generateInitialElevators, updateElevatorState, createBlock } from '@/lib/elevator-simulation';
import { useToast } from "@/hooks/use-toast";
import Link from 'next/link';
import { Building, SlidersHorizontal, PlusCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { BlockCard } from '@/components/block-card';
import { AddBlockForm } from '@/components/add-block-form';
import { useNaming } from '@/hooks/use-naming';
import { BackButton } from '@/components/back-button';

export default function BlocksPage() {
  const [elevators, setElevators] = useState<ElevatorData[]>([]);
  const { toast } = useToast();
  const notifiedErrors = useRef<Set<string>>(new Set());
  const [isAddBlockOpen, setIsAddBlockOpen] = useState(false);
  const { setBlockName } = useNaming();
  const [initialLoad, setInitialLoad] = useState(true);

  useEffect(() => {
    setElevators(generateInitialElevators());
    setInitialLoad(false);
  }, []);

  useEffect(() => {
    if (initialLoad || elevators.length === 0) return;

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
  }, [elevators, toast, initialLoad]);
  
  const elevatorsByBlock = elevators.reduce((acc, elevator) => {
    const blockId = elevator.blockId;
    if (!acc[blockId]) {
      acc[blockId] = [];
    }
    acc[blockId].push(elevator);
    return acc;
  }, {} as Record<string, ElevatorData[]>);

  const handleAddBlock = (blockName: string, numElevators: number) => {
    const existingBlockIds = Object.keys(elevatorsByBlock).map(id => parseInt(id, 10));
    const newBlockId = existingBlockIds.length > 0 ? Math.max(...existingBlockIds) + 1 : 1;
    
    const newBlock = createBlock(newBlockId.toString(), numElevators);
    setBlockName(newBlockId.toString(), blockName);
    setElevators(prev => [...prev, ...newBlock]);
  };

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
          <BackButton />
        </div>
      </header>
      <main className="container mx-auto p-4 sm:p-6 space-y-8">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {Object.entries(elevatorsByBlock).map(([blockId, elevators]) => (
            <BlockCard key={blockId} blockId={blockId} elevators={elevators} />
          ))}
           <AddBlockForm open={isAddBlockOpen} onOpenChange={setIsAddBlockOpen} onAddBlock={handleAddBlock}>
             <div 
              className="border-2 border-dashed border-muted-foreground/50 rounded-lg flex flex-col items-center justify-center text-center p-6 hover:bg-muted/50 hover:border-primary/50 transition-all duration-300 cursor-pointer h-full min-h-[250px]"
              onClick={() => setIsAddBlockOpen(true)}
              >
                <PlusCircle className="w-12 h-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-bold">Add New Block</h3>
                <p className="text-sm text-muted-foreground">Click to configure a new block and its elevators.</p>
              </div>
          </AddBlockForm>
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
