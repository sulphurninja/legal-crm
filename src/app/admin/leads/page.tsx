'use client';

import { useState, useEffect } from 'react';
import axios from 'axios';
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
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Loader2,
  Search,
  MoreHorizontal,
  RefreshCw,
  FileEdit,
  List,
  BarChart,
  Eye,
} from 'lucide-react';
import { toast } from '@/components/ui/use-toast';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import DashboardLayout from '@/components/DashboardLayout';
import { useRouter } from 'next/navigation';

// Define Lead status options from your model
const LEAD_STATUSES = [
  "PENDING", "REJECTED", "VERIFIED", "REJECTED_BY_CLIENT", "PAID",
  "DUPLICATE", "NOT_RESPONDING", "FELONY", "DEAD_LEAD", "WORKING",
  "CALL_BACK", "ATTEMPT_1", "ATTEMPT_2", "ATTEMPT_3", "ATTEMPT_4",
  "CHARGEBACK", "WAITING_ID", "SENT_CLIENT", "QC", "ID_VERIFIED", "BILLABLE","CAMPAIGN_PAUSED", "SENT_TO_LAW_FIRM"
];

// Define the schema for updating lead status
const updateLeadSchema = z.object({
  status: z.enum(LEAD_STATUSES as [string, ...string[]]),
  notes: z.string().optional(),
});

type UpdateLeadFormValues = z.infer<typeof updateLeadSchema>;

// Define Lead type
interface Lead {
  _id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  status: string;
  applicationType: string;
  createdAt: string;
  createdBy: {
    name: string;
    email: string;
  };
  statusHistory: {
    fromStatus: string;
    toStatus: string;
    notes: string;
    timestamp: string;
    changedBy: string;
  }[];
}

