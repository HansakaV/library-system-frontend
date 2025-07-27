import {AuthProvider} from "./context/AuthProvider.tsx";
import {RouterProvider} from "react-router-dom";
import router from "./router.tsx";

function App() {
    return (
        <AuthProvider>
            <RouterProvider router={router} />
        </AuthProvider>
    );
}

export default App;