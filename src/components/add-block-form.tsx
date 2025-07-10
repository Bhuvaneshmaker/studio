
"use client";

import * as React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { PlusCircle, Router, SlidersHorizontal } from 'lucide-react';

const addBlockSchema = z.object({
  blockName: z.string().min(1, { message: "Block name is required." }),
  numElevators: z.coerce.number().int().min(1, { message: "Must have at least one elevator." }).max(20, { message: "Cannot exceed 20 elevators per block." }),
});

type AddBlockFormProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAddBlock: (blockName: string, numElevators: number) => void;
  children: React.ReactNode;
};

export function AddBlockForm({ open, onOpenChange, onAddBlock, children }: AddBlockFormProps) {
  const form = useForm<z.infer<typeof addBlockSchema>>({
    resolver: zodResolver(addBlockSchema),
    defaultValues: {
      blockName: "",
      numElevators: 5,
    },
  });

  const onSubmit = (data: z.infer<typeof addBlockSchema>) => {
    onAddBlock(data.blockName, data.numElevators);
    onOpenChange(false);
    form.reset();
  };
  
  // We need to use a portal for the dialog, but the trigger can be the children.
  // We also need to control the open state from the parent.
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <div onClick={() => onOpenChange(true)}>{children}</div>
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
                  <FormLabel className="flex items-center gap-2"><Router/> Block Name</FormLabel>
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
                    <Button type="button" variant="secondary">Cancel</Button>
                </DialogClose>
                <Button type="submit">
                  <PlusCircle className="mr-2 h-4 w-4" />
                  Create Block
                </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
