const express = require('express');
const { body } = require('express-validator');
const router = express.Router();
const {
    getProfile,
    updateProfile,
    changePassword,
    uploadAvatar,
    getProfileStats
} = require('../controllers/profile.controller');
const { authMiddleware } = require('../middleware/auth.middleware');
const { validate } = require('../middleware/validator.middleware');

/**
 * @route   GET /api/profile
 * @desc    Get user profile
 * @access  Private
 */
router.get('/', authMiddleware, getProfile);

/**
 * @route   PUT /api/profile
 * @desc    Update user profile
 * @access  Private
 */
router.put(
    '/',
    [
        authMiddleware,
        body('firstName')
            .optional()
            .trim()
            .isLength({ max: 100 })
            .withMessage('First name must not exceed 100 characters'),
        body('lastName')
            .optional()
            .trim()
            .isLength({ max: 100 })
            .withMessage('Last name must not exceed 100 characters'),
        body('email')
            .optional()
            .trim()
            .isEmail()
            .withMessage('Please provide a valid email')
            .normalizeEmail(),
        body('phone')
            .optional()
            .trim()
            .matches(/^[0-9\-\+\(\)\s]*$/)
            .withMessage('Please provide a valid phone number'),
        validate
    ],
    updateProfile
);

/**
 * @route   PUT /api/profile/password
 * @desc    Change password
 * @access  Private
 */
router.put(
    '/password',
    [
        authMiddleware,
        body('currentPassword')
            .notEmpty()
            .withMessage('Current password is required'),
        body('newPassword')
            .isLength({ min: 6 })
            .withMessage('New password must be at least 6 characters long'),
        validate
    ],
    changePassword
);

/**
 * @route   POST /api/profile/avatar
 * @desc    Upload profile avatar
 * @access  Private
 */
router.post(
    '/avatar',
    [
        authMiddleware,
        body('avatarData')
            .notEmpty()
            .withMessage('Avatar data is required'),
        validate
    ],
    uploadAvatar
);

/**
 * @route   GET /api/profile/stats
 * @desc    Get user's activity statistics
 * @access  Private
 */
router.get('/stats', authMiddleware, getProfileStats);

module.exports = router;
