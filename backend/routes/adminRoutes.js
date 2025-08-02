const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const { requireAuth, requireSuperAdmin } = require('../middleware/authMiddleware');

// Admin authentication routes
router.post('/login', adminController.login);
router.post('/logout', requireAuth, adminController.logout);
router.get('/current', requireAuth, adminController.getCurrentAdmin);
router.post('/refresh-session', requireAuth, adminController.refreshSession);

// Admin management routes (protected by super admin)
router.post('/create', requireAuth, requireSuperAdmin, adminController.createAdmin);
router.get('/all', requireAuth, requireSuperAdmin, adminController.getAllAdmins);
router.put('/reset-password', requireAuth, requireSuperAdmin, adminController.resetPassword);
router.put('/change-password', requireAuth, adminController.changePassword);
router.put('/update/:adminId', requireAuth, requireSuperAdmin, adminController.updateAdmin);
router.put('/deactivate/:adminId', requireAuth, requireSuperAdmin, adminController.deactivateAdmin);
router.delete('/delete/:adminId', requireAuth, requireSuperAdmin, adminController.deleteAdmin);

// Initialize super admin (one-time setup)
router.post('/initialize-super-admin', adminController.initializeSuperAdmin);

module.exports = router; 