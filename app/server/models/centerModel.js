const db = require('../config/db');
const bcrypt = require('bcrypt');

class Center {
  // Create a new center
  static create(centerData, callback) {
    const { center_id, name, password, address, contact } = centerData;
    
    // Hash the password
    bcrypt.hash(password, 10, (err, hash) => {
      if (err) return callback(err);
      
      const sql = `INSERT INTO centers (center_id, name, password, address, contact) 
                   VALUES (?, ?, ?, ?, ?)`;
      
      db.run(sql, [center_id, name, hash, address, contact], function(err) {
        if (err) return callback(err);
        callback(null, { id: this.lastID, center_id });
      });
    });
  }
  
  // Find center by center_id
  static findByCenterId(center_id, callback) {
    const sql = `SELECT * FROM centers WHERE center_id = ?`;
    
    db.get(sql, [center_id], (err, center) => {
      if (err) return callback(err);
      callback(null, center);
    });
  }
  
  // Check if center exists
  static exists(center_id, callback) {
    const sql = `SELECT 1 FROM centers WHERE center_id = ?`;
    
    db.get(sql, [center_id], (err, result) => {
      if (err) return callback(err);
      callback(null, !!result);
    });
  }
  
  // Authenticate center
  static authenticate(center_id, password, callback) {
    this.findByCenterId(center_id, (err, center) => {
      if (err) return callback(err);
      if (!center) return callback(null, false);
      
      bcrypt.compare(password, center.password, (err, match) => {
        if (err) return callback(err);
        if (!match) return callback(null, false);
        
        // Remove password from result
        const { password, ...centerWithoutPassword } = center;
        callback(null, centerWithoutPassword);
      });
    });
  }
  
  // Update center details
  static update(center_id, centerData, callback) {
    const { name, address, contact } = centerData;
    
    const sql = `UPDATE centers SET name = ?, address = ?, contact = ? 
                 WHERE center_id = ?`;
    
    db.run(sql, [name, address, contact, center_id], function(err) {
      if (err) return callback(err);
      callback(null, { changes: this.changes });
    });
  }
  
  // Update attendance password settings
  static updateAttendancePassword(center_id, settings, callback) {
    const { attendance_password, attendance_password_enabled } = settings;
    
    // Ensure we have valid values
    const passwordValue = attendance_password || '';
    const isEnabled = attendance_password_enabled === true ? 1 : 0;
    
    console.log('Updating attendance password settings:', {
      center_id,
      password_length: passwordValue.length,
      enabled: isEnabled
    });
    
    const sql = `UPDATE centers SET 
                 attendance_password = ?, 
                 attendance_password_enabled = ? 
                 WHERE center_id = ?`;
    
    db.run(sql, [
      passwordValue,
      isEnabled,
      center_id
    ], function(err) {
      if (err) {
        console.error('Database error updating attendance password:', err);
        return callback(err);
      }
      
      console.log('Update result:', { changes: this.changes });
      callback(null, { changes: this.changes });
    });
  }
  
  // Get attendance password settings
  static getAttendancePasswordSettings(center_id, callback) {
    const sql = `SELECT attendance_password, attendance_password_enabled 
                 FROM centers WHERE center_id = ?`;
    
    db.get(sql, [center_id], (err, settings) => {
      if (err) return callback(err);
      
      if (settings) {
        // Convert to boolean
        settings.attendance_password_enabled = !!settings.attendance_password_enabled;
      }
      
      callback(null, settings);
    });
  }
}

module.exports = Center; 