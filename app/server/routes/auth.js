const express = require('express');
const { OAuth2Client } = require('google-auth-library');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const db = require('../config/db');
const { JWT_SECRET, verifyToken } = require('../middleware/authMiddleware');

const router = express.Router();
const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

// Verify Google token and check email domain
router.post('/google-verify', async (req, res) => {
  try {
    const { token } = req.body;
    
    // Verify the Google token
    const ticket = await client.verifyIdToken({
      idToken: token,
      audience: process.env.GOOGLE_CLIENT_ID,
    });
    
    const payload = ticket.getPayload();
    const email = payload.email;
    const name = payload.name;
    
    console.log('Google verification for email:', email);
    
    // Check if email domain is @bkivv.org or @gmail.com (for testing)
    if (!email.endsWith('@bkivv.org') && !email.endsWith('@gmail.com')) {
      return res.status(403).json({
        message: 'Only @bkivv.org and @gmail.com email addresses are allowed to register meditation centers.'
      });
    }
    
    // Check if user already exists using callback-based query
    db.get('SELECT * FROM centers WHERE email = ?', [email], (err, existingCenter) => {
      if (err) {
        console.error('Database error:', err);
        return res.status(500).json({
          message: 'Database error occurred.'
        });
      }
      
      console.log('Database query result:', existingCenter);
      
      if (existingCenter) {
        console.log('Existing center found:', {
          id: existingCenter.id,
          center_id: existingCenter.center_id,
          name: existingCenter.name,
          email: existingCenter.email
        });
        
        // User exists, generate JWT token for login using the correct format
        const jwtToken = jwt.sign(
          { id: existingCenter.id, center_id: existingCenter.center_id },
          JWT_SECRET,
          { expiresIn: '1d' }
        );
        
        return res.json({
          success: true,
          token: jwtToken,
          center: {
            center_id: existingCenter.center_id,
            name: existingCenter.name,
            email: existingCenter.email,
            address: existingCenter.address,
            contact: existingCenter.contact
          },
          isNewUser: false
        });
      } else {
        console.log('No existing center found, treating as new user');
        // New user, return user info for registration
        return res.json({
          success: true,
          userInfo: {
            email: email,
            name: name
          },
          isNewUser: true
        });
      }
    });
    
  } catch (error) {
    console.error('Google verification error:', error);
    res.status(400).json({
      message: 'Invalid Google token or verification failed.'
    });
  }
});

// Complete registration after Google verification
router.post('/complete-registration', async (req, res) => {
  try {
    const { email, center_id, center_name, address, contact } = req.body;
    
    // Verify email domain again
    if (!email.endsWith('@bkivv.org') && !email.endsWith('@gmail.com')) {
      return res.status(403).json({
        message: 'Only @bkivv.org and @gmail.com email addresses are allowed.'
      });
    }
    
    // Check if center_id already exists
    db.get('SELECT * FROM centers WHERE center_id = ?', [center_id], (err, existingCenter) => {
      if (err) {
        console.error('Database error checking center_id:', err);
        return res.status(500).json({
          message: 'Database error occurred.'
        });
      }
      
      if (existingCenter) {
        return res.status(400).json({
          message: 'Center ID already exists. Please choose a different one.'
        });
      }
      
      // Check if email already exists
      db.get('SELECT * FROM centers WHERE email = ?', [email], (err, existingEmail) => {
        if (err) {
          console.error('Database error checking email:', err);
          return res.status(500).json({
            message: 'Database error occurred.'
          });
        }
        
        if (existingEmail) {
          return res.status(400).json({
            message: 'Email already registered.'
          });
        }
        
        // Insert new center
        db.run(`
          INSERT INTO centers (center_id, name, email, address, contact, password, created_at)
          VALUES (?, ?, ?, ?, ?, NULL, datetime('now'))
        `, [center_id, center_name, email, address || '', contact || ''], function(err) {
          if (err) {
            console.error('Database error inserting center:', err);
            return res.status(500).json({
              message: 'Registration failed. Please try again.'
            });
          }
          
          // Generate JWT token using the correct format and secret
          const token = jwt.sign(
            { id: this.lastID, center_id: center_id },
            JWT_SECRET,
            { expiresIn: '1d' }
          );
          
          res.status(201).json({
            message: 'Center registered successfully!',
            token: token,
            center: {
              center_id: center_id,
              name: center_name,
              email: email,
              address: address || '',
              contact: contact || ''
            }
          });
        });
      });
    });
    
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({
      message: 'Registration failed. Please try again.'
    });
  }
});

