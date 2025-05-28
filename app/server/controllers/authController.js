const Center = require('../models/centerModel');
const { generateToken } = require('../middleware/authMiddleware');

// Login to a meditation center
exports.login = (req, res) => {
  const { center_id, password } = req.body;
  
  // Validate required fields
  if (!center_id || !password) {
    return res.status(400).json({ message: 'Center ID and password are required' });
  }
  
  // Authenticate center
  Center.authenticate(center_id, password, (err, center) => {
    if (err) {
      return res.status(500).json({ message: 'Authentication error', error: err.message });
    }
    
    if (!center) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }
    
    // Generate JWT token
    const token = generateToken(center);
    
    res.status(200).json({
      message: 'Login successful',
      center: {
        id: center.id,
        center_id: center.center_id,
        name: center.name
      },
      token
    });
  });
};

// Get center profile
exports.getProfile = (req, res) => {
  const { center_id } = req.center;
  
  Center.findByCenterId(center_id, (err, center) => {
    if (err) {
      return res.status(500).json({ message: 'Error retrieving center profile', error: err.message });
    }
    
    if (!center) {
      return res.status(404).json({ message: 'Center not found' });
    }
    
    // Remove password from response
    const { password, ...centerData } = center;
    
    res.status(200).json({
      center: centerData
    });
  });
};

// Update admin's login password
exports.updateLoginPassword = (req, res) => {
  const { center_id } = req.center;
  const { currentPassword, newPassword } = req.body;
  
  // Validate input
  if (!currentPassword || !newPassword) {
    return res.status(400).json({ message: 'Current password and new password are required' });
  }
  
  if (newPassword.length < 6) {
    return res.status(400).json({ message: 'New password must be at least 6 characters long' });
  }
  
  Center.updateLoginPassword(center_id, { currentPassword, newPassword }, (err, result) => {
    if (err) {
      // Check for specific error message
      if (err.message === 'Current password is incorrect') {
        return res.status(401).json({ message: err.message });
      }
      
      console.error('Error updating login password:', err);
      return res.status(500).json({ 
        message: 'Error updating login password', 
        error: err.message 
      });
    }
    
    if (result.changes === 0) {
      return res.status(404).json({ message: 'Center not found' });
    }
    
    res.status(200).json({
      message: 'Login password updated successfully'
    });
  });
};

// Get attendance password settings
exports.getAttendancePasswordSettings = (req, res) => {
  const { center_id } = req.center;
  
  Center.getAttendancePasswordSettings(center_id, (err, settings) => {
    if (err) {
      return res.status(500).json({ 
        message: 'Error retrieving attendance password settings', 
        error: err.message 
      });
    }
    
    if (!settings) {
      return res.status(404).json({ message: 'Settings not found' });
    }
    
    res.status(200).json({ settings });
  });
};

// Update attendance password settings
exports.updateAttendancePasswordSettings = (req, res) => {
  const { center_id } = req.center;
  const { attendance_password, attendance_password_enabled } = req.body;
  
  console.log('Received request to update attendance password settings:', {
    center_id,
    has_password: !!attendance_password,
    password_length: attendance_password ? attendance_password.length : 0,
    enabled: attendance_password_enabled
  });
  
  // Validate required fields when enabled
  if (attendance_password_enabled && !attendance_password) {
    console.log('Validation error: Password required but not provided');
    return res.status(400).json({ 
      message: 'Attendance password is required when password protection is enabled' 
    });
  }
  
  Center.updateAttendancePassword(center_id, { 
    attendance_password, 
    attendance_password_enabled 
  }, (err, result) => {
    if (err) {
      console.error('Error in updateAttendancePassword:', err);
      return res.status(500).json({ 
        message: 'Error updating attendance password settings', 
        error: err.message 
      });
    }
    
    console.log('Password settings updated successfully:', result);
    res.status(200).json({
      message: 'Attendance password settings updated successfully',
      changes: result.changes
    });
  });
}; 