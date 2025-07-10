
"use client";

import { useState, useEffect, useCallback } from 'react';
import type { CustomNames } from '@/types/naming';

const NAMING_STORAGE_KEY = 'elevateview-custom-names';

const defaultNames: CustomNames = {
  blocks: {},
  elevators: {},
};

// This function needs to be defined outside the hook to be accessible in the initial state.
const loadNamesFromStorage = (): CustomNames => {
  if (typeof window === 'undefined') {
    return defaultNames;
  }
  try {
    const storedNames = window.localStorage.getItem(NAMING_STORAGE_KEY);
    if (storedNames) {
      return JSON.parse(storedNames);
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
          setCustomNames(JSON.parse(event.newValue));
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

  const getBlockName = useCallback((blockId: string) => {
    return customNames.blocks[blockId] || `Block ${blockId}`;
  }, [customNames.blocks]);

  const getElevatorName = useCallback((elevatorId: string) => {
    return customNames.elevators[elevatorId] || `Elevator ${elevatorId}`;
  }, [customNames.elevators]);

  const setBlockName = useCallback((blockId: string, name: string) => {
    setCustomNames(prev => {
        const newBlocks = {...prev.blocks};
        if(name) {
            newBlocks[blockId] = name;
        } else {
            delete newBlocks[blockId];
        }
        return { ...prev, blocks: newBlocks };
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
  
  const deleteBlockName = useCallback((blockId: string) => {
    setCustomNames(prev => {
        const newBlocks = {...prev.blocks};
        delete newBlocks[blockId];
        return {...prev, blocks: newBlocks};
    });
  }, []);

  const deleteElevatorName = useCallback((elevatorId: string) => {
    setCustomNames(prev => {
        const newElevators = {...prev.elevators};
        delete newElevators[elevatorId];
        return {...prev, elevators: newElevators};
    });
  }, []);

  return {
    customNames,
    getBlockName,
    getElevatorName,
    setBlockName,
    setElevatorName,
    deleteBlockName,
    deleteElevatorName
  };
};
