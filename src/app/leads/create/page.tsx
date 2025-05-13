'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import axios from 'axios';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import DashboardLayout from '@/components/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription
} from '@/components/ui/form';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle
} from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import {
  Loader2,
  ArrowLeft,
  User,
  Mail,
  Phone,
  Calendar,
  MapPin,
  FileText,
  BookOpen,
  ClipboardList,
  Check,
  AlertCircle
} from 'lucide-react';
import { toast } from '@/components/ui/use-toast';
import { LeadStatus } from '@/types';
import { motion } from 'framer-motion';
import { DYNAMIC_FIELDS } from '@/lib/dynamic-fields';

const APPLICATION_TYPES = Object.keys(DYNAMIC_FIELDS);

// Removing status from the required form fields since it will be set automatically
const formSchema = z.object({
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
  email: z.string().email('Invalid email address'),
  phone: z.string().min(10, 'Phone number must be at least 10 digits'),
  dateOfBirth: z.string().refine(val => !val || !isNaN(Date.parse(val)), {
    message: 'Invalid date format',
  }),
  address: z.string().optional(),
  applicationType: z.string().min(1, 'Application type is required'),
  lawsuit: z.string().optional(),
  notes: z.string().optional(),
});

type FormValues = z.infer<typeof formSchema>;

