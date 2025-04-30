const express = require('express');
const router = express.Router();
const attendanceController = require('../controllers/attendanceController');
const { verifyToken } = require('../middleware/authMiddleware');

// Public routes for marking attendance
router.post('/mark/:center_id', attendanceController.markAttendanceByRoll);
router.get('/password-check/:center_id', attendanceController.checkPasswordProtection);

// Protected routes
router.use(verifyToken);

// Mark attendance by admin
router.post('/admin/:student_id', attendanceController.markAttendanceByAdmin);

// Get attendance by date
router.get('/date/:date', attendanceController.getAttendanceByDate);

// Get attendance for a specific student
router.get('/student/:student_id', attendanceController.getStudentAttendance);

// Get weekly attendance report
router.get('/report/weekly', attendanceController.getWeeklyReport);

// Get monthly attendance grid report
router.get('/report/monthly-grid/:year/:month', attendanceController.getMonthlyGridReport);

// Get monthly attendance summary report
router.get('/report/monthly-summary/:year/:month', attendanceController.getMonthlySummaryReport);

// Delete attendance record
router.delete('/:id', attendanceController.deleteAttendance);

// Delete attendance by student ID and date
router.delete('/student/:student_id', attendanceController.deleteAttendanceByStudentAndDate);

module.exports = router; 