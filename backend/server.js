const express = require('express');
const path = require('path');
const cors = require('cors');
const morgan = require('morgan');
require('dotenv').config(); // Load environment variables at the very beginning
const http = require('http');
const { Server } = require('socket.io');
const setupSocketIO = require('./utils/socketHandler');

const app = express();
const PORT = process.env.PORT || 5000;

const server = http.createServer(app);

// Setup Socket.IO with CORS
const io = new Server(server, {
  cors: {
    origin: true, // Allow all origins in development
    methods: ['GET', 'POST'],
    credentials: true
  }
});

setupSocketIO(io);

// Middleware to attach io to requests (for use in controllers)
app.use((req, res, next) => {
  req.io = io;
  next();
});


// Basic CORS configuration
app.use(cors({
  origin: true, // Allow all origins in development (for testing)
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
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

// Google Places API proxy routes
try {
  const placesRoutes = require('./routes/placesRoutes');
  app.use('/api/places', placesRoutes);
  console.log('✅ placesRoutes loaded');
} catch (error) {
  console.log('❌ placesRoutes error:', error.message);
}

try {
  const BusTrackingRoutes = require('./routes/BusTrackingRoutes');
  app.use('/api/bus-tracking', BusTrackingRoutes);
  // Removed duplicate /api/live-tracking registration - using busLiveTrackingRoutes instead
  console.log('✅ BusTrackingRoutes loaded');
} catch (error) {
  console.log('❌ BusTrackingRoutes error:', error.message);
}
const depotmanagerDashboardRoutes = require('./routes/depotmanagerDashboardRoutes');
app.use('/api/depot-dashboard', depotmanagerDashboardRoutes);
console.log('✅ depotmanagerDashboardRoutes loaded');

try {
  const busLiveTrackingRoutes = require('./routes/busLiveTrackingRoutes');
  app.use('/api/live-tracking', busLiveTrackingRoutes);
  console.log('✅ busLiveTrackingRoutes loaded');
} catch (error) {
  console.log('❌ busLiveTrackingRoutes error:', error.message);
}

try {
  const busLiveTrackingSummaryRoutes = require('./routes/busLiveTrackingSummaryRoutes');
  app.use('/api/live-summary', busLiveTrackingSummaryRoutes);
  console.log('✅ busLiveTrackingSummaryRoutes loaded');
} catch (error) {
  console.log('❌ busLiveTrackingSummaryRoutes error:', error.message);
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



const dailyAssignmentRoutes = require('./routes/dailyAssignmentRoutes');
app.use('/api/assignments', dailyAssignmentRoutes);
console.log('✅ dailyAssignmentRoutes loaded');

const depotOpsDashboardRoutes = require('./routes/depotoperationsmanagerdashboardRoutes');
app.use('/api/depot-ops-dashboard', depotOpsDashboardRoutes);


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


try {
const depotManagerRoutes = require('./routes/depotManagerRoutes');
app.use('/api/depot-manager', depotManagerRoutes);
console.log('✅ depotManagerRoutes loaded');
} catch (error) {
console.log('❌ depotManagerRoutes error: ', error.message);
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

const depotOperationsManagerNotificationsRoutes = require('./routes/depotOperationsManagerNotificationsRoutes');
app.use('/api', depotOperationsManagerNotificationsRoutes);

const depotManagerNotificationsRoutes = require('./routes/depotManagerNotificationsRoutes');
app.use('/api', depotManagerNotificationsRoutes);
// Add complaint routes
try {
  const complaintRoutes = require('./routes/complaintRoutes');
  app.use('/api/complaints', complaintRoutes);
  console.log('✅ complaintRoutes loaded');
} catch (error) {
  console.log('❌ complaintRoutes error:', error.message);
}

try {
  const notificationRoutes = require('./routes/notificationRoutes');
  app.use('/api/notifications', notificationRoutes);
  console.log('✅ notificationRoutes loaded');
} catch (error) {
  console.log('❌ notificationRoutes error:', error.message);
}

try {
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
  const depotEngineerNotificationRoutes = require('./routes/depotEngineerNotificationRoutes');
  app.use('/api/depot-engineer', depotEngineerNotificationRoutes);
  console.log('✅ depotEngineerNotificationRoutes loaded');
} catch (error) {
  console.log('❌ depotEngineerNotificationRoutes error:', error.message);
}

try {
  const sparePartsRoutes = require('./routes/sparePartsRoutes');
  app.use('/api/depot-engineer/spare-parts', sparePartsRoutes);
  console.log('✅ sparePartsRoutes loaded');
} catch (error) {
  console.log('❌ sparePartsRoutes error:', error.message);
}


try {
  const depotEmergencyRoutes = require('./routes/depotEmergencyRoutes');
  app.use('/api/depot/emergency', depotEmergencyRoutes);
  console.log('✅ depotEmergencyRoutes loaded');
} catch (error) {
  console.log('❌ depotEmergencyRoutes error:', error.message);
}

try {
  const depotManagerRoutes = require('./routes/depotManagerRoutes');
  app.use('/api/depot-manager', depotManagerRoutes);
  console.log('✅ depotManagerRoutes loaded');
} catch (error) {
  console.log('❌ depotManagerRoutes error:', error.message);
}

try {
  const emergencyRoutes = require('./routes/emergencyRoutes');
  app.use('/api/emergency', emergencyRoutes);
  console.log('✅ emergencyRoutes loaded');
} catch (error) {
  console.log('❌ emergencyRoutes error:', error.message);
}

try {
  const serviceScheduleRoutes = require('./routes/serviceScheduleRoutes');
  app.use('/api/depot-engineer/service-schedules', serviceScheduleRoutes);
  console.log('✅ serviceScheduleRoutes loaded');
} catch (error) {
  console.log('❌ serviceScheduleRoutes error:', error.message);
}

try {
  const inspectionRoutes = require('./routes/inspectionRoutes');
  app.use('/api/inspections', inspectionRoutes);
  console.log('✅ inspectionRoutes loaded');
} catch (error) {
  console.log('❌ inspectionRoutes error:', error.message);
}


try {
  const dgmTechnicalRoutes = require('./routes/dgmTechnicalRoutes');
  app.use('/api/dgm-technical', dgmTechnicalRoutes);
  console.log('✅ dgmTechnicalRoutes loaded');
} catch (error) {
  console.log('❌ dgmTechnicalRoutes error:', error.message);
}

try {
  const ceoRoutes = require('./routes/ceoRoutes');
  app.use('/api/ceo', ceoRoutes);
  console.log('✅ ceoRoutes loaded');
} catch (error) {
  console.log('❌ ceoRoutes error:', error.message);
}


try {
  const incidentManagementRoutes = require('./routes/incidentManagementRoutes');
  app.use('/api/incident-management', incidentManagementRoutes);
  console.log('✅ incidentManagementRoutes loaded');
} catch (error) {
  console.log('❌ incidentManagementRoutes error:', error.message);
}


try {
  const rtoRoutes = require('./routes/rtoRoutes');
  app.use('/api/rto', rtoRoutes);
  console.log('✅ rtoRoutes loaded');
} catch (error) {
  console.log('❌ rtoRoutes error:', error.message);
}

try {
  const complaintRoutes = require('./routes/complaintRoutes');
  app.use('/api/complaints', complaintRoutes);
  console.log('✅ complaintRoutes loaded');
} catch (error) {
  console.log('❌ complaintRoutes error:', error.message);
}

// --- THIS IS THE IMPORTANT LINE FOR CREW ROUTES ---
const crewRoutes = require('./routes/crewRoutes');
app.use('/api/crew', crewRoutes);
console.log('✅ crewRoutes loaded');
// ---------------------------------------------------
const depotRoutes = require('./routes/depotRoutes');
app.use('/api/depots', depotRoutes);
console.log('✅ depotRoutes loaded');

const busTripSummaryRoutes = require('./routes/busTripSummaryRoutes');
app.use('/api/trip-summary', busTripSummaryRoutes);
console.log('✅ busTripSummaryRoutes loaded');

const busStatsRoutes = require('./routes/busStatsRoutes');
app.use('/api/bus-stats', busStatsRoutes);
// Other routes...

app.get('/resetPassword.js', (req, res) => {
  res.setHeader('Content-Type', 'application/javascript');
  res.sendFile(path.join(__dirname, 'public/resetPassword.js'));
});

app.get('/reset-password.html', (req, res) => {
  res.setHeader('Content-Type', 'text/html');
  res.sendFile(path.join(__dirname, 'public/reset-password.html'));
});

// Favicon and robots.txt
app.get('/favicon.ico', (req, res) => {
  res.status(204).end();
});

app.get('/robots.txt', (req, res) => {
  res.type('text/plain');
  res.send('User-agent: *\nDisallow: /');
});

// Add communication routes (add this with your other route declarations)
try {
  const communicationRoutes = require('./routes/communicationRoutes');
  app.use('/api/communication', communicationRoutes);
  console.log('✅ communicationRoutes loaded');
} catch (error) {
  console.log('❌ communicationRoutes error:', error.message);  
}

// Error handling middleware (should be added after all routes are registered)
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

// Start server
server.listen(PORT, '0.0.0.0', () => {
  try {
    const { getDynamicBaseURL } = require('./utils/networkUtils');
    const baseURL = getDynamicBaseURL();

    console.log(`🚀 Server is running on ${baseURL}`);
    console.log(`🔌 Socket.IO is running`);
    console.log(`📧 Email service configured: ${process.env.EMAIL_SERVICE || 'smtp'}`);
    console.log(`🌐 Base URL for deep links/web access: ${baseURL}`);
    console.log(`🔐 Password reset endpoint: ${baseURL}/api/password-reset`);
  } catch (error) {
    console.log(`🚀 Server is running on http://localhost:${PORT}`);
    console.log('❌ Network utils error:', error.message);
  }
});
