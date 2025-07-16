const express = require('express');
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

app.use('/api/passengers', passengerAuthRoutes); // handles /login, /register, etc.
app.use('/api/passengers', passengerRoutes);     // handles /contacts, /alerts, etc.
const BusOccupancyRoutes = require('./routes/BusOccupancyRoutes');

app.use('/api/bus-occupancy', require('./routes/BusOccupancyRoutes'));

app.listen(PORT, () => {
  console.log(`🚀 Server is running on http://localhost:${PORT}`);
});
//console.log('Is passengerRoutes object loaded correctly?', passengerRoutes);
// Add this to your existing routes file or create if it doesn't exist




