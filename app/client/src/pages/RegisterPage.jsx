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
  
  return (
    <div className="auth-container">
      <h3 className="text-center mb-4">Register for Center Attendance</h3>
      
      {error && (
        <div className="alert alert-danger" role="alert">
          {error}
        </div>
      )}
      
      {success && (
        <div className="alert alert-success" role="alert">
          {success}
        </div>
      )}
      
      <form onSubmit={handleSubmit}>
        <div className="mb-3">
          <label htmlFor="center_id" className="form-label">Center ID</label>
          <input
            type="text"
            className="form-control"
            id="center_id"
            name="center_id"
            value={formData.center_id}
            onChange={handleChange}
            required
            pattern="[a-zA-Z0-9-_]+"
            title="Center ID can only contain letters, numbers, hyphens and underscores"
          />
          <div className="form-text">
            Write any number or word to login to the center
          </div>
        </div>
        
        <div className="mb-3">
          <label htmlFor="name" className="form-label">Center Name</label>
          <input
            type="text"
            className="form-control"
            id="name"
            name="name"
            value={formData.name}
            onChange={handleChange}
            required
          />
        </div>
        
        <div className="mb-3">
          <label htmlFor="password" className="form-label">Password</label>
          <input
            type="password"
            className="form-control"
            id="password"
            name="password"
            value={formData.password}
            onChange={handleChange}
            required
            minLength="6"
          />
        </div>
        
        <div className="mb-3">
          <label htmlFor="address" className="form-label">Address</label>
          <textarea
            className="form-control"
            id="address"
            name="address"
            value={formData.address}
            onChange={handleChange}
          />
        </div>
        
        <div className="mb-3">
          <label htmlFor="contact" className="form-label">Contact Information</label>
          <input
            type="text"
            className="form-control"
            id="contact"
            name="contact"
            value={formData.contact}
            onChange={handleChange}
          />
        </div>
        
        <button 
          type="submit" 
          className="btn btn-primary w-100"
          disabled={loading}
        >
          {loading ? 'Registering...' : 'Register'}
        </button>
      </form>
      
      <div className="mt-3 text-center">
        <p>
          Already have an account? <Link to="/">Login</Link>
        </p>
      </div>
    </div>
  );
};

export default RegisterPage; 