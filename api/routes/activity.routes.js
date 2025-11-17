const express = require('express');
const { body, param } = require('express-validator');
const router = express.Router();
const {
    getAllActivities,
    getActivityById,
    createActivity,
    updateActivity,
    deleteActivity
} = require('../controllers/activity.controller');
const { authMiddleware, adminMiddleware, optionalAuth, requireRole } = require('../middleware/auth.middleware');
const { validate } = require('../middleware/validator.middleware');

/**
 * @route   GET /api/activities
 * @desc    Get all activities
 * @access  Public
 */
router.get('/', optionalAuth, getAllActivities);

/**
 * @route   GET /api/activities/:id
 * @desc    Get activity by ID
 * @access  Public
 */
router.get(
    '/:id',
    [
        param('id').isUUID().withMessage('Invalid activity ID'),
        validate
    ],
    optionalAuth,
    getActivityById
);

/**
 * @route   POST /api/activities
 * @desc    Create new activity
 * @access  Private (Admin/Organizer only)
 */
router.post(
    '/',
    [
        authMiddleware,
        adminMiddleware,
        body('title')
            .trim()
            .notEmpty()
            .withMessage('Title is required')
            .isLength({ max: 255 })
            .withMessage('Title must not exceed 255 characters'),
        body('description')
            .optional()
            .trim(),
        body('activityType')
            .optional()
            .trim()
            .isLength({ max: 50 })
            .withMessage('Activity type must not exceed 50 characters'),
        body('activity_type')
            .optional()
            .trim()
            .isLength({ max: 50 })
            .withMessage('Activity type must not exceed 50 characters'),
        body('location')
            .optional()
            .trim()
            .isLength({ max: 255 })
            .withMessage('Location must not exceed 255 characters'),
        body('startDate')
            .optional()
            .isISO8601()
            .withMessage('Invalid start date format'),
        body('start_date')
            .optional()
            .isISO8601()
            .withMessage('Invalid start date format'),
        body('endDate')
            .optional()
            .isISO8601()
            .withMessage('Invalid end date format'),
        body('end_date')
            .optional()
            .isISO8601()
            .withMessage('Invalid end date format'),
        body('maxParticipants')
            .optional()
            .isInt({ min: 1 })
            .withMessage('Max participants must be a positive integer'),
        body('max_participants')
            .optional()
            .isInt({ min: 1 })
            .withMessage('Max participants must be a positive integer'),
        body('imageUrl')
            .optional()
            .trim()
            .isURL()
            .withMessage('Invalid image URL'),
        body('image_url')
            .optional()
            .trim(),
        validate
    ],
    createActivity
);

/**
 * @route   PUT /api/activities/:id
 * @desc    Update activity
 * @access  Private (Admin/Organizer only)
 */
router.put(
    '/:id',
    [
        authMiddleware,
        adminMiddleware,
        param('id').isUUID().withMessage('Invalid activity ID'),
        body('title')
            .optional()
            .trim()
            .isLength({ max: 255 })
            .withMessage('Title must not exceed 255 characters'),
        body('description')
            .optional()
            .trim(),
        body('activityType')
            .optional()
            .trim()
            .isLength({ max: 50 })
            .withMessage('Activity type must not exceed 50 characters'),
        body('activity_type')
            .optional()
            .trim()
            .isLength({ max: 50 })
            .withMessage('Activity type must not exceed 50 characters'),
        body('location')
            .optional()
            .trim()
            .isLength({ max: 255 })
            .withMessage('Location must not exceed 255 characters'),
        body('startDate')
            .optional()
            .isISO8601()
            .withMessage('Invalid start date format'),
        body('start_date')
            .optional()
            .isISO8601()
            .withMessage('Invalid start date format'),
        body('endDate')
            .optional()
            .isISO8601()
            .withMessage('Invalid end date format'),
        body('end_date')
            .optional()
            .isISO8601()
            .withMessage('Invalid end date format'),
        body('maxParticipants')
            .optional()
            .isInt({ min: 1 })
            .withMessage('Max participants must be a positive integer'),
        body('max_participants')
            .optional()
            .isInt({ min: 1 })
            .withMessage('Max participants must be a positive integer'),
        body('imageUrl')
            .optional()
            .trim(),
        body('image_url')
            .optional()
            .trim(),
        body('status')
            .optional()
            .isIn(['open', 'closed', 'cancelled', 'completed'])
            .withMessage('Invalid status'),
        validate
    ],
    updateActivity
);

/**
 * @route   DELETE /api/activities/:id
 * @desc    Delete activity (organizer can delete own, admin can delete any)
 * @access  Private (Admin/Organizer only)
 */
router.delete(
    '/:id',
    [
        authMiddleware,
        requireRole('admin', 'organizer'),
        param('id').isUUID().withMessage('Invalid activity ID'),
        validate
    ],
    deleteActivity
);

module.exports = router;
