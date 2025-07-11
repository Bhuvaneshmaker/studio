
"use client";

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/auth-context';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { UserManagementCard } from '@/components/user-management-card';
import { Building, Users, Home } from 'lucide-react';
import { BackButton } from '@/components/back-button';

export default function UsersPage() {
  const { user } = useAuth();
  const router = useRouter();

  useEffect(() => {
    // Redirect if user is not an Admin
    if (user && user.role !== 'Admin') {
      router.push('/');
    }
  }, [user, router]);
  
  // Render nothing or a loading state while redirecting
  if (!user || user.role !== 'Admin') {
    return (
       <div className="min-h-screen flex items-center justify-center p-4 text-center">
            <p>Access Denied. Redirecting...</p>
        </div>
    );
  }

  return (
    <div className="min-h-screen">
       <header className="p-4 sm:p-6 border-b bg-card/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="container mx-auto flex items-center justify-between">
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
            <h2 className="text-lg sm:text-2xl font-semibold text-primary truncate flex items-center gap-2">
              <Users />
              User Management
            </h2>
          </div>
          <BackButton />
        </div>
      </header>
      <main className="container mx-auto p-4 sm:p-6 space-y-8">
        <UserManagementCard />
      </main>
      <footer className="container mx-auto p-4 sm:p-6 border-t mt-8">
        <p className="text-center text-sm text-muted-foreground">
          ElevateView &copy; {new Date().getFullYear()}. For support, contact <a href="mailto:support@bhuvitech.com" className="underline hover:text-primary">support@bhuvitech.com</a>.
        </p>
      </footer>
    </div>
  );
}
