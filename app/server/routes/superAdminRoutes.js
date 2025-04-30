const express = require('express');
const router = express.Router();
const superAdminController = require('../controllers/superAdminController');
const { verifySuperAdmin } = require('../middleware/superAdminMiddleware');

// Simple test route for API check
router.get('/ping', (req, res) => {
  console.log('Ping received for superadmin API');
  res.status(200).json({ status: 'ok', message: 'SuperAdmin API is working' });
});

// Super admin login
router.post('/login', superAdminController.login);

// Protected super admin routes (require authentication)
router.post('/change-password', verifySuperAdmin, superAdminController.changePassword);
router.get('/centers', verifySuperAdmin, superAdminController.getAllCenters);
router.get('/centers/:centerId', verifySuperAdmin, superAdminController.getCenterStats);
router.post('/centers/:centerId/reset-password', verifySuperAdmin, superAdminController.resetCenterPassword);

module.exports = router; 