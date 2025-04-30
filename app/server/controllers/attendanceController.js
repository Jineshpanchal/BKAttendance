const Attendance = require('../models/attendanceModel');
const Student = require('../models/studentModel');
const Center = require('../models/centerModel');
const db = require('../config/db');

// Mark attendance for a student by roll number (public endpoint)
exports.markAttendanceByRoll = (req, res) => {
  const { center_id } = req.params;
  const { roll_number, attendance_password } = req.body;
  
  // Validate required fields
  if (!roll_number) {
    return res.status(400).json({ message: 'Roll number is required' });
  }
  
  // Special case: If roll_number is '000', it's just a password verification
  // We'll check password validity but won't try to mark attendance
  const isVerificationOnly = roll_number === '000';
  
  // Check if password protection is enabled
  Center.getAttendancePasswordSettings(center_id, (err, settings) => {
    if (err) {
      return res.status(500).json({ message: 'Error checking center settings', error: err.message });
    }
    
    // If settings don't exist (center not found)
    if (!settings) {
      return res.status(404).json({ message: 'Center not found' });
    }
    
    // If password protection is enabled, validate the password
    if (settings && settings.attendance_password_enabled) {
      if (!attendance_password) {
        return res.status(401).json({ 
          message: 'Attendance password is required',
          password_protected: true 
        });
      }
      
      if (attendance_password !== settings.attendance_password) {
        return res.status(401).json({ 
          message: 'Invalid attendance password',
          password_protected: true 
        });
      }
      
      // If this is just a verification request and password is valid, return success
      if (isVerificationOnly) {
        return res.status(200).json({
          message: 'Password verified successfully',
          password_valid: true
        });
      }
    }
    
    // Find student by roll number
    Student.findByRollNumber(roll_number, center_id, (err, student) => {
      if (err) {
        return res.status(500).json({ message: 'Error finding student', error: err.message });
      }
      
      if (!student) {
        return res.status(404).json({ 
          message: 'Student does not exist in database. Please check with Center Sister.' 
        });
      }
      
      // Mark attendance for today
      Attendance.markAttendance(student.id, center_id, null, (err, result) => {
        if (err) {
          return res.status(500).json({ message: 'Error marking attendance', error: err.message });
        }
        
        if (result.exists) {
          return res.status(200).json({ 
            message: `Attendance already marked for ${student.name}`,
            student_name: student.name,
            already_marked: true
          });
        }
        
        res.status(201).json({ 
          message: `Attendance marked for ${student.name}`,
          student_name: student.name,
          date: result.date,
          already_marked: false
        });
      });
    });
  });
};

// Check if password protection is enabled (public endpoint)
exports.checkPasswordProtection = (req, res) => {
  const { center_id } = req.params;
  
  // First, get center information
  db.get('SELECT name FROM centers WHERE center_id = ?', [center_id], (err, center) => {
    if (err) {
      return res.status(500).json({ message: 'Error checking center', error: err.message });
    }
    
    if (!center) {
      return res.status(404).json({ message: 'Center not found' });
    }
    
    // Then get password settings
    Center.getAttendancePasswordSettings(center_id, (err, settings) => {
      if (err) {
        return res.status(500).json({ message: 'Error checking center settings', error: err.message });
      }
      
      if (!settings) {
        return res.status(404).json({ message: 'Settings not found' });
      }
      
      res.status(200).json({ 
        password_protected: settings.attendance_password_enabled,
        center_id: center_id,
        center_name: center.name,
        center_exists: true
      });
    });
  });
};

// Mark attendance for a student by admin
exports.markAttendanceByAdmin = (req, res) => {
  const { student_id } = req.params;
  const { date } = req.body;
  const { center_id } = req.center;
  
  // Validate date format (YYYY-MM-DD)
  if (date && !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    return res.status(400).json({ message: 'Invalid date format. Use YYYY-MM-DD' });
  }
  
  // Find student to verify ownership
  Student.findById(student_id, (err, student) => {
    if (err) {
      return res.status(500).json({ message: 'Error finding student', error: err.message });
    }
    
    if (!student) {
      return res.status(404).json({ message: 'Student not found' });
    }
    
    // Verify student belongs to this center
    if (student.center_id !== center_id) {
      return res.status(403).json({ message: 'Access denied' });
    }
    
    // Mark attendance
    Attendance.markAttendance(student_id, center_id, date, (err, result) => {
      if (err) {
        return res.status(500).json({ message: 'Error marking attendance', error: err.message });
      }
      
      if (result.exists) {
        return res.status(200).json({ message: 'Attendance already marked for this date' });
      }
      
      res.status(201).json({ 
        message: 'Attendance marked successfully',
        date: result.date
      });
    });
  });
};

// Get attendance by date
exports.getAttendanceByDate = (req, res) => {
  const { date } = req.params;
  const { center_id } = req.center;
  
  // Validate date format (YYYY-MM-DD)
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    return res.status(400).json({ message: 'Invalid date format. Use YYYY-MM-DD' });
  }
  
  Attendance.getByDate(center_id, date, (err, attendance) => {
    if (err) {
      return res.status(500).json({ message: 'Error retrieving attendance', error: err.message });
    }
    
    res.status(200).json({ date, attendance });
  });
};

