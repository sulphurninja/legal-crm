'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { Loader2 } from 'lucide-react';

const publicPaths = ['/', '/login', '/register'];

export default function AuthWrapper({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [isAuthorized, setIsAuthorized] = useState(false);

  useEffect(() => {
    if (!loading) {
      const isPublicPath = publicPaths.includes(pathname);

      // If user is not logged in and trying to access protected route
      if (!user && !isPublicPath) {
        router.push(`/login?from=${encodeURIComponent(pathname)}`);
      }
      // If user is logged in and trying to access login/register
      else if (user && (pathname === '/login' || pathname === '/register')) {
        router.push('/dashboard');
      }
      else {
        setIsAuthorized(true);
      }
    }
  }, [user, loading, pathname, router]);

  if (loading || !isAuthorized) {
    return (
      <div className="flex h-screen w-full items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return <>{children}</>;
}
