"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/useAuth';
import { getDashboardStats } from '@/lib/dashboardService';
import { Loader2, Users, ShieldAlert, MapPin, Bell, Download, Smartphone, AlertCircle, Copy, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import QRCode from 'react-qr-code';

const DashboardPage = () => {
  const router = useRouter();
  const { admin, isLoading, logout } = useAuth();
  const [stats, setStats] = useState({
    userCount: 0,
    adminCount: 0,
    activeEmergencies: 0,
    locationStatus: {
      atLocation: 0,
      notAtLocation: 0,
      notAssigned: 0
    }
  });
  const [dataLoading, setDataLoading] = useState(true);
  const [openAndroidModal, setOpenAndroidModal] = useState(false);
  const [openIosModal, setOpenIosModal] = useState(false);
  const [androidCopied, setAndroidCopied] = useState(false);
  const [iosCopied, setIosCopied] = useState(false);

  // App download links (pointing to files in the public directory)
  const androidAppLink = process.env.NEXT_PUBLIC_ANDROID_APP_LINK || '';
  const iosAppLink = process.env.NEXT_PUBLIC_IOS_APP_LINK || '';

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setDataLoading(true);
        const dashboardStats = await getDashboardStats();
        setStats(dashboardStats);
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
      } finally {
        setDataLoading(false);
      }
    };

    if (admin) {
      fetchDashboardData();
    }
  }, [admin]);

  const handleAndroidDownload = () => {
    window.open(androidAppLink, '_blank');
  };

  const handleIosDownload = () => {
    window.open(iosAppLink, '_blank');
  };

  const copyToClipboard = (text: string, setCopied: React.Dispatch<React.SetStateAction<boolean>>) => {
    navigator.clipboard.writeText(text)
      .then(() => {
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      })
      .catch(err => {
        console.error('Failed to copy: ', err);
      });
  };

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!admin) {
    // This should not happen due to our protection, but just in case
    router.push('/login');
    return null;
  }

  return (
    <div className="p-8">
      <div className="mb-8 flex items-center justify-between">
        <h1 className="text-3xl font-bold">Admin Dashboard</h1>
        <button
          onClick={logout}
          className="rounded-md bg-red-600 px-4 py-2 text-white hover:bg-red-700"
        >
          Logout
        </button>
      </div>

      <div className="rounded-lg border p-6 shadow-md">
        <h2 className="mb-4 text-xl font-semibold">Admin Information</h2>
        <div className="space-y-2">
          <p>
            <span className="font-medium">Email:</span> {admin.email}
          </p>
          <p>
            <span className="font-medium">Admin ID:</span> {admin._id}
          </p>
          <p>
            <span className="font-medium">Created At:</span>{' '}
            {new Date(admin.createdAt).toLocaleString()}
          </p>
        </div>
      </div>
      
      {/* App Download Section */}
      <div className="mt-8 rounded-lg border p-6 shadow-md">
        <h2 className="mb-4 text-xl font-semibold">App Downloads</h2>
        <div className="flex flex-wrap gap-4">
          <Dialog open={openAndroidModal} onOpenChange={setOpenAndroidModal}>
            <DialogTrigger asChild>
              <Button variant="default" className="bg-green-600 hover:bg-green-700">
                <Smartphone className="mr-2" /> Download Android App
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Download Android App</DialogTitle>
              </DialogHeader>
              <div className="flex flex-col items-center gap-4 py-4">
                <div className="flex h-64 w-64 items-center justify-center p-4 bg-white border">
                  <QRCode 
                    value={androidAppLink}
                    size={216}
                    style={{ height: "auto", maxWidth: "100%", width: "100%" }}
                  />
                </div>
                <p className="text-center text-sm text-gray-600">
                  Scan this QR code with your Android device to download the app
                </p>
                <div className="flex gap-2 w-full">
                  <Button onClick={handleAndroidDownload} className="flex-1">
                    <Download className="mr-2" /> Direct Download
                  </Button>
                  <Button 
                    onClick={() => copyToClipboard(androidAppLink, setAndroidCopied)} 
                    variant="outline" 
                    className="flex-1"
                  >
                    {androidCopied ? (
                      <><Check className="mr-2" size={16} /> Copied</>
                    ) : (
                      <><Copy className="mr-2" size={16} /> Copy URL</>
                    )}
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>

          <Dialog open={openIosModal} onOpenChange={setOpenIosModal}>
            <DialogTrigger asChild>
              <Button variant="default" className="bg-blue-600 hover:bg-blue-700">
                <Smartphone className="mr-2" /> Download iOS App
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Download iOS App</DialogTitle>
              </DialogHeader>
              <div className="flex flex-col items-center gap-4 py-4">
                <div className="flex h-64 w-64 items-center justify-center p-4 bg-white border">
                  <QRCode 
                    value={iosAppLink}
                    size={216}
                    style={{ height: "auto", maxWidth: "100%", width: "100%" }}
                  />
                </div>
                <p className="text-center text-sm text-gray-600">
                  Scan this QR code with your iOS device to download the app
                </p>
                <div className="flex gap-2 w-full">
                  <Button onClick={handleIosDownload} className="flex-1">
                    <Download className="mr-2" /> Direct Download
                  </Button>
                  <Button 
                    onClick={() => copyToClipboard(iosAppLink, setIosCopied)} 
                    variant="outline" 
                    className="flex-1"
                  >
                    {iosCopied ? (
                      <><Check className="mr-2" size={16} /> Copied</>
                    ) : (
                      <><Copy className="mr-2" size={16} /> Copy URL</>
                    )}
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>
      
      {dataLoading ? (
        <div className="mt-8 flex h-32 items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : (
        <>
          {/* Main Stats */}
          <div className="mt-8 grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
            <div className="rounded-lg border bg-white p-6 shadow-md">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="mb-2 text-lg font-medium">Users</h3>
                  <p className="text-3xl font-bold">{stats.userCount}</p>
                </div>
                <Users className="h-10 w-10 text-blue-500" />
              </div>
            </div>
            
            <div className="rounded-lg border bg-white p-6 shadow-md">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="mb-2 text-lg font-medium">Admin Accounts</h3>
                  <p className="text-3xl font-bold">{stats.adminCount}</p>
                </div>
                <ShieldAlert className="h-10 w-10 text-purple-500" />
              </div>
            </div>
            
            <div className="rounded-lg border bg-white p-6 shadow-md">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="mb-2 text-lg font-medium">Active Emergencies</h3>
                  <p className="text-3xl font-bold">{stats.activeEmergencies}</p>
                </div>
                <Bell className="h-10 w-10 text-red-500" />
              </div>
            </div>
          </div>
        
          {/* Location Status */}
          <div className="mt-8">
            <h2 className="mb-4 text-xl font-semibold">Location Status</h2>
            <div className="rounded-lg border bg-white p-6 shadow-md">
              <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
                <div className="flex items-center justify-between rounded-lg bg-green-50 p-4">
                  <div>
                    <h3 className="text-sm font-medium text-green-700">At Assigned Location</h3>
                    <p className="text-2xl font-bold text-green-800">{stats.locationStatus.atLocation}</p>
                  </div>
                  <MapPin className="h-8 w-8 text-green-500" />
                </div>
                
                <div className="flex items-center justify-between rounded-lg bg-yellow-50 p-4">
                  <div>
                    <h3 className="text-sm font-medium text-yellow-700">Not At Location</h3>
                    <p className="text-2xl font-bold text-yellow-800">{stats.locationStatus.notAtLocation}</p>
                  </div>
                  <MapPin className="h-8 w-8 text-yellow-500" />
                </div>
                
                <div className="flex items-center justify-between rounded-lg bg-gray-50 p-4">
                  <div>
                    <h3 className="text-sm font-medium text-gray-700">Not Assigned</h3>
                    <p className="text-2xl font-bold text-gray-800">{stats.locationStatus.notAssigned}</p>
                  </div>
                  <MapPin className="h-8 w-8 text-gray-500" />
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default DashboardPage; 