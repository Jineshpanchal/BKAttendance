const SuperAdmin = require('../models/superAdminModel');
const jwt = require('jsonwebtoken');
const { JWT_SECRET } = require('../middleware/authMiddleware');
const bcrypt = require('bcrypt');
const db = require('../config/db');

// Login for super admin
exports.login = (req, res) => {
  const { username, password } = req.body;
  
  // Validate required fields
  if (!username || !password) {
    return res.status(400).json({ message: 'Username and password are required' });
  }
  
  // Authenticate super admin
  SuperAdmin.authenticate(username, password, (err, admin) => {
    if (err) {
      console.error('Authentication error:', err);
      return res.status(500).json({ message: 'Authentication error', error: err.message });
    }
    
    if (!admin) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }
    
    // Generate JWT token
    const token = jwt.sign(
      { id: admin.id, username: admin.username, role: 'superadmin' },
      JWT_SECRET,
      { expiresIn: '1d' }
    );
    
    // Update last login timestamp
    const now = new Date().toISOString();
    db.run('UPDATE super_admins SET last_login = ? WHERE id = ?', [now, admin.id], (err) => {
      if (err) {
        console.error('Error updating last login:', err);
        // Continue with the response even if this fails
      }
      
      console.log('Login successful for super admin:', admin.username);
      
      res.status(200).json({
        message: 'Login successful',
        user: {
          id: admin.id,
          username: admin.username,
          role: 'superadmin'
        },
        token
      });
    });
  });
};

// Change super admin password
exports.changePassword = (req, res) => {
  const { id } = req.admin;
  const { currentPassword, newPassword } = req.body;
  
  // Validate required fields
  if (!currentPassword || !newPassword) {
    return res.status(400).json({ message: 'Both current and new passwords are required' });
  }
  
  // First authenticate with current password
  SuperAdmin.findByUsername('superadmin', (err, admin) => {
    if (err) {
      return res.status(500).json({ message: 'Database error', error: err.message });
    }
    
    if (!admin) {
      return res.status(404).json({ message: 'Admin not found' });
    }
    
    // Verify current password
    bcrypt.compare(currentPassword, admin.password, (err, match) => {
      if (err) {
        return res.status(500).json({ message: 'Authentication error', error: err.message });
      }
      
      if (!match) {
        return res.status(401).json({ message: 'Current password is incorrect' });
      }
      
      // Update to new password
      SuperAdmin.updatePassword(id, newPassword, (err, result) => {
        if (err) {
          return res.status(500).json({ message: 'Error updating password', error: err.message });
        }
        
        res.status(200).json({
          message: 'Password updated successfully'
        });
      });
    });
  });
};

// Get all registered centers
exports.getAllCenters = (req, res) => {
  SuperAdmin.getAllCenters((err, centers) => {
    if (err) {
      return res.status(500).json({ message: 'Error retrieving centers', error: err.message });
    }
    
    res.status(200).json({
      centers
    });
  });
};

// Get detailed statistics for a specific center
exports.getCenterStats = (req, res) => {
  const { centerId } = req.params;
  
  SuperAdmin.getCenterStats(centerId, (err, stats) => {
    if (err) {
      return res.status(500).json({ message: 'Error retrieving center statistics', error: err.message });
    }
    
    if (!stats) {
      return res.status(404).json({ message: 'Center not found' });
    }
    
    res.status(200).json({
      stats
    });
  });
};

// Reset center password
exports.resetCenterPassword = (req, res) => {
  const { centerId } = req.params;
  const { newPassword } = req.body;
  
  // Validate new password
  if (!newPassword || newPassword.trim().length < 6) {
    return res.status(400).json({ 
      message: 'New password is required and must be at least 6 characters long' 
    });
  }
  
  SuperAdmin.resetCenterPassword(centerId, newPassword, (err, result) => {
    if (err) {
      return res.status(500).json({ message: 'Error resetting center password', error: err.message });
    }
    
    if (result.changes === 0) {
      return res.status(404).json({ message: 'Center not found' });
    }
    
    res.status(200).json({
      message: 'Center password has been reset successfully'
    });
  });
}; 