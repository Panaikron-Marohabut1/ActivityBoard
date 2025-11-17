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
app.use(cors({
    origin: function(origin, callback) {
        // Allow requests with no origin (like mobile apps or curl requests)
        if (!origin) return callback(null, true);
        
        // Allow localhost on any port
        if (origin.includes('localhost') || origin.includes('127.0.0.1')) {
            return callback(null, true);
        }
        
        // Allow ngrok domains
        if (origin.includes('ngrok-free.dev') || origin.includes('ngrok.io')) {
            return callback(null, true);
        }
        
        // Allow configured frontend URL
        if (origin === process.env.FRONTEND_URL) {
            return callback(null, true);
        }
        
        callback(new Error('Not allowed by CORS'));
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));

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

// Serve static frontend files (for ngrok single tunnel)
app.use(express.static(path.join(__dirname, '../public')));

// API routes
app.use('/api/auth', authRoutes);
app.use('/api/activities', activityRoutes);
app.use('/api/registrations', registrationRoutes);
app.use('/api/profile', profileRoutes);
app.use('/api/events', eventRoutes);
app.use('/api/attendance', attendanceRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/notifications', notificationRoutes);

// Serve index.html for any non-API routes (SPA support)
app.get('*', (req, res) => {
    // Don't serve index.html for API routes
    if (req.path.startsWith('/api/')) {
        return res.status(404).json({
            success: false,
            message: 'API route not found'
        });
    }
    res.sendFile(path.join(__dirname, '../public', 'index.html'));
});

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

module.exports = app;
