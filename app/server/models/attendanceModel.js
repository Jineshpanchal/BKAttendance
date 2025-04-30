const db = require('../config/db');

class Attendance {
  // Mark attendance for a student
  static markAttendance(student_id, center_id, date, callback) {
    // Format: YYYY-MM-DD
    const formattedDate = date || new Date().toISOString().split('T')[0];
    
    // Check if attendance already exists for this student on this date
    const checkSql = `SELECT 1 FROM attendance 
                      WHERE student_id = ? AND date = ?`;
    
    db.get(checkSql, [student_id, formattedDate], (err, exists) => {
      if (err) return callback(err);
      
      if (exists) {
        // Attendance already marked
        return callback(null, { exists: true, message: 'Attendance already marked for this date' });
      }
      
      // Mark attendance
      const sql = `INSERT INTO attendance (student_id, center_id, date) 
                   VALUES (?, ?, ?)`;
      
      db.run(sql, [student_id, center_id, formattedDate], function(err) {
        if (err) return callback(err);
        callback(null, { id: this.lastID, date: formattedDate });
      });
    });
  }
  
  // Get attendance by date for a center
  static getByDate(center_id, date, callback) {
    const sql = `
      WITH total_students AS (
        SELECT COUNT(*) as total_count
        FROM students
        WHERE center_id = ?
      )
      SELECT 
        s.id as student_id, 
        s.roll_number, 
        s.name, 
        s.gender, 
        s.age, 
        s.type,
        a.id,
        a.date,
        CASE WHEN a.id IS NOT NULL THEN 1 ELSE 0 END as is_present,
        (SELECT total_count FROM total_students) as total_students_count,
        (SELECT COUNT(*) FROM attendance WHERE center_id = ? AND date = ?) as present_students_count
      FROM students s
      LEFT JOIN attendance a ON a.student_id = s.id AND a.date = ? AND a.center_id = ?
      WHERE s.center_id = ?
      ORDER BY s.roll_number
    `;
    
    db.all(sql, [center_id, center_id, date, date, center_id, center_id], (err, attendance) => {
      if (err) return callback(err);
      callback(null, attendance);
    });
  }
  
  // Get attendance for a specific student
  static getByStudent(student_id, start_date, end_date, callback) {
    let sql = `
      SELECT a.id, a.date, a.student_id
      FROM attendance a
      WHERE a.student_id = ?
    `;
    
    const params = [student_id];
    
    if (start_date && end_date) {
      sql += ` AND a.date BETWEEN ? AND ?`;
      params.push(start_date, end_date);
    } else if (start_date) {
      sql += ` AND a.date >= ?`;
      params.push(start_date);
    } else if (end_date) {
      sql += ` AND a.date <= ?`;
      params.push(end_date);
    }
    
    sql += ` ORDER BY a.date DESC`;
    
    db.all(sql, params, (err, attendance) => {
      if (err) return callback(err);
      callback(null, attendance);
    });
  }
  
  // Get weekly attendance report for a center
  static getWeeklyReport(center_id, start_date, end_date, callback) {
    const sql = `
      SELECT s.id as student_id, s.roll_number, s.name, s.type,
             COUNT(a.id) as days_present, 
             (julianday(?) - julianday(?)) + 1 as total_days
      FROM students s
      LEFT JOIN attendance a ON s.id = a.student_id AND a.date BETWEEN ? AND ?
      WHERE s.center_id = ?
      GROUP BY s.id
      ORDER BY s.roll_number
    `;
    
    db.all(sql, [end_date, start_date, start_date, end_date, center_id], (err, report) => {
      if (err) return callback(err);
      callback(null, report);
    });
  }
  
  // Get monthly attendance report SUMMARY for a center
  static getMonthlySummaryReport(center_id, year, month, callback) {
    const monthStr = String(month).padStart(2, '0');
    const startDate = `${year}-${monthStr}-01`;
    const lastDay = new Date(year, month, 0).getDate();
    const endDate = `${year}-${monthStr}-${String(lastDay).padStart(2, '0')}`;

    const sql = `
      SELECT 
        s.id as student_id, 
        s.roll_number, 
        s.name,
        s.type,
        COUNT(a.id) as days_present
      FROM students s
      LEFT JOIN attendance a ON s.id = a.student_id AND a.date BETWEEN ? AND ?
      WHERE s.center_id = ?
      GROUP BY s.id, s.roll_number, s.name, s.type
      ORDER BY s.roll_number
    `;

    db.all(sql, [startDate, endDate, center_id], (err, results) => {
      if (err) return callback(err);

      const report = results.map(student => ({
        ...student,
        total_days: lastDay, // Total days in the selected month
        days_absent: lastDay - student.days_present
      }));

      callback(null, {
        summary: report,
        month: parseInt(month, 10),
        year: parseInt(year, 10),
        days_in_month: lastDay
      });
    });
  }

  // Get monthly attendance report GRID for a center (Keep existing method)
  static getMonthlyGridReport(center_id, year, month, callback) {
    const monthStr = String(month).padStart(2, '0');
    const startDate = `${year}-${monthStr}-01`;
    const lastDay = new Date(year, month, 0).getDate();
    const endDate = `${year}-${monthStr}-${String(lastDay).padStart(2, '0')}`;

    const sql = `
      SELECT 
        s.id as student_id, 
        s.roll_number, 
        s.name,
        s.type,
        GROUP_CONCAT(a.date) as present_dates
      FROM students s
      LEFT JOIN attendance a ON s.id = a.student_id AND a.date BETWEEN ? AND ?
      WHERE s.center_id = ?
      GROUP BY s.id, s.roll_number, s.name, s.type
      ORDER BY s.roll_number
    `;

    db.all(sql, [startDate, endDate, center_id], (err, results) => {
      if (err) return callback(err);

      // Process results into the desired grid format
      const studentsData = results.map(student => {
        const attendedDates = student.present_dates ? student.present_dates.split(',') : [];
        const attendanceMap = {};
        
        // Create a map for quick lookup
        attendedDates.forEach(date => {
          attendanceMap[date] = true;
        });

        // Generate daily status for the month
        const dailyStatus = [];
        for (let day = 1; day <= lastDay; day++) {
          const dateStr = `${year}-${monthStr}-${String(day).padStart(2, '0')}`;
          dailyStatus.push({
            date: dateStr,
            present: !!attendanceMap[dateStr]
          });
        }
        
        return {
          student_id: student.student_id,
          roll_number: student.roll_number,
          name: student.name,
          type: student.type,
          attendance: dailyStatus,
          total_present: attendedDates.length
        };
      });

      callback(null, {
        students: studentsData,
        month: parseInt(month, 10),
        year: parseInt(year, 10),
        days_in_month: lastDay
      });
    });
  }
  
  // Delete attendance record
  static delete(id, callback) {
    const sql = `DELETE FROM attendance WHERE id = ?`;
    
    db.run(sql, [id], function(err) {
      if (err) return callback(err);
      callback(null, { changes: this.changes });
    });
  }

  // Delete attendance by student ID and date
  static deleteByStudentAndDate(student_id, date, callback) {
    const sql = `DELETE FROM attendance WHERE student_id = ? AND date = ?`;
    
    db.run(sql, [student_id, date], function(err) {
      if (err) return callback(err);
      callback(null, { changes: this.changes });
    });
  }
}

module.exports = Attendance; 