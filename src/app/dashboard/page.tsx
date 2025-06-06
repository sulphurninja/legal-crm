'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import axios from 'axios';
import DashboardLayout from '@/components/DashboardLayout';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { HoverCard, HoverCardContent, HoverCardTrigger } from '@/components/ui/hover-card';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  AlertCircle,
  Clock,
  FileText,
  RefreshCw,
  Plus,
  Users,
  CheckCircle,
  XCircle,
  DollarSign,
  AlertTriangle,
  PhoneOff,
  PhoneCall,
  Copy,
  ShieldAlert,
  TimerOff,
  FastForward,
  Timer,
  Clock1,
  Clock2,
  Clock3,
  Clock4,
  CreditCard,
  FileQuestion,
  ArrowUpRight,
  Search,
  BadgeCheck,
  ChevronRight,
  Loader2,
  DollarSignIcon
} from 'lucide-react';
import { format } from 'date-fns';
import { LeadStatus } from '@/types';
import { motion } from "framer-motion";

// All possible lead statuses
const ALL_STATUSES: LeadStatus[] = [
  "PENDING", "REJECTED", "VERIFIED", "REJECTED_BY_CLIENT", "PAID",
  "DUPLICATE", "NOT_RESPONDING", "FELONY", "DEAD_LEAD", "WORKING",
  "CALL_BACK", "ATTEMPT_1", "ATTEMPT_2", "ATTEMPT_3", "ATTEMPT_4",
  "CHARGEBACK", "WAITING_ID", "SENT_CLIENT", "QC", "ID_VERIFIED", "CAMPING_PAUSED", "SENT_TO_LAW_FIRM"
];

// Status icons and colors
const STATUS_CONFIG: Record<string, { icon: React.ReactNode, color: string, bgColor: string, description: string }> = {
  PENDING: {
    icon: <Clock className="h-5 w-5" />,
    color: '#9C6500',
    bgColor: '#FEF3C7',
    description: 'Leads awaiting initial review'
  },
  REJECTED: {
    icon: <XCircle className="h-5 w-5" />,
    color: '#B91C1C',
    bgColor: '#FEE2E2',
    description: 'Leads that didn\'t meet requirements'
  },
  VERIFIED: {
    icon: <CheckCircle className="h-5 w-5" />,
    color: '#166534',
    bgColor: '#DCFCE7',
    description: 'Leads that have been verified'
  },
  REJECTED_BY_CLIENT: {
    icon: <AlertTriangle className="h-5 w-5" />,
    color: '#C2410C',
    bgColor: '#FFEDD5',
    description: 'Leads rejected by the client'
  },
  PAID: {
    icon: <DollarSign className="h-5 w-5" />,
    color: '#0369A1',
    bgColor: '#E0F2FE',
    description: 'Leads that have been paid'
  },
  DUPLICATE: {
    icon: <Copy className="h-5 w-5" />,
    color: '#7E22CE',
    bgColor: '#F3E8FF',
    description: 'Duplicate lead entries'
  },
  NOT_RESPONDING: {
    icon: <PhoneOff className="h-5 w-5" />,
    color: '#525252',
    bgColor: '#E5E5E5',
    description: 'Leads not responding to contact attempts'
  },
  FELONY: {
    icon: <ShieldAlert className="h-5 w-5" />,
    color: '#991B1B',
    bgColor: '#FEE2E2',
    description: 'Leads with felony issues'
  },
  DEAD_LEAD: {
    icon: <TimerOff className="h-5 w-5" />,
    color: '#1F2937',
    bgColor: '#E5E7EB',
    description: 'Leads that are no longer viable'
  },
  WORKING: {
    icon: <FastForward className="h-5 w-5" />,
    color: '#0E7490',
    bgColor: '#CFFAFE',
    description: 'Leads currently being worked on'
  },
  CALL_BACK: {
    icon: <PhoneCall className="h-5 w-5" />,
    color: '#16A34A',
    bgColor: '#DCFCE7',
    description: 'Leads scheduled for callback'
  },
  ATTEMPT_1: {
    icon: <Clock1 className="h-5 w-5" />,
    color: '#1D4ED8',
    bgColor: '#DBEAFE',
    description: 'First contact attempt'
  },
  ATTEMPT_2: {
    icon: <Clock2 className="h-5 w-5" />,
    color: '#1E40AF',
    bgColor: '#DBEAFE',
    description: 'Second contact attempt'
  },
  ATTEMPT_3: {
    icon: <Clock3 className="h-5 w-5" />,
    color: '#1E3A8A',
    bgColor: '#DBEAFE',
    description: 'Third contact attempt'
  },
  ATTEMPT_4: {
    icon: <Clock4 className="h-5 w-5" />,
    color: '#172554',
    bgColor: '#DBEAFE',
    description: 'Fourth contact attempt'
  },
  CHARGEBACK: {
    icon: <CreditCard className="h-5 w-5" />,
    color: '#9F1239',
    bgColor: '#FFE4E6',
    description: 'Leads with payment chargebacks'
  },
  WAITING_ID: {
    icon: <FileQuestion className="h-5 w-5" />,
    color: '#854D0E',
    bgColor: '#FEF3C7',
    description: 'Leads waiting for ID verification'
  },
  SENT_CLIENT: {
    icon: <ArrowUpRight className="h-5 w-5" />,
    color: '#065F46',
    bgColor: '#D1FAE5',
    description: 'Leads sent to client'
  },
  QC: {
    icon: <Search className="h-5 w-5" />,
    color: '#6B21A8',
    bgColor: '#F3E8FF',
    description: 'Leads in quality control'
  },
  ID_VERIFIED: {
    icon: <BadgeCheck className="h-5 w-5" />,
    color: '#15803D',
    bgColor: '#DCFCE7',
    description: 'Leads with verified ID'
  },
  BILLABLE: {
    icon: <DollarSignIcon className="h-5 w-5" />,
    color: '#15803D',
    bgColor: '#DCFCE7',
    description: 'Billable'
  },
  CAMPAIGN_PAUSED: {
    icon: <DollarSignIcon className="h-5 w-5" />,
    color: '#15803D',
    bgColor: '#DCFCE7',
    description: 'Campaign Paused'
  },
   SENT_TO_LAW_FIRM: {
    icon: <DollarSignIcon className="h-5 w-5" />,
    color: '#15803D',
    bgColor: '#DCFCE7',
    description: 'Sent To Law Firm'
  }
};

