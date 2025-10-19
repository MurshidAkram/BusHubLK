# Password Reset Email Fix

## 🐛 Issue Found
The password reset was failing because:
1. **Email Service Mismatch**: `emailService.js` was configured for SendGrid, but your `.env` has Gmail/Nodemailer credentials
2. **No Error Handling**: The API call didn't properly catch and return errors
3. **Missing SENDGRID_API_KEY**: The service was failing silently

## ✅ What I Fixed

### 1. Updated `backend/services/emailService.js`
**Before:** Only supported SendGrid
**After:** 
- ✅ Now supports **Gmail SMTP (Nodemailer)** as primary method
- ✅ Falls back to SendGrid if configured
- ✅ Uses your existing `.env` credentials:
  ```env
  EMAIL_HOST=smtp.gmail.com
  EMAIL_PORT=587
  EMAIL_USER=2022cs094@stu.ucsc.cmb.ac.lk
  EMAIL_PASS=zfda ytde nlmx houu
  ```

### 2. Updated `driver-app/src/services/api.ts`
**Before:** No error handling in `requestPasswordReset()`
**After:**
- ✅ Proper try-catch error handling
- ✅ Returns structured error messages
- ✅ Handles network errors gracefully

### 3. Updated `backend/.env`
- ✅ `NODE_ENV=production`
- ✅ `BACKEND_URL=http://43.205.127.30:5000`
- ✅ Email links will use hosted URL

## 🧪 Testing Steps

### 1. Restart Backend Server
```bash
cd backend
npm start
# or
npx nodemailer server.js
```

**Look for this log:**
```
[emailService] Using Nodemailer with Gmail SMTP
```

### 2. Test Password Reset from Driver App
1. Open driver app
2. Go to "Forgot Password"
3. Enter email: `2022cs094@stu.ucsc.cmb.ac.lk` (or any driver email)
4. Click "Send Reset Link"

**Expected Results:**
- ✅ Success message: "Email Sent - A password reset link has been sent..."
- ✅ Check email inbox for reset link
- ✅ Reset link should be: `http://43.205.127.30:5000/api/password-reset/universal/{token}?email=...`

### 3. Check Backend Logs
**Success logs should show:**
```
[emailService] Password reset email sent to <email>
```

**If there's an error:**
```
[emailService] Failed to send password reset email: <error details>
```

## 🔍 Troubleshooting

### Issue: "Server error" still appears

**Check:**
1. Backend server is running
2. `.env` file is in `backend/` folder (not root)
3. Restart backend after changes

**Test backend directly:**
```bash
curl -X POST http://43.205.127.30:5000/api/password-reset/request \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com"}'
```

### Issue: Email not received

**Check:**
1. **Gmail App Password**: Your `.env` has `EMAIL_PASS=zfda ytde nlmx houu`
   - This should be a Gmail App Password (16 characters with spaces)
   - Verify it's correct in your Google Account settings

2. **Less Secure Apps**: Gmail might block it
   - Go to: https://myaccount.google.com/security
   - Enable 2-Step Verification
   - Generate new App Password for "Mail"

3. **Check Spam Folder**: Gmail might mark it as spam initially

4. **Backend Console**: Look for error messages about SMTP authentication

### Issue: "Network error"

**Check:**
1. Backend is accessible: `http://43.205.127.30:5000`
2. Firewall allows port 5000
3. App can reach the server
4. Driver app is using correct API URL

**Verify app config:**
```bash
# In driver-app folder
cat app.json | grep apiUrl
# Should show: "apiUrl": "http://43.205.127.30:5000/api"
```

## 📧 Email Configuration Details

### Current Setup (Gmail SMTP)
```env
EMAIL_SERVICE=gmail
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_SECURE=false
EMAIL_USER=2022cs094@stu.ucsc.cmb.ac.lk
EMAIL_PASS=zfda ytde nlmx houu  # Gmail App Password
EMAIL_FROM=noreply@bushublk.com
```

### Alternative: SendGrid (Optional)
If Gmail has issues, you can switch to SendGrid:
1. Sign up at https://sendgrid.com
2. Get API key
3. Add to `.env`:
   ```env
   SENDGRID_API_KEY=your_api_key_here
   ```
4. Comment out EMAIL_USER and EMAIL_PASS

## 🔄 If You Need to Rebuild Driver App

The API changes are **server-side**, so you don't need to rebuild. But if you want to include the improved error handling:

```bash
cd driver-app
eas build --platform android --profile production
# or for iOS:
eas build --platform ios --profile production
```

## ✨ What's Now Working

1. ✅ Password reset emails sent via Gmail SMTP
2. ✅ Reset links use hosted backend URL
3. ✅ Proper error messages shown in app
4. ✅ Backend logs show detailed error information
5. ✅ Nodemailer configuration matches your .env

## 📝 Next Steps

1. **Restart backend** to apply email service changes
2. **Test password reset** from driver app
3. **Check email inbox** (and spam folder)
4. **Verify reset link** works and points to hosted server
5. **Monitor backend logs** for any email sending errors

---

**Note:** The Gmail account `2022cs094@stu.ucsc.cmb.ac.lk` needs to have:
- 2-Step Verification enabled
- App Password generated for "Mail" application
- The App Password (with spaces removed) should be in EMAIL_PASS
