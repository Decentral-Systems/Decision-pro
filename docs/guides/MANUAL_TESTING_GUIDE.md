# Manual Testing Guide - Decision Pro Dashboard Enhancements

## Prerequisites
1. Ensure the Next.js dev server is running: `npm run dev` (port 4009)
2. Ensure the API Gateway is running: `http://196.188.249.48:4000`
3. Login credentials: `admin` / `admin123`

## Testing Checklist

### 1. Settings Page (`/settings`)

#### Role-Based Permissions
- [ ] Login as `admin` - should see "Save Changes" button enabled
- [ ] Login as `read_only` - should see "Read Only" badge and disabled buttons
- [ ] Verify admin can edit all settings
- [ ] Verify non-admin cannot edit settings

#### Version Display
- [ ] Check for version badge (e.g., "v1.0.0") in header
- [ ] Verify version updates after saving settings

#### Current Values vs Defaults
- [ ] Navigate to System tab
- [ ] Verify "Current: X" indicators show for each field
- [ ] Change a value and verify "Changed" badge appears

#### MFA Toggle
- [ ] Go to Security tab
- [ ] Toggle "Require Multi-Factor Authentication"
- [ ] Verify confirmation dialog appears
- [ ] Confirm and verify MFA is enabled

#### Import/Export
- [ ] Click "Export" button - should download JSON file
- [ ] Click "Import" button - should open dialog
- [ ] Paste valid JSON and import - should update settings
- [ ] Try invalid JSON - should show error

#### Quiet Hours Validation
- [ ] Go to Notifications tab
- [ ] Enable "Quiet Hours"
- [ ] Set start: 22:00, end: 22:30 (too close)
- [ ] Verify validation error appears
- [ ] Set valid times (22:00 to 08:00) - error should disappear

#### Test Notification Channels
- [ ] With Quiet Hours enabled, verify "Test Email", "Test SMS", "Test Push" buttons appear
- [ ] Click each test button - should show success toast

#### Config History
- [ ] After saving settings, verify history section appears
- [ ] Check for version history entries
- [ ] Test rollback functionality (if available)

---

### 2. System Status Page (`/system-status`)

#### SLA Metrics Cards
- [ ] Verify three SLA cards: Uptime SLA, Latency P95, Error Rate
- [ ] Check for green checkmarks (SLA met) or red warnings (SLA breached)
- [ ] Verify percentage/values are displayed

#### Auto-Refresh Toggle
- [ ] Find "Auto-refresh" toggle in header
- [ ] Toggle ON - should start auto-refreshing
- [ ] Toggle OFF - should stop auto-refreshing
- [ ] Verify refresh interval is configurable

#### Metrics Charts
- [ ] Check for uptime trend chart
- [ ] Check for latency chart (P95/P99)
- [ ] Check for error rate chart
- [ ] Verify charts update when data changes

#### Dependency Graph
- [ ] Scroll to Dependencies section
- [ ] Verify services are listed (PostgreSQL, Redis, etc.)
- [ ] Check status badges (healthy/unhealthy)
- [ ] Verify latency information is shown

#### Incident Banner
- [ ] If incidents exist, verify banner appears at top
- [ ] Check incident details are displayed
- [ ] Verify timestamp and description

#### Synthetic Checks
- [ ] Scroll to Synthetic Checks section
- [ ] Verify check results are displayed
- [ ] Check for pass/fail indicators
- [ ] Verify response times are shown

---

### 3. Admin → Audit Logs (`/admin/audit-logs`)

#### Correlation-ID Search
- [ ] Click "Filters" button
- [ ] Find "Correlation ID" input field
- [ ] Enter a correlation ID and verify filtering works

#### Sortable Columns
- [ ] Click column headers (Timestamp, User, Action, Status)
- [ ] Verify sorting works (ascending/descending)
- [ ] Check sort indicators (arrows) appear

#### Pagination
- [ ] If more than 20 entries, verify pagination controls appear
- [ ] Test page navigation (Next/Previous)
- [ ] Verify page numbers are correct

