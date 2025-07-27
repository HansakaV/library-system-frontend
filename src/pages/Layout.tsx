import {useEffect} from "react";
import {useAuth} from "../context/useAuth.ts";
import React from 'react'
import {Outlet, useLocation, useNavigate} from "react-router-dom";
import Sidebar from "../components/Sidebar.tsx";

const Layout: React.FC = () => {
    const { isAuthenticated } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();

    // If authenticated and trying to access login/signup, redirect to dashboard
    useEffect(() => {
        if (isAuthenticated && (location.pathname === '/' || location.pathname === '/login' || location.pathname === '/signup')) {
            navigate('/dashboard');
        }
    }, [isAuthenticated, location.pathname, navigate]);

    return (
        <div className="min-h-screen bg-base-200 font-poppins">
            {isAuthenticated ? (
                <div className="flex">
                    <Sidebar />
                    <div className="flex-1 p-8">
                        <Outlet />
                    </div>
                </div>
            ) : (
                <div className="flex flex-col min-h-screen">
                    <header className="bg-primary text-white p-4 shadow-lg">
                        <div className="container mx-auto flex justify-between items-center">
                            <h1 className="text-3xl font-bold tracking-wider">Book Club</h1>
                            <nav>
                                <ul className="flex space-x-6">
                                    <li><button onClick={() => navigate('/login')} className="hover:text-accent transition-colors duration-300 text-lg font-medium">Login</button></li>
                                    <li><button onClick={() => navigate('/signup')} className="bg-accent text-primary px-6 py-2 rounded-full hover:bg-secondary hover:text-primary transition-all duration-300 text-lg font-semibold">Sign Up</button></li>
                                </ul>
                            </nav>
                        </div>
                    </header>
                    <main className="flex-grow container mx-auto p-8 flex justify-center items-center">
                        <Outlet />
                    </main>
                    <footer className="bg-gray-800 text-white p-4 text-center">
                        <p>&copy; 2024 Book Club. All rights reserved.</p>
                    </footer>
                </div>
            )}
        </div>
    );
};
export default Layout;