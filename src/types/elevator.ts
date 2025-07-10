export type ElevatorDirection = 'UP' | 'DOWN' | 'IDLE';
export type ElevatorStatus = 'MOVING' | 'IDLE' | 'MAINTENANCE' | 'ERROR';
export type DoorState = 'OPEN' | 'CLOSED' | 'OPENING' | 'CLOSING';

export interface ElevatorData {
  id: string;
  currentFloor: number;
  direction: ElevatorDirection;
  status: ElevatorStatus;
  doorState: DoorState;
  errorCode: number;
  destinationFloor: number;
  totalFloors: number;
}
