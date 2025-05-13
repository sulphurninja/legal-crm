import { Suspense } from 'react';
import { Loader2 } from 'lucide-react';

import DashboardLayout from '@/components/DashboardLayout';
import ClientLeads from '@/components/clientLeads';

export default function LeadsPage() {
  return (
      <Suspense
        fallback={
          <div className="flex h-screen w-full items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        }
      >
        <ClientLeads />
      </Suspense>
  );
}
