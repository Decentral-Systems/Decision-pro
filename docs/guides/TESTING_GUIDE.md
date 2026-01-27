# Credit Scoring Critical Features - Testing Guide

**Date:** January 2026  
**Purpose:** Comprehensive testing guide for critical gaps implementation

---

## Pre-Testing Checklist

### Backend Verification

1. **Verify Audit Endpoint Exists**
   ```bash
   # Check if endpoint is registered
   curl -X POST http://196.188.249.48:4000/api/v1/audit/events \
     -H "Content-Type: application/json" \
     -H "Authorization: Bearer YOUR_TOKEN" \
     -d '{
       "event_type": "test_event",
       "action": "Test action",
       "details": {}
     }'
   ```

2. **Verify Database Connection**
   - Ensure PostgreSQL is running
   - Verify `audit_logs` table exists
   - Check database connection pool is active

3. **Verify Authentication**
   - Ensure JWT tokens are working
   - Verify user permissions are set correctly

---

## Test Scenarios

### Test 1: NBE Compliance Violation Blocking

**Objective:** Verify that form submission is blocked when NBE violations exist.

**Steps:**
1. Navigate to Credit Scoring page (`/credit-scoring`)
2. Select "New Customer" tab
3. Fill in form with violating data:
   - **Loan Amount:** 6,000,000 ETB (exceeds 5M max)
   - **Monthly Income:** 10,000 ETB
   - **Loan Term:** 72 months (exceeds 60 max)
   - **Customer ID:** TEST_CUST_001
4. Fill in other required fields
5. Observe the form

**Expected Results:**
- ✅ **Critical warning banner** appears at top (red background)
- ✅ **Warning message** shows: "CRITICAL: NBE Compliance Violations Detected"
- ✅ **Violation list** displays all violations:
  - "Maximum loan amount: Loan amount exceeds 5,000,000 ETB"
  - "Maximum loan term: Loan term exceeds 60 months"
  - "1/3 salary rule: Proposed payment exceeds 1/3 of monthly income"
- ✅ **Submit button is disabled** (grayed out)
- ✅ **Tooltip on button** shows: "NBE compliance violations must be resolved or supervisor override required"
- ✅ **NBE Compliance Display** shows violation details

**Screenshot Locations:**
- Warning banner at top of form
- Disabled submit button
- NBE compliance card with violations

---

### Test 2: Supervisor Override Flow

**Objective:** Verify supervisor can override compliance violations with justification.

**Prerequisites:**
- User must have supervisor/admin role
- Form must have compliance violations

**Steps:**
1. Complete Test 1 (form with violations)
2. Click on "Calculate Credit Score" button (should be disabled)
3. Since button is disabled, violations must be fixed OR override requested
4. **Note:** The override dialog should appear automatically when attempting to submit with violations
5. If override dialog doesn't appear automatically, check console for errors
6. In override dialog:
   - Review violation list
   - Enter justification (minimum 20 characters)
   - Example: "Customer has exceptional credit history and collateral. Approved by regional manager for strategic relationship."
7. Click "Approve Override"
8. Observe form submission

**Expected Results:**
- ✅ **Override dialog appears** with:
  - Violation list displayed
  - Justification textarea (minimum 20 characters)
  - Character counter
  - Warning about regulatory review
- ✅ **Submit button disabled** until justification entered (20+ chars)
- ✅ **After approval:**
  - Dialog closes
  - Form submits automatically
  - Credit score calculated
  - Override logged to audit trail

**Verification:**
- Check browser console for audit log API call
- Verify audit trail shows override event
- Check correlation ID is generated

---

### Test 3: Audit Trail Logging

**Objective:** Verify all credit scoring events are logged to audit trail.

**Steps:**
1. Navigate to Credit Scoring page
2. Calculate a credit score (with compliant data)
3. Open browser Developer Tools → Network tab
4. Filter for "audit" requests
5. Check for POST request to `/api/v1/audit/events`
6. Navigate to Credit Score Results
7. Go to "Compliance" tab
8. Scroll to "Audit Trail Display" section
9. Verify events appear

**Expected Results:**
- ✅ **Network request** shows POST to `/api/v1/audit/events`
- ✅ **Request payload** includes:
  - `event_type`: "credit_score_calculated"
  - `user_id`: Current user ID
  - `correlation_id`: Generated correlation ID
  - `customer_id`: Customer ID from form
  - `details`: Credit score, risk category, etc.
- ✅ **Response** shows:
  - `success: true`
  - `log_id`: Audit log ID
  - `correlation_id`: Correlation ID
