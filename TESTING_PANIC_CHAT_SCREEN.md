# 🧪 Testing Instructions - Panic Button Chat Screen Fix

## 📋 Pre-Test Checklist

- [ ] Backend server running with latest changes
- [ ] Driver app Metro bundler running
- [ ] Driver logged in with valid session
- [ ] Driver has active assignment (bus_id, route_id, assignment_id)

## 🎯 Test Scenario: Create Panic Alert and View Chat

### Step 1: Clear Previous Test Data (Optional)
```bash
# In backend directory
node -e "const pool = require('./config/db'); pool.query('DELETE FROM emergency_messages WHERE report_id > 76', (err) => { if(err) console.error(err); pool.query('DELETE FROM emergency_reports WHERE id > 76', (err2) => { if(err2) console.error(err2); else console.log('✅ Cleared test data'); pool.end(); }); });"
```

### Step 2: Prepare Backend Console
1. Open terminal in backend directory
2. Run: `npm start` (or `npx nodemon server.js`)
3. Watch for these logs during test:
   ```
   📝 Creating emergency report with data: {...}
   ✅ Emergency report created with ID: 77
   ✅ Initial message added to report: 77
   💾 Committing transaction for emergency report: 77
   ✅ Transaction committed successfully for report: 77
   📤 Sending response to client with report ID: 77
   ✅ Response sent successfully for report: 77
   ```

### Step 3: Test Panic Button in Driver App

#### 3.1: Navigate to Emergency Screen
1. Open driver app (should be logged in)
2. Tap **Emergency** from home screen or bottom tabs

#### 3.2: Activate Panic Button
1. Tap the large red **Panic Button** at the top
2. Countdown will start: 10...9...8...
3. **Either:**
   - Let it count down to 0 (auto-submit)
   - OR tap **"Send Now"** button

#### 3.3: Watch Mobile App Logs
Look for these logs in Metro bundler:
```
📝 Emergency submission data: {
  "driver_id": 38,
  "bus_id": 22,
  "assignment_id": 222,
  "incidentType": "Panic Alert",
  ...
}
📥 Received emergency report response: {
  "id": 77,
  "incident_type": "Panic Alert",
  "status": "New",
  ...
}
✅ Emergency report created successfully with ID: 77
```

#### 3.4: Check Success Alert
Alert should appear:
```
┌────────────────────────────────────┐
│  ✅ Emergency Report Sent          │
│                                     │
│  Report ID: 77                      │
│                                     │
│  Emergency services have been       │
│  notified. Stay safe and follow     │
│  emergency protocols.               │
│                                     │
│        [ View Response ]            │
└────────────────────────────────────┘
```

**✅ CHECKPOINT 1:** Report ID should be a valid number (e.g., 77)

### Step 4: Click "View Response"

#### 4.1: Tap "View Response" Button
- App adds 500ms delay
- Then navigates to ChatScreen

#### 4.2: Watch Mobile App Logs
Look for:
```
🔄 Navigating to ChatScreen with report: 77
🔍 Fetching messages for report ID: 77
📡 Response status: 200
✅ Fetched report with messages: {...}
✅ Loaded 1 messages
✅ Depot contact number loaded
```

**✅ CHECKPOINT 2:** Response status should be **200**, not 404

#### 4.3: Verify Chat Screen UI
Chat screen should show:
- **Header:** "Panic Alert" with status badge
- **Initial Message:** 
  ```
  Report Details:
  - Type: Panic Alert
  - Description: [your panic alert details]
  ```
- **Text Input:** At bottom for sending messages
- **Call Depot Button:** If depot phone available

**❌ FAILURE CASE:** If you see:
```
❌ Server error response: 404 {"message":"Emergency report not found."}
❌ Report ID 77 not found in database!
```

### Step 5: Verify in Database

#### 5.1: Check Report Exists
```bash
node -e "const pool = require('./config/db'); pool.query('SELECT id, incident_type, status, created_at FROM emergency_reports WHERE id = 77', (err, res) => { if(err) console.error(err); else if(res.rows.length === 0) console.log('❌ Report 77 NOT FOUND'); else console.log('✅ Report found:', res.rows[0]); pool.end(); })"
```

**Expected Output:**
```
✅ Report found: {
  id: 77,
  incident_type: 'Panic Alert',
  status: 'New',
  created_at: 2025-10-18T07:00:26.233Z
}
```

#### 5.2: Check Initial Message
```bash
node -e "const pool = require('./config/db'); pool.query('SELECT * FROM emergency_messages WHERE report_id = 77', (err, res) => { if(err) console.error(err); else console.log('Messages:', res.rows.length); pool.end(); })"
```

**Expected:** At least 1 message

### Step 6: Test Chat Functionality

