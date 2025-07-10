
"use client";

import ElevatorDashboard from '@/components/elevator-dashboard';
import { Building, Pencil, Wrench, Landmark, SlidersHorizontal, Users, LogOut } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/context/auth-context';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

export default function Home() {
  const { user, logout } = useAuth();

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
            <div className="flex items-center gap-4">
              <nav className="hidden sm:flex items-center gap-2">
                  <Button asChild variant="outline" size="sm" className="shrink-0">
                      <Link href="/blocks"><Landmark className="w-4 h-4 mr-2"/>View Blocks</Link>
                  </Button>
                  <Button asChild variant="outline" size="sm" className="shrink-0">
                      <Link href="/elevators"><SlidersHorizontal className="w-4 h-4 mr-2"/>View Elevators</Link>
                  </Button>
                  <Button asChild variant="ghost" size="icon" className="shrink-0">
                      <Link href="/naming" aria-label="Manage Naming">
                          <Pencil className="w-5 h-5"/>
                      </Link>
                  </Button>
                  {user?.role === 'Admin' && (
                    <>
                      <Button asChild variant="ghost" size="icon" className="shrink-0">
                          <Link href="/maintenance" aria-label="View Maintenance">
                              <Wrench className="w-5 h-5"/>
                          </Link>
                      </Button>
                      <Button asChild variant="ghost" size="icon" className="shrink-0">
                          <Link href="/users" aria-label="Manage Users">
                              <Users className="w-5 h-5"/>
                          </Link>
                      </Button>
                    </>
                  )}
              </nav>
               <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="relative h-10 w-10 rounded-full">
                    <Avatar>
                      <AvatarFallback>{user?.email?.[0].toUpperCase()}</AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-56" align="end" forceMount>
                  <DropdownMenuLabel className="font-normal">
                    <div className="flex flex-col space-y-1">
                      <p className="text-sm font-medium leading-none">{user?.email}</p>
                      <p className="text-xs leading-none text-muted-foreground">{user?.role}</p>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={logout}>
                    <LogOut className="mr-2 h-4 w-4" />
                    <span>Log out</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
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
