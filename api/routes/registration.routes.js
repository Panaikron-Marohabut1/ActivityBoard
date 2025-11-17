const express = require('express');
const { body, param } = require('express-validator');
const router = express.Router();
const {
    getUserRegistrations,
    registerForActivity,
    cancelRegistration,
    getActivityRegistrations,
    removeParticipant
} = require('../controllers/registration.controller');
const { authMiddleware, adminMiddleware } = require('../middleware/auth.middleware');
const { validate } = require('../middleware/validator.middleware');

/**
 * @route   GET /api/registrations
 * @desc    Get user's registrations
 * @access  Private
 */
router.get('/', authMiddleware, getUserRegistrations);

/**
 * @route   POST /api/registrations
 * @desc    Register for an activity
 * @access  Private
 */
router.post(
    '/',
    [
        authMiddleware,
        body('activityId')
            .notEmpty()
            .withMessage('Activity ID is required')
            .isUUID()
            .withMessage('Invalid activity ID'),
        validate
    ],
    registerForActivity
);

/**
 * @route   DELETE /api/registrations/:id
 * @desc    Cancel registration
 * @access  Private
 */
router.delete(
    '/:id',
    [
        authMiddleware,
        param('id').isUUID().withMessage('Invalid registration ID'),
        validate
    ],
    cancelRegistration
);

/**
 * @route   GET /api/registrations/activity/:activityId
 * @desc    Get all registrations for an activity
 * @access  Private (Admin/Organizer only)
 */
router.get(
    '/activity/:activityId',
    [
        authMiddleware,
        // adminMiddleware removed - organizers can view their own activity participants
        param('activityId').isUUID().withMessage('Invalid activity ID'),
        validate
    ],
    getActivityRegistrations
);

/**
 * @route   DELETE /api/registrations/:id/remove
 * @desc    Remove a participant from an activity (Organizer/Admin only)
 * @access  Private (Admin/Organizer only)
 */
router.delete(
    '/:id/remove',
    [
        authMiddleware,
        param('id').isUUID().withMessage('Invalid registration ID'),
        validate
    ],
    removeParticipant
);

module.exports = router;
