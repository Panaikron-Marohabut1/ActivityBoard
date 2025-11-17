const express = require('express');
const { body } = require('express-validator');
const router = express.Router();
const { register, login, getMe, logout } = require('../controllers/auth.controller');
const { authMiddleware } = require('../middleware/auth.middleware');
const { validate } = require('../middleware/validator.middleware');

/**
 * @route   POST /api/auth/register
 * @desc    Register new user
 * @access  Public
 */
router.post(
    '/register',
    [
        body('username')
            .trim()
            .isLength({ min: 3, max: 50 })
            .withMessage('Username must be between 3 and 50 characters')
            .matches(/^[a-zA-Z0-9_]+$/)
            .withMessage('Username can only contain letters, numbers, and underscores'),
        body('email')
            .trim()
            .isEmail()
            .withMessage('Please provide a valid email')
            .normalizeEmail(),
        body('password')
            .isLength({ min: 6 })
            .withMessage('Password must be at least 6 characters long'),
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
        body('phone')
            .optional()
            .trim()
            .matches(/^[0-9\-\+\(\)\s]*$/)
            .withMessage('Please provide a valid phone number'),
        validate
    ],
    register
);

/**
 * @route   POST /api/auth/login
 * @desc    Login user
 * @access  Public
 */
router.post(
    '/login',
    [
        body('username')
            .trim()
            .notEmpty()
            .withMessage('Username is required'),
        body('password')
            .notEmpty()
            .withMessage('Password is required'),
        validate
    ],
    login
);

/**
 * @route   GET /api/auth/me
 * @desc    Get current user
 * @access  Private
 */
router.get('/me', authMiddleware, getMe);

/**
 * @route   POST /api/auth/logout
 * @desc    Logout user
 * @access  Private
 */
router.post('/logout', authMiddleware, logout);

module.exports = router;
