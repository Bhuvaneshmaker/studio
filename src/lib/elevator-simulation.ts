import type { ElevatorData } from '@/types/elevator';

export const NUM_ELEVATORS_PER_BLOCK = 10;
export const NUM_BLOCKS = 15;
export const MAX_FLOORS = 15;
export const TOTAL_ELEVATORS = NUM_BLOCKS * NUM_ELEVATORS_PER_BLOCK;

export const generateInitialElevators = (): ElevatorData[] => {
  const elevators: ElevatorData[] = [];
  
  for (let blockNum = 1; blockNum <= NUM_BLOCKS; blockNum++) {
    for (let i = 1; i <= NUM_ELEVATORS_PER_BLOCK; i++) {
        const id = `${blockNum}-${i}`;
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
          mainPower: Math.random() > 0.05,
          emergencyStop: false,
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
                title: `Elevator ${newElevator.id} Alert!`,
                description: `A critical error (Code: ${newElevator.errorCode}) has been detected.`,
            });
        }

        if (Math.random() < 0.0005) {
            newElevator.emergencyStop = true;
            newElevator.status = 'ERROR';
            newAlerts.push({
                id: newElevator.id,
                title: `Elevator ${newElevator.id} Emergency Stop!`,
                description: `The emergency stop has been activated.`,
            });
        }
        
        return newElevator;
    });

    return { updatedElevators, newAlerts };
};
