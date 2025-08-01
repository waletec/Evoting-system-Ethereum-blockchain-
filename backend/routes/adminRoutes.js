const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');

// Admin authentication routes
router.post('/login', adminController.login);

// Admin management routes (protected by super admin)
router.post('/create', adminController.createAdmin);
router.get('/all', adminController.getAllAdmins);
router.put('/reset-password', adminController.resetPassword);
router.put('/change-password', adminController.changePassword);
router.put('/update/:adminId', adminController.updateAdmin);
router.put('/deactivate/:adminId', adminController.deactivateAdmin);
router.delete('/delete/:adminId', adminController.deleteAdmin);

// Initialize super admin (one-time setup)
router.post('/initialize-super-admin', adminController.initializeSuperAdmin);

module.exports = router; 