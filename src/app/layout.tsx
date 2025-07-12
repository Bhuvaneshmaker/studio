
"use client";

import './globals.css';
import { Toaster } from "@/components/ui/toaster";
import { AuthProvider } from '@/context/auth-context';
import { useState, useEffect } from 'react';
import type { ElevatorData } from '@/types/elevator';
import { useNaming } from '@/hooks/use-naming';
import { AlertDialog, AlertDialogContent, AlertDialogHeader, AlertDialogTitle, AlertDialogDescription, AlertDialogFooter, AlertDialogAction } from '@/components/ui/alert-dialog';
import { TriangleAlert } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';

/*
const EmergencyStopAlert = ({ elevators, isOpen, onAcknowledge }: { elevators: ElevatorData[], isOpen: boolean, onAcknowledge: () => void }) => {
    const { getDeviceName, getElevatorName } = useNaming();

    return (
        <AlertDialog open={isOpen}>
            <AlertDialogContent className="max-w-md">
                <AlertDialogHeader>
                    <AlertDialogTitle className="flex items-center gap-2 text-red-500">
                        <TriangleAlert className="w-8 h-8" />
                        Emergency Stop Activated!
                    </AlertDialogTitle>
                    <AlertDialogDescription className="pt-2 text-left">
                        The emergency stop system has been activated for the following elevators. The units are offline until the situation is resolved by an administrator.
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <ScrollArea className="h-48 my-4 border bg-muted/50 rounded-lg p-2">
                    <div className="space-y-2">
                        {elevators.map(e => (
                             <div key={e.id} className="p-2 border-b">
                                <p className="font-bold">{getElevatorName(e.id)}</p>
                                <p className="text-sm text-muted-foreground">{getDeviceName(e.deviceId)}</p>
                             </div>
                        ))}
                    </div>
                </ScrollArea>
                <AlertDialogFooter>
                    <AlertDialogAction onClick={onAcknowledge} className="bg-primary hover:bg-primary/90">
                        Acknowledge
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    );
};
*/


export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // const [elevators, setElevators] = useState<ElevatorData[]>([]);
  // const [isAlertOpen, setIsAlertOpen] = useState(false);

  // const emergencyStopElevators = elevators.filter(e => e.emergencyStop);

  // useEffect(() => {
  //   const fetchData = async () => {
  //     // This fetch should only happen on the client side
  //     if (typeof window !== 'undefined') {
  //       const res = await fetch('/api/elevators', { cache: 'no-store' });
  //       if (res.ok) {
  //         const data = await res.json();
  //         setElevators(data);
  //         // If there are E-Stops, show the alert.
  //         if (data.some((e: ElevatorData) => e.emergencyStop)) {
  //           setIsAlertOpen(true);
  //         }
  //       }
  //     }
  //   };
    
  //   fetchData();
  //   const interval = setInterval(fetchData, 3000); // Poll for E-Stop status
  //   return () => clearInterval(interval);
  // }, []);

  return (
    <html lang="en" className="dark">
      <head>
        <title>ElevateView</title>
        <meta name="description" content="Real-time Elevator Management System" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet" />
      </head>
      <body className="font-body antialiased">
        <AuthProvider>
          {children}
          <Toaster />
          {/* <EmergencyStopAlert 
            elevators={emergencyStopElevators} 
            isOpen={isAlertOpen && emergencyStopElevators.length > 0} 
            onAcknowledge={() => setIsAlertOpen(false)}
          /> */}
        </AuthProvider>
      </body>
    </html>
  );
}
