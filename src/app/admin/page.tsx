'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
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
  DialogTrigger
} from '@/components/ui/dialog';
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
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Checkbox } from "@/components/ui/checkbox";
import {
  Avatar,
  AvatarFallback
} from '@/components/ui/avatar';
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
  Plus,
  UserPlus,
  UserCog,
  Search,
  Clipboard,
  MoreHorizontal,
  Shield,
  UserX,
  Mail,
  RefreshCw,
  Users,
  Settings,
  LogOut,
  Eye,
  KeyRound,
  Power,
  Check,
  Lock,
  Edit,
  AlertTriangle,
  Building
} from 'lucide-react';
import { toast } from '@/components/ui/use-toast';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import DashboardLayout from '@/components/DashboardLayout';
import { UserRole } from '@/types';

// Define the Organization type
type Organization = {
  _id: string;
  name: string;
  description?: string;
  active: boolean;
  createdAt: string;
};

// Updated user type to include organization
type UserType = {
  _id: string;
  id: string;
  name: string;
  email: string;
  role: UserRole;
  active: boolean;
  createdAt: string;
  updatedAt: string;
  organizationId?: string;
  organization?: {
    _id: string;
    name: string;
  };
};

// Define the current user type
type CurrentUser = {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  organization?: {
    id: string;
    name: string;
  };
};

const USER_ROLES: UserRole[] = ['agent', 'admin', 'super_admin'];

// Updated schema to include organization for non-super-admin users
const newUserSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  role: z.enum(['agent', 'admin', 'super_admin']),
  organizationId: z.string().optional(),
}).superRefine((data, ctx) => {
  if (data.role !== 'super_admin' && !data.organizationId) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "Organization is required for non-super-admin users",
      path: ['organizationId'],
    });
  }
});

const updateUserSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  email: z.string().email('Invalid email address'),
  role: z.enum(['agent', 'admin', 'super_admin']),
  active: z.boolean(),
  organizationId: z.string().optional(),
}).superRefine((data, ctx) => {
  if (data.role !== 'super_admin' && !data.organizationId) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "Organization is required for non-super-admin users",
      path: ['organizationId'],
    });
  }
});

const updateRoleSchema = z.object({
  role: z.enum(['agent', 'admin', 'super_admin']),
  organizationId: z.string().optional(),
}).superRefine((data, ctx) => {
  if (data.role !== 'super_admin' && !data.organizationId) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "Organization is required for non-super-admin users",
      path: ['organizationId'],
    });
  }
});

