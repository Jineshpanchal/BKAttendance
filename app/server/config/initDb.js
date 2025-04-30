const db = require('./db');

// Initialize the database with required tables
function initializeDatabase() {
  console.log('Initializing database...');

  // Create Centers table
  db.run(`CREATE TABLE IF NOT EXISTS centers (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    center_id TEXT NOT NULL UNIQUE,
    name TEXT NOT NULL,
    password TEXT NOT NULL,
    address TEXT,
    contact TEXT,
    attendance_password TEXT,
    attendance_password_enabled INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  )`, (err) => {
    if (err) {
      console.error('Error creating centers table:', err.message);
    } else {
      console.log('Centers table created successfully.');
      
      // Check if columns exist and add them if they don't
      checkAndAddColumns();
    }
  });

  // Create Super Admin table
  db.run(`CREATE TABLE IF NOT EXISTS super_admins (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT NOT NULL UNIQUE,
    password TEXT NOT NULL,
    last_login TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  )`, (err) => {
    if (err) {
      console.error('Error creating super_admins table:', err.message);
    } else {
      console.log('Super Admins table created successfully.');
      
      // Create default super admin account
      const SuperAdmin = require('../models/superAdminModel');
      SuperAdmin.createDefault((err, result) => {
        if (err) {
          console.error('Error creating default super admin:', err.message);
        } else if (result.exists) {
          console.log('Default super admin already exists.');
        } else {
          console.log('Default super admin created successfully.');
        }
      });
    }
  });

  // Create Students table
  db.run(`CREATE TABLE IF NOT EXISTS students (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    roll_number TEXT NOT NULL,
    name TEXT NOT NULL,
    gender TEXT,
    age INTEGER,
    type TEXT CHECK(type IN ('Kumar', 'Kumari', 'Adhar Kumar', 'Adhar Kumari', 'Mata')),
    center_id TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (center_id) REFERENCES centers (center_id),
    UNIQUE (roll_number, center_id)
  )`, (err) => {
    if (err) {
      console.error('Error creating students table:', err.message);
    } else {
      console.log('Students table created successfully.');
    }
  });

  // Create Attendance table
  db.run(`CREATE TABLE IF NOT EXISTS attendance (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    student_id INTEGER NOT NULL,
    center_id TEXT NOT NULL,
    date TEXT NOT NULL,
    timestamp TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (student_id) REFERENCES students (id),
    FOREIGN KEY (center_id) REFERENCES centers (center_id),
    UNIQUE (student_id, date)
  )`, (err) => {
    if (err) {
      console.error('Error creating attendance table:', err.message);
    } else {
      console.log('Attendance table created successfully.');
    }
  });

  // Create indexes for better performance
  db.run(`CREATE INDEX IF NOT EXISTS idx_students_center_id ON students (center_id)`, (err) => {
    if (err) console.error('Error creating student index:', err.message);
  });

  db.run(`CREATE INDEX IF NOT EXISTS idx_attendance_center_id ON attendance (center_id)`, (err) => {
    if (err) console.error('Error creating attendance center index:', err.message);
  });

  db.run(`CREATE INDEX IF NOT EXISTS idx_attendance_date ON attendance (date)`, (err) => {
    if (err) console.error('Error creating attendance date index:', err.message);
  });

  console.log('Database initialization completed.');
}

// Helper function to check if columns exist and add them if they don't
function checkAndAddColumns() {
  // Get table info to check columns
  db.all(`PRAGMA table_info(centers)`, (err, columns) => {
    if (err) {
      console.error('Error checking table columns:', err.message);
      return;
    }
    
    // Check if attendance_password column exists
    const hasPasswordColumn = columns.some(col => col.name === 'attendance_password');
    const hasEnabledColumn = columns.some(col => col.name === 'attendance_password_enabled');
    
    // Add missing columns if needed
    if (!hasPasswordColumn) {
      console.log('Adding attendance_password column to centers table');
      db.run(`ALTER TABLE centers ADD COLUMN attendance_password TEXT`, err => {
        if (err) console.error('Error adding attendance_password column:', err.message);
        else console.log('Added attendance_password column successfully');
      });
    }
    
    if (!hasEnabledColumn) {
      console.log('Adding attendance_password_enabled column to centers table');
      db.run(`ALTER TABLE centers ADD COLUMN attendance_password_enabled INTEGER DEFAULT 0`, err => {
        if (err) console.error('Error adding attendance_password_enabled column:', err.message);
        else console.log('Added attendance_password_enabled column successfully');
      });
    }
  });
  
  // Check if timestamp column exists in attendance table
  db.all(`PRAGMA table_info(attendance)`, (err, columns) => {
    if (err) {
      console.error('Error checking attendance table columns:', err.message);
      return;
    }
    
    // Check if timestamp column exists
    const hasTimestampColumn = columns.some(col => col.name === 'timestamp');
    
    // Add timestamp column if it doesn't exist
    if (!hasTimestampColumn) {
      console.log('Adding timestamp column to attendance table');
      db.run(`ALTER TABLE attendance ADD COLUMN timestamp TIMESTAMP`, err => {
        if (err) console.error('Error adding timestamp column:', err.message);
        else console.log('Added timestamp column successfully');
      });
    }
  });
}

// Run initialization
initializeDatabase();

// Close the database connection after initialization
setTimeout(() => {
  db.close((err) => {
    if (err) {
      console.error('Error closing database:', err.message);
    } else {
      console.log('Database connection closed.');
    }
    process.exit(0);
  });
}, 2000); // Extended timeout to ensure column changes complete 