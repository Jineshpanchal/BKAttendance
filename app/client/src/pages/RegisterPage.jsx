import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { authAPI } from '../services/api';

const RegisterPage = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    center_id: '',
    name: '',
    password: '',
    address: '',
    contact: ''
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);
    
    try {
      await authAPI.register(formData);
      
      setSuccess('Registration successful! You can now login with your Center ID and password.');
      
      // Clear form
      setFormData({
        center_id: '',
        name: '',
        password: '',
        address: '',
        contact: ''
      });
      
      // Redirect to login after 2 seconds
      setTimeout(() => {
        navigate('/');
      }, 2000);
    } catch (err) {
      setError(
        err.response?.data?.message || 
        'Registration failed. Please try again with different information.'
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
          <h1 style={{fontSize: '28px', color: '#3a3a3a', marginBottom: '10px', fontWeight: 600}}>Register Center</h1>
          <p style={{color: '#5a5a5a', fontSize: '16px', margin: 0}}>Create an account for your meditation center</p>
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
            <label htmlFor="center_id" style={labelStyle}>Center ID</label>
            <div style={{position: 'relative'}}>
              <span style={{position: 'absolute', left: '12px', top: '12px', opacity: 0.5}}>🏠</span>
              <input
                type="text"
                id="center_id"
                name="center_id"
                value={formData.center_id}
                onChange={handleChange}
                required
                pattern="[a-zA-Z0-9-_]+"
                title="Center ID can only contain letters, numbers, hyphens and underscores"
                style={{...inputStyle, paddingLeft: '40px'}}
              />
            </div>
            <div style={{fontSize: '12px', color: '#777', marginTop: '4px'}}>
              Create a unique ID for your center using letters, numbers, hyphens, or underscores
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
            />
          </div>
          
          <div style={{display: 'flex', flexDirection: 'column'}}>
            <label htmlFor="password" style={labelStyle}>Password</label>
            <div style={{position: 'relative'}}>
              <span style={{position: 'absolute', left: '12px', top: '12px', opacity: 0.5}}>🔒</span>
              <input
                type="password"
                id="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                required
                minLength="6"
                style={{...inputStyle, paddingLeft: '40px'}}
              />
            </div>
            <div style={{fontSize: '12px', color: '#777', marginTop: '4px'}}>
              Minimum 6 characters
            </div>
          </div>
          
          <div style={{display: 'flex', flexDirection: 'column'}}>
            <label htmlFor="address" style={labelStyle}>Address</label>
            <textarea
              id="address"
              name="address"
              value={formData.address}
              onChange={handleChange}
              style={{...inputStyle, minHeight: '80px', resize: 'vertical'}}
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
            {loading ? 'Registering...' : 'Register'}
          </button>
        </form>
        
        <div style={{textAlign: 'center', marginTop: '30px', color: '#757575', fontSize: '14px'}}>
          <p>
            Already have an account? <Link to="/" style={{color: '#4a90e2', textDecoration: 'none', fontWeight: 600}}>Login</Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default RegisterPage; 