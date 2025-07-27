import React, { useState, useEffect } from 'react';
import { Button } from "../components/Button.tsx";
import { Modal } from "../components/Modal.tsx";
import { Input } from '../components/Input.tsx';
import Table from "../components/Table.tsx";
import type { LendingTransaction, DropdownItem } from "../types/index.ts";
import axios from "axios";
import toast from "react-hot-toast";
import { getAllLendingTransactions } from "../services/lendingService.ts";
import { getAllReaders } from "../services/readerService.ts";
import { getAllBooks } from "../services/bookService.ts";
import { sendOverdueNotification, sendBulkOverdueNotifications } from "../services/notificationService.ts";

// Enhanced types for notification management
interface OverdueReader {
  id: string; // Added for Table component compatibility
  readerId: string;
  readerName: string;
  readerEmail: string;
  overdueBooks: Array<{
    bookId: string;
    bookTitle: string;
    dueDate: string;
    daysOverdue: number;
    lendDate: string;
  }>;
  totalOverdueBooks: number;
}

interface NotificationHistory {
  id: string;
  readerId: string;
  readerName: string;
  readerEmail: string;
  bookTitles: string[];
  sentAt: string;
  status: 'success' | 'failed';
  errorMessage?: string;
}

const NotificationsPage: React.FC = () => {
  const [transactions, setTransactions] = useState<LendingTransaction[]>([]);
  const [readers, setReaders] = useState<DropdownItem[]>([]);
  const [books, setBooks] = useState<DropdownItem[]>([]);
  const [overdueReaders, setOverdueReaders] = useState<OverdueReader[]>([]);
  const [notificationHistory, setNotificationHistory] = useState<NotificationHistory[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [selectedReaders, setSelectedReaders] = useState<Set<string>>(new Set());
  const [searchTerm, setSearchTerm] = useState('');
  const [isPreviewModalOpen, setIsPreviewModalOpen] = useState(false);
  const [previewReader, setPreviewReader] = useState<OverdueReader | null>(null);
  const [emailTemplate, setEmailTemplate] = useState({
    subject: 'Overdue Books Reminder - Library System',
    message: `Dear {readerName},

This is a friendly reminder that you have overdue books from our library.

Overdue Books:
{bookDetails}

Please return these books as soon as possible to avoid any additional fees.

Thank you for your cooperation.

Best regards,
Library Management System`
  });
console.log(setEmailTemplate,readers,books,transactions)
  // Fetch all required data
  const fetchAllData = async () => {
    try {
      setIsLoading(true);
      const [transactionsResult, readersResult, booksResult] = await Promise.all([
        getAllLendingTransactions(),
        getAllReaders(),
        getAllBooks()
      ]);
      
      console.log("Fetched transactions:", transactionsResult);
      console.log("Fetched readers:", readersResult);
      console.log("Fetched books:", booksResult);
      
      // Log the structure of the first items to understand the data format
      if (transactionsResult.length > 0) {
        console.log("First transaction structure:", transactionsResult[0]);
      }
      if (readersResult.length > 0) {
        console.log("First reader structure:", readersResult[0]);
      }
      if (booksResult.length > 0) {
        console.log("First book structure:", booksResult[0]);
      }

      setTransactions(transactionsResult);
      setReaders(readersResult);
      setBooks(booksResult);
      
      // Process overdue readers
      processOverdueReaders(transactionsResult, readersResult, booksResult);
    } catch (error) {
      if (axios.isAxiosError(error)) {
        toast.error(error.response?.data?.message || error.message);
      } else {
        toast.error("Failed to fetch data");
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Process overdue readers from transactions
  const processOverdueReaders = (
    transactions: LendingTransaction[],
    readers: DropdownItem[],
    books: DropdownItem[]
  ) => {
    console.log("Processing overdue readers...");
    console.log("Transactions count:", transactions.length);
    console.log("Readers count:", readers.length);
    console.log("Books count:", books.length);

    const today = new Date();
    const overdueMap = new Map<string, OverdueReader>();

    transactions.forEach((transaction, index) => {
      console.log(`Processing transaction ${index}:`, transaction);
      
      // Skip returned books
      if (transaction.returnDate) {
        console.log(`Skipping returned book for transaction ${index}`);
        return;
      }

      const dueDate = new Date(transaction.dueDate);
      const isOverdue = today > dueDate;
      
      console.log(`Transaction ${index} - Due date: ${dueDate}, Is overdue: ${isOverdue}`);

      if (isOverdue) {
        // Fix: Use 'id' instead of '_id' for matching
        const reader = readers.find(r => r.id === transaction.readerId);
        
        // Try to find book by ID first, then by title if needed
        let book = books.find(b => (b.id || b._id) === transaction.bookId);
        if (!book) {
          // If not found by ID, try to find by title (in case bookId contains title)
          book = books.find(b => b.title === transaction.bookId || b.name === transaction.bookId);
        }
        
        console.log(`Looking for reader with ID ${transaction.readerId}:`, reader);
        console.log(`Looking for book with ID/title ${transaction.bookId}:`, book);
        console.log("Available books:", books.map(b => ({ id: b.id || b._id, title: b.title || b.name })));
        
        if (reader && book) {
          const daysOverdue = Math.floor((today.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24));
          
          if (!overdueMap.has(transaction.readerId)) {
            overdueMap.set(transaction.readerId, {
              id: transaction.readerId, // Added for Table component compatibility
              readerId: transaction.readerId,
              readerName: reader.name || '',
              readerEmail: reader.email || '',
              overdueBooks: [],
              totalOverdueBooks: 0
            });
          }

          const overdueReader = overdueMap.get(transaction.readerId)!;
          overdueReader.overdueBooks.push({
            bookId: transaction.bookId,
            bookTitle: book.title || book.name || 'Unknown Book',
            dueDate: transaction.dueDate,
            daysOverdue,
            lendDate: transaction.lendDate
          });
          overdueReader.totalOverdueBooks++;
          
          console.log(`Added overdue book to reader ${reader.name}:`, overdueReader);
        } else {
          console.log(`Missing data - Reader found: ${!!reader}, Book found: ${!!book}`);
        }
      }
    });

    const overdueReadersArray = Array.from(overdueMap.values());
    console.log("Final overdue readers:", overdueReadersArray);
    setOverdueReaders(overdueReadersArray);
  };

  useEffect(() => {
    fetchAllData();
  }, []);

  // Calculate days overdue
  /* const calculateDaysOverdue = (dueDate: string) => {
    const today = new Date();
    const due = new Date(dueDate);
    return Math.floor((today.getTime() - due.getTime()) / (1000 * 60 * 60 * 24));
  }; */

  // Handle individual reader selection
  const handleReaderSelection = (readerId: string) => {
    const newSelected = new Set(selectedReaders);
    if (newSelected.has(readerId)) {
      newSelected.delete(readerId);
    } else {
      newSelected.add(readerId);
    }
    setSelectedReaders(newSelected);
  };

  // Handle select all/none
  const handleSelectAll = () => {
    if (selectedReaders.size === filteredOverdueReaders.length) {
      setSelectedReaders(new Set());
    } else {
      setSelectedReaders(new Set(filteredOverdueReaders.map(r => r.readerId)));
    }
  };

  // Filter overdue readers based on search
  const filteredOverdueReaders = overdueReaders.filter(reader =>
    reader.readerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    reader.readerEmail.toLowerCase().includes(searchTerm.toLowerCase()) ||
    reader.overdueBooks.some(book => 
      book.bookTitle.toLowerCase().includes(searchTerm.toLowerCase())
    )
  );

  // Send notification to single reader
  const sendSingleNotification = async (reader: OverdueReader) => {
    try {
      setIsSending(true);
      
      const bookDetails = reader.overdueBooks.map(book => 
        `• ${book.bookTitle} (Due: ${new Date(book.dueDate).toLocaleDateString()}, ${book.daysOverdue} days overdue)`
      ).join('\n');

      const personalizedMessage = emailTemplate.message
        .replace('{readerName}', reader.readerName)
        .replace('{bookDetails}', bookDetails);

      await sendOverdueNotification({
        readerEmail: reader.readerEmail,
        readerName: reader.readerName,
        subject: emailTemplate.subject,
        message: personalizedMessage,
        overdueBooks: reader.overdueBooks
      });

      // Add to notification history
      const historyEntry: NotificationHistory = {
        id: Date.now().toString(),
        readerId: reader.readerId,
        readerName: reader.readerName,
        readerEmail: reader.readerEmail,
        bookTitles: reader.overdueBooks.map(b => b.bookTitle),
        sentAt: new Date().toISOString(),
        status: 'success'
      };
      
      setNotificationHistory(prev => [historyEntry, ...prev]);
      toast.success(`Notification sent to ${reader.readerName}`);
    } catch (error) {
      const historyEntry: NotificationHistory = {
        id: Date.now().toString(),
        readerId: reader.readerId,
        readerName: reader.readerName,
        readerEmail: reader.readerEmail,
        bookTitles: reader.overdueBooks.map(b => b.bookTitle),
        sentAt: new Date().toISOString(),
        status: 'failed',
        errorMessage: error instanceof Error ? error.message : 'Unknown error'
      };
      
      setNotificationHistory(prev => [historyEntry, ...prev]);
      toast.error(`Failed to send notification to ${reader.readerName}`);
    } finally {
      setIsSending(false);
    }
  };

  // Send bulk notifications
  const sendBulkNotifications = async () => {
    if (selectedReaders.size === 0) {
      toast.error('Please select at least one reader');
      return;
    }

    try {
      setIsSending(true);
      const selectedReaderData = overdueReaders.filter(r => selectedReaders.has(r.readerId));
      
      const notifications = selectedReaderData.map(reader => {
        const bookDetails = reader.overdueBooks.map(book => 
          `• ${book.bookTitle} (Due: ${new Date(book.dueDate).toLocaleDateString()}, ${book.daysOverdue} days overdue)`
        ).join('\n');

        const personalizedMessage = emailTemplate.message
          .replace('{readerName}', reader.readerName)
          .replace('{bookDetails}', bookDetails);

        return {
          readerEmail: reader.readerEmail,
          readerName: reader.readerName,
          subject: emailTemplate.subject,
          message: personalizedMessage,
          overdueBooks: reader.overdueBooks
        };
      });

      const results = await sendBulkOverdueNotifications(notifications);
      
      // Process results and update history
      results.forEach((result, index) => {
        const reader = selectedReaderData[index];
        const historyEntry: NotificationHistory = {
          id: `${Date.now()}-${index}`,
          readerId: reader.readerId,
          readerName: reader.readerName,
          readerEmail: reader.readerEmail,
          bookTitles: reader.overdueBooks.map(b => b.bookTitle),
          sentAt: new Date().toISOString(),
          status: result.success ? 'success' : 'failed',
          errorMessage: result.error
        };
        
        setNotificationHistory(prev => [historyEntry, ...prev]);
      });

      const successCount = results.filter(r => r.success).length;
      const failedCount = results.filter(r => !r.success).length;

      if (successCount > 0) {
        toast.success(`${successCount} notification(s) sent successfully`);
      }
      if (failedCount > 0) {
        toast.error(`${failedCount} notification(s) failed to send`);
      }

      setSelectedReaders(new Set());
    } catch (error) {
      toast.error('Failed to send bulk notifications');
    } finally {
      setIsSending(false);
    }
  };

  // Preview email
  const previewEmail = (reader: OverdueReader) => {
    setPreviewReader(reader);
    setIsPreviewModalOpen(true);
  };

  const getPreviewContent = () => {
    if (!previewReader) return { subject: '', message: '' };

    const bookDetails = previewReader.overdueBooks.map(book => 
      `• ${book.bookTitle} (Due: ${new Date(book.dueDate).toLocaleDateString()}, ${book.daysOverdue} days overdue)`
    ).join('\n');

    const personalizedMessage = emailTemplate.message
      .replace('{readerName}', previewReader.readerName)
      .replace('{bookDetails}', bookDetails);

    return {
      subject: emailTemplate.subject,
      message: personalizedMessage
    };
  };

  // Table columns for overdue readers
  const overdueColumns = [
    {
      key: 'select' as const,
      header: (
        <input
          type="checkbox"
          checked={selectedReaders.size === filteredOverdueReaders.length && filteredOverdueReaders.length > 0}
          onChange={handleSelectAll}
          className="rounded border-gray-300"
        />
      ),
      render: (reader: OverdueReader) => (
        <input
          type="checkbox"
          checked={selectedReaders.has(reader.readerId)}
          onChange={() => handleReaderSelection(reader.readerId)}
          className="rounded border-gray-300"
        />
      ),
    },
    { 
      key: 'readerName' as keyof OverdueReader, 
      header: 'Reader Name',
      render: (reader: OverdueReader) => (
        <div>
          <div className="font-medium">{reader.readerName}</div>
          <div className="text-sm text-gray-500">{reader.readerEmail}</div>
        </div>
      )
    },
    { 
      key: 'totalOverdueBooks' as keyof OverdueReader, 
      header: 'Overdue Books',
      render: (reader: OverdueReader) => (
        <span className="px-2 py-1 bg-red-100 text-red-800 rounded-full text-sm font-medium">
          {reader.totalOverdueBooks}
        </span>
      )
    },
    {
      key: 'overdueBooks' as keyof OverdueReader,
      header: 'Book Details',
      render: (reader: OverdueReader) => (
        <div className="space-y-1">
          {reader.overdueBooks.slice(0, 2).map((book, index) => (
            <div key={index} className="text-sm">
              <span className="font-medium">{book.bookTitle}</span>
              <span className="text-red-600 ml-2">({book.daysOverdue} days overdue)</span>
            </div>
          ))}
          {reader.overdueBooks.length > 2 && (
            <div className="text-sm text-gray-500">
              +{reader.overdueBooks.length - 2} more books
            </div>
          )}
        </div>
      ),
    },
    {
      key: 'actions' as const,
      header: 'Actions',
      render: (reader: OverdueReader) => (
        <div className="space-x-2">
          <Button
            variant="primary"
            size="sm"
            onClick={() => previewEmail(reader)}
            disabled={isSending}
          >
            Preview
          </Button>
          <Button
            variant="secondary"
            size="sm"
            onClick={() => sendSingleNotification(reader)}
            disabled={isSending || !reader.readerEmail}
          >
            {isSending ? 'Sending...' : 'Send'}
          </Button>
        </div>
      ),
    },
  ];

  // Table columns for notification history
  const historyColumns = [
    { key: 'sentAt' as keyof NotificationHistory, header: 'Sent At', render: (h: NotificationHistory) => new Date(h.sentAt).toLocaleString() },
    { key: 'readerName' as keyof NotificationHistory, header: 'Reader', render: (h: NotificationHistory) => (
      <div>
        <div className="font-medium">{h.readerName}</div>
        <div className="text-sm text-gray-500">{h.readerEmail}</div>
      </div>
    )},
    { key: 'bookTitles' as keyof NotificationHistory, header: 'Books', render: (h: NotificationHistory) => h.bookTitles.join(', ') },
    { 
      key: 'status' as keyof NotificationHistory, 
      header: 'Status',
      render: (h: NotificationHistory) => (
        <span className={`px-2 py-1 rounded-full text-sm font-medium ${
          h.status === 'success' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
        }`}>
          {h.status === 'success' ? 'Sent' : 'Failed'}
        </span>
      )
    },
  ];

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading notification data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 bg-gray-100 min-h-screen">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-800">Notifications</h1>
            <p className="text-gray-600 mt-1">Send overdue book notifications to readers</p>
          </div>
          <div className="space-x-3">
            <Button 
              onClick={sendBulkNotifications}
              disabled={isSending || selectedReaders.size === 0}
              variant="primary"
            >
              {isSending ? 'Sending...' : `Send to Selected (${selectedReaders.size})`}
            </Button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-lg font-semibold text-gray-700">Overdue Readers</h3>
            <p className="text-3xl font-bold text-red-600">{overdueReaders.length}</p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-lg font-semibold text-gray-700">Total Overdue Books</h3>
            <p className="text-3xl font-bold text-red-600">
              {overdueReaders.reduce((sum, reader) => sum + reader.totalOverdueBooks, 0)}
            </p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-lg font-semibold text-gray-700">Notifications Sent Today</h3>
            <p className="text-3xl font-bold text-green-600">
              {notificationHistory.filter(h => 
                new Date(h.sentAt).toDateString() === new Date().toDateString() && h.status === 'success'
              ).length}
            </p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-lg font-semibold text-gray-700">Failed Notifications</h3>
            <p className="text-3xl font-bold text-yellow-600">
              {notificationHistory.filter(h => h.status === 'failed').length}
            </p>
          </div>
        </div>
        

         {/* Email Template Configuration */}
        {/* <div className="bg-white p-6 rounded-lg shadow mb-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">Email Template</h2>
          <div className="space-y-4">
            <Input
              label="Subject Line"
              value={emailTemplate.subject}
              onChange={(e) => setEmailTemplate(prev => ({ ...prev, subject: e.target.value }))}
              placeholder="Enter email subject"
            />
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Message Template
              </label>
              <textarea
                value={emailTemplate.message}
                onChange={(e) => setEmailTemplate(prev => ({ ...prev, message: e.target.value }))}
                rows={8}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Enter email message template. Use {readerName} and {bookDetails} as placeholders."
              />
              <p className="text-sm text-gray-500 mt-2">
                Available placeholders: {'{readerName}'}, {'{bookDetails}'}
              </p>
            </div>
          </div>
        </div> */}


        {/* Search and Filter */}
        <div className="bg-white p-6 rounded-lg shadow mb-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <Input
                label="Search Readers"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search by reader name, email, or book title..."
              />
            </div>
          </div>
        </div>

        {/* Overdue Readers Table */}
        
        <div className="bg-white rounded-lg shadow mb-6">
          <div className="p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold text-gray-800">Readers with Overdue Books</h2>
              <p className="text-sm text-gray-600">
                Showing {filteredOverdueReaders.length} of {overdueReaders.length} overdue readers
              </p>
            </div>
            {filteredOverdueReaders.length > 0 ? (
              <Table
                data={filteredOverdueReaders}
                columns={overdueColumns as any} // Type assertion to bypass TypeScript check
              />
            ) : (
              <div className="text-center py-8">
                <p className="text-gray-500">No overdue books found</p>
              </div>
            )}
          </div>
        </div>

        {/* Notification History */}
        <div className="bg-white rounded-lg shadow">
          <div className="p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold text-gray-800">Notification History</h2>
              <p className="text-sm text-gray-600">
                Recent notifications sent
              </p>
            </div>
            {notificationHistory.length > 0 ? (
              <Table data={notificationHistory.slice(0, 10)} columns={historyColumns} />
            ) : (
              <div className="text-center py-8">
                <p className="text-gray-500">No notifications sent yet</p>
              </div>
            )}
          </div>
        </div>

        {/* Email Preview Modal */}
        <Modal 
          isOpen={isPreviewModalOpen} 
          onClose={() => setIsPreviewModalOpen(false)} 
          title={`Email Preview - ${previewReader?.readerName}`}
        >
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Subject
              </label>
              <div className="p-3 bg-gray-50 rounded-md border">
                {getPreviewContent().subject}
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Message
              </label>
              <div className="p-3 bg-gray-50 rounded-md border whitespace-pre-wrap">
                {getPreviewContent().message}
              </div>
            </div>
            <div className="flex justify-end space-x-2 mt-6">
              <Button 
                variant="secondary" 
                onClick={() => setIsPreviewModalOpen(false)}
              >
                Close
              </Button>
              <Button 
                variant="primary" 
                onClick={() => {
                  if (previewReader) {
                    sendSingleNotification(previewReader);
                    setIsPreviewModalOpen(false);
                  }
                }}
                disabled={isSending || !previewReader?.readerEmail}
              >
                {isSending ? 'Sending...' : 'Send Now'}
              </Button>
            </div>
          </div>
        </Modal>
      </div>
    </div>
  );
};

export default NotificationsPage;