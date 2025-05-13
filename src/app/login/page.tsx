import { Suspense } from 'react';
import { Loader2 } from 'lucide-react';
import LoginClient from '@/components/loginClient';


export const metadata = { title: 'Login – LexClaim Connect' }; // optional

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="flex h-screen w-full items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    }>
      <LoginClient />
    </Suspense>
  );
}
