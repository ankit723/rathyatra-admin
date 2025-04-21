"use client";

// Instead of importing AdminEditComponent from another file, I'll put all the client component code here
import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Shield, Loader2 } from 'lucide-react';
import { getAdminById, updateAdmin, deleteAdmin } from '@/lib/adminService';
import Link from 'next/link';
import { 
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

export default function AdminEditPage() {
  const params = useParams();
  const id = params.id as string;
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);

  useEffect(() => {
    const fetchAdmin = async () => {
      try {
        const admin = await getAdminById(id);
        setEmail(admin.email);
      } catch (err) {
        setError('Failed to load admin details');
        console.error(err);
      } finally {
        setInitialLoading(false);
      }
    };

    fetchAdmin();
  }, [id]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!email) {
      setError('Email is required.');
      return;
    }

    try {
      setLoading(true);
      await updateAdmin(id, email);
      router.push('/admins');
      router.refresh();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to update admin account');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    try {
      setIsDeleting(true);
      await deleteAdmin(id);
      router.push('/admins');
      router.refresh();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to delete admin account');
      setIsDeleting(false);
    }
  };

  if (initialLoading) {
    return (
      <div className="flex h-48 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Edit Admin</h2>
        <Link href="/admins">
          <Button variant="outline">Back to Admins</Button>
        </Link>
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle>Admin Details</CardTitle>
          <CardDescription>Update administrator information</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <div className="text-sm font-medium text-red-500">{error}</div>
            )}
            
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@example.com"
              />
            </div>
            
            <div className="flex gap-4">
              <Button type="submit" className="flex-1" disabled={loading}>
                {loading ? (
                  <span>Updating...</span>
                ) : (
                  <>
                    <Shield className="mr-2 h-4 w-4" />
                    Update Admin
                  </>
                )}
              </Button>
              
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="destructive" disabled={isDeleting}>
                    {isDeleting ? 'Deleting...' : 'Delete Admin'}
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                    <AlertDialogDescription>
                      This will permanently delete the admin account. This action cannot be undone.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={handleDelete} className="bg-red-600 hover:bg-red-700">
                      Delete
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
} 