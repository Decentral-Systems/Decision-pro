# 🚀 Authentication System - Quick Reference

## 🎯 For Users

### Login
```
URL: http://196.188.249.48:4009/login
Default credentials: admin/admin
```

### Session
- Duration: 1 hour
- Warning: 5 minutes before expiry
- Action: Click "Stay Logged In" to extend

### Logout
1. Click user menu (top-right)
2. Select "Sign Out"
3. Redirected to login

---

## 💻 For Developers

### Check Authentication
```typescript
import { useAuth } from "@/lib/auth/auth-context";

const { user, isAuthenticated, isLoading, error } = useAuth();
```

### Protect Components
```typescript
import { PermissionGuard } from "@/components/auth/PermissionGuard";
import { Permission } from "@/lib/auth/permissions";

<PermissionGuard permission={Permission.APPROVE_LOAN}>
  <ApprovalButton />
</PermissionGuard>
```

### Check Permissions
```typescript
import { usePermission } from "@/components/auth/PermissionGuard";

const canApprove = usePermission(Permission.APPROVE_LOAN);
```

### Logout
```typescript
const { logout } = useAuth();
logout(); // Clears everything and redirects
```

---

## 🔧 System Management

### Start Server
```bash
cd /home/AIS/decision-pro-admin
npm run dev
```

### Check Status
```bash
curl http://localhost:4009/api/health
```

### Check All Services
```bash
cd /home/AIS
./ais status
```

### Restart Services
```bash
./ais restart
```

---

## 📂 Key Files

### Authentication
- `lib/auth/auth-context.tsx` - Main auth logic
- `lib/auth/jwt-utils.ts` - JWT utilities
- `lib/auth/permissions.ts` - Permission definitions
- `middleware.ts` - Route protection

### Components
- `app/(auth)/login/page.tsx` - Login page
- `components/layout/Header.tsx` - User menu
- `components/auth/SessionTimeoutWarning.tsx` - Timeout warning
- `components/auth/PermissionGuard.tsx` - Permission guards

### Configuration
- `app/providers.tsx` - Auth provider setup
- `lib/stores/auth-store.ts` - Zustand store
- `.env.local` - Environment variables

---

## 🐛 Troubleshooting

### Can't login?
1. Check API Gateway is running (port 4000)
2. Check browser console for errors
3. Verify credentials are correct
4. Clear localStorage and try again

### Session expires immediately?
1. Check token expiration in console
2. Verify backend JWT settings
3. Check SESSION_DURATION_MS (default: 1 hour)

### Can't access route?
1. Check if authenticated (check localStorage)
2. Verify token is valid
3. Check middleware logs in console
4. Verify route is in protected routes list

---

## 📊 URLs

- **Dashboard:** http://localhost:4009
- **Login:** http://localhost:4009/login
- **Health:** http://localhost:4009/api/health
- **API Gateway:** http://localhost:4000
- **API Docs:** http://localhost:4000/docs

---

## ✅ Implementation Checklist

- [x] NextAuth removed
- [x] Login page updated
- [x] Header updated
- [x] Middleware implemented
- [x] Zustand synced
- [x] Timeout warning added
- [x] Permission guards created
- [x] Providers updated
- [x] Server restarted
- [x] Tests passing

---

**Status:** ✅ OPERATIONAL  
**Version:** 2.0 (auth-context unified)  
**Last Updated:** January 11, 2026
