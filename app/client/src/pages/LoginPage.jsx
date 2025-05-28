import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
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

  return (
    <div className="spiritual-login-container">
      {/* Animated background elements */}
      <div className="spiritual-bg">
        <div className="floating-lotus lotus-1">🪷</div>
        <div className="floating-lotus lotus-2">🪷</div>
        <div className="floating-lotus lotus-3">🪷</div>
        <div className="floating-om om-1">🕉️</div>
        <div className="floating-om om-2">🕉️</div>
        <div className="meditation-circle circle-1"></div>
        <div className="meditation-circle circle-2"></div>
        <div className="meditation-circle circle-3"></div>
      </div>

      {/* Main content */}
      <div className="spiritual-card">
        <div className="spiritual-header">
          <div className="lotus-icon">🪷</div>
          <h1 className="spiritual-title">Welcome</h1>
          <p className="spiritual-subtitle">Meditation Center Attendance Portal</p>
          <div className="divider-line"></div>
          <p className="spiritual-instruction">
            Sign in with your @bkivv.org or @gmail.com email
          </p>
        </div>
        
        {error && (
          <div className="spiritual-error">
            <span className="error-icon">⚠️</span>
            {error}
          </div>
        )}
        
        {/* Google Sign-In Section */}
        <div className="spiritual-signin-section">
          <div className="google-signin-wrapper">
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
            <div className="spiritual-loading">
              <div className="loading-spinner"></div>
              <span>Connecting your spiritual journey...</span>
            </div>
          )}
        </div>

        <div className="spiritual-footer">
          <div className="zen-quote">
            "मुरली ही ब्राह्मण जीवन की साँस है। साँस नहीं तो जीवन नहीं" – अव्यक्त बापदादा, 7 दिसम्बर 1983"
          </div>
          <p className="onboarding-text">
            ✨ First time here? Sign in with Google to create your meditation center
          </p>
        </div>
      </div>
    </div>
  );
};

export default LoginPage; 