// Update center profile
router.put('/update-profile', verifyToken, async (req, res) => {
  try {
    const { center_id, name, address, contact } = req.body;
    const currentCenterId = req.center.center_id;
    
    // Validate required fields
    if (!center_id || !name) {
      return res.status(400).json({
        message: 'Center ID and name are required.'
      });
    }
    
    // Validate center_id is numbers only
    if (!/^\d+$/.test(center_id)) {
      return res.status(400).json({
        message: 'Center ID must contain only numbers.'
      });
    }
    
    // If center_id is changing, check if new center_id already exists
    if (center_id !== currentCenterId) {
      db.get('SELECT * FROM centers WHERE center_id = ?', [center_id], (err, existingCenter) => {
        if (err) {
          console.error('Database error checking center_id:', err);
          return res.status(500).json({
            message: 'Database error occurred.'
          });
        }
        
        if (existingCenter) {
          return res.status(400).json({
            message: 'Center ID already exists. Please choose a different one.'
          });
        }
        
        // Update the center
        updateCenter();
      });
    } else {
      // Center ID not changing, just update other fields
      updateCenter();
    }
    
    function updateCenter() {
      // If center_id is changing, we need to update all related records
      if (center_id !== currentCenterId) {
        // Start a transaction to ensure all updates succeed or fail together
        db.serialize(() => {
          db.run('BEGIN TRANSACTION');
          
          // Update the center
          db.run(`
            UPDATE centers 
            SET center_id = ?, name = ?, address = ?, contact = ?
            WHERE center_id = ?
          `, [center_id, name, address || '', contact || '', currentCenterId], function(err) {
            if (err) {
              console.error('Database error updating center:', err);
              db.run('ROLLBACK');
              return res.status(500).json({
                message: 'Failed to update profile. Please try again.'
              });
            }
            
            if (this.changes === 0) {
              db.run('ROLLBACK');
              return res.status(404).json({
                message: 'Center not found.'
              });
            }
            
            // Update all students belonging to this center
            db.run(`
              UPDATE students 
              SET center_id = ? 
              WHERE center_id = ?
            `, [center_id, currentCenterId], function(err) {
              if (err) {
                console.error('Database error updating students:', err);
                db.run('ROLLBACK');
                return res.status(500).json({
                  message: 'Failed to update student records. Please try again.'
                });
              }
              
              console.log(`Updated ${this.changes} student records with new center_id`);
              
              // Update all attendance records for students of this center
              db.run(`
                UPDATE attendance 
                SET center_id = ? 
                WHERE center_id = ?
              `, [center_id, currentCenterId], function(err) {
                if (err) {
                  console.error('Database error updating attendance:', err);
                  db.run('ROLLBACK');
                  return res.status(500).json({
                    message: 'Failed to update attendance records. Please try again.'
                  });
                }
                
                console.log(`Updated ${this.changes} attendance records with new center_id`);
                
                // Commit the transaction
                db.run('COMMIT', function(err) {
                  if (err) {
                    console.error('Database error committing transaction:', err);
                    return res.status(500).json({
                      message: 'Failed to save changes. Please try again.'
                    });
                  }
                  
                  // Generate new JWT token with updated center_id
                  const newToken = jwt.sign(
                    { id: req.center.id, center_id: center_id },
                    JWT_SECRET,
                    { expiresIn: '1d' }
                  );
                  
                  res.json({
                    message: 'Profile updated successfully!',
                    token: newToken,
                    center: {
                      center_id: center_id,
                      name: name,
                      address: address || '',
                      contact: contact || ''
                    }
                  });
                });
              });
            });
          });
        });
      } else {
        // Center ID not changing, just update center fields
        db.run(`
          UPDATE centers 
          SET name = ?, address = ?, contact = ?
          WHERE center_id = ?
        `, [name, address || '', contact || '', currentCenterId], function(err) {
          if (err) {
            console.error('Database error updating center:', err);
            return res.status(500).json({
              message: 'Failed to update profile. Please try again.'
            });
          }
          
          if (this.changes === 0) {
            return res.status(404).json({
              message: 'Center not found.'
            });
          }
          
          // Generate new JWT token (center_id unchanged)
          const newToken = jwt.sign(
            { id: req.center.id, center_id: center_id },
            JWT_SECRET,
            { expiresIn: '1d' }
          );
          
          res.json({
            message: 'Profile updated successfully!',
            token: newToken,
            center: {
              center_id: center_id,
              name: name,
              address: address || '',
              contact: contact || ''
            }
          });
        });
      }
    }
    
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({
      message: 'Failed to update profile. Please try again.'
    });
  }
});

module.exports = router; 