export default function LeadManagement() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [updateDialogOpen, setUpdateDialogOpen] = useState(false);
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [stats, setStats] = useState({
    total: 0,
    pending: 0,
    verified: 0,
    rejected: 0,
  });

  const updateForm = useForm<UpdateLeadFormValues>({
    resolver: zodResolver(updateLeadSchema),
    defaultValues: {
      status: 'PENDING',
      notes: '',
    },
  });

  useEffect(() => {
    fetchLeads();
  }, [statusFilter]);

  const fetchLeads = async () => {
    setLoading(true);
    try {
      const endpoint = statusFilter
        ? `/api/admin/leads?status=${statusFilter}`
        : '/api/admin/leads';

      const { data } = await axios.get(endpoint);
      setLeads(data.leads);

      // Calculate stats
      const totalLeads = data.leads.length;
      const pendingCount = data.leads.filter((lead: Lead) => lead.status === 'PENDING').length;
      const verifiedCount = data.leads.filter((lead: Lead) => lead.status === 'VERIFIED' || lead.status === 'ID_VERIFIED').length;
      const rejectedCount = data.leads.filter((lead: Lead) => lead.status === 'REJECTED' || lead.status === 'REJECTED_BY_CLIENT').length;

      setStats({
        total: totalLeads,
        pending: pendingCount,
        verified: verifiedCount,
        rejected: rejectedCount,
      });

    } catch (error) {
      console.error('Error fetching leads:', error);
      toast({
        title: "Error",
        description: "Failed to load leads",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const onUpdateLead = async (values: UpdateLeadFormValues) => {
    if (!selectedLead) return;

    setSubmitting(true);
    try {
      await axios.put(`/api/admin/leads/${selectedLead._id}`, values);
      toast({
        title: "Success",
        description: "Lead status updated successfully",
      });
      fetchLeads();
      setUpdateDialogOpen(false);
    } catch (error: any) {
      console.error('Error updating lead:', error);
      toast({
        title: "Error",
        description: error.response?.data?.message || "Failed to update lead",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpdateLeadClick = (lead: Lead) => {
    setSelectedLead(lead);
    updateForm.setValue('status', lead.status as any);
    updateForm.setValue('notes', '');
    setUpdateDialogOpen(true);
  };

  const filteredLeads = leads.filter((lead) =>
    `${lead.firstName} ${lead.lastName}`.toLowerCase().includes(searchQuery.toLowerCase()) ||
    lead.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    lead.phone?.includes(searchQuery) ||
    lead.status.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'VERIFIED':
      case 'ID_VERIFIED':
        return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400';
      case 'REJECTED':
      case 'REJECTED_BY_CLIENT':
        return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400';
      case 'PENDING':
      case 'WAITING_ID':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400';
      case 'PAID':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-400';
    }
  };

  const formatDate = (dateString: string) => {
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    }).format(new Date(dateString));
  };

  return (
    <DashboardLayout>
      <div className="flex flex-col space-y-6 max-w-6xl mx-auto px-4 md:px-8">
        <div className="flex flex-col md:flex-row justify-between gap-4 md:items-center">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Lead Management</h1>
            <p className="text-muted-foreground">Review and update lead statuses</p>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-6">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Total Leads</p>
                  <h3 className="text-2xl font-bold">{stats.total}</h3>
                </div>
                <div className="p-2 rounded-full bg-blue-100 dark:bg-blue-900/20">
                  <List className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Pending</p>
                  <h3 className="text-2xl font-bold">{stats.pending}</h3>
                </div>
                <div className="p-2 rounded-full bg-yellow-100 dark:bg-yellow-900/20">
                  <BarChart className="h-5 w-5 text-yellow-600 dark:text-yellow-400" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Verified</p>
                  <h3 className="text-2xl font-bold">{stats.verified}</h3>
                </div>
                <div className="p-2 rounded-full bg-green-100 dark:bg-green-900/20">
                  <BarChart className="h-5 w-5 text-green-600 dark:text-green-400" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Rejected</p>
                  <h3 className="text-2xl font-bold">{stats.rejected}</h3>
                </div>
                <div className="p-2 rounded-full bg-red-100 dark:bg-red-900/20">
                  <BarChart className="h-5 w-5 text-red-600 dark:text-red-400" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <Card className="overflow-hidden">
          <CardHeader className="pb-3">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <CardTitle>All Leads</CardTitle>
                <CardDescription>Manage lead statuses and information</CardDescription>
              </div>

              <div className="flex items-center gap-2">
                <div className="relative">
                  <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    type="search"
                    placeholder="Search leads..."
                    className="pl-8 w-full md:w-[260px]"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>

                <Select
                  value={statusFilter}
                  onValueChange={setStatusFilter}
                >
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Filter by status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="All">All Statuses</SelectItem>
                    {LEAD_STATUSES.map((status) => (
                      <SelectItem key={status} value={status}>
                        {status.replace(/_/g, ' ')}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Button
                  variant="ghost"
                  size="icon"
                  onClick={fetchLeads}
                  className="hidden md:flex"
                >
                  <RefreshCw className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </CardHeader>

          <Separator />

          <CardContent className="p-0">
            {loading ? (
              <div className="flex justify-center items-center h-64">
                <div className="text-center">
                  <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto mb-4" />
                  <p className="text-sm text-muted-foreground">Loading leads...</p>
                </div>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Contact</TableHead>
                      <TableHead>Application Type</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Created</TableHead>
                      <TableHead className="w-[80px]">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredLeads.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={6} className="h-24 text-center">
                          {searchQuery || statusFilter ? (
                            <>
                              <p className="text-muted-foreground">No leads match your filters</p>
                              <Button
                                variant="link"
                                onClick={() => {
                                  setSearchQuery('');
                                  setStatusFilter('');
                                }}
                                className="mt-2"
                              >
                                Clear filters
                              </Button>
                            </>
                          ) : (
                            <p className="text-muted-foreground">No leads found</p>
                          )}
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredLeads.map((lead) => (
                        <TableRow key={lead._id.toString()}>
                          <TableCell>
                            <div>
                              <div className="font-medium">{lead.firstName} {lead.lastName}</div>
                              <div className="text-xs text-muted-foreground">
                                ID: {lead._id.substring(lead._id.length - 6).toUpperCase()}
                              </div>
                            </div>
                          </TableCell>

                          <TableCell>
                            <div className="text-sm">
                              {lead.email && <div>{lead.email}</div>}
                              {lead.phone && <div>{lead.phone}</div>}
                            </div>
                          </TableCell>

                          <TableCell>
                            <div className="text-sm">{lead.applicationType || "N/A"}</div>
                          </TableCell>

                          <TableCell>
                            <Badge variant="secondary" className={getStatusColor(lead.status)}>
                              {lead.status.replace(/_/g, ' ')}
                            </Badge>
                          </TableCell>

                          <TableCell>
                            <div className="text-sm">
                              {lead.createdAt ? formatDate(lead.createdAt) : '-'}
                              {lead.createdBy && (
                                <div className="text-xs text-muted-foreground">
                                  by {lead.createdBy.name}
                                </div>
                              )}
                            </div>
                          </TableCell>

                          <TableCell>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon" className="h-8 w-8">
                                  <MoreHorizontal className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuLabel>Actions</DropdownMenuLabel>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem onClick={() => handleUpdateLeadClick(lead)}>
                                  <FileEdit className="mr-2 h-4 w-4" />
                                  Update Status
                                </DropdownMenuItem>
                                {/* // In the actions dropdown menu within the table, add this item: */}
                                <DropdownMenuItem onClick={() => router.push(`/admin/leads/${lead._id}`)}>
                                  <Eye className="mr-2 h-4 w-4" />
                                  View Details
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>

          <CardFooter className="p-4 border-t flex items-center justify-between">
            <div className="text-sm text-muted-foreground">
              {filteredLeads.length} {filteredLeads.length === 1 ? 'lead' : 'leads'}
              {searchQuery && ` matching "${searchQuery}"`}
              {statusFilter && ` with status "${statusFilter}"`}
            </div>
            <Button variant="outline" size="sm" onClick={fetchLeads}>
              <RefreshCw className="mr-2 h-3.5 w-3.5" />
              Refresh
            </Button>
          </CardFooter>
        </Card>

        {/* Update Lead Status Dialog */}
        <Dialog open={updateDialogOpen} onOpenChange={setUpdateDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Update Lead Status</DialogTitle>
              <DialogDescription>
                Change the status for this lead
              </DialogDescription>
            </DialogHeader>

            {selectedLead && (
              <div className="py-2">
                <div className="font-medium">{selectedLead.firstName} {selectedLead.lastName}</div>
                <div className="text-sm text-muted-foreground">{selectedLead.email}</div>
                <div className="mt-2">
                  <Badge variant="secondary" className={getStatusColor(selectedLead.status)}>
                    Current: {selectedLead.status.replace(/_/g, ' ')}
                  </Badge>
                </div>
              </div>
            )}

            <Form {...updateForm}>
              <form onSubmit={updateForm.handleSubmit(onUpdateLead)} className="space-y-4">
                <FormField
                  control={updateForm.control}
                  name="status"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>New Status*</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select status" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {LEAD_STATUSES.map((status) => (
                            <SelectItem key={status} value={status}>
                              {status.replace(/_/g, ' ')}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={updateForm.control}
                  name="notes"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Notes</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Add notes about this status change (optional)"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <DialogFooter>
                  <Button type="submit" disabled={submitting}>
                    {submitting ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Updating...
                      </>
                    ) : (
                      <>
                        <FileEdit className="mr-2 h-4 w-4" />
                        Update Status
                      </>
                    )}
                  </Button>
                </DialogFooter>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
}
