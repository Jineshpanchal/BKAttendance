const db = require('../config/db');

console.log('Running migration to add timestamp column to attendance table...');

// Add timestamp column to attendance table if it doesn't exist
db.all(`PRAGMA table_info(attendance)`, (err, columns) => {
  if (err) {
    console.error('Error checking attendance table columns:', err.message);
    process.exit(1);
  }
  
  // Check if timestamp column exists
  const hasTimestampColumn = columns.some(col => col.name === 'timestamp');
  
  if (hasTimestampColumn) {
    console.log('Timestamp column already exists in attendance table');
    db.close();
    process.exit(0);
  } else {
    console.log('Adding timestamp column to attendance table');
    db.run(`ALTER TABLE attendance ADD COLUMN timestamp TIMESTAMP`, err => {
      if (err) {
        console.error('Error adding timestamp column:', err.message);
        process.exit(1);
      } else {
        console.log('Added timestamp column successfully');
        db.close();
        process.exit(0);
      }
    });
  }
}); 