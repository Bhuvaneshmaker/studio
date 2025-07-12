
"use client";

import * as React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { PlusCircle, Server, SlidersHorizontal } from 'lucide-react';
import type { ElevatorData } from '@/types/elevator';
import { useNaming } from '@/hooks/use-naming';

const addDeviceSchema = z.object({
  deviceName: z.string().min(1, { message: "Device name is required." }),
  numSlaves: z.coerce.number().int().min(1, { message: "Must have at least one slave." }).max(20, { message: "Cannot exceed 20 slaves per device." }),
});

type AddDeviceFormProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onDeviceAdded: (newElevators: ElevatorData[]) => void;
  children: React.ReactNode;
};

export function AddDeviceForm({ open, onOpenChange, onDeviceAdded, children }: AddDeviceFormProps) {
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const { setDeviceName } = useNaming();
  const form = useForm<z.infer<typeof addDeviceSchema>>({
    resolver: zodResolver(addDeviceSchema),
    defaultValues: {
      deviceName: "",
      numSlaves: 5,
    },
  });

  const onSubmit = async (values: z.infer<typeof addDeviceSchema>) => {
    setIsSubmitting(true);
    try {
        const response = await fetch('/api/elevators', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(values),
        });
        if (response.ok) {
            const result = await response.json();
            // Set the name in local storage right away
            setDeviceName(result.newDeviceId, values.deviceName);
            onDeviceAdded(result.elevators);
            onOpenChange(false);
            form.reset();
        } else {
            // Handle error
            console.error("Failed to add device");
        }
    } catch (error) {
        console.error("Error submitting form", error);
    } finally {
        setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      {children}
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <PlusCircle /> Add New Device (Teensy)
          </DialogTitle>
          <DialogDescription>
            Configure a new device and specify how many slaves (elevators) it controls.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="deviceName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="flex items-center gap-2"><Server/> Device Name</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g., North Tower Controller" {...field} />
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
                  <FormLabel className="flex items-center gap-2"><SlidersHorizontal/> Number of Slaves (Elevators)</FormLabel>
                  <FormControl>
                    <Input type="number" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
             <DialogFooter>
                <DialogClose asChild>
                    <Button type="button" variant="secondary" disabled={isSubmitting}>Cancel</Button>
                </DialogClose>
                 <Button type="submit" disabled={isSubmitting}>
                    <PlusCircle className="mr-2 h-4 w-4" />
                    {isSubmitting ? 'Creating...' : 'Create Device'}
                </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
