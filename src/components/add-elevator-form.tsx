
"use client";

import * as React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { PlusCircle, Loader2, AlertCircle, SlidersHorizontal, Hash, TextCursorInput } from 'lucide-react';
import type { ElevatorData } from '@/types/elevator';
import { useNaming } from '@/hooks/use-naming';
import { Alert, AlertDescription, AlertTitle } from './ui/alert';
import { MAX_FLOORS } from '@/lib/constants';

const addElevatorSchema = z.object({
  slaveId: z.string().min(1, "Slave ID is required."),
  slaveName: z.string().optional(),
});

type AddElevatorFormProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onElevatorAdded: (newElevators: ElevatorData[]) => void;
  deviceId: string;
  existingElevators: ElevatorData[];
  children: React.ReactNode;
};

async function configureDeviceOnBackend(action: string, payload: object) {
    const response = await fetch('/api/configure-device', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, payload }),
    });
    const result = await response.json();
    if (!response.ok) {
        throw new Error(result.error || 'Failed to configure device on backend.');
    }
    return result;
}

export function AddElevatorForm({ open, onOpenChange, onElevatorAdded, deviceId, existingElevators, children }: AddElevatorFormProps) {
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [submissionStatus, setSubmissionStatus] = React.useState<string | null>(null);
  const { getDeviceName, setElevatorName } = useNaming();

  const getNextAvailableSlaveId = () => {
    const existingIds = new Set(existingElevators.map(e => e.elevatorNum));
    for (let i = 1; i <= 10; i++) {
        if (!existingIds.has(i)) {
            return i.toString();
        }
    }
    return (existingElevators.length + 1).toString();
  };
  
  const form = useForm<z.infer<typeof addElevatorSchema>>({
    resolver: zodResolver(addElevatorSchema),
    defaultValues: {
      slaveId: getNextAvailableSlaveId(),
      slaveName: "",
    },
  });

  React.useEffect(() => {
    if(open) {
        form.reset({
            slaveId: getNextAvailableSlaveId(),
            slaveName: ""
        });
        setSubmissionStatus(null);
    }
  }, [open, existingElevators]);

  const handleOpenChange = (newOpenState: boolean) => {
    if (!isSubmitting) {
        onOpenChange(newOpenState);
    }
  }

  const onSubmit = async (values: z.infer<typeof addElevatorSchema>) => {
    setIsSubmitting(true);
    setSubmissionStatus("Configuring new elevator on hardware...");
    form.clearErrors("root.serverError");

    const existingIds = new Set(existingElevators.map(e => e.elevatorNum));
    if (existingIds.has(parseInt(values.slaveId, 10))) {
        form.setError("slaveId", { type: "manual", message: "This Slave ID is already in use for this block." });
        setIsSubmitting(false);
        setSubmissionStatus(null);
        return;
    }

    try {
        // Step 1: Configure the hardware
        await configureDeviceOnBackend('set_slave', {
            deviceId,
            slaveId: values.slaveId,
            floorCount: MAX_FLOORS
        });
        
        setSubmissionStatus("Updating application state...");
        
        // Step 2: Add elevator to the application state
        const appStateResponse = await fetch('/api/add-elevator', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ deviceId, slaveId: values.slaveId }),
        });
        if (!appStateResponse.ok) {
            const result = await appStateResponse.json();
            throw new Error(result.error || "Failed to add elevator to application.");
        }
        const appStateResult = await appStateResponse.json();
        
        // Step 3: Set custom name if provided
        if (values.slaveName) {
            const newElevatorId = `${deviceId}-${values.slaveId}`;
            setElevatorName(newElevatorId, values.slaveName);
        }
        
        // If all successful, update UI state
        onElevatorAdded(appStateResult.elevators);
        
        setSubmissionStatus("Configuration successful!");
        setTimeout(() => {
            handleOpenChange(false);
        }, 1500);

    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : "An unknown error occurred.";
        console.error("Error submitting form", error);
        form.setError("root.serverError", { type: "manual", message: errorMessage });
        setSubmissionStatus(null);
    } finally {
        setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      {children}
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <PlusCircle /> Add Elevator to {getDeviceName(deviceId)}
          </DialogTitle>
          <DialogDescription>
            Configure a new elevator (slave) for this block.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 pt-4">
            <div className="grid grid-cols-1 gap-4">
                <FormField
                    control={form.control}
                    name="slaveId"
                    render={({ field }) => (
                        <FormItem>
                        <FormLabel className="flex items-center gap-1"><Hash/> Slave ID</FormLabel>
                        <FormControl>
                            <Input placeholder="e.g., 3" {...field} />
                        </FormControl>
                        <FormMessage/>
                        </FormItem>
                    )}
                />
                <FormField
                    control={form.control}
                    name="slaveName"
                    render={({ field }) => (
                        <FormItem>
                        <FormLabel className="flex items-center gap-1"><TextCursorInput/> Custom Name (Optional)</FormLabel>
                        <FormControl>
                            <Input placeholder="e.g., Service Elevator" {...field} />
                        </FormControl>
                            <FormMessage/>
                        </FormItem>
                    )}
                />
            </div>

             {form.formState.errors.root?.serverError && (
                 <Alert variant="destructive" className="mt-4">
                    <AlertCircle className="h-4 w-4" />
                    <AlertTitle>Configuration Error</AlertTitle>
                    <AlertDescription>{form.formState.errors.root.serverError.message}</AlertDescription>
                </Alert>
             )}
             {isSubmitting && submissionStatus && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground p-2 bg-muted rounded-lg mt-4">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <p>{submissionStatus}</p>
                </div>
             )}
             <DialogFooter className="pt-4 border-t">
                <DialogClose asChild>
                    <Button type="button" variant="secondary" disabled={isSubmitting}>Cancel</Button>
                </DialogClose>
                 <Button type="submit" disabled={isSubmitting}>
                    {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <PlusCircle className="mr-2 h-4 w-4" />}
                    {isSubmitting ? 'Configuring...' : 'Add & Configure'}
                </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
