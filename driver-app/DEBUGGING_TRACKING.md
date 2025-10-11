# 🐛 Debugging Guide - Tracking Not Starting

## Issue Observed
```
10-11 13:11:09.938 I ReactNativeJS: 📱 Starting smart location tracking for EAS build...
```
Nothing happens after this line.

---

## What I Fixed

### 1. **Removed Duplicate Permission Requests**
- BackgroundLocationService was requesting permissions AGAIN
- This could cause the app to hang waiting for user interaction
- Now it only **checks** existing permissions

### 2. **Added Extensive Logging**
The following logs should now appear:

```
📦 BackgroundLocationService module loaded
🔧 Task name: background-location-task
🎯 Defining background task...
🚀 BackgroundLocationService: Starting tracking...
📊 Parameters: { driverId, busId, routeId }
🔍 Platform: android
🔍 Checking existing permissions...
📍 Foreground permission: granted
📍 Background permission: granted/denied
✅ Permissions OK - Background: YES/NO
💾 Storing assignment to AsyncStorage...
✅ Assignment stored successfully
🔍 Checking if task already registered...
📋 Task registered: false/true
🚀 Starting location updates with TaskManager...
✅ Location updates started with TaskManager
💾 Marking tracking as active in AsyncStorage...
✅ Tracking status marked as active
✅ Background location tracking started successfully
```

Then when location updates come:
```
🎯 Background task triggered!
📍 Location received: XX.XXXXXX, YY.YYYYYY
⏱️ Update interval: X.Xs
📦 Sending location update to API...
✅ Location update sent successfully
```

---

## Steps to Debug

### 1. **Rebuild the App**
```powershell
cd driver-app
npx eas build --platform android --profile preview
```

### 2. **Install Fresh Build**
- Uninstall old app completely
- Install new APK
- Clear app data if needed

### 3. **Watch Logs in Real-Time**
```powershell
adb logcat -s ReactNativeJS:* | Select-String "BackgroundLocationService|Starting|Tracking|Location|Permission"
```

### 4. **Test Flow**
1. Open app
2. Login
3. Go to Schedule screen
4. Click "Start Schedule"
5. Watch logs carefully

---

## What to Look For

### ✅ Success Pattern:
```
📱 Starting smart location tracking for EAS build...
🎯 Starting tracking with background permission: true
🚀 BackgroundLocationService: Starting tracking...
📊 Parameters: {...}
🔍 Checking existing permissions...
📍 Foreground permission: granted
📍 Background permission: granted
✅ Permissions OK - Background: YES
💾 Storing assignment to AsyncStorage...
✅ Assignment stored successfully
🔍 Checking if task already registered...
📋 Task registered: false
🚀 Starting location updates with TaskManager...
✅ Location updates started with TaskManager
💾 Marking tracking as active in AsyncStorage...
✅ Tracking status marked as active
✅ Background location tracking started successfully
✅ Tracking started successfully and marked as active
```

### ❌ If Stops After "Starting smart location tracking":
**Problem:** Permission request hanging

**Solution:**
1. Check if permission dialog is shown
2. Make sure you granted both permissions
3. Check Settings → Apps → BusHub → Permissions

### ❌ If Stops After "Checking existing permissions":
**Problem:** Permissions not granted

**Logs to check:**
```
📍 Foreground permission: denied
```

**Solution:**
1. Go to Settings → Apps → BusHub → Permissions → Location
2. Select "Allow all the time"
3. Try again

### ❌ If Stops After "Starting location updates":
**Problem:** TaskManager or Location service failed

**Possible causes:**
1. Google Play Services not updated
2. Location services disabled
3. Battery optimization killing the service

**Solution:**
1. Enable Location Services
2. Update Google Play Services
3. Disable battery optimization for BusHub

### ❌ If Everything Starts But No Updates:
**Problem:** Background task not receiving location updates

**Check:**
```bash
adb logcat | Select-String "Background task triggered"
```

**If you don't see "Background task triggered":**
- Location services might be off
- GPS might not have a fix
- App might need to be in foreground first

---

## Quick Tests

### Test 1: Check Permissions
```powershell
adb shell dumpsys package com.anonymous.driverapp | Select-String "permission"
```

Look for:
- `android.permission.ACCESS_FINE_LOCATION: granted=true`
- `android.permission.ACCESS_BACKGROUND_LOCATION: granted=true`

### Test 2: Check Task Registration
After starting tracking, run:
```javascript
// In React Native Debugger console:
const TaskManager = require('expo-task-manager');
TaskManager.isTaskRegisteredAsync('background-location-task').then(console.log);
```

Should return: `true`

### Test 3: Check AsyncStorage
```javascript
// In React Native Debugger console:
const AsyncStorage = require('@react-native-async-storage/async-storage');
AsyncStorage.getItem('@tracking_status').then(console.log); // Should be 'active'
AsyncStorage.getItem('@active_assignment').then(console.log); // Should have JSON
```

---

## Common Issues & Fixes

### Issue 1: Permission Dialog Not Showing
**Symptom:** Logs stop after "Starting smart location tracking"

**Fix:**
```powershell
# Clear app data
adb shell pm clear com.anonymous.driverapp

# Or manually:
Settings → Apps → BusHub → Storage → Clear Data
```

### Issue 2: Task Not Registered
**Symptom:** `📋 Task registered: false` but then no "✅ Location updates started"

**Fix:**
Check for errors in logs:
```powershell
adb logcat | Select-String "error|Error|ERROR"
```

### Issue 3: No Location Updates
**Symptom:** Everything starts but no "Background task triggered"

**Fix:**
1. **Go outside or near window** (GPS needs clear sky)
2. **Wait 30 seconds** (GPS needs time to get fix)
3. **Move around a bit** (triggers distance-based update)

### Issue 4: Updates Stop After Few Minutes
**Symptom:** Works initially, then stops

**Fix:**
```
Settings → Battery → BusHub Driver → Unrestricted
Settings → Battery → Battery optimization → BusHub → Don't optimize
```

---

## Advanced Debugging

### Enable Verbose Logging
Add to app.json:
```json
{
  "expo": {
    "android": {
      "config": {
        "googleMaps": {
          "apiKey": "YOUR_KEY"
        }
      }
    }
  }
}
```

### Check Native Logs
```powershell
# All logs
adb logcat

# Filter for location
adb logcat | Select-String "Location|GPS|FusedLocation"

# Filter for TaskManager
adb logcat | Select-String "TaskManager|WorkManager"
```

---

## Expected Timeline

After clicking "Start Schedule":

| Time | What Should Happen |
|------|-------------------|
| 0s | Logs: "Starting smart location tracking" |
| 0-2s | Permission check |
| 2-3s | "Starting location updates with TaskManager" |
| 3-5s | "Background location tracking started successfully" |
| 5-10s | First "Background task triggered!" |
| 10-15s | Second location update |
| Every 5s | Subsequent updates |

---

## Next Steps

1. **Rebuild the app** with new logging
2. **Install and test**
3. **Share the complete logs** starting from "Starting smart location tracking"
4. Look for any red flags in the logs

---

## Log Collection Command

Run this and share the output:
```powershell
adb logcat -c  # Clear logs
# Then start the app and click "Start Schedule"
# Wait 30 seconds
adb logcat -d | Select-String "BackgroundLocationService|Starting|Tracking|Location|Permission|Background task" > tracking-logs.txt
```

Send me `tracking-logs.txt` for analysis.

---

*The enhanced logging will help us identify exactly where it's failing!*
