#!/usr/bin/env node

/**
 * BusHubLK Mobile App Startup Script
 * This script configures and starts the mobile app with dynamic API discovery
 */

const { exec } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🚍 BusHubLK Mobile App - Startup Script');
console.log('=====================================\n');

// Function to check if backend is running
const checkBackend = async (ip, port) => {
  return new Promise((resolve) => {
    const http = require('http');
    const options = {
      hostname: ip,
      port: port,
      path: '/api/health',
      method: 'GET',
      timeout: 3000
    };

    const req = http.request(options, (res) => {
      if (res.statusCode === 200) {
        console.log(`✅ Backend found at http://${ip}:${port}`);
        resolve(true);
      } else {
        resolve(false);
      }
    });

    req.on('error', () => resolve(false));
    req.on('timeout', () => {
      req.destroy();
      resolve(false);
    });

    req.end();
  });
};

// Main startup function
const startApp = async () => {
  console.log('🔍 Checking for running backend servers...');
  
  // Common IPs to check
  const potentialIPs = [
    '10.98.151.57',  // Current working IP
    '10.22.165.241', // Previous IP
    '192.168.1.1',   // Common router IP
    '127.0.0.1',     // Localhost
    '10.0.2.2',      // Android emulator
  ];

  let foundBackend = false;
  let backendIP = null;

  for (const ip of potentialIPs) {
    console.log(`⏳ Testing ${ip}:5000...`);
    if (await checkBackend(ip, 5000)) {
      foundBackend = true;
      backendIP = ip;
      break;
    }
  }

  if (!foundBackend) {
    console.log('⚠️  No running backend found. Please start your backend server first.');
    console.log('   Run: cd backend && node server.js');
    return;
  }

  console.log(`\n✅ Backend is running at http://${backendIP}:5000`);
  console.log('📱 Starting Expo development server...\n');

  // Start Expo
  const expo = exec('npx expo start', { cwd: __dirname });

  expo.stdout.on('data', (data) => {
    console.log(data);
  });

  expo.stderr.on('data', (data) => {
    console.error(data);
  });

  expo.on('close', (code) => {
    console.log(`Expo process exited with code ${code}`);
  });
};

startApp().catch(console.error);
