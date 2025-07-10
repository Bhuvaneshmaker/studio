
"use client";

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/auth-context';
import type { ElevatorData } from '@/types/elevator';
import { useNaming } from '@/hooks/use-naming';
import { useToast } from "@/hooks/use-toast";
import { generateInitialElevators, updateElevatorState } from '@/lib/elevator-simulation';
import Link from 'next/link';
import { Building, Wrench, ShieldCheck, ListChecks } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from '@/components/ui/badge';
import { BackButton } from '@/components/back-button';

export default function MaintenancePage() {
  const [elevators, setElevators] = useState<ElevatorData[]>([]);
  const { getBlockName, getElevatorName } = useNaming();
  const { toast } = useToast();
  const notifiedErrors = useRef<Set<string>>(new Set());
  const [initialLoad, setInitialLoad] = useState(true);
  const { user } = useAuth();
  const router = useRouter();

  useEffect(() => {
    // Redirect if user is not an Admin
    if (user && user.role !== 'Admin') {
      router.push('/');
    }
  }, [user, router]);

  useEffect(() => {
    setElevators(generateInitialElevators());
    setInitialLoad(false);
  }, []);

  useEffect(() => {
    if (initialLoad || elevators.length === 0) return;

    const interval = setInterval(() => {
      const { updatedElevators, newAlerts } = updateElevatorState(elevators, notifiedErrors.current);
      setElevators(updatedElevators);
      
      newAlerts.forEach(alert => {
        if (!notifiedErrors.current.has(alert.id)) {
          toast({
            variant: "destructive",
            title: alert.title,
            description: alert.description,
          });
          notifiedErrors.current.add(alert.id);
        }
      });
    }, 2000);

    return () => clearInterval(interval);
  }, [elevators, toast, initialLoad]);

  const maintenanceElevators = elevators.filter(e => e.status === 'MAINTENANCE');

  if (!user || user.role !== 'Admin') {
    return (
       <div className="min-h-screen flex items-center justify-center">
            <p>Access Denied. Redirecting...</p>
        </div>
    );
  }

  return (
    <div className="min-h-screen">
      <header className="p-4 sm:p-6 border-b bg-card/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="container mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2 sm:gap-3 truncate">
            <Link href="/" className="flex items-center gap-2 sm:gap-3">
              <div className="bg-primary text-primary-foreground p-2 rounded-lg">
                <Building className="w-6 h-6" />
              </div>
              <h1 className="text-xl sm:text-3xl font-bold text-primary font-headline hidden sm:block">
                ElevateView
              </h1>
            </Link>
            <span className="text-xl sm:text-2xl text-muted-foreground">/</span>
            <h2 className="text-xl sm:text-2xl font-semibold text-primary truncate">
              Maintenance Day
            </h2>
          </div>
          <BackButton />
        </div>
      </header>
      <main className="container mx-auto p-4 sm:p-6 space-y-8">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Wrench className="w-6 h-6 text-yellow-500" />
              Elevators Under Maintenance
            </CardTitle>
            <CardDescription>
              The following elevators are currently offline for scheduled maintenance or repairs.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {maintenanceElevators.length > 0 ? (
              <div className="border rounded-lg">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Elevator</TableHead>
                      <TableHead>Block</TableHead>
                      <TableHead>Reason</TableHead>
                      <TableHead className="text-right">Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {maintenanceElevators.map(elevator => (
                      <TableRow key={elevator.id}>
                        <TableCell className="font-medium">{getElevatorName(elevator.id)}</TableCell>
                        <TableCell>{getBlockName(elevator.blockId)}</TableCell>
                        <TableCell className="text-muted-foreground">{elevator.maintenanceDetails || "No details provided."}</TableCell>
                        <TableCell className="text-right">
                          <Badge variant="secondary" className="bg-yellow-500/10 text-yellow-500 border-yellow-500/20">
                            <Wrench className="w-3 h-3 mr-1.5" />
                            In Progress
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center text-center gap-4 py-16 border-2 border-dashed rounded-lg">
                <ShieldCheck className="w-16 h-16 text-green-500" />
                <h3 className="text-2xl font-bold">All Systems Operational</h3>
                <p className="text-muted-foreground">
                  There are currently no elevators under maintenance.
                </p>
                <Button asChild>
                    <Link href="/elevators">
                        <ListChecks className="mr-2 h-4 w-4" />
                        View All Elevators
                    </Link>
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </main>
      <footer className="container mx-auto p-4 sm:p-6 border-t mt-8">
        <p className="text-center text-sm text-muted-foreground">
          ElevateView &copy; {new Date().getFullYear()}. For support, contact <a href="mailto:support@bhuvitech.com" className="underline">support@bhuvitech.com</a>.
        </p>
      </footer>
    </div>
  );
}
