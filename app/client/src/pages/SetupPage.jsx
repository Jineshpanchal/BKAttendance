import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';

const SetupPage = ({ onLogin }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const googleUserInfo = location.state?.googleUserInfo;
  
  const [formData, setFormData] = useState({
    center_id: '',
    name: '',
    address: '',
    contact: '',
    email: googleUserInfo?.email || ''
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  
  useEffect(() => {
    // Redirect if no Google user info
    if (!googleUserInfo) {
      navigate('/');
      return;
    }
    
    setFormData(prev => ({
      ...prev,
      email: googleUserInfo.email,
      name: googleUserInfo.name || ''
    }));
  }, [googleUserInfo, navigate]);
  
  const handleChange = (e) => {
    const { name, value } = e.target;
    
    // If changing center_id, only allow numbers
    if (name === 'center_id') {
      const numbersOnly = value.replace(/[^0-9]/g, '');
      setFormData({ ...formData, [name]: numbersOnly });
    } else {
      setFormData({ ...formData, [name]: value });
    }
  };
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);
    
    try {
      // Complete Google OAuth registration
      const response = await axios.post('/api/google-auth/complete-registration', {
        email: formData.email,
        center_id: formData.center_id,
        center_name: formData.name,
        address: formData.address,
        contact: formData.contact
      });
      
      setSuccess('Setup successful! Redirecting to your dashboard...');
      
      // Store token and center info
      localStorage.setItem('token', response.data.token);
      localStorage.setItem('center', JSON.stringify(response.data.center));
      
      // Notify parent component of successful login
      onLogin();
      
      // Redirect to dashboard after 2 seconds
      setTimeout(() => {
        navigate('/dashboard');
      }, 2000);
      
    } catch (err) {
      setError(
        err.response?.data?.message || 
        'Setup failed. Please try again with different information.'
      );
    } finally {
      setLoading(false);
    }
  };

  // Matching styles from LoginPage
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
    maxWidth: '500px',
    padding: '40px',
    zIndex: 10,
    position: 'relative'
  };

  const inputStyle = {
    width: '100%',
    padding: '12px',
    border: '1px solid #ddd',
    borderRadius: '10px',
    fontSize: '16px',
    backgroundColor: '#ffffff'
  };

  const labelStyle = {
    fontSize: '14px',
    color: '#555',
    marginBottom: '8px',
    fontWeight: 500
  };
  
  return (
    <div style={containerStyle}>
      <div style={cardStyle}>
        <div style={{textAlign: 'center', marginBottom: '30px'}}>
          <h1 style={{fontSize: '28px', color: '#3a3a3a', marginBottom: '10px', fontWeight: 600}}>
            Set Up Your Center
          </h1>
          <p style={{color: '#5a5a5a', fontSize: '16px', margin: 0}}>
            Complete your meditation center setup
          </p>
          <div style={{
            backgroundColor: 'rgba(76, 175, 80, 0.1)',
            color: '#388e3c',
            padding: '10px',
            borderRadius: '8px',
            marginTop: '15px',
            fontSize: '14px'
          }}>
            ✓ Signed in as {googleUserInfo?.email}
          </div>
        </div>
        
        {error && (
          <div style={{
            backgroundColor: 'rgba(244, 67, 54, 0.1)',
            color: '#d32f2f',
            padding: '12px',
            borderRadius: '8px',
            textAlign: 'center',
            marginBottom: '20px',
            fontSize: '14px'
          }}>
            {error}
          </div>
        )}
        
        {success && (
          <div style={{
            backgroundColor: 'rgba(76, 175, 80, 0.1)',
            color: '#388e3c',
            padding: '12px',
            borderRadius: '8px',
            textAlign: 'center',
            marginBottom: '20px',
            fontSize: '14px'
          }}>
            {success}
          </div>
        )}
        
        <form onSubmit={handleSubmit} style={{display: 'flex', flexDirection: 'column', gap: '16px'}}>
          <div style={{display: 'flex', flexDirection: 'column'}}>
            <label htmlFor="center_id" style={labelStyle}>Center ID *</label>
            <div style={{position: 'relative'}}>
              <span style={{position: 'absolute', left: '12px', top: '12px', opacity: 0.5}}>🏠</span>
              <input
                type="text"
                id="center_id"
                name="center_id"
                value={formData.center_id}
                onChange={handleChange}
                required
                pattern="[0-9]+"
                title="Center ID must contain only numbers"
                style={{...inputStyle, paddingLeft: '40px'}}
                placeholder="e.g., 1234, 5678"
                minLength="1"
                maxLength="10"
              />
            </div>
            <div style={{fontSize: '12px', color: '#777', marginTop: '4px'}}>
              Numbers only. This will be your unique center URL: /attendance/<strong>{formData.center_id || 'your-center-id'}</strong>
            </div>
          </div>
          
          <div style={{display: 'flex', flexDirection: 'column'}}>
            <label htmlFor="name" style={labelStyle}>Center Name</label>
            <input
              type="text"
              id="name"
              name="name"
              value={formData.name}
              onChange={handleChange}
              required
              style={inputStyle}
              placeholder="e.g., BK Mumbai Center"
            />
          </div>
          
          <div style={{display: 'flex', flexDirection: 'column'}}>
            <label htmlFor="address" style={labelStyle}>Address</label>
            <textarea
              id="address"
              name="address"
              value={formData.address}
              onChange={handleChange}
              style={{...inputStyle, minHeight: '80px', resize: 'vertical'}}
              placeholder="Enter your center's address"
            />
          </div>
          
          <div style={{display: 'flex', flexDirection: 'column'}}>
            <label htmlFor="contact" style={labelStyle}>Contact Information</label>
            <input
              type="text"
              id="contact"
              name="contact"
              value={formData.contact}
              onChange={handleChange}
              style={inputStyle}
              placeholder="Phone number or email"
            />
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
            {loading ? 'Setting up...' : 'Complete Setup'}
          </button>
        </form>
        
        <div style={{textAlign: 'center', marginTop: '20px', color: '#757575', fontSize: '12px'}}>
          <p>
            After setup, your attendance page will be available at:<br/>
            <strong>localhost:3000/attendance/{formData.center_id || 'your-center-id'}</strong>
          </p>
        </div>
      </div>
    </div>
  );
};

export default SetupPage; 