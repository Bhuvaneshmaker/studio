"use client";

import { useState, useEffect, useRef } from 'react';
import type { ElevatorData } from '@/types/elevator';
import { ElevatorCard } from '@/components/elevator-card';
import { useToast } from "@/hooks/use-toast";

const NUM_ELEVATORS = 4;
const MAX_FLOORS_A = 12;
const MAX_FLOORS_B = 16;

const initialElevators: ElevatorData[] = [
  { id: 'A-1', currentFloor: 1, direction: 'IDLE', status: 'IDLE', doorState: 'CLOSED', errorCode: 0, totalFloors: MAX_FLOORS_A, destinationFloor: 1 },
  { id: 'A-2', currentFloor: MAX_FLOORS_A, direction: 'IDLE', status: 'IDLE', doorState: 'CLOSED', errorCode: 0, totalFloors: MAX_FLOORS_A, destinationFloor: MAX_FLOORS_A },
  { id: 'B-1', currentFloor: 5, direction: 'IDLE', status: 'MAINTENANCE', doorState: 'CLOSED', errorCode: 0, totalFloors: MAX_FLOORS_B, destinationFloor: 5 },
  { id: 'B-2', currentFloor: 8, direction: 'UP', status: 'MOVING', doorState: 'CLOSED', errorCode: 0, totalFloors: MAX_FLOORS_B, destinationFloor: 15 },
];

// In a real application, this data would come from a WebSocket or long-polling API
// connected to a Raspberry Pi. We simulate it here for demonstration purposes.
export default function ElevatorDashboard() {
  const [elevators, setElevators] = useState<ElevatorData[]>(initialElevators);
  const { toast } = useToast();
  const notifiedErrors = useRef<Set<string>>(new Set());

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
          if (Math.random() < 0.01) {
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
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-2 2xl:grid-cols-4 gap-6">
      {elevators.map(elevator => (
        <ElevatorCard key={elevator.id} elevator={elevator} />
      ))}
    </div>
  );
}
