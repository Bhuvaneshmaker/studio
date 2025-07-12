
"use client";

import { useState, useEffect, useCallback } from 'react';
import type { User, UserRole } from '@/types/user';

const USERS_STORAGE_KEY = 'elevateview-users';

const defaultUsers: User[] = [
    { id: '1', username: 'admin', email: 'admin@example.com', role: 'Admin' },
    { id: '2', username: 'user', email: 'user@example.com', role: 'User' },
];

const loadUsersFromStorage = (): User[] => {
  if (typeof window === 'undefined') {
    return defaultUsers;
  }
  try {
    const storedUsers = window.localStorage.getItem(USERS_STORAGE_KEY);
    if (storedUsers) {
      return JSON.parse(storedUsers);
    }
  } catch (error) {
    console.error("Failed to parse users from localStorage", error);
  }
  // If nothing in storage, set the default users
  window.localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(defaultUsers));
  return defaultUsers;
};


export const useUsers = () => {
  const [users, setUsers] = useState<User[]>(loadUsersFromStorage);
  
  useEffect(() => {
    try {
        const serializedUsers = JSON.stringify(users);
        window.localStorage.setItem(USERS_STORAGE_KEY, serializedUsers);
    } catch (error) {
        console.error("Failed to save users to localStorage", error);
    }
  }, [users]);
  
  useEffect(() => {
    const handleStorageChange = (event: StorageEvent) => {
      if (event.key === USERS_STORAGE_KEY && event.newValue) {
        try {
          setUsers(JSON.parse(event.newValue));
        } catch (error) {
            console.error("Failed to parse storage update for users", error);
        }
      }
    };
    
    window.addEventListener('storage', handleStorageChange);
    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };
  }, []);

  const addUser = useCallback((username: string, email: string, role: UserRole) => {
    setUsers(prev => {
        const newUser: User = {
            id: new Date().getTime().toString(), // simple unique id
            username,
            email,
            role,
        };
        return [...prev, newUser];
    });
  }, []);
  
  const deleteUser = useCallback((userId: string) => {
    setUsers(prev => prev.filter(user => user.id !== userId));
  }, []);

  return {
    users,
    addUser,
    deleteUser,
  };
};
