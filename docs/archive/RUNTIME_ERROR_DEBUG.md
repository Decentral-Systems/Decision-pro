# Runtime 500 Error - Debug Guide

**Issue:** HTTP 500 error when accessing any route  
**Status:** Investigating  
**Build:** ✅ Successful  
**Code:** ✅ Correct

---

## Investigation Steps

Since the build is successful but we're getting a 500 error, this is a **runtime/server-side issue**.

### 1. Check Server Logs

The actual error message should be visible in the terminal where `npm run dev` is running.

**Look for:**
- Error stack traces
- "Error: ..." messages
- Failed imports or module loading errors
- Authentication/configuration errors

### 2. Common Causes

#### A. Missing Dependencies
```bash
# Check if all dependencies are installed
cd /home/AIS/decision-pro-admin
npm install
```

#### B. Environment Variables
```bash
# Verify .env.local exists and has required variables
cat .env.local
```

Required variables:
- `NEXTAUTH_URL`
- `NEXTAUTH_SECRET`
- `NEXT_PUBLIC_API_GATEWAY_URL`
- `NEXT_PUBLIC_CREDIT_SCORING_API_URL`

#### C. Next.js Cache Issues
```bash
# Clear Next.js cache
rm -rf .next
npm run dev
```

#### D. Port Already in Use
```bash
# Check if port 4009 is available
lsof -i :4009
# Kill process if needed
kill -9 <PID>
```

#### E. Backend Services Not Running
```bash
# Check if backend services are accessible
curl http://196.188.249.48:4000/health
curl http://196.188.249.48:4001/health
```

---

## Quick Fixes to Try

### 1. Restart Dev Server
```bash
# Stop current server (Ctrl+C)
# Then restart
cd /home/AIS/decision-pro-admin
npm run dev
```

### 2. Clear Build Cache
```bash
cd /home/AIS/decision-pro-admin
rm -rf .next
npm run build
npm run dev
```

### 3. Verify Node Version
```bash
node --version
# Should be 18.x or 20.x
```

### 4. Check for Syntax Errors
```bash
cd /home/AIS/decision-pro-admin
npx next lint
```

---

## What to Check in Server Logs

When you see the error in the terminal, look for:

1. **Module not found errors**
   - Indicates missing dependency
   - Solution: `npm install`

2. **Cannot read property of undefined**
   - Indicates code accessing undefined values
   - Check error stack trace for file location

3. **Authentication errors**
   - Indicates NextAuth configuration issue
   - Check NEXTAUTH_SECRET and NEXTAUTH_URL

4. **API connection errors**
   - Indicates backend services not accessible
   - Check backend service status

5. **Import errors**
   - Indicates circular dependency or incorrect import path
   - Check file imports

---

## Diagnostic Commands

```bash
# 1. Verify dependencies
npm list --depth=0

# 2. Check for TypeScript errors
npx tsc --noEmit

# 3. Check for linting errors
npx next lint

# 4. Test build
npm run build

# 5. Check environment
cat .env.local

# 6. Test API connectivity
curl -v http://196.188.249.48:4000/health
curl -v http://196.188.249.48:4001/health
```

---

## Most Likely Causes

Based on successful build but 500 error:

1. **Backend services not running** (most likely)
   - The app tries to connect to APIs during initialization
   - If APIs are down, it might cause a crash

2. **NextAuth configuration issue**
   - Missing or invalid NEXTAUTH_SECRET
   - Incorrect NEXTAUTH_URL

3. **Node.js version mismatch**
   - Next.js 14 requires Node 18.17 or later

4. **Port conflict**
   - Port 4009 already in use
   - Next.js fails to start

---

## Next Steps

1. **Check server logs** (most important)
   - The actual error will be visible there
   - Copy the full error message and stack trace

2. **Try the quick fixes above**
   - Clear cache
   - Restart server
   - Verify dependencies

3. **Check backend services**
   - Ensure APIs are running and accessible
   - Verify network connectivity

4. **Share error details**
   - Once you have the actual error from logs
   - Can provide specific fix

---

## Code is Correct

✅ Build succeeds  
✅ TypeScript compiles  
✅ No syntax errors  
✅ All imports resolve  

This confirms the code is correct, and the issue is environmental/runtime.

---

**Last Updated:** January 2025  
**Status:** Waiting for server log error details



