const express = require('express');
const router = express.Router();
const studentController = require('../controllers/studentController');
const { verifyToken } = require('../middleware/authMiddleware');
const multer = require('multer');

// Configure multer for memory storage
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

// Protected routes (require authentication)
router.use(verifyToken);

// Get all students for the center
router.get('/', studentController.getAllStudents);

// Search students
router.get('/search', studentController.searchStudents);

// Get student by roll number
router.get('/roll/:rollNumber', studentController.getStudentByRollNumber);

// Get a single student by ID
router.get('/:id', studentController.getStudentById);

// Create a new student
router.post('/', studentController.createStudent);

// Update an existing student
router.put('/:id', studentController.updateStudent);

// Delete a student
router.delete('/:id', studentController.deleteStudent);

// Import students from Excel
router.post('/import', upload.single('file'), studentController.importStudents);

module.exports = router; 