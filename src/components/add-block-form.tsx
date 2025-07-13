
"use client";

import * as React from 'react';
import { useForm, useFieldArray, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { PlusCircle, Landmark, SlidersHorizontal, Server, Network, Hash, TextCursorInput } from 'lucide-react';
import type { ElevatorData } from '@/types/elevator';
import { useNaming } from '@/hooks/use-naming';
import { ScrollArea } from './ui/scroll-area';
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
  numSlaves: z.coerce.number().int().min(1, { message: "Must have at least one elevator." }).max(20, { message: "Cannot exceed 20 elevators per block." }),
  slaves: z.array(slaveSchema),
});

type AddBlockFormProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onBlockAdded: (newElevators: ElevatorData[]) => void;
  children: React.ReactNode;
};

export function AddBlockForm({ open, onOpenChange, onBlockAdded, children }: AddBlockFormProps) {
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const { setDeviceName, setElevatorName } = useNaming();
  
  const form = useForm<z.infer<typeof addBlockSchema>>({
    resolver: zodResolver(addBlockSchema),
    defaultValues: {
      deviceId: "",
      deviceName: "",
      ipAddress: "",
      numSlaves: 1,
      slaves: [{ slaveId: "1", slaveAddress: "1", slaveName: "" }],
    },
  });

  const { fields, replace } = useFieldArray({
    control: form.control,
    name: "slaves"
  });

  const numSlaves = form.watch("numSlaves");

  React.useEffect(() => {
    const newSlaves = Array.from({ length: numSlaves || 0 }, (_, i) => ({
      slaveId: (i + 1).toString(),
      slaveAddress: (i + 1).toString(),
      slaveName: "",
    }));
    replace(newSlaves);
  }, [numSlaves, replace]);


  const onSubmit = async (values: z.infer<typeof addBlockSchema>) => {
    setIsSubmitting(true);
    try {
        const response = await fetch('/api/elevators', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(values),
        });
        if (response.ok) {
            const result = await response.json();
            setDeviceName(result.newDeviceId, values.deviceName);
            values.slaves.forEach(slave => {
                if (slave.slaveName) {
                    const compositeId = `${result.newDeviceId}-${slave.slaveId}`;
                    setElevatorName(compositeId, slave.slaveName);
                }
            });
            onBlockAdded(result.elevators);
            onOpenChange(false);
            form.reset();
        } else {
            const result = await response.json();
            console.error("Failed to add block:", result.error);
            form.setError("root.serverError", { type: "manual", message: result.error || "An unknown error occurred." });
        }
    } catch (error) {
        console.error("Error submitting form", error);
        form.setError("root.serverError", { type: "manual", message: "Could not connect to the server." });
    } finally {
        setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      {children}
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <PlusCircle /> Add New Elevator
          </DialogTitle>
          <DialogDescription>
            Configure a new device (block) and its associated slaves (elevators).
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <ScrollArea className="h-[60vh] p-1 pr-4">
                <div className="space-y-6 p-2">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                       <FormField
                          control={form.control}
                          name="deviceId"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="flex items-center gap-2"><Server/> Device ID</FormLabel>
                              <FormControl>
                                <Input placeholder="e.g., 101" {...field} />
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
                    </div>
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
                    <FormField
                      control={form.control}
                      name="numSlaves"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="flex items-center gap-2"><SlidersHorizontal/> Number of Elevators</FormLabel>
                          <FormControl>
                            <Input type="number" {...field} min={1} max={20} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <Separator />

                    <h4 className="text-lg font-medium">Elevator (Slave) Configuration</h4>

                    {fields.map((field, index) => (
                         <div key={field.id} className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 border rounded-lg relative">
                            <p className="absolute -top-2 left-2 px-1 bg-background text-sm font-medium text-muted-foreground">Elevator {index + 1}</p>
                            <FormField
                                control={form.control}
                                name={`slaves.${index}.slaveId`}
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
                                name={`slaves.${index}.slaveAddress`}
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel className="flex items-center gap-2 text-sm"><TextCursorInput /> Slave Address</FormLabel>
                                        <FormControl>
                                            <Input placeholder="e.g., 1" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name={`slaves.${index}.slaveName`}
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
                    ))}
                </div>
            </ScrollArea>
             {form.formState.errors.root?.serverError && (
                <p className="text-sm font-medium text-destructive">{form.formState.errors.root.serverError.message}</p>
             )}
             <DialogFooter className="pt-4">
                <DialogClose asChild>
                    <Button type="button" variant="secondary" disabled={isSubmitting}>Cancel</Button>
                </DialogClose>
                 <Button type="submit" disabled={isSubmitting}>
                    <PlusCircle className="mr-2 h-4 w-4" />
                    {isSubmitting ? 'Creating...' : 'Create Elevator'}
                </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
