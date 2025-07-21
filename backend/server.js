const express = require('express');
const path = require('path');
const cors = require('cors');
const morgan = require('morgan');
require('dotenv').config(); // Load environment variables at the very beginning

const app = express();
const PORT = process.env.PORT || 5000;

// Basic CORS configuration
app.use(cors({
  origin: true, // Allow all origins in development (for testing)
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Mobile-App', 'Accept', 'Origin', 'X-Requested-With'],
  exposedHeaders: ['Content-Length', 'X-Foo', 'X-Bar']
}));

app.use(morgan('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static files (ensure 'public' exists in your backend root)
app.use(express.static(path.join(__dirname, 'public')));

// Serve uploaded files
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
app.use('/api/uploads', express.static(path.join(__dirname, 'uploads'))); // For compatibility

// Basic security headers
app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  next();
});

// Handle preflight requests for multipart form data (if lost-found needs it, keep it)
app.options('/api/lost-found/reports', (req, res) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, Accept, Origin', 'X-Requested-With');
  res.sendStatus(200);
});

// Health check endpoint for API discovery
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    message: 'BusHubLK API is healthy',
    timestamp: new Date().toISOString(),
    version: '1.0.0'
  });
});

// Sample route
app.get('/', (req, res) => {
  res.send('🚍 BusHubLK API is running');
});

// Test endpoint
app.get('/api/test', (req, res) => {
  res.json({
    success: true,
    message: 'API is working',
    timestamp: new Date().toISOString()
  });
});

// ----------------------------------------------------------------------
// LOAD ALL ROUTES
// ----------------------------------------------------------------------

const dbTestRoute = require('./routes/dbTestRoute');
app.use('/api', dbTestRoute);
console.log('✅ dbTestRoute loaded');

const authRoutes = require('./routes/authRoutes');
app.use('/api/auth', authRoutes);
console.log('✅ authRoutes loaded');

const userRoutes = require('./routes/userRoutes');
app.use('/api/users', userRoutes);
console.log('✅ userRoutes loaded');

const routeRoutes = require('./routes/routeRoutes');
app.use('/api/routes', routeRoutes);
console.log('✅ routeRoutes loaded');

const driverAuthRoutes = require('./routes/driverAuth');
app.use('/api/driver', driverAuthRoutes);
console.log('✅ driverAuth loaded');

// NOTE: passengerAuthRoutes and passengerRoutes can use the same base path
// but ensure their internal routes don't conflict, or combine them if logical.
const passengerAuthRoutes = require('./routes/passengerAuth');
app.use('/api/passengers', passengerAuthRoutes); // Changed from /api/passengers (already mounted by passengerRoutes)
console.log('✅ passengerAuth loaded');

const passengerRoutes = require('./routes/passengerRoutes');
app.use('/api/passengers', passengerRoutes);
console.log('✅ passengerRoutes loaded');

const dailyAssignmentRoutes = require('./routes/dailyAssignmentRoutes');
app.use('/api/dailyassignment', dailyAssignmentRoutes);
console.log('✅ dailyAssignmentRoutes loaded');

const BusOccupancyRoutes = require('./routes/BusOccupancyRoutes');
app.use('/api/bus-occupancy', BusOccupancyRoutes);
console.log('✅ BusOccupancyRoutes loaded');

const passwordResetRoutes = require('./routes/passwordReset');
app.use('/api/password-reset', passwordResetRoutes);
console.log('✅ passwordReset loaded');

const regionDepotRoutes = require('./routes/regionDepotRoutes');
app.use('/api', regionDepotRoutes);
console.log('✅ regionDepotRoutes loaded');

const fareRoutes = require('./routes/fareRoutes');
app.use('/api/fares', fareRoutes);
console.log('✅ fareRoutes loaded');

const busConditionReportRoutes = require('./routes/busConditionReportRoutes');
app.use('/api/bus-condition-reports', busConditionReportRoutes);
console.log('✅ busConditionReportRoutes loaded');

const busRoutes = require('./routes/busRoutes');
app.use('/api/buses', busRoutes);
console.log('✅ busRoutes loaded');

const lostFoundRoutes = require('./routes/lostFoundRoutes');
app.use('/api/lost-found', lostFoundRoutes);
console.log('✅ lostFoundRoutes loaded');

// ----------------------------------------------------------------------
// END LOAD ALL ROUTES
// ----------------------------------------------------------------------

// Static file routes (for reset password HTML/JS)
app.get('/resetPassword.js', (req, res) => {
  res.setHeader('Content-Type', 'application/javascript');
  res.sendFile(path.join(__dirname, 'public/resetPassword.js'));
});

app.get('/reset-password.html', (req, res) => {
  res.setHeader('Content-Type', 'text/html');
  res.sendFile(path.join(__dirname, 'public/reset-password.html'));
});

// Error handling middleware (should be last app.use before 404 handler)
app.use((error, req, res, next) => {
  console.error('Server error:', error);
  // Check if headers have already been sent to prevent "Cannot set headers after they are sent to the client" error
  if (res.headersSent) {
    return next(error);
  }
  res.status(500).json({
    success: false,
    error: 'Internal server error'
  });
});

// 404 handler (should be the very last middleware)
app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: 'Route not found'
  });
});

// Favicon and robots.txt
app.get('/favicon.ico', (req, res) => {
  res.status(204).end();
});

app.get('/robots.txt', (req, res) => {
  res.type('text/plain');
  res.send('User-agent: *\nDisallow: /');
});

// Start server
app.listen(PORT, '0.0.0.0', () => {
  try {
    const { getDynamicBaseURL } = require('./utils/networkUtils');
    const baseURL = getDynamicBaseURL();

    console.log(`🚀 Server is running on ${baseURL}`);
    console.log(`📧 Email service configured: ${process.env.EMAIL_SERVICE || 'smtp'}`); // Default to smtp
    console.log(`🌐 Base URL for deep links/web access: ${baseURL}`);
    console.log(`🔐 Password reset endpoint: ${baseURL}/api/password-reset`);
  } catch (error) {
    console.log(`🚀 Server is running on http://localhost:${PORT}`);
    console.log('❌ Network utils error:', error.message);
  }
});

module.exports = app;