export default function CreateLeadPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [selectedType, setSelectedType] = useState<string>('');
  const [dynamicFields, setDynamicFields] = useState<Record<string, string>>({});

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      firstName: '',
      lastName: '',
      email: '',
      phone: '',
      dateOfBirth: '',
      address: '',
      applicationType: '',
      lawsuit: '',
      notes: '',
    },
  });

  const onSubmit = async (values: FormValues) => {
    setLoading(true);
    try {
      // Log what's being sent to the API for debugging
      console.log("Submitting form with values:", {
        ...values,
        fields: dynamicFields,
        status: 'PENDING',
      });

      const response = await axios.post('/api/leads', {
        ...values,
        fields: dynamicFields,
        status: 'PENDING', // Always set status to PENDING
      });

      console.log("API response:", response.data);

      setSubmitted(true);
      toast({ title: 'Success', description: 'Lead created successfully' });
      setTimeout(() => router.push('/leads'), 1500);
    } catch (error: any) {
      console.error('Error creating lead:', error);
      toast({
        title: 'Error',
        description: error.response?.data?.message || 'Failed to create Lead',
        variant: 'destructive'
      });
      setLoading(false);
    }
  };

  const handleDynamicFieldChange = (key: string, value: string) => {
    console.log(`Setting dynamic field ${key} to ${value}`);
    setDynamicFields(prev => ({ ...prev, [key]: value }));
  };

  const renderDynamicFields = () => {
    const fields = DYNAMIC_FIELDS[selectedType] || [];
    return fields.map(field => (
      <FormItem key={field.key}>
        <FormLabel>{field.label}</FormLabel>
        <FormControl>
          {field.type === 'text' || field.type === 'date' ? (
            <Input
              type={field.type}
              value={dynamicFields[field.key] || ''}
              onChange={e => handleDynamicFieldChange(field.key, e.target.value)}
              placeholder={`Enter ${field.label.toLowerCase()}`}
            />
          ) : (
            <Select
              value={dynamicFields[field.key] || ''}
              onValueChange={val => handleDynamicFieldChange(field.key, val)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Yes">Yes</SelectItem>
                <SelectItem value="No">No</SelectItem>
              </SelectContent>
            </Select>
          )}
        </FormControl>
        {/* {field.description && <FormDescription>{field.description}</FormDescription>} */}
      </FormItem>
    ));
  };

  if (submitted) {
    return (
      <DashboardLayout>
        <div className="flex justify-center items-center h-[calc(100vh-6rem)]">
          <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="text-center max-w-md">
            <div className="bg-green-100 dark:bg-green-900/20 p-3 rounded-full w-16 h-16 mx-auto mb-6 flex items-center justify-center">
              <Check className="h-8 w-8 text-green-600 dark:text-green-400" />
            </div>
            <h2 className="text-2xl font-semibold mb-2">Lead Created Successfully</h2>
            <p className="text-muted-foreground mb-6">Your new Lead has been created and is now in the system.</p>
            <div className="flex gap-3 justify-center">
              <Button onClick={() => router.push('/leads')}>View All Leads</Button>
              <Button variant="outline" onClick={() => { form.reset(); setSubmitted(false); setDynamicFields({}); }}>Create Another</Button>
            </div>
          </motion.div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <Button variant="outline" size="icon" onClick={() => router.back()} className="h-9 w-9">
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Create New Lead</h1>
            <p className="text-muted-foreground">Enter client information to create a new Lead</p>
          </div>
        </div>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* Base Details */}
            <Card>
              <CardHeader>
                <div className="flex items-center space-x-2">
                  <User className="h-5 w-5 text-muted-foreground" />
                  <CardTitle>Client Information</CardTitle>
                </div>
              </CardHeader>
              <Separator />
              <CardContent className="pt-6 grid grid-cols-1 md:grid-cols-2 gap-6">
                {['firstName', 'lastName', 'email', 'phone', 'dateOfBirth', 'address'].map(fieldName => (
                  <FormField key={fieldName} control={form.control} name={fieldName as keyof FormValues} render={({ field }) => (
                    <FormItem>
                      <FormLabel>{fieldName === 'dateOfBirth' ? 'Date of Birth' :
                        fieldName.charAt(0).toUpperCase() + fieldName.slice(1)}</FormLabel>
                      <FormControl>
                        <Input type={fieldName === 'email' ? 'email' : fieldName === 'dateOfBirth' ? 'date' : 'text'} {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                ))}
              </CardContent>
            </Card>

            {/* Application Type + Status */}
            <Card>
              <CardHeader>
                <div className="flex items-center space-x-2">
                  <ClipboardList className="h-5 w-5 text-muted-foreground" />
                  <CardTitle>Lead Details</CardTitle>
                </div>
              </CardHeader>
              <Separator />
              <CardContent className="pt-6 grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField control={form.control} name="applicationType" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Application Type*</FormLabel>
                    <Select
                      onValueChange={(val) => {
                        field.onChange(val);
                        setSelectedType(val);
                        // Clear dynamic fields when application type changes
                        setDynamicFields({});
                      }}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger><SelectValue placeholder="Select application type" /></SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {APPLICATION_TYPES.map(type => <SelectItem key={type} value={type}>{type}</SelectItem>)}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )} />

                {/* Replace status dropdown with informational display */}
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <AlertCircle className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm font-medium">Status</span>
                  </div>
                  <div className="flex items-center h-10 px-3 py-2 rounded-md border border-input bg-background text-sm">
                    <span className="text-muted-foreground mr-2">Default:</span>
                    <span className="font-medium">PENDING</span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">Status is set to PENDING by default and can only be updated by an admin.</p>
                </div>

                <FormField control={form.control} name="lawsuit" render={({ field }) => (
                  <FormItem className="col-span-2">
                    <FormLabel>Lawsuit (if applicable)</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="Enter lawsuit information if relevant" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )} />

                <FormField control={form.control} name="notes" render={({ field }) => (
                  <FormItem className="col-span-2">
                    <FormLabel>Notes</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Add any additional notes about this lead"
                        {...field}
                        className="min-h-[100px]"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
              </CardContent>
            </Card>

            {/* Dynamic Fields */}
            {selectedType && DYNAMIC_FIELDS[selectedType] && (
              <Card>
                <CardHeader>
                  <CardTitle>Additional Questions for {selectedType}</CardTitle>
                  <CardDescription>These questions are specific to the selected application type</CardDescription>
                </CardHeader>
                <Separator />
                <CardContent className="pt-6 grid grid-cols-1 md:grid-cols-2 gap-6">
                  {renderDynamicFields()}
                </CardContent>
                <CardFooter className="flex justify-start border-t p-6">
                  <div className="text-sm text-muted-foreground">
                    <p>All fields are optional but help provide a complete profile.</p>
                  </div>
                </CardFooter>
              </Card>
            )}

            <CardFooter className="flex justify-between border-t p-6">
              <Button type="button" variant="outline" onClick={() => router.back()}>Cancel</Button>
              <Button type="submit" disabled={loading} className="min-w-[150px]">
                {loading ? (
                  <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Creating...</>
                ) : (
                  <><Check className="mr-2 h-4 w-4" />Create Lead</>
                )}
              </Button>
            </CardFooter>
          </form>
        </Form>
      </div>
    </DashboardLayout>
  );
}
