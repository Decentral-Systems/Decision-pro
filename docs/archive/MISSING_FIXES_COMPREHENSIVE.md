# Missing Fixes - Comprehensive List

## What's Still Missing to Fix Network Disconnect Issue Completely

### 1. ❌ Credit Scoring Client - Network State Detection

**File:** `lib/api/clients/credit-scoring.ts`

**Issue:**
- No network state detection
- Attempts token refresh even when network is offline
- No check for `navigator.onLine` before making requests
- Network errors block all credit scoring requests

**What Needs to be Added:**
- ✅ Network state tracking (`isNetworkOffline`, `lastNetworkCheck`)
- ✅ Browser online/offline event listeners
- ✅ Network check in request interceptor
- ✅ Skip token refresh when network is offline
- ✅ Graceful error handling for network errors

**Impact:** Credit scoring requests will still fail and block when network is down.

---

### 2. ❌ Login Page - Network Error Detection

**File:** `app/(auth)/login/page.tsx`

**Issue:**
- Shows "Invalid username or password" for ALL errors
- Doesn't detect network errors
- User doesn't know if it's a network issue or auth issue
- No retry mechanism for network errors

**Current Code:**
```typescript
catch (err) {
  setError("Invalid username or password"); // ❌ Wrong for network errors
  setIsLoading(false);
}
```

**What Needs to be Added:**
- ✅ Detect network errors (`APINetworkError`, `ERR_NETWORK`)
- ✅ Show appropriate error message for network errors
- ✅ Show "Invalid username or password" only for auth errors
- ✅ Allow retry for network errors
- ✅ Show network status indicator

**Impact:** Users can't tell if login failed due to network or wrong credentials.

---

### 3. ❌ Auth Context - Better Network Error Handling

**File:** `lib/auth/auth-context.tsx`

**Issue:**
- Has error categorization but login page doesn't use it properly
- Network errors are categorized but message might not be clear
- No retry mechanism exposed

**Current Code:**
```typescript
const authError: AuthError = {
  type: error.message?.includes('Network') ? 'network' : 'auth',
  message: error.message || 'Login failed',
  retryable: error.message?.includes('Network') || false,
};
```

**What Needs to be Added:**
- ✅ Better network error detection (check error type, not just message)
- ✅ More descriptive error messages
- ✅ Expose retryable flag to login page
- ✅ Handle `APINetworkError` and `APITimeoutError` specifically

**Impact:** Error messages might not be clear enough for users.

---

### 4. ❌ React Query Hooks - Network Error Retry Logic

**Files:** All hooks in `lib/api/hooks/`

**Issue:**
- Some hooks might retry network errors too many times
- No distinction between retryable and non-retryable network errors
- Hooks might get stuck retrying when network is permanently down

**What Needs to be Added:**
- ✅ Check network state before retrying
- ✅ Don't retry if network is clearly offline
- ✅ Limit retries for network errors (maybe 1-2 times max)
- ✅ Use `apiGatewayClient.isOffline()` to check network state

**Impact:** Queries might retry indefinitely when network is down, wasting resources.

---

### 5. ❌ Unified API Client - Network State Propagation

**File:** `lib/api/clients/unified.ts`

**Issue:**
- Doesn't expose network state
- Doesn't check network before routing requests
- Wrapper doesn't benefit from API Gateway network detection

**What Needs to be Added:**
- ✅ Expose `isOffline()` method
- ✅ Check network state before routing requests
- ✅ Fail fast for non-critical requests when offline

**Impact:** Unified client doesn't benefit from network detection.

---

### 6. ❌ UI Feedback - Network Status Indicator

**Missing Component/Feature:**

**Issue:**
- Users don't know when network is offline
- No visual indicator of network status
- No way to manually retry when network comes back

**What Needs to be Added:**
- ✅ Global network status indicator (top bar)
- ✅ Show when network is offline
- ✅ Show when network comes back online
- ✅ Allow manual refresh when network recovers
- ✅ Toast notification when network recovers

**Impact:** Users don't know why requests are failing.

---

### 7. ❌ Error Boundaries - Network Error Handling

**File:** `components/ErrorBoundary.tsx`

**Issue:**
- Might catch network errors and show generic error
- Doesn't distinguish between network errors and code errors
- Might block UI when network is down

**What Needs to be Added:**
- ✅ Detect network errors in error boundary
- ✅ Show network-specific error UI
- ✅ Allow retry when network recovers
- ✅ Don't block UI for network errors

**Impact:** Error boundary might show wrong error for network issues.

---

### 8. ❌ Query Invalidation on Network Recovery

**Files:** `lib/hooks/useNetworkRecovery.ts`, `app/providers.tsx`

**Issue:**
- Network recovery hook invalidates queries
- But some queries might have `refetchInterval: false`
- Queries might not automatically retry after network recovery

**What Needs to be Added:**
- ✅ Force refetch after network recovery (not just invalidate)
- ✅ Reset query state to allow retry
- ✅ Ensure all queries retry when network comes back

**Impact:** Some queries might not refresh automatically after network recovery.

---

## Priority Order

1. **HIGH PRIORITY:**
   - ✅ Credit Scoring Client network detection
   - ✅ Login page network error detection
   - ✅ React Query hooks network retry logic

2. **MEDIUM PRIORITY:**
   - ✅ UI feedback (network status indicator)
   - ✅ Auth context better error handling
   - ✅ Query invalidation on network recovery

3. **LOW PRIORITY:**
   - ✅ Unified API client network state
   - ✅ Error boundary network handling

---

## Summary

**Total Missing Items: 8**

**Critical for Complete Fix:**
- Credit Scoring Client (same fixes as API Gateway)
- Login page error detection
- React Query hooks retry logic

**Nice to Have:**
- UI feedback
- Better error messages
- Error boundary improvements
