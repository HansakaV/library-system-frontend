import React, { useState, useEffect } from 'react';
import { Button } from "../components/Button.tsx";
import { Modal } from '../components/Modal.tsx';
import { Input } from '../components/Input.tsx';
import Table from "../components/Table.tsx";
import type { Book } from "../types/index.ts";
import axios from "axios";
import toast from "react-hot-toast";
import { addBook, deleteBook, getAllBooks, updateBook } from "../services/bookService.ts";

const ItemsPage: React.FC = () => {
    const [books, setBooks] = useState<Book[]>([]);
    const [isBooksLoading, setIsBooksLoading] = useState<boolean>(false);
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [selectedBook, setSelectedBook] = useState<Book | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState<'all' | 'available' | 'unavailable'>('all');

    // Fetch all books from backend
    const fetchAllBooks = async () => {
        try {
            setIsBooksLoading(true);
            const result = await getAllBooks();
            setBooks(result);
        } catch (error) {
            if (axios.isAxiosError(error)) {
                toast.error(error.response?.data?.message || error.message);
            } else {
                toast.error("Failed to fetch books");
            }
        } finally {
            setIsBooksLoading(false);
        }
    };

    useEffect(() => {
        fetchAllBooks();
    }, []);

    // Delete book from backend
    const removeBook = async (id: string) => {
        try {
            await deleteBook(id);
            toast.success("Book deleted successfully");
        } catch (error) {
            if (axios.isAxiosError(error)) {
                toast.error(error.response?.data?.message || error.message);
            } else {
                toast.error("Failed to delete book");
            }
            throw error;
        }
    };

    // Filter books based on search term and status
    const filteredBooks = books.filter(book => {
        const matchesSearch = book.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                            book.author.toLowerCase().includes(searchTerm.toLowerCase()) ||
                            book.isbn.toLowerCase().includes(searchTerm.toLowerCase());
        
        const matchesStatus = statusFilter === 'all' || 
                            (statusFilter === 'available' && book.status) ||
                            (statusFilter === 'unavailable' && !book.status);
        
        return matchesSearch && matchesStatus;
    });

    const columns = [
        { key: 'title' as keyof Book, header: 'Title' },
        { key: 'author' as keyof Book, header: 'Author' },
        { key: 'isbn' as keyof Book, header: 'ISBN' },
        {
            key: 'available' as keyof Book,
            header: 'Status',
            render: (book: Book) => (
                <span className={`px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                    book.status
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-red-100 text-red-800'
                }`}>
                    {book.status ? 'Available' : 'Checked Out'}
                </span>
            ),
        },
        {
            key: 'actions' as const,
            header: 'Actions',
            render: (book: Book) => (
                <div className="space-x-2">
                    <Button 
                        variant="secondary" 
                        onClick={() => handleEditBook(book)}
                        disabled={isSubmitting}
                        size="sm"
                    >
                        Edit
                    </Button>
                    <Button 
                        variant="danger" 
                        onClick={() => handleDeleteBook(book)}
                        disabled={isSubmitting}
                        size="sm"
                    >
                        Delete
                    </Button>
                    <Button
                        variant={book.status ? "warning" : "primary"}
                        onClick={() => handleToggleAvailability(book)}
                        disabled={isSubmitting}
                        size="sm"
                    >
                        {book.status ? 'Check Out' : 'Return'}
                    </Button>
                </div>
            ),
        },
    ];

    const handleAddBook = () => {
        setSelectedBook(null);
        setIsAddModalOpen(true);
    };

    const handleEditBook = (book: Book) => {
        setSelectedBook(book);
        setIsEditModalOpen(true);
    };

    const handleDeleteBook = (book: Book) => {
        setSelectedBook(book);
        setIsDeleteModalOpen(true);
    };

    const handleToggleAvailability = async (book: Book) => {
        try {
            setIsSubmitting(true);
            const updatedBookData = { ...book, available: !book.status };
            const updatedBook = await updateBook(book.id, updatedBookData);
            setBooks((prev) =>
                prev.map((b) => (b.id === book.id ? updatedBook : b))
            );
            toast.success(book.status
                 ? "Book checked out successfully" : "Book returned successfully");
        } catch (error) {
            if (axios.isAxiosError(error)) {
                toast.error(error.response?.data?.message || error.message);
            } else {
                toast.error("Failed to update book status");
            }
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleFormSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setIsSubmitting(true);

        try {
            const formData = new FormData(e.currentTarget);
            const bookData: Omit<Book, 'id' > = {
                title: formData.get('title') as string,
                author: formData.get('author') as string,
                isbn: formData.get('isbn') as string,
                status: formData.get('available') === 'on',
            };

            if (selectedBook) {
                // Update existing book
                const updatedBook = await updateBook(selectedBook.id, bookData);
                setBooks((prev) =>
                    prev.map((book) => (book.id === selectedBook.id ? updatedBook : book))
                );
                setIsEditModalOpen(false);
                toast.success("Book updated successfully");
            } else {
                // Add new book
                const newBook = await addBook(bookData);
                setBooks((prev) => [...prev, newBook]);
                setIsAddModalOpen(false);
                toast.success("Book added successfully");
            }
            setSelectedBook(null);
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
        if (selectedBook) {
            try {
                setIsSubmitting(true);
                await removeBook(selectedBook.id);
                await fetchAllBooks();
            } catch (error) {
                // Error already handled in removeBook function
            } finally {
                setIsDeleteModalOpen(false);
                setSelectedBook(null);
                setIsSubmitting(false);
            }
        }
    };

    const cancelModal = () => {
        setIsAddModalOpen(false);
        setIsEditModalOpen(false);
        setIsDeleteModalOpen(false);
        setSelectedBook(null);
    };

    const availableBooks = books.filter(book => book.status).length;
    const checkedOutBooks = books.filter(book => !book.status).length;

    if (isBooksLoading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                    <p className="text-gray-600">Loading books...</p>
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
                        <h1 className="text-3xl font-bold text-gray-800">Book Management</h1>
                        <p className="text-gray-600 mt-1">Manage your library collection</p>
                    </div>
                    <Button 
                        onClick={handleAddBook}
                        disabled={isSubmitting}
                        className="flex items-center space-x-2"
                    >
                        <span>Add New Book</span>
                    </Button>
                </div>

                {/* Stats Cards */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
                    <div className="bg-white p-6 rounded-lg shadow">
                        <h3 className="text-lg font-semibold text-gray-700">Total Books</h3>
                        <p className="text-3xl font-bold text-blue-600">{books.length}</p>
                    </div>
                    <div className="bg-white p-6 rounded-lg shadow">
                        <h3 className="text-lg font-semibold text-gray-700">Available</h3>
                        <p className="text-3xl font-bold text-green-600">{availableBooks}</p>
                    </div>
                    <div className="bg-white p-6 rounded-lg shadow">
                        <h3 className="text-lg font-semibold text-gray-700">Checked Out</h3>
                        <p className="text-3xl font-bold text-red-600">{checkedOutBooks}</p>
                    </div>
                    <div className="bg-white p-6 rounded-lg shadow">
                        <h3 className="text-lg font-semibold text-gray-700">Availability Rate</h3>
                        <p className="text-3xl font-bold text-purple-600">
                            {books.length > 0 ? Math.round((availableBooks / books.length) * 100) : 0}%
                        </p>
                    </div>
                </div>

                {/* Search and Filter */}
                <div className="bg-white p-6 rounded-lg shadow mb-6">
                    <div className="flex flex-col md:flex-row gap-4">
                        <div className="flex-1">
                            <Input
                                label="Search Books"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                placeholder="Search by title, author, or ISBN..."
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
                                <option value="all">All Books</option>
                                <option value="available">Available Only</option>
                                <option value="unavailable">Checked Out Only</option>
                            </select>
                        </div>
                    </div>
                </div>

                {/* Books Table */}
                <div className="bg-white rounded-lg shadow">
                    <div className="p-6">
                        <div className="flex justify-between items-center mb-4">
                            <h2 className="text-xl font-semibold text-gray-800">All Books</h2>
                            <p className="text-sm text-gray-600">
                                Showing {filteredBooks.length} of {books.length} books
                            </p>
                        </div>
                        <Table data={filteredBooks} columns={columns} />

                    </div>
                </div>

                {/* Add Book Modal */}
                <Modal 
                    isOpen={isAddModalOpen} 
                    onClose={cancelModal} 
                    title="Add New Book"
                >
                    <form onSubmit={handleFormSubmit} className="space-y-4">
                        <Input 
                            label="Title" 
                            name="title" 
                            required 
                            disabled={isSubmitting}
                        />
                        <Input 
                            label="Author" 
                            name="author" 
                            required 
                            disabled={isSubmitting}
                        />
                        <Input 
                            label="ISBN" 
                            name="isbn" 
                            disabled={isSubmitting}
                        />
                        <div className="flex items-center">
                            <input
                                id="available"
                                name="available"
                                type="checkbox"
                                defaultChecked={true}
                                disabled={isSubmitting}
                                className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                            />




                            <label htmlFor="available" className="ml-2 block text-sm text-gray-900">
                                Available for checkout
                            </label>
                        </div>
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
                                {isSubmitting ? 'Adding...' : 'Add Book'}
                            </Button>
                        </div>
                    </form>
                </Modal>

                {/* Edit Book Modal */}
                <Modal 
                    isOpen={isEditModalOpen} 
                    onClose={cancelModal} 
                    title="Edit Book"
                >
                    <form onSubmit={handleFormSubmit} className="space-y-4">
                        <Input 
                            label="Title" 
                            name="title" 
                            defaultValue={selectedBook?.title || ''} 
                            required 
                            disabled={isSubmitting}
                        />
                        <Input 
                            label="Author" 
                            name="author" 





                            defaultValue={selectedBook?.author || ''} 
                            required 
                            disabled={isSubmitting}
                        />
                        <Input 
                            label="ISBN" 
                            name="isbn" 
                            defaultValue={selectedBook?.isbn || ''} 
                            disabled={isSubmitting}
                        />
                        <div className="flex items-center">
                            <input
                                id="available-edit"
                                name="available"
                                type="checkbox"
                                defaultChecked={selectedBook?.status || false}
                                disabled={isSubmitting}
                                className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                            />
                            <label htmlFor="available-edit" className="ml-2 block text-sm text-gray-900">
                                Available for checkout
                            </label>
                        </div>
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
                    title="Delete Book"
                >
                    <div className="space-y-4">
                        <p className="text-gray-700">
                            Are you sure you want to delete <strong>"{selectedBook?.title}"</strong> by {selectedBook?.author}? 
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
                                {isSubmitting ? 'Deleting...' : 'Delete Book'}
                            </Button>
                        </div>
                    </div>
                </Modal>
            </div>
        </div>
    );
};

export default ItemsPage;