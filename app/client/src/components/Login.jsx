import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import './Login.css';

const Login = () => {
  const [centerId, setCenterId] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    
    try {
      const response = await axios.post('/api/centers/login', { centerId, password });
      localStorage.setItem('token', response.data.token);
      localStorage.setItem('centerId', centerId);
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-container">
      <div className="login-background">
        <div className="meditation-symbol"></div>
      </div>
      <div className="login-card">
        <div className="login-header">
          <h1>Welcome</h1>
          <p className="subtitle">Meditation Center Attendance</p>
        </div>
        
        {error && <div className="error-message">{error}</div>}
        
        <form onSubmit={handleSubmit} className="login-form">
          <div className="form-group">
            <label htmlFor="centerId">Center ID</label>
            <div className="input-container">
              <i className="input-icon center-icon"></i>
              <input
                type="text"
                id="centerId"
                value={centerId}
                onChange={(e) => setCenterId(e.target.value)}
                required
                placeholder="Enter your center ID"
              />
            </div>
          </div>
          
          <div className="form-group">
            <label htmlFor="password">Password</label>
            <div className="input-container">
              <i className="input-icon password-icon"></i>
              <input
                type="password"
                id="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                placeholder="Enter your password"
              />
            </div>
          </div>
          
          <button 
            type="submit" 
            className="login-button" 
            disabled={loading}
          >
            {loading ? 'Logging in...' : 'Login'}
          </button>
        </form>
        
        <div className="login-footer">
          <p>Don't have an account? <Link to="/register" className="register-link">Register</Link></p>
        </div>
      </div>
    </div>
  );
};

export default Login; 