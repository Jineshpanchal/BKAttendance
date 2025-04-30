const db = require('../config/db');

class Student {
  // Create a new student
  static create(studentData, callback) {
    const { name, gender, age, center_id, roll_number, type } = studentData;
    
    // If roll_number is not provided, generate the next available one
    if (!roll_number) {
      this.getNextRollNumber(center_id, (err, nextRollNumber) => {
        if (err) return callback(err);
        
        const sql = `INSERT INTO students (name, gender, age, center_id, roll_number, type) 
                     VALUES (?, ?, ?, ?, ?, ?)`;
        
        db.run(sql, [name, gender, age, center_id, nextRollNumber, type], function(err) {
          if (err) return callback(err);
          callback(null, { id: this.lastID, roll_number: nextRollNumber });
        });
      });
    } else {
      // Use the provided roll_number
      const sql = `INSERT INTO students (name, gender, age, center_id, roll_number, type) 
                   VALUES (?, ?, ?, ?, ?, ?)`;
      
      db.run(sql, [name, gender, age, center_id, roll_number, type], function(err) {
        if (err) return callback(err);
        callback(null, { id: this.lastID, roll_number });
      });
    }
  }
  
  // Get next available roll number for a center
  static getNextRollNumber(center_id, callback) {
    const sql = `SELECT MAX(CAST(roll_number AS INTEGER)) as max_roll FROM students WHERE center_id = ?`;
    
    db.get(sql, [center_id], (err, result) => {
      if (err) return callback(err);
      
      let nextRoll = 1;
      if (result && result.max_roll) {
        nextRoll = result.max_roll + 1;
      }
      
      // Format as 3-digit number (001, 002, etc.)
      const formattedRoll = String(nextRoll).padStart(3, '0');
      callback(null, formattedRoll);
    });
  }
  
  // Get all students for a center
  static getAllByCenter(center_id, callback) {
    const sql = `SELECT * FROM students WHERE center_id = ? ORDER BY roll_number`;
    
    db.all(sql, [center_id], (err, students) => {
      if (err) return callback(err);
      callback(null, students);
    });
  }
  
  // Find student by roll number and center
  static findByRollNumber(roll_number, center_id, callback) {
    const sql = `SELECT * FROM students WHERE roll_number = ? AND center_id = ?`;
    
    db.get(sql, [roll_number, center_id], (err, student) => {
      if (err) return callback(err);
      callback(null, student);
    });
  }
  
  // Find student by ID
  static findById(id, callback) {
    const sql = `SELECT * FROM students WHERE id = ?`;
    
    db.get(sql, [id], (err, student) => {
      if (err) return callback(err);
      callback(null, student);
    });
  }
  
  // Update student details
  static update(id, studentData, callback) {
    const { name, gender, age, roll_number, type } = studentData;
    
    const sql = `UPDATE students SET name = ?, gender = ?, age = ?, roll_number = ?, type = ? 
                 WHERE id = ?`;
    
    db.run(sql, [name, gender, age, roll_number, type, id], function(err) {
      if (err) return callback(err);
      callback(null, { changes: this.changes });
    });
  }
  
  // Delete a student
  static delete(id, callback) {
    // First delete related attendance records
    db.run(`DELETE FROM attendance WHERE student_id = ?`, [id], (err) => {
      if (err) return callback(err);
      
      // Then delete the student
      db.run(`DELETE FROM students WHERE id = ?`, [id], function(err) {
        if (err) return callback(err);
        callback(null, { changes: this.changes });
      });
    });
  }
  
  // Search students by roll number or name
  static searchStudents(searchTerm, center_id, callback) {
    const sql = `
      SELECT * FROM students 
      WHERE center_id = ? 
      AND (
        roll_number LIKE ? 
        OR LOWER(name) LIKE LOWER(?)
      )
      ORDER BY roll_number
    `;
    
    const searchPattern = `%${searchTerm}%`;
    
    db.all(sql, [center_id, searchPattern, searchPattern], (err, students) => {
      if (err) return callback(err);
      callback(null, students);
    });
  }
}

module.exports = Student; 