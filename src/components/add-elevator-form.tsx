
"use client";

import * as React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { PlusCircle, SlidersHorizontal, Hash, TextCursorInput, Loader2, AlertCircle, CaseSensitive, ListTree } from 'lucide-react';
import type { ElevatorData } from '@/types/elevator';
import { useNaming } from '@/hooks/use-naming';
import { Alert, AlertDescription, AlertTitle } from './ui/alert';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

const addElevatorSchema = z.object({
  deviceId: z.string().min(1, "You must select a block."),
  slaveId: z.string().min(1, "Slave ID is required."),
  slaveAddress: z.string().min(1, "Slave Address is required."),
  floorCount: z.string().min(1, "Number of floors is required."),
  slaveName: z.string().optional(),
});

type AddElevatorFormProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onElevatorAdded: (newElevators: ElevatorData[]) => void;
  children: React.ReactNode;
  preselectedBlock?: string;
  allDeviceIds?: string[];
};

async function configureDeviceOnBackend(action: 'set_slave', payload: object) {
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

export function AddElevatorForm({ open, onOpenChange, onElevatorAdded, children, preselectedBlock, allDeviceIds }: AddElevatorFormProps) {
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [submissionStatus, setSubmissionStatus] = React.useState<string | null>(null);
  const { setElevatorName, getDeviceName } = useNaming();
  const [deviceIds, setDeviceIds] = React.useState<string[]>(allDeviceIds || []);

  const form = useForm<z.infer<typeof addElevatorSchema>>({
    resolver: zodResolver(addElevatorSchema),
    defaultValues: {
      deviceId: preselectedBlock || "",
      slaveId: "",
      slaveAddress: "",
      floorCount: "15",
      slaveName: "",
    },
  });

  React.useEffect(() => {
    if (preselectedBlock) {
      form.setValue('deviceId', preselectedBlock);
    }
  }, [preselectedBlock, form]);

  React.useEffect(() => {
    // Fetch device IDs if they weren't passed as a prop
    async function fetchDeviceIds() {
        if (!allDeviceIds) {
            const res = await fetch('/api/elevators');
            const data: ElevatorData[] = await res.json();
            const uniqueDeviceIds = [...new Set(data.map(e => e.deviceId))];
            setDeviceIds(uniqueDeviceIds);
        }
    }
    if (open) {
      fetchDeviceIds();
    }
  }, [open, allDeviceIds]);


  const onSubmit = async (values: z.infer<typeof addElevatorSchema>) => {
    setIsSubmitting(true);
    setSubmissionStatus("Registering elevator in ElevateView...");
    form.clearErrors("root.serverError");

    try {
        // Step 1: Add elevator to the application state
        const appStateResponse = await fetch('/api/elevators/add-single', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(values),
        });
        if (!appStateResponse.ok) {
            const result = await appStateResponse.json();
            throw new Error(result.error || "Failed to add elevator to application.");
        }
        const appStateResult = await appStateResponse.json();

        // Step 2: Configure the hardware slave via the backend
        setSubmissionStatus(`Configuring hardware for Elevator ${values.slaveId} on Block ${values.deviceId}...`);
        await configureDeviceOnBackend('set_slave', {
            deviceId: values.deviceId,
            slaveId: values.slaveId,
            floorCount: values.floorCount
        });
        
        // If all successful, update UI state
        if (values.slaveName) {
            setElevatorName(appStateResult.newElevatorId, values.slaveName);
        }
        onElevatorAdded(appStateResult.elevators);
        
        setSubmissionStatus("Configuration successful!");
        setTimeout(() => {
            onOpenChange(false);
            form.reset({ deviceId: preselectedBlock || "", slaveId: "", slaveName: "", slaveAddress: "", floorCount: "15" });
            setSubmissionStatus(null);
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
    <Dialog open={open} onOpenChange={onOpenChange}>
      {children}
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <SlidersHorizontal /> Add New Elevator
          </DialogTitle>
          <DialogDescription>
            Add a new slave (elevator) to an existing block. This will configure the hardware.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 pt-4">
             <div className="space-y-6 p-1">
                 <FormField
                  control={form.control}
                  name="deviceId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Parent Block</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value} disabled={!!preselectedBlock}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select a block to add to" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {deviceIds.map(id => (
                            <SelectItem key={id} value={id}>{getDeviceName(id)}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                 <div className="grid grid-cols-2 gap-4">
                    <FormField
                        control={form.control}
                        name="slaveId"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel className="flex items-center gap-2 text-sm"><Hash /> Slave ID</FormLabel>
                                <FormControl>
                                    <Input placeholder="e.g., 1" {...field} />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                     <FormField
                        control={form.control}
                        name="slaveAddress"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel className="flex items-center gap-2 text-sm"><CaseSensitive /> Slave Address</FormLabel>
                                <FormControl>
                                    <Input placeholder="e.g., 0x01" {...field} />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                </div>
                 <FormField
                    control={form.control}
                    name="floorCount"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel className="flex items-center gap-2 text-sm"><ListTree /> Number of Floors</FormLabel>
                            <FormControl>
                                <Input type="number" placeholder="e.g., 15" {...field} />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />
                <FormField
                    control={form.control}
                    name="slaveName"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel className="flex items-center gap-2 text-sm"><TextCursorInput /> Elevator Name (Optional)</FormLabel>
                            <FormControl>
                                <Input placeholder="e.g., Lobby Elevator" {...field} />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />
             </div>
             {form.formState.errors.root?.serverError && (
                 <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertTitle>Configuration Error</AlertTitle>
                    <AlertDescription>{form.formState.errors.root.serverError.message}</AlertDescription>
                </Alert>
             )}
             {isSubmitting && submissionStatus && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground p-2 bg-muted rounded-lg">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <p>{submissionStatus}</p>
                </div>
             )}
             <DialogFooter className="pt-4">
                <DialogClose asChild>
                    <Button type="button" variant="secondary" disabled={isSubmitting}>Cancel</Button>
                </DialogClose>
                 <Button type="submit" disabled={isSubmitting}>
                    {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <PlusCircle className="mr-2 h-4 w-4" />}
                    {isSubmitting ? 'Configuring...' : 'Add & Configure Elevator'}
                </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
