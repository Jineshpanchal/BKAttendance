import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';

const SuperAdminDashboard = () => {
  const [centers, setCenters] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedCenter, setSelectedCenter] = useState(null);
  const [centerDetails, setCenterDetails] = useState(null);
  const [detailsLoading, setDetailsLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredCenters, setFilteredCenters] = useState([]);
  const [resetPasswordData, setResetPasswordData] = useState({ showModal: false, password: '', loading: false, error: '', success: '' });
  const navigate = useNavigate();

  // Format date function
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString();
  };

  useEffect(() => {
    // Filter centers when search query or centers list changes
    if (!searchQuery.trim()) {
      setFilteredCenters(centers);
      return;
    }
    
    const query = searchQuery.toLowerCase().trim();
    const filtered = centers.filter(center => 
      center.name.toLowerCase().includes(query) || 
      center.center_id.toLowerCase().includes(query) ||
      (center.address && center.address.toLowerCase().includes(query))
    );
    setFilteredCenters(filtered);
  }, [searchQuery, centers]);

  useEffect(() => {
    // Check if super admin is logged in
    const token = localStorage.getItem('superadminToken');
    if (!token) {
      navigate('/superadmin/login');
      return;
    }

    fetchCenters();
  }, [navigate]);

  // Fetch centers when component mounts
  const fetchCenters = async () => {
    setLoading(true);
    setError('');
    
    try {
      const token = localStorage.getItem('superadminToken');
      const response = await axios.get('/api/superadmin/centers', {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      
      setCenters(response.data.centers);
      setFilteredCenters(response.data.centers);
    } catch (err) {
      if (err.response?.status === 401 || err.response?.status === 403) {
        // Unauthorized, redirect to login
        localStorage.removeItem('superadminToken');
        localStorage.removeItem('superadminUser');
        navigate('/superadmin/login');
      } else {
        setError(err.response?.data?.message || 'Failed to load centers');
      }
    } finally {
      setLoading(false);
    }
  };

  // Fetch detailed stats for a specific center
  const fetchCenterDetails = async (centerId) => {
    setCenterDetails(null);
    setDetailsLoading(true);
    
    try {
      const token = localStorage.getItem('superadminToken');
      const response = await axios.get(`/api/superadmin/centers/${centerId}`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      
      setCenterDetails(response.data.stats);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load center details');
    } finally {
      setDetailsLoading(false);
    }
  };

  const handleCenterClick = (center) => {
    setSelectedCenter(center);
    fetchCenterDetails(center.center_id);
  };

  const handleLogout = () => {
    localStorage.removeItem('superadminToken');
    localStorage.removeItem('superadminUser');
    navigate('/superadmin/login');
  };

  const handleSearchChange = (e) => {
    setSearchQuery(e.target.value);
  };

  const showResetPasswordModal = () => {
    setResetPasswordData({
      showModal: true,
      password: '',
      loading: false,
      error: '',
      success: ''
    });
  };

  const hideResetPasswordModal = () => {
    setResetPasswordData({
      ...resetPasswordData,
      showModal: false,
      password: '',
      error: '',
      success: ''
    });
  };

  const handlePasswordChange = (e) => {
    setResetPasswordData({
      ...resetPasswordData,
      password: e.target.value,
      error: '',
      success: ''
    });
  };

  const resetCenterPassword = async () => {
    if (!resetPasswordData.password || resetPasswordData.password.length < 6) {
      setResetPasswordData({
        ...resetPasswordData,
        error: 'Password must be at least 6 characters long'
      });
      return;
    }

    setResetPasswordData({
      ...resetPasswordData,
      loading: true,
      error: '',
      success: ''
    });

    try {
      const token = localStorage.getItem('superadminToken');
      await axios.post(
        `/api/superadmin/centers/${selectedCenter.center_id}/reset-password`,
        { newPassword: resetPasswordData.password },
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );

      setResetPasswordData({
        ...resetPasswordData,
        loading: false,
        success: 'Password has been reset successfully',
        password: ''
      });
      
      // Automatically close the modal after 2 seconds
      setTimeout(() => {
        hideResetPasswordModal();
      }, 2000);
    } catch (err) {
      setResetPasswordData({
        ...resetPasswordData,
        loading: false,
        error: err.response?.data?.message || 'Failed to reset password'
      });
    }
  };

  // Render the reset password modal
  const renderResetPasswordModal = () => {
    if (!resetPasswordData.showModal) return null;

    return (
      <div className="modal fade show" style={{ display: 'block', backgroundColor: 'rgba(0,0,0,0.5)' }}>
        <div className="modal-dialog">
          <div className="modal-content">
            <div className="modal-header bg-warning">
              <h5 className="modal-title">Reset Password for {selectedCenter.name}</h5>
              <button type="button" className="btn-close" onClick={hideResetPasswordModal}></button>
            </div>
            <div className="modal-body">
              <p className="mb-3">Enter a new password for this meditation center:</p>
              
              {resetPasswordData.error && (
                <div className="alert alert-danger">{resetPasswordData.error}</div>
              )}
              
              {resetPasswordData.success && (
                <div className="alert alert-success">{resetPasswordData.success}</div>
              )}
              
              {!resetPasswordData.success && (
                <div className="form-group mb-3">
                  <label htmlFor="newPassword" className="form-label">New Password</label>
                  <input
                    type="password"
                    id="newPassword"
                    className="form-control"
                    value={resetPasswordData.password}
                    onChange={handlePasswordChange}
                    placeholder="Enter new password (minimum 6 characters)"
                    disabled={resetPasswordData.loading}
                  />
                  <div className="form-text text-muted">
                    Password must be at least 6 characters long.
                  </div>
                </div>
              )}
            </div>
            <div className="modal-footer">
              <button 
                type="button" 
                className="btn btn-secondary" 
                onClick={hideResetPasswordModal}
                disabled={resetPasswordData.loading}
              >
                Cancel
              </button>
              <button 
                type="button" 
                className="btn btn-warning" 
                onClick={resetCenterPassword}
                disabled={resetPasswordData.loading || resetPasswordData.success}
              >
                {resetPasswordData.loading ? (
                  <>
                    <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                    Resetting...
                  </>
                ) : 'Reset Password'}
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  // Render the center details modal
  const renderCenterDetails = () => {
    if (!selectedCenter) return null;

    return (
      <div className="modal fade show" style={{ display: 'block', backgroundColor: 'rgba(0,0,0,0.5)' }}>
        <div className="modal-dialog modal-lg">
          <div className="modal-content">
            <div className="modal-header bg-primary text-white">
              <h5 className="modal-title">{selectedCenter.name} Details</h5>
              <button type="button" className="btn-close btn-close-white" onClick={() => setSelectedCenter(null)}></button>
            </div>
            <div className="modal-body">
              {detailsLoading ? (
                <div className="text-center py-5">
                  <div className="spinner-border text-primary" role="status">
                    <span className="visually-hidden">Loading...</span>
                  </div>
                  <p className="mt-3">Loading center details...</p>
                </div>
              ) : !centerDetails ? (
                <div className="alert alert-danger">Failed to load center details</div>
              ) : (
                <>
                  <div className="row">
                    <div className="col-12">
                      <div className="card mb-4">
                        <div className="card-header bg-info text-white">Center Information</div>
                        <div className="card-body">
                          <div className="row">
                            <div className="col-md-6">
                              <p><strong>Center ID:</strong> {centerDetails.center_id}</p>
                              <p><strong>Name:</strong> {centerDetails.name}</p>
                              <p><strong>Address:</strong> {centerDetails.address || 'Not specified'}</p>
                              <p><strong>Contact:</strong> {centerDetails.contact || 'Not specified'}</p>
                              <p><strong>Password Protected:</strong> {centerDetails.password_protected}</p>
                            </div>
                            <div className="col-md-6">
                              <p><strong>Created On:</strong> {formatDate(centerDetails.created_at)}</p>
                              <p><strong>First Attendance:</strong> {formatDate(centerDetails.first_attendance_date)}</p>
                              <p><strong>Last Activity:</strong> {formatDate(centerDetails.last_activity_date)}</p>
                              <p><strong>URL:</strong> <code>/attendance/{centerDetails.center_id}</code></p>
                              <button
                                className="btn btn-warning mt-2"
                                onClick={showResetPasswordModal}
                              >
                                <i className="bi bi-key-fill me-1"></i> Reset Password
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </>
              )}
            </div>
            <div className="modal-footer">
              <button type="button" className="btn btn-secondary" onClick={() => setSelectedCenter(null)}>
                Close
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="container-fluid">
      <div className="row">
        <div className="col-12">
          <div className="d-flex justify-content-between align-items-center mb-4 mt-3">
            <h2>Super Admin Dashboard</h2>
            <button 
              className="btn btn-outline-danger" 
              onClick={handleLogout}
            >
              Logout
            </button>
          </div>
          
          {error && (
            <div className="alert alert-danger">{error}</div>
          )}
          
          <div className="card mb-4">
            <div className="card-header bg-primary text-white d-flex justify-content-between align-items-center">
              <h5 className="mb-0">Meditation Centers</h5>
              <div style={{ width: '300px' }}>
                <div className="input-group">
                  <input
                    type="text"
                    className="form-control"
                    placeholder="Search centers..."
                    value={searchQuery}
                    onChange={handleSearchChange}
                    style={{ outline: 'none', boxShadow: 'none' }}
                  />
                  {searchQuery && (
                    <button 
                      className="btn btn-outline-light" 
                      type="button"
                      onClick={() => setSearchQuery('')}
                    >
                      Clear
                    </button>
                  )}
                </div>
              </div>
            </div>
            <div className="card-body">
              {loading ? (
                <div className="text-center py-5">
                  <div className="spinner-border text-primary" role="status">
                    <span className="visually-hidden">Loading...</span>
                  </div>
                  <p className="mt-3">Loading centers...</p>
                </div>
              ) : centers.length === 0 ? (
                <div className="alert alert-info">No meditation centers found.</div>
              ) : (
                <>
                  {filteredCenters.length < centers.length && (
                    <div className="alert alert-info">
                      Showing {filteredCenters.length} of {centers.length} centers
                    </div>
                  )}
                  
                  {filteredCenters.length === 0 ? (
                    <div className="alert alert-warning">No centers match your search query.</div>
                  ) : (
                    <div className="table-responsive">
                      <table className="table table-striped table-hover">
                        <thead>
                          <tr>
                            <th>#</th>
                            <th>Center ID</th>
                            <th>Name</th>
                            <th>Address</th>
                            <th>URL</th>
                            <th>Last Active</th>
                            <th>Created On</th>
                            <th>Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {filteredCenters.map((center, index) => (
                            <tr key={center.id}>
                              <td>{index + 1}</td>
                              <td>{center.center_id}</td>
                              <td>{center.name}</td>
                              <td>{center.address || '-'}</td>
                              <td><code>/attendance/{center.center_id}</code></td>
                              <td>{center.last_activity_date ? new Date(center.last_activity_date).toLocaleDateString() : 'Never'}</td>
                              <td>{new Date(center.created_at).toLocaleDateString()}</td>
                              <td>
                                <button 
                                  className="btn btn-sm btn-info"
                                  onClick={() => handleCenterClick(center)}
                                >
                                  View Details
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </>
              )}
            </div>
            <div className="card-footer">
              <small className="text-muted">
                Total centers: {centers.length} | 
                Last updated: {new Date().toLocaleString()}
              </small>
            </div>
          </div>
        </div>
      </div>
      
      {/* Center details modal */}
      {renderCenterDetails()}
      
      {/* Reset password modal */}
      {renderResetPasswordModal()}
    </div>
  );
};

export default SuperAdminDashboard; 