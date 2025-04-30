const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { verifyToken } = require('../middleware/authMiddleware');

// Register a new meditation center
router.post('/register', authController.register);

// Login to a meditation center
router.post('/login', authController.login);

// Get center profile (protected route)
router.get('/profile', verifyToken, authController.getProfile);

// Update login password (protected route)
router.post('/update-password', verifyToken, authController.updateLoginPassword);

// Attendance password settings (protected routes)
router.get('/attendance-password', verifyToken, authController.getAttendancePasswordSettings);
router.post('/attendance-password', verifyToken, authController.updateAttendancePasswordSettings);

module.exports = router; 