# Manual Testing Checklist for Executive Dashboard

## Pre-Testing Setup

### Backend Verification
- [ ] API Gateway is running at `http://196.188.249.48:4000`
- [ ] WebSocket endpoint is accessible at `ws://196.188.249.48:4000/ws`
- [ ] Credit Scoring Service is running
- [ ] All backend services are healthy (check `/health` endpoints)

### Frontend Setup
- [ ] Dashboard is running at `http://localhost:4009` (or configured port)
- [ ] User is authenticated
- [ ] Browser console is open for debugging
- [ ] Network tab is open to monitor API calls

## Critical Feature Tests

### 1. Date Range Filter Integration ✅

**Test Steps:**
1. Navigate to Executive Dashboard
2. Locate Date Range Filter in header (top right)
3. Test preset buttons:
   - [ ] Click "Last 7 days" - verify all metrics update
   - [ ] Click "Last 30 days" - verify all metrics update
   - [ ] Click "Last 90 days" - verify all metrics update
   - [ ] Click "Last year" - verify all metrics update
4. Test custom date range:
   - [ ] Click "Custom" button
   - [ ] Select start date: 2024-01-01
   - [ ] Select end date: 2024-12-31
   - [ ] Click "Apply"
   - [ ] Verify all dashboard metrics update with new date range
5. Check URL:
   - [ ] URL should reflect date range parameters
   - [ ] Refresh page - date range should persist

**Expected Results:**
- All KPI cards update when date range changes
- Revenue analytics charts update
- Customer statistics update
- Executive dashboard data updates
- URL contains date parameters

**Issues Found:**
- [ ] Issue 1: [Description]
- [ ] Issue 2: [Description]

---

### 2. WebSocket Real-time Updates ✅

**Test Steps:**
1. Navigate to Executive Dashboard
2. Check connection status badge:
   - [ ] Should show "Real-time" with WiFi icon (if connected)
   - [ ] Should show "Polling" with WiFiOff icon (if disconnected)
3. Monitor dashboard updates:
   - [ ] Wait 10-15 seconds
   - [ ] Verify dashboard metrics update automatically (without refresh)
   - [ ] Check browser console for WebSocket messages
4. Test WebSocket disconnection:
   - [ ] Stop backend WebSocket service
   - [ ] Verify status changes to "Polling"
   - [ ] Verify dashboard still works (polling fallback)
   - [ ] Restart WebSocket service
   - [ ] Verify status changes back to "Real-time"

**Expected Results:**
- Connection status accurately reflects WebSocket state
- Dashboard updates automatically every 10 seconds
- Graceful fallback to polling if WebSocket unavailable
- No console errors

**Issues Found:**
- [ ] Issue 1: [Description]
- [ ] Issue 2: [Description]

---

### 3. Real-time Risk Alerts ✅

**Test Steps:**
1. Navigate to Executive Dashboard
2. Monitor for risk alerts:
   - [ ] Keep dashboard open for 30+ seconds
   - [ ] Trigger a risk alert from backend (if possible)
   - [ ] Verify toast notification appears
3. Test alert types:
   - [ ] Critical alerts show red/destructive toast
   - [ ] High alerts show warning toast
   - [ ] Info alerts show default toast
4. Test alert interaction:
   - [ ] Toast should be dismissible
   - [ ] Critical alerts should stay longer (10 seconds)
   - [ ] Multiple alerts should stack properly

**Expected Results:**
- Risk alerts appear as toast notifications
- Alerts are visible and not just in console
- Alert styling matches severity
- Toasts can be dismissed

**Issues Found:**
- [ ] Issue 1: [Description]
- [ ] Issue 2: [Description]

---

### 4. Unified Error Handling ✅

**Test Steps:**
1. Navigate to Executive Dashboard
2. Test single error:
   - [ ] Stop one backend service (e.g., Credit Scoring)
   - [ ] Verify single error alert appears (not multiple)
   - [ ] Check error message is clear
   - [ ] Click "Retry All" button
   - [ ] Verify retry attempts to refetch data
