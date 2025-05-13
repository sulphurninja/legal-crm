'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
// import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';

export default function Home() {
  // const { user, loading } = useAuth();
  const router = useRouter();

  // useEffect(() => {
  //   if (!loading && user) {
  //     router.push('/dashboard');
  //   }
  // }, [user, loading, router]);

  // if (loading) {
  //   return (
  //     <div className="flex h-screen w-full items-center justify-center">
  //       <Loader2 className="h-8 w-8 animate-spin text-primary" />
  //     </div>
  //   );
  // }

  return (
    <div className="flex min-h-screen flex-col">
      {/* <header className="border-b">
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          <div className="text-lg font-bold">Lead Management System</div>
          <div className="flex items-center gap-4">
            <Link href="/login">
              <Button variant="outline">Log In</Button>
            </Link>
            <Link href="/register">
              <Button>Register</Button>
            </Link>
          </div>
        </div>
      </header> */}

      <main className="flex-1">
        <section className="py-20 md:py-32">
          <div className="container mx-auto px-4 text-center">
            <h1 className="text-4xl font-bold tracking-tight sm:text-5xl md:text-6xl">
              Streamline Your Lead Management
            </h1>
            <p className="mt-6 max-w-3xl mx-auto text-lg text-muted-foreground">
              A comprehensive platform for tracking, managing, and converting leads.
              Monitor lead statuses, track history, and improve your workflow.
            </p>
            <div className="mt-10 flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/login">
                <Button size="lg">Get Started</Button>
              </Link>
              {/* <Link href="/register">
                <Button size="lg" variant="outline">Create Account</Button>
              </Link> */}
            </div>
          </div>
        </section>

        {/* <section className="py-16 bg-muted">
          <div className="container mx-auto px-4">
            <h2 className="text-3xl font-bold text-center">Key Features</h2>
            <div className="mt-12 grid gap-8 md:grid-cols-3">
              <div className="bg-background p-6 rounded-lg shadow-sm">
                <h3 className="text-xl font-semibold mb-3">Streamlined Lead Tracking</h3>
                <p className="text-muted-foreground">
                  Easily track lead status changes and monitor their progress through your pipeline.
                </p>
              </div>
              <div className="bg-background p-6 rounded-lg shadow-sm">
                <h3 className="text-xl font-semibold mb-3">Comprehensive History</h3>
                <p className="text-muted-foreground">
                  View detailed history of all lead interactions and status updates with timestamps.
                </p>
              </div>
          <div className="bg-background p-6 rounded-lg shadow-sm">
                <h3 className="text-xl font-semibold mb-3">Role-Based Access</h3>
                <p className="text-muted-foreground">
                  Secure permissions ensure only authorized users can update lead statuses and access sensitive information.
                </p>
              </div>
            </div>
          </div>
        </section>

        <section className="py-16">
          <div className="container mx-auto px-4 text-center">
            <h2 className="text-3xl font-bold">Ready to get started?</h2>
            <p className="mt-4 text-lg text-muted-foreground max-w-2xl mx-auto">
              Join our platform today and experience a more efficient way to manage your leads and improve your conversion rates.
            </p>
            <div className="mt-8">
              <Link href="/register">
                <Button size="lg">Create Your Account</Button>
              </Link>
            </div>
          </div>
        </section> */}
      </main>

      <footer className="border-t py-8">
        <div className="container mx-auto px-4 text-center text-sm text-muted-foreground">
          <p>© {new Date().getFullYear()} Lead Management System. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
