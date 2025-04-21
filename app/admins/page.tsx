"use client";

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from '@/components/ui/input';
import { Shield, Search, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { getAllAdmins, Admin } from '@/lib/adminService';
import { format } from 'date-fns';

const AdminsPage = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [admins, setAdmins] = useState<Admin[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  useEffect(() => {
    const fetchAdmins = async () => {
      try {
        setLoading(true);
        const data = await getAllAdmins();
        setAdmins(data);
        setError('');
      } catch (err) {
        console.error('Error fetching admins:', err);
        setError('Failed to load admins. Please try again later.');
      } finally {
        setLoading(false);
      }
    };
    
    fetchAdmins();
  }, []);
  
  // Filter admins based on search query
  const filteredAdmins = admins.filter(admin => 
    admin.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Format the date for display
  const formatDate = (dateString: string) => {
    try {
      return format(new Date(dateString), 'yyyy-MM-dd HH:mm:ss');
    } catch (err) {
      return 'Invalid date';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="text-2xl font-bold">Admins</h2>
          <p className="text-muted-foreground">Manage administrator accounts and permissions</p>
        </div>
        <Link href="/admins/create">
          <Button>
            <Shield className="mr-2 h-4 w-4" />
            Add Admin
          </Button>
        </Link>
      </div>
      
      <Card>
        <CardHeader className="pb-3">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <CardTitle>All Admins</CardTitle>
              <CardDescription>A list of all administrators in the system</CardDescription>
            </div>
            <div className="relative w-full md:w-64">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Search admins..."
                className="pl-8"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex h-48 items-center justify-center">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : error ? (
            <div className="py-8 text-center text-red-500">{error}</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b text-left text-sm font-medium text-muted-foreground">
                    <th className="pb-3 pl-4">Email</th>
                    <th className="pb-3">Created At</th>
                    <th className="pb-3">Last Updated</th>
                    <th className="pb-3 pr-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredAdmins.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="py-8 text-center text-muted-foreground">
                        {searchQuery ? 'No matching admins found' : 'No admins found'}
                      </td>
                    </tr>
                  ) : (
                    filteredAdmins.map((admin) => (
                      <tr 
                        key={admin._id} 
                        className="border-b text-sm transition-colors hover:bg-muted/50"
                      >
                        <td className="py-3 pl-4 font-medium">{admin.email}</td>
                        <td className="py-3">{formatDate(admin.createdAt)}</td>
                        <td className="py-3">{formatDate(admin.updatedAt)}</td>
                        <td className="py-3 pr-4 text-right">
                          <div className="flex justify-end gap-2">
                            <Link href={`/admins/${admin._id}`}>
                              <Button variant="ghost" size="sm">
                                Edit
                              </Button>
                            </Link>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminsPage; 