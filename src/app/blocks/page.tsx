
import Link from 'next/link';
import { Building, PlusCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { BlockCard } from '@/components/block-card';
import { AddBlockFormWrapper } from '@/components/add-block-form-wrapper';
import { BackButton } from '@/components/back-button';
import { getElevatorData } from '@/services/elevator-service';
import type { ElevatorData } from '@/types/elevator';

export const dynamic = 'force-dynamic';

export default async function BlocksPage() {
  const elevators = await getElevatorData();

  const elevatorsByBlock = elevators.reduce((acc, elevator) => {
    const blockId = elevator.blockId;
    if (!acc[blockId]) {
      acc[blockId] = [];
    }
    acc[blockId].push(elevator);
    return acc;
  }, {} as Record<string, ElevatorData[]>);

  return (
    <div className="min-h-screen">
      <header className="p-4 sm:p-6 border-b bg-card/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="container mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2 sm:gap-3 truncate">
            <Link href="/" className="flex items-center gap-2 sm:gap-3">
              <div className="bg-primary text-primary-foreground p-2 rounded-lg">
                <Building className="w-6 h-6" />
              </div>
              <h1 className="text-xl sm:text-3xl font-bold text-primary font-headline hidden sm:block">
                ElevateView
              </h1>
            </Link>
            <span className="text-xl sm:text-2xl text-muted-foreground">/</span>
            <h2 className="text-xl sm:text-2xl font-semibold text-primary truncate">
              Blocks
            </h2>
          </div>
          <BackButton />
        </div>
      </header>
      <main className="container mx-auto p-4 sm:p-6 space-y-8">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {Object.entries(elevatorsByBlock).map(([blockId, blockElevators]) => (
            <BlockCard key={blockId} blockId={blockId} elevators={blockElevators} />
          ))}
          <AddBlockFormWrapper>
            <div 
              className="border-2 border-dashed border-muted-foreground/50 rounded-lg flex flex-col items-center justify-center text-center p-6 hover:bg-muted/50 hover:border-primary/50 transition-all duration-300 cursor-pointer h-full min-h-[250px]"
              >
                <PlusCircle className="w-12 h-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-bold">Add New Block</h3>
                <p className="text-sm text-muted-foreground">Click to configure a new block and its elevators.</p>
              </div>
          </AddBlockFormWrapper>
        </div>
      </main>
      <footer className="container mx-auto p-4 sm:p-6 border-t mt-8">
        <p className="text-center text-sm text-muted-foreground">
          ElevateView &copy; {new Date().getFullYear()}. For support, contact <a href="mailto:support@bhuvitech.com" className="underline">support@bhuvitech.com</a>.
        </p>
      </footer>
    </div>
  );
}