#### 6.1: Send a Message
1. In chat screen, type a test message: "Test message from driver"
2. Tap send button (paper plane icon)
3. Message should appear in chat immediately

#### 6.2: Verify Message Sent
Backend logs should show:
```
POST /api/emergency/77/messages 201
```

### Step 7: Test History View

#### 7.1: Go Back to Emergency Screen
- Tap back button or navigate away from chat

#### 7.2: Switch to "History" Tab
- Tap the "History" tab in Emergency screen

#### 7.3: Verify Report Appears
- Your panic alert should appear in the history list
- Status: "New" or "Acknowledged"
- Shows incident type and time

#### 7.4: Tap History Item
- Tap on the panic alert in history
- Should navigate to ChatScreen
- Should load messages successfully

## 🔍 Debugging Guide

### Problem: 404 Error When Opening Chat

**Symptom:**
```
❌ Server error response: 404 {"message":"Emergency report not found."}
```

**Diagnosis Steps:**

1. **Check backend logs for COMMIT:**
   ```
   Look for: ✅ Transaction committed successfully for report: 77
   Missing? Transaction was rolled back!
   ```

2. **Check for errors before COMMIT:**
   ```
   Look between:
   ✅ Emergency report created with ID: 77
   AND
   💾 Committing transaction for emergency report: 77
   
   Any errors here = transaction will rollback
   ```

3. **Check database directly:**
   ```bash
   node -e "const pool = require('./config/db'); pool.query('SELECT MAX(id) FROM emergency_reports', (err, res) => { console.log('Max ID:', res.rows[0].max_id); pool.end(); })"
   ```
   If max ID is less than the ID shown in alert, report was rolled back.

4. **Check for duplicate key errors:**
   Backend logs might show:
   ```
   ERROR: duplicate key value violates unique constraint
   ```

5. **Check foreign key constraints:**
   ```
   ERROR: insert or update on table "emergency_reports" violates foreign key constraint
   ```
   Means driver_id, bus_id, or assignment_id doesn't exist in database.

### Problem: Report ID is "Unknown"

**Symptom:**
```
Report ID: Unknown
```

**Cause:** Backend didn't return `id` field in response

**Check:**
1. Backend console for: `📤 Sending response to client with report ID: [undefined]`
2. If undefined, report creation failed but didn't throw error

### Problem: Messages Don't Load

**Symptom:**
- Chat screen opens successfully
- No messages appear
- No error message

**Check:**
1. Look for: `⚠️ No messages found in response`
2. Query database:
   ```sql
   SELECT * FROM emergency_messages WHERE report_id = 77;
   ```
3. If no messages, initial message creation failed

### Problem: Backend Not Responding

**Symptom:**
```
Network request failed
```

**Check:**
1. Backend server running?
2. Correct API_BASE_URL in driver app?
3. Phone/emulator can reach backend server?

## ✅ Success Criteria

All of these must be TRUE:

- [x] Backend logs show: "✅ Transaction committed successfully"
- [x] Backend logs show: "✅ Response sent successfully"
- [x] Mobile app receives report with valid ID
- [x] Alert shows: "Report ID: 77" (not "Unknown")
- [x] ChatScreen loads without 404 error
- [x] Initial message appears in chat
- [x] Can send new messages in chat
- [x] Report appears in history tab
- [x] Database contains report with correct ID
- [x] Database contains at least 1 message for report

## 📊 Expected Backend Console Output

Complete sequence:
```bash
📝 Creating emergency report with data: {
  "driver_id": 38,
  "bus_id": 22,
  "assignment_id": 222,
  "incidentType": "Panic Alert",
  ...
}
✅ Emergency report created with ID: 77
✅ Initial message added to report: 77
🚨 Panic mode detected - fetching details for SMS notification...
✓ Driver: Thag siva
✓ Bus: WP-9871
✓ Route: 120
💾 Committing transaction for emergency report: 77
✅ Transaction committed successfully for report: 77
📱 Preparing SMS notification...
📱 Sending SMS to Police HQ: 0779365318
❌ Failed to send panic alert SMS to Police HQ: (balance error) ← OK, this is expected
📤 Sending response to client with report ID: 77
✅ Response sent successfully for report: 77
🔌 Database client released
POST /api/emergency 201 1720.281 ms - 428
```

Then when opening chat:
```bash
GET /api/emergency/77 200 50.123 ms - 456
```

## 📝 Notes

- SMS failure is **expected** due to notify.lk balance
- SMS failure should **NOT** prevent report creation
- Transaction must commit even if SMS fails
- 500ms delay helps ensure database consistency
- Report ID should always be a number, never "Unknown"

## 🎬 Next Steps After Success

Once panic alert chat works:
1. Test regular emergency reports (non-panic)
2. Test depot responses (need depot user)
3. Test status updates (Acknowledged → Resolved)
4. Add notify.lk credit to enable SMS
