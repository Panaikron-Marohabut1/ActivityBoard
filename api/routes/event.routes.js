const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/auth.middleware');
const eventController = require('../controllers/event.controller');

// All routes require authentication
router.use(authenticateToken);

// Get all events for an activity
router.get('/activity/:activityId', eventController.getActivityEvents);

// Get single event
router.get('/:eventId', eventController.getEvent);

// Create event (organizer/admin only)
router.post('/', eventController.createEvent);

// Update event (owner/admin only)
router.put('/:eventId', eventController.updateEvent);

// Delete event (owner/admin only)
router.delete('/:eventId', eventController.deleteEvent);

module.exports = router;
