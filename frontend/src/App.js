import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import "@/App.css";
import { BrowserRouter, Routes, Route, Navigate, useNavigate, useLocation } from "react-router-dom";
import axios from "axios";
import LoginPage from "@/components/LoginPage";
import POSPage from "@/components/POSPage";
import OrdersPage from "@/components/OrdersPage";
import AdminPage from "@/components/AdminPage";
import Sidebar from "@/components/Sidebar";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

// Auth Context
const AuthContext = createContext(null);

export const useAuth = () => useContext(AuthContext);
export { API, BACKEND_URL };

function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem("token"));
  const [loading, setLoading] = useState(true);

  const api = useCallback(() => {
    const instance = axios.create({ baseURL: API });
    if (token) {
      instance.defaults.headers.common["Authorization"] = `Bearer ${token}`;
    }
    return instance;
  }, [token]);

  useEffect(() => {
    if (token) {
      api().get("/auth/me")
        .then(res => { setUser(res.data); setLoading(false); })
        .catch(() => { localStorage.removeItem("token"); setToken(null); setUser(null); setLoading(false); });
    } else {
      setLoading(false);
    }
  }, [token, api]);

  const login = async (email, password) => {
    const res = await axios.post(`${API}/auth/login`, { email, password });
    localStorage.setItem("token", res.data.token);
    setToken(res.data.token);
    setUser(res.data.user);
    return res.data;
  };

  const register = async (name, email, password) => {
    const res = await axios.post(`${API}/auth/register`, { name, email, password });
    localStorage.setItem("token", res.data.token);
    setToken(res.data.token);
    setUser(res.data.user);
    return res.data;
  };

  const logout = () => {
    localStorage.removeItem("token");
    setToken(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, token, loading, login, register, logout, api }}>
      {children}
    </AuthContext.Provider>
  );
}

function ProtectedRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading) return (
    <div className="flex items-center justify-center h-screen bg-[#FDFBF7]">
      <div className="animate-pulse text-[#8A7969]">Loading...</div>
    </div>
  );
  if (!user) return <Navigate to="/login" />;
  return children;
}

function AppLayout() {
  const { user } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  if (!user) return <Navigate to="/login" />;

  return (
    <div className="flex h-screen bg-[#FDFBF7]" data-testid="app-layout">
      <Sidebar currentPath={location.pathname} onNavigate={(path) => navigate(path)} />
      <main className="flex-1 overflow-hidden">
        <Routes>
          <Route path="/" element={<POSPage />} />
          <Route path="/orders" element={<OrdersPage />} />
          {user.role === "admin" && <Route path="/admin/*" element={<AdminPage />} />}
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </main>
    </div>
  );
}

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/*" element={<ProtectedRoute><AppLayout /></ProtectedRoute>} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
