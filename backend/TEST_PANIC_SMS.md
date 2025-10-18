# Panic Alert SMS Notification - Debugging Guide

## Issues Fixed:

### 1. **Driver/Bus/Route Info Not Available**
   - **Problem**: The SMS was trying to use `newReport.driver_name`, `newReport.bus_number`, `newReport.route_number` which don't exist on the report object
   - **Fix**: Added database queries to fetch driver, bus, and route details before sending the SMS

### 2. **Better Error Logging**
   - **Problem**: Errors were caught but not logged with enough detail
   - **Fix**: Added comprehensive error logging with stack traces and response details

### 3. **Debug Logging**
   - **Problem**: Hard to tell if the notification system is being triggered
   - **Fix**: Added console logs at each step:
     - `🚨 Panic mode detected - preparing to send SMS notification...`
     - `📱 Sending SMS to Police HQ: {phone}`
     - `✅ Panic alert SMS sent successfully...` or `❌ Failed to send panic alert SMS...`
     - `⚠️ Panic mode is true but incidentType is...` (if condition not met)

## How to Test:

### 1. Check if Environment Variables are Set:
```bash
# In backend directory
node -e "console.log({
  NOTIFY_USER_ID: process.env.NOTIFY_USER_ID,
  NOTIFY_API_KEY: process.env.NOTIFY_API_KEY ? '***SET***' : 'NOT SET',
  NOTIFY_SENDER_ID: process.env.NOTIFY_SENDER_ID
})"
```

### 2. Test the SMS Service Directly:
```javascript
// Create a test file: backend/test-sms.js
const notifySmsService = require('./services/notifySmsService');

(async () => {
  try {
    console.log('Testing SMS service...');
    const result = await notifySmsService.sendSms({
      message: '🚨 TEST: Panic alert system test',
      phoneNumbers: ['0779365318']
    });
    console.log('✅ SMS sent successfully:', result);
  } catch (error) {
    console.error('❌ SMS failed:', error.message);
    console.error('Details:', error);
  }
})();
```

Run it:
```bash
cd backend
node test-sms.js
```

### 3. Test Panic Button Flow:
1. Open driver app
2. Press the PANIC BUTTON
3. Check backend console logs for:
   - `🚨 Panic mode detected - preparing to send SMS notification...`
   - `📱 Sending SMS to Police HQ: 0779365318`
   - `✅ Panic alert SMS sent successfully...` or error details

### 4. Check Database Connection:
The SMS system now queries the database for:
- Driver name: `SELECT first_name, last_name FROM drivers WHERE driver_id = $1`
- Bus number: `SELECT registration_number FROM buses WHERE bus_id = $1`
- Route number: `SELECT r.route_number FROM daily_assignments da JOIN routes r...`

If these queries fail, the SMS will still send with "Unknown" values.

## Expected SMS Format:

```
🚨 PANIC ALERT - Driver Emergency

Driver: John Doe
Bus: ABC-1234
Route: 138

Location: https://www.google.com/maps?q=6.9271,79.8612

Description: 🚨 PANIC BUTTON ACTIVATED - IMMEDIATE ASSISTANCE REQUIRED

Time: 10/18/2025, 2:30:45 PM

⚠️ IMMEDIATE RESPONSE REQUIRED!
```

## Common Issues:

### Issue 1: "Notify.lk SMS credentials are not configured"
**Solution**: Set these environment variables in `.env`:
```
NOTIFY_USER_ID=your_user_id
NOTIFY_API_KEY=your_api_key
NOTIFY_SENDER_ID=your_sender_id
```

### Issue 2: "no destination numbers after normalization"
**Solution**: The phone number `0779365318` should normalize to `94779365318` (11 digits)
- If it's not working, check the normalizeToDialString function
- Verify DEFAULT_COUNTRY_CODE is set to '94'

### Issue 3: SMS not triggered at all
**Check**: 
- Is `panic_mode` set to `true` in the request?
- Is `incidentType` exactly `'Panic Alert'`?
- Look for the warning log: `⚠️ Panic mode is true but incidentType is...`

### Issue 4: Database queries fail
**Check**:
- Driver exists: `SELECT * FROM drivers WHERE driver_id = {id}`
- Bus exists: `SELECT * FROM buses WHERE bus_id = {id}`
- Assignment exists: `SELECT * FROM daily_assignments WHERE assignment_id = {id}`

## Monitoring:

Watch the backend logs in real-time:
```bash
# If using PM2
pm2 logs backend --lines 100

# Or if running with npm/node
# Just watch the console output
```

Look for these key indicators:
- ✅ Success: `Panic alert SMS sent successfully`
- ❌ Error: `Failed to send panic alert SMS`
- ⚠️ Warning: `Could not fetch all details for panic SMS`
