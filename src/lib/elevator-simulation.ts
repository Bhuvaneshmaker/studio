
import type { ElevatorData } from '@/types/elevator';

export const NUM_ELEVATORS_PER_BLOCK = 10;
export const NUM_BLOCKS = 15;
export const MAX_FLOORS = 15;
export const TOTAL_ELEVATORS = NUM_BLOCKS * NUM_ELEVATORS_PER_BLOCK;

const maintenanceReasons = [
  "Scheduled monthly inspection.",
  "Replacing worn-out door sensors.",
  "Upgrading control panel software.",
  "Repairing faulty wiring.",
  "Annual safety certification.",
  "Calibrating floor leveling system.",
  "Emergency brake system check.",
];

export const createBlock = (blockId: string, numElevators: number): ElevatorData[] => {
    const elevators: ElevatorData[] = [];
    for (let i = 1; i <= numElevators; i++) {
        const elevatorNum = i;
        const compositeId = `${blockId}-${elevatorNum}`;
        const currentFloor = 1;
        
        elevators.push({
          id: compositeId,
          blockId,
          elevatorNum,
          currentFloor,
          direction: 'IDLE',
          status: 'IDLE',
          doorState: 'CLOSED',
          errorCode: 0,
          totalFloors: MAX_FLOORS,
          destinationFloor: 1,
          mainPower: true,
          emergencyStop: false,
        });
    }
    return elevators;
}

export const generateInitialElevators = (numBlocks = NUM_BLOCKS, elevatorsPerBlock = NUM_ELEVATORS_PER_BLOCK): ElevatorData[] => {
  let elevators: ElevatorData[] = [];
  
  for (let blockNum = 1; blockNum <= numBlocks; blockNum++) {
    const blockId = blockNum.toString();
    for (let i = 1; i <= elevatorsPerBlock; i++) {
        const elevatorNum = i;
        const compositeId = `${blockId}-${elevatorNum}`;
        const currentFloor = Math.floor(Math.random() * MAX_FLOORS) + 1;
        
        let status: ElevatorData['status'] = 'IDLE';
        let direction: ElevatorData['direction'] = 'IDLE';
        let doorState: ElevatorData['doorState'] = 'CLOSED';
        let destinationFloor = currentFloor;
        let maintenanceDetails: string | undefined = undefined;

        const rand = Math.random();
        if (rand < 0.1) {
          status = 'MAINTENANCE';
          maintenanceDetails = maintenanceReasons[Math.floor(Math.random() * maintenanceReasons.length)];
        } else if (rand < 0.3) {
          status = 'MOVING';
          destinationFloor = Math.floor(Math.random() * MAX_FLOORS) + 1;
          if (destinationFloor === currentFloor) destinationFloor = (currentFloor % MAX_FLOORS) + 1;
          direction = destinationFloor > currentFloor ? 'UP' : 'DOWN';
        }

        elevators.push({
          id: compositeId,
          blockId,
          elevatorNum,
          currentFloor,
          direction,
          status,
          doorState,
          errorCode: 0,
          totalFloors: MAX_FLOORS,
          destinationFloor,
          mainPower: Math.random() > 0.05,
          emergencyStop: false,
          maintenanceDetails,
        });
    }
  }
  return elevators;
};


interface AlertInfo {
    id: string;
    title: string;
    description: string;
}

export const updateElevatorState = (
    prevElevators: ElevatorData[], 
    notifiedErrors: Set<string>
): { updatedElevators: ElevatorData[], newAlerts: AlertInfo[] } => {
    const newAlerts: AlertInfo[] = [];

    const updatedElevators = prevElevators.map(elevator => {
        let newElevator = { ...elevator };

        if (!newElevator.mainPower || newElevator.emergencyStop) {
            return newElevator;
        }

        if (newElevator.status === 'ERROR') {
            if (Math.random() < 0.1) {
            newElevator.status = 'IDLE';
            newElevator.errorCode = 0;
            notifiedErrors.delete(newElevator.id);
            }
            return newElevator;
        }

        if (newElevator.status === 'MAINTENANCE') {
             // Occasionally, a maintenance task finishes
            if (Math.random() < 0.01) {
                newElevator.status = 'IDLE';
                newElevator.maintenanceDetails = undefined;
            }
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

        if (Math.random() < 0.001) {
            newElevator.status = 'ERROR';
            newElevator.errorCode = Math.floor(Math.random() * 5) + 101;
            newAlerts.push({
                id: newElevator.id,
                title: `Block ${newElevator.blockId} - Elevator ${newElevator.elevatorNum} Alert!`,
                description: `A critical error (Code: ${newElevator.errorCode}) has been detected.`,
            });
        }

        if (Math.random() < 0.0005) {
            newElevator.emergencyStop = true;
            newElevator.status = 'ERROR';
            newAlerts.push({
                id: newElevator.id,
                title: `Block ${newElevator.blockId} - Elevator ${newElevator.elevatorNum} Emergency Stop!`,
                description: `The emergency stop has been activated.`,
            });
        }
        
        return newElevator;
    });

    return { updatedElevators, newAlerts };
};
