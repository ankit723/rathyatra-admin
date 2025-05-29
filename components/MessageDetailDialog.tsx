import { useState } from 'react';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle,
  DialogDescription,
  DialogFooter
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Calendar, User, UsersRound, ChevronLeft, ChevronRight, File } from 'lucide-react';
import Image from 'next/image';
import { format } from 'date-fns';
import { Card } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';

interface Recipient {
  userId: string;
  firstName: string;
  lastName: string;
}

interface Message {
  _id: string;
  content: string;
  mediaUrls: string[];
  sentTo: Recipient[];
  sentAt: string;
}

interface Admin {
  _id: string;
  email: string;
}

interface MessageDetailDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  message: Message | null;
  admin: Admin | null;
}

export default function MessageDetailDialog({
  open,
  onOpenChange,
  message,
  admin
}: MessageDetailDialogProps) {
  const [currentPage, setCurrentPage] = useState(1);
  const recipientsPerPage = 10;

  if (!message || !admin) return null;

  console.log("message", message);
  
  // Format date
  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    return format(date, 'MMMM d, yyyy h:mm a');
  };
  
  // Calculate pagination
  const totalPages = Math.ceil(message.sentTo.length / recipientsPerPage);
  const startIndex = (currentPage - 1) * recipientsPerPage;
  const endIndex = Math.min(startIndex + recipientsPerPage, message.sentTo.length);
  const currentRecipients = message.sentTo.slice(startIndex, endIndex);
  
  // Handle page changes
  const nextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage(currentPage + 1);
    }
  };
  
  const prevPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[800px] max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Message Details</DialogTitle>
          <DialogDescription>
            View complete information about this message
          </DialogDescription>
        </DialogHeader>
        
        <div className="flex flex-col space-y-6 overflow-auto py-4">
          {/* Message metadata */}
          <div className="flex flex-col md:flex-row justify-between gap-4 items-start md:items-center px-1">
            <div className="flex items-center gap-2">
              <User className="h-5 w-5 text-primary" />
              <div>
                <div className="text-sm text-muted-foreground">Sent by</div>
                <div className="font-medium">{admin.email}</div>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <Calendar className="h-5 w-5 text-primary" />
              <div>
                <div className="text-sm text-muted-foreground">Sent on</div>
                <div className="font-medium">{formatDate(message.sentAt)}</div>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <UsersRound className="h-5 w-5 text-primary" />
              <div>
                <div className="text-sm text-muted-foreground">Recipients</div>
                <div className="font-medium">{message.sentTo.length} user{message.sentTo.length !== 1 ? 's' : ''}</div>
              </div>
            </div>
          </div>
          
          {/* Message content */}
          <Card className="p-4 bg-muted/50">
            <div className="text-sm font-medium mb-2 text-muted-foreground">Message Content</div>
            <ScrollArea className="h-[200px] w-full rounded-md">
              <div className="p-2 text-sm whitespace-pre-wrap">
                {message.content}
              </div>
            </ScrollArea>
          </Card>

          {/* Media */}
          <Card className="p-4 bg-muted/50">
            <div className="text-sm font-medium mb-2 text-muted-foreground">Media</div>
            <ScrollArea className="h-[200px] w-full rounded-md">
              <div className="p-2 text-sm whitespace-pre-wrap flex justify-between flex-wrap gap-2">
                {message.mediaUrls.map((media: string, index: number) => 
                  media.includes('pdf') ? (
                    <div key={index} className="flex items-center gap-2 p-2 rounded-md hover:bg-muted">
                      <a href={media} target="_blank" rel="noopener noreferrer">
                        <Image src="/pdf.png" alt="PDF" className="h-40 w-40 text-muted-foreground" width={20} height={20} />
                      </a>
                    </div>
                  ) : (
                    <div key={index}>
                      <Image src={media} alt="Media" className="w-40 h-40" width={50} height={50} />
                    </div>
                  )
                )}
                {message.mediaUrls.length === 0 && (
                  <div className="text-center py-8 text-muted-foreground">
                    No media found
                  </div>
                )}
              </div>
            </ScrollArea>
          </Card>

          {/* Recipients list */}
          <div>
            <div className="flex justify-between items-center mb-3">
              <div className="font-medium">Recipients</div>
              {totalPages > 1 && (
                <div className="flex items-center space-x-2 text-sm">
                  <Button 
                    variant="outline" 
                    size="icon" 
                    onClick={prevPage} 
                    disabled={currentPage === 1}
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <span>
                    Page {currentPage} of {totalPages}
                  </span>
                  <Button 
                    variant="outline" 
                    size="icon" 
                    onClick={nextPage} 
                    disabled={currentPage === totalPages}
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              )}
            </div>
            
            <Card className="overflow-hidden">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-4 gap-y-2 p-4">
                {currentRecipients.map((recipient, index) => (
                  <div key={index} className="flex items-center gap-2 p-2 rounded-md hover:bg-muted">
                    <User className="h-4 w-4 text-muted-foreground" />
                    <span>
                      {recipient.firstName} {recipient.lastName}
                    </span>
                  </div>
                ))}
              </div>
              
              {message.sentTo.length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  No recipients found
                </div>
              )}
            </Card>
          </div>
        </div>
        
        <DialogFooter>
          <Button onClick={() => onOpenChange(false)}>Close</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
} 