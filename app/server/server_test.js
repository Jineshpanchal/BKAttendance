const axios = require('axios');
const bcrypt = require('bcrypt');
const db = require('./config/db');

async function testSuperAdminAPI() {
  console.log('=== Testing SuperAdmin API ===');

  try {
    // Test the ping endpoint
    console.log('\n1. Testing ping endpoint...');
    const pingResponse = await axios.get('http://localhost:3000/api/superadmin/ping');
    console.log('Ping response:', pingResponse.data);

    // Verify superadmin credentials in the database
    console.log('\n2. Checking superadmin in database...');
    db.get('SELECT * FROM super_admins WHERE username = ?', ['superadmin'], async (err, admin) => {
      if (err) {
        console.error('Database error:', err);
        return;
      }

      if (!admin) {
        console.log('Super admin not found in database!');
        return;
      }

      console.log('Super admin found:', {
        id: admin.id,
        username: admin.username,
        passwordHash: admin.password.substring(0, 15) + '... (truncated)',
        created_at: admin.created_at
      });

      // Test login with correct credentials
      try {
        console.log('\n3. Testing login with correct credentials...');
        const loginResponse = await axios.post('http://localhost:3000/api/superadmin/login', {
          username: 'superadmin',
          password: 'meditation123'
        });
        console.log('Login successful!');
        console.log('Token:', loginResponse.data.token ? 'Received' : 'Not received');
        console.log('User data:', loginResponse.data.user);
      } catch (loginErr) {
        console.error('Login error:', loginErr.message);
        if (loginErr.response) {
          console.log('Error status:', loginErr.response.status);
          console.log('Error data:', loginErr.response.data);
        }

        // Verify password hash
        console.log('\nVerifying password hash manually...');
        const testPassword = 'meditation123';
        bcrypt.compare(testPassword, admin.password, (compareErr, isMatch) => {
          if (compareErr) {
            console.error('Error comparing passwords:', compareErr);
          } else {
            console.log(`Password '${testPassword}' matches stored hash: ${isMatch}`);
            
            if (!isMatch) {
              console.log('Incorrect password hash. Creating new superadmin with correct credentials...');
              // Reset the superadmin password
              bcrypt.hash(testPassword, 10, (hashErr, hash) => {
                if (hashErr) {
                  console.error('Error hashing password:', hashErr);
                  return;
                }
                
                db.run('UPDATE super_admins SET password = ? WHERE username = ?', 
                  [hash, 'superadmin'], 
                  function(updateErr) {
                    if (updateErr) {
                      console.error('Error updating password:', updateErr);
                    } else {
                      console.log('Password updated successfully!');
                    }
                  }
                );
              });
            }
          }
        });
      }
    });
  } catch (err) {
    console.error('Test failed:', err.message);
    if (err.response) {
      console.log('Error status:', err.response.status);
      console.log('Error data:', err.response.data);
    }
  }
}

// Run the tests
testSuperAdminAPI(); 