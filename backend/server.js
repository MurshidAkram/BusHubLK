const express = require('express');
const path = require('path');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(helmet());
app.use(morgan('dev'));
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Sample route
app.get('/', (req, res) => {
  res.send('🚍 BusHubLK API is running');
});

// Add routes here later
const dbTestRoute = require('./routes/dbTestRoute');
app.use('/api', dbTestRoute);

const authRoutes = require('./routes/authRoutes');
app.use('/api/auth', authRoutes);

const userRoutes = require('./routes/userRoutes');
app.use('/api/users', userRoutes);

const driverAuthRoutes = require('./routes/driverAuth');
app.use('/api/driver', driverAuthRoutes);

const passengerRoutes = require('./routes/passengerRoutes');
const passengerAuthRoutes = require('./routes/passengerAuth');
const BusOccupancyRoutes = require('./routes/BusOccupancyRoutes');
const passwordResetRoutes = require('./routes/passwordReset');
const { getDynamicBaseURL } = require('./utils/networkUtils');

app.use('/api/passengers', passengerAuthRoutes);
app.use('/api/passengers', passengerRoutes);  
app.use('/api/bus-occupancy', BusOccupancyRoutes);
app.use('/api/password-reset', passwordResetRoutes);
app.get('/resetPassword.js', (req, res) => {
  res.setHeader('Content-Type', 'application/javascript');
  res.sendFile(path.join(__dirname, 'public/resetPassword.js'));
});
app.listen(PORT, '0.0.0.0', () => {
  const baseURL = getDynamicBaseURL();
  console.log(`🚀 Server is running on ${baseURL}`);
  console.log(`📧 Email service configured: ${process.env.EMAIL_SERVICE || 'gmail'}`);
  console.log(`🌐 Base URL: ${baseURL}`);
});
module.exports = app;

