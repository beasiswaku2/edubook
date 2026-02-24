import React, { useState, useEffect } from 'react';
import { 
  LayoutDashboard, 
  MessageSquare, 
  CreditCard, 
  Users, 
  History, 
  LogOut,
  GraduationCap,
  ShieldCheck,
  TrendingUp,
  Clock,
  Award
} from 'lucide-react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Sidebar from './components/Sidebar';
import ChatAI from './components/ChatAI';
import Login from './pages/Login';
import Register from './pages/Register';
import Verify from './pages/Verify';
import TopUp from './pages/TopUp';
import Referral from './pages/Referral';
import ReferralInfo from './pages/ReferralInfo';
import HistoryPage from './pages/History';
import AdminPanel from './pages/AdminPanel';
import Dashboard from './pages/Dashboard';
import Landing from './pages/Landing';

export default function App() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const savedUser = localStorage.getItem('user');
    if (savedUser) {
      try {
        const parsed = JSON.parse(savedUser);
        if (parsed && parsed.id) {
          setUser(parsed);
          fetchUserUpdate(parsed.id);
        } else {
          handleLogout();
        }
      } catch (e) {
        handleLogout();
      }
    }
    setLoading(false);
  }, []);

  const fetchUserUpdate = async (id: number) => {
    try {
      const res = await fetch(`/api/user/${id}`);
      if (res.status === 404) {
        handleLogout();
        return;
      }
      if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
      const contentType = res.headers.get("content-type");
      if (!contentType || !contentType.includes("application/json")) {
        throw new TypeError("Oops, we haven't got JSON!");
      }
      const data = await res.json();
      setUser(data);
      localStorage.setItem('user', JSON.stringify(data));
    } catch (error) {
      console.error("Failed to fetch user update:", error);
    }
  };

  const handleLogin = (userData: any) => {
    setUser(userData);
    localStorage.setItem('user', JSON.stringify(userData));
  };

  const handleLogout = () => {
    setUser(null);
    localStorage.removeItem('user');
  };

  if (loading) return <div className="h-screen flex items-center justify-center">Loading...</div>;

  if (!user) {
    return (
      <Router>
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route path="/login" element={<Login onLogin={handleLogin} />} />
          <Route path="/register" element={<Register />} />
          <Route path="/verify" element={<Verify />} />
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </Router>
    );
  }

  return (
    <Router>
      <div className="flex min-h-screen bg-gray-50">
        <Sidebar user={user} onLogout={handleLogout} />
        <main className="flex-1 p-8 overflow-y-auto">
          <Routes>
            <Route path="/" element={<Dashboard user={user} />} />
            <Route path="/chat" element={<ChatAI user={user} onUpdateUser={() => fetchUserUpdate(user.id)} />} />
            <Route path="/topup" element={<TopUp user={user} onUpdateUser={() => fetchUserUpdate(user.id)} />} />
            <Route path="/referral" element={<Referral user={user} onUpdateUser={() => fetchUserUpdate(user.id)} />} />
            <Route path="/referral-info" element={<ReferralInfo />} />
            <Route path="/history" element={<HistoryPage user={user} />} />
            {user.role === 'admin' && <Route path="/admin" element={<AdminPanel onLogout={handleLogout} />} />}
            <Route path="*" element={<Navigate to="/" />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
}
