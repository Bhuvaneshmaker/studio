
"use client";

import * as React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { PlusCircle, Landmark, SlidersHorizontal } from 'lucide-react';
import type { ElevatorData } from '@/types/elevator';
import { useNaming } from '@/hooks/use-naming';

const addBlockSchema = z.object({
  blockName: z.string().min(1, { message: "Block name is required." }),
  numElevators: z.coerce.number().int().min(1, { message: "Must have at least one elevator." }).max(20, { message: "Cannot exceed 20 elevators per block." }),
});

type AddBlockFormProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onBlockAdded: (newElevators: ElevatorData[]) => void;
  children: React.ReactNode;
};

export function AddBlockForm({ open, onOpenChange, onBlockAdded, children }: AddBlockFormProps) {
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const { setDeviceName } = useNaming();
  const form = useForm<z.infer<typeof addBlockSchema>>({
    resolver: zodResolver(addBlockSchema),
    defaultValues: {
      blockName: "",
      numElevators: 5,
    },
  });

  const onSubmit = async (values: z.infer<typeof addBlockSchema>) => {
    setIsSubmitting(true);
    try {
        const response = await fetch('/api/elevators', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ deviceName: values.blockName, numSlaves: values.numElevators }),
        });
        if (response.ok) {
            const result = await response.json();
            // Set the name in local storage right away
            setDeviceName(result.newDeviceId, values.blockName);
            onBlockAdded(result.elevators);
            onOpenChange(false);
            form.reset();
        } else {
            // Handle error
            console.error("Failed to add block");
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
            <PlusCircle /> Add New Block
          </DialogTitle>
          <DialogDescription>
            Configure a new building block and specify how many elevators it contains.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="blockName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="flex items-center gap-2"><Landmark/> Block Name</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g., North Tower, Research Wing" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="numElevators"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="flex items-center gap-2"><SlidersHorizontal/> Number of Elevators</FormLabel>
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
                    {isSubmitting ? 'Creating...' : 'Create Block'}
                </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
