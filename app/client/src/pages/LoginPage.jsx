import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { authAPI } from '../services/api';
import './LoginPage.css';

const LoginPage = ({ onLogin }) => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    center_id: '',
    password: ''
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    
    try {
      const response = await authAPI.login(formData);
      
      // Store token and center info in localStorage
      localStorage.setItem('token', response.data.token);
      localStorage.setItem('center', JSON.stringify(response.data.center));
      
      // Notify parent component of successful login
      onLogin();
      
      // Redirect to dashboard
      navigate('/dashboard');
    } catch (err) {
      setError(
        err.response?.data?.message || 
        'Login failed. Please check your credentials and try again.'
      );
    } finally {
      setLoading(false);
    }
  };

  // Lighter colors and no animations
  const containerStyle = {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: '100vh',
    background: 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)',
    overflow: 'hidden',
    position: 'relative'
  };

  const cardStyle = {
    background: 'rgba(255, 255, 255, 0.95)',
    boxShadow: '0 4px 20px rgba(0, 0, 0, 0.08)',
    borderRadius: '16px',
    width: '90%',
    maxWidth: '420px',
    padding: '40px',
    zIndex: 10,
    position: 'relative'
  };
  
  return (
    <div style={containerStyle} className="login-container">
      <div style={cardStyle} className="login-card">
        <div className="login-header">
          <h1 style={{fontSize: '30px', color: '#3a3a3a', marginBottom: '10px', fontWeight: 600, textAlign: 'center'}}>Welcome</h1>
          <p style={{color: '#5a5a5a', fontSize: '16px', marginTop: 0, textAlign: 'center'}} className="subtitle">Meditation Center Attendance</p>
        </div>
        
        {error && <div style={{
          backgroundColor: 'rgba(244, 67, 54, 0.1)',
          color: '#d32f2f',
          padding: '12px',
          borderRadius: '8px',
          textAlign: 'center',
          marginBottom: '20px',
          fontSize: '14px'
        }}>{error}</div>}
        
        <form onSubmit={handleSubmit} style={{display: 'flex', flexDirection: 'column', gap: '20px'}}>
          <div style={{display: 'flex', flexDirection: 'column'}}>
            <label htmlFor="center_id" style={{fontSize: '14px', color: '#555', marginBottom: '8px', fontWeight: 500}}>Center ID</label>
            <div style={{position: 'relative', display: 'flex', alignItems: 'center'}}>
              <span style={{position: 'absolute', left: '12px', opacity: 0.5}}>🏠</span>
              <input
                type="text"
                id="center_id"
                name="center_id"
                value={formData.center_id}
                onChange={handleChange}
                required
                placeholder="Enter your center ID"
                style={{
                  width: '100%',
                  padding: '12px 12px 12px 40px',
                  border: '1px solid #ddd',
                  borderRadius: '10px',
                  fontSize: '16px',
                  backgroundColor: '#ffffff'
                }}
              />
            </div>
          </div>
          
          <div style={{display: 'flex', flexDirection: 'column'}}>
            <label htmlFor="password" style={{fontSize: '14px', color: '#555', marginBottom: '8px', fontWeight: 500}}>Password</label>
            <div style={{position: 'relative', display: 'flex', alignItems: 'center'}}>
              <span style={{position: 'absolute', left: '12px', opacity: 0.5}}>🔒</span>
              <input
                type="password"
                id="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                required
                placeholder="Enter your password"
                style={{
                  width: '100%',
                  padding: '12px 12px 12px 40px',
                  border: '1px solid #ddd',
                  borderRadius: '10px',
                  fontSize: '16px',
                  backgroundColor: '#ffffff'
                }}
              />
            </div>
          </div>
          
          <button 
            type="submit" 
            style={{
              marginTop: '10px',
              padding: '14px',
              border: 'none',
              borderRadius: '10px',
              background: '#4a90e2',
              color: 'white',
              fontSize: '16px',
              fontWeight: 600,
              cursor: 'pointer',
              boxShadow: '0 2px 10px rgba(74, 144, 226, 0.2)'
            }}
            disabled={loading}
          >
            {loading ? 'Logging in...' : 'Login'}
          </button>
        </form>
        
        <div style={{textAlign: 'center', marginTop: '30px', color: '#757575', fontSize: '14px'}}>
          <p>Don't have an account? <Link to="/register" style={{color: '#4a90e2', textDecoration: 'none', fontWeight: 600}}>Register</Link></p>
        </div>
      </div>
    </div>
  );
};

export default LoginPage; 