- ✅ **Audit Trail Display** shows:
  - Credit score calculation event
  - Timestamp
  - User ID
  - Correlation ID
  - Event details

**Test Multiple Events:**
1. **Compliance Violation:**
   - Submit form with violations
   - Check for `event_type: "compliance_violation"` in audit log

2. **Supervisor Override:**
   - Complete override flow
   - Check for `event_type: "compliance_override"` in audit log
   - Verify justification is included

3. **Customer Data Access:**
   - Select existing customer
   - Check for `event_type: "customer_data_accessed"` in audit log

---

### Test 4: SHAP Visualization Display

**Objective:** Verify SHAP feature importance visualization displays correctly.

**Prerequisites:**
- Credit score must have explanation data in response

**Steps:**
1. Calculate credit score for a customer
2. Wait for results to display
3. Navigate to "Explanation" tab in results
4. Look for SHAP Visualization component
5. Verify feature importance display
6. Click on a feature to see details
7. Test PDF export

**Expected Results:**
- ✅ **SHAP Visualization Card** appears with:
  - Title: "SHAP Feature Importance"
  - Description: "Top 10 features contributing to the credit score decision"
  - Export PDF button
- ✅ **Base Score Display** (if available)
- ✅ **Top 10 Features List** showing:
  - Feature name (human-readable)
  - SHAP value (positive/negative)
  - Impact indicator (↑ for positive, ↓ for negative)
  - Progress bar showing importance
  - Feature value
- ✅ **Positive vs Negative Summary:**
  - Count of positive contributors
  - Count of negative contributors
- ✅ **Feature Click Interaction:**
  - Clicking feature shows details in alert
  - Feature value, SHAP value, impact displayed
- ✅ **PDF Export:**
  - Click "Export PDF" button
  - PDF downloads with feature importance report

**If No Explanation Data:**
- ✅ Shows message: "SHAP explanation data is not available"
- ✅ Suggests reasons (model version, processing)

---

### Test 5: Model Confidence Warnings

**Objective:** Verify confidence warnings appear when confidence < 80%.

**Steps:**
1. Calculate credit score
2. Check confidence value in response
3. If confidence < 80%:
   - Look for warning in "Explanation" tab
   - Check confidence card in main results
4. If confidence >= 80%:
   - Verify no warning appears

**Expected Results (Low Confidence < 80%):**
- ✅ **Warning Alert** in Explanation tab:
  - Yellow/red border
  - Warning icon
  - Message: "⚠️ Low Model Confidence Warning"
  - Details: "The model confidence is below 80% (XX.X%). This indicates lower certainty..."
- ✅ **Confidence Card** highlighted:
  - Yellow border
  - Yellow background
  - Warning icon next to label
  - Yellow text color
  - "Low Confidence Warning" text below value

**Expected Results (High Confidence >= 80%):**
- ✅ No warning alert
- ✅ Normal confidence card styling
- ✅ No warning indicators

---

### Test 6: Audit Trail Display Component

**Objective:** Verify audit trail display shows events correctly.

**Steps:**
1. Calculate credit score
2. Navigate to results → "Compliance" tab
3. Scroll to "Audit Trail Display" section
4. Test filtering:
   - Search by event type
   - Filter by date range
   - Search by correlation ID
5. Test pagination (if multiple pages)
6. Test export (PDF, Excel, CSV)

**Expected Results:**
- ✅ **Audit Trail Card** displays with:
  - Title: "Audit Trail"
  - Description: "Complete history of credit scoring operations"
  - Refresh button
  - Export button
- ✅ **Filters Section:**
  - Search input (searches action, user, correlation ID)
  - Event type dropdown (All, Credit Score Calculated, Compliance Violation, etc.)
  - Date range dropdown (All Time, Last 24 Hours, 7 Days, 30 Days, 90 Days)
  - Export buttons (Excel, CSV)
- ✅ **Events Table** shows:
  - Timestamp (formatted)
  - Event type (with icon and badge)
  - Action description
  - User ID
  - Correlation ID (truncated)
  - Details badge
- ✅ **Pagination** (if applicable):
  - Page number display
  - Previous/Next buttons
  - Total items count
- ✅ **Export Functionality:**
  - PDF export downloads report
  - Excel export downloads spreadsheet
  - CSV export downloads CSV file

---

## Backend Verification Tests

### Test 7: Audit Events Endpoint

**Objective:** Verify `/api/v1/audit/events` endpoint exists and works.

