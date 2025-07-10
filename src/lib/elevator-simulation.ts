import type { SlaveData } from '@/types/elevator';

export const NUM_SLAVES_PER_DEVICE = 10;
export const NUM_DEVICES = 15;
export const MAX_FLOORS = 15;
export const TOTAL_SLAVES = NUM_DEVICES * NUM_SLAVES_PER_DEVICE;

const maintenanceReasons = [
  "Scheduled monthly inspection.",
  "Replacing worn-out door sensors.",
  "Upgrading control panel software.",
  "Repairing faulty Modbus wiring.",
  "Annual safety certification.",
  "Calibrating floor leveling system.",
  "Emergency brake system check.",
];

export const generateInitialSlaves = (): SlaveData[] => {
  const slaves: SlaveData[] = [];
  
  for (let deviceNum = 1; deviceNum <= NUM_DEVICES; deviceNum++) {
    const deviceIp = `192.168.1.${9 + deviceNum}`;
    for (let i = 1; i <= NUM_SLAVES_PER_DEVICE; i++) {
        const slaveId = i;
        const compositeId = `${deviceIp}-${slaveId}`;
        const currentFloor = Math.floor(Math.random() * MAX_FLOORS) + 1;
        
        let status: SlaveData['status'] = 'IDLE';
        let direction: SlaveData['direction'] = 'IDLE';
        let doorState: SlaveData['doorState'] = 'CLOSED';
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

        slaves.push({
          id: compositeId,
          deviceIp,
          slaveId,
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
  return slaves;
};


interface AlertInfo {
    id: string;
    title: string;
    description: string;
}

export const updateSlaveState = (
    prevSlaves: SlaveData[], 
    notifiedErrors: Set<string>
): { updatedSlaves: SlaveData[], newAlerts: AlertInfo[] } => {
    const newAlerts: AlertInfo[] = [];

    const updatedSlaves = prevSlaves.map(slave => {
        let newSlave = { ...slave };

        if (!newSlave.mainPower || newSlave.emergencyStop) {
            return newSlave;
        }

        if (newSlave.status === 'ERROR') {
            if (Math.random() < 0.1) {
            newSlave.status = 'IDLE';
            newSlave.errorCode = 0;
            notifiedErrors.delete(newSlave.id);
            }
            return newSlave;
        }

        if (newSlave.status === 'MAINTENANCE') {
             // Occasionally, a maintenance task finishes
            if (Math.random() < 0.01) {
                newSlave.status = 'IDLE';
                newSlave.maintenanceDetails = undefined;
            }
            return newSlave;
        }

        if (newSlave.doorState === 'OPENING') {
            newSlave.doorState = 'OPEN';
            return newSlave;
        }
        if (newSlave.doorState === 'OPEN') {
            newSlave.doorState = 'CLOSING';
            return newSlave;
        }
        if (newSlave.doorState === 'CLOSING') {
            newSlave.doorState = 'CLOSED';
        }
        
        if (newSlave.currentFloor !== newSlave.destinationFloor) {
            newSlave.status = 'MOVING';
            if (newSlave.currentFloor < newSlave.destinationFloor) {
            newSlave.direction = 'UP';
            newSlave.currentFloor++;
            } else {
            newSlave.direction = 'DOWN';
            newSlave.currentFloor--;
            }
        } else {
            if(newSlave.status === 'MOVING') {
                newSlave.status = 'IDLE';
                newSlave.direction = 'IDLE';
                newSlave.doorState = 'OPENING';
            }
        }

        if (newSlave.status === 'IDLE' && newSlave.doorState === 'CLOSED') {
            if(Math.random() < 0.05) {
                const newDestination = Math.floor(Math.random() * newSlave.totalFloors) + 1;
                if(newDestination !== newSlave.currentFloor) {
                    newSlave.destinationFloor = newDestination;
                }
            }
        }

        if (Math.random() < 0.001) {
            newSlave.status = 'ERROR';
            newSlave.errorCode = Math.floor(Math.random() * 5) + 101;
            newAlerts.push({
                id: newSlave.id,
                title: `Device ${newSlave.deviceIp} - Slave ${newSlave.slaveId} Alert!`,
                description: `A critical error (Code: ${newSlave.errorCode}) has been detected.`,
            });
        }

        if (Math.random() < 0.0005) {
            newSlave.emergencyStop = true;
            newSlave.status = 'ERROR';
            newAlerts.push({
                id: newSlave.id,
                title: `Device ${newSlave.deviceIp} - Slave ${newSlave.slaveId} Emergency Stop!`,
                description: `The emergency stop has been activated.`,
            });
        }
        
        return newSlave;
    });

    return { updatedSlaves, newAlerts };
};
