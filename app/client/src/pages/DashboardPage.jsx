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
    console.log('Generating attendance link for center:', center); // Debug log
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
          <Link className="navbar-brand fw-bold" to="/dashboard">
            <i className="bi bi-house-door-fill me-2"></i>
            <span className="d-none d-sm-inline">{center?.name || 'Meditation Center'}</span>
            <span className="d-sm-none">Dashboard</span>
          </Link>
          
          <button 
            className="navbar-toggler" 
            type="button" 
            data-bs-toggle="collapse" 
            data-bs-target="#navbarNav"
            aria-controls="navbarNav"
            aria-expanded="false"
            aria-label="Toggle navigation"
          >
            <span className="navbar-toggler-icon"></span>
          </button>
          
          <div className="collapse navbar-collapse" id="navbarNav">
            <ul className="navbar-nav me-auto mb-2 mb-lg-0">
              <li className="nav-item">
                <Link className="nav-link px-3 py-2" to="/dashboard/students">
                  <i className="bi bi-people-fill me-2"></i>
                  Students
                </Link>
              </li>
              <li className="nav-item">
                <Link className="nav-link px-3 py-2" to="/dashboard/reports">
                  <i className="bi bi-graph-up me-2"></i>
                  Reports
                </Link>
              </li>
            </ul>
            
            <div className="d-flex flex-column flex-lg-row gap-2">
              <button 
                className="btn btn-outline-light" 
                onClick={copyAttendanceLink}
              >
                <i className="bi bi-link-45deg me-1"></i>
                <span className="d-none d-sm-inline">Copy Attendance Link</span>
                <span className="d-sm-none">Copy Link</span>
              </button>
              
              <button 
                className="btn btn-outline-light" 
                onClick={handleLogout}
              >
                <i className="bi bi-box-arrow-right me-1"></i>
                Logout
              </button>
            </div>
          </div>
        </div>
      </nav>
      
      <div className="row">
        <div className="col-12">
          <Routes>
            <Route path="/" element={<DashboardHome center={center} setCenter={setCenter} attendanceLink={getAttendanceLink()} />} />
            <Route path="/students/*" element={<StudentsPanel />} />
            <Route path="/reports/*" element={<ReportsPanel />} />
          </Routes>
        </div>
      </div>
    </div>
  );
};

