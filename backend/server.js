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


try {
const BusTrackingRoutes = require('./routes/BusTrackingRoutes');
app.use('/api/bus-tracking', BusTrackingRoutes);
app.use('/api/live-tracking', BusTrackingRoutes);
console.log('✅ BusTrackingRoutes loaded');
} catch (error) {
console.log('❌ BusTrackingRoutes error:', error.message);
}


try {
const busLiveTrackingRoutes = require('./routes/busLiveTrackingRoutes');
app.use('/api/live-tracking', busLiveTrackingRoutes);
console.log('✅ busLiveTrackingRoutes loaded');
} catch (error) {
console.log('❌ busLiveTrackingRoutes error:', error.message);
}

// Load routes with error handling
try {
const dbTestRoute = require('./routes/dbTestRoute');
app.use('/api', dbTestRoute);
console.log('✅ dbTestRoute loaded');
} catch (error) {
console.log('❌ dbTestRoute error:', error.message);
}

try {
const authRoutes = require('./routes/authRoutes');
app.use('/api/auth', authRoutes);
console.log('✅ authRoutes loaded');
} catch (error) {
console.log('❌ authRoutes error:', error.message);
}

try {
const userRoutes = require('./routes/userRoutes');
app.use('/api/users', userRoutes);
console.log('✅ userRoutes loaded');
} catch (error) {
console.log('❌ userRoutes error:', error.message);
}

try {
const routeRoutes = require('./routes/routeRoutes');
app.use('/api/routes', routeRoutes);
console.log('✅ routeRoutes loaded');
} catch (error) {
console.log('❌ routeRoutes error:', error.message);
}

try {
const driverAuthRoutes = require('./routes/driverAuth');
app.use('/api/driver', driverAuthRoutes);
console.log('✅ driverAuth loaded');
} catch (error) {
console.log('❌ driverAuth error:', error.message);
}

try {
const passengerAuthRoutes = require('./routes/passengerAuth');
app.use('/api/passengers', passengerAuthRoutes);
console.log('✅ passengerAuth loaded');
} catch (error) {
console.log('❌ passengerAuth error:', error.message);
}

try {
const passengerRoutes = require('./routes/passengerRoutes');
app.use('/api/passengers', passengerRoutes);
console.log('✅ passengerRoutes loaded');
} catch (error) {
console.log('❌ passengerRoutes error:', error.message);
}

const assignmentRoutes = require('./routes/assignmentRoutes');
const dailyAssignmentRoutes = require('./routes/dailyAssignmentRoutes');

// Add this with your other app.use() routes
app.use('/api/assignments', assignmentRoutes);
app.use('/api/dailyassignment', dailyAssignmentRoutes);
console.log('✅ dailyAssignmentRoutes loaded');


try {
const BusOccupancyRoutes = require('./routes/BusOccupancyRoutes');
app.use('/api/bus-occupancy', BusOccupancyRoutes);
console.log('✅ BusOccupancyRoutes loaded');
} catch (error) {
console.log('❌ BusOccupancyRoutes error:', error.message);
}

try {
const passwordResetRoutes = require('./routes/passwordReset');
app.use('/api/password-reset', passwordResetRoutes);
console.log('✅ passwordReset loaded');
} catch (error) {
console.log('❌ passwordReset error:', error.message);
}





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

try {
const notificationRoutes = require('./routes/notificationRoutes');
app.use('/api/notifications', notificationRoutes);
console.log('✅ notificationRoutes loaded');
} catch (error) {
console.log('❌ notificationRoutes error:', error.message);
}

const driverFoundItemRoutes = require('./routes/driverFoundItemRoutes');
app.use('/api/driver', driverFoundItemRoutes);
console.log('✅ driverFoundItemRoutes loaded');
} catch (error) {
console.log('❌ driverFoundItemRoutes error:', error.message);
}


try {
const depotEngineerRoutes = require('./routes/depotEngineerRoutes');
app.use('/api/depot-engineer', depotEngineerRoutes); // Mount at /api/depot-engineer
console.log('✅ depotEngineerRoutes loaded');
} catch (error) {
console.log('❌ depotEngineerRoutes error:', error.message);
}

try {
  const inspectionRoutes = require('./routes/inspectionRoutes');
  app.use('/api/inspections', inspectionRoutes);
  console.log('✅ inspectionRoutes loaded');
} catch (error) {
  console.log('❌ inspectionRoutes error:', error.message);
}

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
