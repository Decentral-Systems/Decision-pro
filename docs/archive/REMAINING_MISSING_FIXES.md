# Remaining Missing Fixes - Final Checklist

## What's Still Missing for Complete Fix

### 1. ❌ Credit Scoring Client - Network State Detection

**File:** `lib/api/clients/credit-scoring.ts`

**Status:** ❌ **NOT IMPLEMENTED**

**Issue:**
- No network state detection (no `isNetworkOffline`, `lastNetworkCheck`)
- No browser online/offline event listeners
- No network check in request interceptor
- Attempts token refresh even when network is offline (line 59-82)
- Network errors block all credit scoring requests

**What Needs to be Added:**
- ✅ Add network state tracking (same as API Gateway)
- ✅ Add browser online/offline event listeners
- ✅ Add network check in request interceptor
- ✅ Skip token refresh when network is offline
- ✅ Add `isOffline()` public method
- ✅ Graceful error handling for network errors

**Impact:** Credit scoring requests will still fail and block when network is down.

**Priority:** 🔴 **CRITICAL** - Same fixes as API Gateway needed

---

### 2. ❌ Error Boundary - Network Error Detection

**File:** `components/ErrorBoundary.tsx`

**Status:** ❌ **NOT IMPLEMENTED**

**Issue:**
- Shows generic "Something went wrong" for ALL errors
- Doesn't distinguish network errors from code errors
- Forces full page reload for network errors (line 61)
- Blocks entire UI when network is down

**What Needs to be Added:**
- ✅ Detect network errors in `getDerivedStateFromError`
- ✅ Show network-specific error UI
- ✅ Allow retry when network recovers (don't force reload)
- ✅ Don't block UI for network errors
- ✅ Show network status in error boundary

**Current Code:**
```typescript
// Always reloads page - wrong for network errors
onClick={() => {
  this.setState({ hasError: false, error: undefined });
  window.location.reload(); // ❌ Shouldn't reload for network errors
}}
```

**Impact:** Error boundary shows wrong error and forces reload for network issues.

**Priority:** 🟡 **MEDIUM** - Improves UX but doesn't block functionality

---

### 3. ❌ Next.js Error Page - Network Error Detection

**File:** `app/error.tsx`

**Status:** ❌ **NOT IMPLEMENTED**

**Issue:**
- Shows generic error for ALL errors
- Doesn't detect network errors
- No network-specific handling

**What Needs to be Added:**
- ✅ Detect network errors
- ✅ Show network-specific error UI
- ✅ Allow retry when network recovers
- ✅ Don't force navigation for network errors

**Priority:** 🟡 **MEDIUM** - Improves UX

---

### 4. ❌ Unified API Client - Network State

**File:** `lib/api/clients/unified.ts`

**Status:** ❌ **NOT IMPLEMENTED**

**Issue:**
- Doesn't expose network state
- Doesn't check network before routing requests
- Wrapper doesn't benefit from API Gateway network detection

**What Needs to be Added:**
- ✅ Expose `isOffline()` method (delegate to apiGatewayClient)
- ✅ Check network state before routing requests
- ✅ Fail fast for non-critical requests when offline

**Priority:** 🟢 **LOW** - Wrapper doesn't need it urgently, but would be nice

---

### 5. ❌ Login Page - Network Status Indicator

**File:** `app/(auth)/login/page.tsx`

**Status:** ❌ **NOT IMPLEMENTED**

**Issue:**
- Network error detection is fixed ✅
- But no visual network status indicator on login page
- Users can't see network status before trying to login

**What Needs to be Added:**
- ✅ Add `NetworkStatusIndicator` to login page
- ✅ Show network status visually
- ✅ Help users understand if network is down

**Priority:** 🟡 **MEDIUM** - Improves UX, helps users understand login failures

---

## Summary

**Total Remaining Items: 5**

### Critical (Must Fix):
1. 🔴 **Credit Scoring Client** - Network state detection (same as API Gateway)

### Important (Should Fix):
2. 🟡 **Error Boundary** - Network error detection
3. 🟡 **Next.js Error Page** - Network error detection
4. 🟡 **Login Page** - Network status indicator

### Nice to Have:
5. 🟢 **Unified API Client** - Network state propagation

---

## Implementation Order

1. **First:** Credit Scoring Client (critical - same pattern as API Gateway)
2. **Second:** Error Boundary (improves error handling)
3. **Third:** Next.js Error Page (improves error handling)
4. **Fourth:** Login Page Network Status (improves UX)
5. **Fifth:** Unified API Client (nice to have)

---

## Notes

- ✅ **API Gateway Client** - Already fixed with network detection
- ✅ **All React Query Hooks** - Already updated with network-aware retry
- ✅ **Network Recovery** - Already forces refetch
- ✅ **Auth Context** - Already has better network error handling
- ✅ **Login Page Error Display** - Already uses improved error messages
- ✅ **Network Status Indicator** - Already in Header (all dashboard pages)

**The remaining fixes are to complete the implementation across ALL clients and error handlers.**
