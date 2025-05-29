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
import { Search, Paperclip, X, FileText, ImageIcon, UploadCloud } from 'lucide-react';
import { api } from '@/lib/axios';
import { toast } from 'sonner';
import { supabase } from '@/lib/supabaseClient';

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
  
  // New state for media handling
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [filePreviews, setFilePreviews] = useState<string[]>([]);
  const [uploadProgress, setUploadProgress] = useState<Record<string, number>>({});
  const [mediaUrls, setMediaUrls] = useState<string[]>([]);

  const fileInputRef = useRef<HTMLInputElement>(null);
  
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
    if (!messageContent.trim() && selectedFiles.length === 0) {
      toast.error('Please enter a message or select a file.');
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

      let uploadedMediaUrls: string[] = [];

      if (selectedFiles.length > 0) {
        setUploadProgress({}); // Reset progress - this will be unused for now
        const uploadPromises = selectedFiles.map(async (file, index) => {
          const fileName = `${Date.now()}_${file.name.replace(/[^a-zA-Z0-9.]/g, '_')}`;
          const filePath = `public/${fileName}`; 

          try {
            // Show a generic "uploading" toast for each file
            const uploadToastId = toast.loading(`Uploading ${file.name}...`);

            const { data, error: uploadError } = await supabase.storage
              .from('rathyatraapp') // Your bucket name
              .upload(filePath, file, {
                cacheControl: '3600',
                upsert: false,
                contentType: file.type,
                // onUploadProgress removed
              });

            if (uploadError) {
              toast.error(`Failed to upload ${file.name}: ${uploadError.message}`, { id: uploadToastId });
              throw uploadError;
            }

            toast.success(`${file.name} uploaded successfully!`, { id: uploadToastId });

            // Get public URL
            const { data: publicUrlData } = supabase.storage
              .from('rathyatraapp')
              .getPublicUrl(filePath);

            if (!publicUrlData || !publicUrlData.publicUrl) {
                throw new Error('Could not get public URL for uploaded file.');
            }
            return publicUrlData.publicUrl;

          } catch (err) {
            console.error(`Error uploading ${file.name}:`, err);
            toast.error(`Failed to upload ${file.name}.`);
            throw err; // Re-throw to stop message sending if an upload fails
          }
        });

        try {
          uploadedMediaUrls = await Promise.all(uploadPromises);
          setMediaUrls(uploadedMediaUrls); // Store for potential later use, though API sends them
        } catch (uploadError) {
          // Error already toasted, just stop execution
          setIsSendingMessage(false);
          return;
        }
      }

      const response = await api.post('/admin/send-message', {
        message: messageContent,
        userIds: selectedUserIds,
        adminId,
        mediaUrls: uploadedMediaUrls, // Send the array of public URLs
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
  }, [messageContent, selectedUserIds, onMessageSent, onOpenChange, selectedFiles, usersRef, preSelectedIdsRef]);

  // Reset on dialog close
  useEffect(() => {
    if (!open) {
      setMessageContent('');
      setSelectedFiles([]); // Clear selected files
      setFilePreviews([]);  // Clear previews
      setUploadProgress({}); // Clear progress
      setMediaUrls([]);     // Clear media URLs
      
      // Only reset selected users if not using pre-selected ones
      if (preSelectedIdsRef.current.length === 0) {
        setSelectedUserIds([]);
      }
    }
  }, [open]);

  // ---- START: Media Handling Functions ----
  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const incomingFiles = Array.from(event.target.files || []);
    if (!incomingFiles.length) return;

    const currentFileCount = selectedFiles.length;
    let allowedNewFiles: File[] = [];

    for (const file of incomingFiles) {
      if (allowedNewFiles.length + currentFileCount >= 3) {
        toast.error('You can select a maximum of 3 files.');
        break; // Stop processing further files if limit is reached
      }
      if (file.size > 10 * 1024 * 1024) { // 10MB limit
        toast.error(`File ${file.name} exceeds the 10MB size limit.`);
        continue; // Skip this file
      }
      if (!['image/jpeg', 'image/png', 'image/gif', 'application/pdf'].includes(file.type)) {
        toast.error(`File type for ${file.name} is not supported. Only JPG, PNG, GIF, PDF are allowed.`);
        continue; // Skip this file
      }
      allowedNewFiles.push(file);
    }

    if (allowedNewFiles.length === 0 && incomingFiles.length > 0) {
        // This case means all incoming files were filtered out, and toasts were shown for reasons.
        // Or no files were actually selected that passed initial checks.
        if (fileInputRef.current) {
            fileInputRef.current.value = ''; // Clear input if all were invalid or no new valid files
        }
        return;
    }

    setSelectedFiles(prevFiles => [...prevFiles, ...allowedNewFiles].slice(0, 3));

    allowedNewFiles.forEach(file => {
      if (file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onloadend = () => {
          setFilePreviews(prevPreviews => [...prevPreviews, reader.result as string]);
        };
        reader.readAsDataURL(file);
      } else {
        // For non-image files like PDFs, we don't generate a data URL preview for display
        // We'll use an icon instead. We store the file name or a placeholder for preview purposes.
        setFilePreviews(prevPreviews => [...prevPreviews, file.name]); 
      }
    });

    // Clear the file input value to allow selecting the same file again if removed
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const removeFile = (index: number) => {
    setSelectedFiles(prevFiles => prevFiles.filter((_, i) => i !== index));
    setFilePreviews(prevPreviews => prevPreviews.filter((_, i) => i !== index));
    // Also clear any upload progress for this file if needed (not implemented yet)
    // setMediaUrls if an already uploaded URL needs to be removed (not implemented yet)
  };
  // ---- END: Media Handling Functions ----

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
          <div className="space-y-2 mt-4">
            <Label htmlFor="media-upload">Attach Media (Images/PDF, up to 3 files, 10MB each)</Label>
            <div className="flex items-center gap-2">
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => fileInputRef.current?.click()}
                disabled={selectedFiles.length >= 3 || isSendingMessage}
              >
                <Paperclip className="mr-2 h-4 w-4" /> 
                {selectedFiles.length >= 3 ? 'Max files reached' : 'Add Files'}
              </Button>
              <input 
                type="file" 
                ref={fileInputRef} 
                onChange={handleFileSelect} 
                multiple 
                accept="image/jpeg,image/png,image/gif,application/pdf" 
                className="hidden" 
              />
            </div>
            {selectedFiles.length > 0 && (
              <div className="mt-3 grid grid-cols-2 sm:grid-cols-3 gap-3">
                {filePreviews.map((previewSrcOrName, index) => {
                  const file = selectedFiles[index];
                  const isImage = file.type.startsWith('image/');
                  return (
                    <div key={index} className="relative group border rounded-md p-1.5">
                      {isImage ? (
                        <img 
                          src={previewSrcOrName} 
                          alt={`Preview ${file.name}`} 
                          className="h-24 w-full object-cover rounded-md" />
                      ) : (
                        <div className="h-24 w-full flex flex-col items-center justify-center bg-gray-100 rounded-md">
                          <FileText className="h-10 w-10 text-gray-500" />
                          <p className="text-xs text-gray-600 mt-1 truncate w-full text-center px-1">
                            {file.name}
                          </p>
                        </div>
                      )}
                      <Button 
                        type="button" 
                        variant="destructive" 
                        size="icon" 
                        className="absolute top-1 right-1 h-6 w-6 opacity-75 group-hover:opacity-100"
                        onClick={() => removeFile(index)}
                        disabled={isSendingMessage}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                      {uploadProgress[file.name] !== undefined && (
                        <div className="absolute bottom-1 left-1 right-1 h-1.5 bg-gray-200 rounded-full overflow-hidden">
                           <div 
                             className="h-full bg-blue-500"
                             style={{ width: `${uploadProgress[file.name]}%` }}
                           ></div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
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
            disabled={isSendingMessage || ( !messageContent.trim() && selectedFiles.length === 0 ) || selectedUserIds.length === 0}
          >
            {isSendingMessage ? 'Sending...' : 'Send Message'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
} 