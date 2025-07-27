import {Button} from "../components/Button.tsx";
import React, { useEffect, useState }  from "react";
import type { Reader,Book, LendingTransaction } from "../types/index.ts";
import { getAllReaders } from "../services/readerService.ts";
import { getAllBooks } from "../services/bookService.ts";
import { getAllLendingTransactions } from "../services/lendingService.ts";
import axios from "axios";
import { toast } from "react-toastify";
import { useNavigate } from "react-router-dom";

const Dashboard: React.FC = () => {
    const [readers, setReaders] = useState<Reader[]>([]);
    const [books, setBooks] = useState<Book[]>([]);
    const [lendings, setLendings] = useState<LendingTransaction[]>([]);

    const navigate = useNavigate();

    const fetchAllReaders = async () => {
        try {
             const result = await getAllReaders();
             setReaders(result);
        } catch (error) {
            if (axios.isAxiosError(error)) {
                toast.error(error.response?.data?.message || error.message);
            } else {
                toast.error("Failed to fetch readers");
            }
          }
    };

    const fetchAllBooks = async () => {
        try {
             const result = await getAllBooks();
             setBooks(result)
            
        } catch (error) {
            if (axios.isAxiosError(error)) {
                toast.error(error.response?.data?.message || error.message);
            } else {
                toast.error("Failed to fetch books");
            }
        }

    };



    const fetchAllLendings = async () =>{

      try{
        const result = await getAllLendingTransactions();
        setLendings(result);

      }catch(error){
            if (axios.isAxiosError(error)){
              toast.error(error.response?.data?.message || error.message)
             } else{
              toast.error("failed to get lendings")
             }

      }

     }

      useEffect(() => {

        fetchAllReaders();
        fetchAllBooks();
        fetchAllLendings();
    }, []);

  const today = new Date();
  const overdueBooksCount = lendings.filter(
    (lending) =>
      !lending.returnDate && new Date(lending.dueDate) < today
  ).length;
  
  
  const stats = [
    { label: 'Total Books', value: books.length, icon: '📚' },
    { label: 'Registered Readers', value: readers.length, icon: '🧑‍🤝‍🧑' },
    { label: 'Books Currently Lent', value: lendings.length, icon: '📖' },
    { label: 'Overdue Books', value: overdueBooksCount, icon: '⚠️' },
  ];

  return (
      <div className="p-6 bg-white rounded-lg shadow-md">
        <h2 className="text-3xl font-bold text-gray-900 mb-6">Dashboard Overview</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {stats.map((stat, index) => (
              <div key={index} className="bg-indigo-50 border border-indigo-200 p-6 rounded-lg shadow-sm flex items-center space-x-4">
                <div className="text-4xl">{stat.icon}</div>
                <div>
                  <p className="text-sm font-medium text-gray-600">{stat.label}</p>
                  <p className="text-3xl font-bold text-indigo-700">{stat.value}</p>
                </div>
              </div>
          ))}
        </div>

        <div className="mt-10">
          <h3 className="text-2xl font-semibold text-gray-800 mb-4">Quick Actions</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <Button 
             variant="primary"
             className="py-3 text-lg"
             onClick={() => navigate('/dashboard/items')}
             >Add New Book</Button>

            <Button 
             variant="secondary"
             className="py-3 text-lg"
              onClick={() => navigate('/dashboard/customers')}
             >Register New Reader</Button>

            <Button
             variant="primary" 
             className="py-3 text-lg"
             onClick={() => navigate('/dashboard/orders')}
             >Lend Book</Button>
          </div>
        </div>

      </div>
  );
};
export default Dashboard;