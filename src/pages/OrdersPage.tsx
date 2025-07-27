import React, { useState, useEffect } from 'react';
import { Button } from "../components/Button.tsx";
import { Modal } from "../components/Modal.tsx";
import { Input } from '../components/Input.tsx';
import Table from "../components/Table.tsx";
import type { LendingTransaction,DropdownItem } from "../types/index.ts";
import axios from "axios";
import toast from "react-hot-toast";
import { 
    getAllLendingTransactions, 
    deleteLendingTransaction, 
    addLendingTransaction, 
    updateLendingTransaction 
} from "../services/lendingService.ts";

// Assume you have these types defined, or define them simply if not.
// For example:
// type Reader = {
//     _id: string; // MongoDB's default ID
//     name: string;
//     // ... other reader properties
// };

// type Book = {
//     _id: string; // MongoDB's default ID
//     title: string;
//     isAvailable: boolean; // Crucial for selection
//     // ... other book properties
// };

// You'll need services to fetch readers and books
// For example, in `src/services/readerService.ts` and `src/services/bookService.ts`
import { getAllReaders } from "../services/readerService.ts"; 
import { getAllBooks } from "../services/bookService.ts";
import { sendOverdueNotification } from "../services/notificationService.ts";

// Define simplified types if you haven't already in your `types` file
// It's good practice to have distinct types for full objects vs. their dropdown representation