#### Export Functionality
- [ ] Click "Export CSV" - should download file
- [ ] Click "Export PDF" - should download PDF
- [ ] Verify exported files contain correlation-ID and signature metadata

#### Saved Filters
- [ ] Set up filters (status, action, correlation-ID)
- [ ] Click "Save Filter" button
- [ ] Enter filter name
- [ ] Verify filter appears in saved filters dropdown
- [ ] Load saved filter - should apply filters

#### Spike Alerts
- [ ] If high activity detected, verify alert banner appears
- [ ] Check alert shows count and time window
- [ ] Verify toast notification appears

#### Auto-Refresh
- [ ] Find auto-refresh toggle/button
- [ ] Enable auto-refresh
- [ ] Verify logs update automatically
- [ ] Disable auto-refresh

---

### 4. Admin → Users (`/admin/users`)

#### Role-Based Guardrails
- [ ] Try to edit your own account - should show permission denied
- [ ] Try to delete your own account - should be disabled
- [ ] Try to change your own role - should be blocked
- [ ] Verify other users can be edited normally

#### User Information Display
- [ ] Check for MFA column - should show Enabled/Disabled
- [ ] Check for Password column - should show status (OK/Expired/Old)
- [ ] Check for Lockout column - should show lockout info
- [ ] Check for Last Login column - should show timestamp

#### Filtering
- [ ] Click "Filters" button
- [ ] Test Role filter (Admin, Credit Analyst, etc.)
- [ ] Test Status filter (Active, Inactive, Locked)
- [ ] Test Org Unit filter
- [ ] Test Search field

#### Bulk Operations
- [ ] Select multiple users (checkboxes)
- [ ] Verify bulk action buttons appear
- [ ] Test "Activate" bulk action
- [ ] Test "Deactivate" bulk action
- [ ] Test "Update Roles" bulk action

#### Export with Masking
- [ ] Click "Export" button
- [ ] Download CSV file
- [ ] Verify email addresses are masked (e.g., "te***@example.com")
- [ ] Verify PII data is protected

#### Pagination
- [ ] If more than 20 users, verify pagination appears
- [ ] Test page navigation

---

### 5. All Other Pages

Test each page loads without errors:
- [ ] `/dashboard` - Executive Dashboard
- [ ] `/analytics` - Analytics
- [ ] `/compliance` - Compliance Center
- [ ] `/credit-scoring/history` - Credit Scoring History
- [ ] `/default-prediction` - Default Prediction
- [ ] `/default-prediction/history` - Default Prediction History
- [ ] `/dynamic-pricing` - Dynamic Pricing
- [ ] `/customers` - Customers List
- [ ] `/realtime-scoring` - Real-Time Scoring
- [ ] `/ml-center` - ML Center

---

## Common Issues to Check

1. **Page Load Times**: All pages should load within 5 seconds
2. **Error Messages**: No 500 errors or critical failures
3. **Navigation**: All links and buttons should work
4. **Data Display**: Tables and charts should show data (or empty states)
5. **Responsiveness**: Pages should work on different screen sizes
6. **Console Errors**: Check browser console for JavaScript errors

## Test Results Template

```
Page: [Page Name]
Date: [Date]
Tester: [Name]

✅ Pass / ❌ Fail / ⚠️ Partial

Enhancement 1: [Status]
Enhancement 2: [Status]
...

Notes:
[Any issues or observations]
```

---

## Quick Test Script

1. Login as admin
2. Navigate to each page listed above
3. Verify page loads without errors
4. Test key enhancements for each page
5. Check browser console for errors
6. Document any issues found

---

## Expected Behavior

- All pages should load successfully
- All enhancements should be visible and functional
- No critical errors in browser console
- All buttons and links should work
- Data should display (or show appropriate empty states)
- Export functions should work
- Filters should work
- Pagination should work

---

## Reporting Issues

If you find issues:
1. Note the page URL
2. Describe the expected behavior
3. Describe the actual behavior
4. Include browser console errors (if any)
5. Include screenshots (if helpful)



