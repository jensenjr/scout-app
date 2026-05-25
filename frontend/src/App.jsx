import { Routes, Route, Navigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import Home from './pages/Home';
import GroupDashboard from './pages/GroupDashboard';
import Admin from './pages/Admin';
import Login from './pages/Login';

export default function App() {
  const [authState, setAuthState] = useState('checking'); // 'checking' | 'ok' | 'login'

  useEffect(() => {
    fetch('/api/auth/check')
      .then(r => r.json())
      .then(d => setAuthState(d.authenticated ? 'ok' : 'login'))
      .catch(() => setAuthState('login'));
  }, []);

  if (authState === 'checking') {
    return (
      <div className="min-h-screen bg-scout-50 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-scout-300 border-t-scout-700 rounded-full animate-spin" />
      </div>
    );
  }

  if (authState === 'login') {
    return <Login onLogin={() => setAuthState('ok')} />;
  }

  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/group/:groupName" element={<GroupDashboard />} />
      <Route path="/admin" element={<Admin />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
