
"use client";

import * as React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { PlusCircle, Landmark, Server, Network, Loader2, AlertCircle } from 'lucide-react';
import type { ElevatorData } from '@/types/elevator';
import { useNaming } from '@/hooks/use-naming';
import { Alert, AlertDescription, AlertTitle } from './ui/alert';

const addBlockSchema = z.object({
  deviceId: z.string().min(1, "Device ID is required."),
  deviceName: z.string().min(1, { message: "Block name is required." }),
  ipAddress: z.string().ip({ version: "v4", message: "Invalid IP address." }),
});

type AddBlockFormProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onBlockAdded: (newElevators: ElevatorData[]) => void;
  children: React.ReactNode;
};

async function configureDeviceOnBackend(action: 'set_device', payload: object) {
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
  const { setDeviceName } = useNaming();
  
  const form = useForm<z.infer<typeof addBlockSchema>>({
    resolver: zodResolver(addBlockSchema),
    defaultValues: {
      deviceId: "",
      deviceName: "",
      ipAddress: "",
    },
  });

  const onSubmit = async (values: z.infer<typeof addBlockSchema>) => {
    setIsSubmitting(true);
    setSubmissionStatus("Registering block in ElevateView...");
    form.clearErrors("root.serverError");

    try {
        // Step 1: Add device to the application state (now with no slaves initially)
        const appStateResponse = await fetch('/api/elevators', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({...values, slaves: []}), // Send empty slaves array
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
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <PlusCircle /> Add New Block
          </DialogTitle>
          <DialogDescription>
            Configure a new device controller (block). This will update both the app and the physical hardware. You can add elevators to this block later.
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
                    {isSubmitting ? 'Configuring...' : 'Create & Configure Block'}
                </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
