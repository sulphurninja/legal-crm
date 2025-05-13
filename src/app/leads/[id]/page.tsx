'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import axios from 'axios';
import { format } from 'date-fns';
import DashboardLayout from '@/components/DashboardLayout';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardFooter,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage
} from '@/components/ui/form';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/ui/table';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import {
  Loader2,
  ArrowLeft,
  History,
  Clock,
  Edit,
  Mail,
  Phone,
  Calendar,
  MapPin,
  FileText,
  BookOpen,
  User,
  CheckCircle,
  XCircle,
  AlertTriangle,
  ChevronRight,
  ChevronDown,
  MoreHorizontal,
  UserCircle,
  FileSpreadsheet,
  ActivitySquare,
  ClipboardList,
  Share2
} from 'lucide-react';
import { toast } from '@/components/ui/use-toast';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { LeadType, LeadStatus, StatusHistoryItem } from '@/types';
import { motion, AnimatePresence } from 'framer-motion';

const LEAD_STATUSES: LeadStatus[] = [
  'PENDING', 'REJECTED', 'VERIFIED', 'REJECTED_BY_CLIENT', 'PAID',
  'DUPLICATE', 'NOT_RESPONDING', 'FELONY', 'DEAD_LEAD', 'WORKING',
  'CALL_BACK', 'ATTEMPT_1', 'ATTEMPT_2', 'ATTEMPT_3', 'ATTEMPT_4',
  'CHARGEBACK', 'WAITING_ID', 'SENT_CLIENT', 'QC', 'ID_VERIFIED'
];

// Status color mapping with professional colors
const STATUS_CONFIG: Record<string, { bg: string, text: string, icon: JSX.Element, description: string }> = {
  PENDING: {
    bg: 'bg-amber-50 dark:bg-amber-950/30',
    text: 'text-amber-700 dark:text-amber-400',
    icon: <Clock className="h-4 w-4" />,
    description: 'Lead is awaiting initial review'
  },
  REJECTED: {
    bg: 'bg-red-50 dark:bg-red-950/30',
    text: 'text-red-700 dark:text-red-400',
    icon: <XCircle className="h-4 w-4" />,
    description: 'Lead has been rejected'
  },
  VERIFIED: {
    bg: 'bg-emerald-50 dark:bg-emerald-950/30',
    text: 'text-emerald-700 dark:text-emerald-400',
    icon: <CheckCircle className="h-4 w-4" />,
    description: 'Lead has been verified and approved'
  },
  WORKING: {
    bg: 'bg-blue-50 dark:bg-blue-950/30',
    text: 'text-blue-700 dark:text-blue-400',
    icon: <ActivitySquare className="h-4 w-4" />,
    description: 'Lead is currently being worked on'
  },
  CALL_BACK: {
    bg: 'bg-purple-50 dark:bg-purple-950/30',
    text: 'text-purple-700 dark:text-purple-400',
    icon: <Phone className="h-4 w-4" />,
    description: 'Client needs to be called back'
  },
  // ...other statuses
};

// Default configuration for statuses that don't have specific settings
const DEFAULT_STATUS = {
  bg: 'bg-slate-50 dark:bg-slate-950/30',
  text: 'text-slate-700 dark:text-slate-400',
  icon: <FileText className="h-4 w-4" />,
  description: 'Status of the current Lead'
};

const statusUpdateSchema = z.object({
  status: z.string().min(1, 'Status is required'),
  notes: z.string().optional(),
});

type StatusUpdateFormValues = z.infer<typeof statusUpdateSchema>;

