import React, { useState, useEffect } from 'react';
import { Routes, Route, Link, useNavigate } from 'react-router-dom';
import StudentsPanel from '../components/StudentsPanel';
import ReportsPanel from '../components/ReportsPanel';
import { authAPI } from '../services/api';

const DashboardPage = ({ onLogout }) => {
  const navigate = useNavigate();
  const [center, setCenter] = useState(null);
  
  useEffect(() => {
    // Get center info from localStorage
    const centerData = localStorage.getItem('center');
    if (centerData) {
      setCenter(JSON.parse(centerData));
    }
  }, []);
  
  const handleLogout = () => {
    onLogout();
    navigate('/');
  };
  
  const getAttendanceLink = () => {
    if (!center) return '';
    const baseUrl = window.location.origin;
    return `${baseUrl}/attendance/${center.center_id}`;
  };
  
  const copyAttendanceLink = () => {
    const link = getAttendanceLink();
    navigator.clipboard.writeText(link);
    alert('Attendance link copied to clipboard!');
  };
  
  return (
    <div className="dashboard-container">
      <nav className="navbar navbar-expand-lg navbar-dark bg-primary mb-4">
        <div className="container-fluid">
          <Link className="navbar-brand" to="/dashboard">
            {center?.name || 'Meditation Center'} Dashboard
          </Link>
          
          <button className="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#navbarNav">
            <span className="navbar-toggler-icon"></span>
          </button>
          
          <div className="collapse navbar-collapse" id="navbarNav">
            <ul className="navbar-nav me-auto">
              <li className="nav-item">
                <Link className="nav-link" to="/dashboard/students">
                  Manage Students
                </Link>
              </li>
              <li className="nav-item">
                <Link className="nav-link" to="/dashboard/reports">
                  Reports
                </Link>
              </li>
            </ul>
            
            <button 
              className="btn btn-outline-light me-2" 
              onClick={copyAttendanceLink}
            >
              Copy Attendance Link
            </button>
            
            <button 
              className="btn btn-outline-light" 
              onClick={handleLogout}
            >
              Logout
            </button>
          </div>
        </div>
      </nav>
      
      <div className="row">
        <div className="col-12">
          <Routes>
            <Route path="/" element={<DashboardHome center={center} attendanceLink={getAttendanceLink()} />} />
            <Route path="/students/*" element={<StudentsPanel />} />
            <Route path="/reports/*" element={<ReportsPanel />} />
          </Routes>
        </div>
      </div>
    </div>
  );
};

