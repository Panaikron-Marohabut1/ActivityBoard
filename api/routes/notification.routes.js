const express = require('express');
const router = express.Router();
const { 
    getNotifications, 
    markAsRead, 
    markAllAsRead,
    deleteNotification,
    toggleActivityNotifications
} = require('../controllers/notification.controller');
const { authMiddleware } = require('../middleware/auth.middleware');

/**
 * @route   GET /api/notifications
 * @desc    Get all notifications for current user
 * @access  Private
 */
router.get('/', authMiddleware, getNotifications);

/**
 * @route   PUT /api/notifications/:id/read
 * @desc    Mark notification as read
 * @access  Private
 */
router.put('/:id/read', authMiddleware, markAsRead);

/**
 * @route   PUT /api/notifications/read-all
 * @desc    Mark all notifications as read
 * @access  Private
 */
router.put('/read-all', authMiddleware, markAllAsRead);

/**
 * @route   DELETE /api/notifications/:id
 * @desc    Delete notification
 * @access  Private
 */
router.delete('/:id', authMiddleware, deleteNotification);

/**
 * @route   PUT /api/notifications/activity/:activityId/toggle
 * @desc    Toggle notifications for specific activity
 * @access  Private
 */
router.put('/activity/:activityId/toggle', authMiddleware, toggleActivityNotifications);

module.exports = router;
