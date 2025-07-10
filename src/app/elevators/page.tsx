import { ElevatorGrid } from '@/components/elevator-grid';
import { Building } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

export default function ElevatorsPage() {
  return (
    <div className="min-h-screen">
      <header className="p-4 sm:p-6 border-b bg-card/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="container mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/" className="flex items-center gap-3">
              <div className="bg-primary text-primary-foreground p-2 rounded-lg">
                <Building className="w-6 h-6" />
              </div>
              <h1 className="text-2xl sm:text-3xl font-bold text-primary font-headline">
                ElevateView
              </h1>
            </Link>
            <span className="text-2xl text-muted-foreground">/</span>
            <h2 className="text-2xl font-semibold text-foreground">
              All Elevators
            </h2>
          </div>
          <Button asChild variant="outline">
            <Link href="/">Back to Dashboard</Link>
          </Button>
        </div>
      </header>
      <main className="container mx-auto p-4 sm:p-6 space-y-8">
        <ElevatorGrid />
      </main>
      <footer className="container mx-auto p-4 sm:p-6 border-t mt-8">
        <p className="text-center text-sm text-muted-foreground">
          ElevateView &copy; {new Date().getFullYear()}. Real-time data is simulated.
        </p>
      </footer>
    </div>
  );
}
