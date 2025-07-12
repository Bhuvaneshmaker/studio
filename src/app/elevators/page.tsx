
"use client";

import { useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { ElevatorGrid } from '@/components/elevator-grid';
import { Building, Search, X, Landmark } from 'lucide-react';
import Link from 'next/link';
import { Input } from '@/components/ui/input';
import { useNaming } from '@/hooks/use-naming';
import { BackButton } from '@/components/back-button';
import { useAuth } from '@/context/auth-context';

export default function ElevatorsPage() {
  const searchParams = useSearchParams();
  const deviceFilter = searchParams.get('device');
  const [searchQuery, setSearchQuery] = useState("");
  const { getDeviceName } = useNaming();
  const { user } = useAuth();

  const pageTitle = deviceFilter 
    ? getDeviceName(deviceFilter)
    : (user?.role === 'Admin' ? 'All Slaves' : 'All Elevators');
  
  const blocksPageTitle = user?.role === 'Admin' ? 'Devices' : 'Blocks';

  return (
    <div className="min-h-screen">
      <header className="p-4 sm:p-6 border-b bg-card/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="container mx-auto flex items-center justify-between gap-4">
          <div className="flex items-center gap-2 sm:gap-3 truncate">
            <Link href="/" className="flex items-center gap-2 sm:gap-3">
              <div className="bg-primary text-primary-foreground p-2 rounded-lg">
                <Building className="w-5 h-5 sm:w-6 sm:h-6" />
              </div>
              <h1 className="text-xl sm:text-3xl font-bold text-primary font-headline hidden sm:block">
                ElevateView
              </h1>
            </Link>
            <span className="text-xl sm:text-2xl text-muted-foreground">/</span>
            <Link href="/blocks" className="text-lg sm:text-2xl font-semibold text-foreground hover:underline truncate flex items-center gap-2">
                <Landmark className="w-5 h-5" /> {blocksPageTitle}
            </Link>
            <span className="text-xl sm:text-2xl text-muted-foreground">/</span>
            <h2 className="text-lg sm:text-2xl font-semibold text-primary truncate">
              {pageTitle}
            </h2>
          </div>
          <BackButton />
        </div>
      </header>
      <main className="container mx-auto p-4 sm:p-6 space-y-8">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
           {deviceFilter && (
                <div className="flex items-center gap-2">
                    <Link href="/elevators" className="text-sm inline-flex items-center justify-center whitespace-nowrap rounded-md font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 border border-input bg-background hover:bg-accent hover:text-accent-foreground h-9 px-3">
                        <X className="mr-2 h-4 w-4" />
                        Clear filter
                    </Link>
                </div>
            )}
            <div className="relative w-full sm:w-auto sm:ml-auto">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                <Input 
                    placeholder="Search by name or ID..." 
                    className="pl-10 w-full sm:w-64"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                />
            </div>
        </div>
        <ElevatorGrid searchQuery={searchQuery} deviceFilter={deviceFilter} />
      </main>
      <footer className="container mx-auto p-4 sm:p-6 border-t mt-8">
        <p className="text-center text-sm text-muted-foreground">
          ElevateView &copy; {new Date().getFullYear()}. For support, contact <a href="mailto:support@bhuvitech.com" className="underline hover:text-primary">support@bhuvitech.com</a>.
        </p>
      </footer>
    </div>
  );
}
