import ElevatorDashboard from '@/components/elevator-dashboard';
import { Building } from 'lucide-react';

export default function Home() {
  return (
    <div className="min-h-screen">
      <header className="p-4 sm:p-6 border-b bg-card/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="container mx-auto flex items-center gap-3">
          <div className="bg-primary text-primary-foreground p-2 rounded-lg">
            <Building className="w-6 h-6" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-primary font-headline">
            ElevateView
          </h1>
        </div>
      </header>
      <main className="container mx-auto p-4 sm:p-6 space-y-8">
        <ElevatorDashboard />
      </main>
      <footer className="container mx-auto p-4 sm:p-6 border-t mt-8">
        <p className="text-center text-sm text-muted-foreground">
          ElevateView &copy; {new Date().getFullYear()}. Real-time data is simulated.
        </p>
      </footer>
    </div>
  );
}
