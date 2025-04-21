"use client";

import { useAuth } from '@/lib/useAuth';
import { Button } from '@/components/ui/button';
import { 
  Bell, 
  Settings, 
  LogOut,
  User,
  Search
} from 'lucide-react';
import { useState, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { usePathname } from 'next/navigation';

interface NavbarProps {
  className?: string;
}

const getPageTitle = (pathname: string): string => {
  if (pathname === '/dashboard') return 'Dashboard';
  if (pathname.startsWith('/users')) return 'Manage Users';
  if (pathname.startsWith('/admins')) return 'Manage Admins';
  
  // Extract the base path for other routes
  const segments = pathname.split('/').filter(Boolean);
  if (segments.length > 0) {
    return segments[0].charAt(0).toUpperCase() + segments[0].slice(1);
  }
  
  return 'Dashboard';
};

const Navbar = ({ className }: NavbarProps) => {
  const { logout } = useAuth();
  const [searchOpen, setSearchOpen] = useState(false);
  const pathname = usePathname();
  const [pageTitle, setPageTitle] = useState('Dashboard');
  
  useEffect(() => {
    setPageTitle(getPageTitle(pathname));
  }, [pathname]);

  return (
    <header className={`bg-white border-b shadow-sm h-16 ${className}`}>
      <div className="h-full px-4 md:px-6 flex items-center justify-between">
        <div className="flex-1 hidden lg:block">
          {/* Title shown on desktop */}
          <h1 className="text-xl font-semibold text-gray-800">{pageTitle}</h1>
        </div>

        {/* Action buttons */}
        <div className="flex items-center gap-1 md:gap-2">

          <Button 
            variant="ghost" 
            size="icon" 
            onClick={logout}
            className="text-slate-500 hover:text-red-500"
          >
            <LogOut className="h-5 w-5" />
          </Button>
        </div>
      </div>
    </header>
  );
};

export default Navbar; 