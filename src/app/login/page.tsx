'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle
} from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import {
  Loader2,
  LogIn,
  Mail,
  Lock,
  AlertCircle,
  ChevronRight,
  Info
} from 'lucide-react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loginError, setLoginError] = useState<string | null>(null);
  const { login, loading, error, user } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectTo = searchParams.get('from') || '/dashboard';
  const [showRedirectInfo, setShowRedirectInfo] = useState(!!searchParams.get('from'));

  // If user is already logged in, redirect to dashboard
  useEffect(() => {
    if (user) {
      console.log('User already logged in, redirecting to dashboard');
      router.push(redirectTo);
    }
  }, [user, router, redirectTo]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError(null);

    try {
      console.log('Attempting login with email:', email);
      await login(email, password);

      // Direct hard navigation which bypasses client-side routing
      // This ensures a full page reload and re-evaluation of middleware
      window.location.href = redirectTo;
    } catch (err: any) {
      console.error('Login failed:', err);
      setLoginError(err.message || 'Failed to login. Please try again.');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-slate-100 dark:from-slate-950 dark:to-slate-900 flex flex-col items-center justify-center p-4">
      <div className="absolute top-8 left-8">
        <Button
          variant="ghost"
          size="sm"
          className="text-muted-foreground"
          onClick={() => window.history.back()}
        >
          Back
        </Button>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md mb-8"
      >
        {/* Logo */}
        <div className="flex justify-center mb-8">
          <div className=" flex items-center justify-center">
            {/* <LogIn className="h-6 w-6 text-primary-foreground" />
             */}
             <img src='/logo.png'className='h-24' />
          </div>
        </div>

        <Card className="border-none shadow-lg">
          <CardHeader className="space-y-1 pb-6">
            <CardTitle className="text-2xl font-bold text-center">Welcome back</CardTitle>
            <CardDescription className="text-center pt-1">
              Sign in to your account to continue
            </CardDescription>
          </CardHeader>

          {showRedirectInfo && (
            <div className="px-6 pb-4">
              <Alert variant="default" className="bg-blue-50 dark:bg-blue-950/30 text-blue-700 dark:text-blue-400 border-blue-200 dark:border-blue-900/50">
                <Info className="h-4 w-4" />
                <AlertDescription>
                  Please log in to continue to your requested page.
                </AlertDescription>
              </Alert>
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <CardContent className="space-y-4">
              {(loginError || error) && (
                <Alert variant="destructive" className="bg-red-50 dark:bg-red-950/30 border-red-200 dark:border-red-900/50">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    {loginError || error}
                  </AlertDescription>
                </Alert>
              )}

              <div className="space-y-2">
                <Label htmlFor="email" className="text-sm font-medium">
                  Email address
                </Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="name@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="pl-10"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="password" className="text-sm font-medium">
                    Password
                  </Label>
                  <Link
                    href="/forgot-password"
                    className="text-xs text-primary hover:underline"
                  >
                    Forgot password?
                  </Link>
                </div>
                <div className="relative">
                  <Lock className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="pl-10"
                    required
                  />
                </div>
              </div>
            </CardContent>

            <CardFooter className="flex flex-col space-y-4 pt-2">
              <Button
                type="submit"
                className="w-full"
                size="lg"
                disabled={loading}
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Signing In...
                  </>
                ) : (
                  <>
                    Sign In
                    <ChevronRight className="ml-1 h-4 w-4" />
                  </>
                )}
              </Button>

              <Separator className="my-1" />
{/*
              <div className="text-center text-sm">
                <span className="text-muted-foreground">Don&apos;t have an account?</span>{' '}
                <Link
                  href="/register"
                  className="font-medium text-primary hover:underline"
                >
                  Sign up
                </Link>
              </div> */}
            </CardFooter>
          </form>
        </Card>
      </motion.div>

      <div className="text-center text-sm text-muted-foreground">
        <p>© {new Date().getFullYear()} LexClaim Connect. All rights reserved.</p>
      </div>
    </div>
  );
}
