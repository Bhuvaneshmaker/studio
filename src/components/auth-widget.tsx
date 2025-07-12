
"use client";

import { useAuth } from '@/context/auth-context';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { Pencil, Wrench, Users, LogOut, AreaChart, GitCommitHorizontal } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Avatar, AvatarFallback } from '@/components/ui/avatar';


export function AuthWidget() {
    const { user, logout } = useAuth();

    if (!user) {
        return null;
    }
    
    const getInitials = (name: string, fallback: string) => {
      if (!name) return fallback[0]?.toUpperCase() || '?';
      const parts = name.split(' ').map(part => part[0]).slice(0, 2);
      return parts.join('').toUpperCase();
    }

    return (
        <div className="flex items-center gap-4">
            <nav className="hidden sm:flex items-center gap-2">
                <Button asChild variant="ghost" size="icon" className="shrink-0">
                    <Link href="/analytics" aria-label="View Analytics">
                        <AreaChart className="w-5 h-5"/>
                    </Link>
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
                    <AvatarFallback>{getInitials(user.username, user.email)}</AvatarFallback>
                </Avatar>
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56" align="end" forceMount>
                <DropdownMenuLabel className="font-normal">
                <div className="flex flex-col space-y-1">
                    <p className="text-sm font-medium leading-none truncate">{user.username}</p>
                    <p className="text-xs leading-none text-muted-foreground">{user.role}</p>
                </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                 <DropdownMenuItem asChild>
                    <Link href="/parser">
                        <GitCommitHorizontal className="mr-2 h-4 w-4" />
                        <span>Data Frame Parser</span>
                    </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={logout}>
                <LogOut className="mr-2 h-4 w-4" />
                <span>Log out</span>
                </DropdownMenuItem>
            </DropdownMenuContent>
            </DropdownMenu>
        </div>
    )
}
