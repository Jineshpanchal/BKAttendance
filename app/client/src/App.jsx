import React, { useState, useEffect } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { GoogleOAuthProvider } from '@react-oauth/google';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import SetupPage from './pages/SetupPage';
import DashboardPage from './pages/DashboardPage';
import AttendancePage from './pages/AttendancePage';
import SuperAdminLogin from './pages/SuperAdminLogin';
import SuperAdminDashboard from './pages/SuperAdminDashboard';
import PrivateRoute from './components/PrivateRoute';

// Google OAuth Client ID - Replace with your actual client ID
const GOOGLE_CLIENT_ID = "311255072123-kdm5ka0kvqbkh37qp86iiov8muda7s1h.apps.googleusercontent.com";

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isSuperAdmin, setIsSuperAdmin] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  
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
    
    // Set loading to false after checking authentication
    setIsLoading(false);
  }, []);
  
  const handleLogin = () => {
    setIsAuthenticated(true);
  };
  
  const handleLogout = () => {
    // Clear all authentication and center data
    localStorage.removeItem('token');
    localStorage.removeItem('center');
    localStorage.removeItem('superadminToken');
    
    // Clear any other potential stored data
    localStorage.clear();
    
    setIsAuthenticated(false);
    setIsSuperAdmin(false);
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
  
  // Show loading spinner while checking authentication
  if (isLoading) {
    return (
      <div className="d-flex justify-content-center align-items-center" style={{ height: '100vh' }}>
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
      </div>
    );
  }
  
  return (
    <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
      <Routes>
        {/* Public routes */}
        <Route 
          path="/" 
          element={isAuthenticated ? <Navigate to="/dashboard" /> : <LoginPage onLogin={handleLogin} />} 
        />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/setup" element={<SetupPage onLogin={handleLogin} />} />
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
    </GoogleOAuthProvider>
  );
}

export default App; 