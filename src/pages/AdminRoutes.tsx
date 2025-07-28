import { useAuth } from "../context/useAuth";
import React, {  useEffect } from 'react';
import { Outlet, useNavigate, useLocation} from 'react-router-dom';


const AdminRoutes: React.FC = () => {
    const { isAuthenticated, isAdmin } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();

    useEffect(() => {
        // If not authenticated, redirect to login
        if (!isAuthenticated) {
            navigate('/login', { replace: true });
        }
        // If authenticated but not admin (or if we had more granular roles), redirect to a non-admin page or show access denied
        // For this demo, isAuthenticated implies isAdmin
    }, [isAuthenticated, isAdmin, navigate, location.pathname]);

    if (!isAuthenticated) {
        return null; // Or a loading spinner, or a "redirecting..." message
    }

    return <Outlet />;
};

export default AdminRoutes;