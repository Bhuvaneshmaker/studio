
"use client";

import * as React from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { PlusCircle, Landmark, Server, Network, Loader2, AlertCircle, SlidersHorizontal, Trash2, CaseSensitive, Hash, TextCursorInput } from 'lucide-react';
import type { ElevatorData } from '@/types/elevator';
import { useNaming } from '@/hooks/use-naming';
import { Alert, AlertDescription, AlertTitle } from './ui/alert';
import { Separator } from './ui/separator';

const slaveSchema = z.object({
  slaveId: z.string().min(1, "Slave ID is required."),
  slaveAddress: z.string().min(1, "Slave Address is required."),
  slaveName: z.string().optional(),
});

const addBlockSchema = z.object({
  deviceId: z.string().min(1, "Device ID is required."),
  deviceName: z.string().min(1, { message: "Block name is required." }),
  ipAddress: z.string().ip({ version: "v4", message: "Invalid IP address." }),
  slaves: z.array(slaveSchema).min(1, "At least one elevator (slave) is required."),
});

type AddBlockFormProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onBlockAdded: (newElevators: ElevatorData[]) => void;
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

export function AddBlockForm({ open, onOpenChange, onBlockAdded, children }: AddBlockFormProps) {
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [submissionStatus, setSubmissionStatus] = React.useState<string | null>(null);
  const { setDeviceName, setElevatorName } = useNaming();
  
  const form = useForm<z.infer<typeof addBlockSchema>>({
    resolver: zodResolver(addBlockSchema),
    defaultValues: {
      deviceId: "",
      deviceName: "",
      ipAddress: "",
      slaves: [{ slaveId: "1", slaveAddress: "0x01", slaveName: "" }],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "slaves",
  });

  const onSubmit = async (values: z.infer<typeof addBlockSchema>) => {
    setIsSubmitting(true);
    setSubmissionStatus("Registering block and elevators in ElevateView...");
    form.clearErrors("root.serverError");

    try {
        // Step 1: Add device to the application state
        const appStateResponse = await fetch('/api/elevators', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(values),
        });
        if (!appStateResponse.ok) {
            const result = await appStateResponse.json();
            throw new Error(result.error || "Failed to add block to application.");
        }
        const appStateResult = await appStateResponse.json();

        // Step 2: Configure the hardware via the backend
        setSubmissionStatus(`Configuring hardware for Block ${values.deviceId}...`);
        await configureDeviceOnBackend('set_device', {
            deviceId: values.deviceId,
            ipAddress: values.ipAddress
        });
        
        for (const [index, slave] of values.slaves.entries()) {
            setSubmissionStatus(`Configuring Slave ${slave.slaveId} on Block ${values.deviceId} (${index+1}/${values.slaves.length})...`);
             await configureDeviceOnBackend('set_slave', {
                deviceId: values.deviceId,
                slaveId: slave.slaveId,
                floorCount: "15" // Default floor count
            });
             if (slave.slaveName) {
                const newElevatorId = `${values.deviceId}-${slave.slaveId}`;
                setElevatorName(newElevatorId, slave.slaveName);
            }
        }
        
        // If all successful, update UI state
        setDeviceName(appStateResult.newDeviceId, values.deviceName);
        onBlockAdded(appStateResult.elevators);
        
        setSubmissionStatus("Configuration successful!");
        setTimeout(() => {
            onOpenChange(false);
            form.reset();
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
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <PlusCircle /> Add New Block
          </DialogTitle>
          <DialogDescription>
            Configure a new device controller (block) and its associated elevators. This will update both the app and the physical hardware.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 pt-4">
            <div className="space-y-6 p-1 max-h-[60vh] overflow-y-auto pr-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <FormField
                      control={form.control}
                      name="deviceId"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="flex items-center gap-2"><Server/> Device ID</FormLabel>
                          <FormControl>
                            <Input placeholder="e.g., A" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                     <FormField
                      control={form.control}
                      name="deviceName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="flex items-center gap-2"><Landmark/> Block Name</FormLabel>
                          <FormControl>
                            <Input placeholder="e.g., North Tower" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                        control={form.control}
                        name="ipAddress"
                        render={({ field }) => (
                            <FormItem>
                            <FormLabel className="flex items-center gap-2"><Network/> IP Address</FormLabel>
                            <FormControl>
                                <Input placeholder="e.g., 192.168.1.100" {...field} />
                            </FormControl>
                            <FormMessage />
                            </FormItem>
                        )}
                    />
                </div>
                <Separator />
                <div className="space-y-4">
                    <FormLabel className="flex items-center gap-2 text-base"><SlidersHorizontal/> Elevators (Slaves)</FormLabel>
                    {fields.map((field, index) => (
                        <div key={field.id} className="grid grid-cols-12 gap-x-4 gap-y-2 items-end p-3 border rounded-lg bg-muted/50 relative">
                            <div className="col-span-12 sm:col-span-2">
                                <FormField
                                control={form.control}
                                name={`slaves.${index}.slaveId`}
                                render={({ field }) => (
                                    <FormItem>
                                    <FormLabel className="flex items-center gap-1 text-xs"><Hash/> Slave ID</FormLabel>
                                    <FormControl>
                                        <Input placeholder="e.g., 1" {...field} />
                                    </FormControl>
                                    <FormMessage/>
                                    </FormItem>
                                )}
                                />
                            </div>
                            <div className="col-span-12 sm:col-span-4">
                                 <FormField
                                control={form.control}
                                name={`slaves.${index}.slaveAddress`}
                                render={({ field }) => (
                                    <FormItem>
                                    <FormLabel className="flex items-center gap-1 text-xs"><CaseSensitive /> Slave Address</FormLabel>
                                    <FormControl>
                                        <Input placeholder="e.g., 0x01" {...field} />
                                    </FormControl>
                                     <FormMessage/>
                                    </FormItem>
                                )}
                                />
                            </div>
                            <div className="col-span-12 sm:col-span-6">
                                <FormField
                                control={form.control}
                                name={`slaves.${index}.slaveName`}
                                render={({ field }) => (
                                    <FormItem>
                                    <FormLabel className="flex items-center gap-1 text-xs"><TextCursorInput/> Custom Name (Optional)</FormLabel>
                                    <FormControl>
                                        <Input placeholder="e.g., Lobby Elevator" {...field} />
                                    </FormControl>
                                     <FormMessage/>
                                    </FormItem>
                                )}
                                />
                            </div>
                            {fields.length > 1 && (
                                <Button
                                    type="button"
                                    variant="ghost"
                                    size="icon"
                                    className="absolute top-1 right-1 h-6 w-6 text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                                    onClick={() => remove(index)}
                                >
                                    <Trash2 className="w-4 h-4" />
                                </Button>
                            )}
                        </div>
                    ))}
                    <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => append({ slaveId: (fields.length + 1).toString(), slaveAddress: `0x0${fields.length + 1}`, slaveName: '' })}
                        >
                        <PlusCircle className="mr-2 h-4 w-4" />
                        Add Another Elevator
                    </Button>
                     {form.formState.errors.slaves?.message && (
                        <p className="text-sm font-medium text-destructive">{form.formState.errors.slaves.message}</p>
                     )}
                </div>
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
                    {isSubmitting ? 'Configuring...' : 'Create & Configure Block'}
                </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
