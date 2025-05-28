const db = require('../config/db');
const bcrypt = require('bcrypt');

class SuperAdmin {
  // Create the default super admin (during setup)
  static createDefault(callback) {
    const username = 'superadmin';
    const password = 'meditation123'; // This should be changed after first login

    // Check if super admin already exists
    this.findByUsername(username, (err, admin) => {
      if (err) return callback(err);
      
      // If admin already exists, don't create another one
      if (admin) return callback(null, { exists: true });
      
      // Create new super admin
      bcrypt.hash(password, 10, (err, hash) => {
        if (err) return callback(err);
        
        const sql = `INSERT INTO super_admins (username, password) VALUES (?, ?)`;
        
        db.run(sql, [username, hash], function(err) {
          if (err) return callback(err);
          callback(null, { id: this.lastID, username });
        });
      });
    });
  }
  
  // Find super admin by username
  static findByUsername(username, callback) {
    const sql = `SELECT * FROM super_admins WHERE username = ?`;
    
    db.get(sql, [username], (err, admin) => {
      if (err) return callback(err);
      callback(null, admin);
    });
  }
  
  // Authenticate super admin
  static authenticate(username, password, callback) {
    console.log('Attempting to authenticate super admin:', username);
    
    this.findByUsername(username, (err, admin) => {
      if (err) {
        console.error('Error finding super admin:', err);
        return callback(err);
      }
      
      if (!admin) {
        console.log('Super admin not found:', username);
        return callback(null, false);
      }
      
      console.log('Super admin found, verifying password');
      
      bcrypt.compare(password, admin.password, (err, match) => {
        if (err) {
          console.error('Error comparing passwords:', err);
          return callback(err);
        }
        
        if (!match) {
          console.log('Password verification failed for super admin:', username);
          return callback(null, false);
        }
        
        // Don't return the password
        const { password, ...adminData } = admin;
        console.log('Super admin authenticated successfully:', username);
        callback(null, adminData);
      });
    });
  }
  
  // Update super admin password
  static updatePassword(id, newPassword, callback) {
    bcrypt.hash(newPassword, 10, (err, hash) => {
      if (err) return callback(err);
      
      const sql = `UPDATE super_admins SET password = ? WHERE id = ?`;
      
      db.run(sql, [hash, id], function(err) {
        if (err) return callback(err);
        callback(null, { changes: this.changes });
      });
    });
  }
  
  // Get all registered centers
  static getAllCenters(callback) {
    const sql = `
      SELECT 
        c.id, c.center_id, c.name, c.address, c.contact, c.created_at,
        (SELECT COUNT(*) FROM students WHERE students.center_id = c.center_id) as student_count,
        (SELECT COUNT(DISTINCT date) FROM attendance WHERE attendance.center_id = c.center_id) as attendance_days,
        (SELECT COUNT(*) FROM attendance WHERE attendance.center_id = c.center_id) as total_attendances,
        (SELECT MAX(date) FROM attendance WHERE attendance.center_id = c.center_id) as last_activity_date,
        CASE
          WHEN c.attendance_password_enabled = 1 THEN 'Yes'
          ELSE 'No'
        END as password_protected
      FROM centers c
      ORDER BY c.created_at DESC
    `;
    
    db.all(sql, [], (err, centers) => {
      if (err) return callback(err);
      callback(null, centers);
    });
  }
  
  // Get detailed center statistics
  static getCenterStats(centerId, callback) {
    const sql = `
      SELECT 
        c.id, c.center_id, c.name, c.address, c.contact, c.created_at,
        (SELECT COUNT(*) FROM students WHERE center_id = c.center_id) as student_count,
        (SELECT COUNT(DISTINCT date) FROM attendance WHERE center_id = c.center_id) as attendance_days,
        (SELECT COUNT(*) FROM attendance WHERE center_id = c.center_id) as total_attendances,
        (SELECT MAX(date) FROM attendance WHERE center_id = c.center_id) as last_activity_date,
        (SELECT MIN(date) FROM attendance WHERE center_id = c.center_id) as first_attendance_date,
        CASE
          WHEN c.attendance_password_enabled = 1 THEN 'Yes'
          ELSE 'No'
        END as password_protected,
        (SELECT COUNT(DISTINCT date) FROM attendance 
         WHERE center_id = c.center_id 
         AND date >= date('now', '-30 day')) as active_days_last_month,
        (SELECT COUNT(*) FROM attendance 
         WHERE center_id = c.center_id 
         AND date >= date('now', '-30 day')) as attendances_last_month
      FROM centers c
      WHERE c.center_id = ?
    `;
    
    db.get(sql, [centerId], (err, stats) => {
      if (err) return callback(err);
      if (!stats) return callback(null, null);
      
      // Get student type distribution
      const typeSql = `
        SELECT type, COUNT(*) as count 
        FROM students 
        WHERE center_id = ? 
        GROUP BY type
      `;
      
      db.all(typeSql, [centerId], (err, typeDistribution) => {
        if (err) return callback(err);
        stats.typeDistribution = typeDistribution;
        
        // Get attendance trend by month
        const trendSql = `
          SELECT 
            strftime('%Y-%m', date) as month,
            COUNT(DISTINCT date) as days_with_attendance,
            COUNT(*) as total_attendances
          FROM attendance
          WHERE center_id = ?
          GROUP BY month
          ORDER BY month DESC
          LIMIT 12
        `;
        
        db.all(trendSql, [centerId], (err, attendanceTrend) => {
          if (err) return callback(err);
          stats.attendanceTrend = attendanceTrend;
          
          // Get daily attendance count for the last 30 days
          const dailyAttendanceSql = `
            SELECT 
              date,
              COUNT(*) as attendance_count
            FROM attendance
            WHERE center_id = ? AND date >= date('now', '-30 day')
            GROUP BY date
            ORDER BY date DESC
          `;
          
          db.all(dailyAttendanceSql, [centerId], (err, dailyAttendance) => {
            if (err) return callback(err);
            stats.dailyAttendance = dailyAttendance;
            
            callback(null, stats);
          });
        });
      });
    });
  }
}

module.exports = SuperAdmin; 