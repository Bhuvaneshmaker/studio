
import ElevatorDashboard from '@/components/elevator-dashboard';
import { Building } from 'lucide-react';
import Link from 'next/link';
import { AuthWidget } from '@/components/auth-widget';
import type { ElevatorData } from '@/types/elevator';

export const dynamic = 'force-dynamic';

async function getElevators(): Promise<ElevatorData[]> {
    // In a real app, you would have a base URL in an env var
    const res = await fetch('http://localhost:9002/api/elevators', { cache: 'no-store' });
    if (!res.ok) {
        // This will activate the closest `error.js` Error Boundary
        throw new Error('Failed to fetch data');
    }
    return res.json();
}

export default async function Home() {
  const elevators = await getElevators();

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
            <AuthWidget />
        </div>
      </header>
      <main className="container mx-auto p-4 sm:p-6 space-y-8">
        <ElevatorDashboard elevators={elevators} />
      </main>
      <footer className="container mx-auto p-4 sm:p-6 border-t mt-8">
        <p className="text-center text-sm text-muted-foreground">
          ElevateView &copy; {new Date().getFullYear()}. For support, contact <a href="mailto:support@bhuvitech.com" className="underline hover:text-primary">support@bhuvitech.com</a>.
        </p>
      </footer>
    </div>
  );
}