const updatePasswordSchema = z.object({
  password: z.string().min(6, 'Password must be at least 6 characters'),
  confirmPassword: z.string(),
}).refine(data => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

// Add schema for organizations
const newOrganizationSchema = z.object({
  name: z.string().min(1, 'Organization name is required'),
  description: z.string().optional(),
  active: z.boolean(),
});

type NewUserFormValues = z.infer<typeof newUserSchema>;
type UpdateUserFormValues = z.infer<typeof updateUserSchema>;
type UpdateRoleFormValues = z.infer<typeof updateRoleSchema>;
type UpdatePasswordFormValues = z.infer<typeof updatePasswordSchema>;
type NewOrganizationFormValues = z.infer<typeof newOrganizationSchema>;

export default function AdminPage() {
  const router = useRouter();
  const [users, setUsers] = useState<UserType[]>([]);
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [currentUser, setCurrentUser] = useState<CurrentUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [createOrgDialogOpen, setCreateOrgDialogOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<UserType | null>(null);
  const [updateDialogOpen, setUpdateDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [passwordDialogOpen, setPasswordDialogOpen] = useState(false);
  const [deactivateDialogOpen, setDeactivateDialogOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [stats, setStats] = useState({
    total: 0,
    admins: 0,
    agents: 0,
    active: 0,
    inactive: 0,
    organizations: 0
  });

  const createForm = useForm<NewUserFormValues>({
    resolver: zodResolver(newUserSchema),
    defaultValues: {
      name: '',
      email: '',
      password: '',
      role: 'agent',
      organizationId: '',
    },
  });

  const createOrgForm = useForm<NewOrganizationFormValues>({
    resolver: zodResolver(newOrganizationSchema),
    defaultValues: {
      name: '',
      description: '',
      active: true,
    } as NewOrganizationFormValues,
  });

  const updateForm = useForm<UpdateRoleFormValues>({
    resolver: zodResolver(updateRoleSchema),
    defaultValues: {
      role: 'agent',
      organizationId: '',
    },
  });

  const editForm = useForm<UpdateUserFormValues>({
    resolver: zodResolver(updateUserSchema),
    defaultValues: {
      name: '',
      email: '',
      role: 'agent',
      active: true,
      organizationId: '',
    },
  });

  const passwordForm = useForm<UpdatePasswordFormValues>({
    resolver: zodResolver(updatePasswordSchema),
    defaultValues: {
      password: '',
      confirmPassword: '',
    },
  });

  useEffect(() => {
    fetchCurrentUser();
    fetchUsers();
    fetchOrganizations();
  }, []);

  // Helper functions to check current user permissions
  const isSuperAdmin = () => currentUser?.role === 'super_admin';

  // Get current logged in user details
  const fetchCurrentUser = async () => {
    try {
      const { data } = await axios.get('/api/auth/me');
      setCurrentUser(data.user);
    } catch (error) {
      console.error('Error fetching current user:', error);
    }
  };

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const { data } = await axios.get('/api/admin/users');
      setUsers(data.users);

      // Calculate stats
      const totalUsers = data.users.length;
      const adminCount = data.users.filter((user: UserType) => user.role === 'admin' || user.role === 'super_admin').length;
      const agentCount = data.users.filter((user: UserType) => user.role === 'agent').length;
      const activeCount = data.users.filter((user: UserType) => user.active).length;
      const inactiveCount = data.users.filter((user: UserType) => !user.active).length;

      setStats(prev => ({
        ...prev,
        total: totalUsers,
        admins: adminCount,
        agents: agentCount,
        active: activeCount,
        inactive: inactiveCount
      }));

    } catch (error) {
      console.error('Error fetching users:', error);
      toast({
        title: "Error",
        description: "Failed to load users",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchOrganizations = async () => {
    try {
      const { data } = await axios.get('/api/admin/organizations');
      setOrganizations(data.organizations);
      setStats(prev => ({
        ...prev,
        organizations: data.organizations.length
      }));
    } catch (error) {
      console.error('Error fetching organizations:', error);
      toast({
        title: "Error",
        description: "Failed to load organizations",
        variant: "destructive",
      });
    }
  };

  const onCreateUser = async (values: NewUserFormValues) => {
    setSubmitting(true);
    try {
      // If current user is not super admin and is creating a user,
      // assign to their organization
      if (!isSuperAdmin() && currentUser?.organization?.id) {
        values.organizationId = currentUser.organization.id;
      }

      // Non-super-admin users should never be able to create super-admin users
      if (!isSuperAdmin() && values.role === 'super_admin') {
        throw new Error('Only super administrators can create super admin users');
      }

      await axios.post('/api/admin/users', values);
      toast({
        title: "Success",
        description: "User created successfully",
      });
      fetchUsers();
      setCreateDialogOpen(false);
      createForm.reset();
    } catch (error: any) {
      console.error('Error creating user:', error);
      toast({
        title: "Error",
        description: error.response?.data?.message || "Failed to create user",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  const onCreateOrganization = async (values: NewOrganizationFormValues) => {
    // Only super admins can create organizations
    if (!isSuperAdmin()) {
      toast({
        title: "Permission Denied",
        description: "Only super administrators can create organizations",
        variant: "destructive",
      });
      return;
    }

    setSubmitting(true);
    try {
      await axios.post('/api/admin/organizations', values);
      toast({
        title: "Success",
        description: "Organization created successfully",
      });
      fetchOrganizations();
      setCreateOrgDialogOpen(false);
      createOrgForm.reset();
    } catch (error: any) {
      console.error('Error creating organization:', error);
      toast({
        title: "Error",
        description: error.response?.data?.message || "Failed to create organization",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  const onUpdateRole = async (values: UpdateRoleFormValues) => {
    if (!selectedUser) return;

    // Check permissions
    if (!isSuperAdmin() && values.role === 'super_admin') {
      toast({
        title: "Permission Denied",
        description: "Only super administrators can assign super admin role",
        variant: "destructive",
      });
      return;
    }

    setSubmitting(true);
    try {
      // Ensure organization is set for non-super-admin roles
      if (values.role !== 'super_admin' && !values.organizationId) {
        if (currentUser?.organization?.id) {
          values.organizationId = currentUser.organization.id;
        } else if (selectedUser.organizationId) {
          values.organizationId = selectedUser.organizationId;
        } else {
          throw new Error('Organization is required for non-super-admin users');
        }
      }

      await axios.put(`/api/admin/users/${selectedUser._id || selectedUser.id}`, values);
      toast({
        title: "Success",
        description: "User role updated successfully",
      });
      fetchUsers();
      setUpdateDialogOpen(false);
    } catch (error: any) {
      console.error('Error updating user role:', error);
      toast({
        title: "Error",
        description: error.response?.data?.message || "Failed to update user role",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  const onUpdateUser = async (values: UpdateUserFormValues) => {
    if (!selectedUser) return;

    // Check permissions
    if (!isSuperAdmin() && values.role === 'super_admin') {
      toast({
        title: "Permission Denied",
        description: "Only super administrators can assign super admin role",
        variant: "destructive",
      });
      return;
    }

    setSubmitting(true);
    try {
      // Ensure organization is set for non-super-admin roles
      if (values.role !== 'super_admin' && !values.organizationId) {
        if (currentUser?.organization?.id) {
          values.organizationId = currentUser.organization.id;
        } else if (selectedUser.organizationId) {
          values.organizationId = selectedUser.organizationId;
        } else {
          throw new Error('Organization is required for non-super-admin users');
        }
      }

      await axios.put(`/api/admin/users/${selectedUser._id || selectedUser.id}`, values);
      toast({
        title: "Success",
        description: "User updated successfully",
      });
      fetchUsers();
      setEditDialogOpen(false);
    } catch (error: any) {
      console.error('Error updating user:', error);
      toast({
        title: "Error",
        description: error.response?.data?.message || "Failed to update user",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  const onUpdatePassword = async (values: UpdatePasswordFormValues) => {
    if (!selectedUser) return;

    setSubmitting(true);
    try {
      await axios.put(`/api/admin/users/${selectedUser._id || selectedUser.id}`, {
        password: values.password
      });
      toast({
        title: "Success",
        description: "User password updated successfully",
      });
      setPasswordDialogOpen(false);
      passwordForm.reset();
    } catch (error: any) {
      console.error('Error updating password:', error);
      toast({
        title: "Error",
        description: error.response?.data?.message || "Failed to update password",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  const onToggleActivation = async () => {
    if (!selectedUser) return;

    setSubmitting(true);
    try {
      await axios.put(`/api/admin/users/${selectedUser._id || selectedUser.id}`, {
        active: !selectedUser.active
      });
      toast({
        title: "Success",
        description: selectedUser.active
          ? "User deactivated successfully"
          : "User activated successfully",
      });
      fetchUsers();
      setDeactivateDialogOpen(false);
    } catch (error: any) {
      console.error('Error toggling user activation:', error);
      toast({
        title: "Error",
        description: error.response?.data?.message || "Failed to update user",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpdateRoleClick = (user: UserType) => {
    setSelectedUser(user);
    updateForm.setValue('role', user.role);
    updateForm.setValue('organizationId', user.organizationId || '');
    setUpdateDialogOpen(true);
  };

  const handleEditUserClick = (user: UserType) => {
    setSelectedUser(user);
    editForm.setValue('name', user.name);
    editForm.setValue('email', user.email);
    editForm.setValue('role', user.role);
    editForm.setValue('active', user.active !== false); // Handle undefined
    editForm.setValue('organizationId', user.organizationId || '');
    setEditDialogOpen(true);
  };

  const handleUpdatePasswordClick = (user: UserType) => {
    setSelectedUser(user);
    passwordForm.reset();
    setPasswordDialogOpen(true);
  };

  const handleToggleActivation = (user: UserType) => {
    setSelectedUser(user);
    setDeactivateDialogOpen(true);
  };

  const copyEmailToClipboard = (email: string) => {
    navigator.clipboard.writeText(email);
    toast({
      title: "Email Copied",
      description: "Email address copied to clipboard",
    });
  };

  const filteredUsers = users.filter((user: UserType) =>
    user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    user.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
    user.role.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (user.organization?.name && user.organization.name.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(part => part.charAt(0))
      .join('')
      .toUpperCase()
      .substring(0, 2);
  };

  const getRoleColor = (role: UserRole) => {
    switch (role) {
      case 'super_admin':
        return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400';
      case 'admin':
        return 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400';
      case 'agent':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-400';
    }
  };

  const getStatusColor = (active: boolean) => {
    return active
      ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
      : 'bg-gray-100 text-gray-800 dark:bg-gray-800/30 dark:text-gray-400';
  };

  const getAvatarColor = (role: UserRole) => {
    switch (role) {
      case 'super_admin':
        return 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400';
      case 'admin':
        return 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400';
      case 'agent':
        return 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400';
      default:
        return 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400';
    }
  };

  const formatDate = (dateString: string | Date) => {
    const date = typeof dateString === 'string' ? new Date(dateString) : dateString;
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    }).format(date);
  };

  return (
    <DashboardLayout>
      <div className="flex flex-col space-y-6 max-w-6xl mx-auto px-4 md:px-8">
        <div className="flex flex-col md:flex-row justify-between gap-4 md:items-center">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">User Management</h1>
            <p className="text-muted-foreground">Manage system users and their access permissions</p>
          </div>

          <div className="flex flex-col md:flex-row gap-2">
            {/* Only show Create Organization button to super admins */}
            {isSuperAdmin() && (
              <Dialog open={createOrgDialogOpen} onOpenChange={setCreateOrgDialogOpen}>
                <DialogTrigger asChild>
                  <Button variant="outline" className="md:self-end">
                    <Building className="mr-2 h-4 w-4" />
                    New Organization
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Create New Organization</DialogTitle>
                    <DialogDescription>
                      Add a new organization to the system.
                    </DialogDescription>
                  </DialogHeader>

                  <Form {...createOrgForm}>
                    <form onSubmit={createOrgForm.handleSubmit(onCreateOrganization)} className="space-y-4">
                      <FormField
                        control={createOrgForm.control}
                        name="name"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Organization Name*</FormLabel>
                            <FormControl>
                              <Input placeholder="Enter organization name" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={createOrgForm.control}
                        name="description"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Description</FormLabel>
                            <FormControl>
                              <Input placeholder="Brief description (optional)" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={createOrgForm.control}
                        name="active"
                        render={({ field }) => (
                          <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                            <FormControl>
                              <Checkbox
                                checked={field.value}
                                onCheckedChange={field.onChange}
                              />
                            </FormControl>
                            <div className="space-y-1 leading-none">
                              <FormLabel>Active</FormLabel>
                              <FormDescription>
                                Inactive organizations will not be available for new users.
                              </FormDescription>
                            </div>
                          </FormItem>
                        )}
                      />

                      <DialogFooter>
                        <Button type="submit" disabled={submitting}>
                          {submitting ? (
                            <>
                              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                              Creating...
                            </>
                          ) : (
                            <>
                              <Building className="mr-2 h-4 w-4" />
                              Create Organization
                            </>
                          )}
                        </Button>
                      </DialogFooter>
                    </form>
                  </Form>
                </DialogContent>
              </Dialog>
            )}

            <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
              <DialogTrigger asChild>
                <Button className="md:self-end">
                  <UserPlus className="mr-2 h-4 w-4" />
                  New User
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Create New User</DialogTitle>
                  <DialogDescription>
                    Add a new user to the system with appropriate access level.
                  </DialogDescription>
                </DialogHeader>

                <Form {...createForm}>
                  <form onSubmit={createForm.handleSubmit(onCreateUser)} className="space-y-4">
                    <FormField
                      control={createForm.control}
                      name="name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Name*</FormLabel>
                          <FormControl>
                            <Input placeholder="Enter full name" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={createForm.control}
                      name="email"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Email*</FormLabel>
                          <FormControl>
                            <Input type="email" placeholder="email@example.com" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={createForm.control}
                      name="password"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Initial Password*</FormLabel>
                          <FormControl>
                            <Input type="password" placeholder="Minimum 6 characters" {...field} />
                          </FormControl>
                          <FormDescription className="text-xs">
                            User will be prompted to change this on first login.
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={createForm.control}
                      name="role"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Role*</FormLabel>
                          <Select
                            onValueChange={(value) => {
                              field.onChange(value);
                              // If changing to super_admin, clear organization
                              if (value === 'super_admin') {
                                createForm.setValue('organizationId', '');
                              }
                            }}
                            defaultValue={field.value}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select role" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {USER_ROLES
                                // Only show super_admin option to super admins
                                .filter(role => role !== 'super_admin' || isSuperAdmin())
                                .map((role) => (
                                  <SelectItem key={role} value={role}>
                                    {role === 'super_admin' ? 'Super Admin' :
                                      role.charAt(0).toUpperCase() + role.slice(1)}
                                  </SelectItem>
                                ))}
                            </SelectContent>
                          </Select>
                          <FormDescription className="text-xs">
                            Determines what actions the user can perform in the system.
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {/* Only show organization field if role is not super_admin */}
                    {createForm.watch('role') !== 'super_admin' && (
                      <FormField
                        control={createForm.control}
                        name="organizationId"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Organization*</FormLabel>
                            <Select
                              onValueChange={field.onChange}
                              defaultValue={field.value}
                              disabled={!isSuperAdmin() && !!currentUser?.organization?.id}
                            >
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select organization" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                {/* If not super admin, only show current user's organization */}
                                {!isSuperAdmin() && currentUser?.organization ? (
                                  <SelectItem value={currentUser.organization.id}>
                                    {currentUser.organization.name}
                                  </SelectItem>
                                ) : (
                                  organizations.map((org) => (
                                    <SelectItem key={org._id} value={org._id}>
                                      {org.name}
                                    </SelectItem>
                                  ))
                                )}
                              </SelectContent>
                            </Select>
                            <FormDescription className="text-xs">
                              The organization this user belongs to.
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    )}

                    <DialogFooter>
                      <Button type="submit" disabled={submitting}>
                        {submitting ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Creating...
                          </>
                        ) : (
                          <>
                            <UserPlus className="mr-2 h-4 w-4" />
                            Create User
                          </>
                        )}
                      </Button>
                    </DialogFooter>
                  </form>
                </Form>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 md:grid-cols-4 gap-4">
          {/* Add Organizations stats card for super admin */}
          {isSuperAdmin() && (
            <Card>
              <CardContent className="p-6">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Organizations</p>
                    <h3 className="text-2xl font-bold">{stats.organizations}</h3>
                  </div>
                  <div className="p-2 rounded-full bg-indigo-100 dark:bg-indigo-900/20">
                    <Building className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          <Card>
            <CardContent className="p-6">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Total Users</p>
                  <h3 className="text-2xl font-bold">{stats.total}</h3>
                </div>
                <div className="p-2 rounded-full bg-blue-100 dark:bg-blue-900/20">
                  <Users className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Administrators</p>
                  <h3 className="text-2xl font-bold">{stats.admins}</h3>
                </div>
                <div className="p-2 rounded-full bg-purple-100 dark:bg-purple-900/20">
                  <Shield className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Agents</p>
                  <h3 className="text-2xl font-bold">{stats.agents}</h3>
                </div>
                <div className="p-2 rounded-full bg-green-100 dark:bg-green-900/20">
                  <UserCog className="h-5 w-5 text-green-600 dark:text-green-400" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Active</p>
                  <h3 className="text-2xl font-bold">{stats.active}</h3>
                </div>
                <div className="p-2 rounded-full bg-emerald-100 dark:bg-emerald-900/20">
                  <Check className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Inactive</p>
                  <h3 className="text-2xl font-bold">{stats.inactive}</h3>
                </div>
                <div className="p-2 rounded-full bg-gray-100 dark:bg-gray-900/20">
                  <Lock className="h-5 w-5 text-gray-600 dark:text-gray-400" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <Card className="overflow-hidden">
          <CardHeader className="pb-3">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <CardTitle>System Users</CardTitle>
                <CardDescription>Manage user accounts and permissions</CardDescription>
              </div>

              <div className="flex items-center gap-2">
                <div className="relative">
                  <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    type="search"
                    placeholder="Search users..."
                    className="pl-8 w-full md:w-[260px]"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>

                <Button
                  variant="ghost"
                  size="icon"
                  onClick={fetchUsers}
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
                  <p className="text-sm text-muted-foreground">Loading users...</p>
                </div>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>User</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Role</TableHead>
                      <TableHead>Organization</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Joined</TableHead>
                      <TableHead className="w-[80px]">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredUsers.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={7} className="h-24 text-center">
                          {searchQuery ? (
                            <>
                              <p className="text-muted-foreground">No users match "{searchQuery}"</p>
                              <Button
                                variant="link"
                                onClick={() => setSearchQuery('')}
                                className="mt-2"
                              >
                                Clear search
                              </Button>
                            </>
                          ) : (
                            <p className="text-muted-foreground">No users found</p>
                          )}
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredUsers.map((user) => (
                        <TableRow key={user._id?.toString() || user.id?.toString()} className={!user.active ? "opacity-60" : ""}>
                          <TableCell>
                            <div className="flex items-center gap-3">
                              <Avatar className={getAvatarColor(user.role)}>
                                <AvatarFallback>{getInitials(user.name)}</AvatarFallback>
                              </Avatar>
                              <div>
                                <div className="font-medium">{user.name}</div>
                                <div className="text-xs text-muted-foreground">
                                  ID: {typeof user._id === 'string'
                                    ? user._id.substring(user._id.length - 6).toUpperCase()
                                    : typeof user.id === 'string'
                                      ? user.id.substring(user.id.length - 6).toUpperCase()
                                      : ''}
                                </div>
                              </div>
                            </div>
                          </TableCell>

                          <TableCell>
                            <div className="flex items-center gap-2">
                              <span className="truncate max-w-[180px]">{user.email}</span>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-6 w-6"
                                onClick={() => copyEmailToClipboard(user.email)}
                              >
                                <Clipboard className="h-3.5 w-3.5 text-muted-foreground" />
                              </Button>
                            </div>
                          </TableCell>

                          <TableCell>
                            <Badge variant="secondary" className={getRoleColor(user.role)}>
                              {user.role === 'super_admin' ? 'Super Admin' :
                                user.role.charAt(0).toUpperCase() + user.role.slice(1)}
                            </Badge>
                          </TableCell>

                          <TableCell>
                            {user.organizationId?.name || (user.role === 'super_admin' ? '—' : 'Not Assigned')}
                          </TableCell>

                          <TableCell>
                            <Badge variant="outline" className={getStatusColor(user.active !== false)}>
                              {user.active !== false ? 'Active' : 'Inactive'}
                            </Badge>
                          </TableCell>

                          <TableCell>
                            {user.createdAt ? formatDate(user.createdAt) : '-'}
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
                                <DropdownMenuItem onClick={() => handleEditUserClick(user)}>
                                  <Edit className="mr-2 h-4 w-4" />
                                  Edit User
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => handleUpdatePasswordClick(user)}>
                                  <KeyRound className="mr-2 h-4 w-4" />
                                  Set Password
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => handleUpdateRoleClick(user)}>
                                  <Shield className="mr-2 h-4 w-4" />
                                  Change Role
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => copyEmailToClipboard(user.email)}>
                                  <Mail className="mr-2 h-4 w-4" />
                                  Copy Email
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem
                                  onClick={() => handleToggleActivation(user)}
                                  className={user.active !== false ? "text-red-600 dark:text-red-400" : "text-green-600 dark:text-green-400"}
                                >
                                  <Power className="mr-2 h-4 w-4" />
                                  {user.active !== false ? "Deactivate User" : "Activate User"}
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
              {filteredUsers.length} {filteredUsers.length === 1 ? 'user' : 'users'}
              {searchQuery && ` matching "${searchQuery}"`}
            </div>
            <Button variant="outline" size="sm" onClick={fetchUsers}>
              <RefreshCw className="mr-2 h-3.5 w-3.5" />
              Refresh
            </Button>
          </CardFooter>
        </Card>

        {/* Edit User Dialog */}
        <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
          <DialogContent className="sm:max-w-[525px]">
            <DialogHeader>
              <DialogTitle>Edit User</DialogTitle>
              <DialogDescription>
                Update user information and permissions.
              </DialogDescription>
            </DialogHeader>

            {selectedUser && (
              <Form {...editForm}>
                <form onSubmit={editForm.handleSubmit(onUpdateUser)} className="space-y-4">
                  <FormField
                    control={editForm.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Full Name*</FormLabel>
                        <FormControl>
                          <Input {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={editForm.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Email Address*</FormLabel>
                        <FormControl>
                          <Input type="email" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={editForm.control}
                    name="role"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Role*</FormLabel>
                        <Select
                          onValueChange={(value) => {
                            field.onChange(value);
                            // If changing to super_admin, clear organization
                            if (value === 'super_admin') {
                              editForm.setValue('organizationId', '');
                            }
                          }}
                          defaultValue={field.value}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select role" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {USER_ROLES
                              // Only show super_admin option to super admins
                              .filter(role => role !== 'super_admin' || isSuperAdmin())
                              .map((role) => (
                                <SelectItem key={role} value={role}>
                                  {role === 'super_admin' ? 'Super Admin' :
                                    role.charAt(0).toUpperCase() + role.slice(1)}
                                </SelectItem>
                              ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Only show organization field if role is not super_admin */}
                  {editForm.watch('role') !== 'super_admin' && (
                    <FormField
                      control={editForm.control}
                      name="organizationId"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Organization*</FormLabel>
                          <Select
                            onValueChange={field.onChange}
                            defaultValue={field.value}
                            disabled={!isSuperAdmin() && !!currentUser?.organization?.id}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select organization" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {/* If not super admin, only show current user's organization */}
                              {!isSuperAdmin() && currentUser?.organization ? (
                                <SelectItem value={currentUser.organization.id}>
                                  {currentUser.organization.name}
                                </SelectItem>
                              ) : (
                                organizations.map((org) => (
                                  <SelectItem key={org._id} value={org._id}>
                                    {org.name}
                                  </SelectItem>
                                ))
                              )}
                            </SelectContent>
                          </Select>
                          <FormDescription>
                            The organization this user belongs to.
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  )}

                  <FormField
                    control={editForm.control}
                    name="active"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                        <FormControl>
                          <Checkbox
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                        <div className="space-y-1 leading-none">
                          <FormLabel>Active Account</FormLabel>
                          <FormDescription>
                            Inactive accounts cannot log in to the system.
                          </FormDescription>
                        </div>
                      </FormItem>
                    )}
                  />

                  <DialogFooter>
                    <Button type="submit" disabled={submitting}>
                      {submitting ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Saving...
                        </>
                      ) : (
                        <>
                          <Check className="mr-2 h-4 w-4" />
                          Save Changes
                        </>
                      )}
                    </Button>
                  </DialogFooter>
                </form>
              </Form>
            )}
          </DialogContent>
        </Dialog>

        {/* Update Role Dialog */}
        <Dialog open={updateDialogOpen} onOpenChange={setUpdateDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Update User Role</DialogTitle>
              <DialogDescription>
                Change the role for {selectedUser?.name}
              </DialogDescription>
            </DialogHeader>

            {selectedUser && (
              <div className="flex items-center gap-3 py-2">
                <Avatar className={getAvatarColor(selectedUser.role)}>
                  <AvatarFallback>{getInitials(selectedUser.name)}</AvatarFallback>
                </Avatar>
                <div>
                  <div className="font-medium">{selectedUser.name}</div>
                  <div className="text-sm text-muted-foreground">{selectedUser.email}</div>
                </div>
              </div>
            )}

            <Form {...updateForm}>
              <form onSubmit={updateForm.handleSubmit(onUpdateRole)} className="space-y-4">
                <FormField
                  control={updateForm.control}
                  name="role"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Role*</FormLabel>
                      <Select
                        onValueChange={(value) => {
                          field.onChange(value);
                          // If changing to super_admin, clear organization
                          if (value === 'super_admin') {
                            updateForm.setValue('organizationId', '');
                          }
                        }}
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select role" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {USER_ROLES
                            // Only show super_admin option to super admins
                            .filter(role => role !== 'super_admin' || isSuperAdmin())
                            .map((role) => (
                              <SelectItem key={role} value={role}>
                                {role === 'super_admin' ? 'Super Admin' :
                                  role.charAt(0).toUpperCase() + role.slice(1)}
                              </SelectItem>
                            ))}
                        </SelectContent>
                      </Select>
                      <FormDescription>
                        Changing a user's role will update their permissions in the system.
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Only show organization field if role is not super_admin */}
                {updateForm.watch('role') !== 'super_admin' && (
                  <FormField
                    control={updateForm.control}
                    name="organizationId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Organization*</FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          defaultValue={field.value}
                          disabled={!isSuperAdmin() && !!currentUser?.organization?.id}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select organization" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {/* If not super admin, only show current user's organization */}
                            {!isSuperAdmin() && currentUser?.organization ? (
                              <SelectItem value={currentUser.organization.id}>
                                {currentUser.organization.name}
                              </SelectItem>
                            ) : (
                              organizations.map((org) => (
                                <SelectItem key={org._id} value={org._id}>
                                  {org.name}
                                </SelectItem>
                              ))
                            )}
                          </SelectContent>
                        </Select>
                        <FormDescription>
                          The organization this user belongs to.
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}

                <DialogFooter>
                  <Button type="submit" disabled={submitting}>
                    {submitting ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Updating...
                      </>
                    ) : (
                      <>
                        <Shield className="mr-2 h-4 w-4" />
                        Update Role
                      </>
                    )}
                  </Button>
                </DialogFooter>
              </form>
            </Form>
          </DialogContent>
        </Dialog>

        {/* Update Password Dialog */}
        <Dialog open={passwordDialogOpen} onOpenChange={setPasswordDialogOpen}>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Set New Password</DialogTitle>
              <DialogDescription>
                {selectedUser && `Set a new password for ${selectedUser.name}`}
              </DialogDescription>
            </DialogHeader>

            <Form {...passwordForm}>
              <form onSubmit={passwordForm.handleSubmit(onUpdatePassword)} className="space-y-4">
                <FormField
                  control={passwordForm.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>New Password*</FormLabel>
                      <FormControl>
                        <Input type="password" placeholder="Minimum 6 characters" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={passwordForm.control}
                  name="confirmPassword"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Confirm Password*</FormLabel>
                      <FormControl>
                        <Input type="password" placeholder="Re-enter password" {...field} />
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
                        <KeyRound className="mr-2 h-4 w-4" />
                        Update Password
                      </>
                    )}
                  </Button>
                </DialogFooter>
              </form>
            </Form>
          </DialogContent>
        </Dialog>

        {/* Deactivate/Activate User Dialog */}
        <Dialog open={deactivateDialogOpen} onOpenChange={setDeactivateDialogOpen}>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>
                {selectedUser?.active !== false ? "Deactivate User" : "Activate User"}
              </DialogTitle>
              <DialogDescription>
                {selectedUser?.active !== false
                  ? "This will prevent the user from logging in."
                  : "This will allow the user to log in again."}
              </DialogDescription>
            </DialogHeader>

            <div className="py-4">
              {selectedUser?.active !== false ? (
                <div className="flex items-center gap-3 p-3 rounded-md bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/30 text-amber-800 dark:text-amber-300">
                  <AlertTriangle className="h-5 w-5 text-amber-500" />
                  <p className="text-sm">
                    You are about to deactivate <span className="font-medium">{selectedUser?.name}</span>.
                    They will not be able to log in until you reactivate their account.
                  </p>
                </div>
              ) : (
                <p>
                  Are you sure you want to activate <span className="font-medium">{selectedUser?.name}</span>?
                  This will restore their ability to log in.
                </p>
              )}
            </div>

            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setDeactivateDialogOpen(false)}
              >
                Cancel
              </Button>
              <Button
                variant={selectedUser?.active !== false ? "destructive" : "default"}
                onClick={onToggleActivation}
                disabled={submitting}
              >
                {submitting ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Power className="mr-2 h-4 w-4" />
                )}
                {selectedUser?.active !== false ? "Deactivate" : "Activate"} User
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
}
