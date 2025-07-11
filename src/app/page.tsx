import ElevatorDashboard from '@/components/elevator-dashboard';
import { Building, Pencil, Wrench, Users, LogOut } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { AuthWidget } from '@/components/auth-widget';
import { getElevatorData } from '@/services/elevator-service';

export const dynamic = 'force-dynamic';

export default async function Home() {
  const elevators = await getElevatorData();

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
            <AuthWidget />
        </div>
      </header>
      <main className="container mx-auto p-4 sm:p-6 space-y-8">
        <ElevatorDashboard elevators={elevators} />
      </main>
      <footer className="container mx-auto p-4 sm:p-6 border-t mt-8">
        <p className="text-center text-sm text-muted-foreground">
          ElevateView &copy; {new Date().getFullYear()}. For support, contact <a href="mailto:support@bhuvitech.com" className="underline">support@bhuvitech.com</a>.
        </p>
      </footer>
    </div>
  );
}
