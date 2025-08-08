
import fs from 'fs';
import path from 'path';
import ini from 'ini';
import type { ElevatorData } from '@/types/elevator';
import { MAX_FLOORS } from '@/lib/constants';

const iniFilePath = path.join(process.cwd(), 'ini_ip.ini');

function ensureIniFileExists() {
  if (!fs.existsSync(iniFilePath)) {
    try {
      // Create an empty file first, to be populated by the application/discovery
      fs.writeFileSync(iniFilePath, '; ElevateMS Hardware Configuration\n', 'utf-8');
      console.log('Created empty ini_ip.ini file.');
    } catch (error) {
       console.error("Fatal: Could not create ini_ip.ini file.", error);
       // In a real scenario, you might want to exit the process if the config is critical
    }
  }
}

export function getElevatorDataFromIni(): ElevatorData[] {
  ensureIniFileExists();
  try {
    const iniFileContent = fs.readFileSync(iniFilePath, 'utf-8');
    const config = ini.parse(iniFileContent);
    const elevators: ElevatorData[] = [];

    for (const sectionKey in config) {
      const section = config[sectionKey];
      // Ensure section is an object and not a primitive from a parsing error
      if (typeof section !== 'object' || section === null) continue;

      const deviceId = section.block_id;
      const deviceName = section.block_name || `Block ${deviceId}`;
      const ipAddress = section.ip_address;

      if (!deviceId) continue;

      // Handle blocks that have been discovered but have no elevators yet.
      // Create a "placeholder" elevator so the block appears in the UI.
      const elevatorKeys = Object.keys(section).filter(key => key.startsWith('elevator_') && !key.endsWith('_floor_count'));
      if (elevatorKeys.length === 0) {
        elevators.push({
            id: `${deviceId}-placeholder`,
            deviceId: deviceId,
            deviceName: deviceName,
            elevatorNum: 0, // Placeholder
            ipAddress: ipAddress,
            currentFloor: 0,
            direction: 'IDLE',
            status: 'IDLE', // Or a new 'UNCONFIGURED' status
            doorState: 'CLOSED',
            errorCode: 0,
            destinationFloor: 0,
            totalFloors: 0,
            mainPower: false,
            emergencyStop: false,
        });
      } else {
        elevatorKeys.forEach(key => {
            const slaveId = section[key];
            const floorCountKey = `${key}_floor_count`;
            const totalFloors = parseInt(section[floorCountKey] || MAX_FLOORS.toString(), 10);
            const compositeId = `${deviceId}-${slaveId}`;

            elevators.push({
                id: compositeId,
                deviceId,
                deviceName,
                elevatorNum: parseInt(slaveId, 10),
                ipAddress,
                currentFloor: 1,
                direction: 'IDLE',
                status: 'IDLE',
                doorState: 'CLOSED',
                errorCode: 0,
                destinationFloor: 1,
                totalFloors: totalFloors,
                mainPower: false,
                emergencyStop: false,
            });
        });
      }
    }
    // Filter out any placeholder elevators if real ones exist for that block
    const finalElevators = elevators.filter(e => {
        if (e.id.endsWith('-placeholder')) {
            return !elevators.some(other => other.deviceId === e.deviceId && !other.id.endsWith('-placeholder'));
        }
        return true;
    });

    return finalElevators;
  } catch (error) {
    console.error("Could not read or parse ini_ip.ini. Returning empty array.", error);
    return [];
  }
}
