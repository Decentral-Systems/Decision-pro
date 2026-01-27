# Server Fix Required - Build Cache Corruption

**Issue:** Corrupted Next.js build cache on production server  
**Server:** 196.188.249.48:4009  
**Priority:** 🔴 HIGH

---

## 🚨 Problem

The Next.js development server has a corrupted build cache, causing:
- 500 errors when accessing routes
- Missing JavaScript chunk files (404 errors)
- Incomplete page rendering
- Blocked JavaScript execution

**Error Message:**
```
Error: Cannot find module './682.js'
```

---

## ✅ Solution

### Quick Fix Script

Run these commands on the server:

```bash
# 1. Navigate to project
cd /home/AIS/decision-pro-admin

# 2. Stop server
pkill -f "next dev"

# 3. Clear corrupted cache
rm -rf .next

# 4. Rebuild
npm run build

# 5. Restart server
PORT=4009 npm run dev > /tmp/nextjs-dev.log 2>&1 &
```

### Alternative: If using PM2

```bash
cd /home/AIS/decision-pro-admin
pm2 stop nextjs  # or whatever name you use
rm -rf .next
npm run build
pm2 start npm --name "nextjs" -- run dev -- --port 4009
```

---

## ✅ Verification

After running the fix:

1. **Check health endpoint:**
   ```bash
   curl http://localhost:4009/api/health
   ```
   Should return: `{"status":"healthy",...}`

2. **Check static files:**
   ```bash
   curl -I http://localhost:4009/_next/static/chunks/main-app.js
   ```
   Should return: `200 OK` (not 404)

3. **Test in browser:**
   - Navigate to http://196.188.249.48:4009/dashboard
   - Check browser console - should have no errors
   - Verify Date Range Filter and Export Button are visible
   - Test Phase 2 features

---

## 📋 After Fix Checklist

- [ ] Health endpoint returns 200
- [ ] Dashboard page loads completely
- [ ] No console errors
- [ ] Date Range Filter visible in header
- [ ] Export Button visible in header
- [ ] All charts render correctly
- [ ] Phase 2 features work

---

**Time Required:** ~5 minutes  
**Risk Level:** Low (just clearing cache and rebuilding)  
**Impact:** High (restores full dashboard functionality)

