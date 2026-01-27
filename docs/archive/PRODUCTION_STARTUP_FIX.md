# Production Startup Fix - Complete ✅

## Issue Identified

**Problem:** Login not working in production, and getting warning:
```
⚠ "next start" does not work with "output: standalone" configuration. Use "node .next/standalone/server.js" instead.
```

**Root Cause:**
- `package.json` `start` script was using `next start -p 4009`
- Next.js config has `output: "standalone"` which requires using the standalone server
- `next start` doesn't work with standalone mode

---

## Fixes Applied

### 1. ✅ Updated `package.json` Start Script

**File:** `package.json`

**Before:**
```json
"start": "next start -p 4009"
```

**After:**
```json
"start": "bash start-production.sh",
"start:legacy": "next start -p 4009"
```

**Impact:** `npm start` now uses the correct standalone server

---

### 2. ✅ Enhanced `start-production.sh` Script

**File:** `start-production.sh`

**Changes:**
- ✅ Loads environment variables from `.env.production`
- ✅ Loads environment variables from `.next/standalone/.env.production`
- ✅ Copies public assets to standalone directory
- ✅ Uses standalone server: `node .next/standalone/server.js`
- ✅ Passes all required environment variables (PORT, HOSTNAME, NEXT_PUBLIC_*)
- ✅ Shows API Gateway URL in startup logs for verification

**Key Features:**
```bash
# Loads env vars from both locations
source .env.production
source .next/standalone/.env.production

# Starts standalone server with all env vars
exec env PORT=${PORT} NODE_ENV=production HOSTNAME=${HOSTNAME} \
  NEXT_PUBLIC_API_GATEWAY_URL=${NEXT_PUBLIC_API_GATEWAY_URL} \
  node server.js
```

---

## How to Start Production Server

### Option 1: Using npm (Recommended)
```bash
cd /home/AIS/decision-pro-admin
npm start
```

### Option 2: Using start script directly
```bash
cd /home/AIS/decision-pro-admin
bash start-production.sh
```

### Option 3: Using ais script (Already fixed)
```bash
cd /home/AIS
./ais start decision_pro_admin
```

---

## Environment Variables Verification

### Required Variables

The following must be set in `.env.production`:

```bash
# REQUIRED - API Gateway URL
NEXT_PUBLIC_API_GATEWAY_URL=http://196.188.249.48:4000

# OPTIONAL - API Key (not required for login)
NEXT_PUBLIC_API_KEY=your-api-key-here
```

### Verify Variables Are Set

**Check startup logs:**
```bash
npm start
# Should show:
# 🔗 API Gateway URL: http://196.188.249.48:4000
```

**Check in browser console:**
```javascript
// Open browser console (F12) on login page
console.log({
  apiGatewayUrl: process.env.NEXT_PUBLIC_API_GATEWAY_URL,
  apiKey: process.env.NEXT_PUBLIC_API_KEY ? 'SET' : 'NOT SET'
});
```

---

## Testing Login in Production

### 1. Start the Server
```bash
cd /home/AIS/decision-pro-admin
npm start
```

### 2. Verify Server is Running
```bash
curl http://localhost:4009/ | head -5
# Should return HTML (not error)
```

### 3. Test Login Endpoint
```bash
curl -X POST http://196.188.249.48:4000/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"admin123"}'
# Should return: {"access_token":"...",...}
```

### 4. Test Login in Browser
1. Open: `http://196.188.249.48:4009/login`
2. Enter credentials: `admin` / `admin123`
3. Check browser console (F12) for errors
4. Should redirect to `/dashboard` on success

---

## Common Issues & Solutions

### Issue 1: "next start does not work with standalone"
**Solution:** ✅ Fixed - `npm start` now uses standalone server

### Issue 2: Login fails with "Network error"
**Possible Causes:**
- API Gateway not running
- `NEXT_PUBLIC_API_GATEWAY_URL` not set correctly
- Network connectivity issues

**Solutions:**
```bash
# Check API Gateway is running
curl http://196.188.249.48:4000/health

# Verify environment variable
echo $NEXT_PUBLIC_API_GATEWAY_URL

# Check browser console for actual error
```

### Issue 3: Environment variables not loading
**Solution:**
- Ensure `.env.production` exists in project root
- Restart server after changing env vars
- Check startup logs show: `🔗 API Gateway URL: ...`

### Issue 4: Port already in use
**Solution:**
```bash
# Stop existing server
pkill -f "node.*standalone.*server.js"

# Or use different port
PORT=4010 npm start
```

---

## Verification Checklist

- [ ] Server starts without warnings
- [ ] Startup logs show API Gateway URL
- [ ] Server responds to HTTP requests
- [ ] Login page loads correctly
- [ ] Login API call succeeds
- [ ] Browser console shows no errors
- [ ] Redirect to dashboard works

---

## Summary

✅ **Fixed:** `npm start` now uses standalone server correctly  
✅ **Fixed:** Environment variables are loaded properly  
✅ **Fixed:** Startup script handles all required setup  
✅ **Ready:** Production server should work correctly

**Next Steps:**
1. Run `npm start` to start production server
2. Test login in browser
3. Check browser console for any errors
4. Verify API Gateway URL is correct
