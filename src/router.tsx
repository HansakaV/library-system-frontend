import {createBrowserRouter} from "react-router-dom";
import Layout from "./pages/Layout.tsx";
import Login from "./pages/LoginPage.tsx";
import Signup from "./pages/SignUpPage.tsx";
import AdminRoutes from "./pages/AdminRoutes.tsx";
import Dashboard from "./pages/Dashboard.tsx";
import CustomersPage from "./pages/CustomersPage.tsx";
import ItemsPage from "./pages/ItemsPage.tsx";
import OrdersPage from "./pages/OrdersPage.tsx";
import NotificationsPage from "./pages/NotificationsPage.tsx";




const router = createBrowserRouter([
  {
    path: "/",
    element: <Layout />,
    children: [
      { path: "/", element: <Login /> },
      { path: "/login", element: <Login /> },
      { path: "/signup", element: <Signup /> },
      {
        element: <AdminRoutes />,
        children: [
          { path: "/dashboard", element: <Dashboard /> },
          { path: "/dashboard/customers", element: <CustomersPage /> },
          { path: "/dashboard/items", element: <ItemsPage /> },
          { path: "/dashboard/orders", element: <OrdersPage /> },
          { path: "/dashboard/notifications", element: <NotificationsPage /> },

        ],
      },
    ],
  },
]);

export default router;