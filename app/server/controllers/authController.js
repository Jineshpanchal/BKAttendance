const Center = require('../models/centerModel');
const { generateToken } = require('../middleware/authMiddleware');

// Register a new meditation center
exports.register = (req, res) => {
  const { center_id, name, password, address, contact } = req.body;
  
  // Validate required fields
  if (!center_id || !name || !password) {
    return res.status(400).json({ message: 'Center ID, name, and password are required' });
  }
  
  // Check if center_id contains only allowed characters
  if (!/^[a-zA-Z0-9-_]+$/.test(center_id)) {
    return res.status(400).json({ 
      message: 'Center ID can only contain letters, numbers, hyphens, and underscores'
    });
  }
  
  // Check if center already exists
  Center.exists(center_id, (err, exists) => {
    if (err) {
      return res.status(500).json({ message: 'Database error', error: err.message });
    }
    
    if (exists) {
      return res.status(409).json({ message: 'Center ID is already taken' });
    }
    
    // Create the new center
    Center.create({ center_id, name, password, address, contact }, (err, result) => {
      if (err) {
        return res.status(500).json({ message: 'Error creating center', error: err.message });
      }
      
      res.status(201).json({ 
        message: 'Center registered successfully',
        center_id: result.center_id
      });
    });
  });
};

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