"use client";

import { useState, useEffect } from 'react';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
  Search, 
  MessageSquare, 
  Filter,
  RefreshCcw,
  Calendar,
  User,
  UsersRound
} from 'lucide-react';
import { api } from '@/lib/axios';
import { toast } from 'sonner';
import { Skeleton } from '@/components/ui/skeleton';
import { format } from 'date-fns';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import MessageDialog from '@/components/MessageDialog';
import MessageDetailDialog from '@/components/MessageDetailDialog';

interface Message {
  _id: string;
  content: string;
  sentTo: {
    userId: string;
    firstName: string;
    lastName: string;
  }[];
  sentAt: string;
}

interface Admin {
  _id: string;
  email: string;
  sentMessages: Message[];
  createdAt: string;
  updatedAt: string;
}

interface User {
  _id: string;
  firstName: string;
  lastName: string;
  rank: string;
  phoneNumber: string;
  currentLocation?: string;
  assignedLocation?: string;
  atAssignedLocation?: boolean;
  emergencyAlarm?: boolean;
  createdAt?: string;
  updatedAt?: string;
  sex?: string;
  age?: number;
}

export default function MessagesPage() {
  const [isLoading, setIsLoading] = useState(true);
  const [allAdmins, setAllAdmins] = useState<Admin[]>([]);
  const [filteredMessages, setFilteredMessages] = useState<{admin: Admin, message: Message}[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedAdmin, setSelectedAdmin] = useState<string>('all');
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);
  const [recipientCount, setRecipientCount] = useState<string>('all');
  const [activeView, setActiveView] = useState<string>('all');
  const [totalMessages, setTotalMessages] = useState<number>(0);
  const [messageDialogOpen, setMessageDialogOpen] = useState(false);
  const [allUsers, setAllUsers] = useState<User[]>([]);
  
  // New state for message detail dialog
  const [detailDialogOpen, setDetailDialogOpen] = useState(false);
  const [selectedMessage, setSelectedMessage] = useState<Message | null>(null);
  const [selectedMessageAdmin, setSelectedMessageAdmin] = useState<Admin | null>(null);

  // Function to fetch all admins and their messages
  const fetchAdminsWithMessages = async () => {
    setIsLoading(true);
    try {
      const response = await api.get<{ admins: Admin[] }>('/admins');
      setAllAdmins(response.data.admins);
      
      // Combine all admin messages into a single array for display
      const allMessages = response.data.admins.flatMap(admin => 
        admin.sentMessages.map(message => ({
          admin,
          message
        }))
      );
      
      // Sort messages by date (newest first)
      allMessages.sort((a, b) => 
        new Date(b.message.sentAt).getTime() - new Date(a.message.sentAt).getTime()
      );
      
      setFilteredMessages(allMessages);
      setTotalMessages(allMessages.length);
    } catch (error) {
      console.error('Error fetching admins and messages:', error);
      toast.error('Failed to load messages. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // New function to fetch users for the message dialog
  const fetchUsers = async () => {
    try {
      const response = await api.get<{ users: User[] }>('/users');
      setAllUsers(response.data.users);
    } catch (error) {
      console.error('Error fetching users:', error);
      toast.error('Failed to load users. Please try again.');
    }
  };

  // Load messages and users on page load
  useEffect(() => {
    fetchAdminsWithMessages();
    fetchUsers(); // Fetch users for the message dialog
  }, []);

  // Apply filters when any filter changes
  useEffect(() => {
    if (allAdmins.length === 0) return;
    
    // Get all messages from all admins
    let messages = allAdmins.flatMap(admin => 
      admin.sentMessages.map(message => ({
        admin,
        message
      }))
    );
    
    // Filter by admin if not "all"
    if (selectedAdmin !== 'all') {
      messages = messages.filter(item => item.admin._id === selectedAdmin);
    }
    
    // Filter by date if selected
    if (selectedDate) {
      const dateStr = selectedDate.toDateString();
      messages = messages.filter(item => {
        const msgDate = new Date(item.message.sentAt).toDateString();
        return msgDate === dateStr;
      });
    }
    
    // Filter by recipient count
    if (recipientCount !== 'all') {
      const countRange = recipientCount.split('-');
      const minCount = parseInt(countRange[0]);
      const maxCount = countRange.length > 1 ? parseInt(countRange[1]) : Number.MAX_SAFE_INTEGER;
      
      messages = messages.filter(item => {
        const count = item.message.sentTo.length;
        return count >= minCount && count <= maxCount;
      });
    }
    
    // Filter by search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      messages = messages.filter(item => 
        item.message.content.toLowerCase().includes(query) ||
        item.admin.email.toLowerCase().includes(query) ||
        item.message.sentTo.some(recipient => 
          `${recipient.firstName} ${recipient.lastName}`.toLowerCase().includes(query)
        )
      );
    }
    
    // Apply view filter (today, this week, this month)
    if (activeView !== 'all') {
      const now = new Date();
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const weekStart = new Date(today);
      weekStart.setDate(today.getDate() - today.getDay());
      const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
      
      messages = messages.filter(item => {
        const msgDate = new Date(item.message.sentAt);
        
        if (activeView === 'today') {
          return msgDate >= today;
        } else if (activeView === 'week') {
          return msgDate >= weekStart;
        } else if (activeView === 'month') {
          return msgDate >= monthStart;
        }
        return true;
      });
    }
    
    // Sort by date (newest first)
    messages.sort((a, b) => 
      new Date(b.message.sentAt).getTime() - new Date(a.message.sentAt).getTime()
    );
    
    setFilteredMessages(messages);
  }, [allAdmins, selectedAdmin, selectedDate, recipientCount, searchQuery, activeView]);

  // Format date
  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    return format(date, 'MMM d, yyyy h:mm a');
  };
  
  // Handle clearing all filters
  const clearFilters = () => {
    setSearchQuery('');
    setSelectedAdmin('all');
    setSelectedDate(undefined);
    setRecipientCount('all');
    setActiveView('all');
  };

  // Handle opening the message dialog
  const openMessageDialog = () => {
    if (allUsers.length === 0) {
      fetchUsers(); // Fetch users if not already loaded
    }
    setMessageDialogOpen(true);
  };

  // Refresh messages after sending
  const refreshAfterMessageSent = () => {
    fetchAdminsWithMessages();
  };

  // New function to handle message row click
  const handleMessageRowClick = (message: Message, admin: Admin) => {
    setSelectedMessage(message);
    setSelectedMessageAdmin(admin);
    setDetailDialogOpen(true);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="text-2xl font-bold">Message History</h2>
          <p className="text-muted-foreground">View all messages sent by admins</p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="icon"
            onClick={fetchAdminsWithMessages}
            title="Refresh"
          >
            <RefreshCcw className="h-4 w-4" />
          </Button>
          <Button onClick={clearFilters} variant="secondary">
            Clear Filters
          </Button>
          <Button onClick={openMessageDialog} variant="default">
            <MessageSquare className="h-4 w-4 mr-2" />
            Send New Message
          </Button>
        </div>
      </div>

      {/* Filters and Search */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle>Filters</CardTitle>
          <CardDescription>
            Filter the message history by various criteria
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Search input */}
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Search messages..."
                className="pl-8"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>

            {/* Admin filter */}
            <div>
              <Select value={selectedAdmin} onValueChange={setSelectedAdmin}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Filter by admin" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Admins</SelectItem>
                  {allAdmins.map(admin => (
                    <SelectItem key={admin._id} value={admin._id}>
                      {admin.email}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Date filter */}
            <div>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className="w-full justify-start text-left font-normal"
                  >
                    <Calendar className="mr-2 h-4 w-4" />
                    {selectedDate ? format(selectedDate, 'PPP') : 'Pick a date'}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <CalendarComponent
                    mode="single"
                    selected={selectedDate}
                    onSelect={setSelectedDate}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>

            {/* Recipient count filter */}
            <div>
              <Select value={recipientCount} onValueChange={setRecipientCount}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Filter by recipients" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All</SelectItem>
                  <SelectItem value="1">1 recipient</SelectItem>
                  <SelectItem value="2-5">2-5 recipients</SelectItem>
                  <SelectItem value="6-20">6-20 recipients</SelectItem>
                  <SelectItem value="21">21+ recipients</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Messages List */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <CardTitle>Messages</CardTitle>
              <CardDescription>
                {filteredMessages.length} of {totalMessages} total messages
              </CardDescription>
            </div>
            <Tabs 
              value={activeView} 
              onValueChange={setActiveView}
              className="w-full md:w-auto"
            >
              <TabsList className="grid grid-cols-4 w-full md:w-auto">
                <TabsTrigger value="all">All</TabsTrigger>
                <TabsTrigger value="today">Today</TabsTrigger>
                <TabsTrigger value="week">This Week</TabsTrigger>
                <TabsTrigger value="month">This Month</TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-4">
              {[...Array(5)].map((_, index) => (
                <div key={index} className="space-y-2 border rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <Skeleton className="h-4 w-[200px]" />
                    <Skeleton className="h-4 w-[100px]" />
                  </div>
                  <Skeleton className="h-16 w-full" />
                  <div className="flex justify-between">
                    <Skeleton className="h-4 w-[150px]" />
                    <Skeleton className="h-4 w-[100px]" />
                  </div>
                </div>
              ))}
            </div>
          ) : filteredMessages.length === 0 ? (
            <div className="text-center py-10">
              <MessageSquare className="mx-auto h-12 w-12 text-muted-foreground opacity-50" />
              <h3 className="mt-4 text-lg font-medium">No messages found</h3>
              <p className="mt-2 text-sm text-muted-foreground">
                Try adjusting your filters or search query
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredMessages.map((item, index) => (
                <div 
                  key={index} 
                  className="border rounded-lg p-4 hover:bg-muted/50 transition-colors cursor-pointer"
                  onClick={() => handleMessageRowClick(item.message, item.admin)}
                >
                  <div className="flex flex-col md:flex-row justify-between mb-2">
                    <div className="flex items-center gap-2 mb-2 md:mb-0">
                      <User className="h-4 w-4 text-muted-foreground" />
                      <span className="font-medium">{item.admin.email}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm text-muted-foreground">{formatDate(item.message.sentAt)}</span>
                    </div>
                  </div>
                  
                  <div className="py-2 px-3 bg-muted rounded-md my-3">
                    <p className="whitespace-pre-wrap line-clamp-3">{item.message.content}</p>
                  </div>
                  
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 mt-2">
                    <div className="flex items-center gap-2">
                      <UsersRound className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm">
                        Sent to <strong>{item.message.sentTo.length}</strong> recipient{item.message.sentTo.length !== 1 ? 's' : ''}
                      </span>
                    </div>
                    
                    <div className="flex flex-wrap gap-1">
                      {item.message.sentTo.length <= 5 ? (
                        item.message.sentTo.map((recipient, idx) => (
                          <Badge key={idx} variant="outline" className="text-xs">
                            {recipient.firstName} {recipient.lastName}
                          </Badge>
                        ))
                      ) : (
                        <>
                          {item.message.sentTo.slice(0, 3).map((recipient, idx) => (
                            <Badge key={idx} variant="outline" className="text-xs">
                              {recipient.firstName} {recipient.lastName}
                            </Badge>
                          ))}
                          <Badge variant="outline" className="text-xs">
                            +{item.message.sentTo.length - 3} more
                          </Badge>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Message Dialog */}
      <MessageDialog
        open={messageDialogOpen}
        onOpenChange={setMessageDialogOpen}
        users={allUsers}
        onMessageSent={refreshAfterMessageSent}
      />

      {/* Message Detail Dialog */}
      <MessageDetailDialog
        open={detailDialogOpen}
        onOpenChange={setDetailDialogOpen}
        message={selectedMessage}
        admin={selectedMessageAdmin}
      />
    </div>
  );
} 