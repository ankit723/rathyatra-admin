"use client";

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { 
  ChevronDown, 
  Users, 
  Shield, 
  LayoutDashboard,
  Menu,
  X
} from 'lucide-react';
import { Button } from "@/components/ui/button";
import { useAuth } from '@/lib/useAuth';

// Define sidebar item type for type safety
export interface SidebarItem {
  title: string;
  href: string;
  icon: React.ReactNode;
  submenu?: SidebarItem[];
}

// Main sidebar items - can be extended later
const sidebarItems: SidebarItem[] = [
  {
    title: 'Users',
    href: '#',
    icon: <Users className="h-5 w-5" />,
    submenu: [
      {
        title: 'All Users',
        href: '/users',
        icon: <Users className="h-4 w-4" />,
      },
      {
        title: 'Create User',
        href: '/users/create',
        icon: <Users className="h-4 w-4" />,
      },
    ],
  },
  {
    title: 'Admins',
    href: '#',
    icon: <Shield className="h-5 w-5" />,
    submenu: [
      {
        title: 'All Admins',
        href: '/admins',
        icon: <Shield className="h-4 w-4" />,
      },
      {
        title: 'Create Admin',
        href: '/admins/create',
        icon: <Shield className="h-4 w-4" />,
      },
    ],
  },
];

interface SidebarProps {
  className?: string;
}

const Sidebar = ({ className }: SidebarProps) => {
  const pathname = usePathname();
  
  // Initialize openMenus with all items set to open
  const initialOpenState = sidebarItems.reduce((acc, item) => {
    if (item.submenu && item.submenu.length > 0) {
      acc[item.title] = true;
    }
    return acc;
  }, {} as Record<string, boolean>);
  
  const [openMenus, setOpenMenus] = useState<Record<string, boolean>>(initialOpenState);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { admin } = useAuth();

  const toggleSubmenu = (title: string) => {
    setOpenMenus(prev => ({
      ...prev,
      [title]: !prev[title]
    }));
  };

  const isActive = (href: string) => pathname === href;

  // Get admin initials for avatar
  const getInitials = () => {
    if (!admin || !admin.email) return 'A';
    return admin.email.charAt(0).toUpperCase();
  };

  const renderSidebarItem = (item: SidebarItem, depth = 0) => {
    const hasSubmenu = item.submenu && item.submenu.length > 0;
    const isOpen = openMenus[item.title];
    const active = isActive(item.href);

    return (
      <div key={item.title} className={cn("flex flex-col", depth > 0 && "ml-4")}>
        <div 
          className={cn(
            "flex items-center justify-between px-3 py-2 rounded-md cursor-pointer transition-colors",
            active 
              ? "bg-primary text-primary-foreground" 
              : "hover:bg-primary/10 text-slate-700 hover:text-primary"
          )}
          onClick={() => {
            if (hasSubmenu) {
              toggleSubmenu(item.title);
            }
          }}
        >
          <Link 
            href={item.href}
            className={cn(
              "flex items-center gap-3 flex-grow",
              hasSubmenu && "pointer-events-none"
            )}
          >
            {item.icon}
            <span className="font-medium">{item.title}</span>
          </Link>
          {hasSubmenu && (
            <ChevronDown 
              className={cn(
                "h-4 w-4 transition-transform", 
                isOpen && "transform rotate-180"
              )} 
            />
          )}
        </div>
        
        {hasSubmenu && isOpen && (
          <div className="mt-1 ml-2 pl-2 border-l border-slate-200">
            {item.submenu?.map(subItem => renderSidebarItem(subItem, depth + 1))}
          </div>
        )}
      </div>
    );
  };

  return (
    <>
      {/* Mobile menu button */}
      <div className="lg:hidden fixed top-4 left-4 z-30">
        <Button
          variant="outline"
          size="icon"
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          aria-label="Toggle menu"
        >
          {isMobileMenuOpen ? (
            <X className="h-5 w-5" />
          ) : (
            <Menu className="h-5 w-5" />
          )}
        </Button>
      </div>

      {/* Sidebar */}
      <div
        className={cn(
          "fixed top-0 left-0 z-20 h-full w-64 flex-shrink-0 bg-white shadow-md transition-transform lg:translate-x-0 lg:relative lg:shadow-none",
          isMobileMenuOpen ? "translate-x-0" : "-translate-x-full",
          className
        )}
      >
        <div className="flex h-full flex-col">
          {/* Logo */}
          <div className="flex h-16 items-center px-6 border-b">
            <Link href="/dashboard" className="flex items-center gap-2">
              <span className="font-bold text-lg text-primary">Admin Portal</span>
            </Link>
          </div>

          {/* Navigation */}
          <nav className="flex-1 overflow-y-auto p-4 space-y-2">
            {sidebarItems.map(item => renderSidebarItem(item))}
          </nav>

          {/* User info */}
          <div className="border-t p-4">
            <div className="flex items-center gap-3">
              <div className="h-8 w-8 rounded-full bg-primary/20 flex items-center justify-center text-primary font-medium">
                {getInitials()}
              </div>
              <div className="flex-1 overflow-hidden">
                <p className="truncate text-sm font-medium">
                  {admin ? 'Admin User' : 'Admin User'}
                </p>
                <p className="truncate text-xs text-slate-500">
                  {admin && admin.email ? admin.email : 'admin@example.com'}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Overlay to close mobile menu */}
      {isMobileMenuOpen && (
        <div 
          className="fixed inset-0 z-10 bg-black/20 lg:hidden"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}
    </>
  );
};

export default Sidebar; 