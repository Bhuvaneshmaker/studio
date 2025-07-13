
"use client";

import { useState, useEffect, useCallback } from 'react';
import type { CustomNames } from '@/types/naming';

const NAMING_STORAGE_KEY = 'elevateview-custom-names';

const defaultNames: CustomNames = {
  devices: {},
  elevators: {},
  floors: {},
};

// This function needs to be defined outside the hook to be accessible in the initial state.
const loadNamesFromStorage = (): CustomNames => {
  if (typeof window === 'undefined') {
    return defaultNames;
  }
  try {
    const storedNames = window.localStorage.getItem(NAMING_STORAGE_KEY);
    if (storedNames) {
      // Ensure all keys exist even if they are not in storage, merging with defaults.
      const parsedNames = JSON.parse(storedNames);
      return { ...defaultNames, ...parsedNames };
    }
  } catch (error) {
    console.error("Failed to parse custom names from localStorage", error);
  }
  return defaultNames;
};


export const useNaming = () => {
  const [customNames, setCustomNames] = useState<CustomNames>(loadNamesFromStorage);
  
  // Effect to sync state with localStorage when it changes
  useEffect(() => {
    try {
        const serializedNames = JSON.stringify(customNames);
        window.localStorage.setItem(NAMING_STORAGE_KEY, serializedNames);
    } catch (error) {
        console.error("Failed to save custom names to localStorage", error);
    }
  }, [customNames]);
  
  // Effect to listen for storage changes from other tabs
  useEffect(() => {
    const handleStorageChange = (event: StorageEvent) => {
      if (event.key === NAMING_STORAGE_KEY && event.newValue) {
        try {
          const parsedNames = JSON.parse(event.newValue);
          setCustomNames({ ...defaultNames, ...parsedNames });
        } catch (error) {
            console.error("Failed to parse storage update", error);
        }
      }
    };
    
    window.addEventListener('storage', handleStorageChange);
    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };
  }, []);

  const getDeviceName = useCallback((deviceId: string) => {
    return customNames.devices[deviceId] || `Block ${deviceId}`;
  }, [customNames.devices]);

  const getBlockName = useCallback((deviceId: string) => {
    return customNames.devices[deviceId] || `Block ${deviceId}`;
  }, [customNames.devices]);

  const getElevatorName = useCallback((elevatorId: string) => {
    const defaultName = `Elevator ${elevatorId.split('-')[1]}`;
    return customNames.elevators[elevatorId] || defaultName;
  }, [customNames.elevators]);
  
  const getFloorName = useCallback((floorId: string) => {
    return customNames.floors[floorId] || `Floor ${floorId}`;
  }, [customNames.floors]);

  const setDeviceName = useCallback((deviceId: string, name: string) => {
    setCustomNames(prev => {
        const newDevices = {...prev.devices};
        if(name) {
            newDevices[deviceId] = name;
        } else {
            delete newDevices[deviceId];
        }
        return { ...prev, devices: newDevices };
    });
  }, []);

  const setElevatorName = useCallback((elevatorId: string, name: string) => {
    setCustomNames(prev => {
        const newElevators = {...prev.elevators};
        if(name) {
            newElevators[elevatorId] = name;
        } else {
            delete newElevators[elevatorId];
        }
        return { ...prev, elevators: newElevators };
    });
  }, []);

  const setFloorName = useCallback((floorId: string, name: string) => {
    setCustomNames(prev => {
        const newFloors = {...prev.floors};
        if(name) {
            newFloors[floorId] = name;
        } else {
            delete newFloors[floorId];
        }
        return { ...prev, floors: newFloors };
    });
  }, []);
  
  const deleteDeviceName = useCallback((deviceId: string) => {
    setCustomNames(prev => {
        const newDevices = {...prev.devices};
        delete newDevices[deviceId];
        return {...prev, devices: newDevices};
    });
  }, []);

  const deleteElevatorName = useCallback((elevatorId: string) => {
    setCustomNames(prev => {
        const newElevators = {...prev.elevators};
        delete newElevators[elevatorId];
        return {...prev, elevators: newElevators};
    });
  }, []);

  const deleteFloorName = useCallback((floorId: string) => {
    setCustomNames(prev => {
        const newFloors = {...prev.floors};
        delete newFloors[floorId];
        return {...prev, floors: newFloors};
    });
  }, []);


  return {
    customNames,
    getDeviceName,
    getBlockName,
    getElevatorName,
    getFloorName,
    setDeviceName,
    setElevatorName,
    setFloorName,
    deleteDeviceName,
    deleteElevatorName,
    deleteFloorName,
  };
};
