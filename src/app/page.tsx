
"use client";

import type { ElevatorData } from '@/types/elevator';
import { Building, PlusCircle } from 'lucide-react';
import Link from 'next/link';
import { AuthWidget } from '@/components/auth-widget';
import ElevatorDashboard from '@/components/elevator-dashboard';
import { AddBlockFormWrapper } from '@/components/add-block-form-wrapper';
import { Button } from '@/components/ui/button';
import { useEffect, useState } from 'react';

export default function Home() {
  const [elevators, setElevators] = useState<ElevatorData[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    try {
      const res = await fetch('/api/elevators', { cache: 'no-store' });
      if (res.ok) {
        const data = await res.json();
        setElevators(data);
      }
    } catch (error) {
        console.error("Failed to fetch elevator data:", error);
        // Optionally, set an error state to show in the UI
    } finally {
        if (loading) {
            setLoading(false);
        }
    }
  };

  useEffect(() => {
    fetchData(); // Initial fetch
    
    const interval = setInterval(fetchData, 1000); // Poll for updates every 1 second
    return () => clearInterval(interval); // Cleanup interval on component unmount
  }, []);
  
  const handleBlockAdded = (newElevators: ElevatorData[]) => {
    setElevators(newElevators);
  };

  return (
    <div className="min-h-screen">
      <header className="p-4 sm:p-6 border-b bg-card/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="container mx-auto flex items-center justify-between">
            <div className='flex items-center gap-2 sm:gap-3'>
                <Link href="/" className="flex items-center gap-2 sm:gap-3">
                    <div className="bg-primary text-primary-foreground p-2 rounded-lg">
                        <Building className="w-5 h-5 sm:w-6 sm:h-6" />
                    </div>
                    <h1 className="text-xl sm:text-3xl font-bold text-primary font-headline">
                        ElevateView
                    </h1>
                </Link>
            </div>
            <div className="flex items-center gap-2">
              <AddBlockFormWrapper onBlockAdded={handleBlockAdded}>
                 <Button size="sm">
                    <PlusCircle className="mr-2 h-4 w-4" />
                    Add New Block
                  </Button>
              </AddBlockFormWrapper>
              <AuthWidget />
            </div>
        </div>
      </header>
      <main className="container mx-auto p-4 sm:p-6 space-y-8">
        <ElevatorDashboard elevators={elevators} loading={loading} />
      </main>
      <footer className="container mx-auto p-4 sm:p-6 border-t mt-8">
        <p className="text-center text-sm text-muted-foreground">
          ElevateView &copy; {new Date().getFullYear()}. For support, contact <a href="mailto:support@bhuvitech.com" className="underline hover:text-primary">support@bhuvitech.com</a>.
        </p>
      </footer>
    </div>
  );
}
