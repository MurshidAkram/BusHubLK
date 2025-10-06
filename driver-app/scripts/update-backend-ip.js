#!/usr/bin/env node

/**
 * Update Backend IP Configuration
 * 
 * This script automatically updates the backend API URL in app.json
 * Usage: node scripts/update-backend-ip.js [ip-address]
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

function getLocalIP() {
  try {
    // For Windows
    if (process.platform === 'win32') {
      const output = execSync('ipconfig', { encoding: 'utf-8' });
      const ipv4Match = output.match(/IPv4 Address[.\s]*:\s*(\d+\.\d+\.\d+\.\d+)/);
      if (ipv4Match) {
        return ipv4Match[1];
      }
    } 
    // For macOS/Linux
    else {
      const output = execSync('ifconfig', { encoding: 'utf-8' });
      const ipMatch = output.match(/inet (\d+\.\d+\.\d+\.\d+)/);
      if (ipMatch && ipMatch[1] !== '127.0.0.1') {
        return ipMatch[1];
      }
    }
  } catch (error) {
    console.error('❌ Error detecting IP:', error.message);
  }
  return null;
}

function updateAppJson(ipAddress) {
  const appJsonPath = path.join(__dirname, '..', 'app.json');
  
  try {
    // Read app.json
    const appJson = JSON.parse(fs.readFileSync(appJsonPath, 'utf-8'));
    
    // Update API URL
    const newApiUrl = `http://${ipAddress}:5000/api`;
    
    if (!appJson.expo.extra) {
      appJson.expo.extra = {};
    }
    
    const oldApiUrl = appJson.expo.extra.apiUrl;
    appJson.expo.extra.apiUrl = newApiUrl;
    
    // Write back to app.json
    fs.writeFileSync(appJsonPath, JSON.stringify(appJson, null, 2), 'utf-8');
    
    console.log('✅ Updated app.json successfully!');
    console.log(`   Old URL: ${oldApiUrl || 'Not set'}`);
    console.log(`   New URL: ${newApiUrl}`);
    console.log('');
    console.log('📱 Next steps:');
    console.log('   1. Rebuild your app: npx eas build --platform android');
    console.log('   2. Or restart Expo Go: npx expo start --clear');
    
  } catch (error) {
    console.error('❌ Error updating app.json:', error.message);
    process.exit(1);
  }
}

// Main execution
const args = process.argv.slice(2);
let ipAddress = args[0];

if (!ipAddress) {
  console.log('🔍 No IP address provided, detecting automatically...');
  ipAddress = getLocalIP();
  
  if (!ipAddress) {
    console.error('❌ Could not detect IP address automatically.');
    console.log('');
    console.log('Usage:');
    console.log('  node scripts/update-backend-ip.js [ip-address]');
    console.log('');
    console.log('Example:');
    console.log('  node scripts/update-backend-ip.js 192.168.1.100');
    process.exit(1);
  }
  
  console.log(`✅ Detected IP: ${ipAddress}`);
}

// Validate IP address format
const ipRegex = /^(\d{1,3}\.){3}\d{1,3}$/;
if (!ipRegex.test(ipAddress)) {
  console.error(`❌ Invalid IP address format: ${ipAddress}`);
  process.exit(1);
}

updateAppJson(ipAddress);
