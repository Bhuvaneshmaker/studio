"use client";

import { useState, useEffect, useRef } from 'react';
import type { ElevatorData } from '@/types/elevator';
import { ElevatorCard } from '@/components/elevator-card';
import { useToast } from "@/hooks/use-toast";

const NUM_ELEVATORS = 10;
const NUM_BLOCKS = 15;
const MAX_FLOORS = 15;

const generateInitialElevators = (): ElevatorData[] => {
  const elevators: ElevatorData[] = [];
  const blockLetters = Array.from({ length: NUM_BLOCKS }, (_, i) => String.fromCharCode(65 + i));
  
  for (let i = 1; i <= NUM_ELEVATORS; i++) {
    const block = blockLetters[Math.floor(Math.random() * NUM_BLOCKS)];
    const id = `${block}-${i}`;
    const currentFloor = Math.floor(Math.random() * MAX_FLOORS) + 1;
    
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
      if (destinationFloor === currentFloor) destinationFloor = (currentFloor % MAX_FLOORS) + 1;
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

export function ElevatorGrid() {
  const [elevators, setElevators] = useState<ElevatorData[]>(generateInitialElevators);
  const { toast } = useToast();
  const notifiedErrors = useRef<Set<string>>(new Set());

  useEffect(() => {
    const interval = setInterval(() => {
      setElevators(prevElevators =>
        prevElevators.map(elevator => {
          let newElevator = { ...elevator };

          if (newElevator.status === 'ERROR') {
            if (Math.random() < 0.1) {
              newElevator.status = 'IDLE';
              newElevator.errorCode = 0;
              notifiedErrors.current.delete(newElevator.id);
            }
            return newElevator;
          }

          if (newElevator.status === 'MAINTENANCE') {
            return newElevator;
          }

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
          }
          
          if (newElevator.currentFloor !== newElevator.destinationFloor) {
            newElevator.status = 'MOVING';
            if (newElevator.currentFloor < newElevator.destinationFloor) {
              newElevator.direction = 'UP';
              newElevator.currentFloor++;
            } else {
              newElevator.direction = 'DOWN';
              newElevator.currentFloor--;
            }
          } else {
            if(newElevator.status === 'MOVING') {
                newElevator.status = 'IDLE';
                newElevator.direction = 'IDLE';
                newElevator.doorState = 'OPENING';
            }
          }

          if (newElevator.status === 'IDLE' && newElevator.doorState === 'CLOSED') {
             if(Math.random() < 0.05) {
                const newDestination = Math.floor(Math.random() * newElevator.totalFloors) + 1;
                if(newDestination !== newElevator.currentFloor) {
                    newElevator.destinationFloor = newDestination;
                }
             }
          }

          if (Math.random() < 0.01 && !notifiedErrors.current.has(newElevator.id)) {
            newElevator.status = 'ERROR';
            newElevator.errorCode = Math.floor(Math.random() * 5) + 101;
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
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-6">
      {elevators.map(elevator => (
        <ElevatorCard key={elevator.id} elevator={elevator} />
      ))}
    </div>
  );
}
