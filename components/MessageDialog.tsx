import { useState, useEffect, useCallback, useRef } from 'react';
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogFooter, 
  DialogHeader, 
  DialogTitle 
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Search } from 'lucide-react';
import { api } from '@/lib/axios';
import { toast } from 'sonner';

interface User {
  _id: string;
  firstName: string;
  lastName: string;
  rank: string;
  phoneNumber: string;
}

interface MessageDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  users: User[];
  onMessageSent?: () => void;
  preSelectedUserIds?: string[];
}

export default function MessageDialog({ 
  open, 
  onOpenChange, 
  users, 
  onMessageSent,
  preSelectedUserIds = []
}: MessageDialogProps) {
  const [messageContent, setMessageContent] = useState('');
  const [selectedUserIds, setSelectedUserIds] = useState<string[]>([]);
  const [isSendingMessage, setIsSendingMessage] = useState(false);
  const [userSearchQuery, setUserSearchQuery] = useState('');
  const [filteredUsers, setFilteredUsers] = useState<User[]>([]);
  
  // Use refs to avoid dependencies in useEffect
  const usersRef = useRef<User[]>([]);
  const preSelectedIdsRef = useRef<string[]>([]);
  
  // Update refs when props change
  usersRef.current = users;
  preSelectedIdsRef.current = preSelectedUserIds;

  // Filter users based on search query - memoized to avoid recreation on every render
  const filterUsers = useCallback((query: string) => {
    const currentUsers = usersRef.current;
    
    if (!query) {
      return currentUsers;
    }

    const lowercaseQuery = query.toLowerCase();
    return currentUsers.filter(user => {
      const fullName = `${user.firstName} ${user.lastName}`.toLowerCase();
      const rank = user.rank?.toLowerCase() || '';
      const phone = user.phoneNumber?.toLowerCase() || '';
      
      return fullName.includes(lowercaseQuery) || 
             rank.includes(lowercaseQuery) || 
             phone.includes(lowercaseQuery);
    });
  }, []);

  // Handle search input change
  const handleUserSearch = useCallback((query: string) => {
    setUserSearchQuery(query);
    setFilteredUsers(filterUsers(query));
  }, [filterUsers]);

  // Reset dialog state when opened
  useEffect(() => {
    if (open) {
      // Set initial filtered users to all users
      setFilteredUsers(usersRef.current);
      
      // Reset search
      setUserSearchQuery('');
      
      // Set selected user IDs from props if provided
      if (preSelectedIdsRef.current.length > 0) {
        setSelectedUserIds(preSelectedIdsRef.current);
      }
    }
  }, [open]);

  // Toggle user selection
  const toggleUserSelection = useCallback((userId: string) => {
    setSelectedUserIds(prev => 
      prev.includes(userId) 
        ? prev.filter(id => id !== userId) 
        : [...prev, userId]
    );
  }, []);

  // Send message
  const sendMessage = useCallback(async () => {
    if (!messageContent.trim()) {
      toast.error('Please enter a message');
      return;
    }

    if (selectedUserIds.length === 0) {
      toast.error('Please select at least one user');
      return;
    }

    setIsSendingMessage(true);

    try {
      // Get admin ID from localStorage with improved error handling
      const adminDataString = localStorage.getItem('adminData');
      
      console.log('Raw admin data from localStorage:', adminDataString);
      
      // Check if we should use adminData or admin_data key
      let adminData;
      if (!adminDataString) {
        // Try alternative key
        const altAdminDataString = localStorage.getItem('admin_data');
        console.log('Trying alternative key admin_data:', altAdminDataString);
        
        if (altAdminDataString) {
          adminData = JSON.parse(altAdminDataString);
        } else {
          toast.error('Admin session not found. Please log in again.');
          console.error('Admin data not found in localStorage under any key');
          setIsSendingMessage(false);
          return;
        }
      } else {
        adminData = JSON.parse(adminDataString);
      }
      
      console.log('Parsed admin data:', adminData);
      
      const adminId = adminData._id;
      
      if (!adminId) {
        toast.error('Admin session invalid. Please log in again.');
        console.error('Admin ID not found in parsed admin data:', adminData);
        setIsSendingMessage(false);
        return;
      }
      
      console.log('Using admin ID for message:', adminId);

      const response = await api.post('/admin/send-message', {
        message: messageContent,
        userIds: selectedUserIds,
        adminId
      });

      toast.success(`Message sent to ${response.data.recipients} user(s) successfully`);
      
      // Call the callback if provided
      if (onMessageSent) {
        onMessageSent();
      }
      
      // Reset and close
      setMessageContent('');
      onOpenChange(false);
    } catch (error) {
      console.error('Error sending message:', error);
      toast.error('Failed to send message. Please try again.');
    } finally {
      setIsSendingMessage(false);
    }
  }, [messageContent, selectedUserIds, onMessageSent, onOpenChange]);

  // Reset on dialog close
  useEffect(() => {
    if (!open) {
      setMessageContent('');
      
      // Only reset selected users if not using pre-selected ones
      if (preSelectedIdsRef.current.length === 0) {
        setSelectedUserIds([]);
      }
    }
  }, [open]);

  return (
    <Dialog 
      open={open} 
      onOpenChange={onOpenChange}
    >
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Send Message to Users</DialogTitle>
          <DialogDescription>
            Type your message and select the users you want to send it to.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="message">Message</Label>
            <div className="relative">
              <textarea
                id="message"
                value={messageContent}
                onChange={(e) => setMessageContent(e.target.value)}
                placeholder="Type your message here..."
                className="flex min-h-[120px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                autoFocus
              />
            </div>
          </div>
          <div className="space-y-2 mt-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="user-search">Select Users</Label>
              <span className="text-xs text-muted-foreground">
                {selectedUserIds.length} user(s) selected
              </span>
            </div>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input
                id="user-search"
                placeholder="Search users..."
                className="pl-10 mb-2"
                value={userSearchQuery}
                onChange={(e) => handleUserSearch(e.target.value)}
              />
            </div>
            <div className="max-h-[200px] overflow-y-auto border rounded-md p-1">
              {filteredUsers.length === 0 ? (
                <div className="py-6 text-center text-muted-foreground">
                  No users found
                </div>
              ) : (
                filteredUsers.map((user) => (
                  <div 
                    key={user._id}
                    className="flex items-center justify-between p-2 hover:bg-accent hover:text-accent-foreground rounded-md cursor-pointer"
                    onClick={() => toggleUserSelection(user._id)}
                  >
                    <div className="flex items-center space-x-2">
                      <input 
                        type="checkbox" 
                        checked={selectedUserIds.includes(user._id)}
                        onChange={() => {}}
                        className="h-4 w-4"
                      />
                      <div className="font-medium">
                        {user.firstName} {user.lastName}
                      </div>
                      <Badge variant="outline" className="ml-2">{user.rank}</Badge>
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {user.phoneNumber}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isSendingMessage}
          >
            Cancel
          </Button>
          <Button
            onClick={sendMessage}
            disabled={isSendingMessage || !messageContent.trim() || selectedUserIds.length === 0}
          >
            {isSendingMessage ? 'Sending...' : 'Send Message'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
} 