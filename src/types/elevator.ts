
export type ElevatorDirection = 'UP' | 'DOWN' | 'IDLE';
export type ElevatorStatus = 'MOVING' | 'IDLE' | 'MAINTENANCE' | 'ERROR';
export type DoorState = 'OPEN' | 'CLOSED' | 'OPENING' | 'CLOSING';

export interface ElevatorData {
  // Composite ID for React keys, e.g., "1-1" for Block 1, Elevator 1
  id: string; 
  blockId: string;
  elevatorNum: number;
  currentFloor: number;
  direction: ElevatorDirection;
  status: ElevatorStatus;
  doorState: DoorState;
  errorCode: number;
  destinationFloor: number;
  totalFloors: number;
  mainPower: boolean;
  emergencyStop: boolean;
  maintenanceDetails?: string;
}