// Home component for dashboard
const DashboardHome = ({ center, attendanceLink }) => {
  const [passwordSettings, setPasswordSettings] = useState({
    attendance_password: '',
    attendance_password_enabled: false
  });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState(''); // 'success' or 'error'
  const [showPassword, setShowPassword] = useState(false); // State for password visibility
  
  // State for login password reset
  const [loginPasswordData, setLoginPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
    showCurrentPassword: false,
    showNewPassword: false,
    loading: false,
    message: '',
    messageType: ''
  });
  
  // State to track if the password reset section is expanded
  const [passwordResetExpanded, setPasswordResetExpanded] = useState(false);
  
  useEffect(() => {
    fetchPasswordSettings();
  }, []);
  
  const fetchPasswordSettings = async () => {
    try {
      const response = await authAPI.getAttendancePasswordSettings();
      setPasswordSettings(response.data.settings);
    } catch (err) {
      console.error('Error fetching password settings:', err);
    }
  };
  
  const handlePasswordChange = (e) => {
    const { name, value, type, checked } = e.target;
    setPasswordSettings({
      ...passwordSettings,
      [name]: type === 'checkbox' ? checked : value
    });
  };
  
  // Handle login password change
  const handleLoginPasswordChange = (e) => {
    const { name, value } = e.target;
    setLoginPasswordData({
      ...loginPasswordData,
      [name]: value,
      message: '', // Clear messages on input change
      messageType: ''
    });
  };
  
  // Toggle password visibility
  const togglePasswordVisibility = (field) => {
    setLoginPasswordData({
      ...loginPasswordData,
      [field]: !loginPasswordData[field]
    });
  };
  
  // Toggle password reset section expansion
  const togglePasswordResetSection = () => {
    setPasswordResetExpanded(!passwordResetExpanded);
  };
  
  // Update login password
  const updateLoginPassword = async () => {
    // Reset message
    setLoginPasswordData({
      ...loginPasswordData,
      message: '',
      messageType: '',
      loading: true
    });
    
    // Validate input
    if (!loginPasswordData.currentPassword) {
      setLoginPasswordData({
        ...loginPasswordData,
        message: 'Current password is required',
        messageType: 'error',
        loading: false
      });
      return;
    }
    
    if (!loginPasswordData.newPassword) {
      setLoginPasswordData({
        ...loginPasswordData,
        message: 'New password is required',
        messageType: 'error',
        loading: false
      });
      return;
    }
    
    if (loginPasswordData.newPassword.length < 6) {
      setLoginPasswordData({
        ...loginPasswordData,
        message: 'New password must be at least 6 characters long',
        messageType: 'error',
        loading: false
      });
      return;
    }
    
    if (loginPasswordData.newPassword !== loginPasswordData.confirmPassword) {
      setLoginPasswordData({
        ...loginPasswordData,
        message: 'New password and confirmation do not match',
        messageType: 'error',
        loading: false
      });
      return;
    }
    
    try {
      // Make API call
      await authAPI.updateLoginPassword({
        currentPassword: loginPasswordData.currentPassword,
        newPassword: loginPasswordData.newPassword
      });
      
      // Update state on success
      setLoginPasswordData({
        ...loginPasswordData,
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
        message: 'Password updated successfully',
        messageType: 'success',
        loading: false
      });
    } catch (err) {
      // Handle error
      console.error('Error updating login password:', err);
      
      setLoginPasswordData({
        ...loginPasswordData,
        message: err.response?.data?.message || 'Error updating password. Please try again.',
        messageType: 'error',
        loading: false
      });
    }
  };
  
  const savePasswordSettings = async () => {
    setLoading(true);
    setMessage(''); // Clear message before saving
    setMessageType('');
    
    try {
      // Basic client-side validation
      if (passwordSettings.attendance_password_enabled && !passwordSettings.attendance_password) {
        setMessage('Password is required when protection is enabled');
        setMessageType('error');
        setLoading(false);
        return;
      }
      
      // Log what we're sending for debugging
      console.log('Sending password settings:', JSON.stringify(passwordSettings));
      
      // Make the API call
      const response = await authAPI.updateAttendancePasswordSettings({
        attendance_password: passwordSettings.attendance_password || '',
        attendance_password_enabled: passwordSettings.attendance_password_enabled
      });
      
      console.log('Server response:', response.data);
      
      // Update UI
      setMessage('Password settings updated successfully');
      setMessageType('success');
      
      // Refresh settings from server
      await fetchPasswordSettings();
    } catch (err) {
      // Detailed error logging
      console.error('Error updating password settings:', err);
      console.error('Error response:', err.response?.data);
      
      // Show error message
      setMessage(
        err.response?.data?.message || 
        'Error updating attendance password settings. Please try again.'
      );
      setMessageType('error');
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <div className="jumbotron p-4 bg-light rounded-3">
      <h1>Welcome, {center?.name}!</h1>
      <p className="lead">
        Manage your meditation center's attendance with this simple application.
      </p>
      
      <hr />
      
      <div className="row mt-4">
        <div className="col-md-6">
          <div className="card mb-4">
            <div className="card-header">
              <h5>Attendance Link</h5>
            </div>
            <div className="card-body">
              <p>Share this link with your students to mark their attendance:</p>
              <div className="input-group">
                <input 
                  type="text" 
                  className="form-control" 
                  value={attendanceLink} 
                  readOnly 
                />
                <button 
                  className="btn btn-outline-primary" 
                  onClick={() => navigator.clipboard.writeText(attendanceLink)}
                >
                  Copy
                </button>
              </div>
            </div>
          </div>
          
          <div className="card mb-4">
            <div className="card-header">
              <h5>Attendance Password Protection</h5>
            </div>
            <div className="card-body">
              <p>Set a password to protect your attendance link:</p>
              
              <div className="form-check mb-3">
                <input
                  type="checkbox"
                  className="form-check-input"
                  id="attendance_password_enabled"
                  name="attendance_password_enabled"
                  checked={passwordSettings.attendance_password_enabled}
                  onChange={handlePasswordChange}
                />
                <label className="form-check-label" htmlFor="attendance_password_enabled">
                  Enable password protection
                </label>
              </div>
              
              <div className="mb-3">
                <label htmlFor="attendance_password" className="form-label">
                  Attendance Password
                </label>
                <div className="input-group">
                <input
                    type={showPassword ? 'text' : 'password'} // Toggle type
                  className="form-control"
                  id="attendance_password"
                  name="attendance_password"
                  value={passwordSettings.attendance_password || ''}
                  onChange={handlePasswordChange}
                  disabled={!passwordSettings.attendance_password_enabled}
                  required={passwordSettings.attendance_password_enabled}
                />
                  <button 
                    className="btn btn-outline-secondary" 
                    type="button" 
                    onClick={() => setShowPassword(!showPassword)} // Toggle visibility
                    disabled={!passwordSettings.attendance_password_enabled}
                  >
                    {showPassword ? 'Hide' : 'Show'} 
                  </button>
                </div>
                <div className="form-text">
                  {passwordSettings.attendance_password_enabled
                    ? 'Students will need to enter this password to mark their attendance'
                    : 'Enable password protection to set a password'}
                </div>
              </div>
              
              <button
                className="btn btn-primary"
                onClick={savePasswordSettings}
                disabled={loading || (passwordSettings.attendance_password_enabled && !passwordSettings.attendance_password)}
              >
                {loading ? 'Saving...' : 'Save Settings'}
              </button>
              
              {message && (
                <div className={`alert alert-${messageType === 'success' ? 'success' : 'danger'} mt-3`}>
                  {message}
                </div>
              )}
            </div>
          </div>
        </div>
        
        <div className="col-md-6">
          <div className="card mb-4">
            <div className="card-header">
              <h5>Quick Navigation</h5>
            </div>
            <div className="card-body">
              <div className="d-grid gap-2">
                <Link to="/dashboard/students" className="btn btn-primary">
                  Manage Students
                </Link>
                <Link to="/dashboard/reports" className="btn btn-primary">
                  View Reports
                </Link>
              </div>
            </div>
          </div>
          
          <div className="card mb-4">
            <div className="card-header bg-warning text-dark" 
                 onClick={togglePasswordResetSection} 
                 style={{ cursor: 'pointer' }}>
              <div className="d-flex justify-content-between align-items-center">
                <h5 className="mb-0">Reset Admin Password</h5>
                <span>{passwordResetExpanded ? '▲' : '▼'}</span>
              </div>
            </div>
            {passwordResetExpanded && (
              <div className="card-body">
                <p>Change your admin dashboard login password:</p>
                
                <div className="mb-3">
                  <label htmlFor="currentPassword" className="form-label">Current Password</label>
                  <div className="input-group">
                    <input
                      type={loginPasswordData.showCurrentPassword ? 'text' : 'password'}
                      className="form-control"
                      id="currentPassword"
                      name="currentPassword"
                      value={loginPasswordData.currentPassword}
                      onChange={handleLoginPasswordChange}
                      placeholder="Enter your current password"
                    />
                    <button 
                      className="btn btn-outline-secondary" 
                      type="button" 
                      onClick={() => togglePasswordVisibility('showCurrentPassword')}
                    >
                      {loginPasswordData.showCurrentPassword ? 'Hide' : 'Show'}
                    </button>
                  </div>
                </div>
                
                <div className="mb-3">
                  <label htmlFor="newPassword" className="form-label">New Password</label>
                  <div className="input-group">
                    <input
                      type={loginPasswordData.showNewPassword ? 'text' : 'password'}
                      className="form-control"
                      id="newPassword"
                      name="newPassword"
                      value={loginPasswordData.newPassword}
                      onChange={handleLoginPasswordChange}
                      placeholder="Enter new password (min 6 characters)"
                    />
                    <button 
                      className="btn btn-outline-secondary" 
                      type="button" 
                      onClick={() => togglePasswordVisibility('showNewPassword')}
                    >
                      {loginPasswordData.showNewPassword ? 'Hide' : 'Show'}
                    </button>
                  </div>
                  <div className="form-text">Password must be at least 6 characters long</div>
                </div>
                
                <div className="mb-3">
                  <label htmlFor="confirmPassword" className="form-label">Confirm New Password</label>
                  <input
                    type="password"
                    className="form-control"
                    id="confirmPassword"
                    name="confirmPassword"
                    value={loginPasswordData.confirmPassword}
                    onChange={handleLoginPasswordChange}
                    placeholder="Confirm your new password"
                  />
                </div>
                
                <button
                  className="btn btn-warning"
                  onClick={updateLoginPassword}
                  disabled={loginPasswordData.loading}
                >
                  {loginPasswordData.loading ? 'Updating...' : 'Update Password'}
                </button>
                
                {loginPasswordData.message && (
                  <div className={`alert alert-${loginPasswordData.messageType === 'success' ? 'success' : 'danger'} mt-3`}>
                    {loginPasswordData.message}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardPage; 