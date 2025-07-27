/*export interface Reader {
    
    id: string;
    name: string;
    email: string;
    phone: string;
    address: string;
    _id?: string; // Optional for cases where the ID is not used
}

export interface Book {

    id: string;
    title: string;
    author: string;
    isbn: string;
    status: boolean;
    _id?: string; // Optional for cases where the ID is not used
}

export interface LendingTransaction {
    id: string;
    bookId: string;
    readerId: string;
    lendDate: string;
    dueDate: string;
    returnDate: string | null;
    status?: 'active' | 'returned' | 'overdue';
}


export interface DropdownItem  {

    _id?: string;
    name?: string; // For readers
    title?: string; // For books
    isAvailable?: boolean; // For books
};


export interface OverdueBookDetails {
  bookId: string;
  bookTitle: string;
  dueDate: string;
  daysOverdue: number;
  lendDate: string;
}

export interface NotificationData {
  readerEmail: string;
  readerName: string;
  subject: string;
  message: string;
  overdueBooks: OverdueBookDetails[];
}

export interface NotificationResult {
  success: boolean;
  error?: string;
  messageId?: string;
}
*/

// types/index.ts - Complete updated file

export interface Reader {
  id: string;
  name: string;
  email: string;
  phone: string;
  address: string;
  _id?: string; // Optional for cases where the ID is not used
}

export interface Book {
  id: string;
  title: string;
  author: string;
  isbn: string;
  status: boolean;
  _id?: string; // Optional for cases where the ID is not used
}

export interface LendingTransaction {
  id: string;
  bookId: string;
  readerId: string;
  lendDate: string;
  dueDate: string;
  returnDate: string | null;
  status?: 'active' | 'returned' | 'overdue';
}

export interface DropdownItem {
    id: string;
  _id?: string;
  name?: string; // For readers
  title?: string; // For books
  email?: string; // For readers (needed for notifications)
  isAvailable?: boolean; // For books
}

// Notification-related interfaces
export interface OverdueBookDetails {
  bookId: string;
  bookTitle: string;
  dueDate: string;
  daysOverdue: number;
  lendDate: string;
}

export interface NotificationData {
  readerEmail: string;
  readerName: string;
  subject: string;
  message: string;
  overdueBooks: OverdueBookDetails[];
}

export interface NotificationResult {
  success: boolean;
  error?: string;
  messageId?: string;
}

export interface OverdueReader {
  readerId: string;
  readerName: string;
  readerEmail: string;
  overdueBooks: OverdueBookDetails[];
  totalOverdueBooks: number;
  _id?: string; // Optional for cases where the ID is not used
}

export interface NotificationHistory {
  id: string;
  readerId: string;
  readerName: string;
  readerEmail: string;
  bookTitles: string[];
  sentAt: string;
  status: 'success' | 'failed';
  errorMessage?: string;
}

export interface EmailTemplate {
  subject: string;
  message: string;
}

export interface NotificationStats {
  totalSent: number;
  totalFailed: number;
  sentToday: number;
  recentNotifications: Array<{
    id: string;
    readerEmail: string;
    readerName: string;
    subject: string;
    status: 'sent' | 'failed';
    sentAt: string;
    errorMessage?: string;
  }>;
}

// API Response types for notifications
export interface ApiResponse<T = any> {
  success: boolean;
  message: string;
  data?: T;
  error?: string;
}

export interface BulkNotificationResponse {
  success: boolean;
  message: string;
  results: NotificationResult[];
  summary: {
    total: number;
    sent: number;
    failed: number;
  };
}

// Pagination interface for notification history
export interface NotificationHistoryResponse {
  notifications: NotificationHistory[];
  total: number;
  page: number;
  totalPages: number;
}