export default function LeadDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const [lead, setLead] = useState<LeadType | null>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [statusDialogOpen, setStatusDialogOpen] = useState(false);
  const [expandedHistory, setExpandedHistory] = useState(false);
  const [activeTab, setActiveTab] = useState("overview");
  const [dynamicFields, setDynamicFields] = useState<Record<string, string>>({});

  const form = useForm<StatusUpdateFormValues>({
    resolver: zodResolver(statusUpdateSchema),
    defaultValues: {
      status: '',
      notes: '',
    },
  });

  useEffect(() => {
    fetchLead();
  }, [id]);

  const fetchLead = async () => {
    setLoading(true);
    try {
      const { data } = await axios.get(`/api/leads/${id}`);
      setLead(data.lead);

      // Process dynamic fields based on the structure from the API
      processDynamicFields(data.lead);

      // Set the current status as the default value in the form
      form.setValue('status', data.lead.status);
    } catch (error) {
      console.error('Error fetching lead:', error);
      toast({
        title: "Error",
        description: "Failed to load Lead details",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // Process the dynamic fields from the lead data
  const processDynamicFields = (leadData: any) => {
    if (!leadData || !leadData.fields) {
      setDynamicFields({});
      return;
    }

    let processedFields: Record<string, string> = {};

    // Handle array structure of fields (from MongoDB schema)
    if (Array.isArray(leadData.fields)) {
      leadData.fields.forEach((field: any) => {
        if (field && typeof field === 'object' && 'key' in field && 'value' in field) {
          processedFields[field.key] = field.value;
        }
      });
    }
    // Handle object structure (possibly transformed in API)
    else if (typeof leadData.fields === 'object') {
      processedFields = { ...leadData.fields };
    }

    setDynamicFields(processedFields);
  };

  const onUpdateStatus = async (values: StatusUpdateFormValues) => {
    if (!lead) return;

    if (values.status === lead.status) {
      toast({
        title: "Info",
        description: "The status is unchanged",
      });
      setStatusDialogOpen(false);
      return;
    }

    setUpdating(true);
    try {
      const { data } = await axios.put(`/api/leads/${id}`, {
        status: values.status,
        statusNote: values.notes,
      });

      setLead(data.lead);
      // Re-process dynamic fields in case they've been updated
      processDynamicFields(data.lead);

      toast({
        title: "Success",
        description: "Lead status updated successfully",
      });
      setStatusDialogOpen(false);
    } catch (error: any) {
      console.error('Error updating lead status:', error);
      toast({
        title: "Error",
        description: error.response?.data?.message || "Failed to update Lead status",
        variant: "destructive",
      });
    } finally {
      setUpdating(false);
    }
  };

  // Get status style
  const getStatusStyle = (status: LeadStatus) => {
    return STATUS_CONFIG[status] || DEFAULT_STATUS;
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex justify-center items-center h-[calc(100vh-6rem)]">
          <div className="text-center">
            <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto mb-4" />
            <p className="text-muted-foreground">Loading Lead details...</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  if (!lead) {
    return (
      <DashboardLayout>
        <div className="flex justify-center items-center h-[calc(100vh-6rem)]">
          <div className="text-center max-w-md">
            <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4 opacity-30" />
            <h2 className="text-xl font-semibold mb-2">Lead Not Found</h2>
            <p className="text-muted-foreground mb-6">
              The requested Lead could not be found or you don't have permission to view it.
            </p>
            <Button onClick={() => router.push('/leads')}>
              View All Leads
            </Button>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  const statusStyle = getStatusStyle(lead.status);
  const hasDynamicFields = Object.keys(dynamicFields).length > 0;

  return (
    <DashboardLayout>
      <div className="max-w-7xl mx-auto">
        {/* Header Section */}
        <div className="bg-white dark:bg-slate-950 rounded-lg border shadow-sm mb-6 overflow-hidden">
          <div className="p-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => router.back()}
                  className="h-9 w-9 shrink-0"
                >
                  <ArrowLeft className="h-4 w-4" />
                </Button>

                <div>
                  <h1 className="text-2xl font-bold tracking-tight">
                    {lead.firstName} {lead.lastName}
                  </h1>
                  <div className="flex flex-wrap items-center gap-2 mt-1">
                    <Badge
                      variant="secondary"
                      className={`${statusStyle.bg} ${statusStyle.text}`}
                    >
                      <div className="flex items-center gap-1.5">
                        {React.createElement(statusStyle.icon.type, {
                          className: "h-3.5 w-3.5"
                        })}
                        <span>{lead.status.replace(/_/g, ' ')}</span>
                      </div>
                    </Badge>
                    <span className="text-sm text-muted-foreground">
                      Lead #{typeof lead._id === 'string' ? lead._id.substring(lead._id.length - 6).toUpperCase() : String(lead._id).substring(String(lead._id).length - 6).toUpperCase()}
                    </span>
                    <span className="text-sm text-muted-foreground">
                      Created {format(new Date(lead.createdAt), 'MMM d, yyyy')}
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex flex-wrap gap-2 sm:self-start">
                <Button variant="outline" size="sm" onClick={() => router.push('/leads')}>
                  <Share2 className="mr-1 h-3.5 w-3.5" />
                  All Leads
                </Button>

                {user?.role === "admin" && (
                  <Dialog open={statusDialogOpen} onOpenChange={setStatusDialogOpen}>
                    <DialogTrigger asChild>
                      <Button size="sm">
                        <Edit className="mr-1 h-3.5 w-3.5" />
                        Update Status
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Update Lead Status</DialogTitle>
                        <DialogDescription>
                          Change the status of this Lead and add notes for the record.
                        </DialogDescription>
                      </DialogHeader>

                      <Form {...form}>
                        <form onSubmit={form.handleSubmit(onUpdateStatus)} className="space-y-4">
                          <FormField
                            control={form.control}
                            name="status"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Status*</FormLabel>
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
                                    {LEAD_STATUSES.map((status) => {
                                      const style = getStatusStyle(status);
                                      return (
                                        <SelectItem key={status} value={status}>
                                          <div className="flex items-center gap-2">
                                            <div className={`w-2 h-2 rounded-full ${style.bg} ${style.text}`}></div>
                                            <span>{status.replace(/_/g, ' ')}</span>
                                          </div>
                                        </SelectItem>
                                      );
                                    })}
                                  </SelectContent>
                                </Select>
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                          <FormField
                            control={form.control}
                            name="notes"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Notes</FormLabel>
                                <FormControl>
                                  <Textarea
                                    {...field}
                                    placeholder="Add notes about this status change"
                                    className="min-h-[120px] resize-none"
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                          <DialogFooter>
                            <Button type="submit" disabled={updating}>
                              {updating ? (
                                <>
                                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                  Updating...
                                </>
                              ) : (
                                'Update Status'
                              )}
                            </Button>
                          </DialogFooter>
                        </form>
                      </Form>
                    </DialogContent>
                  </Dialog>
                )}
              </div>
            </div>
          </div>

          {/* Tabs Navigation */}
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <div className="">
              <div className="px-2">
                <TabsList className="h-14 bg-transparent">
                  <TabsTrigger className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none px-4" value="overview">
                    <User className="h-4 w-4 mr-2" />
                    Overview
                  </TabsTrigger>
                  <TabsTrigger className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none px-4" value="history">
                    <History className="h-4 w-4 mr-2" />
                    Status History
                  </TabsTrigger>
                  {hasDynamicFields && (
                    <TabsTrigger className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none px-4" value="additional">
                      <FileSpreadsheet className="h-4 w-4 mr-2" />
                      Additional Fields
                    </TabsTrigger>
                  )}
                </TabsList>
              </div>
            </div>

            {/* Tab Contents */}
            <div className="p-6">
              <TabsContent value="overview" className="m-0">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  {/* Left column: Basic Info */}
                  <Card className="lg:col-span-2 border-0 shadow-none">
                    <CardHeader className="px-0 pb-3">
                      <div className="flex items-center space-x-2">
                        <UserCircle className="h-5 w-5 text-muted-foreground" />
                        <CardTitle>Client Information</CardTitle>
                      </div>
                    </CardHeader>
                    <Separator />
                    <CardContent className="px-0 pt-6">
                      <div className="grid grid-cols-1 md:grid-cols-1 gap-6">
                        <div className="space-y-1">
                          <div className="flex items-center text-sm font-medium text-muted-foreground">
                            <User className="h-4 w-4 mr-2" />
                            Full Name
                          </div>
                          <p className="text-base">{lead.firstName} {lead.lastName}</p>
                        </div>

                        <div className="space-y-1">
                          <div className="flex items-center text-sm font-medium text-muted-foreground">
                            <Mail className="h-4 w-4 mr-2" />
                            Email Address
                          </div>
                          <p className="text-base">{lead.email || 'Not provided'}</p>
                        </div>

                        <div className="space-y-1">
                          <div className="flex items-center text-sm font-medium text-muted-foreground">
                            <Phone className="h-4 w-4 mr-2" />
                            Phone Number
                          </div>
                          <p className="text-base">{lead.phone || 'Not provided'}</p>
                        </div>

                        <div className="space-y-1">
                          <div className="flex items-center text-sm font-medium text-muted-foreground">
                            <Calendar className="h-4 w-4 mr-2" />
                            Date of Birth
                          </div>
                          <p className="text-base">
                            {lead.dateOfBirth ? format(new Date(lead.dateOfBirth), 'MMMM d, yyyy') : 'Not provided'}
                          </p>
                        </div>

                        <div className="space-y-1">
                          <div className="flex items-center text-sm font-medium text-muted-foreground">
                            <MapPin className="h-4 w-4 mr-2" />
                            Address
                          </div>
                          <p className="text-base">{lead.address || 'Not provided'}</p>
                        </div>

                        <div className="space-y-1">
                          <div className="flex items-center text-sm font-medium text-muted-foreground">
                            <ClipboardList className="h-4 w-4 mr-2" />
                            Application Type
                          </div>
                          <p className="text-base">{lead.applicationType || 'Not specified'}</p>
                        </div>

                        <div className="space-y-1">
                          <div className="flex items-center text-sm font-medium text-muted-foreground">
                            <BookOpen className="h-4 w-4 mr-2" />
                            Lawsuit
                          </div>
                          <p className="text-base">{lead.lawsuit || 'Not specified'}</p>
                        </div>

                        <div className="space-y-1">
                          <div className="flex items-center text-sm font-medium text-muted-foreground">
                            <User className="h-4 w-4 mr-2" />
                            Created By
                          </div>
                          <p className="text-base">
                            {typeof lead.createdBy === 'object' && lead.createdBy && 'name' in lead.createdBy
                              ? lead.createdBy.name
                              : 'Unknown'}
                          </p>
                        </div>
                      </div>

                      {/* Preview of dynamic fields */}
                      {hasDynamicFields && (
                        <div className="mt-8 border-t pt-6">
                          <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center text-sm font-medium">
                              <FileSpreadsheet className="h-4 w-4 mr-2 text-muted-foreground" />
                              Additional Field Highlights
                            </div>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setActiveTab("additional")}
                              className="text-xs"
                            >
                              View All Fields
                              <ChevronRight className="ml-1 h-3 w-3" />
                            </Button>
                          </div>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {Object.entries(dynamicFields).slice(0, 4).map(([key, value]) => (
                              <div key={key} className="border rounded-md p-3 bg-muted/10">
                                <div className="text-xs font-medium text-muted-foreground">{key}</div>
                                <div className="font-medium mt-1">{value || 'Not provided'}</div>
                              </div>
                            ))}
                            {Object.keys(dynamicFields).length > 4 && (
                              <div className="md:col-span-2 text-center text-sm text-muted-foreground pt-2">
                                <span
                                  className="cursor-pointer hover:text-primary transition-colors"
                                  onClick={() => setActiveTab("additional")}
                                >
                                  + {Object.keys(dynamicFields).length - 4} more fields
                                </span>
                              </div>
                            )}
                          </div>
                        </div>
                      )}

                      <div className="mt-8">
                        <div className="flex items-center text-sm font-medium text-muted-foreground mb-3">
                          <FileText className="h-4 w-4 mr-2" />
                          Notes
                        </div>
                        <div className="bg-muted/40 rounded-md p-4 min-h-[100px]">
                          {lead.notes ? (
                            <p className="whitespace-pre-line">{lead.notes}</p>
                          ) : (
                            <p className="text-muted-foreground italic">No notes have been added to this Lead.</p>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Right column: Lead Details & Status */}
                  <div className="space-y-6">
                    <Card className="border-0 shadow-none">
                      <CardHeader className="px-0 pb-3">
                        <div className="flex items-center space-x-2">
                          <ActivitySquare className="h-5 w-5 text-muted-foreground" />
                          <CardTitle>Lead Status</CardTitle>
                        </div>
                      </CardHeader>
                      <Separator />
                      <CardContent className="px-0 pt-6">
                        <div className={`p-4 rounded-md ${statusStyle.bg} mb-4`}>
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <div className={`p-2 rounded-full ${statusStyle.bg} ${statusStyle.text}`}>
                                {React.createElement(statusStyle.icon.type, {
                                  className: "h-5 w-5"
                                })}
                              </div>
                              <div>
                                <div className={`font-medium ${statusStyle.text}`}>
                                  {lead.status.replace(/_/g, ' ')}
                                </div>
                                <div className="text-sm text-muted-foreground">
                                  {statusStyle.description}
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>

                        <div className="space-y-4">
                          <div className="border rounded-md overflow-hidden">
                            <div className="bg-muted/50 px-4 py-2 text-sm font-medium">
                              Lead Timeline
                            </div>
                            <div className="divide-y">
                              <div className="flex items-center justify-between px-4 py-3">
                                <div className="text-sm font-medium">Created On</div>
                                <div className="text-sm">{format(new Date(lead.createdAt), 'MMM d, yyyy')}</div>
                              </div>
                              <div className="flex items-center justify-between px-4 py-3">
                                <div className="text-sm font-medium">Last Updated</div>
                                <div className="text-sm">
                                  {lead.statusHistory && lead.statusHistory.length > 0
                                    ? format(new Date(lead.statusHistory[lead.statusHistory.length - 1].timestamp), 'MMM d, yyyy')
                                    : format(new Date(lead.createdAt), 'MMM d, yyyy')}
                                </div>
                              </div>
                              <div className="flex items-center justify-between px-4 py-3">
                                <div className="text-sm font-medium">Status Changes</div>
                                <div className="text-sm font-medium">
                                  {lead.statusHistory ? lead.statusHistory.length : 0}
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="history" className="m-0">
                <Card className="border-0 shadow-none">
                  <CardHeader className="px-0 pb-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <History className="h-5 w-5 text-muted-foreground" />
                        <CardTitle>Status History</CardTitle>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setExpandedHistory(!expandedHistory)}
                        className="gap-1"
                      >
                        {expandedHistory ? 'Show Less' : 'Show All'}
                        <ChevronDown className={`h-4 w-4 transition-transform ${expandedHistory ? 'rotate-180' : ''}`} />
                      </Button>
                    </div>
                  </CardHeader>
                  <Separator />
                  <CardContent className="px-0 pt-6">
                    {lead.statusHistory && lead.statusHistory.length > 0 ? (
                      <div className="relative pl-6">
                        {/* Timeline */}
                        <div className="absolute top-0 bottom-0 left-3 w-0.5 bg-slate-200 dark:bg-slate-700" />

                        {/* Timeline Items */}
                        <div className="space-y-6">
                          {(expandedHistory ? [...lead.statusHistory].reverse() : [...lead.statusHistory].reverse().slice(0, 5)).map((history, index) => {
                            const toStatus = history.toStatus as LeadStatus;
                            const fromStatus = history.fromStatus as LeadStatus || 'NEW';
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
                                        {history.fromStatus || 'New'}
                                      </Badge>
                                      <ChevronRight className="h-3 w-3 text-muted-foreground mx-1" />
                                      <Badge
                                        className={`${toStatusStyle.bg} ${toStatusStyle.text}`}
                                      >
                                        {history.toStatus}
                                      </Badge>
                                    </div>
                                    <div className="text-sm text-muted-foreground">
                                      {format(new Date(history.timestamp), 'MMM d, yyyy h:mm a')}
                                    </div>
                                  </div>

                                  {history.notes && (
                                <div className="mt-2 text-sm border-l-2 border-slate-200 dark:border-slate-700 pl-3 py-1">
                                      {history.notes}
                                    </div>
                                  )}

                                  <div className="mt-3 text-xs text-muted-foreground flex items-center">
                                    <span className="bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded">
                                      Changed by: {typeof history.changedBy === 'object' && history.changedBy && 'name' in history.changedBy
                                        ? history.changedBy.name
                                        : 'Unknown'}
                                    </span>
                                  </div>
                                </div>
                              </motion.div>
                            );
                          })}
                        </div>

                        {!expandedHistory && lead.statusHistory.length > 5 && (
                          <Button
                            variant="outline"
                            className="mt-4 w-full"
                            onClick={() => setExpandedHistory(true)}
                          >
                            View All {lead.statusHistory.length} Status Changes
                            <ChevronDown className="ml-2 h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    ) : (
                      <div className="text-center py-12 text-muted-foreground">
                        <History className="h-12 w-12 mx-auto mb-3 opacity-30" />
                        <p>No status history available</p>
                        <p className="text-sm">This Lead has not had any status changes yet.</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              {hasDynamicFields && (
                <TabsContent value="additional" className="m-0">
                  <Card className="border-0 shadow-none">
                    <CardHeader className="px-0 pb-3">
                      <div className="flex items-center space-x-2">
                        <FileSpreadsheet className="h-5 w-5 text-muted-foreground" />
                        <CardTitle>Additional Information</CardTitle>
                      </div>
                    </CardHeader>
                    <Separator />
                    <CardContent className="px-0 pt-6">
                      <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-x-6 gap-y-4">
                        {Object.entries(dynamicFields).map(([key, value]) => (
                          <div key={key} className="space-y-1.5 bg-muted/30 p-4 rounded-md border">
                            <div className="text-sm font-medium text-muted-foreground">{key}</div>
                            <div className="font-medium">{value || 'Not provided'}</div>
                          </div>
                        ))}
                      </div>

                      <div className="mt-8 flex justify-between items-center">
                        <div className="text-sm text-muted-foreground">
                          <FileSpreadsheet className="h-4 w-4 inline mr-1" />
                          {Object.keys(dynamicFields).length} additional fields for {lead.applicationType}
                        </div>

                        {/* Optional button for exporting or other actions */}
                        <Button variant="outline" size="sm">
                          <FileText className="h-3.5 w-3.5 mr-1" />
                          Export Data
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>
              )}
            </div>
          </Tabs>
        </div>

        {/* Summary Card: Quick Info */}
        <div className="grid grid-cols-1 md:grid-cols-1 gap-4 mb-6">
          <Card className="bg-white dark:bg-slate-950">
            <CardContent className="p-0">
              <div className="flex flex-col sm:flex-row border-b">
                <div className="py-4 px-6 flex-1 flex items-center sm:border-r">
                  <div className="mr-3 p-2 rounded-full bg-blue-50 dark:bg-blue-900/20">
                    <Phone className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div>
                    <div className="text-xs text-muted-foreground">Phone</div>
                    <div className="font-medium">
                      {lead.phone || 'Not provided'}
                    </div>
                  </div>
                </div>
                <div className="py-4 px-6 flex-1 flex items-center">
                  <div className="mr-3 p-2 rounded-full bg-emerald-50 dark:bg-emerald-900/20">
                    <Mail className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                  </div>
                  <div>
                    <div className="text-xs text-muted-foreground">Email</div>
                    <div className="font-medium truncate max-w-[180px]">
                      {lead.email || 'Not provided'}
                    </div>
                  </div>
                </div>
              </div>
              <div className="flex flex-col sm:flex-row">
                <div className="py-4 px-6 flex-1 flex items-center sm:border-r">
                  <div className="mr-3 p-2 rounded-full bg-purple-50 dark:bg-purple-900/20">
                    <Calendar className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                  </div>
                  <div>
                    <div className="text-xs text-muted-foreground">Created</div>
                    <div className="font-medium">
                      {format(new Date(lead.createdAt), 'MMMM d, yyyy')}
                    </div>
                  </div>
                </div>
                <div className="py-4 px-6 flex-1 flex items-center">
                  <div className="mr-3 p-2 rounded-full bg-amber-50 dark:bg-amber-900/20">
                    <ClipboardList className="h-5 w-5 text-amber-600 dark:text-amber-400" />
                  </div>
                  <div>
                    <div className="text-xs text-muted-foreground">Type</div>
                    <div className="font-medium">
                      {lead.applicationType || 'Not specified'}
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="md:col-span-2 bg-white dark:bg-slate-950">
            <CardContent className="p-0">
              <div className="flex flex-col md:flex-row h-full">
                <div className="py-4 px-6 flex-1 flex items-center md:border-r">
                  <div className="w-full">
                    <div className="flex items-center justify-between mb-2">
                      <div className="text-xs text-muted-foreground">Status Timeline</div>
                      <div className="text-xs font-medium">
                        {lead.statusHistory ? lead.statusHistory.length : 0} changes
                      </div>
                    </div>
                    <div className="relative h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                      <div
                        className="absolute left-0 top-0 h-full bg-blue-500 dark:bg-blue-600"
                        style={{ width: `${lead.statusHistory ? Math.min(100, lead.statusHistory.length * 10) : 0}%` }}
                      ></div>
                    </div>
                    <div className="flex justify-between mt-2 text-xs text-muted-foreground">
                      <div>Created</div>
                      <div>Latest: {lead.statusHistory && lead.statusHistory.length > 0
                        ? lead.statusHistory[lead.statusHistory.length - 1].toStatus
                        : 'PENDING'}
                      </div>
                    </div>
                  </div>
                </div>
                <div className="py-4 px-6 flex-1 flex items-center">
                  <div className="w-full">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <div className={`w-2 h-2 rounded-full ${statusStyle.text}`}></div>
                        <div className="text-xs text-muted-foreground">Current Status</div>
                      </div>
                      <div className="text-xs font-medium">
                        {format(
                          lead.statusHistory && lead.statusHistory.length > 0
                            ? new Date(lead.statusHistory[lead.statusHistory.length - 1].timestamp)
                            : new Date(lead.createdAt),
                          'MMM d, yyyy'
                        )}
                      </div>
                    </div>
                    <div className={`p-3 rounded-md ${statusStyle.bg} ${statusStyle.text}`}>
                      <div className="flex items-center">
                        {React.createElement(statusStyle.icon.type, {
                          className: "h-4 w-4 mr-2"
                        })}
                        <span className="font-medium">{lead.status.replace(/_/g, ' ')}</span>
                      </div>
                      <div className="text-xs text-muted-foreground mt-1">
                        {statusStyle.description}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Dynamic Fields Summary Card (if not using tabs) */}
        {hasDynamicFields && (
          <Card className="mb-6 bg-white dark:bg-slate-950">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <FileSpreadsheet className="h-5 w-5 text-muted-foreground" />
                  <CardTitle>Dynamic Fields</CardTitle>
                </div>
                {Object.keys(dynamicFields).length > 6 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setActiveTab("additional")}
                    className="text-xs"
                  >
                    View All
                    <ChevronRight className="ml-1 h-3.5 w-3.5" />
                  </Button>
                )}
              </div>
            </CardHeader>
            <Separator />
            <CardContent className="pt-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                {Object.entries(dynamicFields).slice(0, 6).map(([key, value]) => (
                  <div key={key} className="flex flex-col p-3 border rounded-md">
                    <div className="text-xs text-muted-foreground mb-1">{key}</div>
                    <div className="font-medium">{value || 'Not provided'}</div>
                  </div>
                ))}
              </div>
              {Object.keys(dynamicFields).length > 6 && (
                <div className="mt-4 text-center">
                  <Button
                    variant="outline"
                    onClick={() => setActiveTab("additional")}
                    className="w-full"
                  >
                    Show All {Object.keys(dynamicFields).length} Fields
                    <ChevronDown className="ml-2 h-4 w-4" />
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Actions Footer */}
        <Card className="bg-white dark:bg-slate-950">
          <CardContent className="p-4">
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
              <div className="text-sm text-muted-foreground">
                Lead ID: <span className="font-mono">{typeof lead._id === 'string' ? lead._id : String(lead._id)}</span>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={() => router.back()}>
                  Go Back
                </Button>
                {user?.role === "admin" && !statusDialogOpen && (
                  <Button size="sm" onClick={() => setStatusDialogOpen(true)}>
                    <Edit className="mr-1 h-3.5 w-3.5" />
                    Update Status
                  </Button>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