**Manual API Test:**
```bash
# Test POST endpoint
curl -X POST http://196.188.249.48:4000/api/v1/audit/events \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "event_type": "credit_score_calculated",
    "user_id": "test_user",
    "customer_id": "CUST_001",
    "action": "Credit score calculated",
    "details": {
      "credit_score": 750,
      "risk_category": "low"
    },
    "correlation_id": "test_corr_123",
    "timestamp": "2026-01-20T10:00:00Z"
  }'
```

**Expected Response:**
```json
{
  "success": true,
  "log_id": "12345",
  "correlation_id": "test_corr_123",
  "message": "Audit event logged successfully"
}
```

**Database Verification:**
```sql
-- Check if event was logged
SELECT * FROM audit_logs 
WHERE correlation_id = 'test_corr_123' 
ORDER BY created_at DESC 
LIMIT 1;
```

---

### Test 8: Audit Logs Retrieval

**Objective:** Verify audit logs can be retrieved.

**API Test:**
```bash
# Test GET endpoint
curl -X GET "http://196.188.249.48:4000/api/v1/audit/logs?page=1&page_size=20" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

**Expected Response:**
```json
{
  "items": [...],
  "total": 100,
  "page": 1,
  "page_size": 20,
  "total_pages": 5
}
```

---

## Integration Testing

### Test 9: End-to-End Flow

**Objective:** Test complete credit scoring flow with all features.

**Steps:**
1. **Login** as credit analyst
2. **Navigate** to Credit Scoring page
3. **Select** existing customer (triggers data access logging)
4. **Modify** form fields (should log form modifications)
5. **Enter violating data** (loan amount > 5M)
6. **Attempt submission** (should be blocked)
7. **Request supervisor override** (enter justification)
8. **Approve override** (should log override)
9. **Submit form** (should calculate score and log)
10. **View results:**
    - Check confidence warning (if < 80%)
    - View SHAP visualization
    - Check audit trail in Compliance tab
11. **Export reports:**
    - Export SHAP PDF
    - Export audit trail

**Expected Results:**
- ✅ All steps complete successfully
- ✅ All events logged to audit trail
- ✅ No errors in console
- ✅ All UI components display correctly

---

## Error Handling Tests

### Test 10: Audit Service Unavailable

**Objective:** Verify graceful degradation when audit service fails.

**Steps:**
1. Stop audit service or database
2. Attempt to calculate credit score
3. Check browser console for errors
4. Verify form still works

**Expected Results:**
- ✅ Form submission succeeds (audit failure doesn't block)
- ✅ Console shows warning: "Failed to log audit event"
- ✅ User workflow not interrupted
- ✅ Error logged but not displayed to user

---

## Performance Tests

### Test 11: Multiple Rapid Submissions

**Objective:** Verify system handles rapid submissions.

**Steps:**
1. Calculate credit score
2. Immediately calculate another (different customer)
3. Repeat 5 times rapidly
4. Check audit trail for all events

**Expected Results:**
- ✅ All submissions succeed
- ✅ All events logged (may be slightly delayed)
- ✅ No performance degradation
- ✅ Correlation IDs unique for each request

---

## Browser Compatibility

### Test 12: Cross-Browser Testing

**Test in:**
- ✅ Chrome/Edge (Chromium)
- ✅ Firefox
- ✅ Safari (if available)

**Verify:**
- ✅ All features work in each browser
- ✅ UI displays correctly
- ✅ No console errors
- ✅ Export functionality works

---

## Mobile Responsiveness

### Test 13: Mobile/Tablet Testing

**Test on:**
- ✅ Mobile device (iOS/Android)
- ✅ Tablet device

**Verify:**
- ✅ Form displays correctly
- ✅ Warning banners visible
- ✅ Override dialog usable
- ✅ SHAP visualization readable
- ✅ Audit trail table scrollable

---

## Reporting Issues

### Issue Template

When reporting issues, include:

1. **Test Case:** Which test failed
2. **Steps to Reproduce:** Detailed steps
3. **Expected Result:** What should happen
4. **Actual Result:** What actually happened
5. **Screenshots:** If applicable
6. **Console Errors:** Any JavaScript errors
7. **Network Errors:** Any failed API calls
8. **Browser/OS:** Browser version and OS
9. **User Role:** What role you're logged in as

---

## Success Criteria

All tests pass when:
- ✅ NBE violations block submission
- ✅ Supervisor override works with justification
- ✅ All events logged to audit trail
- ✅ SHAP visualization displays correctly
- ✅ Confidence warnings appear when < 80%
- ✅ Audit trail display shows all events
- ✅ Backend endpoints respond correctly
- ✅ No blocking errors in console
- ✅ All exports work correctly

---

**Document Version:** 1.0  
**Last Updated:** January 2026
