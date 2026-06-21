import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ToastProvider } from './context/ToastContext';
import { LoginPage, RegisterPage } from './pages/AuthPages';
import LandingPage from './pages/LandingPage';
import UserDashboard from './pages/user/UserDashboard';
import AdminDashboard from './pages/admin/AdminDashboard';

function LoadingScreen() {
  return (
    <div style={{ display:'flex', alignItems:'center', justifyContent:'center', height:'100vh', flexDirection:'column', gap:16, background:'var(--bg)' }}>
      <div style={{ width:40, height:40, borderRadius:10, background:'linear-gradient(135deg,#00e5ff,#6d28d9)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:20 }}>🧠</div>
      <div style={{ display:'flex', alignItems:'center', gap:10 }}>
        <div style={{ width:18, height:18, border:'2px solid #1a2d4a', borderTopColor:'#00e5ff', borderRadius:'50%', animation:'spin 0.65s linear infinite' }} />
        <span style={{ color:'var(--muted)', fontFamily:'var(--mono)', fontSize:13 }}>Loading ResumeAI Pro…</span>
      </div>
    </div>
  );
}

function ProtectedRoute({ children, role }) {
  const { user, loading } = useAuth();
  if (loading) return <LoadingScreen />;
  if (!user) return <Navigate to="/login" replace />;
  if (role && user.role !== role) {
    return <Navigate to={user.role === 'admin' ? '/admin' : '/dashboard'} replace />;
  }
  return children;
}

function Root() {
  const { user, loading } = useAuth();
  if (loading) return <LoadingScreen />;
  if (!user) return <Navigate to="/home" replace />;
  return <Navigate to={user.role === 'admin' ? '/admin' : '/dashboard'} replace />;
}

export default function App() {
  return (
    <AuthProvider>
      <ToastProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Root />} />
            <Route path="/home" element={<LandingPage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
            <Route path="/dashboard/*" element={<ProtectedRoute role="user"><UserDashboard /></ProtectedRoute>} />
            <Route path="/admin/*" element={<ProtectedRoute role="admin"><AdminDashboard /></ProtectedRoute>} />
            <Route path="*" element={<Navigate to="/home" replace />} />
          </Routes>
        </BrowserRouter>
      </ToastProvider>
    </AuthProvider>
  );
}
