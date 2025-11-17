const jwt = require('jsonwebtoken');
const { supabase } = require('../config/supabase');

/**
 * Middleware to verify JWT token and attach user to request
 */
const authMiddleware = async (req, res, next) => {
    try {
        // Get token from header
        const authHeader = req.headers.authorization;
        
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({
                success: false,
                message: 'No token provided. Please login.'
            });
        }

        const token = authHeader.substring(7); // Remove 'Bearer ' prefix

        // Verify token
        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        // Get user from database
        const { data: user, error } = await supabase
            .from('users')
            .select('id, username, email, first_name, last_name, role, avatar_url')
            .eq('id', decoded.userId)
            .single();

        if (error || !user) {
            return res.status(401).json({
                success: false,
                message: 'Invalid token. User not found.'
            });
        }

        // Attach user to request
        req.user = user;
        next();
    } catch (error) {
        console.error('Auth middleware error:', error);
        
        if (error.name === 'JsonWebTokenError') {
            return res.status(401).json({
                success: false,
                message: 'Invalid token.'
            });
        }
        
        if (error.name === 'TokenExpiredError') {
            return res.status(401).json({
                success: false,
                message: 'Token expired. Please login again.'
            });
        }

        return res.status(500).json({
            success: false,
            message: 'Authentication error.'
        });
    }
};

/**
 * Middleware to check if user has admin/organizer role
 */
const adminMiddleware = (req, res, next) => {
    if (!req.user) {
        return res.status(401).json({
            success: false,
            message: 'Authentication required.'
        });
    }

    if (req.user.role !== 'admin' && req.user.role !== 'organizer') {
        return res.status(403).json({
            success: false,
            message: 'Access denied. Admin or organizer role required.'
        });
    }

    next();
};

/**
 * Optional middleware - doesn't fail if no token
 */
const optionalAuth = async (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;
        
        if (authHeader && authHeader.startsWith('Bearer ')) {
            const token = authHeader.substring(7);
            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            
            const { data: user } = await supabase
                .from('users')
                .select('id, username, email, first_name, last_name, role, avatar_url')
                .eq('id', decoded.userId)
                .single();
            
            if (user) {
                req.user = user;
            }
        }
    } catch (error) {
        // Silently fail for optional auth
        console.log('Optional auth failed:', error.message);
    }
    
    next();
};

/**
 * Middleware to check if user has specific role
 */
const requireRole = (...roles) => {
    return (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({
                success: false,
                message: 'Authentication required.'
            });
        }

        if (!roles.includes(req.user.role)) {
            return res.status(403).json({
                success: false,
                message: `Access denied. Required role: ${roles.join(' or ')}`
            });
        }

        next();
    };
};

module.exports = {
    authMiddleware,
    authenticateToken: authMiddleware, // Alias for compatibility
    adminMiddleware,
    optionalAuth,
    requireRole
};
