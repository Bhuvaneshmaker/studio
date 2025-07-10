
import SlaveDashboard from '@/components/slave-dashboard';
import { Building, Pencil, Wrench, Router, SlidersHorizontal } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

export default function Home() {
  return (
    <div className="min-h-screen">
      <header className="p-4 sm:p-6 border-b bg-card/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="container mx-auto flex items-center justify-between">
            <div className='flex items-center gap-3'>
                <div className="bg-primary text-primary-foreground p-2 rounded-lg">
                    <Building className="w-6 h-6" />
                </div>
                <h1 className="text-2xl sm:text-3xl font-bold text-primary font-headline">
                    ElevateView
                </h1>
            </div>
            <nav className="flex items-center gap-2">
                <Button asChild variant="outline" size="sm" className="shrink-0">
                    <Link href="/devices"><Router className="w-4 h-4 mr-2"/>View Devices</Link>
                </Button>
                <Button asChild variant="outline" size="sm" className="shrink-0">
                    <Link href="/slaves"><SlidersHorizontal className="w-4 h-4 mr-2"/>View Slaves</Link>
                </Button>
                 <Button asChild variant="ghost" size="icon" className="shrink-0">
                    <Link href="/maintenance" aria-label="View Maintenance">
                        <Wrench className="w-5 h-5"/>
                    </Link>
                </Button>
                 <Button asChild variant="ghost" size="icon" className="shrink-0">
                    <Link href="/naming" aria-label="Manage Naming">
                        <Pencil className="w-5 h-5"/>
                    </Link>
                </Button>
            </nav>
        </div>
      </header>
      <main className="container mx-auto p-4 sm:p-6 space-y-8">
        <SlaveDashboard />
      </main>
      <footer className="container mx-auto p-4 sm:p-6 border-t mt-8">
        <p className="text-center text-sm text-muted-foreground">
          ElevateView &copy; {new Date().getFullYear()}. Real-time data is simulated.
        </p>
      </footer>
    </div>
  );
}
