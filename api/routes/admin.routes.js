const express = require('express');
const router = express.Router();
const { authenticateToken, requireRole } = require('../middleware/auth.middleware');
const adminController = require('../controllers/admin.controller');

// All routes require authentication AND admin role
router.use(authenticateToken);
router.use(requireRole('admin'));

// Activity approval
router.get('/pending-activities', adminController.getPendingActivities);
router.put('/activities/:activityId/approve', adminController.approveActivity);
router.put('/activities/:activityId/reject', adminController.rejectActivity);

// Platform statistics
router.get('/statistics', adminController.getStatistics);

// User management
router.get('/users', adminController.getAllUsers);
router.put('/users/:userId/role', adminController.updateUserRole);

module.exports = router;
