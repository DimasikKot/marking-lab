import { BrowserRouter as Router, Route, Routes } from "react-router-dom";
import { Toaster } from "react-hot-toast";
import { PrivateRoute } from "@/shared/components/PrivateRoute.tsx"; // Лучше всегда писать абсолютный путь

import { General } from '@/pages/main/General';
import { Markup, Second, Third } from "@/pages/test/index.ts";
import { Login, Register } from '@/pages/auth/index.ts';

export function App() {
  return (
    <Router>
      <div className="h-dvh w-auto bg-white">
        <Routes>
            <Route path="/" element={<General />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/markup" element={<Markup />} />
            <Route path="/second" element={<Second />} />
            <Route path="/third" element={<Third />} />

            {/* Защищенные маршруты, пересылает на страницу `/login` */}
            <Route element={<PrivateRoute />}>
                <Route path="/third_protect" element={<Third />} />
            </Route>
        </Routes>
      </div>
      <Toaster 
        position="top-center"
        toastOptions={{
          duration: 4000,
          style: {
            background: '#333',
            color: '#fff',
            borderRadius: '10px',
            padding: '12px 16px',
          },
        }}
      />
    </Router>
  );
}
