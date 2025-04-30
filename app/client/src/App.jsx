import React, { useState, useEffect } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import DashboardPage from './pages/DashboardPage';
import AttendancePage from './pages/AttendancePage';
import SuperAdminLogin from './pages/SuperAdminLogin';
import SuperAdminDashboard from './pages/SuperAdminDashboard';
import PrivateRoute from './components/PrivateRoute';

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isSuperAdmin, setIsSuperAdmin] = useState(false);
  
  useEffect(() => {
    // Check for stored tokens on app load
    const token = localStorage.getItem('token');
    const superAdminToken = localStorage.getItem('superadminToken');
    
    if (token) {
      setIsAuthenticated(true);
    }
    
    if (superAdminToken) {
      setIsSuperAdmin(true);
      console.log('Super admin token found - keeping user logged in');
    }
  }, []);
  
  const handleLogin = () => {
    setIsAuthenticated(true);
  };
  
  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('center');
    setIsAuthenticated(false);
  };
  
  // Simple wrapper component for Super Admin route protection
  const SuperAdminRoute = ({ children }) => {
    // Check token again to ensure it's current even after refreshes
    const token = localStorage.getItem('superadminToken');
    
    useEffect(() => {
      if (token && !isSuperAdmin) {
        setIsSuperAdmin(true);
      }
    }, [token]);
    
    if (!token) {
      return <Navigate to="/superadmin/login" />;
    }
    
    return children;
  };
  
  return (
    <Routes>
      {/* Public routes */}
      <Route 
        path="/" 
        element={isAuthenticated ? <Navigate to="/dashboard" /> : <LoginPage onLogin={handleLogin} />} 
      />
      <Route path="/register" element={<RegisterPage />} />
      <Route path="/attendance/:centerId" element={<AttendancePage />} />
      
      {/* Super Admin routes */}
      <Route path="/superadmin/login" element={<SuperAdminLogin />} />
      <Route 
        path="/superadmin/dashboard" 
        element={
          <SuperAdminRoute>
            <SuperAdminDashboard />
          </SuperAdminRoute>
        } 
      />
      
      {/* Protected routes */}
      <Route 
        path="/dashboard/*" 
        element={
          <PrivateRoute isAuthenticated={isAuthenticated}>
            <DashboardPage onLogout={handleLogout} />
          </PrivateRoute>
        } 
      />
      
      {/* Fallback route */}
      <Route path="*" element={<Navigate to="/" />} />
    </Routes>
  );
}

export default App; 