// Home component for dashboard
const DashboardHome = ({ center, setCenter, attendanceLink }) => {
  // Profile editing state
  const [profileData, setProfileData] = useState({
    center_id: '',
    name: '',
    address: '',
    contact: '',
    email: ''
  });
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [profileLoading, setProfileLoading] = useState(false);
  const [profileMessage, setProfileMessage] = useState('');
  const [profileMessageType, setProfileMessageType] = useState('');

  // Attendance link editing state
  const [isEditingLink, setIsEditingLink] = useState(false);
  const [editableCenterId, setEditableCenterId] = useState('');

  // Password settings state
  const [passwordSettings, setPasswordSettings] = useState({
    attendance_password: '',
    attendance_password_enabled: false
  });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  
  useEffect(() => {
    if (center) {
      console.log('Center data in dashboard:', center); // Debug log
      setProfileData({
        center_id: center.center_id || '',
        name: center.name || '',
        address: center.address || '',
        contact: center.contact || '',
        email: center.email || ''
      });
      setEditableCenterId(center.center_id || '');
    }
    fetchPasswordSettings();
  }, [center]);
  
  const fetchPasswordSettings = async () => {
    try {
      const response = await authAPI.getAttendancePasswordSettings();
      setPasswordSettings(response.data.settings);
    } catch (err) {
      console.error('Error fetching password settings:', err);
    }
  };

  // Generate dynamic attendance link
  const getDynamicAttendanceLink = () => {
    const baseUrl = window.location.origin;
    const centerId = isEditingLink ? editableCenterId : (profileData.center_id || center?.center_id);
    return `${baseUrl}/attendance/${centerId || 'your-center-id'}`;
  };

  // Profile editing functions
  const handleProfileChange = (e) => {
    const { name, value } = e.target;
    
    // If changing center_id, validate numbers only
    if (name === 'center_id') {
      const numbersOnly = value.replace(/[^0-9]/g, '');
      setProfileData({
        ...profileData,
        [name]: numbersOnly
      });
      // Update editable center ID for real-time link update
      setEditableCenterId(numbersOnly);
    } else {
      setProfileData({
        ...profileData,
        [name]: value
      });
    }
  };

  // Handle attendance link center ID change
  const handleLinkCenterIdChange = (e) => {
    const value = e.target.value.replace(/[^0-9]/g, ''); // Numbers only
    setEditableCenterId(value);
  };

  const saveProfile = async () => {
    setProfileLoading(true);
    setProfileMessage('');
    setProfileMessageType('');
    
    try {
      // Validate center_id
      if (!profileData.center_id) {
        setProfileMessage('Center ID is required');
        setProfileMessageType('error');
        setProfileLoading(false);
        return;
      }

      // Call the API to update the profile in the database
      const response = await authAPI.updateProfile({
        center_id: profileData.center_id,
        name: profileData.name,
        address: profileData.address,
        contact: profileData.contact
      });
      
      // Update localStorage with the new center data
      const updatedCenter = {
        ...center,
        center_id: response.data.center.center_id,
        name: response.data.center.name,
        address: response.data.center.address,
        contact: response.data.center.contact
      };
      
      localStorage.setItem('center', JSON.stringify(updatedCenter));
      localStorage.setItem('token', response.data.token); // Update token with new center_id
      
      setCenter(updatedCenter);
      setEditableCenterId(response.data.center.center_id);
      setIsEditingProfile(false);
      setProfileMessage('Profile updated successfully!');
      setProfileMessageType('success');
    } catch (err) {
      console.error('Error updating profile:', err);
      setProfileMessage(
        err.response?.data?.message || 'Error updating profile. Please try again.'
      );
      setProfileMessageType('error');
    } finally {
      setProfileLoading(false);
    }
  };

  const cancelProfileEdit = () => {
    setProfileData({
      center_id: center?.center_id || '',
      name: center?.name || '',
      address: center?.address || '',
      contact: center?.contact || '',
      email: center?.email || ''
    });
    setEditableCenterId(center?.center_id || '');
    setIsEditingProfile(false);
    setProfileMessage('');
    setProfileMessageType('');
  };

  // Attendance link editing functions
  const saveAttendanceLink = async () => {
    if (!editableCenterId) {
      alert('Center ID cannot be empty');
      return;
    }
    
    try {
      // Call the API to update the center_id in the database
      const response = await authAPI.updateProfile({
        center_id: editableCenterId,
        name: profileData.name,
        address: profileData.address,
        contact: profileData.contact
      });
      
      // Update the profile data and center with new data from server
      const updatedProfileData = {
        ...profileData,
        center_id: response.data.center.center_id
      };
      
      const updatedCenter = {
        ...center,
        center_id: response.data.center.center_id,
        name: response.data.center.name,
        address: response.data.center.address,
        contact: response.data.center.contact
      };
      
      setProfileData(updatedProfileData);
      localStorage.setItem('center', JSON.stringify(updatedCenter));
      localStorage.setItem('token', response.data.token); // Update token with new center_id
      setCenter(updatedCenter);
      setIsEditingLink(false);
    } catch (err) {
      console.error('Error updating center ID:', err);
      alert(err.response?.data?.message || 'Error updating center ID. Please try again.');
    }
  };

  const cancelLinkEdit = () => {
    setEditableCenterId(center?.center_id || profileData.center_id || '');
    setIsEditingLink(false);
  };

  const handlePasswordChange = (e) => {
    const { name, value, type, checked } = e.target;
    setPasswordSettings({
      ...passwordSettings,
      [name]: type === 'checkbox' ? checked : value
    });
  };
  
  const savePasswordSettings = async () => {
    setLoading(true);
    setMessage('');
    setMessageType('');
    
    try {
      if (passwordSettings.attendance_password_enabled && !passwordSettings.attendance_password) {
        setMessage('Password is required when protection is enabled');
        setMessageType('error');
        setLoading(false);
        return;
      }
      
      await authAPI.updateAttendancePasswordSettings({
        attendance_password: passwordSettings.attendance_password || '',
        attendance_password_enabled: passwordSettings.attendance_password_enabled
      });
      
      setMessage('Password settings updated successfully');
      setMessageType('success');
      await fetchPasswordSettings();
    } catch (err) {
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
    <div className="container-fluid">
      <div className="jumbotron p-4 bg-light rounded-3 mb-4">
        <h1>Welcome, {center?.name}!</h1>
        <p className="lead">
          Manage your meditation center's attendance with this simple application.
        </p>
      </div>
      
      {/* Quick Navigation - Moved to top */}
      <div className="card mb-4">
        <div className="card-header">
          <h5 className="mb-0">Quick Navigation</h5>
        </div>
        <div className="card-body">
          <div className="row g-3">
            <div className="col-12 col-md-6">
              <Link to="/dashboard/students" className="btn btn-primary w-100 py-3">
                <i className="bi bi-people-fill me-2"></i>
                <span className="fw-bold">Manage Students</span>
                <br />
                <small className="opacity-75">Add, edit, and view student records</small>
              </Link>
            </div>
            <div className="col-12 col-md-6">
              <Link to="/dashboard/reports" className="btn btn-primary w-100 py-3">
                <i className="bi bi-graph-up me-2"></i>
                <span className="fw-bold">View Reports</span>
                <br />
                <small className="opacity-75">Attendance reports and analytics</small>
              </Link>
            </div>
          </div>
        </div>
      </div>
      
      <div className="row g-4">
        {/* First Column - Attendance Link & Security */}
        <div className="col-12 col-lg-6">
          <div className="card mb-4">
            <div className="card-header">
              <h5>Attendance Link & Security</h5>
            </div>
            <div className="card-body">
              {/* Attendance Link Section */}
              <div className="mb-4">
                <label className="form-label"><strong>Share this link with your students:</strong></label>
                {isEditingLink ? (
                  <div>
                    <div className="mb-2">
                      <label className="form-label small">Center ID (numbers only):</label>
                      <input
                        type="text"
                        className="form-control"
                        value={editableCenterId}
                        onChange={handleLinkCenterIdChange}
                        placeholder="Enter center ID"
                      />
                    </div>
                    <div className="mb-2">
                      <label className="form-label small">Preview:</label>
                      <input
                        type="text"
                        className="form-control"
                        value={getDynamicAttendanceLink()}
                        readOnly
                      />
                    </div>
                    <div className="d-flex gap-2">
                      <button
                        className="btn btn-primary btn-sm"
                        onClick={saveAttendanceLink}
                      >
                        Save
                      </button>
                      <button
                        className="btn btn-secondary btn-sm"
                        onClick={cancelLinkEdit}
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="input-group">
                    <input 
                      type="text" 
                      className="form-control" 
                      value={getDynamicAttendanceLink()} 
                      readOnly 
                    />
                    <button 
                      className="btn btn-outline-primary" 
                      onClick={() => navigator.clipboard.writeText(getDynamicAttendanceLink())}
                    >
                      Copy
                    </button>
                    <button 
                      className="btn btn-outline-secondary" 
                      onClick={() => setIsEditingLink(true)}
                    >
                      Edit
                    </button>
                  </div>
                )}
              </div>
              
              <hr />
              
              {/* Password Protection Section */}
              <div>
                <label className="form-label"><strong>Password Protection</strong></label>
                <p className="text-muted small">Protect your attendance link with a password</p>
                
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
                      type={showPassword ? 'text' : 'password'}
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
                      onClick={() => setShowPassword(!showPassword)}
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
        </div>
        
        {/* Second Column - Center Profile */}
        <div className="col-12 col-lg-6">
          <div className="card mb-4">
            <div className="card-header d-flex justify-content-between align-items-center">
              <h5 className="mb-0">Center Profile</h5>
              {!isEditingProfile && (
                <button 
                  className="btn btn-sm btn-outline-primary"
                  onClick={() => setIsEditingProfile(true)}
                >
                  Edit
                </button>
              )}
            </div>
            <div className="card-body">
              {profileMessage && (
                <div className={`alert alert-${profileMessageType === 'success' ? 'success' : 'danger'} mb-3`}>
                  {profileMessage}
                </div>
              )}
              
              <div className="mb-3">
                <label className="form-label"><strong>Center Name</strong></label>
                {isEditingProfile ? (
                  <input
                    type="text"
                    className="form-control"
                    name="name"
                    value={profileData.name}
                    onChange={handleProfileChange}
                  />
                ) : (
                  <p className="form-control-plaintext">{profileData.name || 'Not set'}</p>
                )}
              </div>
              
              <div className="mb-3">
                <label className="form-label"><strong>Center ID</strong></label>
                {isEditingProfile ? (
                  <input
                    type="text"
                    className="form-control"
                    name="center_id"
                    value={profileData.center_id}
                    onChange={handleProfileChange}
                    placeholder="Enter center ID (numbers only)"
                  />
                ) : (
                  <p className="form-control-plaintext">{profileData.center_id || 'Not set'}</p>
                )}
                {isEditingProfile && (
                  <small className="text-muted">Only numbers are allowed for Center ID</small>
                )}
              </div>
              
              <div className="mb-3">
                <label className="form-label"><strong>Email</strong></label>
                <p className="form-control-plaintext">{profileData.email || 'Not set'}</p>
                <small className="text-muted">Email cannot be changed (Google OAuth)</small>
              </div>
              
              <div className="mb-3">
                <label className="form-label"><strong>Address</strong></label>
                {isEditingProfile ? (
                  <textarea
                    className="form-control"
                    name="address"
                    value={profileData.address}
                    onChange={handleProfileChange}
                    rows="3"
                  />
                ) : (
                  <p className="form-control-plaintext">{profileData.address || 'Not set'}</p>
                )}
              </div>
              
              <div className="mb-3">
                <label className="form-label"><strong>Contact</strong></label>
                {isEditingProfile ? (
                  <input
                    type="text"
                    className="form-control"
                    name="contact"
                    value={profileData.contact}
                    onChange={handleProfileChange}
                  />
                ) : (
                  <p className="form-control-plaintext">{profileData.contact || 'Not set'}</p>
                )}
              </div>
              
              {isEditingProfile && (
                <div className="d-flex gap-2">
                  <button
                    className="btn btn-primary"
                    onClick={saveProfile}
                    disabled={profileLoading}
                  >
                    {profileLoading ? 'Saving...' : 'Save Changes'}
                  </button>
                  <button
                    className="btn btn-secondary"
                    onClick={cancelProfileEdit}
                    disabled={profileLoading}
                  >
                    Cancel
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardPage; 