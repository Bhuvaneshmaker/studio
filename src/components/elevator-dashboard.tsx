"use client";

import { useState, useEffect, useRef } from 'react';
import type { ElevatorData } from '@/types/elevator';
import { ElevatorCard } from '@/components/elevator-card';
import { useToast } from "@/hooks/use-toast";
import { Building, Wrench, ShieldAlert } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';

const NUM_ELEVATORS = 10;
const NUM_BLOCKS = 15;
const MAX_FLOORS = 15;

// Generate more diverse initial elevator data
const generateInitialElevators = (): ElevatorData[] => {
  const elevators: ElevatorData[] = [];
  const blockLetters = Array.from({ length: NUM_BLOCKS }, (_, i) => String.fromCharCode(65 + i));
  
  for (let i = 1; i <= NUM_ELEVATORS; i++) {
    const block = blockLetters[Math.floor(Math.random() * NUM_BLOCKS)];
    const id = `${block}-${i}`;
    const currentFloor = Math.floor(Math.random() * MAX_FLOORS) + 1;
    
    // Make some elevators start in different states
    let status: ElevatorData['status'] = 'IDLE';
    let direction: ElevatorData['direction'] = 'IDLE';
    let doorState: ElevatorData['doorState'] = 'CLOSED';
    let destinationFloor = currentFloor;

    const rand = Math.random();
    if (rand < 0.1) {
      status = 'MAINTENANCE';
    } else if (rand < 0.3) {
      status = 'MOVING';
      destinationFloor = Math.floor(Math.random() * MAX_FLOORS) + 1;
      if (destinationFloor === currentFloor) destinationFloor = (currentFloor % MAX_FLOORS) + 1; // Ensure it's different
      direction = destinationFloor > currentFloor ? 'UP' : 'DOWN';
    }

    elevators.push({
      id,
      currentFloor,
      direction,
      status,
      doorState,
      errorCode: 0,
      totalFloors: MAX_FLOORS,
      destinationFloor,
    });
  }
  return elevators;
};


// In a real application, this data would come from a WebSocket or long-polling API
// We simulate it here for demonstration purposes.
export default function ElevatorDashboard() {
  const [elevators, setElevators] = useState<ElevatorData[]>(generateInitialElevators);
  const { toast } = useToast();
  const notifiedErrors = useRef<Set<string>>(new Set());

  const maintenanceCount = elevators.filter(e => e.status === 'MAINTENANCE').length;
  const errorCount = elevators.filter(e => e.status === 'ERROR').length;
  const activeCount = NUM_ELEVATORS - maintenanceCount - errorCount;

  useEffect(() => {
    const interval = setInterval(() => {
      setElevators(prevElevators =>
        prevElevators.map(elevator => {
          let newElevator = { ...elevator };

          // Handle error state
          if (newElevator.status === 'ERROR') {
            // Chance to recover from error
            if (Math.random() < 0.1) {
              newElevator.status = 'IDLE';
              newElevator.errorCode = 0;
              notifiedErrors.current.delete(newElevator.id);
            }
            return newElevator;
          }

          // Handle maintenance state
          if (newElevator.status === 'MAINTENANCE') {
            return newElevator;
          }

          // Handle door states
          if (newElevator.doorState === 'OPENING') {
              newElevator.doorState = 'OPEN';
              return newElevator;
          }
          if (newElevator.doorState === 'OPEN') {
              newElevator.doorState = 'CLOSING';
              return newElevator;
          }
           if (newElevator.doorState === 'CLOSING') {
              newElevator.doorState = 'CLOSED';
              // After closing, it can start moving if it has a new destination
          }
          
          // Handle movement
          if (newElevator.currentFloor !== newElevator.destinationFloor) {
            newElevator.status = 'MOVING';
            if (newElevator.currentFloor < newElevator.destinationFloor) {
              newElevator.direction = 'UP';
              newElevator.currentFloor++;
            } else {
              newElevator.direction = 'DOWN';
              newElevator.currentFloor--;
            }
          } else { // Reached destination
            if(newElevator.status === 'MOVING') { // Was moving, now arrived
                newElevator.status = 'IDLE';
                newElevator.direction = 'IDLE';
                newElevator.doorState = 'OPENING';
            }
          }

          // Handle idle state - assign new destination
          if (newElevator.status === 'IDLE' && newElevator.doorState === 'CLOSED') {
             if(Math.random() < 0.05) { // Chance to get a new call
                const newDestination = Math.floor(Math.random() * newElevator.totalFloors) + 1;
                if(newDestination !== newElevator.currentFloor) {
                    newElevator.destinationFloor = newDestination;
                }
             }
          }

          // Small chance of a random error
          if (Math.random() < 0.01 && !notifiedErrors.current.has(newElevator.id)) {
            newElevator.status = 'ERROR';
            newElevator.errorCode = Math.floor(Math.random() * 5) + 101; // e.g., 101-105
            if (!notifiedErrors.current.has(newElevator.id)) {
              toast({
                variant: "destructive",
                title: `Elevator ${newElevator.id} Alert!`,
                description: `A critical error (Code: ${newElevator.errorCode}) has been detected.`,
              });
              notifiedErrors.current.add(newElevator.id);
            }
          }
          
          return newElevator;
        })
      );
    }, 2000);

    return () => clearInterval(interval);
  }, [toast]);

  return (
    <>
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="text-xl">Control Room Status</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-center">
            <div className="bg-muted/50 p-4 rounded-lg">
              <Building className="w-8 h-8 mx-auto text-primary mb-2"/>
              <p className="text-3xl font-bold">{NUM_BLOCKS}</p>
              <p className="text-sm text-muted-foreground">Blocks</p>
            </div>
            <div className="bg-muted/50 p-4 rounded-lg">
                <div className="w-8 h-8 mx-auto text-green-500 mb-2 font-bold text-3xl flex items-center justify-center">{activeCount}</div>
                <p className="text-3xl font-bold">{NUM_ELEVATORS}</p>
                <p className="text-sm text-muted-foreground">Total Elevators</p>
            </div>
            <div className="bg-muted/50 p-4 rounded-lg">
              <Wrench className="w-8 h-8 mx-auto text-yellow-500 mb-2"/>
              <p className="text-3xl font-bold">{maintenanceCount}</p>
              <p className="text-sm text-muted-foreground">In Maintenance</p>
            </div>
            <div className="bg-muted/50 p-4 rounded-lg">
              <ShieldAlert className="w-8 h-8 mx-auto text-red-500 mb-2"/>
              <p className="text-3xl font-bold">{errorCount}</p>
              <p className="text-sm text-muted-foreground">System Alerts</p>
            </div>
          </div>
        </CardContent>
      </Card>
      <Separator />
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-6">
        {elevators.map(elevator => (
          <ElevatorCard key={elevator.id} elevator={elevator} />
        ))}
      </div>
    </>
  );
}
