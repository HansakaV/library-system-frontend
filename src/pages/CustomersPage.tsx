import type { Reader } from "../types";
import { Button } from "../components/Button.tsx";
import React, { useState, useEffect } from "react";
import { Input } from "../components/Input.tsx"; 
import Table from "../components/Table.tsx";
import { Modal } from "../components/Modal.tsx";
import axios from "axios";
import toast from "react-hot-toast";
import { addReader, deleteReader, getAllReaders, updateReader } from "../services/readerService.ts";

const CustomersPage: React.FC = () => {
    const [readers, setReaders] = useState<Reader[]>([]);
    const [isReadersLoading, setIsReadersLoading] = useState<boolean>(false);
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [selectedReader, setSelectedReader] = useState<Reader | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Fetch all readers from backend
    const fetchAllReaders = async () => {
        try {
            setIsReadersLoading(true);
            const result = await getAllReaders();
            setReaders(result);
        } catch (error) {
            if (axios.isAxiosError(error)) {
                toast.error(error.response?.data?.message || error.message);
            } else {
                toast.error("Failed to fetch readers");
            }
        } finally {
            setIsReadersLoading(false);
        }
    };

    useEffect(() => {
        fetchAllReaders();
    }, []);

    // Delete reader from backend
    const removeReader = async (id: string) => {
        try {
            await deleteReader(id);
            toast.success("Reader deleted successfully");
        } catch (error) {
            if (axios.isAxiosError(error)) {
                toast.error(error.response?.data?.message || error.message);
            } else {
                toast.error("Failed to delete reader");
            }
            throw error; // Re-throw to handle in calling function
        }
    };

    const columns = [
        { key: 'name' as keyof Reader, header: 'Name' },
        { key: 'email' as keyof Reader, header: 'Email' },
        { key: 'phone' as keyof Reader, header: 'Phone' },
        { key: 'address' as keyof Reader, header: 'Address' },
        {
            key: 'actions' as const,
            header: 'Actions',
            render: (reader: Reader) => (
                <div className="space-x-2">
                    <Button 
                        variant="secondary" 
                        onClick={() => handleEditReader(reader)}
                        disabled={isSubmitting}
                    >
                        Edit
                    </Button>
                    <Button 
                        variant="danger" 
                        onClick={() => handleDeleteReader(reader)}
                        disabled={isSubmitting}
                    >
                        Delete
                    </Button>
                </div>
            ),
        },
    ];

    const handleAddReader = () => {
        setSelectedReader(null);
        setIsAddModalOpen(true);
    };

    const handleEditReader = (reader: Reader) => {
        setSelectedReader(reader);
        setIsEditModalOpen(true);
    };

    const handleDeleteReader = (reader: Reader) => {
        setSelectedReader(reader);
        setIsDeleteModalOpen(true);
    };

    const handleFormSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setIsSubmitting(true);

        try {
            const formData = new FormData(e.currentTarget);
            const readerData: Omit<Reader, 'id'> = {
                name: formData.get('name') as string,
                email: formData.get('email') as string,
                phone: formData.get('phone') as string,
                address: formData.get('address') as string || '',
            };

            if (selectedReader) {
                // Update existing reader
                const updatedReader = await updateReader(selectedReader.id, readerData);
                setReaders((prev) =>
                    prev.map((reader) => (reader.id === selectedReader.id ? updatedReader : reader))
                );
                setIsEditModalOpen(false);
                toast.success("Reader updated successfully");
            } else {
                // Add new reader
                const newReader = await addReader(readerData);
                setReaders((prev) => [...prev, newReader]);
                setIsAddModalOpen(false);
                toast.success("Reader added successfully");
            }
            setSelectedReader(null);
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
        if (selectedReader) {
            try {
                setIsSubmitting(true);
                await removeReader(selectedReader.id);
                // Refresh the list after successful deletion
                await fetchAllReaders();
            } catch (error) {
                // Error already handled in removeReader function
            } finally {
                setIsDeleteModalOpen(false);
                setSelectedReader(null);
                setIsSubmitting(false);
            }
        }
    };

    const cancelModal = () => {
        setIsAddModalOpen(false);
        setIsEditModalOpen(false);
        setIsDeleteModalOpen(false);
        setSelectedReader(null);
    };

    if (isReadersLoading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                    <p className="text-gray-600">Loading readers...</p>
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
                        <h1 className="text-3xl font-bold text-gray-800">Reader Management</h1>
                        <p className="text-gray-600 mt-1">Manage your library readers</p>
                    </div>
                    <Button 
                        onClick={handleAddReader}
                        disabled={isSubmitting}
                        className="flex items-center space-x-2"
                    >
                        <span>Add New Reader</span>
                    </Button>
                </div>

                {/* Stats Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                    <div className="bg-white p-6 rounded-lg shadow">
                        <h3 className="text-lg font-semibold text-gray-700">Total Readers</h3>
                        <p className="text-3xl font-bold text-blue-600">{readers.length}</p>
                    </div>
                    <div className="bg-white p-6 rounded-lg shadow">
                        <h3 className="text-lg font-semibold text-gray-700">Active This Month</h3>
                        <p className="text-3xl font-bold text-green-600">{Math.floor(readers.length * 0.7)}</p>
                    </div>
                    <div className="bg-white p-6 rounded-lg shadow">
                        <h3 className="text-lg font-semibold text-gray-700">New This Week</h3>
                        <p className="text-3xl font-bold text-purple-600">{Math.floor(readers.length * 0.1)}</p>
                    </div>
                </div>

                {/* Readers Table */}
                <div className="bg-white rounded-lg shadow">
                    <div className="p-6">
                        <h2 className="text-xl font-semibold text-gray-800 mb-4">All Readers</h2>
                        <Table data={readers} columns={columns} />
                    </div>
                </div>

                {/* Add Reader Modal */}
                <Modal 
                    isOpen={isAddModalOpen} 
                    onClose={cancelModal} 
                    title="Add New Reader"
                >
                    <form onSubmit={handleFormSubmit} className="space-y-4">
                        <Input 
                            label="Name" 
                            name="name" 
                            required 
                            disabled={isSubmitting}
                        />
                        <Input 
                            label="Email" 
                            name="email" 
                            type="email" 
                            required 
                            disabled={isSubmitting}
                        />
                        <Input 
                            label="Phone" 
                            name="phone" 
                            disabled={isSubmitting}
                        />
                        <Input 
                            label="Address" 
                            name="address" 
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
                                {isSubmitting ? 'Adding...' : 'Add Reader'}
                            </Button>
                        </div>
                    </form>
                </Modal>

                {/* Edit Reader Modal */}
                <Modal 
                    isOpen={isEditModalOpen} 
                    onClose={cancelModal} 
                    title="Edit Reader"
                >
                    <form onSubmit={handleFormSubmit} className="space-y-4">
                        <Input 
                            label="Name" 
                            name="name" 
                            defaultValue={selectedReader?.name || ''} 
                            required 
                            disabled={isSubmitting}
                        />
                        <Input 
                            label="Email" 
                            name="email" 
                            type="email" 
                            defaultValue={selectedReader?.email || ''} 
                            required 
                            disabled={isSubmitting}
                        />
                        <Input 
                            label="Phone" 
                            name="phone" 
                            defaultValue={selectedReader?.phone || ''} 
                            disabled={isSubmitting}
                        />
                        <Input 
                            label="Address" 
                            name="address" 
                            defaultValue={selectedReader?.address || ''} 
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
                    title="Delete Reader"
                >
                    <div className="space-y-4">
                        <p className="text-gray-700">
                            Are you sure you want to delete <strong>{selectedReader?.name}</strong>? 
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
                                {isSubmitting ? 'Deleting...' : 'Delete Reader'}
                            </Button>
                        </div>
                    </div>
                </Modal>
            </div>
        </div>
    );
};

export default CustomersPage;