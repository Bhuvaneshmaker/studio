
"use client";

import { useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { ElevatorGrid } from '@/components/elevator-grid';
import { Building, Search, X, Landmark } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { Input } from '@/components/ui/input';
import { useNaming } from '@/hooks/use-naming';
import { BackButton } from '@/components/back-button';

export default function ElevatorsPage() {
  const searchParams = useSearchParams();
  const blockFilter = searchParams.get('block');
  const [searchQuery, setSearchQuery] = useState("");
  const { getBlockName } = useNaming();

  const pageTitle = blockFilter 
    ? getBlockName(blockFilter)
    : 'All Elevators';

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
            <Link href="/blocks" className="text-xl sm:text-2xl font-semibold text-foreground hover:underline truncate">
                Blocks
            </Link>
            <span className="text-xl sm:text-2xl text-muted-foreground">/</span>
            <h2 className="text-xl sm:text-2xl font-semibold text-primary truncate">
              {pageTitle}
            </h2>
          </div>
          <BackButton />
        </div>
      </header>
      <main className="container mx-auto p-4 sm:p-6 space-y-8">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
           {blockFilter && (
                <div className="flex items-center gap-2">
                    <Button asChild variant="secondary">
                        <Link href="/elevators">
                            <X className="mr-2 h-4 w-4" />
                            Clear block filter
                        </Link>
                    </Button>
                </div>
            )}
            <div className="relative w-full sm:w-auto sm:ml-auto">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                <Input 
                    placeholder="Search by name, ID, or floor..." 
                    className="pl-10 w-full sm:w-64 max-w-sm"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                />
            </div>
        </div>
        <ElevatorGrid searchQuery={searchQuery} blockFilter={blockFilter} />
      </main>
      <footer className="container mx-auto p-4 sm:p-6 border-t mt-8">
        <p className="text-center text-sm text-muted-foreground">
          ElevateView &copy; {new Date().getFullYear()}. Real-time data is simulated.
        </p>
      </footer>
    </div>
  );
}
