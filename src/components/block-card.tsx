
"use client";

import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import type { ElevatorData } from "@/types/elevator";
import { useNaming } from '@/hooks/use-naming';
import { Wrench, ShieldAlert, CheckCircle2, ArrowRight, Landmark } from "lucide-react";
import { cn } from '@/lib/utils';

export function BlockCard({ deviceId, elevators }: { deviceId: string, elevators: ElevatorData[] }) {
  const { getDeviceName } = useNaming();
  const blockName = getDeviceName(deviceId);

  const maintenanceCount = elevators.filter(e => e.status === 'MAINTENANCE').length;
  const errorCount = elevators.filter(e => e.status === 'ERROR' || e.emergencyStop).length;
  const activeCount = elevators.length - maintenanceCount - errorCount;

  const hasFault = errorCount > 0;
  
  const unitName = 'Elevators';

  return (
    <Card className={cn(
        "shadow-lg hover:shadow-xl hover:border-primary/50 transition-all duration-300 flex flex-col h-full",
        hasFault && "border-red-500/80 shadow-red-500/20"
      )}>
      <CardHeader className="p-4">
        <CardTitle className="truncate flex items-center gap-2">
          <Landmark className="w-6 h-6 text-muted-foreground" />
          {blockName}
        </CardTitle>
        <CardDescription>{elevators.length} {unitName}</CardDescription>
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
      </CardContent>
      <CardFooter className="p-4 pt-0">
        <Button asChild className="w-full" variant={hasFault ? 'destructive' : 'outline'}>
          <Link href={`/elevators?device=${deviceId}`}>
            View {unitName} <ArrowRight className="ml-2 w-4 h-4" />
          </Link>
        </Button>
      </CardFooter>
    </Card>
  );
}
