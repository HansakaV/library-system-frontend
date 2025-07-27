import { useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../context/useAuth.ts";
import { Button } from "./Button.tsx";
import React from "react";
import { motion } from "framer-motion";
import { LogOut, BookOpen, Users, Home, Bell, ArrowRightLeft } from 'lucide-react';

const Sidebar: React.FC = () => {
    const navigate = useNavigate();
    const { logout } = useAuth();
    const location = useLocation();

    const navItems = [
        { name: 'Dashboard', path: '/dashboard', icon: <Home size={20} /> },
        { name: 'Readers', path: '/dashboard/customers', icon: <Users size={20} /> },
        { name: 'Books', path: '/dashboard/items', icon: <BookOpen size={20} /> },
        { name: 'Lendings', path: '/dashboard/orders', icon: <ArrowRightLeft size={20} /> },
        { name: 'Notifications', path: '/dashboard/notifications', icon: <Bell size={20} /> },
    ];

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    const sidebarVariants: any = {
        hidden: { x: -250 },
        visible: { x: 0, transition: { duration: 0.5, ease: "easeInOut" } },
    };

    const itemVariants = {
        hidden: { opacity: 0, y: 20 },
        visible: { opacity: 1, y: 0 },
    };

    return (
        <motion.div
            variants={sidebarVariants}
            initial="hidden"
            animate="visible"
            className="w-64 bg-primary text-white flex flex-col h-screen shadow-2xl"
        >
            <div className="p-6 text-2xl font-bold text-center border-b border-accent">
                <motion.h1 initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }}>
                    Book Club
                </motion.h1>
            </div>
            <nav className="flex-1 px-4 py-6 space-y-2">
                {navItems.map((item, index) => (
                    <motion.button
                        key={item.name}
                        variants={itemVariants}
                        initial="hidden"
                        animate="visible"
                        transition={{ delay: 0.2 + index * 0.1 }}
                        onClick={() => navigate(item.path)}
                        className={`flex items-center w-full px-4 py-3 rounded-lg text-left text-lg font-medium transition-all duration-300
              ${location.pathname === item.path ? 'bg-accent text-primary shadow-lg' : 'hover:bg-secondary hover:text-primary'}`}
                    >
                        <div className="mr-4">{item.icon}</div>
                        {item.name}
                    </motion.button>
                ))}
            </nav>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.8 }} className="p-4 border-t border-accent">
                <Button onClick={handleLogout} variant="secondary" className="w-full bg-transparent border-2 border-accent text-accent hover:bg-accent hover:text-primary flex items-center justify-center">
                    <LogOut size={20} className="mr-2" />
                    Logout
                </Button>
            </motion.div>
        </motion.div>
    );
};

export default Sidebar;