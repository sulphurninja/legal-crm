'use client';

import React, { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Loader2,
  Search,
  Plus,
  MoreHorizontal,
  Filter,
  Clock,
  Eye,
  History,
  ChevronRight,
  ChevronLeft,
  RefreshCw,
  FileText,
  AlertTriangle,
  Check,
  CheckCircle,
  XCircle,
  PhoneCall,
  Mail
} from 'lucide-react';

// Don't forget to add these imports at the top:
import {
  Copy,
  PhoneOff,
  ShieldAlert,
  FileX,
  ActivitySquare,
  Phone,
  CreditCard,
  FileInput,
  SendHorizontal,
  ClipboardCheck,
  BadgeCheck
} from 'lucide-react';
import { format } from 'date-fns';
import { LeadStatus } from '@/types';
import { motion } from 'framer-motion';

// Interface for lead data
interface Lead {
  _id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  status: LeadStatus;
  createdAt: string;
  createdBy: {
    name: string;
    email: string;
  };
  statusHistory: {
    fromStatus: string;
    toStatus: string;
    timestamp: string;
    notes: string;
    changedBy: {
      name: string;
      email: string;
    };
  }[];
}

// Interface for pagination data
interface PaginationData {
  total: number;
  page: number;
  limit: number;
  pages: number;
}

// Status color mapping with more professional colors and icons for all statuses
const STATUS_COLORS: Record<string, { bg: string, text: string, icon: JSX.Element }> = {
  PENDING: {
    bg: 'bg-amber-50 dark:bg-amber-950/30',
    text: 'text-amber-700 dark:text-amber-400',
    icon: <Clock className="h-4 w-4" />
  },
  REJECTED: {
    bg: 'bg-red-50 dark:bg-red-950/30',
    text: 'text-red-700 dark:text-red-400',
    icon: <XCircle className="h-4 w-4" />
  },
  VERIFIED: {
    bg: 'bg-emerald-50 dark:bg-emerald-950/30',
    text: 'text-emerald-700 dark:text-emerald-400',
    icon: <CheckCircle className="h-4 w-4" />
  },
  REJECTED_BY_CLIENT: {
    bg: 'bg-orange-50 dark:bg-orange-950/30',
    text: 'text-orange-700 dark:text-orange-400',
    icon: <AlertTriangle className="h-4 w-4" />
  },
  PAID: {
    bg: 'bg-blue-50 dark:bg-blue-950/30',
    text: 'text-blue-700 dark:text-blue-400',
    icon: <Check className="h-4 w-4" />
  },
  DUPLICATE: {
    bg: 'bg-purple-50 dark:bg-purple-950/30',
    text: 'text-purple-700 dark:text-purple-400',
    icon: <Copy className="h-4 w-4" />
  },
  NOT_RESPONDING: {
    bg: 'bg-slate-50 dark:bg-slate-950/30',
    text: 'text-slate-700 dark:text-slate-400',
    icon: <PhoneOff className="h-4 w-4" />
  },
  FELONY: {
    bg: 'bg-rose-50 dark:bg-rose-950/30',
    text: 'text-rose-700 dark:text-rose-400',
    icon: <ShieldAlert className="h-4 w-4" />
  },
  DEAD_LEAD: {
    bg: 'bg-gray-50 dark:bg-gray-950/30',
    text: 'text-gray-700 dark:text-gray-400',
    icon: <FileX className="h-4 w-4" />
  },
  WORKING: {
    bg: 'bg-indigo-50 dark:bg-indigo-950/30',
    text: 'text-indigo-700 dark:text-indigo-400',
    icon: <ActivitySquare className="h-4 w-4" />
  },
  CALL_BACK: {
    bg: 'bg-cyan-50 dark:bg-cyan-950/30',
    text: 'text-cyan-700 dark:text-cyan-400',
    icon: <PhoneCall className="h-4 w-4" />
  },
  ATTEMPT_1: {
    bg: 'bg-sky-50 dark:bg-sky-950/30',
    text: 'text-sky-700 dark:text-sky-400',
    icon: <Phone className="h-4 w-4" />
  },
  ATTEMPT_2: {
    bg: 'bg-sky-50 dark:bg-sky-950/30',
    text: 'text-sky-700 dark:text-sky-400',
    icon: <Phone className="h-4 w-4" />
  },
  ATTEMPT_3: {
    bg: 'bg-sky-50 dark:bg-sky-950/30',
    text: 'text-sky-700 dark:text-sky-400',
    icon: <Phone className="h-4 w-4" />
  },
  ATTEMPT_4: {
    bg: 'bg-sky-50 dark:bg-sky-950/30',
    text: 'text-sky-700 dark:text-sky-400',
    icon: <Phone className="h-4 w-4" />
  },
  CHARGEBACK: {
    bg: 'bg-rose-50 dark:bg-rose-950/30',
    text: 'text-rose-700 dark:text-rose-400',
    icon: <CreditCard className="h-4 w-4" />
  },
  WAITING_ID: {
    bg: 'bg-yellow-50 dark:bg-yellow-950/30',
    text: 'text-yellow-700 dark:text-yellow-400',
    icon: <FileInput className="h-4 w-4" />
  },
  SENT_CLIENT: {
    bg: 'bg-green-50 dark:bg-green-950/30',
    text: 'text-green-700 dark:text-green-400',
    icon: <SendHorizontal className="h-4 w-4" />
  },
  QC: {
    bg: 'bg-violet-50 dark:bg-violet-950/30',
    text: 'text-violet-700 dark:text-violet-400',
    icon: <ClipboardCheck className="h-4 w-4" />
  },
  ID_VERIFIED: {
    bg: 'bg-emerald-50 dark:bg-emerald-950/30',
    text: 'text-emerald-700 dark:text-emerald-400',
    icon: <BadgeCheck className="h-4 w-4" />
  }
};


