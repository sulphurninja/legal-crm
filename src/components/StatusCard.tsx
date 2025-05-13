'use client';

import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { LeadStatus } from '@/types';
import { ChevronRight } from 'lucide-react';

interface StatusCardProps {
  status: LeadStatus;
  count: number;
  isAdmin: boolean;
  onViewLeads: () => void;
}

const getStatusColor = (status: LeadStatus): string => {
  const colorMap: Record<LeadStatus, string> = {
    PENDING: 'bg-yellow-100 text-yellow-800',
    REJECTED: 'bg-red-100 text-red-800',
    VERIFIED: 'bg-green-100 text-green-800',
    REJECTED_BY_CLIENT: 'bg-orange-100 text-orange-800',
    PAID: 'bg-blue-100 text-blue-800',
    DUPLICATE: 'bg-purple-100 text-purple-800',
    NOT_RESPONDING: 'bg-gray-100 text-gray-800',
    FELONY: 'bg-red-100 text-red-800',
    DEAD_LEAD: 'bg-gray-100 text-gray-800',
    WORKING: 'bg-blue-100 text-blue-800',
    CALL_BACK: 'bg-cyan-100 text-cyan-800',
    ATTEMPT_1: 'bg-indigo-100 text-indigo-800',
    ATTEMPT_2: 'bg-indigo-100 text-indigo-800',
    ATTEMPT_3: 'bg-indigo-100 text-indigo-800',
    ATTEMPT_4: 'bg-indigo-100 text-indigo-800',
    CHARGEBACK: 'bg-red-100 text-red-800',
    WAITING_ID: 'bg-yellow-100 text-yellow-800',
    SENT_CLIENT: 'bg-green-100 text-green-800',
    QC: 'bg-teal-100 text-teal-800',
    ID_VERIFIED: 'bg-green-100 text-green-800'
  };

  return colorMap[status] || 'bg-gray-100 text-gray-800';
};

export default function StatusCard({ status, count, isAdmin, onViewLeads }: StatusCardProps) {
  const statusColor = getStatusColor(status);

  return (
    <Card className="overflow-hidden">
      <CardContent className="p-0">
        <div className="p-6">
          <div className="flex justify-between items-center mb-2">
            <span className={`text-xs font-medium px-2.5 py-0.5 rounded-full ${statusColor}`}>
              {status.replace(/_/g, ' ')}
            </span>
            <span className="text-2xl font-bold">{count}</span>
          </div>
          <Button
            variant="ghost"
            size="sm"
            className="w-full flex justify-between items-center"
            onClick={onViewLeads}
          >
            View Leads
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
