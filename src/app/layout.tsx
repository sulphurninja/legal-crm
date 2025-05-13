import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { AuthProvider } from '@/contexts/AuthContext';
import DashboardHeader from '@/components/DashboardHeader';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'CRM | Lex Claim Connect',
  description: 'A system for managing leads efficiently',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <AuthProvider>
          {/* <DashboardHeader /> */}

          {children}
        </AuthProvider>
      </body>
    </html>
  );
}
