const db = require('../config/db');
const bcrypt = require('bcrypt');

const username = 'superadmin';
const newPassword = 'meditation123';

console.log(`Resetting password for user '${username}' to '${newPassword}'...`);

// First check if the superadmin exists
db.get('SELECT * FROM super_admins WHERE username = ?', [username], (err, user) => {
  if (err) {
    console.error('Database error:', err.message);
    process.exit(1);
  }
  
  if (!user) {
    console.log('User not found. Creating new super admin account...');
    
    bcrypt.hash(newPassword, 10, (err, hash) => {
      if (err) {
        console.error('Error hashing password:', err.message);
        process.exit(1);
      }
      
      db.run(
        'INSERT INTO super_admins (username, password) VALUES (?, ?)',
        [username, hash],
        function(err) {
          if (err) {
            console.error('Error creating user:', err.message);
            process.exit(1);
          }
          
          console.log('Super admin account created successfully!');
          console.log(`Username: ${username}`);
          console.log(`Password: ${newPassword}`);
          process.exit(0);
        }
      );
    });
    
    return;
  }
  
  // User exists, update password
  console.log('User found. Updating password...');
  
  bcrypt.hash(newPassword, 10, (err, hash) => {
    if (err) {
      console.error('Error hashing password:', err.message);
      process.exit(1);
    }
    
    db.run(
      'UPDATE super_admins SET password = ? WHERE username = ?',
      [hash, username],
      function(err) {
        if (err) {
          console.error('Error updating password:', err.message);
          process.exit(1);
        }
        
        console.log('Password reset successful!');
        console.log(`Username: ${username}`);
        console.log(`Password: ${newPassword}`);
        console.log(`Affected rows: ${this.changes}`);
        process.exit(0);
      }
    );
  });
}); 