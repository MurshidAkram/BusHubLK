# Emergency Contacts Fix - Manual Steps

## The Problem
`passengerRoutes` is not loading because the AWS server has an old version of `passengerController.js` that doesn't export `setPrimaryContact`.

## Solution: Upload Files Manually

### Step 1: Upload ALL These Files to AWS

Use FileZilla, WinSCP, or command line:

```bash
# Using SCP from Git Bash or WSL on Windows:

cd C:/Users/ACER/Downloads/BusHubLK

# Upload Model (has setPrimaryContact method)
scp -i path/to/your-key.pem backend/models/passengerModel.js ubuntu@43.205.127.30:~/BusHubLK/backend/models/

# Upload Controller (has setPrimaryContact controller + better logging)
scp -i path/to/your-key.pem backend/controllers/passengerController.js ubuntu@43.205.127.30:~/BusHubLK/backend/controllers/

# Upload Routes (has setPrimaryContact route)
scp -i path/to/your-key.pem backend/routes/passengerRoutes.js ubuntu@43.205.127.30:~/BusHubLK/backend/routes/

# Upload Server (has better error logging)
scp -i path/to/your-key.pem backend/server.js ubuntu@43.205.127.30:~/BusHubLK/backend/

# Upload SQL migration
scp -i path/to/your-key.pem backend/sql/fix_emergency_contacts_foreign_key.sql ubuntu@43.205.127.30:~/BusHubLK/backend/sql/
```

### Step 2: SSH into AWS

```bash
ssh -i path/to/your-key.pem ubuntu@43.205.127.30
```

### Step 3: Run SQL Migration

```bash
cd ~/BusHubLK
psql -U postgres -d bushublk < backend/sql/fix_emergency_contacts_foreign_key.sql
```

Expected output:
```
 count
-------
     0
(1 row)

ALTER TABLE
ALTER TABLE
[... verification output ...]
```

### Step 4: Restart Backend

```bash
pm2 restart backend
```

### Step 5: Check Logs

```bash
pm2 logs --lines 50
```

**Look for these SUCCESS messages:**
```
✅ passengerRoutes loaded
```

**If you see this ERROR:**
```
❌ passengerRoutes error: Cannot find module '../controllers/passengerController'
```
OR
```
❌ passengerRoutes error: setPrimaryContact is not a function
```

Then the files weren't uploaded correctly. Re-upload and restart.

### Step 6: Test the API

```bash
# Test from AWS server
curl http://localhost:5000/api/passengers/14/contacts

# Test from your machine
curl http://43.205.127.30:5000/api/passengers/14/contacts
```

**Expected response:**
```json
[]
```
or
```json
[{"id":1,"emergency_contact_name":"John","emergency_contact_phone":"123456",...}]
```

**Wrong response (routes not loaded):**
```
Cannot GET /api/passengers/14/contacts
```

## If It Still Doesn't Work

Check the detailed error logs:

```bash
pm2 logs backend --err --lines 100
```

Look for:
- Module not found errors
- Missing export errors
- Database connection errors

## Quick Verification Checklist

- [ ] Uploaded `backend/models/passengerModel.js` to AWS
- [ ] Uploaded `backend/controllers/passengerController.js` to AWS
- [ ] Uploaded `backend/routes/passengerRoutes.js` to AWS
- [ ] Uploaded `backend/server.js` to AWS
- [ ] Ran SQL migration
- [ ] Restarted backend with `pm2 restart backend`
- [ ] Checked logs show `✅ passengerRoutes loaded`
- [ ] Tested API endpoint returns `[]` instead of 404

## Alternative: Use Git

If you have git set up on AWS:

```bash
# On your Windows machine
cd C:/Users/ACER/Downloads/BusHubLK
git add -A
git commit -m "Fix emergency contacts routes"
git push origin main

# On AWS
ssh -i path/to/your-key.pem ubuntu@43.205.127.30
cd ~/BusHubLK
git pull origin main
psql -U postgres -d bushublk < backend/sql/fix_emergency_contacts_foreign_key.sql
pm2 restart backend
pm2 logs --lines 30
```
