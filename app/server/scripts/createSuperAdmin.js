const db = require('../config/db');
const bcrypt = require('bcrypt');

// Create super_admins table if it doesn't exist
console.log('Creating super_admins table if needed...');
db.run(`CREATE TABLE IF NOT EXISTS super_admins (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  username TEXT NOT NULL UNIQUE,
  password TEXT NOT NULL,
  last_login TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
)`, (err) => {
  if (err) {
    console.error('Error creating super_admins table:', err.message);
    process.exit(1);
  }
  console.log('Super admins table created/verified successfully');
  
  // Check if default super admin already exists
  checkAndCreateSuperAdmin();
});

function checkAndCreateSuperAdmin() {
  const username = 'superadmin';
  const password = 'meditation123';
  
  console.log('Checking if super admin already exists...');
  db.get('SELECT * FROM super_admins WHERE username = ?', [username], (err, admin) => {
    if (err) {
      console.error('Error checking for super admin:', err.message);
      process.exit(1);
    }
    
    if (admin) {
      console.log('Super admin already exists.');
      process.exit(0);
    }
    
    // Create the default super admin
    console.log('Creating default super admin...');
    bcrypt.hash(password, 10, (err, hash) => {
      if (err) {
        console.error('Error hashing password:', err.message);
        process.exit(1);
      }
      
      const sql = 'INSERT INTO super_admins (username, password) VALUES (?, ?)';
      
      db.run(sql, [username, hash], function(err) {
        if (err) {
          console.error('Error creating super admin:', err.message);
          process.exit(1);
        }
        
        console.log('Default super admin created successfully!');
        console.log('Username: superadmin');
        console.log('Password: meditation123');
        console.log('Please log in and change the password immediately for security reasons.');
        process.exit(0);
      });
    });
  });
} 