// Default configuration for statuses that don't have specific settings
const DEFAULT_STATUS = {
  bg: 'bg-slate-50 dark:bg-slate-950/30',
  text: 'text-slate-700 dark:text-slate-400',
  icon: <FileText className="h-4 w-4" />
};

export default function ClientLeads() {
  const { user, loading: authLoading, authChecked } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();

  // Get status from URL if available
  const statusParam = searchParams.get('status') || '';
  const searchParam = searchParams.get('search') || '';
  const pageParam = parseInt(searchParams.get('page') || '1');

  // State
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState(searchParam);
  const [searchInput, setSearchInput] = useState(searchParam);
  const [statusFilter, setStatusFilter] = useState<string>(statusParam);
  const [currentPage, setCurrentPage] = useState(pageParam);
  const [limit, setLimit] = useState(10);
  const [pagination, setPagination] = useState<PaginationData>({
    total: 0,
    page: pageParam,
    limit: 10,
    pages: 0
  });
  const [historyDialog, setHistoryDialog] = useState<{
    open: boolean;
    lead: Lead | null;
  }>({
    open: false,
    lead: null
  });

  // Function to check if the user is an admin
  const isAdmin = user?.role === 'admin' || user?.role === 'super_admin';

  const fetchLeads = async () => {
    setLoading(true);

    try {
      let url = `/api/leads?page=${currentPage}&limit=${limit}&t=${Date.now()}`;

      if (statusFilter) {
        url += `&status=${statusFilter}`;
      }

      if (search) {
        url += `&search=${search}`;
      }

      const response = await axios.get(url);
      setLeads(response.data.leads);
      setPagination(response.data.pagination);
    } catch (error) {
      console.error('Error fetching leads:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (authChecked && !authLoading && user) {
      fetchLeads();
    }
  }, [user, authChecked, authLoading, currentPage, statusFilter, search]);

  // Handle search input change
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchInput(e.target.value);
  };

  // Handle search submit
  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSearch(searchInput);
    setCurrentPage(1);
  };

  // Handle status filter change
  const handleStatusChange = (value: string) => {
    setStatusFilter(value === 'All' ? '' : value);
    setCurrentPage(1);
  };

  // Update URL when filters change
  useEffect(() => {
    const params = new URLSearchParams();

    if (statusFilter) {
      params.set('status', statusFilter);
    }

    if (search) {
      params.set('search', search);
    }

    if (currentPage > 1) {
      params.set('page', currentPage.toString());
    }

    const newURL = `/leads${params.toString() ? `?${params.toString()}` : ''}`;
    router.push(newURL, { scroll: false });
  }, [statusFilter, search, currentPage, router]);

  // Handle pagination
  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  // Handle view lead history
  const handleViewHistory = (lead: Lead) => {
    setHistoryDialog({
      open: true,
      lead
    });
  };

  // Get status style
  const getStatusStyle = (status: LeadStatus) => {
    return STATUS_COLORS[status] || DEFAULT_STATUS;
  };

  // Render pagination controls
  const renderPagination = () => {
    const { pages, page } = pagination;

    if (pages <= 1) return null;

    // Show a limited number of page links
    const pageNumbers = [];
    const maxVisiblePages = 5;
    let startPage = Math.max(1, page - Math.floor(maxVisiblePages / 2));
    let endPage = Math.min(pages, startPage + maxVisiblePages - 1);

    // Adjust if we're near the end
    if (endPage - startPage + 1 < maxVisiblePages) {
      startPage = Math.max(1, endPage - maxVisiblePages + 1);
    }

    for (let i = startPage; i <= endPage; i++) {
      pageNumbers.push(i);
    }

    return (
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mt-4">
        <div className="text-sm text-muted-foreground">
          Showing {Math.min((page - 1) * limit + 1, pagination?.total)} to {Math.min(page * limit, pagination.total)} of {pagination.total} Leads
        </div>

        <div className="flex items-center gap-1">
          <Button
            variant="outline"
            size="sm"
            onClick={() => handlePageChange(page - 1)}
            disabled={page === 1}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>

          {startPage > 1 && (
            <>
              <Button
                variant={page === 1 ? "default" : "outline"}
                size="sm"
                onClick={() => handlePageChange(1)}
              >
                1
              </Button>
              {startPage > 2 && <span className="mx-1">...</span>}
            </>
          )}

          {pageNumbers.map((pageNum) => (
            <Button
              key={pageNum}
              variant={page === pageNum ? "default" : "outline"}
              size="sm"
              onClick={() => handlePageChange(pageNum)}
            >
              {pageNum}
            </Button>
          ))}

          {endPage < pages && (
            <>
              {endPage < pages - 1 && <span className="mx-1">...</span>}
              <Button
                variant={page === pages ? "default" : "outline"}
                size="sm"
                onClick={() => handlePageChange(pages)}
              >
                {pages}
              </Button>
            </>
          )}

          <Button
            variant="outline"
            size="sm"
            onClick={() => handlePageChange(page + 1)}
            disabled={page === pages}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
    );
  };

  if (authLoading) {
    return (
      <div className="flex h-screen w-full items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Lead Management</h1>
            <p className="text-muted-foreground mt-1">
              Track and manage all client Leads in your pipeline
            </p>
          </div>
          <Button onClick={() => router.push('/leads/create')} className="shadow-sm">
            <Plus className="mr-2 h-4 w-4" />
            New Lead
          </Button>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          <Card className="md:col-span-2">
            <CardHeader className="pb-3">
              <div className="flex items-center space-x-2">
                <Search className="h-5 w-5 text-muted-foreground" />
                <CardTitle>Search Leads</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSearchSubmit} className="flex flex-col sm:flex-row gap-3">
                <div className="relative flex-1">
                  <Input
                    placeholder="Search by name, email, or phone..."
                    value={searchInput}
                    onChange={handleSearchChange}
                    className="pl-10"
                  />
                  <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                </div>
                <div className="flex gap-2">
                  <Button type="submit" className="whitespace-nowrap">
                    Search
                  </Button>
                  <Button
                    variant="outline"
                    className="whitespace-nowrap"
                    onClick={() => {
                      setSearchInput('');
                      setSearch('');
                      setStatusFilter('');
                    }}
                  >
                    Clear
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center space-x-2">
                <Filter className="h-5 w-5 text-muted-foreground" />
                <CardTitle>Status Filter</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <Select
                value={statusFilter}
                onValueChange={handleStatusChange}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="All">All Statuses</SelectItem>
                  {Object.keys(STATUS_COLORS).map(status => (
                    <SelectItem key={status} value={status}>
                      <div className="flex items-center">
                        <div className={`w-2 h-2 rounded-full mr-2 ${getStatusStyle(status as LeadStatus).bg} ${getStatusStyle(status as LeadStatus).text}`}></div>
                        {status.replace(/_/g, ' ')}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </CardContent>
          </Card>
        </div>

        <Card className="shadow-sm border-slate-200 dark:border-slate-800">
          <CardHeader className="px-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <CardTitle className="text-xl">
                  {statusFilter
                    ? `${statusFilter.replace(/_/g, ' ')} Leads`
                    : 'All Leads'}
                </CardTitle>
                <CardDescription>
                  {pagination.total} Lead{pagination.total !== 1 ? 's' : ''} found
                </CardDescription>
              </div>

              <Button
                variant="outline"
                size="sm"
                onClick={fetchLeads}
                className="self-start sm:self-center"
              >
                <RefreshCw className="mr-2 h-4 w-4" />
                Refresh
              </Button>
            </div>
          </CardHeader>

          <Separator />

          <CardContent className="p-0">
            {loading ? (
              <div className="flex justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : leads.length === 0 ? (
              <div className="text-center py-12 px-6">
                <FileText className="mx-auto h-12 w-12 text-muted-foreground opacity-30 mb-3" />
                <h3 className="text-lg font-medium mb-1">No Leads found</h3>
                <p className="text-muted-foreground mb-4">
                  Try adjusting your search filters or create a new Lead.
                </p>
                <Button
                  onClick={() => router.push('/leads/create')}
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Create New Lead
                </Button>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-slate-50 hover:bg-slate-50 dark:bg-slate-900/50 dark:hover:bg-slate-900/50">
                      <TableHead>Client Name</TableHead>
                      <TableHead>Contact Information</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Created</TableHead>
                      <TableHead>Created By</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {leads.map((lead) => (
                      <TableRow
                        key={lead._id}
                        className="cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-900/50"
                        onClick={() => router.push(`/leads/${lead._id}`)}
                      >
                        <TableCell className="font-medium">
                          {lead.firstName} {lead.lastName}
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-col space-y-1">
                            <div className="flex items-center text-sm">
                              <Mail className="h-3 w-3 mr-2 text-muted-foreground" />
                              <span className="text-muted-foreground">{lead.email}</span>
                            </div>
                            <div className="flex items-center text-sm">
                              <PhoneCall className="h-3 w-3 mr-2 text-muted-foreground" />
                              <span className="text-muted-foreground">{lead.phone}</span>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge
                            className={`${getStatusStyle(lead.status).bg} ${getStatusStyle(lead.status).text} font-medium`}
                          >
                            <div className="flex items-center gap-1.5">
                              {React.createElement(getStatusStyle(lead.status).icon.type, {
                                className: getStatusStyle(lead.status).icon.props.className,
                                key: 'status-icon'
                              })}
                              <span>{lead.status.replace(/_/g, ' ')}</span>
                            </div>
                          </Badge>
                        </TableCell>
                        <TableCell className="whitespace-nowrap">
                          <div className="flex items-center">
                            <Clock className="h-3 w-3 mr-2 text-muted-foreground" />
                            {format(new Date(lead.createdAt), 'MMM d, yyyy')}
                          </div>
                        </TableCell>
                        <TableCell>
                          {lead.createdBy?.name || 'Unknown'}
                        </TableCell>
                        <TableCell className="text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                              <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                                <MoreHorizontal className="h-4 w-4" />
                                <span className="sr-only">Actions</span>
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={(e) => {
                                e.stopPropagation();
                                router.push(`/leads/${lead._id}`);
                              }}>
                                <Eye className="mr-2 h-4 w-4" />
                                View Details
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={(e) => {
                                e.stopPropagation();
                                handleViewHistory(lead);
                              }}>
                                <History className="mr-2 h-4 w-4" />
                                View History
                              </DropdownMenuItem>

                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>

                <div className="p-4 border-t">
                  {renderPagination()}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Lead History Dialog */}
      <Dialog
        open={historyDialog.open}
        onOpenChange={(open) => {
          if (!open) setHistoryDialog({ open: false, lead: null });
        }}
      >
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center">
              <History className="mr-2 h-5 w-5" />
              Lead History
            </DialogTitle>
            <DialogDescription>
              {historyDialog.lead?.firstName} {historyDialog.lead?.lastName} - Status change timeline
            </DialogDescription>
          </DialogHeader>

          <ScrollArea className="max-h-[60vh] overflow-y-auto mt-4 pr-4">
            {historyDialog.lead?.statusHistory.length ? (
              <div className="relative pl-6 pb-2">
                {/* Timeline */}
                <div className="absolute top-0 bottom-0 left-3 w-0.5 bg-slate-200 dark:bg-slate-700" />

                {/* Timeline Items */}
                <div className="space-y-6">
                  {historyDialog.lead.statusHistory
                    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
                    .map((historyItem, index) => {
                      const toStatus = historyItem.toStatus as LeadStatus;
                      const fromStatus = historyItem.fromStatus as LeadStatus || 'NEW';
                      const toStatusStyle = getStatusStyle(toStatus);

                      return (
                        <motion.div
                          key={index}
                          className="relative"
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: index * 0.05 }}
                        >
                          {/* Timeline Marker */}
                          <div className={`absolute -left-3 mt-1 flex h-6 w-6 items-center justify-center rounded-full ${toStatusStyle.bg} border-4 border-background`}>
                            <div className={`h-2 w-2 rounded-full ${toStatusStyle.text}`} />
                          </div>

                          {/* Timeline Content */}
                          <div className="rounded-lg border bg-card p-4 shadow-sm">
                            <div className="mb-3 flex items-center justify-between">
                              <div className="font-medium flex items-center">
                                <Badge variant="outline" className="mr-2 font-normal">
                                  {historyItem.fromStatus || 'New'}
                                </Badge>
                                <ChevronRight className="h-3 w-3 text-muted-foreground mx-1" />
                                <Badge
                                  className={`${toStatusStyle.bg} ${toStatusStyle.text}`}
                                >
                                  {historyItem.toStatus}
                                </Badge>
                              </div>
                              <div className="text-sm text-muted-foreground">
                                {format(new Date(historyItem.timestamp), 'MMM d, yyyy h:mm a')}
                              </div>
                            </div>

                            {historyItem.notes && (
                              <div className="mt-2 text-sm border-l-2 border-slate-200 dark:border-slate-700 pl-3 py-1">
                                {historyItem.notes}
                              </div>
                            )}

                            <div className="mt-3 text-xs text-muted-foreground flex items-center">
                              <span className="bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded">
                                Changed by: {historyItem.changedBy?.name || 'Unknown'}
                              </span>
                            </div>
                          </div>
                        </motion.div>
                      );
                    })}
                </div>
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                No history available for this Lead
              </div>
            )}
          </ScrollArea>

          <DialogFooter className="flex flex-col sm:flex-row gap-3 sm:gap-0">
            <Button
              variant="outline"
              onClick={() => setHistoryDialog({ open: false, lead: null })}
            >
              Close
            </Button>
            <Button
              onClick={() => {
                if (historyDialog.lead) {
                  router.push(`/leads/${historyDialog.lead._id}`);
                  setHistoryDialog({ open: false, lead: null });
                }
              }}
            >
              View Full Details
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}
