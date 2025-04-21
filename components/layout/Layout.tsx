"use client";

import { ReactNode, useState, useEffect } from 'react';
import Sidebar from './Sidebar';
import Navbar from './Navbar';
import Footer from './Footer';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';

interface LayoutProps {
  children: ReactNode;
}

// Pages that should use a different layout (like login/register)
const publicPages = ['/login', '/register'];

const Layout = ({ children }: LayoutProps) => {
  const pathname = usePathname();
  const [isPublicPage, setIsPublicPage] = useState(false);
  
  useEffect(() => {
    setIsPublicPage(publicPages.includes(pathname));
  }, [pathname]);
  
  // For login/register pages, don't show sidebar/navbar/footer
  if (isPublicPage) {
    return <>{children}</>;
  }

  return (
    <div className="flex h-screen bg-slate-50">
      {/* Sidebar */}
      <Sidebar />
      
      {/* Main content */}
      <div className="flex flex-col flex-1 overflow-hidden">
        {/* Navbar */}
        <Navbar />
        
        {/* Page content */}
        <main className={cn(
          "flex-1 overflow-auto p-6"
        )}>
          {children}
        </main>
        
        {/* Footer */}
        <Footer />
      </div>
    </div>
  );
};

export default Layout; 