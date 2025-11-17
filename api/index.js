const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const path = require('path');

// Load environment variables
dotenv.config();

// Import routes
const authRoutes = require('./routes/auth.routes');
const activityRoutes = require('./routes/activity.routes');
const registrationRoutes = require('./routes/registration.routes');
const profileRoutes = require('./routes/profile.routes');
const eventRoutes = require('./routes/event.routes');
const attendanceRoutes = require('./routes/attendance.routes');
const adminRoutes = require('./routes/admin.routes');
const notificationRoutes = require('./routes/notification.routes');

// Initialize Express app
const app = express();
const PORT = process.env.PORT || 5000;

// =============================================
// MIDDLEWARE
// =============================================

// CORS configuration
app.use((req, res, next) => {
    const origin = req.headers.origin;

    // Allow localhost
    if (origin && (origin.includes('localhost') || origin.includes('127.0.0.1'))) {
        res.header("Access-Control-Allow-Origin", origin);
    }

    // Allow ALL Vercel frontend deployments
    else if (origin && origin.includes('vercel.app')) {
        res.header("Access-Control-Allow-Origin", origin);
    }

    // Allow Render (for backend internal & health checks)
    else if (origin && origin.includes('.onrender.com')) {
        res.header("Access-Control-Allow-Origin", origin);
    }

    res.header("Access-Control-Allow-Credentials", "true");
    res.header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
    res.header("Access-Control-Allow-Headers", "Content-Type, Authorization");

    if (req.method === 'OPTIONS') return res.sendStatus(200);

    next();
});


// Body parsing middleware
app.use(express.json({ limit: '10mb' })); // For base64 images
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Request logging middleware (development only)
if (process.env.NODE_ENV === 'development') {
    app.use((req, res, next) => {
        console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
        next();
    });
}

// =============================================
// ROUTES
// =============================================

// Health check endpoint
app.get('/health', (req, res) => {
    res.json({
        success: true,
        message: 'MFU Activity Board API is running',
        timestamp: new Date().toISOString()
    });
});

// API routes
app.use('/api/auth', authRoutes);
app.use('/api/activities', activityRoutes);
app.use('/api/registrations', registrationRoutes);
app.use('/api/profile', profileRoutes);
app.use('/api/events', eventRoutes);
app.use('/api/attendance', attendanceRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/notifications', notificationRoutes);

// 404 handler for API routes only
app.use('/api/*', (req, res) => {
    res.status(404).json({
        success: false,
        message: 'Route not found'
    });
});

// =============================================
// ERROR HANDLING
// =============================================

// Global error handler
app.use((err, req, res, next) => {
    console.error('Error:', err);

    // Validation error
    if (err.name === 'ValidationError') {
        return res.status(400).json({
            success: false,
            message: 'Validation error',
            errors: Object.values(err.errors).map(e => e.message)
        });
    }

    // JWT errors
    if (err.name === 'JsonWebTokenError') {
        return res.status(401).json({
            success: false,
            message: 'Invalid token'
        });
    }

    if (err.name === 'TokenExpiredError') {
        return res.status(401).json({
            success: false,
            message: 'Token expired'
        });
    }

    // Default error
    res.status(err.statusCode || 500).json({
        success: false,
        message: err.message || 'Internal server error',
        ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
    });
});

// =============================================
// START SERVER
// =============================================

app.listen(PORT, () => {
    console.log('');
    console.log('╔══════════════════════════════════════════════════════╗');
    console.log('║                                                      ║');
    console.log('║        MFU Activity Board API Server                ║');
    console.log('║                                                      ║');
    console.log('╚══════════════════════════════════════════════════════╝');
    console.log('');
    console.log(`🚀 Server running on: http://localhost:${PORT}`);
    console.log(`📊 Environment: ${process.env.NODE_ENV || 'development'}`);
    console.log(`🌐 Frontend URL: ${process.env.FRONTEND_URL || 'http://localhost:3000'}`);
    console.log('');
    console.log('Available endpoints:');
    console.log('  Authentication:');
    console.log('    - POST /api/auth/register');
    console.log('    - POST /api/auth/login');
    console.log('    - GET  /api/auth/me');
    console.log('  Activities:');
    console.log('    - GET  /api/activities');
    console.log('    - POST /api/activities');
    console.log('  Events:');
    console.log('    - GET  /api/events/activity/:id');
    console.log('    - POST /api/events');
    console.log('  Attendance:');
    console.log('    - POST /api/attendance/check-in');
    console.log('    - GET  /api/attendance/my-stats');
    console.log('  Admin:');
    console.log('    - GET  /api/admin/pending-activities');
    console.log('    - PUT  /api/admin/activities/:id/approve');
    console.log('  Profile & Registrations:');
    console.log('    - GET  /api/profile');
    console.log('    - GET  /api/registrations/my-registrations');
    console.log('');
    console.log('Press Ctrl+C to stop the server');
    console.log('');
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (err) => {
    console.error('Unhandled Promise Rejection:', err);
    // Close server & exit process
    process.exit(1);
});
