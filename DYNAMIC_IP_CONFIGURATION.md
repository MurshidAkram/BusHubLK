# Dynamic IP Configuration Guide

## Overview
This guide explains the dynamic IP configuration system implemented for BusHubLK mobile app to automatically detect and connect to the backend server.

## Problem Solved
- **Issue**: Mobile app was using hardcoded IP addresses that break when network conditions change
- **Solution**: Implemented dynamic API endpoint discovery that automatically finds the backend server

## Key Components

### 1. Enhanced API Configuration (`src/config/api.ts`)
```typescript
// Features:
- Automatic IP detection from Expo debugger
- Fallback IP testing for multiple network scenarios
- Caching for performance
- Health check functionality
- Easy refresh mechanism
```

### 2. Network Detection (`src/config/networkDetection.ts`)
```typescript
// Capabilities:
- Tests multiple potential backend IPs
- Validates API endpoints before use
- Handles network timeouts gracefully
- Provides detailed logging
```

### 3. Backend Health Endpoint (`backend/server.js`)
```javascript
// New endpoint: GET /api/health
// Returns: { status: 'ok', message: '...', timestamp: '...', version: '...' }
```

## How It Works

### Automatic Discovery Process:
1. **Expo Debugger IP**: First tries IP from Expo's debugger host
2. **Known IPs**: Tests previously working IPs (10.98.151.57, 10.22.165.241)
3. **Common IPs**: Tests standard local network ranges
4. **Fallback**: Uses localhost/Android emulator defaults

### Usage in Code:
```typescript
// Initialize dynamic API connection
await initializeApiConnection();

// Use the discovered API base URL
const response = await fetch(`${API_BASE_URL}/lost-found/reports`);

// Refresh configuration if needed
await refreshApiConfiguration();
```

## Files Modified

### Mobile App:
- ✅ `src/config/api.ts` - Enhanced with dynamic discovery
- ✅ `src/config/networkDetection.ts` - New network utilities
- ✅ `src/screens/LostAndFoundScreen.tsx` - Updated to use dynamic APIs
- ✅ `development.env` - Development configuration
- ✅ `start-app.js` - Startup script with backend detection

### Backend:
- ✅ `server.js` - Added health endpoint at `/api/health`

## Benefits

1. **Automatic**: No manual IP configuration needed
2. **Resilient**: Works across different network conditions
3. **Fast**: Caches working IP for performance
4. **Debuggable**: Comprehensive logging for troubleshooting
5. **Flexible**: Easy to add new IP ranges or modify behavior

## Usage Instructions

### For Development:
1. **Start Backend**: `cd backend && node server.js`
2. **Start Mobile App**: `cd bushublk-mobile && node start-app.js`
   - OR manually: `npx expo start`

### The system will:
- ✅ Automatically detect your backend IP
- ✅ Configure API endpoints dynamically
- ✅ Show clear logs about the discovery process
- ✅ Fall back gracefully if detection fails

## Troubleshooting

### If API calls fail:
1. Check backend is running: `curl http://YOUR_IP:5000/api/health`
2. Check mobile app logs for discovery process
3. Manually refresh: `await refreshApiConfiguration()`

### Common IPs tested:
- **10.98.151.57** - Your current working IP
- **10.22.165.241** - Previously hardcoded IP
- **192.168.x.x** - Local network ranges
- **127.0.0.1** - Localhost
- **10.0.2.2** - Android emulator

## Configuration

### To add new IP ranges:
Edit `POTENTIAL_IPS` array in `src/config/api.ts`

### To modify timeout/retry behavior:
Adjust constants in `networkDetection.ts`

### To disable auto-discovery:
Set `cachedApiBaseUrl` to a fixed URL

## Production Considerations

- Production builds will use the hardcoded production URL
- Development features (discovery, logging) are automatically disabled in production
- Consider implementing server-side service discovery for production environments

This system ensures your mobile app will work seamlessly across different development environments and network configurations without manual intervention.
