'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import {
  LayoutDashboard,
  FileText,
  Users,
  Settings,
  Menu,
  LogOut,
  BarChart3,
  Search,
  AlertCircle,
  HelpCircle,
  PanelRight,
  ChevronRight,
  UserCircle,
  Lock,
  SheetIcon
} from 'lucide-react';
import { motion } from 'framer-motion';

interface SidebarProps {
  className?: string;
  onLogout?: () => void;
}

export default function DashboardSidebar({ className, onLogout }: SidebarProps) {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);

  // Check if mobile on mount and on resize
  useEffect(() => {
    const checkIfMobile = () => {
      setIsMobile(window.innerWidth < 1024);
    };

    // Initial check
    checkIfMobile();

    // Add event listener
    window.addEventListener('resize', checkIfMobile);

    // Clean up
    return () => {
      window.removeEventListener('resize', checkIfMobile);
    };
  }, []);

  // Navigation item groups
  const navGroups = [
    {
      title: "Overview",
      items: [
        {
          title: 'Dashboard',
          href: '/dashboard',
          icon: <LayoutDashboard className="h-[18px] w-[18px]" />,
          description: 'Lead statistics and summary'
        },

      ]
    },
    {
      title: "Leads Management",
      items: [
        {
          title: 'All Leads',
          href: '/leads',
          icon: <FileText className="h-[18px] w-[18px]" />,
          description: 'View and manage all cases'
        },

      ]
    },
    {
      title: "Administration",
      items: [
        {
          title: 'User Management',
          href: '/admin',
          icon: <Users className="h-[18px] w-[18px]" />,
          description: 'Manage staff and permissions'
        },
            {
          title: 'Lead Management',
          href: '/admin/leads',
          icon: <SheetIcon className="h-[18px] w-[18px]" />,
          description: 'Manage leads and statuses'
        },
        {
          title: 'Security',
          href: '/security',
          icon: <Lock className="h-[18px] w-[18px]" />,
          description: 'Access and security controls'
        }
      ]
    }
  ];

  // Mock user data (replace with actual user info)
  const userProfile = {
    name: "John Doe",
    email: "john.doe@example.com",
    role: "Administrator",
    avatar: "/avatar.png" // Add a default avatar or leave empty
  };

  const NavItems = () => (
    <>
      <div className={cn(
        "px-4 py-6 flex flex-col h-full",
        isCollapsed && "items-center px-2"
      )}>
        {/* Logo & Title */}
        <Link href="/dashboard" className={cn(
          "flex items-center mb-8 gap-3",
          isCollapsed ? "justify-center" : "px-2"
        )}>

          {!isCollapsed && (
            <div className='flex justify-center w-full'>
              <img src='/logo.png' className='h-20'/>
            </div>
          )}
        </Link>

        {/* User Profile */}
        {/* <div className={cn(
          "mb-6 flex items-center p-3 rounded-lg bg-accent/40",
          isCollapsed ? "flex-col" : "gap-3"
        )}>
          <Avatar className="h-10 w-10 border-2 border-background">
            <AvatarImage src={userProfile.avatar} alt={userProfile.name} />
            <AvatarFallback className="bg-primary/10 text-primary font-medium">
              {userProfile.name.charAt(0) + userProfile.name.split(' ')[1]?.charAt(0) || ''}
            </AvatarFallback>
          </Avatar>

          {!isCollapsed && (
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{userProfile.name}</p>
              <p className="text-xs text-muted-foreground truncate">{userProfile.role}</p>
            </div>
          )}

          {!isCollapsed && (
            <Link href="/profile" className="text-muted-foreground hover:text-foreground">
              <UserCircle className="h-5 w-5" />
            </Link>
          )}
        </div> */}

        {/* Navigation Groups */}
        <ScrollArea className={cn(
          "flex-1 -mx-4 px-4",
          isCollapsed && "-mx-2 px-2"
        )}>
          <div className="space-y-6 py-2">
            {navGroups.map((group, idx) => (
              <div key={idx} className="space-y-2">
                {!isCollapsed && (
                  <div className="px-2">
                    <h2 className="text-xs uppercase tracking-wider text-muted-foreground font-medium">
                      {group.title}
                    </h2>
                  </div>
                )}

                <div className="space-y-1">
                  {group.items.map((item) => (
                    <Button
                      key={item.href}
                      variant={pathname === item.href ? "secondary" : "ghost"}
                      className={cn(
                        "w-full justify-start rounded-md",
                        pathname === item.href
                          ? "bg-primary/10 text-primary font-medium border-l-4 border-primary"
                          : "hover:bg-accent hover:text-accent-foreground",
                        isCollapsed ? "h-10 w-10 p-0 justify-center" : "pl-2 pr-3 py-2 h-auto"
                      )}
                      asChild
                      onClick={() => isMobile && setIsOpen(false)}
                    >
                      <Link href={item.href}>
                        <div className={cn(
                          "flex items-center",
                          isCollapsed ? "justify-center" : "gap-3"
                        )}>
                          <div className={pathname === item.href
                            ? "text-primary"
                            : "text-muted-foreground"
                          }>
                            {item.icon}
                          </div>
                          {!isCollapsed && (
                            <div className="flex flex-col items-start">
                              <span className="text-sm">{item.title}</span>
                              {pathname === item.href && (
                                <span className="text-xs text-muted-foreground line-clamp-1">{item.description}</span>
                              )}
                            </div>
                          )}
                        </div>
                      </Link>
                    </Button>
                  ))}
                </div>

                {!isCollapsed && idx < navGroups.length - 1 && (
                  <Separator className="mt-4" />
                )}
              </div>
            ))}
          </div>
        </ScrollArea>

        {/* Footer */}
        <div className="mt-6 space-y-3">
          {!isCollapsed && <Separator />}

          <div className={cn(
            "flex items-center",
            isCollapsed ? "justify-center mt-4" : "justify-between px-2"
          )}>
            {/* {!isCollapsed && (
              <Link href="/help" className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1">
                <HelpCircle className="h-4 w-4" />
                <span>Help Center</span>
              </Link>
            )} */}

            <Button
              variant="ghost"
              size="icon"
              className="rounded-md h-8 w-8"
              onClick={() => setIsCollapsed(!isCollapsed)}
            >
              <PanelRight className={cn("h-4 w-4 text-muted-foreground", isCollapsed && "rotate-180")} />
              <span className="sr-only">
                {isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
              </span>
            </Button>
          </div>

          <Button
            variant="ghost"
            className={cn(
              "text-muted-foreground hover:text-destructive hover:bg-destructive/10",
              isCollapsed ? "w-8 h-8 justify-center p-0" : "w-full justify-start"
            )}
            onClick={onLogout}
          >
            <LogOut className={cn("h-[18px] w-[18px]", !isCollapsed && "mr-2")} />
            {!isCollapsed && <span>Log out</span>}
          </Button>
        </div>
      </div>
    </>
  );

  // Mobile sidebar (hamburger menu & drawer)
  if (isMobile) {
    return (
      <div className="fixed top-0 left-0 z-50 p-4">
        <Sheet open={isOpen} onOpenChange={setIsOpen}>
          <SheetTrigger asChild>
            <Button variant="outline" size="icon" aria-label="Open menu" className="shadow-sm">
              <Menu className="h-5 w-5" />
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="p-0 w-80">
            <ScrollArea className="h-full">
              <NavItems />
            </ScrollArea>
          </SheetContent>
        </Sheet>
      </div>
    );
  }

  // Desktop sidebar
  return (
    <div className={cn(
      "fixed hidden lg:block h-screen border-r bg-background z-30 transition-all duration-300",
      isCollapsed ? "w-16" : "w-64",
      className
    )}>
      <ScrollArea className="h-full">
        <NavItems />
      </ScrollArea>
    </div>
  );
}
