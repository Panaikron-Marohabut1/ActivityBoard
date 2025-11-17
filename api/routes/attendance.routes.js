const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/auth.middleware');
const attendanceController = require('../controllers/attendance.controller');

// All routes require authentication
router.use(authenticateToken);

// Student: QR code check-in
router.post('/check-in', attendanceController.checkIn);

// Student: Get my attendance stats
router.get('/my-stats', attendanceController.getMyStats);

// Organizer: Get activity attendance overview
router.get('/activity/:activityId', attendanceController.getActivityAttendance);

// Organizer: Get event attendance
router.get('/event/:eventId', attendanceController.getEventAttendance);

// Organizer: Mark absences for event
router.post('/event/:eventId/mark-absences', attendanceController.markAbsences);

module.exports = router;