// Get attendance for a specific student
exports.getStudentAttendance = (req, res) => {
  const { student_id } = req.params;
  const { start_date, end_date } = req.query;
  const { center_id } = req.center;
  
  // Validate date formats if provided
  if (start_date && !/^\d{4}-\d{2}-\d{2}$/.test(start_date)) {
    return res.status(400).json({ message: 'Invalid start date format. Use YYYY-MM-DD' });
  }
  
  if (end_date && !/^\d{4}-\d{2}-\d{2}$/.test(end_date)) {
    return res.status(400).json({ message: 'Invalid end date format. Use YYYY-MM-DD' });
  }
  
  // Find student to verify ownership
  Student.findById(student_id, (err, student) => {
    if (err) {
      return res.status(500).json({ message: 'Error finding student', error: err.message });
    }
    
    if (!student) {
      return res.status(404).json({ message: 'Student not found' });
    }
    
    // Verify student belongs to this center
    if (student.center_id !== center_id) {
      return res.status(403).json({ message: 'Access denied' });
    }
    
    // Get attendance
    Attendance.getByStudent(student_id, start_date, end_date, (err, attendance) => {
      if (err) {
        return res.status(500).json({ message: 'Error retrieving attendance', error: err.message });
      }
      
      res.status(200).json({ 
        student: {
          id: student.id,
          name: student.name,
          roll_number: student.roll_number
        },
        attendance,
        total_days: attendance.length
      });
    });
  });
};

// Get weekly attendance report
exports.getWeeklyReport = (req, res) => {
  const { start_date, end_date } = req.query;
  const { center_id } = req.center;
  
  // Validate required fields
  if (!start_date || !end_date) {
    return res.status(400).json({ message: 'Start date and end date are required' });
  }
  
  // Validate date formats
  if (!/^\d{4}-\d{2}-\d{2}$/.test(start_date) || !/^\d{4}-\d{2}-\d{2}$/.test(end_date)) {
    return res.status(400).json({ message: 'Invalid date format. Use YYYY-MM-DD' });
  }
  
  Attendance.getWeeklyReport(center_id, start_date, end_date, (err, report) => {
    if (err) {
      return res.status(500).json({ message: 'Error generating report', error: err.message });
    }
    
    res.status(200).json({ 
      start_date,
      end_date,
      report
    });
  });
};

// Get monthly attendance report GRID
exports.getMonthlyGridReport = (req, res) => {
  const { year, month } = req.params;
  const { center_id } = req.center;
  
  if (!/^\d{4}$/.test(year) || !/^\d{1,2}$/.test(month) || month < 1 || month > 12) {
    return res.status(400).json({ message: 'Invalid year or month format' });
  }
  
  Attendance.getMonthlyGridReport(center_id, year, month, (err, reportData) => {
    if (err) {
      console.error("Error generating monthly grid report:", err);
      return res.status(500).json({ message: 'Error generating monthly grid report', error: err.message });
    }
    res.status(200).json(reportData);
  });
};

// Get monthly attendance report SUMMARY
exports.getMonthlySummaryReport = (req, res) => {
  const { year, month } = req.params;
  const { center_id } = req.center;

  if (!/^\d{4}$/.test(year) || !/^\d{1,2}$/.test(month) || month < 1 || month > 12) {
    return res.status(400).json({ message: 'Invalid year or month format' });
  }

  Attendance.getMonthlySummaryReport(center_id, year, month, (err, reportData) => {
    if (err) {
      console.error("Error generating monthly summary report:", err);
      return res.status(500).json({ message: 'Error generating monthly summary report', error: err.message });
    }
    res.status(200).json(reportData);
  });
};

// Delete attendance record
exports.deleteAttendance = (req, res) => {
  const { id } = req.params;
  const { center_id } = req.center;
  
  // First, get the attendance record to check if it belongs to this center
  db.get(
    'SELECT a.* FROM attendance a WHERE a.id = ? AND a.center_id = ?',
    [id, center_id],
    (err, attendance) => {
      if (err) {
        return res.status(500).json({ message: 'Error retrieving attendance', error: err.message });
      }
      
      if (!attendance) {
        return res.status(404).json({ message: 'Attendance record not found or access denied' });
      }
      
      // Delete attendance
      Attendance.delete(id, (err, result) => {
        if (err) {
          return res.status(500).json({ message: 'Error deleting attendance', error: err.message });
        }
        
        res.status(200).json({
          message: 'Attendance record deleted successfully',
          changes: result.changes
        });
      });
    }
  );
};

// Delete attendance by student ID and date
exports.deleteAttendanceByStudentAndDate = (req, res) => {
  const { student_id } = req.params;
  const { date } = req.body;
  const { center_id } = req.center;
  
  // Validate date format (YYYY-MM-DD)
  if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    return res.status(400).json({ message: 'Invalid or missing date format. Use YYYY-MM-DD' });
  }
  
  // Find student to verify ownership
  Student.findById(student_id, (err, student) => {
    if (err) {
      return res.status(500).json({ message: 'Error finding student', error: err.message });
    }
    
    if (!student) {
      return res.status(404).json({ message: 'Student not found' });
    }
    
    // Verify student belongs to this center
    if (student.center_id !== center_id) {
      return res.status(403).json({ message: 'Access denied' });
    }
    
    // Delete attendance
    Attendance.deleteByStudentAndDate(student_id, date, (err, result) => {
      if (err) {
        return res.status(500).json({ message: 'Error removing attendance', error: err.message });
      }
      
      if (result.changes === 0) {
        return res.status(404).json({ message: 'No attendance record found for this date' });
      }
      
      res.status(200).json({
        message: 'Attendance removed successfully',
        date: date,
        changes: result.changes
      });
    });
  });
}; 