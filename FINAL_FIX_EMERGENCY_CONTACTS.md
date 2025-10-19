# FINAL FIX - Emergency Contacts - Step by Step

## The Root Cause Found! 🎯

The passengerRoutes was failing to load because of:
1. ❌ `nodemailer.createTransporter` should be `nodemailer.createTransport` (typo!)
2. ❌ Missing `setPrimaryContact` function in controller
3. ❌ Wrong foreign key in database (references `passengers` instead of `users`)

## Step-by-Step Fix

### Step 1: Upload Fixed Controller to AWS

The file `c:\Users\ACER\OneDrive - stu.ucsc.cmb.ac.lk\Documents\passengerController.js` has been fixed with:
- ✅ Fixed `createTransport` typo
- ✅ Added `setPrimaryContact` function
- ✅ Added `setPrimaryContact` to exports
- ✅ Better error logging
- ✅ Graceful handling if nodemailer is missing

```bash
# Upload the fixed file
scp -i path/to/your-key.pem \
  "c:\Users\ACER\OneDrive - stu.ucsc.cmb.ac.lk\Documents\passengerController.js" \
  ubuntu@43.205.127.30:~/BusHubLK/backend/controllers/
```

### Step 2: Fix Database Foreign Key

```bash
# SSH into AWS
ssh -i path/to/your-key.pem ubuntu@43.205.127.30

# Fix the foreign key
psql -U murshid -d bushublk << 'EOF'
-- Drop the wrong foreign key
ALTER TABLE emergency_contacts
DROP CONSTRAINT IF EXISTS emergency_contacts_passenger_id_fkey;

-- Add the correct foreign key
ALTER TABLE emergency_contacts
ADD CONSTRAINT emergency_contacts_passenger_id_fkey
FOREIGN KEY (passenger_id)
REFERENCES users(user_id)
ON DELETE CASCADE;

-- Verify the change
SELECT
    tc.constraint_name,
    tc.table_name,
    kcu.column_name,
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
    ON tc.constraint_name = kcu.constraint_name
JOIN information_schema.constraint_column_usage AS ccu
    ON ccu.constraint_name = tc.constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY'
    AND tc.table_name = 'emergency_contacts';
EOF
```

Expected output:
```
           constraint_name            |     table_name      | column_name | foreign_table_name | foreign_column_name
--------------------------------------+--------------------+-------------+--------------------+--------------------
 emergency_contacts_passenger_id_fkey | emergency_contacts | passenger_id| users              | user_id
```

### Step 3: Restart Backend

```bash
pm2 restart backend
```

### Step 4: Check Logs

```bash
pm2 logs --lines 50
```

**Look for SUCCESS:**
```
✅ passengerRoutes loaded
[passengerController] ✅ Email transporter initialized with Nodemailer
```

**If you see ERROR:**
```
❌ passengerRoutes error: ...
```

Then something is still wrong.

### Step 5: Test API Endpoints

```bash
# Test get contacts
curl http://43.205.127.30:5000/api/passengers/14/contacts

# Expected: [] or [{"id":1,...}]
# Wrong: Cannot GET /api/passengers/14/contacts
```

### Step 6: Test in Mobile App

1. Open Emergency Alert screen
2. Go to Contacts tab
3. Try adding a contact
4. Check PM2 logs for:

```
[addEmergencyContact] Adding contact for passenger_id: 14
[addEmergencyContact] Contact data: {name: "John", phone: "1234567890",...}
[addEmergencyContact] Contact created successfully: {id: 1,...}
```

## Quick Verification Checklist

- [ ] Uploaded fixed passengerController.js to AWS
- [ ] Ran SQL to fix foreign key
- [ ] Verified foreign key now points to `users.user_id`
- [ ] Restarted backend with `pm2 restart backend`
- [ ] Checked logs show `✅ passengerRoutes loaded`
- [ ] Tested `curl http://43.205.127.30:5000/api/passengers/14/contacts` returns `[]`
- [ ] Tested adding contact in mobile app
- [ ] Checked PM2 logs show contact was added successfully

## What Was Fixed

| Issue | Before | After |
|-------|--------|-------|
| Nodemailer | `createTransporter` ❌ | `createTransport` ✅ |
| setPrimaryContact | Missing ❌ | Added ✅ |
| Foreign Key | `passengers.passenger_id` ❌ | `users.user_id` ✅ |
| Error Logging | Minimal ❌ | Detailed ✅ |

## If It Still Doesn't Work

1. Check PM2 error logs:
```bash
pm2 logs backend --err --lines 100
```

2. Check if nodemailer is installed:
```bash
cd ~/BusHubLK/backend
npm list nodemailer
```

If not installed:
```bash
npm install nodemailer
pm2 restart backend
```

3. Check database connection:
```bash
psql -U murshid -d bushublk -c "\d emergency_contacts"
```

4. Test the route directly:
```bash
curl -v http://localhost:5000/api/passengers/14/contacts
```

Look for HTTP 200, not 404.