3. Test multiple errors:
   - [ ] Stop multiple backend services
   - [ ] Verify unified error alert with collapsible details
   - [ ] Click expand/collapse button
   - [ ] Verify all errors are listed
   - [ ] Click "Retry All"
   - [ ] Verify all services are retried
4. Test error recovery:
   - [ ] Restart backend services
   - [ ] Click "Retry All"
   - [ ] Verify errors clear and data loads

**Expected Results:**
- Single unified error alert (not 4 separate alerts)
- Collapsible details for multiple errors
- Clear error messages
- Retry button refetches all failed queries
- Errors clear when services recover

**Issues Found:**
- [ ] Issue 1: [Description]
- [ ] Issue 2: [Description]

---

### 5. Data Aggregation ✅

**Test Steps:**
1. Navigate to Executive Dashboard
2. Verify data display:
   - [ ] Primary KPIs display correctly (Revenue, Loans, Customers, Risk Score)
   - [ ] Data comes from correct sources
   - [ ] No conflicting data sources
3. Test real-time updates:
   - [ ] Observe primary data
   - [ ] Wait for WebSocket update
   - [ ] Verify real-time data overrides primary data
   - [ ] Verify unchanged fields remain from primary
4. Test fallback behavior:
   - [ ] Disable primary data source
   - [ ] Verify fallback data displays (customerStats, recommendationStats)
   - [ ] Verify data structure is correct

**Expected Results:**
- Data displays correctly from multiple sources
- Priority: realtime > primary > fallback
- No data conflicts or inconsistencies
- Type-safe data aggregation

**Issues Found:**
- [ ] Issue 1: [Description]
- [ ] Issue 2: [Description]

---

### 6. Complete Dashboard Workflow ✅

**Test Steps:**
1. Navigate to Executive Dashboard
2. Wait for initial load:
   - [ ] Loading skeletons appear
   - [ ] Data loads within 5 seconds
   - [ ] No blank screens
3. Interact with dashboard:
   - [ ] Scroll through all sections
   - [ ] Verify all widgets load
   - [ ] Check charts render correctly
   - [ ] Verify data in all sections
4. Test date range change:
   - [ ] Change date range to "Last 7 days"
   - [ ] Verify all sections update
   - [ ] Change to "Last 90 days"
   - [ ] Verify all sections update again
5. Test error scenario:
   - [ ] Disconnect from network briefly
   - [ ] Verify error handling
   - [ ] Reconnect
   - [ ] Verify recovery
6. Test export:
   - [ ] Click Export button
   - [ ] Select PDF format
   - [ ] Verify export works
   - [ ] Select Excel format
   - [ ] Verify export works

**Expected Results:**
- Complete dashboard loads successfully
- All interactions work correctly
- No broken components
- Smooth user experience

**Issues Found:**
- [ ] Issue 1: [Description]
- [ ] Issue 2: [Description]

---

## Performance Tests

### Load Time
- [ ] Initial page load: < 3 seconds
- [ ] Data fetch: < 2 seconds
- [ ] WebSocket connection: < 1 second
- [ ] Date range change: < 2 seconds

### Update Frequency
- [ ] WebSocket updates: Every 10 seconds
- [ ] Polling fallback: Every 10 seconds
- [ ] No duplicate updates

### Browser Compatibility
- [ ] Chrome/Edge: ✅/❌
- [ ] Firefox: ✅/❌
- [ ] Safari: ✅/❌

---

## Test Results Summary

### Tests Passed
- [ ] Date Range Filter: ✅/❌
- [ ] WebSocket Updates: ✅/❌
- [ ] Risk Alerts: ✅/❌
- [ ] Error Handling: ✅/❌
- [ ] Data Aggregation: ✅/❌
- [ ] Complete Workflow: ✅/❌

### Critical Issues
1. [Issue description]
2. [Issue description]

### Medium Priority Issues
1. [Issue description]
2. [Issue description]

### Recommendations
1. [Recommendation]
2. [Recommendation]

---

## Notes
[Any additional notes or observations during testing]