const OrdersPage: React.FC = () => {
    const [transactions, setTransactions] = useState<LendingTransaction[]>([]);
    const [isTransactionsLoading, setIsTransactionsLoading] = useState<boolean>(false);
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [currentTransaction, setCurrentTransaction] = useState<LendingTransaction | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'returned' | 'overdue'>('all');

    // New states for readers and books for dropdowns
    const [readers, setReaders] = useState<DropdownItem[]>([]);
    const [books, setBooks] = useState<DropdownItem[]>([]);
    const [areDropdownsLoading, setAreDropdownsLoading] = useState(false);

    // New states for form inputs (when using dropdowns, it's better to manage selected IDs explicitly)
    const [formBookId, setFormBookId] = useState('');
    const [formReaderId, setFormReaderId] = useState('');
    const [formLendDate, setFormLendDate] = useState('');
    const [formDueDate, setFormDueDate] = useState('');
    const [formReturnDate, setFormReturnDate] = useState<string | null>(null);


    // Fetch all lending transactions from backend
    const fetchAllTransactions = async () => {
        try {
            setIsTransactionsLoading(true);
            const result = await getAllLendingTransactions();
            setTransactions(result);
        } catch (error) {
            if (axios.isAxiosError(error)) {
                toast.error(error.response?.data?.message || error.message);
            } else {
                toast.error("Failed to fetch lending transactions");
            }
        } finally {
            setIsTransactionsLoading(false);
        }
    };

    // Fetch readers and books for dropdowns
    const fetchDropdownData = async () => {
        try {
            setAreDropdownsLoading(true);
            const [readersResult, booksResult] = await Promise.all([
                getAllReaders(),
                getAllBooks()
            ]);
            console.log("Fetched readers:", readersResult);
            console.log("Fetched books:", booksResult);
            setReaders(readersResult);
            setBooks(booksResult);
        } catch (error) {
            if (axios.isAxiosError(error)) {
                toast.error(`Failed to load dropdown data: ${error.response?.data?.message || error.message}`);
            } else {
                toast.error("Failed to load dropdown data.");
            }
        } finally {
            setAreDropdownsLoading(false);
        }
    };

    useEffect(() => {
        fetchAllTransactions();
        fetchDropdownData(); // Fetch dropdown data on component mount
    }, []);

    // Send notification for overdue books
    const sendOverdueNotifications = async (transactions: LendingTransaction[]) => {
        const overdueTransactions = transactions.filter(isOverdue);
        if (overdueTransactions.length === 0) return;

        for (const transaction of overdueTransactions) {
            const reader = readers.find(r => r._id === transaction.readerId);
            const book = books.find(b => b._id === transaction.bookId);

            if (reader && book && reader.email) {
                const daysOverdue = Math.floor((new Date().getTime() - new Date(transaction.dueDate).getTime()) / (1000 * 60 * 60 * 24));
                await sendOverdueNotification({
                    readerEmail: reader.email,
                    readerName: reader.name || 'N/A',
                    subject: 'Overdue Book Reminder',
                    message: `Dear ${reader.name},\n\nThis is a reminder that the book "${book.title}" was due on ${transaction.dueDate}. Please return it as soon as possible.\n\nThank you,\nLibrary Management System`,
                    overdueBooks: [{
                        bookId: book._id || '',
                        bookTitle: book.title || '',
                        dueDate: transaction.dueDate,
                        daysOverdue: daysOverdue,
                        lendDate: transaction.lendDate
                    }]
                });
            }
        }
    };

    useEffect(() => {
        if (transactions.length > 0 && readers.length > 0 && books.length > 0) {
            sendOverdueNotifications(transactions);
        }
    }, [transactions, readers, books]);

    // Delete transaction from backend
    const removeTransaction = async (id: string) => {
        try {
            await deleteLendingTransaction(id);
            toast.success("Lending record deleted successfully");
        } catch (error) {
            if (axios.isAxiosError(error)) {
                toast.error(error.response?.data?.message || error.message);
            } else {
                toast.error("Failed to delete lending record");
            }
            throw error;
        }
    };

    // Check if transaction is overdue
    const isOverdue = (transaction: LendingTransaction) => {
        if (transaction.returnDate) return false; // Already returned
        const today = new Date();
        const dueDate = new Date(transaction.dueDate);
        return today > dueDate;
    };

    // Get status with overdue check
    const getTransactionStatus = (transaction: LendingTransaction) => {
        if (transaction.returnDate) return 'returned';
        if (isOverdue(transaction)) return 'overdue';
        return 'active';
    };

    // Filter transactions based on search term and status
    const filteredTransactions = transactions.filter(transaction => {
        // We'll need to enhance search if we want to search by book title or reader name
        // For now, it searches by the ID string as before.
        const matchesSearch = transaction.bookId.toLowerCase().includes(searchTerm.toLowerCase()) ||
                               transaction.readerId.toLowerCase().includes(searchTerm.toLowerCase());
        
        const transactionStatus = getTransactionStatus(transaction);
        const matchesStatus = statusFilter === 'all' || transactionStatus === statusFilter;
        
        return matchesSearch && matchesStatus;
    });

    const columns = [
        // Update column headers if you plan to display names/titles
        { key: 'bookId' as keyof LendingTransaction, header: 'Book ID', render: (t: LendingTransaction) => {
            const book = books.find(b => b._id === t.bookId);
            return book ? book.title : t.bookId; // Display title if found, otherwise ID
        }},
        { key: 'readerId' as keyof LendingTransaction, header: 'Reader ID', render: (t: LendingTransaction) => {
            const reader = readers.find(r => r._id === t.readerId);
            return reader ? reader.name : t.readerId; // Display name if found, otherwise ID
        }},
        { key: 'lendDate' as keyof LendingTransaction, header: 'Lend Date' },
        { key: 'dueDate' as keyof LendingTransaction, header: 'Due Date' },
        {
            key: 'returnDate' as keyof LendingTransaction,
            header: 'Return Date',
            render: (t: LendingTransaction) => (t.returnDate ? new Date(t.returnDate).toISOString().split('T')[0] : 'Not Returned'),
        },
        {
            key: 'status' as const,
            header: 'Status',
            render: (t: LendingTransaction) => {
                const status = getTransactionStatus(t);
                const statusColors = {
                    active: 'bg-blue-100 text-blue-800',
                    returned: 'bg-green-100 text-green-800',
                    overdue: 'bg-red-100 text-red-800'
                };
                return (
                    <span className={`px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${statusColors[status]}`}>
                        {status.charAt(0).toUpperCase() + status.slice(1)}
                    </span>
                );
            },
        },
        {
            key: 'actions' as const,
            header: 'Actions',
            render: (t: LendingTransaction) => (
                <div className="space-x-2">
                    {!t.returnDate && (
                        <Button 
                            variant="primary" 
                            onClick={() => handleMarkReturned(t)}
                            disabled={isSubmitting}
                            size="sm"
                        >
                            Mark Returned
                        </Button>
                    )}
                    <Button 
                        variant="secondary" 
                        onClick={() => handleEdit(t)}
                        disabled={isSubmitting}
                        size="sm"
                    >
                        Edit
                    </Button>
                    <Button 
                        variant="danger" 
                        onClick={() => handleDeleteTransaction(t)}
                        disabled={isSubmitting}
                        size="sm"
                    >
                        Delete
                    </Button>
                </div>
            ),
        },
    ];

    const handleAdd = () => {
        setCurrentTransaction(null);
        // Reset form states for a new record
        setFormBookId('');
        setFormReaderId('');
        setFormLendDate(new Date().toISOString().split('T')[0]); // Default to today
        setFormDueDate('');
        setFormReturnDate(null);
        setIsAddModalOpen(true);
    };

    const handleEdit = (transaction: LendingTransaction) => {
        setCurrentTransaction(transaction);
        // Set form states with current transaction data
        setFormBookId(transaction.bookId);
        setFormReaderId(transaction.readerId);
        setFormLendDate(transaction.lendDate);
        setFormDueDate(transaction.dueDate);
        setFormReturnDate(transaction.returnDate || null);
        setIsEditModalOpen(true);
    };

    const handleDeleteTransaction = (transaction: LendingTransaction) => {
        setCurrentTransaction(transaction);
        setIsDeleteModalOpen(true);
    };

    const handleMarkReturned = async (transaction: LendingTransaction) => {
        try {
            setIsSubmitting(true);
            const updatedTransactionData = {
                bookId: transaction.bookId,
                readerId: transaction.readerId,
                lendDate: transaction.lendDate,
                dueDate: transaction.dueDate,
                returnDate: new Date().toISOString().split('T')[0] // Set current date as return date
            };
            
            const updatedTransaction = await updateLendingTransaction(transaction.id, updatedTransactionData);
            setTransactions(prev => 
                prev.map(t => t.id === transaction.id ? updatedTransaction : t)
            );
            toast.success("Book marked as returned successfully");
            await fetchDropdownData(); // Re-fetch books to update availability for the dropdowns

        } catch (error) {
            if (axios.isAxiosError(error)) {
                toast.error(error.response?.data?.message || error.message);
            } else {
                toast.error("Failed to mark book as returned");
            }
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleFormSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setIsSubmitting(true);

        // Use the form state values directly
        const transactionData = {
            bookId: formBookId,
            readerId: formReaderId,
            lendDate: formLendDate,
            dueDate: formDueDate,
            returnDate: formReturnDate,
        };

        try {
            if (currentTransaction) {
                // Update existing transaction
                const updatedTransaction = await updateLendingTransaction(currentTransaction.id, transactionData);
                setTransactions(prev =>
                    prev.map(t => t.id === currentTransaction.id ? updatedTransaction : t)
                );
                setIsEditModalOpen(false);
                toast.success("Lending record updated successfully");
            } else {
                // Add new transaction
                const newTransaction = await addLendingTransaction(transactionData);
                setTransactions(prev => [...prev, newTransaction]);
                setIsAddModalOpen(false);
                toast.success("Lending record added successfully");
            }
            setCurrentTransaction(null);
            await fetchDropdownData(); // Re-fetch books to update availability for the dropdowns
        } catch (error) {
            if (axios.isAxiosError(error)) {
                toast.error(error.response?.data?.message || error.message);
            } else {
                toast.error("Something went wrong");
            }
        } finally {
            setIsSubmitting(false);
        }
    };

    const confirmDelete = async () => {
        if (currentTransaction) {
            try {
                setIsSubmitting(true);
                await removeTransaction(currentTransaction.id);
                await fetchAllTransactions(); // Re-fetch all transactions after deletion
                await fetchDropdownData(); // Re-fetch books to update availability
            } catch (error) {
                // Error already handled in removeTransaction function
            } finally {
                setIsDeleteModalOpen(false);
                setCurrentTransaction(null);
                setIsSubmitting(false);
            }
        }
    };

    const cancelModal = () => {
        setIsAddModalOpen(false);
        setIsEditModalOpen(false);
        setIsDeleteModalOpen(false);
        setCurrentTransaction(null);
    };

    // Calculate statistics
    const activeTransactions = transactions.filter(t => getTransactionStatus(t) === 'active').length;
    const returnedTransactions = transactions.filter(t => getTransactionStatus(t) === 'returned').length;
    const overdueTransactions = transactions.filter(t => getTransactionStatus(t) === 'overdue').length;

    if (isTransactionsLoading || areDropdownsLoading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                    <p className="text-gray-600">Loading data...</p>
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
                        <h1 className="text-3xl font-bold text-gray-800">Lending Management</h1>
                        <p className="text-gray-600 mt-1">Manage book lending transactions</p>
                    </div>
                    <Button 
                        onClick={handleAdd}
                        disabled={isSubmitting}
                        className="flex items-center space-x-2"
                    >
                        <span>Record New Lending</span>
                    </Button>
                </div>

                {/* Stats Cards */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
                    <div className="bg-white p-6 rounded-lg shadow">
                        <h3 className="text-lg font-semibold text-gray-700">Total Transactions</h3>
                        <p className="text-3xl font-bold text-blue-600">{transactions.length}</p>
                    </div>
                    <div className="bg-white p-6 rounded-lg shadow">
                        <h3 className="text-lg font-semibold text-gray-700">Active</h3>
                        <p className="text-3xl font-bold text-blue-600">{activeTransactions}</p>
                    </div>
                    <div className="bg-white p-6 rounded-lg shadow">
                        <h3 className="text-lg font-semibold text-gray-700">Returned</h3>
                        <p className="text-3xl font-bold text-green-600">{returnedTransactions}</p>
                    </div>
                    <div className="bg-white p-6 rounded-lg shadow">
                        <h3 className="text-lg font-semibold text-gray-700">Overdue</h3>
                        <p className="text-3xl font-bold text-red-600">{overdueTransactions}</p>
                    </div>
                </div>

                {/* Search and Filter */}
                <div className="bg-white p-6 rounded-lg shadow mb-6">
                    <div className="flex flex-col md:flex-row gap-4">
                        <div className="flex-1">
                            <Input
                                label="Search Transactions"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                placeholder="Search by book ID or reader ID..."
                            />
                        </div>
                        <div className="md:w-48">
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Filter by Status
                            </label>
                            <select
                                value={statusFilter}
                                onChange={(e) => setStatusFilter(e.target.value as typeof statusFilter)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            >
                                <option value="all">All Transactions</option>
                                <option value="active">Active Only</option>
                                <option value="returned">Returned Only</option>
                                <option value="overdue">Overdue Only</option>
                            </select>
                        </div>
                    </div>
                </div>

                {/* Transactions Table */}
                <div className="bg-white rounded-lg shadow">
                    <div className="p-6">
                        <div className="flex justify-between items-center mb-4">
                            <h2 className="text-xl font-semibold text-gray-800">All Transactions</h2>
                            <p className="text-sm text-gray-600">
                                Showing {filteredTransactions.length} of {transactions.length} transactions
                            </p>
                        </div>
                        <Table data={filteredTransactions} columns={columns} />
                    </div>
                </div>

                {/* Add Transaction Modal */}
                <Modal 
                    isOpen={isAddModalOpen} 
                    onClose={cancelModal} 
                    title="Add New Lending Record"
                >
                    <form onSubmit={handleFormSubmit} className="space-y-4">
                        {/* Book Dropdown */}
                        <div>
                            <label htmlFor="add-book-select" className="block text-sm font-medium text-gray-700 mb-2">
                                Select Book
                            </label>
                            <select
                                id="add-book-select"
                                name="bookId"
                                value={formBookId}
                                onChange={(e) => setFormBookId(e.target.value)}
                                required
                                disabled={isSubmitting || areDropdownsLoading}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            >
                                <option value="">--Choose a Book--</option>
                                {books.map((book) => (
                                    <option
                                        key={book.title}
                                        value={book.title}
                                        //disabled={!book.isAvailable}
                                        //style={{ color: book.isAvailable ? 'inherit' : '#aaa' }}
                                    >
                                        {book.title} {book.isAvailable ? '' : '(Not Available)'}
                                    </option>
                                ))}
                            </select>
                        </div>

                        {/* Reader Dropdown */}
                        <div>
                            <label htmlFor="add-reader-select" className="block text-sm font-medium text-gray-700 mb-2">
                                Select Reader
                            </label>
                            <select
                                id="add-reader-select"
                                name="readerId"
                                value={formReaderId}
                                onChange={(e) => setFormReaderId(e.target.value)}
                                required
                                disabled={isSubmitting || areDropdownsLoading}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            >
                                <option value="">--Choose a Reader--</option>
                                {readers.map((reader) => (
                                    <option key={reader._id} value={reader._id}>
                                        {reader.name}
                                    </option>
                                ))}
                            </select>
                        </div>
                        
                        <Input 
                            label="Lend Date" 
                            name="lendDate" 
                            type="date" 
                            value={formLendDate}
                            onChange={(e) => setFormLendDate(e.target.value)}
                            required 
                            disabled={isSubmitting}
                        />
                        <Input 
                            label="Due Date" 
                            name="dueDate" 
                            type="date" 
                            value={formDueDate}
                            onChange={(e) => setFormDueDate(e.target.value)}
                            required 
                            disabled={isSubmitting}
                        />
                        {/* Return Date can remain an Input as it's optional and may be manually set/edited */}
                        <Input 
                            label="Return Date (Optional)" 
                            name="returnDate" 
                            type="date" 
                            value={formReturnDate || ''}
                            onChange={(e) => setFormReturnDate(e.target.value || null)}
                            disabled={isSubmitting}
                        />
                        <div className="flex justify-end space-x-2 mt-6">
                            <Button 
                                type="button" 
                                variant="secondary" 
                                onClick={cancelModal}
                                disabled={isSubmitting}
                            >
                                Cancel
                            </Button>
                            <Button 
                                type="submit" 
                                disabled={isSubmitting}
                            >
                                {isSubmitting ? 'Adding...' : 'Add Record'}
                            </Button>
                        </div>
                    </form>
                </Modal>

                {/* Edit Transaction Modal */}
                <Modal 
                    isOpen={isEditModalOpen} 
                    onClose={cancelModal} 
                    title="Edit Lending Record"
                >
                    <form onSubmit={handleFormSubmit} className="space-y-4">
                         {/* Book Dropdown for Edit - Prefill with currentTransaction.bookId */}
                        <div>
                            <label htmlFor="edit-book-select" className="block text-sm font-medium text-gray-700 mb-2">
                                Select Book
                            </label>
                            <select
                                id="edit-book-select"
                                name="bookId"
                                value={formBookId}
                                onChange={(e) => setFormBookId(e.target.value)}
                                required
                                disabled={isSubmitting || areDropdownsLoading}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            >
                                <option value="">--Choose a Book--</option>
                                {books.map((book) => (
                                    <option
                                        key={book._id}
                                        value={book._id}
                                        // A book might be unavailable because it's currently borrowed by someone else
                                        // or this very transaction. This logic needs careful consideration.
                                        // For editing, if the book is the one currently borrowed in THIS transaction,
                                        // it should be selectable. Otherwise, if unavailable by another transaction, it's disabled.
                                        disabled={!book.isAvailable && book._id !== currentTransaction?.bookId}
                                        style={{ color: (!book.isAvailable && book._id !== currentTransaction?.bookId) ? '#aaa' : 'inherit' }}
                                    >
                                        {book.title} {(!book.isAvailable && book._id !== currentTransaction?.bookId) ? '(Not Available)' : ''}
                                    </option>
                                ))}
                            </select>
                        </div>

                        {/* Reader Dropdown for Edit - Prefill with currentTransaction.readerId */}
                        <div>
                            <label htmlFor="edit-reader-select" className="block text-sm font-medium text-gray-700 mb-2">
                                Select Reader
                            </label>
                            <select
                                id="edit-reader-select"
                                name="readerId"
                                value={formReaderId}
                                onChange={(e) => setFormReaderId(e.target.value)}
                                required
                                disabled={isSubmitting || areDropdownsLoading}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            >
                                <option value="">--Choose a Reader--</option>
                                {readers.map((reader) => (
                                    <option key={reader._id} value={reader._id}>
                                        {reader.name}
                                    </option>
                                ))}
                            </select>
                        </div>
                        
                        <Input 
                            label="Lend Date" 
                            name="lendDate" 
                            type="date" 
                            value={formLendDate}
                            onChange={(e) => setFormLendDate(e.target.value)}
                            required 
                            disabled={isSubmitting}
                        />
                        <Input 
                            label="Due Date" 
                            name="dueDate" 
                            type="date" 
                            value={formDueDate}
                            onChange={(e) => setFormDueDate(e.target.value)}
                            required 
                            disabled={isSubmitting}
                        />
                        <Input 
                            label="Return Date" 
                            name="returnDate" 
                            type="date" 
                            value={formReturnDate || ''} // Handle null for returnDate
                            onChange={(e) => setFormReturnDate(e.target.value || null)} // Handle empty string to null
                            disabled={isSubmitting}
                        />
                        <div className="flex justify-end space-x-2 mt-6">
                            <Button 
                                type="button" 
                                variant="secondary" 
                                onClick={cancelModal}
                                disabled={isSubmitting}
                            >
                                Cancel
                            </Button>
                            <Button 
                                type="submit" 
                                disabled={isSubmitting}
                            >
                                {isSubmitting ? 'Updating...' : 'Save Changes'}
                            </Button>
                        </div>
                    </form>
                </Modal>

                {/* Delete Confirmation Modal */}
                <Modal 
                    isOpen={isDeleteModalOpen} 
                    onClose={cancelModal} 
                    title="Delete Lending Record"
                >
                    <div className="space-y-4">
                        <p className="text-gray-700">
                            Are you sure you want to delete the lending record for 
                            <strong> Book: {books.find(b => b._id === currentTransaction?.bookId)?.title || currentTransaction?.bookId}</strong> and 
                            <strong> Reader: {readers.find(r => r._id === currentTransaction?.readerId)?.name || currentTransaction?.readerId}</strong>? 
                            This action cannot be undone.
                        </p>
                        <div className="flex justify-end space-x-2 mt-6">
                            <Button 
                                type="button" 
                                variant="secondary" 
                                onClick={cancelModal}
                                disabled={isSubmitting}
                            >
                                Cancel
                            </Button>
                            <Button 
                                variant="danger" 
                                onClick={confirmDelete}
                                disabled={isSubmitting}
                            >
                                {isSubmitting ? 'Deleting...' : 'Delete Record'}
                            </Button>
                        </div>
                    </div>
                </Modal>
            </div>
        </div>
    );
};

export default OrdersPage;