interface StatusCount {
  _id: LeadStatus;
  count: number;
}

interface RecentActivity {
  _id: string;
  firstName: string;
  lastName: string;
  statusHistory: {
    fromStatus: string;
    toStatus: string;
    timestamp: string;
    notes: string;
  };
  user: {
    name: string;
  }[];
}

export default function Dashboard() {
  const { user, loading: authLoading, authChecked } = useAuth();
  const router = useRouter();
  const [statusCounts, setStatusCounts] = useState<StatusCount[]>([]);
  const [totalLeads, setTotalLeads] = useState(0);
  const [recentActivity, setRecentActivity] = useState<RecentActivity[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Get count for a specific status
  const getStatusCount = (status: LeadStatus) => {
    return statusCounts.find(s => s._id === status)?.count || 0;
  };

  // Calculate percentage for a status
  const getStatusPercentage = (status: LeadStatus) => {
    const count = getStatusCount(status);
    return totalLeads > 0 ? ((count / totalLeads) * 100).toFixed(1) : '0';
  };

  // Group statuses
  const pendingStatuses = ["PENDING", "WAITING_ID"];
  const processingStatuses = ["WORKING", "QC", "ATTEMPT_1", "ATTEMPT_2", "ATTEMPT_3", "ATTEMPT_4", "CALL_BACK"];
  const completedStatuses = ["VERIFIED", "ID_VERIFIED", "SENT_CLIENT", "PAID"];
  const issueStatuses = ["REJECTED", "REJECTED_BY_CLIENT", "DUPLICATE", "NOT_RESPONDING", "FELONY", "DEAD_LEAD", "CHARGEBACK"];

  const fetchLeadStats = async () => {
    setLoading(true);
    setError(null);

    try {
      const { data } = await axios.get(`/api/leads/stats?t=${Date.now()}`);
      setStatusCounts(data.statusCounts || []);
      setTotalLeads(data.totalLeads || 0);
      setRecentActivity(data.recentActivity || []);
    } catch (error: any) {
      console.error('Error fetching lead stats:', error);
      setError(error.response?.data?.message || 'Failed to load statistics');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (authChecked && !authLoading && user) {
      fetchLeadStats();

      // Set up auto-refresh interval
      const refreshInterval = setInterval(() => {
        fetchLeadStats();
      }, 120000); // Refresh every 2 minutes

      return () => clearInterval(refreshInterval);
    }
  }, [user, authChecked, authLoading]);

  const StatusCard = ({ status }: { status: LeadStatus }) => {
    const config = STATUS_CONFIG[status];
    const count = getStatusCount(status);
    const percentage = getStatusPercentage(status);

    return (
      <motion.div
        whileHover={{ y: -4 }}
        transition={{ type: "spring", stiffness: 300 }}
      >
        <TooltipProvider delayDuration={300}>
          <Tooltip>
            <TooltipTrigger asChild>
              <Card className="overflow-hidden h-full border-transparent hover:border-primary/20 transition-all duration-300 shadow-sm hover:shadow-md">
                <CardContent className="p-4 pb-3">
                  <div className="flex justify-between items-center mb-2">
                    <div className="flex items-center gap-2">
                      <div
                        className="p-1.5 rounded-md"
                        style={{ backgroundColor: config.bgColor, color: config.color }}
                      >
                        {config.icon}
                      </div>
                      <span className="font-medium text-sm whitespace-nowrap overflow-hidden text-ellipsis">
                        {status.replace(/_/g, ' ')}
                      </span>
                    </div>
                    <Badge
                      variant="outline"
                      className="font-semibold"
                      style={{
                        color: config.color,
                        borderColor: config.color,
                        backgroundColor: config.bgColor
                      }}
                    >
                      {count}
                    </Badge>
                  </div>
                  <div className="w-full bg-muted h-1.5 rounded-full overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${percentage}%` }}
                      transition={{ duration: 1, ease: "easeOut" }}
                      className="h-full rounded-full"
                      style={{ backgroundColor: config.color }}
                    />
                  </div>
                  <div className="flex justify-between mt-2 items-center">
                    <span className="text-xs text-muted-foreground">{percentage}%</span>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 px-2 text-xs hover:bg-transparent hover:text-primary"
                      onClick={() => router.push(`/leads?status=${status}`)}
                    >
                      View
                      <ChevronRight className="h-3 w-3 ml-1" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </TooltipTrigger>
            <TooltipContent side="top">
              <p>{config.description}</p>
              <p className="font-medium">{count} leads ({percentage}%)</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </motion.div>
    );
  };

  const ActivityItem = ({ activity }: { activity: RecentActivity }) => {
    const fromConfig = activity.statusHistory.fromStatus ?
      STATUS_CONFIG[activity.statusHistory.fromStatus as LeadStatus] :
      { color: '#6B7280', bgColor: '#F3F4F6', icon: <Clock className="h-5 w-5" /> };

    const toConfig = STATUS_CONFIG[activity.statusHistory.toStatus as LeadStatus];

    return (
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-start space-x-4 p-4 rounded-lg border border-border/50 shadow-sm bg-card"
      >
        <div
          className="p-2 rounded-full flex-shrink-0"
          style={{ backgroundColor: toConfig.bgColor, color: toConfig.color }}
        >
          {toConfig.icon}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1">
            <h4 className="font-medium truncate">
              {activity.firstName} {activity.lastName}
            </h4>
            <span className="text-xs text-muted-foreground">
              • {format(new Date(activity.statusHistory.timestamp), 'MMM d, h:mm a')}
            </span>
          </div>

          <div className="flex items-center gap-2 mt-1">
            <div
              className="p-1 rounded"
              style={{ backgroundColor: fromConfig.bgColor, color: fromConfig.color }}
            >
              <Badge variant="outline" className="text-xs border-none bg-transparent">
                {activity.statusHistory.fromStatus || 'New'}
              </Badge>
            </div>
            <ChevronRight className="h-3 w-3 text-muted-foreground" />
            <div
              className="p-1 rounded"
              style={{ backgroundColor: toConfig.bgColor, color: toConfig.color }}
            >
              <Badge variant="outline" className="text-xs border-none bg-transparent">
                {activity.statusHistory.toStatus}
              </Badge>
            </div>
          </div>

          {activity.statusHistory.notes && (
            <p className="mt-1 text-sm text-muted-foreground truncate">
              {activity.statusHistory.notes}
            </p>
          )}
        </div>

        <Button
          variant="outline"
          size="sm"
          className="flex-shrink-0"
          onClick={() => router.push(`/leads/${activity._id}`)}
        >
          View Lead
          <ChevronRight className="h-4 w-4 ml-1" />
        </Button>
      </motion.div>
    );
  };

  return (
    <DashboardLayout>
      <div className="space-y-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <motion.h1
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
              className="text-3xl font-bold tracking-tight"
            >
              Lead Management Dashboard
            </motion.h1>
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="text-muted-foreground mt-1"
            >
              Welcome back, {user?.name || 'User'} | {format(new Date(), 'EEEE, MMMM d, yyyy')}
            </motion.p>
          </div>

          <div className="flex items-center gap-3">
            <Button variant="outline" size="sm" onClick={fetchLeadStats} disabled={loading}>
              {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <RefreshCw className="mr-2 h-4 w-4" />}
              Refresh
            </Button>
            <Button variant="default" size="sm" onClick={() => router.push('/leads/create')}>
              <Plus className="mr-2 h-4 w-4" />
              New Lead
            </Button>
          </div>
        </div>

        {error && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-destructive/15 text-destructive border border-destructive/30 px-4 py-3 rounded-lg flex items-center"
          >
            <AlertCircle className="h-5 w-5 mr-2 flex-shrink-0" />
            <span>{error}</span>
          </motion.div>
        )}

        {/* // Update only the Key Metrics Cards section in your Dashboard component */}
        {/* // Keep all other parts the same

        // Key Metrics Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.4 }}
          >
            <Card className="border-0 bg-white dark:bg-slate-900 shadow-md hover:shadow-lg transition-all">
              <div className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="p-2 bg-slate-100 dark:bg-slate-800 rounded">
                    <FileText className="h-5 w-5 text-slate-700 dark:text-slate-300" />
                  </div>
                  <div className="flex items-center">
                    <div className="h-2 w-2 rounded-full bg-slate-700 dark:bg-slate-300 mr-2"></div>
                    <span className="text-xs font-medium uppercase tracking-wider text-slate-600 dark:text-slate-400">All Leads</span>
                  </div>
                </div>

                <div className="space-y-2">
                  <h3 className="text-sm font-medium text-slate-500 dark:text-slate-400">Total Lead Count</h3>
                  {loading ? (
                    <Skeleton className="h-10 w-20" />
                  ) : (
                    <div className="text-3xl font-bold text-slate-900 dark:text-white">{totalLeads}</div>
                  )}
                </div>

                <div className="mt-6 pt-4 border-t border-slate-100 dark:border-slate-800">
                  <Button
                    onClick={() => router.push('/leads')}
                    variant="ghost"
                    className="w-full justify-between p-0 h-auto font-medium text-slate-800 dark:text-slate-200 hover:bg-transparent hover:text-slate-900"
                  >
                    <span>View All Leads</span>
                    <ChevronRight className="h-4 w-4 text-slate-500" />
                  </Button>
                </div>
              </div>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.4, delay: 0.1 }}
          >
            <Card className="border-0 bg-white dark:bg-slate-900 shadow-md hover:shadow-lg transition-all">
              <div className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="p-2 bg-amber-50 dark:bg-amber-900/20 rounded">
                    <Clock className="h-5 w-5 text-amber-700 dark:text-amber-400" />
                  </div>
                  <div className="flex items-center">
                    <div className="h-2 w-2 rounded-full bg-amber-600 dark:bg-amber-500 mr-2"></div>
                    <span className="text-xs font-medium uppercase tracking-wider text-slate-600 dark:text-slate-400">Pending Review</span>
                  </div>
                </div>

                <div className="space-y-2">
                  <h3 className="text-sm font-medium text-slate-500 dark:text-slate-400">Pending Leads</h3>
                  {loading ? (
                    <Skeleton className="h-10 w-20" />
                  ) : (
                    <div className="text-3xl font-bold text-slate-900 dark:text-white">
                      {pendingStatuses.reduce((sum, status) => sum + getStatusCount(status as LeadStatus), 0)}
                    </div>
                  )}
                  {!loading && totalLeads > 0 && (
                    <p className="text-sm text-slate-500 dark:text-slate-400">
                      {((pendingStatuses.reduce((sum, status) => sum + getStatusCount(status as LeadStatus), 0) / totalLeads) * 100).toFixed(1)}% of caseload
                    </p>
                  )}
                </div>

                <div className="mt-6 pt-4 border-t border-slate-100 dark:border-slate-800">
                  <Button
                    onClick={() => router.push('/leads?status=PENDING')}
                    variant="ghost"
                    className="w-full justify-between p-0 h-auto font-medium text-slate-800 dark:text-slate-200 hover:bg-transparent hover:text-slate-900"
                  >
                    <span>Review Pending</span>
                    <ChevronRight className="h-4 w-4 text-slate-500" />
                  </Button>
                </div>
              </div>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.4, delay: 0.2 }}
          >
            <Card className="border-0 bg-white dark:bg-slate-900 shadow-md hover:shadow-lg transition-all">
              <div className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="p-2 bg-emerald-50 dark:bg-emerald-900/20 rounded">
                    <CheckCircle className="h-5 w-5 text-emerald-700 dark:text-emerald-400" />
                  </div>
                  <div className="flex items-center">
                    <div className="h-2 w-2 rounded-full bg-emerald-600 dark:bg-emerald-500 mr-2"></div>
                    <span className="text-xs font-medium uppercase tracking-wider text-slate-600 dark:text-slate-400">Verified</span>
                  </div>
                </div>

                <div className="space-y-2">
                  <h3 className="text-sm font-medium text-slate-500 dark:text-slate-400">Completed Leads</h3>
                  {loading ? (
                    <Skeleton className="h-10 w-20" />
                  ) : (
                    <div className="text-3xl font-bold text-slate-900 dark:text-white">
                      {completedStatuses.reduce((sum, status) => sum + getStatusCount(status as LeadStatus), 0)}
                    </div>
                  )}
                  {!loading && totalLeads > 0 && (
                    <p className="text-sm text-slate-500 dark:text-slate-400">
                      {((completedStatuses.reduce((sum, status) => sum + getStatusCount(status as LeadStatus), 0) / totalLeads) * 100).toFixed(1)}% success rate
                    </p>
                  )}
                </div>

                <div className="mt-6 pt-4 border-t border-slate-100 dark:border-slate-800">
                  <Button
                    onClick={() => router.push('/leads?status=VERIFIED')}
                    variant="ghost"
                    className="w-full justify-between p-0 h-auto font-medium text-slate-800 dark:text-slate-200 hover:bg-transparent hover:text-slate-900"
                  >
                    <span>View Verified</span>
                    <ChevronRight className="h-4 w-4 text-slate-500" />
                  </Button>
                </div>
              </div>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.4, delay: 0.3 }}
          >
            <Card className="border-0 bg-white dark:bg-slate-900 shadow-md hover:shadow-lg transition-all">
              <div className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="p-2 bg-blue-50 dark:bg-blue-900/20 rounded">
                    <Users className="h-5 w-5 text-blue-700 dark:text-blue-400" />
                  </div>
                  <div className="flex items-center">
                    <div className="h-2 w-2 rounded-full bg-blue-600 dark:bg-blue-500 mr-2"></div>
                    <span className="text-xs font-medium uppercase tracking-wider text-slate-600 dark:text-slate-400">In Process</span>
                  </div>
                </div>

                <div className="space-y-2">
                  <h3 className="text-sm font-medium text-slate-500 dark:text-slate-400">Processing Leads</h3>
                  {loading ? (
                    <Skeleton className="h-10 w-20" />
                  ) : (
                    <div className="text-3xl font-bold text-slate-900 dark:text-white">
                      {processingStatuses.reduce((sum, status) => sum + getStatusCount(status as LeadStatus), 0)}
                    </div>
                  )}
                  {!loading && totalLeads > 0 && (
                    <p className="text-sm text-slate-500 dark:text-slate-400">
                      {((processingStatuses.reduce((sum, status) => sum + getStatusCount(status as LeadStatus), 0) / totalLeads) * 100).toFixed(1)}% in progress
                    </p>
                  )}
                </div>

                <div className="mt-6 pt-4 border-t border-slate-100 dark:border-slate-800">
                  <Button
                    onClick={() => router.push('/leads?status=WORKING')}
                    variant="ghost"
                    className="w-full justify-between p-0 h-auto font-medium text-slate-800 dark:text-slate-200 hover:bg-transparent hover:text-slate-900"
                  >
                    <span>View Processing</span>
                    <ChevronRight className="h-4 w-4 text-slate-500" />
                  </Button>
                </div>
              </div>
            </Card>
          </motion.div>
        </div>
        {/* All Status Cards */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold tracking-tight">Lead Status Overview</h2>
            <HoverCard>
              <HoverCardTrigger asChild>
                <Button variant="outline" size="sm">
                  <AlertCircle className="mr-2 h-4 w-4" />
                  Status Info
                </Button>
              </HoverCardTrigger>
              <HoverCardContent className="w-80">
                <h3 className="font-semibold mb-2">Lead Status Colors</h3>
                <p className="text-sm text-muted-foreground mb-3">
                  Each status is color-coded to help you quickly identify lead categories.
                </p>
                <ScrollArea className="h-80">
                  <div className="space-y-2">
                    {ALL_STATUSES.map(status => (
                      <div key={status} className="flex items-center gap-2">
                        <div className="h-3 w-3 rounded-full" style={{ backgroundColor: STATUS_CONFIG[status].color }}></div>
                        <span className="text-sm font-medium">{status.replace(/_/g, ' ')}</span>
                        <span className="text-xs text-muted-foreground">{STATUS_CONFIG[status].description}</span>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </HoverCardContent>
            </HoverCard>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {ALL_STATUSES.map((status, index) => (
              <motion.div
                key={status}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: 0.05 * index }}
              >
                <StatusCard status={status} />
              </motion.div>
            ))}
          </div>
        </div>

        {/* Recent Activity */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold tracking-tight">Recent Activity</h2>
            <Button variant="outline" size="sm" onClick={() => router.push('/leads')}>
              All Leads <ChevronRight className="ml-2 h-4 w-4" />
            </Button>
          </div>

          {loading ? (
            <div className="space-y-4">
              {Array.from({ length: 3 }).map((_, i) => (
                <Card key={i} className="p-4">
                  <div className="flex items-start space-x-4">
                    <Skeleton className="h-10 w-10 rounded-full" />
                    <div className="space-y-2 flex-1">
                      <Skeleton className="h-4 w-[200px]" />
                      <Skeleton className="h-4 w-[300px]" />
                      <Skeleton className="h-4 w-[150px]" />
                    </div>
                    <Skeleton className="h-9 w-[100px]" />
                  </div>
                </Card>
              ))}
            </div>
          ) : recentActivity.length > 0 ? (
            <div className="grid gap-4 md:grid-cols-2">
              {recentActivity.slice(0, 6).map((activity, index) => (
                <ActivityItem key={index} activity={activity} />
              ))}
            </div>
          ) : (
            <Card className="p-12">
              <div className="text-center space-y-3">
                <Clock className="h-12 w-12 text-muted-foreground mx-auto" />
                <h3 className="text-lg font-medium">No Recent Activity</h3>
                <p className="text-muted-foreground">Lead status changes will appear here</p>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => router.push('/leads/create')}
                  className="mt-2"
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Create a New Lead
                </Button>
              </div>
            </Card>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
