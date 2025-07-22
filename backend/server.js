const express = require('express');
const path = require('path');
const cors = require('cors');
const morgan = require('morgan');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;

// Basic CORS configuration
app.use(cors({
  origin: true, // Allow all origins in development
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Mobile-App']
}));

app.use(morgan('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static files
app.use(express.static(path.join(__dirname, 'public')));

// Basic security headers
app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  next();
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
  console.log('✅ BusTrackingRoutes loaded');
} catch (error) {
  console.log('❌ BusTrackingRoutes error:', error.message);
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

// Add this with your other app.use() routes
app.use('/api/assignments', assignmentRoutes);


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


const BusTrackingRoutes = require('./routes/BusTrackingRoutes');
  app.use('/api/bus-tracking', BusTrackingRoutes); 

const fareRoutes = require('./routes/fareRoutes');
app.use('/api/fares', fareRoutes);

const routeRoutes = require('./routes/routeRoutes');
app.use('/api/routes', routeRoutes);

try {
  const busConditionReportRoutes = require('./routes/busConditionReportRoutes');
  app.use('/api/bus-condition-reports', busConditionReportRoutes);
  console.log('✅ busConditionReportRoutes loaded');
} catch (error) {
  console.log('❌ busConditionReportRoutes error:', error.message);
}

try {
  const busRoutes = require('./routes/busRoutes');
  app.use('/api/buses', busRoutes);
  console.log('✅ busRoutes loaded');
} catch (error) {
  console.log('❌ busRoutes error:', error.message);
}

try {
  const lostFoundRoutes = require('./routes/lostFoundRoutes');
  app.use('/api/lost-found', lostFoundRoutes);
  console.log('✅ lostFoundRoutes loaded');
} catch (error) {
  console.log('❌ lostFoundRoutes error:', error.message);
}

// Static file routes
app.get('/resetPassword.js', (req, res) => {
  res.setHeader('Content-Type', 'application/javascript');
  res.sendFile(path.join(__dirname, 'public/resetPassword.js'));
});

// Add this near your other route imports
const busRoutes = require('./routes/busRoutes');

// And this with your other app.use() calls
app.use('/api/buses', busRoutes);


app.get('/reset-password.html', (req, res) => {
  res.setHeader('Content-Type', 'text/html');
  res.sendFile(path.join(__dirname, 'public/reset-password.html'));

});

// Error handling
app.use((error, req, res, next) => {
  console.error('Server error:', error);
  res.status(500).json({
    success: false,
    error: 'Internal server error'
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: 'Route not found'
  });
});


app.get('/favicon.ico', (req, res) => {
  res.status(204).end();
});

// Handle common static file requests
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
    console.log(`📧 Email service configured: ${process.env.EMAIL_SERVICE || 'gmail'}`);
    console.log(`🌐 Base URL: ${baseURL}`);
    console.log(`🔐 Password reset available at: ${baseURL}/api/password-reset`);
  } catch (error) {
    console.log(`🚀 Server is running on http://localhost:${PORT}`);
    console.log('❌ Network utils error:', error.message);
  }
});

module.exports = app;
