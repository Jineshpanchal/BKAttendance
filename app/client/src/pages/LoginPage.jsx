import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { GoogleLogin } from '@react-oauth/google';
import axios from 'axios';
import './LoginPage.css';

const LoginPage = ({ onLogin }) => {
  const navigate = useNavigate();
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleGoogleSuccess = async (credentialResponse) => {
    try {
      setError('');
      setLoading(true);
      
      console.log('Google sign-in successful, verifying token...');
      
      const response = await axios.post('/api/google-auth/google-verify', {
        token: credentialResponse.credential
      });
      
      console.log('Google verification response:', response.data);
      
      if (response.data.isNewUser) {
        console.log('New user detected, redirecting to setup...');
        // New user, redirect to setup page with pre-filled data
        navigate('/setup', { 
          state: { 
            googleUserInfo: response.data.userInfo 
          } 
        });
      } else {
        console.log('Existing user detected, logging in...');
        // Existing user, log them in
        localStorage.setItem('token', response.data.token);
        localStorage.setItem('center', JSON.stringify(response.data.center));
        
        console.log('Token stored:', response.data.token ? 'Yes' : 'No');
        console.log('Center data stored:', response.data.center);
        
        onLogin();
        navigate('/dashboard');
      }
    } catch (err) {
      console.error('Google sign-in error:', err);
      setError(
        err.response?.data?.message || 
        'Google sign-in failed. Please try again.'
      );
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleError = () => {
    setError('Google sign-in was cancelled or failed.');
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
          <p style={{color: '#666', fontSize: '14px', marginTop: '15px', textAlign: 'center'}}>
            Sign in with your @bkivv.org or @gmail.com email to access your meditation center
          </p>
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
        
        {/* Google Sign-In Section */}
        <div style={{marginBottom: '20px'}}>
          <div style={{display: 'flex', justifyContent: 'center'}}>
            <GoogleLogin
              onSuccess={handleGoogleSuccess}
              onError={handleGoogleError}
              text="signin_with"
              shape="rectangular"
              theme="outline"
              size="large"
              width="100%"
            />
          </div>
          {loading && (
            <div style={{textAlign: 'center', marginTop: '15px', color: '#666', fontSize: '14px'}}>
              Signing you in...
            </div>
          )}
        </div>

        <div style={{textAlign: 'center', marginTop: '30px', color: '#757575', fontSize: '14px'}}>
          <p>
            First time here? Sign in with Google to set up your meditation center
          </p>
          <p style={{marginTop: '10px'}}>
            Or use <Link to="/register" style={{color: '#4a90e2', textDecoration: 'none', fontWeight: 600}}>legacy registration</Link> with email/password
          </p>
        </div>
      </div>
    </div>
  );
};

export default LoginPage; 