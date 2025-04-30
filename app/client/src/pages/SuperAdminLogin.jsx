import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const SuperAdminLogin = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [debugInfo, setDebugInfo] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    setDebugInfo('Form submitted. Attempting to login...');

    try {
      console.log('Attempting to login with:', { username });
      
      // Debug: Check the API URL
      const apiUrl = '/api/superadmin/login';
      setDebugInfo(prev => prev + `\nAPI URL: ${apiUrl}`);
      console.log('Making request to:', apiUrl);

      const response = await axios.post(apiUrl, {
        username,
        password
      });

      setDebugInfo(prev => prev + '\nLogin successful!');
      console.log('Login response:', response.data);

      // Store token and user info in local storage
      localStorage.setItem('superadminToken', response.data.token);
      localStorage.setItem('superadminUser', JSON.stringify(response.data.user));
      
      // Navigate to super admin dashboard
      setDebugInfo(prev => prev + '\nRedirecting to dashboard...');
      navigate('/superadmin/dashboard');
    } catch (err) {
      console.error('Login error:', err);
      
      // Detailed error information
      const errorMessage = err.response?.data?.message || 'Login failed. Please try again.';
      const status = err.response?.status || 'No status';
      const errorDetails = JSON.stringify(err.response?.data || {});
      
      setDebugInfo(prev => prev + `\nError: ${errorMessage} (${status})\nDetails: ${errorDetails}`);
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container">
      <div className="row justify-content-center mt-5">
        <div className="col-md-6 col-lg-4">
          <div className="card shadow">
            <div className="card-body p-5">
              <h2 className="text-center mb-4">Super Admin</h2>
              
              {error && (
                <div className="alert alert-danger" role="alert">
                  {error}
                </div>
              )}
              
              <form onSubmit={handleSubmit}>
                <div className="mb-3">
                  <label htmlFor="username" className="form-label">Username</label>
                  <input
                    type="text"
                    className="form-control"
                    id="username"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    required
                  />
                </div>
                
                <div className="mb-3">
                  <label htmlFor="password" className="form-label">Password</label>
                  <input
                    type="password"
                    className="form-control"
                    id="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                </div>
                
                <div className="d-grid">
                  <button
                    type="submit"
                    className="btn btn-primary"
                    disabled={loading}
                  >
                    {loading ? 'Logging in...' : 'Login'}
                  </button>
                </div>
              </form>
              
              {/* Debug information section */}
              {debugInfo && (
                <div className="mt-4">
                  <h6 className="text-muted">Debug Info:</h6>
                  <pre className="bg-light p-2" style={{ whiteSpace: 'pre-wrap', fontSize: '0.8rem' }}>
                    {debugInfo}
                  </pre>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SuperAdminLogin; 