
"use client";

import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import type { ElevatorData } from "@/types/elevator";
import { useNaming } from '@/hooks/use-naming';
import { Wrench, ShieldAlert, CheckCircle2, ArrowRight, Landmark, AlertTriangle, PlusCircle } from "lucide-react";
import { cn } from '@/lib/utils';
import { Alert, AlertDescription } from './ui/alert';
import { NUM_ELEVATORS_PER_BLOCK } from '@/lib/constants';
import { useState } from 'react';
import { AddElevatorForm } from './add-elevator-form';


export function BlockCard({ deviceId, elevators, onElevatorAdded }: { deviceId: string, elevators: ElevatorData[], onElevatorAdded: (newElevators: ElevatorData[]) => void }) {
  const { getDeviceName } = useNaming();
  const [isAddElevatorOpen, setIsAddElevatorOpen] = useState(false);
  const blockName = getDeviceName(deviceId);

  const maintenanceCount = elevators.filter(e => e.status === 'MAINTENANCE').length;
  const errorCount = elevators.filter(e => e.status === 'ERROR' || e.emergencyStop).length;
  const activeCount = elevators.length - maintenanceCount - errorCount;

  const hasFault = errorCount > 0;
  // A block might be "incomplete" if it was auto-discovered but has no elevators yet.
  const isIncomplete = elevators.length === 0 || elevators.some(e => e.id.endsWith('-placeholder'));
  
  const unitName = 'Elevators';

  return (
    <>
      <Card className={cn(
          "shadow-lg hover:shadow-xl hover:border-primary/50 transition-all duration-300 flex flex-col h-full",
          hasFault && "border-red-500/80 shadow-red-500/20",
          isIncomplete && "border-yellow-500/50"
        )}>
        <CardHeader className="p-4">
          <CardTitle className="truncate flex items-center gap-2">
            <Landmark className="w-6 h-6 text-muted-foreground" />
            {blockName}
          </CardTitle>
          <CardDescription>{isIncomplete ? 0 : elevators.length} / {NUM_ELEVATORS_PER_BLOCK} {unitName}</CardDescription>
        </CardHeader>
        <CardContent className="flex-grow p-4 pt-0 space-y-3">
          <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg text-sm">
            <div className="flex items-center gap-2 text-green-500">
              <CheckCircle2 className="w-5 h-5" />
              <span className="text-muted-foreground">Active</span>
            </div>
            <span className="font-bold">{activeCount}</span>
          </div>
          <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg text-sm">
            <div className="flex items-center gap-2 text-yellow-500">
              <Wrench className="w-5 h-5" />
              <span className="text-muted-foreground">Maintenance</span>
            </div>
            <span className="font-bold">{maintenanceCount}</span>
          </div>
          <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg text-sm">
            <div className="flex items-center gap-2 text-red-500">
              <ShieldAlert className="w-5 h-5" />
              <span className="text-muted-foreground">Faults</span>
            </div>
            <span className="font-bold">{errorCount}</span>
          </div>
          {isIncomplete && (
            <Alert variant="default" className="border-yellow-500/50 text-yellow-600 dark:text-yellow-500 text-xs mt-4 p-3">
              <AlertTriangle className="h-4 w-4 !text-yellow-500" />
              <AlertDescription>
                This block needs elevators configured.
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
        <CardFooter className="flex flex-col gap-2 p-4 pt-0">
          <Button asChild className="w-full" variant={hasFault ? 'destructive' : 'outline'} disabled={isIncomplete}>
            <Link href={`/elevators?device=${deviceId}`}>
              View Elevators <ArrowRight className="ml-2 w-4 h-4" />
            </Link>
          </Button>
          <AddElevatorForm
              open={isAddElevatorOpen}
              onOpenChange={setIsAddElevatorOpen}
              onElevatorAdded={onElevatorAdded}
              deviceId={deviceId}
              existingElevators={elevators.filter(e => !e.id.endsWith('-placeholder'))}
          >
             <Button 
              className="w-full" 
              variant="secondary" 
              disabled={elevators.length >= NUM_ELEVATORS_PER_BLOCK && !isIncomplete}
            >
              <PlusCircle className="mr-2 w-4 h-4" /> Add Elevator
            </Button>
          </AddElevatorForm>
        </CardFooter>
      </Card>
    </>
  );
}
