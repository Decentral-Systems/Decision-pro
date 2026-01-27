# Backend Integration Testing Procedures

**Date:** January 2025  
**Status:** Test scripts created and ready for execution

---

## Overview

This document provides testing procedures for verifying the backend integration. All test scripts are located in `/scripts/` directory.

---

## Prerequisites

1. **Backend Services Running:**
   - API Gateway (port 4000)
   - Credit Scoring Service (port 4001)
   - Default Prediction Service (port 4002)
   - PostgreSQL (port 5432)
   - Redis (port 6379)

2. **Environment Variables:**
   ```bash
   export NEXT_PUBLIC_API_GATEWAY_URL=http://196.188.249.48:4000
   export TEST_USERNAME=admin
   export TEST_PASSWORD=admin123
   ```

3. **Test Credentials:**
   - Username: `admin` (or your test user)
   - Password: `admin123` (or your test password)

---

## Test Scripts

### 1. Authentication Flow Test

**Script:** `scripts/test-auth-flow.sh`

**Tests:**
- User login
- Token generation
- Protected endpoint access
- Token refresh
- Access with refreshed token

**Run:**
```bash
cd /home/AIS/decision-pro-admin
./scripts/test-auth-flow.sh
```

**Expected Results:**
- ✅ Login successful
- ✅ Access token received
- ✅ Protected endpoint accessible
- ✅ Token refresh successful
- ✅ Refreshed token works

---

### 2. Core Endpoints Test

**Script:** `scripts/test-core-endpoints.sh`

**Tests:**
- Dashboard analytics
- Model performance
- Customer management
- Admin operations
- Credit scoring
- Product recommendations

**Run:**
```bash
cd /home/AIS/decision-pro-admin
./scripts/test-core-endpoints.sh
```

**Expected Results:**
- ✅ All endpoints return 200 OK (or appropriate status)
- ✅ Response format matches expectations
- ✅ No 401, 404, or 405 errors

---

### 3. Error Handling Test

**Script:** `scripts/test-error-handling.sh`

**Tests:**
- 401 Unauthorized (no token)
- 401 Unauthorized (invalid token)
- 404 Not Found
- 405 Method Not Allowed
- 422 Validation Error
- Error response format

**Run:**
```bash
cd /home/AIS/decision-pro-admin
./scripts/test-error-handling.sh
```

**Expected Results:**
- ✅ All error responses return expected status codes
- ✅ Error responses include error_code and message
- ✅ Frontend can handle errors gracefully

---

### 4. User Workflows Test

**Script:** `scripts/test-user-workflows.sh`

**Tests:**
- Login flow
- Dashboard view
- Customer management
- Admin operations
- Credit scoring

**Run:**
```bash
cd /home/AIS/decision-pro-admin
./scripts/test-user-workflows.sh
```

**Expected Results:**
- ✅ All workflows complete successfully
- ✅ Data flows correctly between steps
- ✅ No errors in workflow execution

---

## Manual Testing Checklist

### Authentication
- [ ] Login with valid credentials
- [ ] Login with invalid credentials (should fail)
- [ ] Access protected endpoint with valid token
- [ ] Access protected endpoint without token (should return 401)
- [ ] Token refresh works
- [ ] Expired token handling

### Dashboard
- [ ] Dashboard loads analytics data
- [ ] Model performance displays
- [ ] Model comparison works
- [ ] Performance trends display
- [ ] Feature importance shows

### Customer Management
- [ ] Customers list loads
- [ ] Customer search works
- [ ] Customer 360 view displays
- [ ] Customer filtering works
- [ ] Pagination works

### Admin Operations
- [ ] Users list loads
- [ ] User activity log displays
- [ ] Audit logs load
- [ ] Audit log filtering works
- [ ] User role management works

### Credit Scoring
- [ ] Realtime scoring feed displays
- [ ] Credit score submission works
- [ ] Batch processing works
- [ ] Score results display correctly

### Error Handling
- [ ] 401 errors handled gracefully
- [ ] 404 errors handled gracefully
- [ ] 405 errors handled gracefully
- [ ] 422 validation errors show clear messages
- [ ] 500 errors show user-friendly messages

---

## Performance Testing

### Response Time Targets
- Critical endpoints: < 200ms
- Standard endpoints: < 500ms
- Complex queries: < 1000ms

### Test Commands
```bash
# Test single endpoint response time
time curl -X GET "$API_GATEWAY_URL/api/analytics?type=dashboard" \
  -H "Authorization: Bearer $TOKEN"

# Test concurrent requests
for i in {1..10}; do
  curl -X GET "$API_GATEWAY_URL/api/analytics?type=dashboard" \
    -H "Authorization: Bearer $TOKEN" &
done
wait
```

---

## Troubleshooting

### Common Issues

**401 Unauthorized:**
- Check token is being sent in Authorization header
- Verify token hasn't expired
- Check user has required permissions

**404 Not Found:**
- Verify endpoint path is correct
- Check router is registered in main.py
- Verify service is running

**405 Method Not Allowed:**
- Check HTTP method matches endpoint definition
- Verify endpoint supports the requested method

**500 Internal Server Error:**
- Check backend service logs
- Verify database connectivity
- Check service dependencies

---

## Test Results Documentation

After running tests, document results in:
- `docs/TEST_RESULTS.md` (create if needed)
- Include:
  - Test date and time
  - Services versions
  - Test results summary
  - Issues found
  - Performance metrics

---

## Next Steps

1. Run all test scripts
2. Document test results
3. Fix any issues found
4. Re-run tests to verify fixes
5. Proceed to production deployment

---

**Status:** ✅ Test scripts ready  
**Next:** Execute tests when services are running

